// Küçük, kalıcı ve React ile uyumlu (useSyncExternalStore) durum deposu.
import { useSyncExternalStore } from "react";
import { oku, yaz } from "./yerelDepo";

export interface KaliciDepo<T> {
  al: () => T;
  ata: (yeni: T | ((onceki: T) => T)) => void;
  abone: (dinleyici: () => void) => () => void;
  sifirla: () => void;
}

export function kaliciDepo<T>(anahtar: string, varsayilan: T, kalici = true): KaliciDepo<T> {
  let deger: T = kalici ? birlestir(oku<T>(anahtar, varsayilan), varsayilan) : varsayilan;
  const dinleyiciler = new Set<() => void>();

  function birlestir(kayitli: T, vars: T): T {
    // Nesne ayarlarda yeni alanlar eklenirse varsayılanlarla tamamlanır.
    if (kayitli && vars && typeof kayitli === "object" && !Array.isArray(kayitli) && !Array.isArray(vars)) {
      return { ...(vars as object), ...(kayitli as object) } as T;
    }
    return kayitli;
  }

  return {
    al: () => deger,
    ata: (yeni) => {
      deger = typeof yeni === "function" ? (yeni as (o: T) => T)(deger) : yeni;
      if (kalici) yaz(anahtar, deger);
      dinleyiciler.forEach((d) => d());
    },
    abone: (d) => {
      dinleyiciler.add(d);
      return () => dinleyiciler.delete(d);
    },
    sifirla: () => {
      deger = varsayilan;
      if (kalici) yaz(anahtar, deger);
      dinleyiciler.forEach((d) => d());
    },
  };
}

export function useDepo<T>(depo: KaliciDepo<T>): T {
  return useSyncExternalStore(depo.abone, depo.al, depo.al);
}
