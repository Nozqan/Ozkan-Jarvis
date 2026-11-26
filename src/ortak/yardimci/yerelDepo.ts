// localStorage için güvenli sarmalayıcı. Depolama yoksa/dolduysa uygulama çökmez, bellekte devam eder.
const bellek = new Map<string, string>();

function depo(): Storage | null {
  try {
    return typeof localStorage !== "undefined" ? localStorage : null;
  } catch {
    return null;
  }
}

export function oku<T>(anahtar: string, varsayilan: T): T {
  try {
    const ham = depo()?.getItem(anahtar) ?? bellek.get(anahtar);
    return ham ? (JSON.parse(ham) as T) : varsayilan;
  } catch {
    return varsayilan;
  }
}

export function yaz(anahtar: string, deger: unknown): boolean {
  const ham = JSON.stringify(deger);
  try {
    depo()?.setItem(anahtar, ham);
    bellek.set(anahtar, ham);
    return true;
  } catch {
    bellek.set(anahtar, ham);
    return false;
  }
}

export function sil(anahtar: string): void {
  try {
    depo()?.removeItem(anahtar);
  } catch {
    /* yoksay */
  }
  bellek.delete(anahtar);
}
