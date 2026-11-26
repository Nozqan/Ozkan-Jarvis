// Komut yönlendirici: önce YEREL motor; yalnızca çözülemeyen komutlar ve yalnızca kullanıcı izin verdiyse harici yapay zekâya gider.
import type { Ayarlar, UygulamaHatasi, YapayZekaIstegi } from "@/veri/model/tipler";
import type { GezinmeHedefi } from "@/gezinme/GezinmeTipleri";
import { saglayiciOlustur } from "./SaglayiciFabrikasi";
import { INTERNET_GEREKLI_METNI, type YerelKomutMotoru } from "./YerelKomutMotoru";

export interface YonlendirmeSonucu {
  metin: string;
  kaynak: "yerel" | "yapay_zeka" | "sistem";
  hata?: UygulamaHatasi;
  gezinti?: GezinmeHedefi;
}

export class KomutYonlendirici {
  constructor(
    private motor: YerelKomutMotoru,
    private ayarAl: () => Ayarlar,
    private cevrimiciMi: () => boolean,
    private gecmisAl: () => YapayZekaIstegi["gecmis"],
  ) {}

  async yonlendir(komut: string): Promise<YonlendirmeSonucu> {
    const yerel = await this.motor.calistir(komut);
    if (yerel.tur === "yanit") return { metin: yerel.metin, kaynak: "yerel", gezinti: yerel.gezinti };
    if (yerel.tur === "hata") return { metin: `${yerel.hata.mesaj} ${yerel.hata.oneri}`, kaynak: "yerel", hata: yerel.hata };
    if (yerel.tur === "internet_gerekli") return { metin: yerel.metin, kaynak: "sistem" };

    // Yerelde çözülemedi.
    const ayar = this.ayarAl();
    if (ayar.saglayici === "yerel") {
      return {
        metin: "Bu komutu yerel komutlarla çözemedim. Harici yapay zekâ seçili değil; 'yardım' diyerek yerel komutları öğrenebilir veya Ayarlar'dan OpenAI ya da Gemini ekleyebilirsiniz.",
        kaynak: "sistem",
      };
    }
    if (!ayar.hariciVeriIzni) {
      return {
        metin: "Bu komutu yerel olarak çözemedim. Harici yapay zekâya veri gönderme izni kapalı olduğu için komutu göndermedim. İzni Ayarlar'dan açabilirsiniz.",
        kaynak: "sistem",
      };
    }
    if (!this.cevrimiciMi()) return { metin: INTERNET_GEREKLI_METNI, kaynak: "sistem" };

    const sonuc = await saglayiciOlustur(ayar, this.motor).yanitOlustur({ komut, gecmis: this.gecmisAl() });
    if (sonuc.basarili) return { metin: sonuc.deger.metin, kaynak: "yapay_zeka" };
    return { metin: `${sonuc.hata.mesaj} ${sonuc.hata.oneri}`, kaynak: "sistem", hata: sonuc.hata };
  }
}
