import { useRef, useState } from "react";
import { hatirlaticiPlanlariniTemizle, hatirlaticilariKur } from "@/gorev_merkezi/HatirlaticiYoneticisi";
import { sifreliYedekCoz, sifreliYedekOlustur, yedekVerisiniGeriYukle, type UygulamaYedegi } from "@/veri/depo/Yedekleme";

export function YedeklemePaneli() {
  const dosyaRef = useRef<HTMLInputElement>(null);
  const [parola, setParola] = useState("");
  const [yukleniyor, setYukleniyor] = useState(false);
  const [hazirYedek, setHazirYedek] = useState<UygulamaYedegi | null>(null);
  const [mesaj, setMesaj] = useState<{ hata: boolean; metin: string } | null>(null);

  const indir = async () => {
    setYukleniyor(true);
    setMesaj(null);
    try {
      const icerik = await sifreliYedekOlustur(parola);
      const url = URL.createObjectURL(new Blob([icerik], { type: "application/json" }));
      const a = document.createElement("a");
      a.href = url;
      a.download = `akrep-jarvis-yedek-${new Date().toISOString().slice(0, 10)}.akrep`;
      a.click();
      URL.revokeObjectURL(url);
      setMesaj({ hata: false, metin: "Şifreli yedek dosyası indirildi. Parolayı dosyadan ayrı ve güvenli saklayın." });
    } catch (e) {
      setMesaj({ hata: true, metin: e instanceof Error ? e.message : "Yedek oluşturulamadı." });
    } finally {
      setYukleniyor(false);
    }
  };

  const dosyaOku = async (file: File | undefined) => {
    setHazirYedek(null);
    setMesaj(null);
    if (!file) return;
    setYukleniyor(true);
    try {
      const veri = await sifreliYedekCoz(await file.text(), parola);
      setHazirYedek(veri);
      setMesaj({ hata: false, metin: "Yedek parolayla açıldı ve içeriği doğrulandı. Geri yükleme mevcut not, arşiv, hatırlatıcı, sohbet ve ayarların üzerine yazacak." });
    } catch (e) {
      setMesaj({ hata: true, metin: e instanceof Error ? e.message : "Yedek dosyası açılamadı." });
    } finally {
      setYukleniyor(false);
      if (dosyaRef.current) dosyaRef.current.value = "";
    }
  };

  const geriYukle = async () => {
    if (!hazirYedek) return;
    try {
      await hatirlaticiPlanlariniTemizle();
    } catch {
      setMesaj({ hata: true, metin: "Mevcut hatırlatıcı bildirimleri iptal edilemedi; yedek geri yüklenmedi." });
      return;
    }
    try {
      yedekVerisiniGeriYukle(hazirYedek);
      await hatirlaticilariKur();
      setHazirYedek(null);
      setMesaj({ hata: false, metin: "Yedek geri yüklendi. Bu cihazdaki API anahtarları yedek dosyasına dahil edilmez ve değiştirilmez." });
    } catch (e) {
      setMesaj({
        hata: true,
        metin: `Yedek verisi yüklendi, ancak hatırlatıcılar yeniden kurulamadı: ${e instanceof Error ? e.message : "Bilinmeyen hata"}`,
      });
    }
  };

  return (
    <div className="space-y-3">
      <label className="block px-3 py-2">
        <span className="text-sm">Yedek parolası (en az 8 karakter)</span>
        <input
          className="alan mt-1"
          type="password"
          autoComplete="new-password"
          value={parola}
          onChange={(e) => setParola(e.target.value)}
        />
      </label>
      <div className="flex flex-wrap gap-2 px-3">
        <button className="dugme dugme-altin" type="button" onClick={() => void indir()} disabled={parola.length < 8 || yukleniyor}>
          {yukleniyor ? "İşleniyor…" : "Şifreli yedeği indir"}
        </button>
        <button className="dugme" type="button" onClick={() => dosyaRef.current?.click()} disabled={parola.length < 8 || yukleniyor}>
          Yedek dosyasını seç
        </button>
        <input
          ref={dosyaRef}
          className="sr-only"
          type="file"
          accept=".akrep,application/json"
          onChange={(e) => void dosyaOku(e.currentTarget.files?.[0])}
        />
      </div>
      {hazirYedek && (
        <div className="cam-ince flex flex-wrap items-center justify-between gap-2 p-3">
          <p className="text-sm">Doğrulanan yedekte {hazirYedek.notlar.length} not, {hazirYedek.hatirlaticilar.length} hatırlatıcı, {hazirYedek.arsiv.length} arşiv kaydı var.</p>
          <div className="flex gap-2">
            <button className="dugme dugme-altin" type="button" onClick={() => void geriYukle()}>Üzerine yaz ve geri yükle</button>
            <button className="dugme" type="button" onClick={() => setHazirYedek(null)}>Vazgeç</button>
          </div>
        </div>
      )}
      {mesaj && <p className={`px-3 text-xs ${mesaj.hata ? "text-hata" : "text-metin2"}`} role={mesaj.hata ? "alert" : "status"}>{mesaj.metin}</p>}
      <p className="text-metin2 px-3 text-xs leading-relaxed">
        Yedek cihazınızda hazırlanır ve parolayla AES‑GCM ile şifrelenir. Uygulama ayarları, notlar, hatırlatıcılar, arşiv ve sohbet geçmişi dosyaya eklenir. API anahtarları yedeklenmez. Yedek parolanızı unutursanız dosya açılamaz.
      </p>
    </div>
  );
}
