// Kullanıcı ayarları (DataStore karşılığı): kalıcı, reaktif ve varsayılanlarla otomatik tamamlanan depo.
import { kaliciDepo, useDepo } from "@/ortak/yardimci/kaliciDepo";
import type { Ayarlar } from "@/veri/model/tipler";

export const VARSAYILAN_AYARLAR: Ayarlar = {
  saglayici: "yerel",
  openaiUcNokta: "https://api.openai.com/v1",
  openaiModel: "gpt-4o-mini",
  geminiUcNokta: "https://generativelanguage.googleapis.com/v1beta",
  geminiModel: "gemini-2.5-flash",
  hariciVeriIzni: false,
  sesliYanit: true,
  sesHizi: 1,
  sesTonu: 1,
  uyandirmaKelimesi: false,
  performans: "otomatik",
  hareketAzalt: false,
  tamAcilis: false,
  sohbetGecmisiniSakla: false,
  acilisGorulduMu: false,
  kullanimProfili: "dengeli",
  vurguRengi: "gunes",
  ozellikRehberiGorulduMu: false,
};

export const ayarDeposu = kaliciDepo<Ayarlar>("akrep.ayarlar", VARSAYILAN_AYARLAR);

export function useAyarlar(): Ayarlar {
  return useDepo(ayarDeposu);
}

export function ayarGuncelle(kismi: Partial<Ayarlar>): void {
  ayarDeposu.ata((o) => ({ ...o, ...kismi }));
}
