# ColorWish — Mimari ve Teknik Özet

## Proje Nedir?

ColorWish, 3-10 yaş arası çocuklar için yapay zeka destekli bir boyama uygulamasıdır. Çocuk hayal ettiği sahneyi anlatır (yazarak veya sesle), yapay zeka bir boyama sayfası üretir, çocuk bunu ekranda boyar.

---

## Nasıl Çalışır? (Basit Anlatım)

```
Çocuk "uzayda bir kedi" yazar
        ↓
Uygulama bunu İngilizce'ye çevirir
        ↓
OpenAI API'ye gönderir (yapay zeka)
        ↓
Siyah-beyaz boyama sayfası görseli üretilir
        ↓
Görsel temizlenir (sadece çizgiler kalır)
        ↓
Çocuk ekranda fırça/boya kovası ile boyar
        ↓
Eserini galeriye kaydeder veya PNG olarak indirir
```

---

## Teknoloji Yığını

| Katman | Teknoloji | Ne İşe Yarar |
|--------|-----------|--------------|
| **Framework** | Next.js 16 (App Router) | Web uygulamasının iskeleti. Hem frontend (kullanıcı arayüzü) hem backend (API) tek projede |
| **Dil** | TypeScript | JavaScript'in tip güvenli versiyonu. Hataları önceden yakalar |
| **Stil** | Tailwind CSS | CSS yazmadan hızlı tasarım. Class isimleriyle stil verilir |
| **Animasyon** | Framer Motion | Sayfa geçişleri, buton animasyonları, yüzen emojiler |
| **State** | Zustand | Uygulama genelinde paylaşılan veriler (aktif araç, renk, profil) |
| **AI** | OpenAI API (gpt-image-1-mini) | Boyama sayfası görseli üretimi |
| **Görsel İşleme** | Sharp | Üretilen görseli siyah-beyaz'a çevirme, çizgi kalınlaştırma |
| **Ses** | Web Speech API | Sesle prompt girişi (mikrofon) |
| **Canvas** | HTML5 Canvas API | Boyama motoru (fırça, fill, silgi, zoom) |

---

## Backend Var mı?

**Kısmen.** Ayrı bir backend sunucusu yok. Next.js'in "API Routes" özelliği kullanılıyor:

- `src/app/api/generate/route.ts` — Tek API endpoint'i
- Bu dosya sunucu tarafında çalışır (tarayıcıda değil)
- OpenAI API key'ini güvenli tutar (kullanıcıya görünmez)
- Görsel üretim isteğini alır, OpenAI'a iletir, sonucu döner

**Veritabanı yok.** Tüm veriler kullanıcının tarayıcısında (localStorage) tutulur.

---

## Kullanıcı Hesap Sistemi

**Gerçek bir hesap sistemi yok** (e-posta, şifre, kayıt yok). Bunun yerine basit bir "profil" sistemi var:

### Çocuk Profilleri
- Uygulama ilk açıldığında "Kim boyayacak?" ekranı çıkar
- İsim, yaş (3-10 arası), avatar emojisi seçilir
- Profiller localStorage'da tutulur
- Her çocuk kendi galerini görür
- Profil değiştirmek için navbar'daki avatar'a tıklanır

### Ebeveyn Paneli
- 4 haneli PIN ile korunur (varsayılan: 1234)
- Çocuk profilleri ekleme/silme
- Günlük kullanım limiti ayarlama
- PIN değiştirme
- Tüm verileri silme

**Önemli:** Tüm bu veriler sadece o tarayıcıda ve o cihazda bulunur. Tarayıcı verileri silinirse her şey kaybolur.

---

## Veri Saklama

### localStorage (Tarayıcı Deposu)

Tüm veriler `localStorage`'da JSON formatında tutulur:

