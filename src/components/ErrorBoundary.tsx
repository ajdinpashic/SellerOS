import { Component, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100dvh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          fontFamily: 'Inter, system-ui, sans-serif',
          background: '#f8f9fa',
          color: '#1a1d21',
        }}>
          <div style={{
            maxWidth: '400px',
            textAlign: 'center',
            background: '#fff',
            borderRadius: '12px',
            padding: '32px',
            border: '1px solid #e9ecef',
          }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: '#fff5f5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
              fontSize: '24px',
            }}>!</div>
            <h1 style={{ fontSize: '18px', fontWeight: 600, margin: '0 0 8px' }}>
              SellerOS
            </h1>
            <p style={{ fontSize: '14px', color: '#495057', margin: '0 0 16px' }}>
              Došlo je do greške pri pokretanju aplikacije.
            </p>
            <button
              onClick={() => {
                localStorage.clear();
                window.location.hash = '#/';
                window.location.reload();
              }}
              style={{
                background: '#1a56db',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                padding: '10px 20px',
                fontSize: '14px',
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              Pokušaj ponovo
            </button>
            <details style={{ marginTop: '16px', textAlign: 'left' }}>
              <summary style={{ fontSize: '12px', color: '#868e96', cursor: 'pointer' }}>
                Tehnički detalji
              </summary>
              <pre style={{
                fontSize: '11px',
                color: '#868e96',
                marginTop: '8px',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-all',
                maxHeight: '120px',
                overflow: 'auto',
              }}>
                {this.state.error?.message}
                {'\n'}
                {this.state.error?.stack}
              </pre>
            </details>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
