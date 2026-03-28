export const INSPIRATIONS = [
  'Bir fil balerin olsa nasıl olurdu? 🐘💃',
  'Ya bulutlar pamuk şekere dönüşse? ☁️🍭',
  'Uzayda bir kedi kafesi olsa? 🐱🚀',
  'Denizaltında bir lunapark hayal et! 🎡🐠',
  'Gökkuşağının üstünde kayan bir penguen! 🐧🌈',
  'Bir ejderha dondurma satsa? 🐉🍦',
  'Aya giden bir bisiklet yolu! 🚲🌙',
  'Robot bir aşçı pasta yapıyor! 🤖🎂',
  'Çiçeklerden yapılmış bir uzay gemisi! 🌸🚀',
  'Kanatları olan bir kaplumbağa! 🐢✨',
  'Büyülü bir ormanın kapısı! 🚪🌳',
  'Bir balık okula gitse? 🐟📚',
  'Müzik çalan bir ağaç! 🎵🌲',
  'Çizmeleri olan bir ahtapot! 🐙👢',
  'Balonlarla uçan bir ev! 🎈🏠',
  'Patenleri olan bir zürafa! 🦒⛸️',
  'Bir kelebek sirki! 🦋🎪',
  'Bulutlarda yüzen bir gemi! ⛵☁️',
  'Rengarenk bir unicorn ailesi! 🦄🌈',
  'Dansçı bir dinozor! 🦕💃',
];

export function getRandomInspiration(): string {
  return INSPIRATIONS[Math.floor(Math.random() * INSPIRATIONS.length)];
}
