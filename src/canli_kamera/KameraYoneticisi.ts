// CameraX'in web karşılığı: getUserMedia ile gerçek kamera akışı. Kareler yalnızca bellekte analiz edilir, kaydedilmez.
import { basarili, basarisiz, cihazHatasiniCevir, hata } from "@/ortak/hata/hataYardimcilari";
import type { Sonuc } from "@/veri/model/tipler";
import { cihazDurumuBildir } from "@/sistem_izleyici/CihazDurumu";

export type KameraDurumu = "kapali" | "izin_bekleniyor" | "hazirlaniyor" | "hazir" | "metin_analiz" | "nesne_analiz" | "kod_analiz" | "sonuc_hazir" | "basarisiz";

export const KAMERA_ETIKETLERI: Record<KameraDurumu, string> = {
  kapali: "Kamera kapalı",
  izin_bekleniyor: "İzin bekleniyor",
  hazirlaniyor: "Tarama hazırlanıyor",
  hazir: "Tarama hazır",
  metin_analiz: "Metin analiz ediliyor",
  nesne_analiz: "Nesne analiz ediliyor",
  kod_analiz: "QR/barkod analiz ediliyor",
  sonuc_hazir: "Sonuç hazır",
  basarisiz: "İşlem başarısız",
};

export type KameraYuzu = "environment" | "user";

export class KameraYoneticisi {
  private akim: MediaStream | null = null;
  private video: HTMLVideoElement | null = null;
  private yakalama: HTMLCanvasElement | null = null;

  get acik(): boolean {
    return this.akim !== null;
  }

  static destekleniyor(): boolean {
    return !!navigator.mediaDevices?.getUserMedia;
  }

  async ac(video: HTMLVideoElement, yuz: KameraYuzu): Promise<Sonuc<{ genislik: number; yukseklik: number }>> {
    if (!KameraYoneticisi.destekleniyor()) {
      cihazDurumuBildir({ kamera: "desteklenmiyor", kameraNedeni: "" });
      return basarisiz(hata("kamera_desteklenmiyor", "Bu tarayıcı kamera erişimini desteklemiyor.", "Chrome ile HTTPS üzerinden açın.", false));
    }
    this.kapat();
    cihazDurumuBildir({ kamera: "izin_bekleniyor", kameraNedeni: "Canlı tarama" });
    try {
      try {
        this.akim = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: yuz }, width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        });
      } catch (e) {
        if (e instanceof DOMException && e.name === "OverconstrainedError") {
          this.akim = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        } else throw e;
      }
      cihazDurumuBildir({ kamera: "hazirlaniyor" });
      this.video = video;
      video.srcObject = this.akim;
      video.muted = true;
      video.playsInline = true;
      await video.play();
      await new Promise<void>((coz) => {
        if (video.videoWidth > 0) return coz();
        video.onloadedmetadata = () => coz();
      });
      cihazDurumuBildir({ kamera: "aktif" });
      return basarili({ genislik: video.videoWidth, yukseklik: video.videoHeight });
    } catch (e) {
      this.kapat();
      const h = cihazHatasiniCevir(e, "kamera");
      cihazDurumuBildir({ kamera: h.kod === "kamera_izin_yok" ? "reddedildi" : "kapali", kameraNedeni: "" });
      return basarisiz(h);
    }
  }

  /** Mevcut kareyi bellekte bir tuvale kopyalar (disk/ağ yok). */
  kareYakala(enFazlaGenislik = 1280): HTMLCanvasElement | null {
    const v = this.video;
    if (!v || v.videoWidth === 0) return null;
    const olcek = Math.min(1, enFazlaGenislik / v.videoWidth);
    const c = (this.yakalama ??= document.createElement("canvas"));
    c.width = Math.round(v.videoWidth * olcek);
    c.height = Math.round(v.videoHeight * olcek);
    c.getContext("2d")?.drawImage(v, 0, 0, c.width, c.height);
    return c;
  }

  /** Tüm kamera kaynaklarını serbest bırakır. */
  kapat(): void {
    this.akim?.getTracks().forEach((t) => t.stop());
    this.akim = null;
    if (this.video) {
      this.video.pause();
      this.video.srcObject = null;
    }
    this.video = null;
    this.yakalama = null;
    cihazDurumuBildir({ kamera: "kapali", kameraNedeni: "" });
  }
}

/** Android Chrome'da uygulama ayarlarını açan intent. Diğer platformlarda yönerge gösterilir. */
export function izinAyarlariniAc(): Sonuc<string> {
  const ua = navigator.userAgent;
  if (!/Android/i.test(ua)) {
    return basarisiz(
      hata(
        "ayar_acilamadi",
        "Sistem ayarları bu cihazdan doğrudan açılamıyor.",
        "Tarayıcı adres çubuğundaki kilit simgesine dokunup Kamera iznini 'İzin ver' yapın.",
        false,
      ),
    );
  }
  const paket = /EdgA/.test(ua) ? "com.microsoft.emmx" : /SamsungBrowser/.test(ua) ? "com.sec.android.app.sbrowser" : /OPR/.test(ua) ? "com.opera.browser" : /Firefox/.test(ua) ? "org.mozilla.firefox" : "com.android.chrome";
  window.location.href = `intent:#Intent;action=android.settings.APPLICATION_DETAILS_SETTINGS;data=package:${paket};end`;
  return basarili("Ayarlar açılıyor.");
}
