export const COLORS = [
  { name: 'Kırmızı', hex: '#FF0000' },
  { name: 'Turuncu', hex: '#FF8C00' },
  { name: 'Sarı', hex: '#FFD700' },
  { name: 'Açık Yeşil', hex: '#7CFC00' },
  { name: 'Yeşil', hex: '#228B22' },
  { name: 'Turkuaz', hex: '#00CED1' },
  { name: 'Açık Mavi', hex: '#87CEEB' },
  { name: 'Mavi', hex: '#1E90FF' },
  { name: 'Lacivert', hex: '#000080' },
  { name: 'Mor', hex: '#9400D3' },
  { name: 'Pembe', hex: '#FF69B4' },
  { name: 'Fuşya', hex: '#FF1493' },
  { name: 'Kahverengi', hex: '#8B4513' },
  { name: 'Bej', hex: '#F5DEB3' },
  { name: 'Gri', hex: '#808080' },
  { name: 'Siyah', hex: '#000000' },
  { name: 'Beyaz', hex: '#FFFFFF' },
  { name: 'Altın', hex: '#DAA520' },
  { name: 'Gümüş', hex: '#C0C0C0' },
] as const;

export type ColorHex = typeof COLORS[number]['hex'];

export const BRUSH_SIZES = [
  { name: 'İnce', size: 4, icon: '·' },
  { name: 'Normal', size: 8, icon: '●' },
  { name: 'Kalın', size: 16, icon: '⬤' },
  { name: 'Çok Kalın', size: 28, icon: '🔴' },
] as const;

export type ToolType = 'brush' | 'fill' | 'eraser';

export const TOOLS: { type: ToolType; name: string; icon: string }[] = [
  { type: 'brush', name: 'Fırça', icon: '🖌️' },
  { type: 'fill', name: 'Boya Kovası', icon: '🪣' },
  { type: 'eraser', name: 'Silgi', icon: '🧽' },
];
