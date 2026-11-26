// Ana HUD köşelerindeki oval sistem göstergeleri. Veri yoksa "Kullanılamıyor" yazılır; hiçbir değer uydurulmaz.
import { bayt } from "@/ortak/yardimci/yardimcilar";
import { TUR_ADI } from "./AgIzleyici";
import { DONANIM_ETIKET, useCihazDurumu, type DonanimDurumu } from "./CihazDurumu";
import { KULLANILAMIYOR } from "./DurumMetinleri";
import type { SistemDurumu } from "./SistemIzleyici";

function Cubuk({ oran, renk }: { oran: number | null; renk: string }) {
  return (
    <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-black/40 shadow-[inset_0_1px_3px_rgba(0,0,0,0.6)]" role="presentation">
      <div
        className="h-full rounded-full transition-[width] duration-700"
        style={{ width: `${Math.round((oran ?? 0) * 100)}%`, background: `linear-gradient(90deg, ${renk}99, ${renk})`, boxShadow: `0 0 10px ${renk}` }}
      />
    </div>
  );
}

function Kart({ baslik, simge, children }: { baslik: string; simge: string; children: React.ReactNode }) {
  return (
    <section className="cam-ince min-w-0 p-3 sm:p-4" aria-label={baslik}>
      <h3 className="text-metin2 flex items-center gap-1.5 text-[0.7rem] font-semibold tracking-wider uppercase">
        <span aria-hidden="true">{simge}</span>
        <span className="truncate">{baslik}</span>
      </h3>
      {children}
    </section>
  );
}

const Satir = ({ e, d }: { e: string; d: string }) => (
  <div className="flex items-baseline justify-between gap-2 text-xs">
    <span className="text-metin2 shrink-0">{e}</span>
    <span className="min-w-0 text-right font-medium break-words">{d}</span>
  </div>
);

export function BataryaKarti({ d, className = "" }: { d: SistemDurumu; className?: string }) {
  const b = d.batarya;
  const yuzde = b.yuzde;
  const renk = yuzde == null ? "#A9B3C7" : yuzde < 20 ? "#FF5E6C" : yuzde < 40 ? "#FFB547" : "#54E38E";
  return (
    <div className={className}>
      <Kart baslik="Batarya" simge="🔋">
        <p className="mt-1 text-2xl font-bold" style={{ color: renk }}>
          {yuzde == null ? KULLANILAMIYOR : `%${yuzde}`}
        </p>
        <Cubuk oran={yuzde == null ? null : yuzde / 100} renk={renk} />
        <div className="mt-2 space-y-0.5">
          <Satir e="Şarj" d={b.sarjOluyor == null ? KULLANILAMIYOR : b.sarjOluyor ? "Şarj oluyor ⚡" : "Şarj olmuyor"} />
          <Satir e="Sıcaklık" d={b.sicaklikC == null ? KULLANILAMIYOR : `${b.sicaklikC} °C`} />
        </div>
      </Kart>
    </div>
  );
}

export function DepolamaKarti({ d, className = "" }: { d: SistemDurumu; className?: string }) {
  const s = d.depolama;
  const oran = s.toplam && s.kullanilan != null ? s.kullanilan / s.toplam : null;
  const m = d.bellek;
  return (
    <div className={className}>
      <Kart baslik="Depolama · Bellek" simge="💾">
        <p className="mt-1 text-sm font-semibold break-words">
          {s.desteklenir ? `${bayt(s.kullanilan)} / ${bayt(s.toplam)}` : KULLANILAMIYOR}
        </p>
        <Cubuk oran={oran ?? 0} renk="#67C7FF" />
        <div className="mt-2 space-y-0.5">
          <Satir e="Boş alan" d={bayt(s.bos)} />
          <Satir e="Uygulama belleği" d={m.uygulamaKullanilan != null ? bayt(m.uygulamaKullanilan) : KULLANILAMIYOR} />
          <Satir e="Cihaz RAM'i" d={m.cihazGB != null ? `≈ ${m.cihazGB} GB` : KULLANILAMIYOR} />
        </div>
        <p className="text-metin2 mt-1.5 text-[0.65rem] leading-tight">Depolama: tarayıcının bu uygulamaya ayırdığı alan.</p>
      </Kart>
    </div>
  );
}

export function AgKarti({ d, className = "" }: { d: SistemDurumu; className?: string }) {
  const a = d.ag;
  return (
    <div className={className}>
      <Kart baslik="Ağ" simge="📡">
        <p className="mt-1 text-lg font-bold" style={{ color: a.cevrimici ? "#54E38E" : "#FF5E6C" }}>
          {a.cevrimici ? "Çevrimiçi" : "Çevrimdışı"}
        </p>
        <div className="mt-1.5 space-y-0.5">
          <Satir e="Tür" d={a.tur ? (TUR_ADI[a.tur] ?? a.tur) : a.etkinTur ? a.etkinTur.toUpperCase() : KULLANILAMIYOR} />
          <Satir e="Yaklaşık hız" d={a.indirmeMbps != null ? `${a.indirmeMbps} Mb/sn` : KULLANILAMIYOR} />
          <Satir e="Gecikme" d={!a.cevrimici ? "—" : d.gecikmeMs != null ? `${d.gecikmeMs} ms` : a.rttMs != null ? `≈ ${a.rttMs} ms` : KULLANILAMIYOR} />
        </div>
      </Kart>
    </div>
  );
}

const DONANIM_RENK: Record<DonanimDurumu, string> = {
  kapali: "#A9B3C7",
  izin_bekleniyor: "#FFB547",
  hazirlaniyor: "#FFB547",
  aktif: "#FF5E6C",
  reddedildi: "#FF5E6C",
  desteklenmiyor: "#A9B3C7",
};

function Durum({ ad, durum, metin, yanip }: { ad: string; durum: string; metin?: string; yanip?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-2 text-xs">
      <span className="text-metin2">{ad}</span>
      <span className="flex min-w-0 items-center gap-1.5 font-medium">
        <span className={`inline-block h-2 w-2 shrink-0 rounded-full ${yanip ? "anim-nabiz" : ""}`} style={{ background: durum, boxShadow: `0 0 8px ${durum}` }} />
        <span className="min-w-0 break-words">{metin}</span>
      </span>
    </div>
  );
}

export function DurumKarti({ className = "" }: { className?: string }) {
  const c = useCihazDurumu();
  const yz = c.yapayZeka;
  const yzRenk = yz.kod === "bagli" ? "#54E38E" : yz.kod === "yerel" ? "#67C7FF" : yz.kod === "kota" || yz.kod === "izin_yok" || yz.kod === "anahtar_yok" ? "#FFB547" : "#FF5E6C";
  return (
    <div className={className}>
      <Kart baslik="Donanım ve Yapay Zekâ" simge="🛰️">
        <div className="mt-2 space-y-1.5">
          <Durum ad="Mikrofon" durum={DONANIM_RENK[c.mikrofon]} metin={DONANIM_ETIKET[c.mikrofon]} yanip={c.mikrofon === "aktif"} />
          <Durum
            ad="Kamera"
            durum={DONANIM_RENK[c.kamera]}
            metin={`${DONANIM_ETIKET[c.kamera]}${c.kameraNedeni && c.kamera === "aktif" ? ` (${c.kameraNedeni})` : ""}`}
            yanip={c.kamera === "aktif"}
          />
          <Durum ad="Yapay zekâ" durum={yzRenk} metin={yz.mesaj} />
        </div>
      </Kart>
    </div>
  );
}
