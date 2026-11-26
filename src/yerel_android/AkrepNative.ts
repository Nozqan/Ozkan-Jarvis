import { registerPlugin } from '@capacitor/core';

export interface AkrepSystemStatus {
  battery: { supported: boolean; percent: number | null; charging: boolean | null; temperatureC: number | null };
  network: { connected: boolean; type: string };
  storage: { supported: boolean; total: number; free: number; used: number };
  memory: { appUsed: number; deviceTotal: number; deviceAvailable: number };
}

interface AkrepSystemPlugin {
  getStatus(): Promise<AkrepSystemStatus>;
  addListener(eventName: 'backPressed', listener: () => void): Promise<{ remove: () => Promise<void> }>;
}

interface AkrepTtsPlugin {
  speak(options: { text: string; rate: number; pitch: number }): Promise<{ done: boolean }>;
  stop(): Promise<void>;
}

export const AkrepSystem = registerPlugin<AkrepSystemPlugin>('AkrepSystem');
export const AkrepTts = registerPlugin<AkrepTtsPlugin>('AkrepTts');

export function androidCapinda(): boolean {
  const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
  return /Android/i.test(ua) && (window as unknown as { Capacitor?: unknown }).Capacitor !== undefined;
}
