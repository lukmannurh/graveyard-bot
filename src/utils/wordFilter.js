import { OWNER_NUMBER } from "../config/index.js";

const forbiddenWords = [
  "goblok",
  "tolol",
  "idiot",
  "memek",
  "kontol",
  "jancuk",
  "jokowi",
  "mulyono",
  "owi",
  "goblog",
  "jancok",
  "anjing",
  "babi",
  "nigga",
  "hok",
  "goblok",
  "kanjut",
  "hokmok",
  "nigger",
  "kanjut",
  "itil",
  "ngentot",
  "ngentod",
  "bangsat",
  "bangsad",
  "goblog",
  '.tagall'
];

export function checkForbiddenWord(message, userId) {
  if (OWNER_NUMBER.includes(userId.replace("@c.us", ""))) {
    return { found: false };
  }

  const words = message.split(/\s+/);
  for (const word of words) {
    const lowercaseWord = word.toLowerCase();
    const forbiddenWord = forbiddenWords.find((fw) =>
      lowercaseWord.includes(fw)
    );
    if (forbiddenWord) {
      return {
        found: true,
        word: word,
        lowercaseWord: forbiddenWord,
      };
    }
  }
  return { found: false };
}

export function getForbiddenWordResponse(word, lowercaseWord) {
  return `PERBAIKI BAHASAMU\nKATA ${word} (bentuk dasar: ${lowercaseWord}) adalah kata yang tidak baik`;
}
