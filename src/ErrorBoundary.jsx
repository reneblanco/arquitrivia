import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error capturado por ErrorBoundary:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    try {
      localStorage.removeItem('arquitrivia-save');
    } catch (e) {
      // ignore
    }
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          backgroundColor: '#faf9f6',
          color: '#000',
          fontFamily: 'ui-sans-serif, system-ui, sans-serif',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px'
        }}>
          <div style={{
            maxWidth: '600px',
            width: '100%',
            backgroundColor: '#fff',
            border: '4px solid #000',
            padding: '40px',
            boxShadow: '12px 12px 0px 0px rgba(0,0,0,1)'
          }}>
            <div style={{
              display: 'inline-block',
              backgroundColor: '#ff3366',
              color: '#fff',
              border: '4px solid #000',
              padding: '8px 16px',
              fontWeight: 900,
              fontSize: '12px',
              textTransform: 'uppercase',
              letterSpacing: '0.15em',
              marginBottom: '24px',
              boxShadow: '4px 4px 0px 0px rgba(0,0,0,1)'
            }}>
              Algo salió mal
            </div>

            <h1 style={{
              fontSize: '40px',
              fontWeight: 900,
              letterSpacing: '-0.04em',
              lineHeight: '1.05',
              textTransform: 'uppercase',
              marginBottom: '16px',
              marginTop: 0
            }}>
              Tuvimos un problema
            </h1>

            <p style={{
              fontSize: '18px',
              fontWeight: 'bold',
              color: '#525252',
              marginBottom: '32px',
              lineHeight: '1.5'
            }}>
              La aplicación encontró un error inesperado. Puedes intentar recargar la página o volver al inicio. Si el error persiste, lo más probable es que se resuelva limpiando los datos guardados localmente.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <button
                onClick={this.handleReload}
                style={{
                  backgroundColor: '#000',
                  color: '#fff',
                  border: '4px solid #000',
                  fontWeight: 900,
                  fontSize: '18px',
                  padding: '16px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  cursor: 'pointer',
                  boxShadow: '6px 6px 0px 0px rgba(0,0,0,0.3)'
                }}
              >
                Recargar la página
              </button>
              <button
                onClick={this.handleGoHome}
                style={{
                  backgroundColor: '#faf9f6',
                  color: '#000',
                  border: '4px solid #000',
                  fontWeight: 900,
                  fontSize: '18px',
                  padding: '16px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  cursor: 'pointer',
                  boxShadow: '6px 6px 0px 0px rgba(0,0,0,0.3)'
                }}
              >
                Limpiar datos y volver al inicio
              </button>
            </div>

            {this.state.error && (
              <details style={{
                marginTop: '32px',
                paddingTop: '24px',
                borderTop: '2px solid #00000033',
                fontSize: '12px',
                color: '#737373'
              }}>
                <summary style={{ cursor: 'pointer', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                  Detalles técnicos
                </summary>
                <pre style={{
                  marginTop: '12px',
                  padding: '12px',
                  backgroundColor: '#faf9f6',
                  border: '2px solid #00000022',
                  overflow: 'auto',
                  fontSize: '11px',
                  whiteSpace: 'pre-wrap'
                }}>
                  {String(this.state.error?.message || this.state.error)}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
