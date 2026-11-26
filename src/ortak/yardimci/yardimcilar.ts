// Küçük yardımcı fonksiyonlar: kimlik, biçimlendirme, güvenli günlük.

export function yeniKimlik(): string {
  try {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  } catch {
    /* yoksay */
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function bayt(n: number | null | undefined): string {
  if (n == null || !isFinite(n)) return "Kullanılamıyor";
  const birimler = ["B", "KB", "MB", "GB", "TB"];
  let i = 0;
  let d = n;
  while (d >= 1024 && i < birimler.length - 1) {
    d /= 1024;
    i++;
  }
  return `${d.toFixed(d >= 100 || i === 0 ? 0 : 1)} ${birimler[i]}`;
}

export function tarihSaat(ms: number): string {
  return new Date(ms).toLocaleString("tr-TR", { dateStyle: "medium", timeStyle: "short" });
}

export function saatMetni(ms: number): string {
  return new Date(ms).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

export function turkceKucuk(s: string): string {
  return s.toLocaleLowerCase("tr-TR");
}

/** API anahtarına benzeyen değerleri günlüklerde gizler. Anahtar asla loglanmaz. */
function maskele(deger: unknown): unknown {
  if (typeof deger !== "string") return deger instanceof Error ? deger.name : deger;
  return deger
    .replace(/sk-[A-Za-z0-9_-]{8,}/g, "sk-***")
    .replace(/AIza[A-Za-z0-9_-]{10,}/g, "AIza***")
    .replace(/Bearer\s+\S+/gi, "Bearer ***");
}

export const gunluk = {
  bilgi: (...a: unknown[]) => console.info("[AKREP]", ...a.map(maskele)),
  uyari: (...a: unknown[]) => console.warn("[AKREP]", ...a.map(maskele)),
  hata: (...a: unknown[]) => console.error("[AKREP]", ...a.map(maskele)),
};

export function sinirla(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

/** Harici betik (CDN) yükleyici — yalnızca ilgili özellik (OCR/nesne tanıma) kullanılınca çağrılır. */
const yuklenenBetikler = new Map<string, Promise<void>>();
export function betikYukle(url: string): Promise<void> {
  const var_ = yuklenenBetikler.get(url);
  if (var_) return var_;
  const p = new Promise<void>((coz, reddet) => {
    const s = document.createElement("script");
    s.src = url;
    s.async = true;
    s.onload = () => coz();
    s.onerror = () => {
      yuklenenBetikler.delete(url);
      reddet(new Error("betik_yuklenemedi"));
    };
    document.head.appendChild(s);
  });
  yuklenenBetikler.set(url, p);
  return p;
}