| Anahtar | İçerik |
|---------|--------|
| `boyaai-profiles` | Çocuk profilleri (isim, yaş, avatar) |
| `boyaai-active-profile` | Aktif profil ID'si |
| `boyaai-artworks` | Kaydedilmiş eserler (base64 PNG + metadata) |
| `boyaai-parent-settings` | Ebeveyn ayarları (PIN, günlük limit) |
| `boyaai-daily-usage` | Günlük kullanım sayacı (tarih bazlı) |
| `boyaai-language` | Dil tercihi (tr/en) |
| `boyaai-sounds-enabled` | Ses efektleri açık/kapalı |
| `boyaai-current-image` | Üretilen görselin geçici deposu |

### Sunucu Tarafı

- **OpenAI API Key:** `.env.local` dosyasında (git'e gitmez)
- **Rate Limit:** In-memory sayaç (sunucu yeniden başlatılınca sıfırlanır)
- **Kalıcı sunucu verisi yok** — veritabanı kullanılmıyor

### Stok Görseller

- `public/stock-coloring/` klasöründe 149 adet PNG dosyası
- 13 kategori: Hayvanlar, Uzay, Deniz, Masallar, Araçlar, Doğa, Dinozorlar, Yiyecekler, Şehir, Tatil, Alfabe (TR), Alphabet (EN), Sayılar, Gezegenler
- Bu görseller OpenAI ile önceden üretilip kaydedilmiş (statik dosyalar)

---

## Sayfa Yapısı

```
/                → Ana sayfa (hero, nasıl çalışır, öneriler)
/olustur         → Boyama sayfası oluştur (prompt gir, AI üretsin)
/boya            → Boyama motoru (canvas, araçlar, renkler)
/kutuphane       → Stok boyama kütüphanesi (149 hazır görsel)
/ciz             → Serbest çizim modu (boş canvas)
/galeri          → Kaydedilmiş eserler galerisi
/ebeveyn         → Ebeveyn paneli (PIN korumalı)
```

---

## Canvas Boyama Motoru

Boyama sayfası 3 katmanlı canvas sistemi kullanır:

```
┌─────────────────────┐
│  Outline Katmanı    │  ← Siyah çizgiler (en üstte, dokunulmaz)
│  (pointer-events:   │     Transparan beyaz, sadece siyah outline
│   none)             │
├─────────────────────┤
│  Çizim Katmanı      │  ← Kullanıcının boyaması (ortada)
│  (kullanıcı etkile- │     Fırça, fill, silgi burada çalışır
│   şimli)            │
├─────────────────────┤
│  Arka Plan Katmanı  │  ← Beyaz arka plan + orijinal görsel (altta)
│                     │     Değişmez, referans amaçlı
└─────────────────────┘
```

### Araçlar
- **Fırça:** Serbest çizim (round lineCap, değişken kalınlık)
- **Boya Kovası (Fill):** Flood fill algoritması — outline sınırları içinde doldurar
- **Silgi:** Beyaz renk ile boyar
- **Zoom:** Scroll wheel + pinch-to-zoom
- **Pan:** Orta tuş ile kaydırma (sadece zoom varken)
- **Undo/Redo:** ImageData snapshot'ları ile (max 50 adım)

### Flood Fill Mantığı
- Tıklanan noktadan 4 yöne yayılır
- Arka plan canvas'ındaki siyah pikselleri (R<60, G<60, B<60) duvar olarak kabul eder
- Renk karşılaştırması yapmaz — outline olmayan tüm bitişik pikselleri boyar
- Kullanıcı siyah ile fill yapsa bile, outline tespiti arka plan canvas'ından yapıldığı için tekrar boyanabilir

---

## AI Görsel Üretim Akışı

```
1. Kullanıcı Türkçe prompt yazar: "ormanda bir aslan"
2. İçerik filtresi kontrol eder (küfür, şiddet vs.)
3. Türkçe → İngilizce çeviri: "a lion in a forest"
4. Sahne zenginleştirme: "...forest scene with trees, bushes, flowers"
5. Stil ekleme: "...children's coloring book page, thick outlines..."
6. "adorable" prefix eklenir
7. OpenAI API'ye gönderilir (gpt-image-1-mini, 1024x1024, low quality)
8. Gelen görsel base64 olarak alınır
9. Post-processing: grayscale → threshold → dilate → morphological close
10. Temiz siyah-beyaz PNG frontend'e döner
```

### Post-Processing Pipeline
```
Ham AI görseli
    ↓ grayscale (tek kanal)
    ↓ threshold(160) — 160 üstü beyaz, altı siyah
    ↓ dilateBlack — siyah piksellerin 8 komşusunu da siyah yapar
    ↓ morphologicalClose(radius=2) — küçük boşlukları kapatır
    ↓ PNG olarak encode
Temiz boyama sayfası
```

---

## Çoklu Dil (i18n)

- 2 dil: Türkçe (varsayılan) ve İngilizce
- Zustand store ile yönetilir (`useI18nStore`)
- `useTranslation()` hook'u: `t('home.heroTitle1')` → ilgili dilde metin
- Dil değiştirme: Navbar'daki "TR ▼" dropdown'ı
- Tarayıcı dili otomatik algılanır, tercih localStorage'a kaydedilir
- Ses tanıma dili de locale'e göre ayarlanır (tr-TR / en-US)

---

## Güvenlik

| Konu | Yaklaşım |
|------|----------|
| API Key | `.env.local` dosyasında, git'e gitmez, sunucu tarafında okunur |
| İçerik Filtresi | Türkçe + İngilizce yasaklı kelime listesi (küfür, şiddet) |
| OpenAI Safety | OpenAI'ın kendi content moderation'ı ek koruma sağlar |
| Rate Limit | IP bazlı in-memory günlük limit (20/gün) |
| Ebeveyn Kontrolü | 4 haneli PIN ile korunan ebeveyn paneli |
| CORS | Görseller sunucu tarafında fetch edilip base64 olarak döner |

---

## Dosya Yapısı (Özet)

```
src/
├── app/                    # Sayfalar (Next.js App Router)
│   ├── page.tsx            # Ana sayfa
│   ├── olustur/            # Görsel üretim sayfası
│   ├── boya/               # Boyama motoru sayfası
│   ├── ciz/                # Serbest çizim sayfası
│   ├── kutuphane/          # Stok kütüphane sayfası
│   ├── galeri/             # Galeri sayfası
│   ├── ebeveyn/            # Ebeveyn paneli
│   └── api/generate/       # API endpoint (görsel üretim)
├── components/
│   ├── canvas/             # Boyama motoru bileşenleri
│   ├── drawing/            # Serbest çizim bileşenleri
│   ├── layout/             # Navbar, ProfileGate
│   └── ui/                 # Genel UI bileşenleri
├── constants/              # Sabitler (renkler, limitler, stok katalog, bilgi kartları)
├── hooks/                  # Custom hooks (ses tanıma)
├── lib/                    # Yardımcı fonksiyonlar
│   ├── ai/                 # Prompt çeviri, içerik filtresi
│   ├── canvas/             # Flood fill, görsel işleme
│   ├── i18n.ts             # Çoklu dil sistemi
│   ├── sounds.ts           # Ses efektleri
│   └── storage.ts          # localStorage CRUD
├── locales/                # Dil dosyaları (tr.ts, en.ts)
├── store/                  # Zustand store'ları
└── types/                  # TypeScript tip tanımları
```

---

## Sınırlamalar

- **Veri kaybı riski:** Tüm veriler localStorage'da — tarayıcı verileri silinirse eserler kaybolur
- **Tek cihaz:** Profiller ve eserler cihazlar arası senkronize edilmez
- **AI maliyeti:** Her görsel üretimi OpenAI API'ye ücret öder (~$0.005/görsel)
- **Rate limit:** In-memory, sunucu yeniden başlatılınca sıfırlanır
- **Offline çalışmaz:** Görsel üretimi internet gerektirir (stok görseller offline çalışır)
