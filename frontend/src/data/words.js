// Top 200 most common English words for typing tests
export const englishWords = [
  'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i',
  'it', 'for', 'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at',
  'this', 'but', 'his', 'by', 'from', 'they', 'we', 'say', 'her', 'she',
  'or', 'an', 'will', 'my', 'one', 'all', 'would', 'there', 'their', 'what',
  'so', 'up', 'out', 'if', 'about', 'who', 'get', 'which', 'go', 'me',
  'when', 'make', 'can', 'like', 'time', 'no', 'just', 'him', 'know', 'take',
  'people', 'into', 'year', 'your', 'good', 'some', 'could', 'them', 'see', 'other',
  'than', 'then', 'now', 'look', 'only', 'come', 'its', 'over', 'think', 'also',
  'back', 'after', 'use', 'two', 'how', 'our', 'work', 'first', 'well', 'way',
  'even', 'new', 'want', 'because', 'any', 'these', 'give', 'day', 'most', 'us',
  'great', 'between', 'need', 'large', 'under', 'never', 'each', 'right', 'last', 'small',
  'world', 'still', 'found', 'live', 'long', 'through', 'much', 'before', 'move', 'right',
  'real', 'left', 'same', 'begin', 'while', 'number', 'part', 'turn', 'where', 'after',
  'thing', 'point', 'house', 'hand', 'high', 'keep', 'place', 'around', 'help', 'every',
  'name', 'city', 'away', 'change', 'follow', 'line', 'why', 'ask', 'went', 'light',
  'home', 'read', 'own', 'end', 'near', 'add', 'here', 'play', 'run', 'close',
  'open', 'seem', 'next', 'walk', 'stop', 'grow', 'early', 'food', 'start', 'might',
  'story', 'far', 'water', 'example', 'paper', 'often', 'always', 'music', 'those', 'both',
  'mark', 'book', 'letter', 'until', 'mile', 'river', 'car', 'feet', 'care', 'second',
  'group', 'carry', 'took', 'rain', 'eat', 'room', 'friend', 'began', 'idea', 'fish',
  'mountain', 'north', 'once', 'base', 'hear', 'horse', 'cut', 'sure', 'watch', 'color',
  'face', 'wood', 'main', 'enough', 'plain', 'girl', 'usual', 'young', 'ready', 'above',
  'ever', 'red', 'list', 'though', 'feel', 'talk', 'bird', 'soon', 'body', 'dog',
  'family', 'direct', 'leave', 'song', 'measure', 'door', 'product', 'black', 'short', 'stand',
  'class', 'wind', 'question', 'happen', 'complete', 'ship', 'area', 'half', 'rock', 'order',
  'fire', 'problem', 'piece', 'told', 'knew', 'pass', 'since', 'top', 'whole', 'king',
  'space', 'heard', 'best', 'hour', 'better', 'true', 'during', 'hundred', 'remember', 'step',
  'hold', 'west', 'ground', 'interest', 'reach', 'fast', 'sing', 'listen', 'six', 'table',
  'travel', 'less', 'morning', 'simple', 'several', 'vowel', 'toward', 'war', 'lay', 'against',
  'pattern', 'slow', 'center', 'love', 'person', 'money', 'serve', 'appear', 'road', 'map'
]

/**
 * Generate a shuffled list of words from the word bank
 * @param {number} count - Number of words to generate
 * @returns {string[]}
 */
export function generateWords(count = 50) {
  const words = []
  for (let i = 0; i < count; i++) {
    const randomIndex = Math.floor(Math.random() * englishWords.length)
    words.push(englishWords[randomIndex])
  }
  return words
}
