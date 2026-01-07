import Fastify from "fastify";
import cors from "@fastify/cors";
import { generateKLine, paipan, parseBirthInput } from "@life-coordinates/core";
import { z } from "zod";
import path from "node:path";
import { fileURLToPath } from "node:url";
import fs from "node:fs/promises";
import crypto from "node:crypto";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const server = Fastify({
  logger: true
});

await server.register(cors, {
  origin: true
});

const dataDir = path.join(__dirname, "..", "data");
const shareFile = path.join(dataDir, "shares.json");

async function readShares(): Promise<Record<string, { createdAt: string; payload: unknown }>> {
  try {
    const raw = await fs.readFile(shareFile, "utf-8");
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object") return parsed;
    return {};
  } catch (e: any) {
    if (e?.code === "ENOENT") return {};
    throw e;
  }
}

async function writeShares(data: Record<string, { createdAt: string; payload: unknown }>) {
  await fs.mkdir(dataDir, { recursive: true });
  const tmp = `${shareFile}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(data), "utf-8");
  await fs.rename(tmp, shareFile);
}

function stableShareId(payload: unknown) {
  const json = JSON.stringify(payload);
  return crypto.createHash("sha256").update(json).digest("hex").slice(0, 10);
}

const geoCache = new Map<string, { at: number; value: unknown }>();
function cacheGet<T>(key: string, maxAgeMs: number): T | null {
  const hit = geoCache.get(key);
  if (!hit) return null;
  if (Date.now() - hit.at > maxAgeMs) return null;
  return hit.value as T;
}
function cacheSet(key: string, value: unknown) {
  geoCache.set(key, { at: Date.now(), value });
}

type GeoCandidate = {
  displayName: string;
  longitude: number;
  latitude: number;
  name: string;
};

function pickCandidateName(row: any): string {
  const addr = row?.address ?? {};
  const city = addr.city ?? addr.town ?? addr.village;
  const county = addr.county;
  const state = addr.state;
  if (typeof city === "string" && city.trim()) return city.trim();
  if (typeof county === "string" && county.trim()) return county.trim();
  if (typeof state === "string" && state.trim()) return state.trim();
  const dn = String(row?.display_name ?? "").trim();
  return dn ? dn.split(",")[0]?.trim() || dn : "";
}

async function nominatimSearch(q: string, limit: number): Promise<GeoCandidate[]> {
  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("format", "json");
  url.searchParams.set("limit", String(limit));
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("accept-language", "zh-CN");
  url.searchParams.set("q", q);

  const res = await fetch(url.toString(), {
    headers: {
      "user-agent": "life-coordinates/1.0"
    }
  });
  if (!res.ok) throw new Error(`NOMINATIM_HTTP_${res.status}`);
  const arr = (await res.json()) as any[];
  return (arr || [])
    .map((row) => {
      const longitude = Number(row?.lon);
      const latitude = Number(row?.lat);
      return {
        displayName: String(row?.display_name ?? ""),
        longitude,
        latitude,
        name: pickCandidateName(row)
      } satisfies GeoCandidate;
    })
    .filter((c) => c.displayName && Number.isFinite(c.longitude) && Number.isFinite(c.latitude) && c.name);
}

server.get("/api/health", async () => {
  return { ok: true };
});

server.post("/api/paipan", async (req, reply) => {
  try {
    const input = parseBirthInput(req.body);
    const result = paipan(input);
    return { paipan: result };
  } catch (e: any) {
    req.log.warn({ err: e }, "paipan_failed");
    return reply.status(400).send({ error: "INVALID_INPUT", message: e?.message ?? String(e) });
  }
});

server.post("/api/compute", async (req, reply) => {
  try {
    const input = parseBirthInput(req.body);
    const p = paipan(input);
    const k = generateKLine(p);
    return { paipan: p, kline: k };
  } catch (e: any) {
    req.log.warn({ err: e }, "compute_failed");
    return reply.status(400).send({ error: "INVALID_INPUT", message: e?.message ?? String(e) });
  }
});

server.post("/api/share", async (req, reply) => {
  const schema = z.object({
    paipan: z.any(),
    kline: z.any()
  });
  try {
    const body = schema.parse(req.body);
    const id = stableShareId(body);
    const createdAt = new Date().toISOString();
    const shares = await readShares();
    shares[id] = { createdAt, payload: body };
    await writeShares(shares);
    return { id };
  } catch (e: any) {
    req.log.warn({ err: e }, "share_failed");
    return reply.status(400).send({ error: "INVALID_PAYLOAD", message: e?.message ?? String(e) });
  }
});

server.get("/api/geo/suggest", async (req, reply) => {
  const schema = z.object({
    province: z.string().trim().min(1),
    city: z.string().trim().min(1)
  });
  try {
    const { province, city } = schema.parse(req.query);
    const key = `suggest:${province}:${city}`;
    const cached = cacheGet<GeoCandidate[]>(key, 60_000);
    if (cached) return { candidates: cached.slice(0, 8).map((c) => ({ name: c.name, displayName: c.displayName })) };

    const q = `${city} ${province} 中国`;
    const candidates = await nominatimSearch(q, 8);
    cacheSet(key, candidates);
    return { candidates: candidates.map((c) => ({ name: c.name, displayName: c.displayName })) };
  } catch (e: any) {
    req.log.warn({ err: e }, "geo_suggest_failed");
    return reply.status(400).send({ error: "INVALID_REQUEST", message: e?.message ?? String(e) });
  }
});

server.get("/api/geo/geocode", async (req, reply) => {
  const schema = z.object({
    province: z.string().trim().min(1),
    city: z.string().trim().min(1)
  });
  try {
    const { province, city } = schema.parse(req.query);
    const key = `geocode:${province}:${city}`;
    const cached = cacheGet<GeoCandidate | null>(key, 7 * 24 * 60_000);
    if (cached) return { candidate: cached };

    const q = `${city} ${province} 中国`;
    const candidates = await nominatimSearch(q, 5);
    const best = candidates[0] ?? null;
    cacheSet(key, best);
    return { candidate: best };
  } catch (e: any) {
    req.log.warn({ err: e }, "geo_geocode_failed");
    return reply.status(400).send({ error: "INVALID_REQUEST", message: e?.message ?? String(e) });
  }
});

server.get("/api/share/:id", async (req, reply) => {
  const paramsSchema = z.object({ id: z.string().min(1) });
  try {
    const { id } = paramsSchema.parse(req.params);
    const shares = await readShares();
    const row = shares[id];
    if (!row) return reply.status(404).send({ error: "NOT_FOUND" });
    return row.payload;
  } catch (e: any) {
    req.log.warn({ err: e }, "share_get_failed");
    return reply.status(400).send({ error: "INVALID_REQUEST", message: e?.message ?? String(e) });
  }
});

const port = Number(process.env.PORT ?? 8787);
const host = process.env.HOST ?? "0.0.0.0";

await server.listen({ port, host });
