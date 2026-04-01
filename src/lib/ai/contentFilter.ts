const BLOCKED_WORDS = [
  // Violence (TR)
  'şiddet', 'silah', 'tüfek', 'tabanca', 'bıçak', 'kılıç', 'savaş',
  'kan', 'ölüm', 'öldür', 'öldürmek', 'cinayet', 'kavga', 'dövüş',
  'mermi', 'bomba', 'patlama', 'yaralı', 'yarala',
  // Horror (TR)
  'korku', 'korkutucu', 'zombi', 'vampir', 'ceset', 'iskelet',
  'hayalet', 'lanet', 'iblis', 'şeytan', 'cehennem',
  // Inappropriate (TR)
  'çıplak', 'alkol', 'sigara', 'uyuşturucu', 'ilaç', 'zehir',
  'kumar', 'bahis',
  // Hate (TR)
  'nefret', 'ırkçı', 'ırkçılık', 'hakaret', 'küfür',
  // Turkish profanity
  'sik', 'siktir', 'amk', 'bok', 'orospu', 'piç', 'yarak', 'yarrak',
  'göt', 'meme', 'penis', 'vajina', 'sex', 'seks', 'porn', 'porno',
  'am', 'taşak', 'döl', 'sikiş', 'hentai',
  // English inappropriate
  'fuck', 'shit', 'dick', 'cock', 'pussy', 'ass', 'bitch', 'whore',
  'nude', 'naked', 'nsfw', 'porn', 'xxx', 'sexy', 'boob', 'breast',
  'kill', 'murder', 'blood', 'gore', 'torture', 'rape', 'suicide',
  'gun', 'weapon', 'bomb', 'drug', 'cocaine', 'heroin',
];

interface FilterResult {
  safe: boolean;
  reason?: string;
}

export function checkContentSafety(prompt: string): FilterResult {
  const lower = prompt.toLowerCase().trim();
  const words = lower.split(/\s+/);

  for (const blocked of BLOCKED_WORDS) {
    // Only match whole words — prevents "ressam" matching "am"
    if (words.includes(blocked)) {
      return {
        safe: false,
        reason: 'Bu içerik uygun değil. Lütfen daha eğlenceli bir şey dene! 🌈',
      };
    }
  }

  return { safe: true };
}
