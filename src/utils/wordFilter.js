const forbiddenWords = ['goblok', 'tolol', 'idiot', 'memek', 'kontol', 'jancuk',
    'jokowi', 'mulyono', 'owi', 'goblog', 'jancok', 'anjing', 'babi', 'nigga',
    'nigger', 'kanjut', 'itil', 'ngentot', 'ngentod', 'bangsat', 'bangsad', 'goblog'
  ];
  
  export function checkForbiddenWord(message) {
    const words = message.split(/\s+/);
    for (const word of words) {
      const lowercaseWord = word.toLowerCase();
      const forbiddenWord = forbiddenWords.find(fw => lowercaseWord.includes(fw));
      if (forbiddenWord) {
        return {
          found: true,
          word: word, // Return the actual word used in the message
          lowercaseWord: forbiddenWord
        };
      }
    }
    return { found: false };
  }
  
  export function getForbiddenWordResponse(word, lowercaseWord) {
    return `PERBAIKI BAHASAMU\nKATA ${word} (bentuk dasar: ${lowercaseWord}) adalah kata yang tidak baik`;
  }