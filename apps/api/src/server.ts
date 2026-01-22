import dotenv from "dotenv";
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
const envPath = path.join(__dirname, "..", "..", "..", ".env");
dotenv.config({ override: true, path: envPath });

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
  longitude?: number;
  latitude?: number;
  name: string;
  province?: string;
  city?: string;
  district?: string;
};

type RegionItem = {
  name: string;
  province?: string;
  city?: string;
  district?: string;
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

function pickAdminParts(row: any): { province?: string; city?: string; district?: string } {
  const addr = row?.address ?? {};
  const province = typeof addr.state === "string" ? addr.state.trim() : "";
  const cityRaw =
    (typeof addr.city === "string" && addr.city.trim()) ||
    (typeof addr.town === "string" && addr.town.trim()) ||
    (typeof addr.village === "string" && addr.village.trim()) ||
    (typeof addr.municipality === "string" && addr.municipality.trim()) ||
    "";
  const districtRaw =
    (typeof addr.city_district === "string" && addr.city_district.trim()) ||
    (typeof addr.suburb === "string" && addr.suburb.trim()) ||
    (typeof addr.county === "string" && addr.county.trim()) ||
    "";

  const city = typeof cityRaw === "string" ? cityRaw : "";
  const district = city ? (typeof districtRaw === "string" ? districtRaw : "") : "";
  return {
    province: province || undefined,
    city: city || undefined,
    district: district || undefined
  };
}

async function nominatimSearch(q: string, limit: number): Promise<GeoCandidate[]> {
  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("format", "json");
  url.searchParams.set("limit", String(limit));
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("accept-language", "zh-CN");
  url.searchParams.set("q", q);

  const email = (process.env.NOMINATIM_EMAIL ?? "").trim();
  if (email) url.searchParams.set("email", email);

  const res = await fetchWithTimeout(url.toString(), {
    headers: {
      "user-agent": (process.env.NOMINATIM_UA ?? "life-coordinates/1.0").trim() || "life-coordinates/1.0"
    }
  });
  if (!res.ok) throw new Error(`NOMINATIM_HTTP_${res.status}`);
  const arr = (await res.json()) as any[];
  return (arr || [])
    .map((row) => {
      const longitude = Number(row?.lon);
      const latitude = Number(row?.lat);
      const parts = pickAdminParts(row);
      return {
        displayName: String(row?.display_name ?? ""),
        longitude,
        latitude,
        name: pickCandidateName(row),
        ...parts
      } satisfies GeoCandidate;
    })
    .filter((c) => c.displayName && Number.isFinite(c.longitude) && Number.isFinite(c.latitude) && c.name);
}

type GeoProvider = "nominatim" | "amap";

async function fetchWithTimeout(url: string, init: RequestInit & { timeoutMs?: number }): Promise<Response> {
  const { timeoutMs: timeoutMsOverride, ...rest } = init;
  const timeoutMs = timeoutMsOverride ?? 12_000;
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    return await fetch(url, { ...rest, signal: ctrl.signal });
  } finally {
    clearTimeout(t);
  }
}

function buildAmapUrl(base: string, params: Record<string, string>, includeSig: boolean): string {
  const cleaned: Record<string, string> = {};
  for (const [k, v] of Object.entries(params)) {
    const vv = String(v ?? "");
    if (vv !== "") cleaned[k] = vv;
  }

  const keys = Object.keys(cleaned).sort((a, b) => a.localeCompare(b));
  const qs = new URLSearchParams();
  for (const k of keys) qs.append(k, cleaned[k]);
  const query = qs.toString();
  const sigKey = (process.env.AMAP_SIGKEY ?? "").trim();
  const sig = includeSig && sigKey
    ? crypto.createHash("md5").update(`${query}${sigKey}`, "utf8").digest("hex")
    : "";

  const url = new URL(base);
  for (const k of keys) url.searchParams.set(k, cleaned[k]);
  if (sig) url.searchParams.set("sig", sig);
  return url.toString();
}

function geoProviderChain(): GeoProvider[] {
  const forced = (process.env.GEO_PROVIDER ?? "").trim().toLowerCase();
  if (forced === "amap") return ["amap"];
  if (forced === "nominatim") return ["nominatim"];
  const chain: GeoProvider[] = [];
  if ((process.env.AMAP_KEY ?? "").trim()) chain.push("amap");
  chain.push("nominatim");
  return chain;
}

