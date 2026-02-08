import { Component, ErrorInfo, ReactNode } from 'react';
import { Shield, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
    this.setState({ errorInfo });
    
    // TODO: Send error to monitoring service (e.g., Sentry)
    // logErrorToService(error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black via-gray-900 to-black text-white p-6">
          <div className="max-w-2xl w-full">
            {/* Error Card */}
            <div className="glass p-10 rounded-[2.5rem] border border-white/10 text-center">
              {/* Icon */}
              <div className="mb-6 flex justify-center">
                <div className="bg-red-500/20 p-6 rounded-full border border-red-500/30">
                  <Shield className="text-red-500" size={48} />
                </div>
              </div>

              {/* Title */}
              <h1 className="text-4xl font-bold mb-4">Oops! Something went wrong</h1>
              
              {/* Description */}
              <p className="text-gray-400 mb-8 text-lg">
                We encountered an unexpected error. Don't worry, your data is safe.
              </p>

              {/* Error Details (Development Only) */}
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <div className="mb-8 bg-black/40 p-6 rounded-2xl border border-white/5 text-left">
                  <p className="text-xs font-mono text-red-400 mb-2">Error Details (Dev Mode):</p>
                  <p className="text-xs font-mono text-gray-400 break-all">
                    {this.state.error.toString()}
                  </p>
                  {this.state.errorInfo && (
                    <details className="mt-4">
                      <summary className="text-xs text-gray-500 cursor-pointer hover:text-white">
                        Stack Trace
                      </summary>
                      <pre className="text-[10px] text-gray-600 mt-2 overflow-auto max-h-40">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </details>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button 
                  onClick={this.handleReset}
                  className="bg-primary hover:bg-primary/80 text-white px-8 py-4 rounded-full font-bold flex items-center justify-center gap-2 transition-all hover:scale-105 active:scale-95"
                >
                  <RefreshCw size={20} />
                  Return to Home
                </button>
                
                <button 
                  onClick={() => window.location.reload()}
                  className="glass hover:bg-white/10 px-8 py-4 rounded-full font-bold transition-all border border-white/10"
                >
                  Reload Page
                </button>
              </div>

              {/* Help Text */}
              <p className="text-xs text-gray-600 mt-8">
                If this problem persists, please contact support or try clearing your browser cache.
              </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
