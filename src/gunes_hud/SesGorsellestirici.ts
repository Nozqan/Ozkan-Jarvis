// Ses seviyesinden türetilen YUMUŞATILMIŞ genlik ve frekans bantları (düşük/orta/yüksek).
// Ham ses verisi saklanmaz; yalnızca birkaç sayı tutulur ve Güneş çekirdeğini titreştirir.
export class SesGorsellestirici {
  genlik = 0;
  bantlar: [number, number, number] = [0, 0, 0];
  private hedefGenlik = 0;
  private hedefBantlar: [number, number, number] = [0, 0, 0];

  /** Mikrofon analizinden gelen anlık değerler (0..1). */
  girdi(genlik: number, bantlar: [number, number, number]): void {
    this.hedefGenlik = Math.max(0, Math.min(1, genlik));
    this.hedefBantlar = bantlar.map((b) => Math.max(0, Math.min(1, b))) as [number, number, number];
  }

  /** Konuşma tanıma/TTS olaylarından gelen kısa vuruşlar (ses seviyesi doğrudan okunamadığında). */
  darbe(siddet = 0.7): void {
    this.hedefGenlik = Math.max(this.hedefGenlik, siddet);
    this.hedefBantlar = [
      Math.max(this.hedefBantlar[0], siddet),
      Math.max(this.hedefBantlar[1], siddet * (0.55 + Math.random() * 0.35)),
      Math.max(this.hedefBantlar[2], siddet * (0.3 + Math.random() * 0.4)),
    ];
  }

  sifirla(): void {
    this.hedefGenlik = 0;
    this.hedefBantlar = [0, 0, 0];
  }

  /** Her karede çağrılır: hızlı yükselme, yavaş düşme (yumuşatma). dt saniye cinsindendir. */
  guncelle(dt: number): void {
    const yuksel = 1 - Math.exp(-dt * 22);
    const dus = 1 - Math.exp(-dt * 6);
    const k = (simdiki: number, hedef: number) => simdiki + (hedef - simdiki) * (hedef > simdiki ? yuksel : dus);
    this.genlik = k(this.genlik, this.hedefGenlik);
    this.bantlar = this.bantlar.map((b, i) => k(b, this.hedefBantlar[i])) as [number, number, number];
    // Hedef, yeni girdi gelmezse kendiliğinden söner.
    const sonme = Math.exp(-dt * 4.5);
    this.hedefGenlik *= sonme;
    this.hedefBantlar = this.hedefBantlar.map((b) => b * sonme) as [number, number, number];
  }
}

export const sesGorsellestirici = new SesGorsellestirici();