function normalizeCityValue(v: unknown): string {
  if (Array.isArray(v)) {
    const first = v.find((x) => typeof x === "string" && x.trim());
    return typeof first === "string" ? first.trim() : "";
  }
  return typeof v === "string" ? v.trim() : "";
}

async function amapGeocode(address: string, limit: number): Promise<GeoCandidate[]> {
  const key = (process.env.AMAP_KEY ?? "").trim();
  if (!key) throw new Error("AMAP_KEY_MISSING");

  const urlWithSig = buildAmapUrl("https://restapi.amap.com/v3/geocode/geo", {
    key,
    address,
    output: "JSON"
  }, true);

  let res = await fetchWithTimeout(urlWithSig, { timeoutMs: 10_000 });
  if (!res.ok) throw new Error(`AMAP_HTTP_${res.status}`);
  let json = (await res.json()) as any;
  if (String(json?.status) !== "1") {
    if (String(json?.infocode) === "10009") {
      const urlNoSig = buildAmapUrl("https://restapi.amap.com/v3/geocode/geo", {
        key,
        address,
        output: "JSON"
      }, false);
      res = await fetchWithTimeout(urlNoSig, { timeoutMs: 10_000 });
      if (!res.ok) throw new Error(`AMAP_HTTP_${res.status}`);
      json = (await res.json()) as any;
    }
  }
  if (String(json?.status) !== "1") throw new Error(`AMAP_ERR_${String(json?.infocode ?? "UNKNOWN")}`);
  const geocodes = Array.isArray(json?.geocodes) ? json.geocodes : [];

  const out: GeoCandidate[] = [];
  for (const row of geocodes) {
    const loc = String(row?.location ?? "");
    const [lonStr, latStr] = loc.split(",");
    const longitude = Number(lonStr);
    const latitude = Number(latStr);
    if (!Number.isFinite(longitude) || !Number.isFinite(latitude)) continue;

    const province = typeof row?.province === "string" ? row.province.trim() : "";
    const city = normalizeCityValue(row?.city) || province;
    const district = typeof row?.district === "string" ? row.district.trim() : "";
    const displayName =
      typeof row?.formatted_address === "string" && row.formatted_address.trim()
        ? row.formatted_address.trim()
        : [district, city, province].filter(Boolean).join(" ");

    out.push({
      displayName,
      longitude,
      latitude,
      name: city || district || province,
      province: province || undefined,
      city: city || undefined,
      district: district || undefined
    });

    if (out.length >= limit) break;
  }
  return out;
}

async function amapSuggest(q: string, limit: number): Promise<GeoCandidate[]> {
  const key = (process.env.AMAP_KEY ?? "").trim();
  if (!key) throw new Error("AMAP_KEY_MISSING");

  const tipsUrlWithSig = buildAmapUrl("https://restapi.amap.com/v3/assistant/inputtips", {
    key,
    keywords: q,
    datatype: "all",
    output: "JSON"
  }, true);

  let tipsRes = await fetchWithTimeout(tipsUrlWithSig, { timeoutMs: 10_000 });
  if (!tipsRes.ok) throw new Error(`AMAP_TIPS_HTTP_${tipsRes.status}`);
  let tipsJson = (await tipsRes.json()) as any;
  if (String(tipsJson?.status) !== "1") {
    if (String(tipsJson?.infocode) === "10009") {
      const tipsUrlNoSig = buildAmapUrl("https://restapi.amap.com/v3/assistant/inputtips", {
        key,
        keywords: q,
        datatype: "all",
        output: "JSON"
      }, false);
      tipsRes = await fetchWithTimeout(tipsUrlNoSig, { timeoutMs: 10_000 });
      if (!tipsRes.ok) throw new Error(`AMAP_TIPS_HTTP_${tipsRes.status}`);
      tipsJson = (await tipsRes.json()) as any;
    }
  }
  if (String(tipsJson?.status) !== "1") throw new Error(`AMAP_TIPS_ERR_${String(tipsJson?.infocode ?? "UNKNOWN")}`);
  const tips = Array.isArray(tipsJson?.tips) ? tipsJson.tips : [];

  const queries: string[] = [];
  for (const t of tips) {
    const name = typeof t?.name === "string" ? t.name.trim() : "";
    const district = typeof t?.district === "string" ? t.district.trim() : "";
    if (!name) continue;
    const full = `${district}${name}`.trim();
    if (!full) continue;
    if (!queries.includes(full)) queries.push(full);
    if (queries.length >= Math.min(limit, 8)) break;
  }

  const geocoded = await Promise.all(
    queries.map(async (qq) => {
      try {
        const list = await amapGeocode(qq, 1);
        return list[0] ?? null;
      } catch {
        return null;
      }
    })
  );

  return geocoded.filter((x): x is GeoCandidate => Boolean(x)).slice(0, limit);
}

