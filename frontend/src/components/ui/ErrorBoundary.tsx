import { Component, type ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from './Button';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
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
        <div className="flex items-center justify-center h-64">
          <div className="text-center p-6 bg-midnight-800 rounded-xl border border-midnight-600 max-w-md">
            <AlertTriangle className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
            <h3 className="font-serif font-bold text-parchment-100 mb-2">
              {this.props.fallbackTitle || 'Something went wrong'}
            </h3>
            <p className="text-sm text-parchment-400 mb-4">
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
            <Button onClick={() => { this.setState({ hasError: false, error: null }); window.location.reload(); }}>
              Reload Page
            </Button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
