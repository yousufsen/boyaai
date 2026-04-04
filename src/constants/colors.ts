export const COLORS = [
  { name: 'Kırmızı', nameEn: 'Red', hex: '#FF0000' },
  { name: 'Turuncu', nameEn: 'Orange', hex: '#FF8C00' },
  { name: 'Sarı', nameEn: 'Yellow', hex: '#FFD700' },
  { name: 'Açık Yeşil', nameEn: 'Light Green', hex: '#7CFC00' },
  { name: 'Yeşil', nameEn: 'Green', hex: '#228B22' },
  { name: 'Turkuaz', nameEn: 'Turquoise', hex: '#00CED1' },
  { name: 'Açık Mavi', nameEn: 'Light Blue', hex: '#87CEEB' },
  { name: 'Mavi', nameEn: 'Blue', hex: '#1E90FF' },
  { name: 'Lacivert', nameEn: 'Navy', hex: '#000080' },
  { name: 'Mor', nameEn: 'Purple', hex: '#9400D3' },
  { name: 'Pembe', nameEn: 'Pink', hex: '#FF69B4' },
  { name: 'Fuşya', nameEn: 'Fuchsia', hex: '#FF1493' },
  { name: 'Kahverengi', nameEn: 'Brown', hex: '#8B4513' },
  { name: 'Bej', nameEn: 'Beige', hex: '#F5DEB3' },
  { name: 'Gri', nameEn: 'Gray', hex: '#808080' },
  { name: 'Siyah', nameEn: 'Black', hex: '#000000' },
  { name: 'Beyaz', nameEn: 'White', hex: '#FFFFFF' },
  { name: 'Altın', nameEn: 'Gold', hex: '#DAA520' },
  { name: 'Gümüş', nameEn: 'Silver', hex: '#C0C0C0' },
] as const;

export type ColorHex = typeof COLORS[number]['hex'];

export const BRUSH_SIZES = [
  { name: 'İnce', nameEn: 'Thin', size: 4, icon: '·' },
  { name: 'Normal', nameEn: 'Normal', size: 8, icon: '●' },
  { name: 'Kalın', nameEn: 'Thick', size: 16, icon: '⬤' },
  { name: 'Çok Kalın', nameEn: 'Extra Thick', size: 28, icon: '🔴' },
] as const;

export type ToolType = 'brush' | 'fill' | 'eraser';

export const TOOLS: { type: ToolType; name: string; nameEn: string; icon: string }[] = [
  { type: 'brush', name: 'Fırça', nameEn: 'Brush', icon: '🖌️' },
  { type: 'fill', name: 'Boya Kovası', nameEn: 'Fill Bucket', icon: '🪣' },
  { type: 'eraser', name: 'Silgi', nameEn: 'Eraser', icon: '🧽' },
];
