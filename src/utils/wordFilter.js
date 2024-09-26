const forbiddenWords = ['goblok', 'tolol', 'idiot', 'memek', 'kontol', 'asu', 'jancuk'
    ,'jokowi', 'mulyono', 'owi', 'goblog', 'jancok', 'anjing', 'babi', 'nigga',
    'nigger', 'kanjut', 'itil', 'ngentot', 'ngentod'
];

function containsForbiddenWord(message) {
    const lowercaseMessage = message.toLowerCase();
    return forbiddenWords.some(word => lowercaseMessage.includes(word));
}

module.exports = { containsForbiddenWord };