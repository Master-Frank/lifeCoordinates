import { TarotCardData } from './types';

export const CARD_WIDTH = 1.2;
export const CARD_HEIGHT = 2.0;

// Major Arcana Data (Subset for demo to ensure it fits, but fully functional)
export const MAJOR_ARCANA: TarotCardData[] = [
  {
    id: 'ar00',
    name: "The Fool",
    name_short: "ar00",
    meaning_up: "Beginnings, innocence, spontaneity, a free spirit",
    meaning_rev: "Holding back, recklessness, risk-taking",
    desc: "A young man stands on the edge of a cliff, carefree.",
    image_url: "https://upload.wikimedia.org/wikipedia/commons/9/90/RWS_Tarot_00_Fool.jpg"
  },
  {
    id: 'ar01',
    name: "The Magician",
    name_short: "ar01",
    meaning_up: "Manifestation, resourcefulness, power, inspired action",
    meaning_rev: "Manipulation, poor planning, untapped talents",
    desc: "A figure pointing to the heavens and earth, connecting both.",
    image_url: "https://upload.wikimedia.org/wikipedia/commons/d/de/RWS_Tarot_01_Magician.jpg"
  },
  {
    id: 'ar02',
    name: "The High Priestess",
    name_short: "ar02",
    meaning_up: "Intuition, sacred knowledge, divine feminine, the subconscious mind",
    meaning_rev: "Secrets, disconnected from intuition, withdrawal and silence",
    desc: "She sits between the pillars of Solomon's Temple.",
    image_url: "https://upload.wikimedia.org/wikipedia/commons/8/88/RWS_Tarot_02_High_Priestess.jpg"
  },
  {
    id: 'ar03',
    name: "The Empress",
    name_short: "ar03",
    meaning_up: "Femininity, beauty, nature, nurturing, abundance",
    meaning_rev: "Creative block, dependence on others",
    desc: "A beautiful woman sits on a throne amidst nature.",
    image_url: "https://upload.wikimedia.org/wikipedia/commons/d/d2/RWS_Tarot_03_Empress.jpg"
  },
  {
    id: 'ar04',
    name: "The Emperor",
    name_short: "ar04",
    meaning_up: "Authority, establishment, structure, a father figure",
    meaning_rev: "Domination, excessive control, lack of discipline",
    desc: "A stoic ruler sits on a stone throne.",
    image_url: "https://upload.wikimedia.org/wikipedia/commons/c/c3/RWS_Tarot_04_Emperor.jpg"
  },
  {
    id: 'ar05',
    name: "The Hierophant",
    name_short: "ar05",
    meaning_up: "Spiritual wisdom, religious beliefs, conformity, tradition",
    meaning_rev: "Personal beliefs, freedom, challenging the status quo",
    desc: "A religious figure sits between two pillars.",
    image_url: "https://upload.wikimedia.org/wikipedia/commons/8/8d/RWS_Tarot_05_Hierophant.jpg"
  },
  {
    id: 'ar06',
    name: "The Lovers",
    name_short: "ar06",
    meaning_up: "Love, harmony, relationships, values alignment, choices",
    meaning_rev: "Self-love, disharmony, imbalance, misalignment of values",
    desc: "A naked man and woman stand beneath an angel.",
    image_url: "https://upload.wikimedia.org/wikipedia/commons/d/db/RWS_Tarot_06_The_Lovers.jpg"
  },
  {
    id: 'ar07',
    name: "The Chariot",
    name_short: "ar07",
    meaning_up: "Control, willpower, success, action, determination",
    meaning_rev: "Self-discipline, opposition, lack of direction",
    desc: "A warrior stands inside a chariot driven by two sphinxes.",
    image_url: "https://upload.wikimedia.org/wikipedia/commons/9/9b/RWS_Tarot_07_Chariot.jpg"
  },
  {
    id: 'ar08',
    name: "Strength",
    name_short: "ar08",
    meaning_up: "Strength, courage, persuasion, influence, compassion",
    meaning_rev: "Inner strength, self-doubt, low energy, raw emotion",
    desc: "A woman gently tames a lion.",
    image_url: "https://upload.wikimedia.org/wikipedia/commons/f/f5/RWS_Tarot_08_Strength.jpg"
  },
  {
    id: 'ar09',
    name: "The Hermit",
    name_short: "ar09",
    meaning_up: "Soul-searching, introspection, being alone, inner guidance",
    meaning_rev: "Isolation, loneliness, withdrawal",
    desc: "An old man stands alone with a lantern.",
    image_url: "https://upload.wikimedia.org/wikipedia/commons/4/4d/RWS_Tarot_09_Hermit.jpg"
  },
  {
    id: 'ar10',
    name: "Wheel of Fortune",
    name_short: "ar10",
    meaning_up: "Good luck, karma, life cycles, destiny, a turning point",
    meaning_rev: "Bad luck, resistance to change, breaking cycles",
    desc: "A giant wheel with various creatures around it.",
    image_url: "https://upload.wikimedia.org/wikipedia/commons/3/3c/RWS_Tarot_10_Wheel_of_Fortune.jpg"
  },
  {
    id: 'ar13',
    name: "Death",
    name_short: "ar13",
    meaning_up: "Endings, change, transformation, transition",
    meaning_rev: "Resistance to change, personal transformation, purging",
    desc: "A skeleton in armor rides a white horse.",
    image_url: "https://upload.wikimedia.org/wikipedia/commons/d/d7/RWS_Tarot_13_Death.jpg"
  },
  {
    id: 'ar17',
    name: "The Star",
    name_short: "ar17",
    meaning_up: "Hope, faith, purpose, renewal, spirituality",
    meaning_rev: "Lack of faith, despair, self-trust, disconnection",
    desc: "A woman pours water into a pool and onto the land.",
    image_url: "https://upload.wikimedia.org/wikipedia/commons/d/db/RWS_Tarot_17_Star.jpg"
  },
  {
    id: 'ar18',
    name: "The Moon",
    name_short: "ar18",
    meaning_up: "Illusion, fear, anxiety, subconscious, intuition",
    meaning_rev: "Release of fear, repressed emotion, inner confusion",
    desc: "A moon with a face shines down on a wolf and dog.",
    image_url: "https://upload.wikimedia.org/wikipedia/commons/7/7f/RWS_Tarot_18_Moon.jpg"
  },
  {
    id: 'ar19',
    name: "The Sun",
    name_short: "ar19",
    meaning_up: "Positivity, fun, warmth, success, vitality",
    meaning_rev: "Inner child, feeling down, overly optimistic",
    desc: "A bright sun shines on a child riding a white horse.",
    image_url: "https://upload.wikimedia.org/wikipedia/commons/1/17/RWS_Tarot_19_Sun.jpg"
  },
  {
    id: 'ar21',
    name: "The World",
    name_short: "ar21",
    meaning_up: "Completion, integration, accomplishment, travel",
    meaning_rev: "Seeking personal closure, short-cuts, delays",
    desc: "A figure dances inside a laurel wreath.",
    image_url: "https://upload.wikimedia.org/wikipedia/commons/f/ff/RWS_Tarot_21_World.jpg"
  }
];