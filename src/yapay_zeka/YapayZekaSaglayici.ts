// Sağlayıcıdan bağımsız yapay zekâ arayüzü + ortak yardımcılar.
import { hata } from "@/ortak/hata/hataYardimcilari";
import type { BaglantiDurumu, Sonuc, UygulamaHatasi, YapayZekaIstegi, YapayZekaYaniti } from "@/veri/model/tipler";

export interface YapayZekaSaglayici {
  yanitOlustur(istek: YapayZekaIstegi): Promise<Sonuc<YapayZekaYaniti>>;
  baglantiKontrolu(): Promise<BaglantiDurumu>;
}

export const SISTEM_ISTEMI =
  "Sen AKREP JARVIS adlı Türkçe sesli asistansın. Geliştiricin Nebi Özkan. Kısa, net ve doğal Türkçe yanıt ver; " +
  "yanıtlar yüksek sesle okunacağı için madde işareti ve Markdown kullanma. Canlı veriye (hava durumu, kur, haber) erişimin yoksa bunu açıkça söyle, tahmin uydurma.";

/** HTTP durum kodunu kullanıcı dostu hataya çevirir. Anahtar/ayrıntı asla mesajda yer almaz. */
export function httpHatasi(durum: number): UygulamaHatasi {
  if (durum === 401 || durum === 403)
    return hata("anahtar_gecersiz", "API anahtarı reddedildi.", "Anahtarın doğru ve yetkili olduğunu kontrol edip Ayarlar'dan yeniden kaydedin.", false);
  if (durum === 429)
    return hata("kota", "Kota veya istek sınırı aşıldı.", "Biraz bekleyip tekrar deneyin ya da sağlayıcı panelinden kotanızı kontrol edin.");
  if (durum === 404)
    return hata("model_yok", "Model veya uç nokta bulunamadı.", "Ayarlar'dan model adını ve uç nokta adresini kontrol edin.", false);
  if (durum === 400)
    return hata("istek_hatali", "Sağlayıcı isteği kabul etmedi.", "Model adını kontrol edin veya komutu kısaltıp tekrar deneyin.");
  if (durum >= 500) return hata("sunucu", "Yapay zekâ servisi şu anda yanıt vermiyor.", "Birkaç dakika sonra tekrar deneyin.");
  return hata("http", `Servis beklenmeyen bir yanıt verdi (${durum}).`, "Ayarlar'dan bağlantıyı test edin.");
}

export function agHatasi(e: unknown): UygulamaHatasi {
  if (e instanceof DOMException && e.name === "AbortError")
    return hata("zaman_asimi", "Yapay zekâ servisi zamanında yanıt vermedi.", "Bağlantınızı kontrol edip tekrar deneyin.");
  if (typeof navigator !== "undefined" && !navigator.onLine)
    return hata("cevrimdisi", "İnternet bağlantısı yok.", "Bağlandığınızda tekrar deneyin. Yerel komutlar çevrimdışı çalışmaya devam eder.");
  return hata(
    "ag",
    "Yapay zekâ servisine ulaşılamadı.",
    "Uç nokta adresini ve internetinizi kontrol edin. Özel sunucu kullanıyorsanız tarayıcı erişimine (CORS) izin vermesi gerekir.",
  );
}

export async function zamanAsimliFetch(url: string, init: RequestInit, ms = 25000): Promise<Response> {
  const ac = new AbortController();
  const z = setTimeout(() => ac.abort(), ms);
  try {
    return await fetch(url, { ...init, signal: ac.signal });
  } finally {
    clearTimeout(z);
  }
}

export function ucNoktaTemizle(u: string): string {
  return u.trim().replace(/\/+$/, "");
}