async function amapDistrictChildren(keyword: string): Promise<string[]> {
  const key = (process.env.AMAP_KEY ?? "").trim();
  if (!key) throw new Error("AMAP_KEY_MISSING");

  const urlWithSig = buildAmapUrl(
    "https://restapi.amap.com/v3/config/district",
    {
      key,
      keywords: keyword,
      subdistrict: "1",
      extensions: "base",
      output: "JSON"
    },
    true
  );

  let res = await fetchWithTimeout(urlWithSig, { timeoutMs: 10_000 });
  if (!res.ok) throw new Error(`AMAP_DISTRICT_HTTP_${res.status}`);
  let json = (await res.json()) as any;
  if (String(json?.status) !== "1") {
    if (String(json?.infocode) === "10009") {
      const urlNoSig = buildAmapUrl(
        "https://restapi.amap.com/v3/config/district",
        {
          key,
          keywords: keyword,
          subdistrict: "1",
          extensions: "base",
          output: "JSON"
        },
        false
      );
      res = await fetchWithTimeout(urlNoSig, { timeoutMs: 10_000 });
      if (!res.ok) throw new Error(`AMAP_DISTRICT_HTTP_${res.status}`);
      json = (await res.json()) as any;
    }
  }
  if (String(json?.status) !== "1") throw new Error(`AMAP_DISTRICT_ERR_${String(json?.infocode ?? "UNKNOWN")}`);
  const districts = Array.isArray(json?.districts) ? json.districts : [];
  const first = districts[0] ?? null;
  const children = Array.isArray(first?.districts) ? first.districts : [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const row of children) {
    const name = typeof row?.name === "string" ? row.name.trim() : "";
    if (!name || seen.has(name)) continue;
    seen.add(name);
    out.push(name);
  }
  return out;
}

