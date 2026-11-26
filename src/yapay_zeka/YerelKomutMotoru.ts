// Çevrimdışı yerel komut motoru: internet olmadan gerçek işlemleri yapar.
// Anlamadığı komutta ASLA sahte başarı mesajı vermez → "anlasilamadi" döner.
import { asciiyeCevir, sonucMetni, turkcedenHesapla } from "@/gorev_merkezi/HesapMakinesi";
import { notEkle, notlariListele, notSil, sonNot } from "@/gorev_merkezi/NotYoneticisi";
import { hatirlaticiOlustur, sureyiMsYap } from "@/gorev_merkezi/HatirlaticiYoneticisi";
import { feneriAc, feneriKapat } from "@/canli_kamera/FeneriYoneticisi";
import { agMetni, bataryaMetni, bellekMetni, depolamaMetni } from "@/sistem_izleyici/DurumMetinleri";
import { anlikDurum } from "@/sistem_izleyici/SistemIzleyici";
import { tarihSaat } from "@/ortak/yardimci/yardimcilar";
import type { UygulamaHatasi } from "@/veri/model/tipler";
import type { GezinmeHedefi } from "@/gezinme/GezinmeTipleri";

export const INTERNET_GEREKLI_METNI = "Bu bilgi için internet bağlantısı gerekiyor. Şu anda çevrimdışı yerel komut modundayım.";

export interface KomutBaglami {
  gezin(hedef: GezinmeHedefi): void;
  cevrimiciMi(): boolean;
  /** Mikrofon/kamera/yapay zekâ gibi uygulama içi durumların özeti. */
  uygulamaOzeti(): string;
}

export type YerelSonuc =
  | { tur: "yanit"; metin: string; gezinti?: GezinmeHedefi }
  | { tur: "hata"; metin: string; hata: UygulamaHatasi }
  | { tur: "internet_gerekli"; metin: string }
  | { tur: "anlasilamadi" };

// İnternet gerektiren bilgi istekleri (canlı veri). Yerelde çözülemez.
const INTERNET_KALIPLARI =
  /hava durumu|hava nasil|hava kac|havalar|dolar|euro|doviz|borsa|bitcoin|altin fiyat|haberler|son dakika|mac sonuc|trafik durumu|kimdir|internetten ara|google/;

const SAYI_KELIMELERI: Record<string, number> = {
  bir: 1, iki: 2, uc: 3, dort: 4, bes: 5, alti: 6, yedi: 7, sekiz: 8, dokuz: 9, on: 10, yirmi: 20, otuz: 30, kirk: 40, elli: 50, yarim: 0.5,
};

const YARDIM_METNI =
  "Çevrimdışı şunları yapabilirim: feneri aç veya kapat, batarya, depolama, bellek ve ağ durumunu söylemek, sistem durumu raporu, " +
  "not al, son notu göster, notlarımı listele, hesaplama yapmak, saat ve tarih söylemek, 10 dakika sonra su iç diye hatırlat, " +
  "kamerayı, görev merkezini veya ayarları açmak.";

export class YerelKomutMotoru {
  constructor(private baglam: KomutBaglami) {}

