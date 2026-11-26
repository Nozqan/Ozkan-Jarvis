// Türkçe konuşmadan metne (Web Speech API). Chrome'da ses, tanıma için Google sunucularına gönderilebilir;
// bu durum Gizlilik ekranında açıklanır. Uygulama sesi kaydetmez.
import { hata } from "@/ortak/hata/hataYardimcilari";
import type { UygulamaHatasi } from "@/veri/model/tipler";
import { sesGorsellestirici } from "@/gunes_hud/SesGorsellestirici";

interface TanimaOlayi {
  resultIndex: number;
  results: ArrayLike<ArrayLike<{ transcript: string; confidence: number }> & { isFinal: boolean }>;
}
interface TanimaNesnesi {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((e: TanimaOlayi) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
  onspeechstart: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}
type TanimaKurucu = new () => TanimaNesnesi;

export interface TaniyiciGeriCagrilari {
  araSonuc(metin: string): void;
  sonuc(metin: string): void;
  hata(h: UygulamaHatasi, kalici: boolean): void;
  dinlemeDurumu(aktif: boolean): void;
}

function kurucuAl(): TanimaKurucu | null {
  const w = window as unknown as { SpeechRecognition?: TanimaKurucu; webkitSpeechRecognition?: TanimaKurucu };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export class KonusmaTaniyici {
  private tanima: TanimaNesnesi | null = null;
  private istenen = false; // Kullanıcı dinlemeyi istiyor mu?
  private duraklatildi = false; // TTS konuşurken geçici duraklatma
  private calisiyor = false;
  private yenidenSayac: number[] = [];

  constructor(private gc: TaniyiciGeriCagrilari) {}

  static destekleniyor(): boolean {
    return kurucuAl() !== null;
  }

  get aktif(): boolean {
    return this.istenen;
  }

  baslat(): boolean {
    const K = kurucuAl();
    if (!K) {
      this.gc.hata(
        hata("konusma_desteklenmiyor", "Bu tarayıcı konuşma tanımayı desteklemiyor.", "Chrome veya Edge kullanın ya da komutu metin kutusuna yazın.", false),
        true,
      );
      return false;
    }
    this.istenen = true;
    this.duraklatildi = false;
    this.yenidenSayac = [];
    this.gc.dinlemeDurumu(true);
    this.baslatTanima(K);
    return true;
  }

  private baslatTanima(K: TanimaKurucu): void {
    if (this.calisiyor) return;
    const t = new K();
    t.lang = "tr-TR";
    t.continuous = true;
    t.interimResults = true;
    t.maxAlternatives = 1;
    t.onspeechstart = () => sesGorsellestirici.darbe(0.5);
    t.onresult = (e) => {
      let ara = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        const metin = r[0].transcript;
        if (r.isFinal) {
          if (metin.trim()) this.gc.sonuc(metin.trim());
        } else ara += metin;
      }
      if (ara) {
        sesGorsellestirici.darbe(Math.min(0.85, 0.35 + ara.length / 60)); // ses seviyesi okunamadığında vuruş
        this.gc.araSonuc(ara.trim());
      }
    };
    t.onerror = (e) => {
      switch (e.error) {
        case "no-speech":
        case "aborted":
          return; // Sessizlik: onend'de otomatik yeniden başlar.
        case "not-allowed":
        case "service-not-allowed":
          this.istenen = false;
          this.gc.hata(
            hata("mikrofon_izin_yok", "Mikrofon veya konuşma tanıma izni verilmedi.", "Tarayıcı adres çubuğundaki kilit simgesinden mikrofon iznini açıp tekrar deneyin. Bu arada komutu yazabilirsiniz.", true),
            true,
          );
          break;
        case "audio-capture":
          this.istenen = false;
          this.gc.hata(hata("mikrofon_yok", "Mikrofon bulunamadı veya kullanılamıyor.", "Mikrofonun bağlı ve başka uygulamada kullanılmıyor olduğundan emin olun.", true), true);
          break;
        case "network":
          this.istenen = false;
          this.gc.hata(
            hata("konusma_ag", "Konuşma tanıma servisine ulaşılamadı.", "Tarayıcı konuşmayı çevrimiçi servisle işler. İnternetinizi kontrol edip Tekrar deneyin ya da komutu yazın.", true),
            true,
          );
          break;
        case "language-not-supported":
          this.istenen = false;
          this.gc.hata(hata("dil_yok", "Türkçe konuşma tanıma bu cihazda desteklenmiyor.", "Komutları metin kutusuna yazabilirsiniz.", false), true);
          break;
        default:
          this.gc.hata(hata("konusma_hata", "Konuşma anlaşılamadı.", "Tekrar deneyin veya komutu metinle girin.", true), false);
      }
    };
    t.onend = () => {
      this.calisiyor = false;
      this.tanima = null;
      if (!this.istenen) {
        this.gc.dinlemeDurumu(false);
        return;
      }
      if (this.duraklatildi) return;
      // Hızlı yeniden başlatma döngüsünü engelle.
      const simdi = Date.now();
      this.yenidenSayac = this.yenidenSayac.filter((x) => simdi - x < 4000);
      this.yenidenSayac.push(simdi);
      if (this.yenidenSayac.length > 6) {
        this.istenen = false;
        this.gc.dinlemeDurumu(false);
        this.gc.hata(hata("konusma_dongu", "Dinleme tekrar tekrar kesildi.", "Tekrar deneyin. Sorun sürerse komutu metinle girin.", true), true);
        return;
      }
      setTimeout(() => {
        if (this.istenen && !this.duraklatildi) this.baslatTanima(K);
      }, 250);
    };
    try {
      t.start();
      this.tanima = t;
      this.calisiyor = true;
    } catch {
      this.calisiyor = false;
    }
  }

  /** Jarvis konuşurken kendi sesini duymasın diye geçici durdurur. */
  duraklat(): void {
    if (!this.istenen) return;
    this.duraklatildi = true;
    try {
      this.tanima?.abort();
    } catch {
      /* yoksay */
    }
  }

  surdur(): void {
    const K = kurucuAl();
    if (!this.istenen || !K) return;
    this.duraklatildi = false;
    setTimeout(() => {
      if (this.istenen && !this.duraklatildi) this.baslatTanima(K);
    }, 300);
  }

  durdur(): void {
    this.istenen = false;
    this.duraklatildi = false;
    try {
      this.tanima?.abort();
    } catch {
      /* yoksay */
    }
    this.tanima = null;
    this.calisiyor = false;
    this.gc.dinlemeDurumu(false);
  }
}
