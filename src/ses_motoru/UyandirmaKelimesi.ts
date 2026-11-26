// Uyandırma kelimeleri: "Jarvis" ve "Akrep". Tanıma hatalarına karşı yaygın yanlış yazımlar da kabul edilir.
import { asciiyeCevir } from "@/gorev_merkezi/HesapMakinesi";

const KALIP = /\b(jarvis|jarvıs|carvis|cervis|jarvi|jarwis|akrep|akreb)\b/;

/** Metinde uyandırma kelimesi varsa, ondan SONRAKİ kısmı komut olarak döndürür. */
export function uyandirmaAyikla(metin: string): { bulundu: boolean; komut: string } {
  const ascii = asciiyeCevir(metin);
  const m = ascii.match(KALIP);
  if (!m || m.index == null) return { bulundu: false, komut: "" };
  const komut = metin.slice(m.index + m[0].length).replace(/^[\s,.:;!?-]+/, "").trim();
  return { bulundu: true, komut };
}
