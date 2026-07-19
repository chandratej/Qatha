import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { AlertCircle } from 'lucide-react';
import { BrandMark } from './studio/BrandMark';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="cms-auth-page">
          <div className="cms-auth-card cms-error-boundary-card">
            <div className="cms-auth-card__brand-seal">
              <BrandMark size="md" />
            </div>
            <AlertCircle size={28} className="cms-error-boundary__icon" aria-hidden />
            <h1 className="cms-error-boundary__title">Something went wrong</h1>
            <p className="cms-error-boundary__text">
              Your studio hit an unexpected pause. Reload to pick up where you left off — your work is safe.
            </p>
            <button
              type="button"
              className="dashboard-cta cms-auth-cta"
              onClick={() => window.location.reload()}
            >
              Reload studio
            </button>
            {/* Never show raw PostgREST/stack text to creators — log only */}
            {import.meta.env.DEV && this.state.error?.message && (
              <pre className="cms-error-boundary__detail" aria-hidden>
                {this.state.error.message.slice(0, 200)}
              </pre>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