  async calistir(ham: string): Promise<YerelSonuc> {
    let orijinal = ham.trim();
    let s = asciiyeCevir(orijinal);
    // Uyandırma kelimesi komutun başındaysa at.
    const uyandirma = s.match(/^(jarvis|akrep)\b[\s,:;-]*/);
    if (uyandirma) {
      orijinal = orijinal.slice(uyandirma[0].length);
      s = s.slice(uyandirma[0].length);
    }
    s = s.replace(/\s+/g, " ").trim();
    orijinal = orijinal.replace(/\s+/g, " ").trim();

    if (!s) return { tur: "yanit", metin: "Dinliyorum. Komutunuzu söyleyin veya yazın." };

    // ---- 1) Not oluşturma (komutun başında "not" geçiyorsa; içerik başka komutlarla karışmasın)
    const diyeNot = s.match(/^(.+?)\s+diye\s+not\s+(al|yaz|ekle|olustur|kaydet)\b/);
    if (diyeNot) return this.notOlustur(orijinal.slice(0, diyeNot[1].length));
    const notBas = s.match(/^(?:yeni\s+)?not\b(?!\s*defter)\s*(?:(?:al|yaz|ekle|olustur|kaydet)\b)?\s*[:,-]?\s*/);
    if (notBas && !/^not\s+(sil|goster|oku|listele)/.test(s)) {
      return this.notOlustur(orijinal.slice(notBas[0].length));
    }

    // ---- 2) İnternet gerektiren canlı bilgiler
    if (INTERNET_KALIPLARI.test(s)) {
      return this.baglam.cevrimiciMi()
        ? { tur: "anlasilamadi" } // Çevrimiçi: yönlendirici, izin varsa yapay zekâya gönderir.
        : { tur: "internet_gerekli", metin: INTERNET_GEREKLI_METNI };
    }

    // ---- 3) Notları göster / sil
    if (/son not(u)? sil|notu sil/.test(s)) {
      const son = sonNot();
      if (!son) return { tur: "yanit", metin: "Silinecek not yok." };
      notSil(son.id);
      return { tur: "yanit", metin: `Son notu sildim: "${son.metin}".` };
    }
    if (/son not|en son not|notumu (goster|oku)|notu (goster|oku)/.test(s)) {
      const son = sonNot();
      return {
        tur: "yanit",
        metin: son ? `Son notunuz, ${tarihSaat(son.olusturma)} tarihli: ${son.metin}` : "Henüz kayıtlı bir notunuz yok.",
      };
    }
    if (/notlarim|notlari (listele|goster|oku)|tum notlar|kac notum/.test(s)) {
      const l = notlariListele();
      if (!l.length) return { tur: "yanit", metin: "Henüz kayıtlı bir notunuz yok." };
      const ilk = l.slice(0, 5).map((n, i) => `${i + 1}. ${n.metin}`).join(" ");
      return { tur: "yanit", metin: `Toplam ${l.length} notunuz var. ${l.length > 5 ? "Son beşi: " : ""}${ilk}` };
    }

    // ---- 4) Hatırlatıcı
    if (/hatirla/.test(s)) return this.hatirlaticiKur(orijinal, s);

    // ---- 5) Fener
    if (/\bfener|\bflas\b|\bisigi\b/.test(s)) {
      if (/\b(kapat|kapatin|kapatir|kapa|sondur|sonduru)\b/.test(s)) {
        const r = feneriKapat();
        return r.basarili ? { tur: "yanit", metin: r.deger } : { tur: "hata", metin: r.hata.mesaj, hata: r.hata };
      }
      if (/\b(ac|acin|acar|yak|yakin|yakar|calistir)\b/.test(s)) {
        const r = await feneriAc();
        return r.basarili ? { tur: "yanit", metin: r.deger } : { tur: "hata", metin: r.hata.mesaj, hata: r.hata };
      }
      return { tur: "yanit", metin: "Feneri açmamı mı kapatmamı mı istersiniz? Örneğin: feneri aç." };
    }

    // ---- 6) Sistem durumu
    if (/sistem durumu|genel durum|durum raporu|cihaz durumu/.test(s)) {
      const d = await anlikDurum();
      return { tur: "yanit", metin: [bataryaMetni(d), depolamaMetni(d), bellekMetni(d), agMetni(d)].join(" ") };
    }
    if (/batarya|sarj|pil\b/.test(s)) return { tur: "yanit", metin: bataryaMetni(await anlikDurum()) };
    if (/depolama|disk|hafiza alani/.test(s)) return { tur: "yanit", metin: depolamaMetni(await anlikDurum()) };
    if (/bellek|\bram\b/.test(s)) return { tur: "yanit", metin: bellekMetni(await anlikDurum()) };
    if (/uygulama durumu|jarvis durumu|durumun ne/.test(s)) {
      return {
        tur: "yanit",
        metin: `${this.baglam.uygulamaOzeti()} Kayıtlı not sayısı ${notlariListele().length}.`,
      };
    }
    if (/\bag\b|internet|baglanti|wifi|wi-fi|ag durumu/.test(s)) return { tur: "yanit", metin: agMetni(await anlikDurum()) };

    // ---- 7) Hesaplama
    const hesap = turkcedenHesapla(orijinal);
    if (hesap) return { tur: "yanit", metin: `Sonuç ${sonucMetni(hesap.sonuc)}.` };

    // ---- 8) Gezinme
    if (/not defter|gorev merkezi|gorevler|hatirlaticilar|arsiv/.test(s)) {
      return { tur: "yanit", metin: "Görev merkezini açıyorum.", gezinti: "gorev" };
    }
    if (/kamera|tarama ekrani|tarayici/.test(s) && /(ac|goster|baslat|git|ekran|tara)/.test(s)) {
      return { tur: "yanit", metin: "Kamera ekranını açıyorum.", gezinti: "kamera" };
    }
    if (/gizlilik/.test(s)) return { tur: "yanit", metin: "Gizlilik ekranını açıyorum.", gezinti: "gizlilik" };
    if (/ayar/.test(s) && /(ac|goster|git|baslat|ekran|ayarlar)/.test(s)) {
      return { tur: "yanit", metin: "Ayarları açıyorum.", gezinti: "ayarlar" };
    }
    if (/ana ekran|hud|ana sayfa/.test(s) && /(ac|git|don)/.test(s)) return { tur: "yanit", metin: "Ana HUD'a dönüyorum.", gezinti: "hud" };

    // ---- 9) Saat, tarih, kimlik, yardım
    if (/saat kac|saati soyle|su an saat/.test(s)) {
      return { tur: "yanit", metin: `Saat ${new Date().toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}.` };
    }
    if (/tarih|bugun gunlerden|hangi gun|ayin kaci/.test(s)) {
      return {
        tur: "yanit",
        metin: `Bugün ${new Date().toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric", weekday: "long" })}.`,
      };
    }
    if (/yardim|neler yapabilirsin|komutlar|ne yapabilirsin/.test(s)) return { tur: "yanit", metin: YARDIM_METNI };
    if (/kimsin|adin ne|seni kim yapti|kim gelistirdi/.test(s)) {
      return { tur: "yanit", metin: "Ben AKREP JARVIS. Geliştiricim Nebi Özkan." };
    }
    if (/^(merhaba|selam|gunaydin|iyi aksamlar|iyi geceler|naber)\b/.test(s)) {
      return { tur: "yanit", metin: "Merhaba Nebi, sizi dinliyorum. Ne yapmamı istersiniz?" };
    }
    if (/tesekkur|sag ol/.test(s)) return { tur: "yanit", metin: "Rica ederim." };

    return { tur: "anlasilamadi" };
  }

