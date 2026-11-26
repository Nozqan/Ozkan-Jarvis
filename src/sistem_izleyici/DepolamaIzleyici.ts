// Depolama bilgisi. Web platformu yalnızca TARAYICININ bu uygulamaya ayırdığı alanı bildirir
// (cihazın toplam diski değildir). Arayüzde bu durum açıkça belirtilir.
export interface DepolamaBilgisi {
  desteklenir: boolean;
  toplam: number | null;
  kullanilan: number | null;
  bos: number | null;
}

export const DEPOLAMA_YOK: DepolamaBilgisi = { desteklenir: false, toplam: null, kullanilan: null, bos: null };

export async function depolamaOku(): Promise<DepolamaBilgisi> {
  try {
    if (!navigator.storage?.estimate) return DEPOLAMA_YOK;
    const e = await navigator.storage.estimate();
    if (e.quota == null || e.usage == null) return DEPOLAMA_YOK;
    return { desteklenir: true, toplam: e.quota, kullanilan: e.usage, bos: Math.max(0, e.quota - e.usage) };
  } catch {
    return DEPOLAMA_YOK;
  }
}
