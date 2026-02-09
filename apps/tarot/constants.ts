import { TarotCardData } from './types';

export const CARD_WIDTH = 1.2;
export const CARD_HEIGHT = 2.0;
const CARD_IMAGE_BASE = 'cards/';

export const MAJOR_ARCANA: TarotCardData[] = [
  {
    id: 'ar00',
    name: "The Fool",
    name_short: "ar00",
    meaning_up: "Beginnings, innocence, spontaneity, a free spirit",
    meaning_rev: "Holding back, recklessness, risk-taking",
    desc: "A young man stands on the edge of a cliff, carefree.",
    image_url: `${CARD_IMAGE_BASE}ar00.jpg`
  },
  {
    id: 'ar01',
    name: "The Magician",
    name_short: "ar01",
    meaning_up: "Manifestation, resourcefulness, power, inspired action",
    meaning_rev: "Manipulation, poor planning, untapped talents",
    desc: "A figure pointing to the heavens and earth, connecting both.",
    image_url: `${CARD_IMAGE_BASE}ar01.jpg`
  },
  {
    id: 'ar02',
    name: "The High Priestess",
    name_short: "ar02",
    meaning_up: "Intuition, sacred knowledge, divine feminine, the subconscious mind",
    meaning_rev: "Secrets, disconnected from intuition, withdrawal and silence",
    desc: "She sits between the pillars of Solomon's Temple.",
    image_url: `${CARD_IMAGE_BASE}ar02.jpg`
  },
  {
    id: 'ar03',
    name: "The Empress",
    name_short: "ar03",
    meaning_up: "Femininity, beauty, nature, nurturing, abundance",
    meaning_rev: "Creative block, dependence on others",
    desc: "A beautiful woman sits on a throne amidst nature.",
    image_url: `${CARD_IMAGE_BASE}ar03.jpg`
  },
  {
    id: 'ar04',
    name: "The Emperor",
    name_short: "ar04",
    meaning_up: "Authority, establishment, structure, a father figure",
    meaning_rev: "Domination, excessive control, lack of discipline",
    desc: "A stoic ruler sits on a stone throne.",
    image_url: `${CARD_IMAGE_BASE}ar04.jpg`
  },
  {
    id: 'ar05',
    name: "The Hierophant",
    name_short: "ar05",
    meaning_up: "Spiritual wisdom, religious beliefs, conformity, tradition",
    meaning_rev: "Personal beliefs, freedom, challenging the status quo",
    desc: "A religious figure sits between two pillars.",
    image_url: `${CARD_IMAGE_BASE}ar05.jpg`
  },
  {
    id: 'ar06',
    name: "The Lovers",
    name_short: "ar06",
    meaning_up: "Love, harmony, relationships, values alignment, choices",
    meaning_rev: "Self-love, disharmony, imbalance, misalignment of values",
    desc: "A naked man and woman stand beneath an angel.",
    image_url: `${CARD_IMAGE_BASE}ar06.jpg`
  },
  {
    id: 'ar07',
    name: "The Chariot",
    name_short: "ar07",
    meaning_up: "Control, willpower, success, action, determination",
    meaning_rev: "Self-discipline, opposition, lack of direction",
    desc: "A warrior stands inside a chariot driven by two sphinxes.",
    image_url: `${CARD_IMAGE_BASE}ar07.jpg`
  },
  {
    id: 'ar08',
    name: "Strength",
    name_short: "ar08",
    meaning_up: "Strength, courage, persuasion, influence, compassion",
    meaning_rev: "Inner strength, self-doubt, low energy, raw emotion",
    desc: "A woman gently tames a lion.",
    image_url: `${CARD_IMAGE_BASE}ar08.jpg`
  },
  {
    id: 'ar09',
    name: "The Hermit",
    name_short: "ar09",
    meaning_up: "Soul-searching, introspection, being alone, inner guidance",
    meaning_rev: "Isolation, loneliness, withdrawal",
    desc: "An old man stands alone with a lantern.",
    image_url: `${CARD_IMAGE_BASE}ar09.jpg`
  },
  {
    id: 'ar10',
    name: "Wheel of Fortune",
    name_short: "ar10",
    meaning_up: "Good luck, karma, life cycles, destiny, a turning point",
    meaning_rev: "Bad luck, resistance to change, breaking cycles",
    desc: "A giant wheel with various creatures around it.",
    image_url: `${CARD_IMAGE_BASE}ar10.jpg`
  },
  {
    id: 'ar11',
    name: "Justice",
    name_short: "ar11",
    meaning_up: "Justice, fairness, truth, cause and effect",
    meaning_rev: "Unfairness, dishonesty, lack of accountability",
    desc: "A figure holds a sword and scales, weighing truth.",
    image_url: `${CARD_IMAGE_BASE}ar11.jpg`
  },
  {
    id: 'ar12',
    name: "The Hanged Man",
    name_short: "ar12",
    meaning_up: "Pause, surrender, letting go, new perspective",
    meaning_rev: "Delays, resistance, stalling, indecision",
    desc: "A man hangs upside down, calm and reflective.",
    image_url: `${CARD_IMAGE_BASE}ar12.jpg`
  },
  {
    id: 'ar13',
    name: "Death",
    name_short: "ar13",
    meaning_up: "Endings, change, transformation, transition",
    meaning_rev: "Resistance to change, personal transformation, purging",
    desc: "A skeleton in armor rides a white horse.",
    image_url: `${CARD_IMAGE_BASE}ar13.jpg`
  },
  {
    id: 'ar14',
    name: "Temperance",
    name_short: "ar14",
    meaning_up: "Balance, moderation, patience, purpose",
    meaning_rev: "Imbalance, excess, lack of harmony",
    desc: "An angel blends water between two cups.",
    image_url: `${CARD_IMAGE_BASE}ar14.jpg`
  },
  {
    id: 'ar15',
    name: "The Devil",
    name_short: "ar15",
    meaning_up: "Shadow self, attachment, temptation, addiction",
    meaning_rev: "Releasing limiting beliefs, detachment, freedom",
    desc: "A horned figure presides over chained humans.",
    image_url: `${CARD_IMAGE_BASE}ar15.jpg`
  },
  {
    id: 'ar16',
    name: "The Tower",
    name_short: "ar16",
    meaning_up: "Sudden change, upheaval, chaos, revelation",
    meaning_rev: "Avoidance of disaster, fear of change, delays",
    desc: "Lightning strikes a tower, shaking its foundations.",
    image_url: `${CARD_IMAGE_BASE}ar16.jpg`
  },
  {
    id: 'ar17',
    name: "The Star",
    name_short: "ar17",
    meaning_up: "Hope, faith, purpose, renewal, spirituality",
    meaning_rev: "Lack of faith, despair, self-trust, disconnection",
    desc: "A woman pours water into a pool and onto the land.",
    image_url: `${CARD_IMAGE_BASE}ar17.jpg`
  },
  {
    id: 'ar18',
    name: "The Moon",
    name_short: "ar18",
    meaning_up: "Illusion, fear, anxiety, subconscious, intuition",
    meaning_rev: "Release of fear, repressed emotion, inner confusion",
    desc: "A moon with a face shines down on a wolf and dog.",
    image_url: `${CARD_IMAGE_BASE}ar18.jpg`
  },
  {
    id: 'ar19',
    name: "The Sun",
    name_short: "ar19",
    meaning_up: "Positivity, fun, warmth, success, vitality",
    meaning_rev: "Inner child, feeling down, overly optimistic",
    desc: "A bright sun shines on a child riding a white horse.",
    image_url: `${CARD_IMAGE_BASE}ar19.jpg`
  },
  {
    id: 'ar20',
    name: "Judgement",
    name_short: "ar20",
    meaning_up: "Reflection, reckoning, awakening, rebirth",
    meaning_rev: "Self-doubt, inner critic, ignoring the call",
    desc: "An angel calls figures to rise and awaken.",
    image_url: `${CARD_IMAGE_BASE}ar20.jpg`
  },
  {
    id: 'ar21',
    name: "The World",
    name_short: "ar21",
    meaning_up: "Completion, integration, accomplishment, travel",
    meaning_rev: "Seeking personal closure, short-cuts, delays",
    desc: "A figure dances inside a laurel wreath.",
    image_url: `${CARD_IMAGE_BASE}ar21.jpg`
  }
];
