// Fener (kamera flaşı). Web'de yalnızca arka kameranın "torch" özelliği ile, destekleyen cihazlarda çalışır.
// Fener açıkken kamera kullanımı kullanıcıya görünür biçimde bildirilir.
import { basarili, basarisiz, cihazHatasiniCevir, hata } from "@/ortak/hata/hataYardimcilari";
import type { Sonuc } from "@/veri/model/tipler";
import { cihazDurumuBildir, cihazDurumDeposu } from "@/sistem_izleyici/CihazDurumu";

let akim: MediaStream | null = null;

export function feneriAcikMi(): boolean {
  return akim !== null;
}

export async function feneriAc(): Promise<Sonuc<string>> {
  if (akim) return basarili("Fener zaten açık.");
  if (!navigator.mediaDevices?.getUserMedia) {
    return basarisiz(hata("fener_desteklenmiyor", "Bu tarayıcı kamera erişimini desteklemiyor, fener açılamadı.", "Chrome (Android) ile HTTPS üzerinden açmayı deneyin.", false));
  }
  cihazDurumuBildir({ kamera: "izin_bekleniyor", kameraNedeni: "Fener" });
  try {
    const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" } }, audio: false });
    const iz = s.getVideoTracks()[0];
    const yetenekler = (iz.getCapabilities?.() ?? {}) as MediaTrackCapabilities & { torch?: boolean };
    if (!yetenekler.torch) {
      s.getTracks().forEach((t) => t.stop());
      cihazDurumuBildir({ kamera: "kapali", kameraNedeni: "" });
      return basarisiz(hata("fener_desteklenmiyor", "Bu cihaz veya tarayıcı fener (flaş) kontrolünü desteklemiyor.", "Fener, destekleyen Android cihazlarda Chrome ile çalışır.", false));
    }
    await iz.applyConstraints({ advanced: [{ torch: true } as MediaTrackConstraintSet] });
    akim = s;
    cihazDurumuBildir({ kamera: "aktif", kameraNedeni: "Fener" });
    return basarili("Fener açıldı.");
  } catch (e) {
    cihazDurumuBildir({ kamera: "kapali", kameraNedeni: "" });
    return basarisiz(cihazHatasiniCevir(e, "kamera"));
  }
}

export function feneriKapat(): Sonuc<string> {
  if (!akim) return basarili("Fener zaten kapalı.");
  akim.getTracks().forEach((t) => t.stop());
  akim = null;
  if (cihazDurumDeposu.al().kameraNedeni === "Fener") cihazDurumuBildir({ kamera: "kapali", kameraNedeni: "" });
  return basarili("Fener kapatıldı.");
}

// Sayfa kapanırken kaynakları serbest bırak.
if (typeof window !== "undefined") window.addEventListener("pagehide", () => feneriKapat());
