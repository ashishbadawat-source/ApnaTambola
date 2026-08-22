/**
 * Traditional and fun Tambola (Housie) number nicknames from 1 to 90
 * Complete English & Hindi bilingual dictionaries and speech announcer
 */

export interface TambolaNumberInfo {
  num: number;
  en: string;
  hi: string;
  hindiWord: string;
  callingPhraseEn: string;
  callingPhraseHi: string;
}

export const HINDI_NUMBERS: Record<number, string> = {
  1: 'एक', 2: 'दो', 3: 'तीन', 4: 'चार', 5: 'पांच',
  6: 'छह', 7: 'सात', 8: 'आठ', 9: 'नौ', 10: 'दस',
  11: 'ग्यारह', 12: 'बारह', 13: 'तेरह', 14: 'चौदह', 15: 'पंद्रह',
  16: 'सोलह', 17: 'सत्रह', 18: 'अठारह', 19: 'उन्नीस', 20: 'बीस',
  21: 'इक्कीस', 22: 'बाईस', 23: 'तेईस', 24: 'चौबीस', 25: 'पच्चीस',
  26: 'छब्बीस', 27: 'सत्ताईस', 28: 'अट्ठाईस', 29: 'उनतीस', 30: 'तीस',
  31: 'इकतीस', 32: 'बत्तीस', 33: 'तैंतीस', 34: 'चौंतीस', 35: 'पैंतीस',
  36: 'छत्तीस', 37: 'सैंतीस', 38: 'अड़तीस', 39: 'उनतालीस', 40: 'चालीस',
  41: 'इकतालीस', 42: 'बयालीस', 43: 'तैंतालीस', 44: 'चौवालीस', 45: 'पैंतालीस',
  46: 'छियालीस', 47: 'सैंतालीस', 48: 'अड़तालीस', 49: 'उनचास', 50: 'पचास',
  51: 'इक्यावन', 52: 'बावन', 53: 'तिरेपन', 54: 'चौवन', 55: 'पचपन',
  56: 'छप्पन', 57: 'सत्तावन', 58: 'अट्ठावन', 59: 'उनसठ', 60: 'साठ',
  61: 'इकसठ', 62: 'बासठ', 63: 'तिरेसठ', 64: 'चौंसठ', 65: 'पैंसठ',
  66: 'छियासठ', 67: 'सरसठ', 68: 'अड़सठ', 69: 'उनहत्तर', 70: 'सत्तर',
  71: 'इकहत्तर', 72: 'बहत्तर', 73: 'तिहत्तर', 74: 'चौहत्तर', 75: 'पचहत्तर',
  76: 'छिहत्तर', 77: 'सतहत्तर', 78: 'अठहत्तर', 79: 'उनासी', 80: 'अस्सी',
  81: 'इक्यासी', 82: 'बयासी', 83: 'तिरासी', 84: 'चौरासी', 85: 'पचासी',
  86: 'छियासी', 87: 'सत्तासी', 88: 'अट्ठासी', 89: 'नवासी', 90: 'नब्बे',
};

export const TAMBOLA_NICKNAMES_EN: Record<number, string> = {
  1: "Kelly's Eye",
  2: "One Little Duck",
  3: "Cup of Tea",
  4: "Knock at the Door",
  5: "Man Alive",
  6: "Half a Dozen",
  7: "Lucky Number Seven",
  8: "Garden Gate",
  9: "Doctor's Orders",
  10: "A Big Fat Hen",
  11: "Two Beautiful Legs",
  12: "One Dozen",
  13: "Unlucky for Some",
  14: "Valentine's Day",
  15: "Young and Keen",
  16: "Sweet Sixteen",
  17: "Dancing Queen",
  18: "Now You Can Vote",
  19: "Goodbye Teens",
  20: "One Score",
  21: "Royal Salute - Key of the Door",
  22: "Two Little Ducks",
  23: "Thee and Me",
  24: "Two Dozen",
  25: "Silver Jubilee",
  26: "Pick and Mix",
  27: "Gateway to Heaven",
  28: "Over Weight",
  29: "Rise and Shine",
  30: "Flirty Thirty",
  31: "Get Up and Run",
  32: "Buckle My Shoe",
  33: "All the Threes",
  34: "Ask for More",
  35: "Jump and Jive",
  36: "Three Dozen",
  37: "More than Eleven",
  38: "Christmas Cake",
  39: "Steps in the Dark",
  40: "Naughty Forty",
  41: "Time for Fun",
  42: "Winnie the Pooh",
  43: "Down on Your Knees",
  44: "All the Fours - Droopy Drawers",
  45: "Halfway There",
  46: "Up to Tricks",
  47: "Year of Independence",
  48: "Four Dozen",
  49: "Police Constable (PC)",
  50: "Half a Century - Golden Jubilee",
  51: "Tweak of the Thumb",
  52: "Deck of Cards",
  53: "Here Comes Herbie",
  54: "Clean the Floor",
  55: "All the Fives - Double Nickel",
  56: "Was She Worth It?",
  57: "Heinz Varieties",
  58: "Make Them Wait",
  59: "Brighton Line",
  60: "Five Dozen",
  61: "Baker's Bun",
  62: "Turn the Screw",
  63: "Tickle Me",
  64: "Red Raw",
  65: "Old Age Pension",
  66: "Clickety Click",
  67: "Made in Heaven",
  68: "Saving Grace",
  69: "Either Way Up",
  70: "Lucky Blind 70",
  71: "Bang on the Drum",
  72: "Six Dozen",
  73: "Queen Bee",
  74: "Candy Store",
  75: "Strive and Strive",
  76: "Trombones",
  77: "Two Little Crutches",
  78: "Heaven's Gate",
  79: "One More Time",
  80: "Gandhi's Breakfast",
  81: "Fat Lady with a Stick",
  82: "Straight On Through",
  83: "Time for Tea",
  84: "Seven Dozen",
  85: "Staying Alive",
  86: "Between the Sticks",
  87: "Torquay in Devon",
  88: "Two Fat Ladies",
  89: "Nearly There",
  90: "Top of the House",
};

