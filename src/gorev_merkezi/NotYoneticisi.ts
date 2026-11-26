// Not oluşturma, listeleme, arama ve silme.
import { yeniKimlik, turkceKucuk } from "@/ortak/yardimci/yardimcilar";
import { basarili, basarisiz, hata } from "@/ortak/hata/hataYardimcilari";
import { notDeposu } from "@/veri/depo/NotDeposu";
import type { Not, Sonuc } from "@/veri/model/tipler";

export function notEkle(metin: string, kaynak: Not["kaynak"] = "metin"): Sonuc<Not> {
  const temiz = metin.trim();
  if (!temiz) return basarisiz(hata("not_bos", "Boş not kaydedilemez.", "Notun içeriğini yazın veya söyleyin.", false));
  const not: Not = { id: yeniKimlik(), metin: temiz, olusturma: Date.now(), kaynak };
  notDeposu.ata((o) => [not, ...o]);
  return basarili(not);
}

export const notlariListele = (): Not[] => notDeposu.al();

export function notAra(sorgu: string): Not[] {
  const q = turkceKucuk(sorgu.trim());
  return q ? notDeposu.al().filter((n) => turkceKucuk(n.metin).includes(q)) : notDeposu.al();
}

export const sonNot = (): Not | undefined => notDeposu.al()[0];

export function notSil(id: string): void {
  notDeposu.ata((o) => o.filter((n) => n.id !== id));
}

export function notSabitle(id: string): void {
  notDeposu.ata((o) =>
    o.map((n) => (n.id === id ? { ...n, sabit: !n.sabit } : n))
      .sort((a, b) => Number(Boolean(b.sabit)) - Number(Boolean(a.sabit))),
  );
}

export function notlariTemizle(): void {
  notDeposu.ata([]);
}
