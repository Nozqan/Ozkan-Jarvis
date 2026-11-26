import { afterEach, describe, expect, it, vi } from "vitest";
import { otomatikSeviye, profilAyari } from "@/ortak/animasyonlar/PerformansProfili";

afterEach(() => vi.unstubAllGlobals());

describe("uyarlanabilir performans profili", () => {
  it("düşük kaynaklı cihaz için hafif profili seçer", () => {
    vi.stubGlobal("navigator", { hardwareConcurrency: 2, deviceMemory: 2 });
    expect(otomatikSeviye()).toBe("dusuk");
    expect(profilAyari("dusuk", false)).toMatchObject({ parcacik: 0.45, dpr: 1, maksFps: 45 });
  });

  it("yüksek kaynaklı cihaz için tam profili korur", () => {
    vi.stubGlobal("navigator", { hardwareConcurrency: 8, deviceMemory: 8 });
    expect(otomatikSeviye()).toBe("yuksek");
  });
});
