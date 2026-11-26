// Teknik hataları kullanıcıya anlaşılır Türkçe mesajlara çevirir (stack trace göstermez).
import type { Sonuc, UygulamaHatasi } from "@/veri/model/tipler";

export function hata(kod: string, mesaj: string, oneri: string, tekrarDenenebilir = true): UygulamaHatasi {
  return { kod, mesaj, oneri, tekrarDenenebilir };
}

export function basarili<T>(deger: T): Sonuc<T> {
  return { basarili: true, deger };
}

export function basarisiz<T = never>(h: UygulamaHatasi): Sonuc<T> {
  return { basarili: false, hata: h };
}

/** Kamera/mikrofon/izin kaynaklı tarayıcı hatalarını çevirir. */
export function cihazHatasiniCevir(e: unknown, cihaz: "kamera" | "mikrofon"): UygulamaHatasi {
  const ad = e instanceof DOMException || e instanceof Error ? e.name : "";
  const adi = cihaz === "kamera" ? "Kamera" : "Mikrofon";
  switch (ad) {
    case "NotAllowedError":
    case "SecurityError":
    case "PermissionDeniedError":
      return hata(
        `${cihaz}_izin_yok`,
        `${adi} izni verilmedi.`,
        `Tarayıcı adres çubuğundaki kilit simgesine dokunup ${adi.toLowerCase()} iznini "İzin ver" yapın, ardından Tekrar dene'ye dokunun.`,
      );
    case "NotFoundError":
    case "DevicesNotFoundError":
      return hata(`${cihaz}_yok`, `Bu cihazda ${adi.toLowerCase()} bulunamadı.`, "Başka bir cihaz deneyin veya metinle komut girin.", false);
    case "NotReadableError":
    case "TrackStartError":
      return hata(`${cihaz}_mesgul`, `${adi} başka bir uygulama tarafından kullanılıyor.`, `Diğer uygulamayı kapatıp Tekrar dene'ye dokunun.`);
    case "OverconstrainedError":
      return hata(`${cihaz}_uyumsuz`, `İstenen ${adi.toLowerCase()} ayarı bu cihazda desteklenmiyor.`, "Tekrar deneyin; varsayılan ayarla açılacaktır.");
    default:
      return hata(`${cihaz}_bilinmeyen`, `${adi} açılamadı.`, "Sayfayı yenileyip tekrar deneyin. Sorun sürerse metinle komut girebilirsiniz.");
  }
}

export function bilinmeyenHata(e: unknown, baglam = "İşlem"): UygulamaHatasi {
  void e; // Ayrıntı kullanıcıya gösterilmez.
  return hata("bilinmeyen", `${baglam} tamamlanamadı.`, "Lütfen tekrar deneyin. Sorun sürerse uygulamayı yenileyin.");
}
