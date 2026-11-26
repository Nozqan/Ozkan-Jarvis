// Sistem verilerini Türkçe metne çevirir. Veri yoksa her zaman "Kullanılamıyor" yazılır (uydurma yok).
import { bayt } from "@/ortak/yardimci/yardimcilar";
import type { SistemDurumu } from "./SistemIzleyici";
import { TUR_ADI } from "./AgIzleyici";

export const KULLANILAMIYOR = "Kullanılamıyor";

export function bataryaMetni(d: SistemDurumu): string {
  const b = d.batarya;
  if (!b.desteklenir || b.yuzde == null) return `Batarya bilgisi ${KULLANILAMIYOR.toLowerCase()} (tarayıcı/cihaz bu veriyi sağlamıyor).`;
  const sarj = b.sarjOluyor == null ? "" : b.sarjOluyor ? ", şarj oluyor" : ", şarj olmuyor";
  return `Batarya yüzde ${b.yuzde}${sarj}. Sıcaklık: ${b.sicaklikC == null ? KULLANILAMIYOR : `${b.sicaklikC} °C`}.`;
}

export function depolamaMetni(d: SistemDurumu): string {
  const s = d.depolama;
  if (!s.desteklenir) return `Depolama bilgisi ${KULLANILAMIYOR.toLowerCase()}.`;
  return `Tarayıcının bu uygulamaya ayırdığı alan: toplam ${bayt(s.toplam)}, kullanılan ${bayt(s.kullanilan)}, boş ${bayt(s.bos)}. Cihazın toplam diski web üzerinden okunamaz.`;
}

export function bellekMetni(d: SistemDurumu): string {
  const m = d.bellek;
  const parcalar: string[] = [];
  if (m.uygulamaKullanilan != null) parcalar.push(`uygulama bellek kullanımı ${bayt(m.uygulamaKullanilan)}`);
  if (m.cihazGB != null) parcalar.push(`yaklaşık cihaz belleği ${m.cihazGB} GB`);
  return parcalar.length ? `Bellek: ${parcalar.join(", ")}.` : `Bellek bilgisi ${KULLANILAMIYOR.toLowerCase()}.`;
}

export function agMetni(d: SistemDurumu): string {
  const a = d.ag;
  if (!a.cevrimici) return "İnternet bağlantısı yok. Çevrimdışı yerel komut modundayım.";
  const p: string[] = ["Çevrimiçi"];
  if (a.tur) p.push(TUR_ADI[a.tur] ?? a.tur);
  if (a.etkinTur) p.push(a.etkinTur.toUpperCase());
  if (a.indirmeMbps != null) p.push(`yaklaşık ${a.indirmeMbps} Mb/sn`);
  if (d.gecikmeMs != null) p.push(`uygulama gecikmesi ${d.gecikmeMs} ms`);
  else if (a.rttMs != null) p.push(`gidiş-dönüş ${a.rttMs} ms`);
  if (p.length === 1) p.push("tür ve hız bilgisi " + KULLANILAMIYOR.toLowerCase());
  return `Ağ: ${p.join(", ")}.`;
}
