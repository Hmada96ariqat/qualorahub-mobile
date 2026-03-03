import React from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { reportAppError } from '../../utils/observability';
import { AppScreen } from '../layout/AppScreen';
import { ErrorState } from './ErrorState';

type AppErrorBoundaryProps = {
  children: ReactNode;
};

type AppErrorBoundaryState = {
  error: Error | null;
};

function normalizeError(error: unknown): Error {
  if (error instanceof Error) return error;
  if (typeof error === 'string' && error.trim().length > 0) {
    return new Error(error);
  }
  return new Error('Unknown render error');
}

export class AppErrorBoundary extends React.Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
  constructor(props: AppErrorBoundaryProps) {
    super(props);
    this.state = {
      error: null,
    };
  }

  static getDerivedStateFromError(error: unknown): AppErrorBoundaryState {
    return {
      error: normalizeError(error),
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    reportAppError(error, {
      source: 'react-error-boundary',
      componentStack: errorInfo.componentStack ?? '',
    });
  }

  private reset = () => {
    this.setState({ error: null });
  };

  render() {
    if (this.state.error) {
      return (
        <AppScreen>
          <ErrorState
            title="Unexpected Application Error"
            message="The screen crashed unexpectedly. Retry to continue."
            retryLabel="Reload Screen"
            onRetry={this.reset}
          />
        </AppScreen>
      );
    }

    return this.props.children;
  }
}
