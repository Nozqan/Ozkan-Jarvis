// Türkçe metin okuma (TTS). En doğal tr-TR sesi seçer; kaynaklar ekran kapanınca/sayfa gizlenince serbest bırakılır.
// Not: Tarayıcı TTS ses çıkışına doğrudan erişim vermez; Güneş HUD titreşimi kelime sınırı olaylarından türetilir.
import { sesGorsellestirici } from "@/gunes_hud/SesGorsellestirici";

export interface KonusmaSecenekleri {
  hiz: number;
  ton: number;
}

export class TurkceMetinSeslendirici {
  private konusuyor = false;
  private sonSinir = 0;
  private yedekZamanlayici: ReturnType<typeof setInterval> | null = null;
  private sayac = 0;

  constructor() {
    if (typeof document !== "undefined") {
      document.addEventListener("visibilitychange", this.gizlenince);
      window.addEventListener("pagehide", this.durdur);
    }
  }

  static destekleniyor(): boolean {
    return typeof window !== "undefined" && "speechSynthesis" in window && "SpeechSynthesisUtterance" in window;
  }

  private gizlenince = () => {
    if (document.hidden) this.durdur();
  };

  /** En doğal Türkçe sesi seçer: yerel/nöral ve bilinen kaliteli sesler öncelikli. */
  static sesSec(): SpeechSynthesisVoice | undefined {
    const sesler = speechSynthesis.getVoices().filter((s) => s.lang.toLowerCase().replace("_", "-").startsWith("tr"));
    if (!sesler.length) return undefined;
    const puan = (s: SpeechSynthesisVoice) =>
      (/neural|online|natural/i.test(s.name) ? 4 : 0) +
      (/emel|yelda|filiz|google/i.test(s.name) ? 2 : 0) +
      (s.lang.toLowerCase().replace("_", "-") === "tr-tr" ? 1 : 0);
    return sesler.sort((a, b) => puan(b) - puan(a))[0];
  }

  get aktif(): boolean {
    return this.konusuyor;
  }

  /** Metni cümle cümle okur (uzun metinlerde Chrome'un durma hatasını önler). */
  konus(metin: string, sec: KonusmaSecenekleri, olaylar?: { basladi?: () => void; bitti?: () => void }): Promise<void> {
    return new Promise((coz) => {
      if (!TurkceMetinSeslendirici.destekleniyor()) {
        coz();
        return;
      }
      this.durdur();
      const parcalar = (metin.replace(/\s+/g, " ").match(/[^.!?;:\n]+[.!?;:]?/g) ?? [metin])
        .map((p) => p.trim())
        .filter(Boolean)
        .flatMap((p) => (p.length > 200 ? (p.match(/.{1,200}(\s|$)/g) ?? [p]) : [p]));
      const benim = ++this.sayac;
      const ses = TurkceMetinSeslendirici.sesSec();
      let i = 0;
      const bitir = () => {
        if (benim !== this.sayac) return;
        this.yedekiDurdur();
        this.konusuyor = false;
        olaylar?.bitti?.();
        coz();
      };
      const sonraki = () => {
        if (benim !== this.sayac) return;
        if (i >= parcalar.length) return bitir();
        const u = new SpeechSynthesisUtterance(parcalar[i++]);
        u.lang = "tr-TR";
        if (ses) u.voice = ses;
        u.rate = sec.hiz;
        u.pitch = sec.ton;
        u.onstart = () => {
          if (!this.konusuyor) {
            this.konusuyor = true;
            this.yedekBaslat();
            olaylar?.basladi?.();
          }
        };
        u.onboundary = () => {
          this.sonSinir = performance.now();
          sesGorsellestirici.darbe(0.55 + Math.random() * 0.35);
        };
        u.onend = sonraki;
        u.onerror = (e) => {
          if (e.error === "canceled" || e.error === "interrupted") return;
          bitir();
        };
        speechSynthesis.speak(u);
      };
      sonraki();
    });
  }

  /** Sınır olayı göndermeyen seslerde (ör. bazı ağ sesleri) hafif konuşma titreşimi sürdürür. */
  private yedekBaslat() {
    this.sonSinir = performance.now();
    this.yedekZamanlayici = setInterval(() => {
      if (performance.now() - this.sonSinir > 350) sesGorsellestirici.darbe(0.3 + Math.random() * 0.3);
    }, 140);
  }
  private yedekiDurdur() {
    if (this.yedekZamanlayici) clearInterval(this.yedekZamanlayici);
    this.yedekZamanlayici = null;
  }

  durdur = () => {
    if (!TurkceMetinSeslendirici.destekleniyor()) return;
    const calisiyordu = this.konusuyor;
    this.sayac++; // Bekleyen parçaların devamını iptal eder.
    speechSynthesis.cancel();
    this.yedekiDurdur();
    this.konusuyor = false;
    if (calisiyordu) sesGorsellestirici.sifirla();
  };

  /** Bileşen kaldırılırken tüm kaynakları serbest bırakır. */
  yokEt(): void {
    this.durdur();
    document.removeEventListener("visibilitychange", this.gizlenince);
    window.removeEventListener("pagehide", this.durdur);
  }
}