  private notOlustur(icerik: string): YerelSonuc {
    const temiz = icerik.replace(/^[:,\-\s]+/, "").trim();
    if (!temiz) return { tur: "yanit", metin: "Notun içeriğini de söyler misiniz? Örneğin: not al, yarın süt al." };
    const r = notEkle(temiz, "komut");
    return r.basarili ? { tur: "yanit", metin: `Notu kaydettim: ${r.deger.metin}` } : { tur: "hata", metin: r.hata.mesaj, hata: r.hata };
  }

  private async hatirlaticiKur(orijinal: string, s: string): Promise<YerelSonuc> {
    const silinecek: [number, number][] = [];
    let zaman: number | null = null;
    let zamanMetni = "";

    const mutlak = s.match(/saat\s*(\d{1,2})\s*[:.]\s*(\d{2})/);
    const goreli = s.match(/(\d+(?:[.,]\d+)?|bir|iki|uc|dort|bes|alti|yedi|sekiz|dokuz|on|yirmi|otuz|kirk|elli|yarim)\s*(saat|dakika|dk|saniye|sn)\b\s*(sonra)?/);
    if (goreli && goreli.index != null) {
      const ham = goreli[1];
      const miktar = /^\d/.test(ham) ? Number(ham.replace(",", ".")) : SAYI_KELIMELERI[ham];
      const birim = goreli[2] === "dk" ? "dakika" : goreli[2] === "sn" ? "saniye" : (goreli[2] as "saat" | "dakika" | "saniye");
      zaman = Date.now() + sureyiMsYap(miktar, birim);
      zamanMetni = `${ham.match(/^\d/) ? ham : miktar} ${birim} sonra`;
      silinecek.push([goreli.index, goreli.index + goreli[0].length]);
    } else if (mutlak && mutlak.index != null) {
      const sa = Number(mutlak[1]);
      const dk = Number(mutlak[2]);
      if (sa < 24 && dk < 60) {
        const d = new Date();
        d.setHours(sa, dk, 0, 0);
        if (d.getTime() <= Date.now()) d.setDate(d.getDate() + 1);
        zaman = d.getTime();
        zamanMetni = `saat ${String(sa).padStart(2, "0")}:${String(dk).padStart(2, "0")}'da`;
        silinecek.push([mutlak.index, mutlak.index + mutlak[0].length]);
      }
    }
    if (zaman == null) {
      return { tur: "yanit", metin: "Ne zaman hatırlatayım? Örneğin: 10 dakika sonra su iç diye hatırlat." };
    }
    for (const m of s.matchAll(/\b(bana|diye|lutfen|hatirla\w*|da|de)\b/g)) {
      if (m.index != null) silinecek.push([m.index, m.index + m[0].length]);
    }
    const maske = new Array(orijinal.length).fill(true);
    silinecek.forEach(([a, b]) => {
      for (let i = a; i < b && i < maske.length; i++) maske[i] = false;
    });
    const mesaj = [...orijinal].filter((_, i) => maske[i]).join("").replace(/\s+/g, " ").replace(/^[\s,.:;-]+|[\s,.:;-]+$/g, "");
    const r = await hatirlaticiOlustur(mesaj || "Hatırlatıcı", zaman);
    if (!r.basarili) return { tur: "hata", metin: r.hata.mesaj, hata: r.hata };
    const ek =
      r.deger.bildirim === "izinli"
        ? ""
        : " Bildirim izni olmadığı için uygulama açıkken sesli ve ekranda uyaracağım.";
    return { tur: "yanit", metin: `Tamam, ${zamanMetni} "${r.deger.hatirlatici.metin}" diye hatırlatacağım.${ek}` };
  }
}
