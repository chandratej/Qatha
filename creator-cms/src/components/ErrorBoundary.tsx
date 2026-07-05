import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';

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
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div className="card" style={{ maxWidth: 500, width: '100%', padding: 32, textAlign: 'center' }}>
            <h1 style={{ color: 'var(--ember)', marginBottom: 16 }}>Something went wrong.</h1>
            <p style={{ color: 'var(--ink-muted)', marginBottom: 24, fontSize: '0.875rem' }}>
              We've encountered an unexpected error. Please reload the page to continue.
            </p>
            <button 
              className="btn btn-primary" 
              onClick={() => window.location.reload()}
            >
              Reload Page
            </button>
            <pre style={{ 
              marginTop: 24, 
              padding: 16, 
              background: 'var(--paper-warm)', 
              borderRadius: 8,
              fontSize: '0.75rem',
              color: 'var(--ink-soft)',
              textAlign: 'left',
              overflow: 'auto',
              maxHeight: 200
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
