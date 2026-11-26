// Mikrofon izni ve (destekleniyorsa) ses seviyesi analizi. Ses KAYDEDİLMEZ; yalnızca anlık seviye hesaplanır.
import { basarili, basarisiz, cihazHatasiniCevir } from "@/ortak/hata/hataYardimcilari";
import type { Sonuc } from "@/veri/model/tipler";
import { sesGorsellestirici } from "@/gunes_hud/SesGorsellestirici";
import { cihazDurumuBildir } from "@/sistem_izleyici/CihazDurumu";

export class MikrofonYoneticisi {
  private akim: MediaStream | null = null;
  private baglam: AudioContext | null = null;
  private zamanlayici: ReturnType<typeof setInterval> | null = null;

  static destekleniyor(): boolean {
    return !!navigator.mediaDevices?.getUserMedia;
  }

  /**
   * İzni ister. analizEt=false ise izin alındıktan sonra akış hemen kapatılır
   * (Android'de konuşma tanıma ile mikrofon çakışmasını önlemek için).
   */
  async baslat(analizEt: boolean): Promise<Sonuc<true>> {
    if (!MikrofonYoneticisi.destekleniyor()) {
      cihazDurumuBildir({ mikrofon: "desteklenmiyor" });
      return basarisiz({
        kod: "mikrofon_desteklenmiyor",
        mesaj: "Bu tarayıcı mikrofon erişimini desteklemiyor.",
        oneri: "Chrome ile HTTPS üzerinden açın veya komutları metinle girin.",
        tekrarDenenebilir: false,
      });
    }
    cihazDurumuBildir({ mikrofon: "izin_bekleniyor" });
    try {
      this.akim = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true }, video: false });
    } catch (e) {
      const h = cihazHatasiniCevir(e, "mikrofon");
      cihazDurumuBildir({ mikrofon: h.kod === "mikrofon_izin_yok" ? "reddedildi" : "kapali" });
      return basarisiz(h);
    }
    if (!analizEt) {
      this.durdur(false);
      // Mikrofon artık yalnızca konuşma tanıma tarafından kullanılıyor; kullanıcıya "aktif" olarak gösterilir.
      cihazDurumuBildir({ mikrofon: "aktif" });
      return basarili(true);
    }
    try {
      const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.baglam = new AC();
      const kaynak = this.baglam.createMediaStreamSource(this.akim);
      const analiz = this.baglam.createAnalyser();
      analiz.fftSize = 256;
      analiz.smoothingTimeConstant = 0.6;
      kaynak.connect(analiz); // Çıkışa bağlanmaz: kullanıcı kendi sesini duymaz, kayıt yapılmaz.
      const zaman = new Uint8Array(analiz.fftSize);
      const frekans = new Uint8Array(analiz.frequencyBinCount);
      this.zamanlayici = setInterval(() => {
        analiz.getByteTimeDomainData(zaman);
        let toplam = 0;
        for (let i = 0; i < zaman.length; i++) {
          const v = (zaman[i] - 128) / 128;
          toplam += v * v;
        }
        const rms = Math.sqrt(toplam / zaman.length);
        analiz.getByteFrequencyData(frekans);
        const ort = (a: number, b: number) => {
          let t = 0;
          for (let i = a; i < b; i++) t += frekans[i];
          return t / (b - a) / 255;
        };
        const n = frekans.length;
        sesGorsellestirici.girdi(Math.min(1, rms * 5), [ort(0, n / 8) * 1.4, ort(n / 8, n / 3) * 1.8, ort(n / 3, n * 0.7) * 2.4]);
      }, 33);
    } catch {
      // Analiz kurulamadıysa izin yine de alınmıştır; görselleştirme olay tabanlı vuruşlara döner.
    }
    cihazDurumuBildir({ mikrofon: "aktif" });
    return basarili(true);
  }

  durdur(durumuGuncelle = true): void {
    if (this.zamanlayici) clearInterval(this.zamanlayici);
    this.zamanlayici = null;
    this.akim?.getTracks().forEach((t) => t.stop());
    this.akim = null;
    this.baglam?.close().catch(() => {});
    this.baglam = null;
    if (durumuGuncelle) {
      sesGorsellestirici.sifirla();
      cihazDurumuBildir({ mikrofon: "kapali" });
    }
  }
}
