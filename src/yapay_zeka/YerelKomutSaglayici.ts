// Yerel komut motorunu da aynı sağlayıcı arayüzüyle sunar; ileride yeni sağlayıcılar aynı şekilde eklenebilir.
import { basarili, basarisiz, hata } from "@/ortak/hata/hataYardimcilari";
import type { BaglantiDurumu, Sonuc, YapayZekaIstegi, YapayZekaYaniti } from "@/veri/model/tipler";
import type { YapayZekaSaglayici } from "./YapayZekaSaglayici";
import type { YerelKomutMotoru } from "./YerelKomutMotoru";

export class YerelKomutSaglayici implements YapayZekaSaglayici {
  constructor(private motor: YerelKomutMotoru) {}

  async yanitOlustur(istek: YapayZekaIstegi): Promise<Sonuc<YapayZekaYaniti>> {
    const s = await this.motor.calistir(istek.komut);
    if (s.tur === "yanit" || s.tur === "internet_gerekli") return basarili({ metin: s.metin, saglayici: "Yerel komut motoru" });
    if (s.tur === "hata") return basarisiz(s.hata);
    return basarisiz(hata("yerel_anlasilamadi", "Bu komutu yerel olarak çözemedim.", "'Yardım' diyerek yerel komutları öğrenin veya harici yapay zekâ ekleyin.", false));
  }

  async baglantiKontrolu(): Promise<BaglantiDurumu> {
    return { kod: "yerel", mesaj: "Yerel komut modu (internet gerekmez)" };
  }
}
