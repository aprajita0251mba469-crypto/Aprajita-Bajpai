import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    message: '',
  };

  public static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      message: error.message || 'An unexpected error occurred.',
    };
  }

  public componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('REFILL+ ErrorBoundary caught:', error, info);
  }

  public render() {
    if (this.state.hasError) {
      let friendly = this.state.message;
      try {
        const parsed = JSON.parse(this.state.message);
        if (parsed?.error) {
          friendly = `Database access notice (${parsed.operationType || 'operation'}): ${parsed.error}`;
        }
      } catch {
        // Non-JSON error message
      }

      return (
        <div className="min-h-screen bg-[#FAFAF8] flex items-center justify-center px-6 py-16">
          <div className="max-w-lg w-full bg-white border border-[#E4E8E2] rounded-2xl p-8">
            <div className="flex items-center gap-3 text-[#B91C1C] mb-4">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h1 className="text-xl font-semibold text-[#111814]">Something went wrong</h1>
            </div>
            <p className="text-sm text-[#4A5850] leading-relaxed mb-6 break-words">{friendly}</p>
            <button
              type="button"
              onClick={() => {
                this.setState({ hasError: false, message: '' });
                window.location.reload();
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#176B45] text-white text-sm font-medium rounded-xl hover:bg-[#125436] transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              Reload REFILL+
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
