const BLOCKED_WORDS = [
  // Violence
  'şiddet', 'silah', 'tüfek', 'tabanca', 'bıçak', 'kılıç', 'savaş',
  'kan', 'ölüm', 'öldür', 'öldürmek', 'cinayet', 'kavga', 'dövüş',
  'mermi', 'bomba', 'patlama', 'yaralı', 'yarala',
  // Horror
  'korku', 'korkutucu', 'zombi', 'vampir', 'ceset', 'iskelet',
  'hayalet', 'lanet', 'iblis', 'şeytan', 'kabuk', 'cehennem',
  // Inappropriate
  'çıplak', 'alkol', 'sigara', 'uyuşturucu', 'ilaç', 'zehir',
  'kumar', 'bahis',
  // Hate
  'nefret', 'ırkçı', 'ırkçılık', 'hakaret', 'küfür',
];

interface FilterResult {
  safe: boolean;
  reason?: string;
}

export function checkContentSafety(prompt: string): FilterResult {
  const lower = prompt.toLowerCase();
  const words = lower.split(/\s+/);

  for (const blocked of BLOCKED_WORDS) {
    // Check both full word match and substring for compound words
    if (words.includes(blocked) || lower.includes(blocked)) {
      return {
        safe: false,
        reason: `Bu kelimeyi kullanamıyoruz: "${blocked}". Lütfen daha eğlenceli bir şey dene! 🌈`,
      };
    }
  }

  return { safe: true };
}