async function amapDistrictSearch(keyword: string, limit: number): Promise<GeoCandidate[]> {
  const key = (process.env.AMAP_KEY ?? "").trim();
  if (!key) throw new Error("AMAP_KEY_MISSING");

  const urlWithSig = buildAmapUrl(
    "https://restapi.amap.com/v3/config/district",
    {
      key,
      keywords: keyword,
      subdistrict: "3", // 返回下三级行政区（确保能获取到区县级别）
      extensions: "base",
      output: "JSON"
    },
    true
  );

  let res = await fetchWithTimeout(urlWithSig, { timeoutMs: 10_000 });
  if (!res.ok) throw new Error(`AMAP_DISTRICT_SEARCH_HTTP_${res.status}`);
  let json = (await res.json()) as any;
  if (String(json?.status) !== "1") {
    if (String(json?.infocode) === "10009") {
      const urlNoSig = buildAmapUrl(
        "https://restapi.amap.com/v3/config/district",
        {
          key,
          keywords: keyword,
          subdistrict: "3",
          extensions: "base",
          output: "JSON"
        },
        false
      );
      res = await fetchWithTimeout(urlNoSig, { timeoutMs: 10_000 });
      if (!res.ok) throw new Error(`AMAP_DISTRICT_SEARCH_HTTP_${res.status}`);
      json = (await res.json()) as any;
    }
  }
  if (String(json?.status) !== "1") throw new Error(`AMAP_DISTRICT_SEARCH_ERR_${String(json?.infocode ?? "UNKNOWN")}`);
  
  const districts = Array.isArray(json?.districts) ? json.districts : [];
  const candidates: GeoCandidate[] = [];
  const seen = new Set<string>();
  const keywordLower = keyword.toLowerCase();

  // 缓存：存储adcode到省份/城市的映射
  const adcodeCache = new Map<string, { province?: string; city?: string }>();
  
  // 通过adcode查询省份和城市（使用缓存）
  // 注意：adcode格式：前2位是省份，前4位是城市，例如：440111 = 44(广东省) + 01(广州市) + 11(白云区)
  async function getProvinceAndCityByAdcode(adcode: string): Promise<{ province?: string; city?: string }> {
    if (adcodeCache.has(adcode)) {
      return adcodeCache.get(adcode)!;
    }
    
    if (!adcode || adcode.length < 6) {
      adcodeCache.set(adcode, {});
      return {};
    }
    
    try {
      // 从adcode解析省份和城市代码
      const provinceCode = adcode.substring(0, 2);
      const cityCode = adcode.substring(0, 4);
      
      // 先查询省份（使用省份代码）
      const provinceUrl = buildAmapUrl(
        "https://restapi.amap.com/v3/config/district",
        {
          key,
          keywords: provinceCode,
          subdistrict: "2", // 获取省份下的城市
          extensions: "base",
          output: "JSON"
        },
        true
      );
      
      const provinceRes = await fetchWithTimeout(provinceUrl, { timeoutMs: 5_000 });
      if (!provinceRes.ok) {
        adcodeCache.set(adcode, {});
        return {};
      }
      
      const provinceJson = (await provinceRes.json()) as any;
      if (String(provinceJson?.status) !== "1") {
        adcodeCache.set(adcode, {});
        return {};
      }
      
      const provinceDistricts = Array.isArray(provinceJson?.districts) ? provinceJson.districts : [];
      let province: string | undefined;
      let city: string | undefined;
      
      // 查找省份
      for (const d of provinceDistricts) {
        const level = String(d?.level || "").trim();
        const name = String(d?.name || "").trim();
        const ad = String(d?.adcode || "").trim();
        
        if (level === "province" && ad.startsWith(provinceCode)) {
          province = name;
          
          // 在省份下查找城市
          const cities = Array.isArray(d?.districts) ? d.districts : [];
          for (const c of cities) {
            const cityAd = String(c?.adcode || "").trim();
            if (cityAd.startsWith(cityCode)) {
              city = String(c?.name || "").trim();
              break;
            }
          }
          break;
        }
      }
      
      const result = { province, city };
      adcodeCache.set(adcode, result);
      return result;
    } catch {
      adcodeCache.set(adcode, {});
      return {};
    }
  }
  
  // 递归提取所有匹配的行政区划
  async function extractDistricts(districtList: any[], parentProvince?: string, parentCity?: string) {
    for (const d of districtList) {
      const name = typeof d?.name === "string" ? d.name.trim() : "";
      if (!name) continue;
      
      const level = typeof d?.level === "string" ? d.level : "";
      const children = Array.isArray(d?.districts) ? d.districts : [];
      const adcode = String(d?.adcode || "").trim();
      
      // 确定当前层级的省份、城市、区县
      let province = parentProvince;
      let city = parentCity;
      let district: string | undefined;
      
      if (level === "province") {
        province = name;
      } else if (level === "city") {
        city = name;
        province = parentProvince || province;
      } else if (level === "district") {
        district = name;
        // 区县级别：如果没有父级信息，通过adcode查询
        if (!province || !city) {
          const fullInfo = await getProvinceAndCityByAdcode(adcode);
          province = province || fullInfo.province;
          city = city || fullInfo.city;
        } else {
          province = parentProvince || province;
          city = parentCity || city;
        }
      }
      
      // 检查当前名称是否匹配搜索词
      const nameMatches = name.toLowerCase().includes(keywordLower) || keywordLower.includes(name.toLowerCase());
      
      // 如果是区县级别且名称匹配，添加到结果中
      if (level === "district" && nameMatches) {
        // 区县级别：需要完整的省份-城市-区县路径
        if (province && city) {
          const displayName = `${province} - ${city} - ${district}`;
          const key = `${province}-${city}-${district}`;
          
          if (!seen.has(key) && candidates.length < limit) {
            seen.add(key);
            candidates.push({
              displayName,
              name: district || name,
              province: province,
              city: city,
              district: district
            });
          }
        }
      } else if (nameMatches && (level === "province" || level === "city")) {
        // 省份或城市级别匹配：添加到结果中
        const parts: string[] = [];
        if (province) parts.push(province);
        if (city) parts.push(city);
        if (district) parts.push(district);
        if (parts.length === 0) parts.push(name);
        const displayName = parts.join(" - ");
        const key = `${province || ""}-${city || ""}-${district || ""}`;
        
        if (!seen.has(key) && candidates.length < limit) {
          seen.add(key);
          candidates.push({
            displayName,
            name: district || city || province || name,
            province: province || undefined,
            city: city || undefined,
            district: district || undefined
          });
        }
      }
      
      // 无论当前层级是否匹配，都要递归处理子级行政区
      // 因为子级可能包含匹配的区县
      if (children.length > 0) {
        await extractDistricts(children, province, city);
      }
    }
  }
  
  await extractDistricts(districts);
  return candidates.slice(0, limit);
}

