import { afterEach, describe, expect, it, vi } from "vitest";
import { kodlariTani } from "@/canli_kamera/KodTarayici";

afterEach(() => vi.unstubAllGlobals());

describe("QR ve barkod tarayıcı", () => {
  it("tarayıcı algılayıcısı yoksa anlaşılır destek hatası döndürür", async () => {
    const sonuc = await kodlariTani({} as HTMLCanvasElement);
    expect(sonuc.basarili).toBe(false);
    if (!sonuc.basarili) expect(sonuc.hata.kod).toBe("kod_tarama_desteklenmiyor");
  });

  it("desteklenen yerel barkod algılayıcısı ile bulunan içeriği döndürür", async () => {
    class FakeDetector {
      static getSupportedFormats = vi.fn().mockResolvedValue(["qr_code", "code_128"]);
      constructor(readonly options: { formats?: string[] }) {}
      detect = vi.fn().mockResolvedValue([{
        rawValue: "https://example.test",
        format: "qr_code",
        boundingBox: { x: 10, y: 20, width: 80, height: 80 },
      }]);
    }
    vi.stubGlobal("window", { BarcodeDetector: FakeDetector });
    const sonuc = await kodlariTani({} as HTMLCanvasElement);
    expect(sonuc.basarili).toBe(true);
    if (sonuc.basarili) {
      expect(sonuc.deger[0].metin).toBe("https://example.test");
      expect(sonuc.deger[0].kutu).toEqual({ x: 10, y: 20, w: 80, h: 80 });
    }
  });
});
