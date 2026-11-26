import { describe, expect, it } from "vitest";
import { VARSAYILAN_AYARLAR } from "@/veri/depo/AyarDeposu";
import { sifreliYedekCoz, sifreliYedekOlustur, type UygulamaYedegi } from "@/veri/depo/Yedekleme";

const veri: UygulamaYedegi = {
  ayarlar: { ...VARSAYILAN_AYARLAR },
  notlar: [{ id: "n1", metin: "Süt al", olusturma: 1_700_000_000_000, kaynak: "metin" }],
  hatirlaticilar: [{ id: "h1", metin: "Toplantı", zaman: 1_800_000_000_000, tamamlandi: false }],
  arsiv: [{ id: "a1", tur: "ocr", baslik: "Belge", metin: "Örnek metin", tarih: 1_700_000_000_000 }],
  sohbet: [{ id: "s1", rol: "kullanici", metin: "Merhaba", tarih: 1_700_000_000_000 }],
};

describe("şifreli yedekleme", () => {
  it("veriyi şifreleyip aynı parola ile doğrulanmış biçimde geri açar", async () => {
    const raw = await sifreliYedekOlustur("uzun-ve-guvenli-parola", veri);
    expect(raw).not.toContain("Süt al");
    await expect(sifreliYedekCoz(raw, "uzun-ve-guvenli-parola")).resolves.toEqual(veri);
  });

  it("yanlış parola veya değiştirilmiş dosyayı kabul etmez", async () => {
    const raw = await sifreliYedekOlustur("uzun-ve-guvenli-parola", veri);
    await expect(sifreliYedekCoz(raw, "baska-guvenli-parola")).rejects.toThrow("Yedek açılamadı");
    const parsed = JSON.parse(raw) as { ciphertext: string };
    const changed = JSON.stringify({ ...parsed, ciphertext: `${parsed.ciphertext[0] === "A" ? "B" : "A"}${parsed.ciphertext.slice(1)}` });
    await expect(sifreliYedekCoz(changed, "uzun-ve-guvenli-parola")).rejects.toThrow("Yedek açılamadı");
  });

  it("kısa parola ve bozuk yedek dosyası için açık hata verir", async () => {
    await expect(sifreliYedekOlustur("kisa", veri)).rejects.toThrow("en az 8 karakter");
    await expect(sifreliYedekCoz("{}", "uzun-ve-guvenli-parola")).rejects.toThrow("geçersiz");
  });
});
