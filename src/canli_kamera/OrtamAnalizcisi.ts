// Basit ortam analizi: ışık düzeyi, baskın renk, kontrast ve netlik. Tamamen cihazda, ağ yok, model indirme yok.
export interface OrtamSonucu {
  parlaklik: number; // 0..100
  kontrast: number; // 0..100
  netlik: number; // Laplace varyansı
  baskinRenk: string;
  aciklama: string;
}

export function parlaklikOlc(video: HTMLVideoElement, ara: HTMLCanvasElement): number | null {
  if (video.videoWidth === 0) return null;
  ara.width = 32;
  ara.height = 24;
  const c = ara.getContext("2d", { willReadFrequently: true });
  if (!c) return null;
  c.drawImage(video, 0, 0, 32, 24);
  const d = c.getImageData(0, 0, 32, 24).data;
  let t = 0;
  for (let i = 0; i < d.length; i += 4) t += 0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2];
  return Math.round((t / (d.length / 4) / 255) * 100);
}

function renkAdi(r: number, g: number, b: number): string {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const doygunluk = max === 0 ? 0 : (max - min) / max;
  if (max < 40) return "siyah";
  if (doygunluk < 0.15) return max > 190 ? "beyaz" : max > 110 ? "gri" : "koyu gri";
  let ton: number;
  const d = max - min;
  if (max === r) ton = ((g - b) / d + 6) % 6;
  else if (max === g) ton = (b - r) / d + 2;
  else ton = (r - g) / d + 4;
  ton *= 60;
  if (ton < 15 || ton >= 345) return "kırmızı";
  if (ton < 45) return max < 150 ? "kahverengi" : "turuncu";
  if (ton < 70) return "sarı";
  if (ton < 165) return "yeşil";
  if (ton < 200) return "turkuaz";
  if (ton < 260) return "mavi";
  if (ton < 300) return "mor";
  return "pembe";
}

export function ortamiAnalizEt(tuval: HTMLCanvasElement): OrtamSonucu {
  const W = 160;
  const H = Math.max(1, Math.round((tuval.height / tuval.width) * W));
  const k = document.createElement("canvas");
  k.width = W;
  k.height = H;
  const c = k.getContext("2d", { willReadFrequently: true })!;
  c.drawImage(tuval, 0, 0, W, H);
  const d = c.getImageData(0, 0, W, H).data;
  const n = W * H;
  const lum = new Float32Array(n);
  let top = 0;
  let R = 0;
  let G = 0;
  let B = 0;
  for (let i = 0; i < n; i++) {
    const r = d[i * 4];
    const g = d[i * 4 + 1];
    const b = d[i * 4 + 2];
    const l = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    lum[i] = l;
    top += l;
    R += r;
    G += g;
    B += b;
  }
  const ort = top / n;
  let varyans = 0;
  for (let i = 0; i < n; i++) varyans += (lum[i] - ort) ** 2;
  const kontrast = Math.min(100, Math.round((Math.sqrt(varyans / n) / 128) * 100));
  // Laplace varyansı: kenar keskinliği
  let lap = 0;
  let lapKare = 0;
  let sayi = 0;
  for (let y = 1; y < H - 1; y++) {
    for (let x = 1; x < W - 1; x++) {
      const i = y * W + x;
      const v = 4 * lum[i] - lum[i - 1] - lum[i + 1] - lum[i - W] - lum[i + W];
      lap += v;
      lapKare += v * v;
      sayi++;
    }
  }
  const netlik = Math.round(lapKare / sayi - (lap / sayi) ** 2);
  const parlaklik = Math.round((ort / 255) * 100);
  const renk = renkAdi(R / n, G / n, B / n);
  const isik = parlaklik < 15 ? "çok karanlık" : parlaklik < 35 ? "loş" : parlaklik < 70 ? "orta aydınlık" : "çok aydınlık";
  const netMetin = netlik < 40 ? "bulanık veya düz yüzey" : netlik < 200 ? "orta netlikte" : "net ve ayrıntılı";
  const aciklama =
    `Ortam ${isik} (parlaklık %${parlaklik}). Baskın renk: ${renk}. Kontrast ${kontrast < 25 ? "düşük" : kontrast < 55 ? "orta" : "yüksek"} (%${kontrast}). Görüntü ${netMetin}.` +
    (parlaklik < 25 ? " Metin okuma için daha fazla ışık önerilir." : "");
  return { parlaklik, kontrast, netlik, baskinRenk: renk, aciklama };
}
