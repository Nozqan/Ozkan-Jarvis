// OCR arşiv testi: tarama sonucu arşivlenir, Türkçe karakterlerle aranır, filtrelenir, silinir.
import { beforeEach, describe, expect, it } from "vitest";
import { arsivAra, arsivDeposu, arsivSil, arsivTemizle, arsivle } from "@/veri/depo/ArsivDeposu";

beforeEach(() => arsivDeposu.sifirla());

describe("tarama arşivi", () => {
  it("OCR sonucu arşive kaydedilir (yalnızca metin)", () => {
    const k = arsivle({ tur: "ocr", baslik: "Metin okuma · güven %91", metin: "Çanakkale Şehitler Abidesi — Gelibolu" });
    expect(arsivDeposu.al()).toHaveLength(1);
    expect(k.id).toBeTruthy();
    expect(Object.keys(k)).not.toContain("goruntu"); // Görüntü saklanmaz.
  });

  it("Türkçe büyük/küçük harf duyarsız arama yapar", () => {
    arsivle({ tur: "ocr", baslik: "Fatura", metin: "IŞIK elektrik faturası İstanbul" });
    arsivle({ tur: "nesne", baslik: "Nesneler", metin: "Fincan (%80), Dizüstü bilgisayar (%92)" });
    expect(arsivAra({ sorgu: "ışık" })).toHaveLength(1);
    expect(arsivAra({ sorgu: "istanbul" })).toHaveLength(1);
    expect(arsivAra({ sorgu: "DİZÜSTÜ" })).toHaveLength(1);
    expect(arsivAra({ sorgu: "bulunmaz" })).toHaveLength(0);
  });

  it("türe ve tarih aralığına göre filtreler", () => {
    arsivle({ tur: "ocr", baslik: "A", metin: "metin" });
    arsivle({ tur: "ortam", baslik: "B", metin: "ortam" });
    expect(arsivAra({ tur: "ocr" })).toHaveLength(1);
    expect(arsivAra({ tur: "hepsi" })).toHaveLength(2);
    expect(arsivAra({ baslangic: Date.now() + 60_000 })).toHaveLength(0);
    expect(arsivAra({ bitis: Date.now() + 60_000 })).toHaveLength(2);
  });

  it("tek kayıt ve tüm arşiv silinebilir", () => {
    const a = arsivle({ tur: "ocr", baslik: "A", metin: "bir" });
    arsivle({ tur: "ocr", baslik: "B", metin: "iki" });
    arsivSil(a.id);
    expect(arsivDeposu.al()).toHaveLength(1);
    arsivTemizle();
    expect(arsivDeposu.al()).toHaveLength(0);
  });
});
