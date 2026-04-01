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

export const PROMPT_SUGGESTIONS = [
  { emoji: '🦄', text: 'Gökkuşağında koşan bir unicorn' },
  { emoji: '🐉', text: 'Ateş püskürten sevimli ejderha' },
  { emoji: '🧚', text: 'Çiçek bahçesinde peri kızı' },
  { emoji: '🐳', text: 'Okyanusta yüzen mutlu balina' },
  { emoji: '👨‍🚀', text: 'Ayda yürüyen astronot' },
  { emoji: '🏴‍☠️', text: 'Hazine arayan korsan gemisi' },
  { emoji: '🦁', text: 'Ormanda oynayan bir aslan' },
  { emoji: '🐱', text: 'Uzayda yüzen bir kedi' },
  { emoji: '🦕', text: 'Paten kayan bir dinozor' },
  { emoji: '🐙', text: 'Şapka takan bir ahtapot' },
  { emoji: '🏰', text: 'Bulutların üstünde bir kale' },
  { emoji: '🍕', text: 'Kanatları olan bir pizza' },
  { emoji: '🐘', text: 'Balonlarla uçan bir fil' },
  { emoji: '🦋', text: 'Gökkuşağı kanatlı kelebek' },
  { emoji: '🐧', text: 'Sörf yapan bir penguen' },
  { emoji: '🦊', text: 'Kitap okuyan bir tilki' },
  { emoji: '🐸', text: 'Taç takan bir kurbağa prens' },
  { emoji: '🦒', text: 'Bisiklet süren bir zürafa' },
  { emoji: '🐻', text: 'Bal yiyen sevimli bir ayı' },
  { emoji: '🦜', text: 'Korsan papağanı ve hazine sandığı' },
  { emoji: '🌋', text: 'Yanardağdan çiçek fışkırıyor' },
  { emoji: '🧜‍♀️', text: 'Deniz altında bir deniz kızı' },
  { emoji: '🤖', text: 'Çiçek sulayan sevimli robot' },
  { emoji: '🐰', text: 'Havuç bahçesinde bir tavşan' },
  { emoji: '🦈', text: 'Gülümseyen bir köpekbalığı' },
  { emoji: '🎪', text: 'Sirkte gösteri yapan bir fil' },
  { emoji: '🐢', text: 'Yarış kazanan bir kaplumbağa' },
  { emoji: '🦩', text: 'Göl kenarında dans eden flamingo' },
  { emoji: '🐨', text: 'Ağaçta uyuyan bir koala' },
  { emoji: '🦝', text: 'Pasta yapan bir rakun' },
  { emoji: '🐬', text: 'Dalgalarla oynayan yunuslar' },
  { emoji: '🦅', text: 'Dağların üstünde süzülen kartal' },
  { emoji: '🐝', text: 'Çiçekler arasında uçan arı' },
  { emoji: '🎠', text: 'Lunaparkta atlıkarınca' },
  { emoji: '🚂', text: 'Gökkuşağı treni' },
  { emoji: '🏖️', text: 'Plajda kum kalesi yapan yengeç' },
  { emoji: '🌺', text: 'Dev bir çiçeğin üstünde oturan böcek' },
  { emoji: '🧁', text: 'Cupcake evde yaşayan fare' },
  { emoji: '🐴', text: 'Çayırda koşan vahşi atlar' },
  { emoji: '🦔', text: 'Yapraklar arasında sevimli kirpi' },
];

export function getRandomSuggestions(count: number = 6) {
  const shuffled = [...PROMPT_SUGGESTIONS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}
