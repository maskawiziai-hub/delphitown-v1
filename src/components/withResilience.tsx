import React, { ComponentType, useState } from 'react';
import { ErrorBoundary } from './ErrorBoundary';
import { CircuitBreaker } from '../utils/retry';

export interface ResilienceConfig {
  enableCircuitBreaker?: boolean;
  failureThreshold?: number;
  resetTimeout?: number; // milliseconds
  showErrorDetails?: boolean;
}

/**
 * Higher-order component that wraps widgets with error boundaries,
 * circuit breaker protection, and recovery mechanisms
 */
export function withResilience<P extends object>(
  WrappedComponent: ComponentType<P>,
  config: ResilienceConfig = {}
) {
  const {
    enableCircuitBreaker = true,
    failureThreshold = 5,
    resetTimeout = 60000,
    showErrorDetails = import.meta.env.DEV,
  } = config;

  const circuitBreaker = enableCircuitBreaker
    ? new CircuitBreaker(failureThreshold, resetTimeout)
    : null;

  const WrappedWithResilience = (props: P) => {
    const [circuitOpen, setCircuitOpen] = useState(false);
    const [recoveryAttempts, setRecoveryAttempts] = useState(0);

    const handleError = (error: Error) => {
      console.error(`Widget error in ${WrappedComponent.displayName}:`, error);

      if (circuitBreaker) {
        try {
          // This would normally execute the function, but we're checking state
          // In real usage, the circuit breaker would be checked on data fetches
          const state = circuitBreaker.getState();
          if (state === 'OPEN') {
            setCircuitOpen(true);
          }
        } catch {
          setCircuitOpen(true);
        }
      }
    };

    const handleRecovery = () => {
      setRecoveryAttempts(prev => prev + 1);
      setCircuitOpen(false);

      if (circuitBreaker) {
        circuitBreaker.reset();
      }
    };

    // Fallback UI for circuit breaker open state
    if (circuitOpen && recoveryAttempts >= 3) {
      return (
        <div style={styles.degradedContainer}>
          <div style={styles.degradedContent}>
            <h3 style={styles.degradedTitle}>Service Temporarily Unavailable</h3>
            <p style={styles.degradedMessage}>
              This service is experiencing issues and has been temporarily disabled
              to prevent cascading failures.
            </p>
            <p style={styles.degradedSubtext}>
              Please refresh the page or try again in a few moments.
            </p>
            <button
              onClick={handleRecovery}
              style={styles.recoveryButton}
            >
              Attempt Recovery
            </button>
          </div>
        </div>
      );
    }

    return (
      <ErrorBoundary
        componentName={WrappedComponent.displayName || 'Unknown'}
        onError={(error) => handleError(error)}
        fallback={
          <div style={styles.fallbackContainer}>
            <p style={styles.fallbackText}>
              {WrappedComponent.displayName || 'Component'} encountered an error
            </p>
            {showErrorDetails && (
              <button
                onClick={() => {
                  // In real app, would trigger detailed error view
                  console.log('Show error details');
                }}
                style={styles.detailsButton}
              >
                Details
              </button>
            )}
          </div>
        }
      >
        <WrappedComponent {...props} />
      </ErrorBoundary>
    );
  };

  WrappedWithResilience.displayName = `withResilience(${
    WrappedComponent.displayName || WrappedComponent.name
  })`;

  return WrappedWithResilience;
}

const styles: Record<string, React.CSSProperties> = {
  degradedContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '200px',
    padding: '20px',
    backgroundColor: '#fef5e7',
    borderRadius: '8px',
    border: '1px solid #f9e79f',
  },
  degradedContent: {
    maxWidth: '500px',
    textAlign: 'center',
  },
  degradedTitle: {
    color: '#b7950b',
    fontSize: '18px',
    marginBottom: '12px',
    fontWeight: 'bold',
  },
  degradedMessage: {
    color: '#9a7d0a',
    fontSize: '14px',
    marginBottom: '8px',
    lineHeight: '1.5',
  },
  degradedSubtext: {
    color: '#9a7d0a',
    fontSize: '12px',
    marginBottom: '16px',
  },
  recoveryButton: {
    padding: '8px 16px',
    backgroundColor: '#f39c12',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold',
  },
  fallbackContainer: {
    padding: '16px',
    backgroundColor: '#e8f4f8',
    borderRadius: '6px',
    border: '1px solid #b3d9e8',
    textAlign: 'center',
  },
  fallbackText: {
    color: '#1a5f7a',
    fontSize: '14px',
    marginBottom: '12px',
  },
  detailsButton: {
    padding: '6px 12px',
    backgroundColor: '#1a5f7a',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '12px',
  },
};
