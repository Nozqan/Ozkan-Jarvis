// Beklenmeyen çizim hatalarında uygulamanın çökmesini önleyen güvenlik ağı.
import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  ad?: string;
}
interface Durum {
  hatali: boolean;
}

export class HataSinirlayici extends Component<Props, Durum> {
  state: Durum = { hatali: false };

  static getDerivedStateFromError(): Durum {
    return { hatali: true };
  }

  componentDidCatch(): void {
    // Teknik ayrıntı kullanıcıya gösterilmez ve günlüğe yazılmaz.
  }

  render() {
    if (!this.state.hatali) return this.props.children;
    return (
      <div className="cam m-4 p-6 text-center">
        <p className="text-hata font-semibold">{this.props.ad ?? "Bu bölüm"} beklenmedik şekilde durdu.</p>
        <p className="text-metin2 mt-2 text-sm">Verileriniz güvende. Bölümü yeniden başlatmayı deneyin.</p>
        <button className="dugme dugme-altin mt-4" onClick={() => this.setState({ hatali: false })}>
          Tekrar dene
        </button>
      </div>
    );
  }
}
