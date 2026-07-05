import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { AlertCircle } from 'lucide-react';

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
    error: null
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
          <div className="cms-auth-card" style={{ textAlign: 'center' }}>
            <AlertCircle size={40} style={{ color: 'var(--ember)', marginBottom: 16 }} />
            <h1 style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--ink)', marginBottom: 12 }}>
              Something went wrong
            </h1>
            <p style={{ color: 'var(--ink-muted)', marginBottom: 28, fontSize: '0.9375rem', lineHeight: 'var(--line-height-body)' }}>
              We&apos;ve encountered an unexpected error. Please reload the page to continue.
            </p>
            <button
              className="dashboard-cta"
              style={{ border: 'none' }}
              onClick={() => window.location.reload()}
            >
              Reload Page
            </button>
            <pre style={{
              marginTop: 28,
              padding: 16,
              background: 'var(--dash-paper)',
              borderRadius: 12,
              fontSize: '0.75rem',
              color: 'var(--ink-soft)',
              textAlign: 'left',
              overflow: 'auto',
              maxHeight: 200,
              border: '1px solid var(--dash-border)',
              lineHeight: 'var(--line-height-body)',
            }}>
              {this.state.error?.message || 'Unknown error'}
            </pre>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}