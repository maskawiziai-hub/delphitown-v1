import React, { ReactNode, ErrorInfo } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  componentName?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorCount: number;
}

/**
 * Error Boundary component for graceful error handling
 * Catches errors in child components and displays fallback UI
 */
export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState(prev => ({
      errorInfo,
      errorCount: prev.errorCount + 1,
    }));

    // Call optional callback
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Log error details
    console.error('ErrorBoundary caught an error:', {
      componentName: this.props.componentName,
      error: error.toString(),
      errorInfo: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
    });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div style={styles.errorContainer}>
          <div style={styles.errorContent}>
            <h2 style={styles.errorTitle}>⚠️ Something Went Wrong</h2>
            <p style={styles.errorMessage}>
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>

            {import.meta.env.DEV && (
              <details style={styles.details}>
                <summary style={styles.summary}>Error Details (Dev Only)</summary>
                <pre style={styles.errorStack}>
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}

            <button onClick={this.handleReset} style={styles.retryButton}>
              Try Again
            </button>

            {this.state.errorCount > 3 && (
              <p style={styles.warningText}>
                Multiple errors detected. Please refresh the page.
              </p>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const styles: Record<string, React.CSSProperties> = {
  errorContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '200px',
    padding: '20px',
    backgroundColor: '#fff5f5',
    borderRadius: '8px',
    border: '1px solid #fc8181',
  },
  errorContent: {
    maxWidth: '500px',
    textAlign: 'center',
  },
  errorTitle: {
    color: '#c53030',
    fontSize: '20px',
    marginBottom: '12px',
    fontWeight: 'bold',
  },
  errorMessage: {
    color: '#742a2a',
    fontSize: '14px',
    marginBottom: '16px',
    lineHeight: '1.5',
  },
  details: {
    marginBottom: '16px',
    textAlign: 'left',
  },
  summary: {
    cursor: 'pointer',
    color: '#c53030',
    fontWeight: 'bold',
    marginBottom: '8px',
  },
  errorStack: {
    backgroundColor: '#fed7d7',
    padding: '12px',
    borderRadius: '4px',
    fontSize: '12px',
    overflow: 'auto',
    maxHeight: '200px',
  },
  retryButton: {
    padding: '8px 16px',
    backgroundColor: '#c53030',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold',
  },
  warningText: {
    color: '#c53030',
    fontSize: '12px',
    marginTop: '12px',
    fontStyle: 'italic',
  },
};
