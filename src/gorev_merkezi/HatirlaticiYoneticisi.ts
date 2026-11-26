// Web hatırlatıcıları uygulama açıkken işler; Android bildirimleri uygulama kapalıyken de tetiklenebilir.
// Bildirim izni yalnızca kullanıcı hatırlatıcı oluştururken istenir.
import { yeniKimlik } from "@/ortak/yardimci/yardimcilar";
import { basarili, basarisiz, hata } from "@/ortak/hata/hataYardimcilari";
import { hatirlaticiDeposu } from "@/veri/depo/HatirlaticiDeposu";
import type { Hatirlatici, Sonuc } from "@/veri/model/tipler";
import { LocalNotifications } from "@capacitor/local-notifications";
import { androidCapinda } from "@/yerel_android/AkrepNative";

export type BildirimDurumu = "izinli" | "reddedildi" | "desteklenmiyor" | "sorulmadi";

const zamanlayicilar = new Map<string, ReturnType<typeof setTimeout>>();
const EN_FAZLA = 2_000_000_000; // setTimeout üst sınırına yakın güvenli değer
let tetikleyici: ((h: Hatirlatici, kacirildi: boolean) => void) | null = null;
let androidIzin: BildirimDurumu = "sorulmadi";

function bildirimKimligi(id: string): number {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = Math.imul(hash, 31) + id.charCodeAt(i) | 0;
  return (hash & 0x7fffffff) || 1;
}

function nativeDurum(display: string): BildirimDurumu {
  if (display === "granted") return "izinli";
  if (display === "denied") return "reddedildi";
  return "sorulmadi";
}

async function nativeIzinKontrolu(): Promise<BildirimDurumu> {
  if (!androidCapinda()) return bildirimDurumu();
  const izin = await LocalNotifications.checkPermissions();
  androidIzin = nativeDurum(izin.display);
  return androidIzin;
}

export async function bildirimDurumunuTazele(): Promise<BildirimDurumu> {
  return nativeIzinKontrolu();
}

export async function kesinAlarmIzniVarMi(): Promise<boolean | null> {
  if (!androidCapinda()) return null;
  const izin = await LocalNotifications.checkExactNotificationSetting();
  return izin.exact_alarm === "granted";
}

export async function kesinAlarmAyariniAc(): Promise<boolean> {
  if (!androidCapinda()) return false;
  const izin = await LocalNotifications.changeExactNotificationSetting();
  return izin.exact_alarm === "granted";
}

async function nativeBildirimPlanla(h: Hatirlatici): Promise<void> {
  if (!androidCapinda() || (await nativeIzinKontrolu()) !== "izinli") return;
  const exact = await LocalNotifications.checkExactNotificationSetting();
  await LocalNotifications.schedule({
    notifications: [{
      id: bildirimKimligi(h.id),
      title: "AKREP JARVIS hatırlatıcı",
      body: h.metin,
      schedule: { at: new Date(h.zaman), allowWhileIdle: false },
      isExactNotification: exact.exact_alarm === "granted",
    }],
  });
}

export function hatirlaticiDinleyiciAyarla(f: ((h: Hatirlatici, kacirildi: boolean) => void) | null): void {
  tetikleyici = f;
}

export function bildirimDurumu(): BildirimDurumu {
  if (androidCapinda()) return androidIzin;
  if (typeof Notification === "undefined") return "desteklenmiyor";
  if (Notification.permission === "granted") return "izinli";
  if (Notification.permission === "denied") return "reddedildi";
  return "sorulmadi";
}

export async function bildirimIzniIste(): Promise<BildirimDurumu> {
  if (androidCapinda()) {
    const izin = await LocalNotifications.requestPermissions();
    androidIzin = nativeDurum(izin.display);
    return androidIzin;
  }
  if (typeof Notification === "undefined") return "desteklenmiyor";
  if (Notification.permission === "default") {
    await Notification.requestPermission();
  }
  return bildirimDurumu();
}

function tetikle(id: string, kacirildi = false): void {
  const h = hatirlaticiDeposu.al().find((x) => x.id === id);
  if (!h || h.tamamlandi) return;
  hatirlaticiDeposu.ata((o) => o.map((x) => (x.id === id ? { ...x, tamamlandi: true } : x)));
  zamanlayicilar.delete(id);
  if (!androidCapinda() && bildirimDurumu() === "izinli") {
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
  let bildirim: BildirimDurumu;
  try {
    bildirim = await bildirimIzniIste();
  } catch {
    return basarisiz(hata("bildirim_izin_hatasi", "Bildirim izni kontrol edilemedi.", "Uygulamanın bildirim izinlerini Android ayarlarından kontrol edin.", true));
  }
  const h: Hatirlatici = { id: yeniKimlik(), metin: temiz, zaman, tamamlandi: false };
  try {
    await nativeBildirimPlanla(h);
  } catch {
    return basarisiz(hata("hatirlatici_bildirim_kurulamadi", "Android bildirimi zamanlanamadı.", "Bildirim iznini ve Android ayarlarını kontrol edip tekrar deneyin.", true));
  }
  hatirlaticiDeposu.ata((o) => [...o, h].sort((a, b) => a.zaman - b.zaman));
  kur(h);
  return basarili({ hatirlatici: h, bildirim });
}

export async function hatirlaticiSil(id: string): Promise<void> {
  if (androidCapinda()) await LocalNotifications.cancel({ notifications: [{ id: bildirimKimligi(id) }] });
  const t = zamanlayicilar.get(id);
  if (t) clearTimeout(t);
  zamanlayicilar.delete(id);
  hatirlaticiDeposu.ata((o) => o.filter((x) => x.id !== id));
}

export async function hatirlaticiPlanlariniTemizle(): Promise<void> {
  const hatirlaticilar = hatirlaticiDeposu.al();
  if (androidCapinda() && hatirlaticilar.length) {
    await LocalNotifications.cancel({ notifications: hatirlaticilar.map((h) => ({ id: bildirimKimligi(h.id) })) });
  }
  zamanlayicilar.forEach((t) => clearTimeout(t));
  zamanlayicilar.clear();
}

/** Uygulama açılışında: bekleyenleri kurar, kaçırılanları bildirir. */
export async function hatirlaticilariKur(): Promise<void> {
  zamanlayicilar.forEach((t) => clearTimeout(t));
  zamanlayicilar.clear();
  const simdi = Date.now();
  const gelecekteki: Hatirlatici[] = [];
  hatirlaticiDeposu.al().forEach((h) => {
    if (h.tamamlandi) return;
    if (h.zaman <= simdi) tetikle(h.id, true);
    else {
      kur(h);
      gelecekteki.push(h);
    }
  });
  if (androidCapinda()) await Promise.all(gelecekteki.map(nativeBildirimPlanla));
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
