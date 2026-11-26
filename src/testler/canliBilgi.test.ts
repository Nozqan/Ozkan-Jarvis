import { afterEach, describe, expect, it, vi } from "vitest";
import { canliBilgiGetir, canliBilgiIstegiAl } from "@/yapay_zeka/CanliBilgi";
import { KomutYonlendirici } from "@/yapay_zeka/KomutYonlendirici";
import { YerelKomutMotoru, type KomutBaglami } from "@/yapay_zeka/YerelKomutMotoru";
import { VARSAYILAN_AYARLAR } from "@/veri/depo/AyarDeposu";
import type { Ayarlar } from "@/veri/model/tipler";

afterEach(() => vi.unstubAllGlobals());

function yonlendiriciOlustur(izin: boolean) {
  const baglam: KomutBaglami = {
    gezin: () => undefined,
    cevrimiciMi: () => true,
    uygulamaOzeti: () => "Test.",
  };
  const motor = new YerelKomutMotoru(baglam);
  return new KomutYonlendirici(
    motor,
    () => ({ ...VARSAYILAN_AYARLAR, saglayici: "yerel", hariciVeriIzni: izin } as Ayarlar),
    () => true,
    () => [],
  );
}

describe("canlı bilgi sorguları", () => {
  it("şehirli hava durumu ve açıkça istenen web aramasını tanır", () => {
    expect(canliBilgiIstegiAl("İstanbul'da hava durumu") ).toEqual({ tur: "hava", sehir: "İstanbul" });
    expect(canliBilgiIstegiAl("İnternetten ara güneş sistemi")).toEqual({ tur: "arama", sorgu: "güneş sistemi" });
  });

  it("izin kapalıyken canlı sorguyu harici servise göndermez", async () => {
    const fetch = vi.fn();
    vi.stubGlobal("fetch", fetch);
    const sonuc = await yonlendiriciOlustur(false).yonlendir("Ankara hava durumu");
    expect(sonuc.metin).toContain("gönderilmedi");
    expect(fetch).not.toHaveBeenCalled();
  });

  it("şehir belirtilmediyse kullanıcıdan şehir sorar, ağa çıkmaz", async () => {
    const fetch = vi.fn();
    vi.stubGlobal("fetch", fetch);
    const sonuc = await yonlendiriciOlustur(false).yonlendir("hava durumu");
    expect(sonuc.metin).toContain("Hangi şehir");
    expect(fetch).not.toHaveBeenCalled();
  });

  it("izin verildiğinde şehir için güncel hava ölçümünü getirir", async () => {
    const fetch = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({
        results: [{ name: "Ankara", latitude: 39.9, longitude: 32.8, country: "Türkiye" }],
      })))
      .mockResolvedValueOnce(new Response(JSON.stringify({
        current: {
          temperature_2m: 18,
          apparent_temperature: 17,
          relative_humidity_2m: 42,
          weather_code: 1,
          wind_speed_10m: 8,
        },
      })));
    vi.stubGlobal("fetch", fetch);
    const istek = canliBilgiIstegiAl("Ankara hava durumu");
    expect(istek).not.toBeNull();
    const sonuc = await canliBilgiGetir(istek!);
    expect(sonuc).toContain("Ankara, Türkiye");
    expect(sonuc).toContain("18 °C");
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it("Wikipedia aramasını kaynak adıyla sunar", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({
      query: { search: [{ title: "Güneş Sistemi", snippet: "Güneş'in <span>çekim</span> alanı" }] },
    }))));
    const sonuc = await canliBilgiGetir({ tur: "arama", sorgu: "güneş sistemi" });
    expect(sonuc).toContain("Güneş Sistemi");
    expect(sonuc).toContain("çekim alanı");
    expect(sonuc).toContain("Türkçe Wikipedia");
  });
});
