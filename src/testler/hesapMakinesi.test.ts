// Birim testi: güvenli hesap makinesi ve Türkçe konuşma ifadeleri.
import { describe, expect, it } from "vitest";
import { hesapla, turkcedenHesapla } from "@/gorev_merkezi/HesapMakinesi";

describe("hesapla", () => {
  it("işlem önceliğine uyar", () => {
    const r = hesapla("2+3*4");
    expect(r.basarili && r.deger).toBe(14);
  });
  it("parantez ve üs destekler", () => {
    const r = hesapla("(2+3)*2^3");
    expect(r.basarili && r.deger).toBe(40);
  });
  it("sıfıra bölmede anlaşılır hata verir", () => {
    const r = hesapla("5/0");
    expect(r.basarili).toBe(false);
    if (!r.basarili) expect(r.hata.kod).toBe("sifira_bolme");
  });
  it("kod çalıştırmaya izin vermez", () => {
    expect(hesapla("alert(1)").basarili).toBe(false);
    expect(hesapla("process.exit()").basarili).toBe(false);
  });
});

describe("turkcedenHesapla", () => {
  it("'5 artı 3 kaç eder' → 8", () => {
    expect(turkcedenHesapla("5 artı 3 kaç eder")?.sonuc).toBe(8);
  });
  it("'25 çarpı 4' → 100", () => {
    expect(turkcedenHesapla("25 çarpı 4")?.sonuc).toBe(100);
  });
  it("sayı kelimeleri: 'yirmi beş bölü beş' → 5", () => {
    expect(turkcedenHesapla("yirmi beş bölü beş")?.sonuc).toBe(5);
  });
  it("ondalık virgül: '3,5 çarpı 2' → 7", () => {
    expect(turkcedenHesapla("3,5 çarpı 2")?.sonuc).toBe(7);
  });
  it("yüzde: '200'ün yüzde 15'i' → 30", () => {
    expect(turkcedenHesapla("200'ün yüzde 15'i")?.sonuc).toBe(30);
  });
  it("hesap olmayan cümleyi hesap saymaz", () => {
    expect(turkcedenHesapla("feneri aç")).toBeNull();
    expect(turkcedenHesapla("merhaba nasılsın")).toBeNull();
  });
});
