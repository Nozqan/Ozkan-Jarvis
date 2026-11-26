// Kamera tarama arşivi (OCR / nesne / ortam / jest). Yalnızca METİN sonuçlar saklanır; kamera görüntüsü saklanmaz.
import { kaliciDepo } from "@/ortak/yardimci/kaliciDepo";
import { yeniKimlik, turkceKucuk } from "@/ortak/yardimci/yardimcilar";
import type { ArsivKaydi, ArsivTuru } from "@/veri/model/tipler";

export const arsivDeposu = kaliciDepo<ArsivKaydi[]>("akrep.arsiv", []);

export function arsivle(k: Omit<ArsivKaydi, "id" | "tarih">): ArsivKaydi {
  const kayit: ArsivKaydi = { ...k, id: yeniKimlik(), tarih: Date.now() };
  arsivDeposu.ata((o) => [kayit, ...o].slice(0, 500));
  return kayit;
}

export interface ArsivFiltresi {
  sorgu?: string;
  tur?: ArsivTuru | "hepsi";
  baslangic?: number;
  bitis?: number;
}

/** Gelişmiş arşiv arama: metin (Türkçe büyük/küçük harf duyarsız), tür ve tarih aralığı. */
export function arsivAra(f: ArsivFiltresi = {}): ArsivKaydi[] {
  const q = f.sorgu ? turkceKucuk(f.sorgu.trim()) : "";
  return arsivDeposu.al().filter((k) => {
    if (f.tur && f.tur !== "hepsi" && k.tur !== f.tur) return false;
    if (f.baslangic && k.tarih < f.baslangic) return false;
    if (f.bitis && k.tarih > f.bitis) return false;
    if (q && !turkceKucuk(`${k.baslik} ${k.metin}`).includes(q)) return false;
    return true;
  });
}

export function arsivSil(id: string): void {
  arsivDeposu.ata((o) => o.filter((k) => k.id !== id));
}

export function arsivTemizle(): void {
  arsivDeposu.ata([]);
}
