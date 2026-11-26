import { afterEach, describe, expect, it, vi } from "vitest";
import { KonusmaTaniyici, type TaniyiciGeriCagrilari } from "@/ses_motoru/KonusmaTaniyici";

afterEach(() => vi.unstubAllGlobals());

function geriCagrilar(): TaniyiciGeriCagrilari {
  return {
    araSonuc: vi.fn(),
    sonuc: vi.fn(),
    hata: vi.fn(),
    dinlemeDurumu: vi.fn(),
  };
}

describe("çevrimdışı konuşma tanıma", () => {
  it("tarayıcı yerel tanımayı desteklemiyorsa mikrofondan dinlemeye çalışmaz", () => {
    const baslat = vi.fn();
    class Tanima {
      lang = "";
      continuous = false;
      interimResults = false;
      maxAlternatives = 0;
      onresult = null;
      onerror = null;
      onend = null;
      onspeechstart = null;
      start = baslat;
      stop = vi.fn();
      abort = vi.fn();
    }
    const cb = geriCagrilar();
    vi.stubGlobal("window", { SpeechRecognition: Tanima });
    vi.stubGlobal("navigator", { onLine: false });
    const taniyici = new KonusmaTaniyici(cb);
    expect(taniyici.baslat()).toBe(false);
    expect(baslat).not.toHaveBeenCalled();
    expect(cb.hata).toHaveBeenCalledWith(
      expect.objectContaining({ kod: "cevrimdisi_konusma_yok" }),
      true,
    );
  });

  it("yerel tanıma API'si varsa çevrimdışıyken yerel işlemeyi seçer", () => {
    const instances: { processLocally?: boolean; start: ReturnType<typeof vi.fn> }[] = [];
    class Tanima {
      lang = "";
      continuous = false;
      interimResults = false;
      maxAlternatives = 0;
      processLocally = false;
      onresult = null;
      onerror = null;
      onend = null;
      onspeechstart = null;
      start = vi.fn();
      stop = vi.fn();
      abort = vi.fn();
      constructor() {
        instances.push(this);
      }
    }
    vi.stubGlobal("window", { SpeechRecognition: Tanima });
    vi.stubGlobal("navigator", { onLine: false });
    const taniyici = new KonusmaTaniyici(geriCagrilar());
    expect(taniyici.baslat()).toBe(true);
    expect(instances[0].processLocally).toBe(true);
    taniyici.durdur();
  });
});
