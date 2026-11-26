// Sistem monitöründe gösterilen yapay zekâ bağlantı durumunu ayarlardan hesaplar (ağ çağrısı yapmaz).
import type { Ayarlar, BaglantiDurumu } from "@/veri/model/tipler";

export function yapayZekaDurumuHesapla(a: Ayarlar, anahtarVar: boolean, cevrimici: boolean): BaglantiDurumu {
  if (a.saglayici === "yerel") return { kod: "yerel", mesaj: "Yerel komut modu" };
  if (!anahtarVar) return { kod: "anahtar_yok", mesaj: "API anahtarı yok" };
  if (!a.hariciVeriIzni) return { kod: "izin_yok", mesaj: "Harici veri izni kapalı" };
  if (!cevrimici) return { kod: "cevrimdisi", mesaj: "Çevrimdışı" };
  return { kod: "bagli_degil", mesaj: "Hazır (bağlantı test edilmedi)" };
}
