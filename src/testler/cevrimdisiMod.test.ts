// Çevrimdışı mod testi: internet yokken yerel komutlar çalışır, canlı veri isteyen komutlar dürüst yanıt alır,
// çözülemeyen komutlar hiçbir koşulda ağa gönderilmez.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { INTERNET_GEREKLI_METNI, YerelKomutMotoru, type KomutBaglami } from "@/yapay_zeka/YerelKomutMotoru";
import { KomutYonlendirici } from "@/yapay_zeka/KomutYonlendirici";
import { VARSAYILAN_AYARLAR } from "@/veri/depo/AyarDeposu";
import { notDeposu } from "@/veri/depo/NotDeposu";
import type { Ayarlar } from "@/veri/model/tipler";

function kur(cevrimici: boolean, ayar: Partial<Ayarlar> = {}) {
  const gidilen: string[] = [];
  const baglam: KomutBaglami = { gezin: (h) => gidilen.push(h), cevrimiciMi: () => cevrimici, uygulamaOzeti: () => "Test özeti." };
  const motor = new YerelKomutMotoru(baglam);
  const yonlendirici = new KomutYonlendirici(motor, () => ({ ...VARSAYILAN_AYARLAR, ...ayar }), () => cevrimici, () => []);
  return { motor, yonlendirici, gidilen };
}

const fetchCagrilari = vi.fn();

beforeEach(() => {
  notDeposu.sifirla();
  fetchCagrilari.mockReset();
  vi.stubGlobal("fetch", fetchCagrilari); // Ağ çağrısı yapılırsa test bunu yakalar.
});
afterEach(() => vi.unstubAllGlobals());

describe("çevrimdışı yerel komutlar", () => {
  it("hava durumu: sahte bilgi vermez, internet gerektiğini söyler", async () => {
    const { yonlendirici } = kur(false);
    const s = await yonlendirici.yonlendir("İnternet yokken hava durumunu söyle");
    expect(s.metin).toBe(INTERNET_GEREKLI_METNI);
    expect(fetchCagrilari).not.toHaveBeenCalled();
  });

  it("not al → kaydeder; son notu göster → aynı notu okur", async () => {
    const { yonlendirici } = kur(false);
    const a = await yonlendirici.yonlendir("Not al: yarın süt ekmek al");
    expect(a.kaynak).toBe("yerel");
    expect(notDeposu.al()).toHaveLength(1);
    expect(notDeposu.al()[0].metin).toBe("yarın süt ekmek al");
    const b = await yonlendirici.yonlendir("son notu göster");
    expect(b.metin).toContain("yarın süt ekmek al");
  });

  it("'... diye not al' biçimini anlar", async () => {
    const { yonlendirici } = kur(false);
    await yonlendirici.yonlendir("faturayı öde diye not al");
    expect(notDeposu.al()[0].metin).toBe("faturayı öde");
  });

  it("basit hesaplama çevrimdışı çalışır", async () => {
    const { yonlendirici } = kur(false);
    const s = await yonlendirici.yonlendir("12 çarpı 7 kaç eder");
    expect(s.metin).toBe("Sonuç 84.");
  });

  it("kamera ve ayarlar komutları gezinti üretir", async () => {
    const { yonlendirici } = kur(false);
    expect((await yonlendirici.yonlendir("kamerayı aç")).gezinti).toBe("kamera");
    expect((await yonlendirici.yonlendir("ayarları aç")).gezinti).toBe("ayarlar");
  });

  it("anlaşılmayan komutta sahte başarı mesajı vermez ve ağa çıkmaz", async () => {
    const { yonlendirici } = kur(false, { saglayici: "openai", hariciVeriIzni: true });
    const s = await yonlendirici.yonlendir("bana bir hikaye anlat");
    expect(s.kaynak).toBe("sistem");
    expect(s.metin).toBe(INTERNET_GEREKLI_METNI);
    expect(fetchCagrilari).not.toHaveBeenCalled();
  });
});

describe("harici yapay zekâ izni", () => {
  it("izin kapalıyken çözülemeyen komut gönderilmez", async () => {
    const { yonlendirici } = kur(true, { saglayici: "openai", hariciVeriIzni: false });
    const s = await yonlendirici.yonlendir("bana bir hikaye anlat");
    expect(s.metin).toContain("izni kapalı");
    expect(fetchCagrilari).not.toHaveBeenCalled();
  });

  it("yerel sağlayıcı seçiliyken hiçbir şey gönderilmez", async () => {
    const { yonlendirici } = kur(true, { saglayici: "yerel", hariciVeriIzni: true });
    await yonlendirici.yonlendir("bana bir hikaye anlat");
    expect(fetchCagrilari).not.toHaveBeenCalled();
  });

  it("yerelde çözülen komut izin olsa bile internete gönderilmez", async () => {
    const { yonlendirici } = kur(true, { saglayici: "openai", hariciVeriIzni: true });
    await yonlendirici.yonlendir("not al: deneme");
    await yonlendirici.yonlendir("5 artı 5");
    expect(fetchCagrilari).not.toHaveBeenCalled();
  });
});