export const TAMBOLA_NICKNAMES_HI: Record<number, string> = {
  1: "पहला नंबर - एक (Ek)",
  2: "दो बत्तखें - दो (Do)",
  3: "तीन पत्ती - तीन (Teen)",
  4: "चार यार - चार (Chaar)",
  5: "पंजे का दम - पांच (Paanch)",
  6: "आधा दर्जन - छह (Chheh)",
  7: "लकी नंबर सात - सेवन (Saat)",
  8: "ठाठ बाट - आठ (Aath)",
  9: "नवरत्न - नौ (Nau)",
  10: "दस का दम - दस (Dus)",
  11: "दो सुंदर टांगें - ग्यारह (Gyaarah)",
  12: "एक दर्जन - बारह (Baarah)",
  13: "तेरा मेरा - तेरह (Terah)",
  14: "वैलेंटाइन डे - चौदह (Chaudah)",
  15: "पंद्रह अगस्त - पंद्रह (Pandrah)",
  16: "स्वीट सिक्सटीन - सोलह (Solah)",
  17: "खतरा सत्रह - सत्रह (Satrah)",
  18: "वोटिंग की उम्र - अठारह (Athaarah)",
  19: "आखरी टीन - उन्नीस (Unnees)",
  20: "एक बीसी - बीस (Bees)",
  21: "रॉयल सैल्यूट - इक्कीस (Ikkees)",
  22: "दो बत्तखें - बाईस (Baees)",
  23: "तेईस का फेर - तेईस (Taees)",
  24: "दो दर्जन - चौबीस (Chaubees)",
  25: "सिल्वर जुबली - पच्चीस (Pachchees)",
  26: "छब्बीस जनवरी - छब्बीस (Chhabbees)",
  27: "सत्ताईस का सितारा - सत्ताईस (Sattaees)",
  28: "अट्ठाईस का फेरा - अट्ठाईस (Atthaees)",
  29: "उनतीस का उछाल - उनतीस (Untees)",
  30: "तीसमार खां - तीस (Tees)",
  31: "इकतीस का दम - इकतीस (Iktees)",
  32: "बत्तीस दांत - बत्तीस (Battees)",
  33: "तैंतीस करोड़ - तैंतीस (Taintees)",
  34: "चौंतीस का चक्कर - चौंतीस (Chauntees)",
  35: "पैंतीस की चाल - पैंतीस (Paintees)",
  36: "तीन दर्जन - छत्तीस (Chhattees)",
  37: "सैंतीस का साथ - सैंतीस (Saintees)",
  38: "अड़तीस का अंदाज - अड़तीस (Adtees)",
  39: "उनतालीस का फेर - उनतालीस (Untaalees)",
  40: "शरारती चालीस - चालीस (Chaalees)",
  41: "इकतालीस का इक्का - इकतालीस (Iktaalees)",
  42: "बयालीस का बल - बयालीस (Bayaalees)",
  43: "तैंतालीस का तीर - तैंतालीस (Taintaalees)",
  44: "चोर चौवालीस - चौवालीस (Chauvaalees)",
  45: "आधा सफर - पैंतालीस (Paintaalees)",
  46: "छियालीस की छलांग - छियालीस (Chhiyaalees)",
  47: "देश की आज़ादी 1947 - सैंतालीस (Saintaalees)",
  48: "चार दर्जन - अड़तालीस (Adtaalees)",
  49: "उनचास की उड़ान - उनचास (Unchaas)",
  50: "गोल्डन जुबली पचास - पचास (Pachaas)",
  51: "शुभ इक्यावन - इक्यावन (Ikyaavan)",
  52: "ताश के बावन पत्ते - बावन (Baavan)",
  53: "तिरेपन का तीर - तिरेपन (Tirepan)",
  54: "चौवन की चमक - चौवन (Chauvan)",
  55: "दोनों पंजे - पचपन (Pachpan)",
  56: "छप्पन भोग - छप्पन (Chhappan)",
  57: "सत्तावन की क्रांति - सत्तावन (Sattaavan)",
  58: "अट्ठावन का अखाड़ा - अट्ठावन (Atthaavan)",
  59: "उनसठ की उड़ान - उनसठ (Unsat)",
  60: "पांच दर्जन - साठ (Saath)",
  61: "इकसठ का इनाम - इकसठ (Iksath)",
  62: "बासठ का बाण - बासठ (Baasath)",
  63: "तिरेसठ का तीर - तिरेसठ (Tiresath)",
  64: "चौंसठ कलाएं - चौंसठ (Chaunsath)",
  65: "पेंशन की उम्र - पैंसठ (Painsath)",
  66: "छियासठ का छक्का - छियासठ (Chhiyaasath)",
  67: "सरसठ का सफर - सरसठ (Sarsath)",
  68: "अड़सठ की शान - अड़सठ (Adsath)",
  69: "उल्टा पुल्टा - उनहत्तर (Unhattar)",
  70: "लकी सत्तर - सत्तर (Sattar)",
  71: "इकहत्तर का इक्का - इकहत्तर (Ikhattar)",
  72: "छह दर्जन - बहत्तर (Bahattar)",
  73: "तिहत्तर का तीर - तिहत्तर (Tihattar)",
  74: "चौहत्तर की चाल - चौहत्तर (Chauhattar)",
  75: "प्लैटिनम जुबली - पचहत्तर (Pachhattar)",
  76: "छिहत्तर की छलांग - छिहत्तर (Chhihattar)",
  77: "दो डंडे - सतहत्तर (Satattar)",
  78: "अठहत्तर का अंदाज - अठहत्तर (Athhattar)",
  79: "उनासी का उछाल - उनासी (Unaasee)",
  80: "गांधीजी का चरखा - अस्सी (Assee)",
  81: "इक्यासी का इनाम - इक्यासी (Ikyaasee)",
  82: "बयासी का बाण - बयासी (Bayaasee)",
  83: "तिरासी का वर्ल्ड कप - तिरासी (Tiraasee)",
  84: "सात दर्जन - चौरासी (Chauraasee)",
  85: "पचासी की पारी - पचासी (Pachaasee)",
  86: "छियासी की छलांग - छियासी (Chhiyaasee)",
  87: "सत्तासी का सितारा - सत्तासी (Sattaasee)",
  88: "दो मोटी औरतें - अठासी (Atthaasee)",
  89: "नवासी का निशाना - नवासी (Navaasee)",
  90: "टॉप ऑफ द हाउस - नब्बे (Nabbi)",
};

// Backward compatible export
export const TAMBOLA_NICKNAMES = TAMBOLA_NICKNAMES_EN;

export type VoiceLanguage = 'en' | 'hi' | 'both';

export function getTambolaCallText(num: number, lang: VoiceLanguage = 'both'): string {
  const enName = TAMBOLA_NICKNAMES_EN[num] || `Number ${num}`;
  const hiName = TAMBOLA_NICKNAMES_HI[num] || `नंबर ${num}`;
  const hiWord = HINDI_NUMBERS[num] || `${num}`;

  if (lang === 'hi') {
    if (num < 10) {
      return `सिंगल नंबर ${num} (${hiWord})। ${hiName}!`;
    }
    return `नंबर ${num}, ${hiWord}। ${hiName}!`;
  }

  if (lang === 'en') {
    if (num < 10) {
      return `Single number ${num}. ${enName}!`;
    }
    const digits = `${Math.floor(num / 10)}, ${num % 10}`;
    return `Number ${num}. ${digits}. ${enName}!`;
  }

  // Both / Bilingual mode (English + Hindi)
  if (num < 10) {
    return `Number ${num}, ${hiWord}. ${enName}!`;
  }
  return `Number ${num}, ${hiWord} (${num}). ${enName}!`;
}