async function amapRegions(level: "province" | "city" | "district", province?: string, city?: string): Promise<RegionItem[]> {
  if (level === "province") {
    const names = await amapDistrictChildren("中国");
    return names.map((name) => ({ name, province: name }));
  }
  if (level === "city") {
    const keyword = String(province ?? "").trim();
    if (!keyword) return [];
    const names = await amapDistrictChildren(keyword);
    return names.map((name) => ({ name, province, city: name }));
  }
  const provinceName = String(province ?? "").trim();
  const cityName = String(city ?? "").trim();
  if (!provinceName || !cityName) return [];
  let names = await amapDistrictChildren(`${cityName} ${provinceName}`.trim());
  if (!names.length) names = await amapDistrictChildren(cityName);
  return names.map((name) => ({ name, province: provinceName, city: cityName, district: name }));
}

async function geoRegions(level: "province" | "city" | "district", province?: string, city?: string): Promise<RegionItem[]> {
  let lastErr: unknown = null;
  for (const p of geoProviderChain()) {
    try {
      if (p === "amap") return await amapRegions(level, province, city);
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr ?? new Error("GEO_UPSTREAM_FAILED");
}

async function geoSuggest(q: string, limit: number): Promise<{ provider: GeoProvider; candidates: GeoCandidate[] }> {
  let lastErr: unknown = null;
  for (const p of geoProviderChain()) {
    try {
      if (p === "amap") {
        // 先尝试使用行政区域查询API（更适合搜索行政区划名称）
        try {
          const districtCandidates = await amapDistrictSearch(q, limit);
          if (districtCandidates.length > 0) {
            // 如果行政区域查询有结果，也尝试POI搜索作为补充
            try {
              const poiCandidates = await amapSuggest(q, limit);
              // 合并结果，去重
              const allCandidates = [...districtCandidates, ...poiCandidates];
              const seen = new Set<string>();
              const unique: GeoCandidate[] = [];
              for (const c of allCandidates) {
                const key = `${c.province || ""}-${c.city || ""}-${c.district || ""}-${c.name}`;
                if (!seen.has(key) && unique.length < limit) {
                  seen.add(key);
                  unique.push(c);
                }
              }
              return { provider: p, candidates: unique };
            } catch {
              // POI搜索失败，只返回行政区域查询结果
              return { provider: p, candidates: districtCandidates };
            }
          }
        } catch {
          // 行政区域查询失败，回退到POI搜索
        }
        // 回退到原来的POI搜索
        const candidates = await amapSuggest(q, limit);
        return { provider: p, candidates };
      } else {
        const candidates = await nominatimSearch(q, limit);
        return { provider: p, candidates };
      }
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr ?? new Error("GEO_UPSTREAM_FAILED");
}

async function geoGeocode(q: string): Promise<{ provider: GeoProvider; candidate: GeoCandidate | null }> {
  let lastErr: unknown = null;
  for (const p of geoProviderChain()) {
    try {
      const list = p === "amap" ? await amapGeocode(q, 1) : await nominatimSearch(q, 1);
      return { provider: p, candidate: list[0] ?? null };
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr ?? new Error("GEO_UPSTREAM_FAILED");
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
  const schema = z
    .object({
      q: z.string().trim().min(1).optional(),
      province: z.string().trim().min(1).optional(),
      city: z.string().trim().min(1).optional()
    })
    .refine((v) => Boolean(v.q) || (Boolean(v.province) && Boolean(v.city)), {
      message: "q or (province, city) required"
    });
  let parsed: { q?: string; province?: string; city?: string };
  try {
    parsed = schema.parse(req.query);
  } catch (e: any) {
    return reply.status(400).send({ error: "INVALID_REQUEST", message: e?.message ?? String(e) });
  }

  const { q, province, city } = parsed;
  const raw = q ? q.trim() : `${city} ${province} 中国`;
  const query = raw.includes("中国") ? raw : `${raw} 中国`;
  const key = `suggest:v3:${query}`;
  const cached = cacheGet<{ provider: GeoProvider; candidates: GeoCandidate[] }>(key, 60_000);
  if (cached) {
    return {
      provider: cached.provider,
      candidates: cached.candidates.slice(0, 8).map((c) => ({
        name: c.name,
        displayName: c.displayName,
        province: c.province,
        city: c.city,
        district: c.district,
        longitude: c.longitude
      }))
    };
  }

  try {
    const { provider: p, candidates } = await geoSuggest(query, 12);
    cacheSet(key, { provider: p, candidates });
    return {
      provider: p,
      candidates: candidates.map((c) => ({
        name: c.name,
        displayName: c.displayName,
        province: c.province,
        city: c.city,
        district: c.district,
        longitude: c.longitude
      }))
    };
  } catch (e: any) {
    req.log.warn({ err: e }, "geo_suggest_failed");
    return reply.status(503).send({ error: "UPSTREAM_UNREACHABLE", message: e?.message ?? String(e) });
  }
});

server.get("/api/geo/geocode", async (req, reply) => {
  const schema = z
    .object({
      q: z.string().trim().min(1).optional(),
      province: z.string().trim().min(1).optional(),
      city: z.string().trim().min(1).optional()
    })
    .refine((v) => Boolean(v.q) || (Boolean(v.province) && Boolean(v.city)), {
      message: "q or (province, city) required"
    });
  let parsed: { q?: string; province?: string; city?: string };
  try {
    parsed = schema.parse(req.query);
  } catch (e: any) {
    return reply.status(400).send({ error: "INVALID_REQUEST", message: e?.message ?? String(e) });
  }

  const { q, province, city } = parsed;
  const raw = q ? q.trim() : `${city} ${province} 中国`;
  const query = raw.includes("中国") ? raw : `${raw} 中国`;
  const key = `geocode:v3:${query}`;
  const cached = cacheGet<{ provider: GeoProvider; candidate: GeoCandidate | null }>(key, 7 * 24 * 60_000);
  if (cached) return { provider: cached.provider, candidate: cached.candidate };

  try {
    const { provider: p, candidate } = await geoGeocode(query);
    cacheSet(key, { provider: p, candidate });
    return { provider: p, candidate };
  } catch (e: any) {
    req.log.warn({ err: e }, "geo_geocode_failed");
    return reply.status(503).send({ error: "UPSTREAM_UNREACHABLE", message: e?.message ?? String(e) });
  }
});

server.get("/api/geo/regions", async (req, reply) => {
  const schema = z
    .object({
      level: z.enum(["province", "city", "district"]),
      province: z.string().trim().min(1).optional(),
      city: z.string().trim().min(1).optional()
    })
    .superRefine((v, ctx) => {
      if (v.level === "city" && !v.province) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "province required" });
      if (v.level === "district" && (!v.province || !v.city)) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "province and city required" });
    });

  let parsed: { level: "province" | "city" | "district"; province?: string; city?: string };
  try {
    parsed = schema.parse(req.query);
  } catch (e: any) {
    return reply.status(400).send({ error: "INVALID_REQUEST", message: e?.message ?? String(e) });
  }

  const { level, province, city } = parsed;
  const cacheKey = `regions:v1:${level}:${province ?? ""}:${city ?? ""}`;
  const cached = cacheGet<RegionItem[]>(cacheKey, 6 * 60 * 60_000);
  if (cached) return { items: cached };

  try {
    const items = await geoRegions(level, province, city);
    cacheSet(cacheKey, items);
    return { items };
  } catch (e: any) {
    req.log.warn({ err: e }, "geo_regions_failed");
    return reply.status(503).send({ error: "UPSTREAM_UNREACHABLE", message: e?.message ?? String(e) });
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
