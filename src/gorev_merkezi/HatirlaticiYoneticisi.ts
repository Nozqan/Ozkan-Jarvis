// Hatırlatıcılar. Web sınırı: uygulama (sekme) açıkken tetiklenir; kapalıyken tarayıcı zamanlayıcı çalıştıramaz.
// Bu nedenle uygulama yeniden açıldığında kaçırılan hatırlatıcılar da bildirilir.
// Bildirim izni yalnızca hatırlatıcı oluşturulurken (ihtiyaç anında) istenir.
import { yeniKimlik } from "@/ortak/yardimci/yardimcilar";
import { basarili, basarisiz, hata } from "@/ortak/hata/hataYardimcilari";
import { hatirlaticiDeposu } from "@/veri/depo/HatirlaticiDeposu";
import type { Hatirlatici, Sonuc } from "@/veri/model/tipler";

export type BildirimDurumu = "izinli" | "reddedildi" | "desteklenmiyor" | "sorulmadi";

const zamanlayicilar = new Map<string, ReturnType<typeof setTimeout>>();
const EN_FAZLA = 2_000_000_000; // setTimeout üst sınırına yakın güvenli değer
let tetikleyici: ((h: Hatirlatici, kacirildi: boolean) => void) | null = null;

export function hatirlaticiDinleyiciAyarla(f: ((h: Hatirlatici, kacirildi: boolean) => void) | null): void {
  tetikleyici = f;
}

export function bildirimDurumu(): BildirimDurumu {
  if (typeof Notification === "undefined") return "desteklenmiyor";
  if (Notification.permission === "granted") return "izinli";
  if (Notification.permission === "denied") return "reddedildi";
  return "sorulmadi";
}

export async function bildirimIzniIste(): Promise<BildirimDurumu> {
  if (typeof Notification === "undefined") return "desteklenmiyor";
  if (Notification.permission === "default") {
    try {
      await Notification.requestPermission();
    } catch {
      /* eski tarayıcılar */
    }
  }
  return bildirimDurumu();
}

function tetikle(id: string, kacirildi = false): void {
  const h = hatirlaticiDeposu.al().find((x) => x.id === id);
  if (!h || h.tamamlandi) return;
  hatirlaticiDeposu.ata((o) => o.map((x) => (x.id === id ? { ...x, tamamlandi: true } : x)));
  zamanlayicilar.delete(id);
  if (bildirimDurumu() === "izinli") {
    try {
      new Notification("AKREP JARVIS hatırlatıcı", { body: h.metin, tag: id });
    } catch {
      /* Android Chrome doğrudan Notification kurucusuna izin vermez; uygulama içi bildirim yeterli. */
    }
  }
  tetikleyici?.(h, kacirildi);
}

function kur(h: Hatirlatici): void {
  if (h.tamamlandi) return;
  const kalan = h.zaman - Date.now();
  if (kalan <= 0) return;
  const t = setTimeout(() => {
    if (Date.now() + 500 < h.zaman) kur(h);
    else tetikle(h.id);
  }, Math.min(kalan, EN_FAZLA));
  zamanlayicilar.set(h.id, t);
}

export async function hatirlaticiOlustur(
  metin: string,
  zaman: number,
): Promise<Sonuc<{ hatirlatici: Hatirlatici; bildirim: BildirimDurumu }>> {
  const temiz = metin.trim();
  if (!temiz) return basarisiz(hata("hatirlatici_bos", "Hatırlatıcı metni boş.", "Ne hatırlatılacağını yazın.", false));
  if (!isFinite(zaman) || zaman <= Date.now() + 1000) {
    return basarisiz(hata("hatirlatici_gecmis", "Hatırlatıcı zamanı geçmişte veya çok yakın.", "Gelecekte bir zaman seçin.", false));
  }
  const bildirim = await bildirimIzniIste();
  const h: Hatirlatici = { id: yeniKimlik(), metin: temiz, zaman, tamamlandi: false };
  hatirlaticiDeposu.ata((o) => [...o, h].sort((a, b) => a.zaman - b.zaman));
  kur(h);
  return basarili({ hatirlatici: h, bildirim });
}

export function hatirlaticiSil(id: string): void {
  const t = zamanlayicilar.get(id);
  if (t) clearTimeout(t);
  zamanlayicilar.delete(id);
  hatirlaticiDeposu.ata((o) => o.filter((x) => x.id !== id));
}

/** Uygulama açılışında: bekleyenleri kurar, kaçırılanları bildirir. */
export function hatirlaticilariKur(): void {
  zamanlayicilar.forEach((t) => clearTimeout(t));
  zamanlayicilar.clear();
  const simdi = Date.now();
  hatirlaticiDeposu.al().forEach((h) => {
    if (h.tamamlandi) return;
    if (h.zaman <= simdi) tetikle(h.id, true);
    else kur(h);
  });
}

/** Android'de sistem alarm uygulamasını açar (intent). Diğer platformlarda açık bir hata döner. */
export function alarmUygulamasiniAc(): Sonuc<string> {
  if (!/Android/i.test(navigator.userAgent)) {
    return basarisiz(hata("alarm_android_degil", "Alarm uygulamasına yönlendirme yalnızca Android cihazlarda çalışır.", "Bunun yerine hatırlatıcı oluşturabilirsiniz.", false));
  }
  window.location.href = "intent:#Intent;action=android.intent.action.SHOW_ALARMS;end";
  return basarili("Alarm uygulaması açılıyor.");
}

export function sureyiMsYap(deger: number, birim: "saniye" | "dakika" | "saat"): number {
  return deger * { saniye: 1000, dakika: 60_000, saat: 3_600_000 }[birim];
}
