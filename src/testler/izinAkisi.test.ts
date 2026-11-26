// İzin akışı testleri: izin reddi çökme yerine anlaşılır hata + yapılabilecek öneri üretir; kaynaklar bırakılır; anahtar loglanmaz.
import { afterEach, describe, expect, it, vi } from "vitest";
import { cihazHatasiniCevir } from "@/ortak/hata/hataYardimcilari";
import { gunluk } from "@/ortak/yardimci/yardimcilar";
import { MikrofonYoneticisi } from "@/ses_motoru/MikrofonYoneticisi";
import { cihazDurumDeposu } from "@/sistem_izleyici/CihazDurumu";
import { sahteNavigator } from "./kurulum";

const nav = sahteNavigator as unknown as Record<string, unknown>;

afterEach(() => {
  delete nav.mediaDevices;
});

describe("hata çevirisi", () => {
  it("kamera izni reddi: açıklama + tekrar dene önerisi", () => {
    const h = cihazHatasiniCevir(new DOMException("x", "NotAllowedError"), "kamera");
    expect(h.kod).toBe("kamera_izin_yok");
    expect(h.mesaj).toContain("Kamera izni");
    expect(h.oneri).toContain("Tekrar dene");
    expect(h.tekrarDenenebilir).toBe(true);
  });

  it("mikrofon bulunamadı: tekrar denenemez ama metinle devam önerilir", () => {
    const h = cihazHatasiniCevir(new DOMException("x", "NotFoundError"), "mikrofon");
    expect(h.kod).toBe("mikrofon_yok");
    expect(h.tekrarDenenebilir).toBe(false);
    expect(h.oneri).toContain("metinle");
  });

  it("teknik ayrıntı/stack kullanıcıya sızmaz", () => {
    const h = cihazHatasiniCevir(new Error("Sistem hatası at foo.js:12:3"), "kamera");
    expect(h.mesaj + h.oneri).not.toMatch(/foo\.js|at \w+/);
  });
});

describe("mikrofon izin akışı", () => {
  it("izin reddedilirse uygulama çökmez, durum 'reddedildi' olur", async () => {
    nav.mediaDevices = { getUserMedia: vi.fn().mockRejectedValue(new DOMException("denied", "NotAllowedError")) };
    const r = await new MikrofonYoneticisi().baslat(false);
    expect(r.basarili).toBe(false);
    if (!r.basarili) expect(r.hata.kod).toBe("mikrofon_izin_yok");
    expect(cihazDurumDeposu.al().mikrofon).toBe("reddedildi");
  });

  it("izin verilirse ve analiz istenmezse akış hemen bırakılır, durum 'aktif' olur", async () => {
    const dur = vi.fn();
    nav.mediaDevices = { getUserMedia: vi.fn().mockResolvedValue({ getTracks: () => [{ stop: dur }] }) };
    const m = new MikrofonYoneticisi();
    const r = await m.baslat(false);
    expect(r.basarili).toBe(true);
    expect(dur).toHaveBeenCalled();
    expect(cihazDurumDeposu.al().mikrofon).toBe("aktif");
    m.durdur();
    expect(cihazDurumDeposu.al().mikrofon).toBe("kapali");
  });

  it("mikrofon API'si yoksa 'desteklenmiyor' bildirilir", async () => {
    const r = await new MikrofonYoneticisi().baslat(false);
    expect(r.basarili).toBe(false);
    expect(cihazDurumDeposu.al().mikrofon).toBe("desteklenmiyor");
  });
});

describe("günlük gizliliği", () => {
  it("API anahtarı benzeri değerler loglarda maskelenir", () => {
    const spy = vi.spyOn(console, "info").mockImplementation(() => {});
    gunluk.bilgi("istek", "Bearer sk-ABCDEFGH12345678", "AIzaSyABCDEFGHIJKLMNOP");
    const cikti = spy.mock.calls.flat().join(" ");
    expect(cikti).not.toContain("ABCDEFGH12345678");
    expect(cikti).not.toContain("SyABCDEFGHIJKLMNOP");
    spy.mockRestore();
  });
});
