// Mikrofon, kamera ve yapay zekâ bağlantı durumunun uygulama genelinde paylaşıldığı küçük depo.
// Sistem monitörü bu durumları kullanıcıya görünür biçimde gösterir.
import { kaliciDepo, useDepo } from "@/ortak/yardimci/kaliciDepo";
import type { BaglantiDurumu } from "@/veri/model/tipler";

export type DonanimDurumu = "kapali" | "izin_bekleniyor" | "hazirlaniyor" | "aktif" | "reddedildi" | "desteklenmiyor";

export interface CihazDurumu {
  mikrofon: DonanimDurumu;
  kamera: DonanimDurumu;
  kameraNedeni: string;
  yapayZeka: BaglantiDurumu;
}

export const cihazDurumDeposu = kaliciDepo<CihazDurumu>(
  "akrep.cihaz",
  {
    mikrofon: "kapali",
    kamera: "kapali",
    kameraNedeni: "",
    yapayZeka: { kod: "yerel", mesaj: "Yerel komut modu" },
  },
  false,
);

export function cihazDurumuBildir(kismi: Partial<CihazDurumu>): void {
  cihazDurumDeposu.ata((o) => ({ ...o, ...kismi }));
}

export function useCihazDurumu(): CihazDurumu {
  return useDepo(cihazDurumDeposu);
}

export const DONANIM_ETIKET: Record<DonanimDurumu, string> = {
  kapali: "Kapalı",
  izin_bekleniyor: "İzin bekleniyor",
  hazirlaniyor: "Hazırlanıyor",
  aktif: "Aktif",
  reddedildi: "İzin reddedildi",
  desteklenmiyor: "Desteklenmiyor",
};
