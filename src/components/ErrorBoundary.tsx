import { Component, ErrorInfo, ReactNode } from 'react';
import { Button, NonIdealState } from '@blueprintjs/core';
import i18n from '../i18n';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, error: null, errorInfo: null };

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ error, errorInfo });
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <div className="app-shell" role="alert" aria-live="assertive" style={{ padding: 24 }}>
          <div style={{ maxWidth: 640, margin: '10vh auto' }}>
            <NonIdealState
              icon="error"
              title={i18n.t('errorBoundary.title')}
              description={i18n.t('errorBoundary.message')}
              action={
                <Button
                  intent="primary"
                  icon="refresh"
                  text={i18n.t('errorBoundary.refresh')}
                  onClick={() => window.location.reload()}
                />
              }
            />
            {this.state.error ? (
              <details style={{ marginTop: 16 }}>
                <summary className="micro" style={{ cursor: 'pointer' }}>{i18n.t('errorBoundary.details')}</summary>
                <pre className="endpoint-block" style={{ marginTop: 8 }}>{this.state.error.toString()}</pre>
              </details>
            ) : null}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
