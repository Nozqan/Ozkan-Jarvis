// İsteğe bağlı yapay zekâ sohbet geçmişi. Yalnızca ayarlardan açıldıysa kaydedilir.
import { kaliciDepo } from "@/ortak/yardimci/kaliciDepo";
import { yeniKimlik } from "@/ortak/yardimci/yardimcilar";
import type { SohbetMesaji } from "@/veri/model/tipler";

export const sohbetDeposu = kaliciDepo<SohbetMesaji[]>("akrep.sohbet", []);

export function sohbetEkle(m: Omit<SohbetMesaji, "id" | "tarih">): void {
  sohbetDeposu.ata((o) => [...o, { ...m, id: yeniKimlik(), tarih: Date.now() }].slice(-300));
}

export function sohbetTemizle(): void {
  sohbetDeposu.ata([]);
}
