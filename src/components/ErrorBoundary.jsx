import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("[ErrorBoundary] Caught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '24px 16px',
          maxWidth: '500px',
          margin: '30px auto',
          textAlign: 'center'
        }}>
          <div className="glass-panel animate-slide-in" style={{
            padding: '24px',
            border: '1px solid rgba(255, 23, 68, 0.4)',
            borderRadius: '16px'
          }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>⚠️</div>
            <h3 style={{
              color: '#ff5252',
              fontFamily: 'var(--font-heading)',
              margin: '0 0 8px 0',
              fontSize: '1.2rem'
            }}>
              SCREEN LOADING ERROR
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '0 0 16px 0' }}>
              {this.state.error?.message || "An unexpected error occurred while loading this section."}
            </p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button
                onClick={() => this.setState({ hasError: false, error: null })}
                className="btn btn-primary"
                style={{ fontSize: '0.8rem', padding: '8px 16px' }}
              >
                🔄 Retry
              </button>
              <button
                onClick={() => {
                  this.setState({ hasError: false, error: null });
                  if (this.props.onReset) this.props.onReset();
                }}
                className="btn btn-outline"
                style={{ fontSize: '0.8rem', padding: '8px 16px' }}
              >
                🏠 Return to Dashboard
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
