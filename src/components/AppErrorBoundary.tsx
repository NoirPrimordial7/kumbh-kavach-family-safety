import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RefreshCcw } from 'lucide-react';
import { Button } from './ui/button';

interface AppErrorBoundaryProps { children: ReactNode }
interface AppErrorBoundaryState { error?: Error }

export class AppErrorBoundary extends Component<
  AppErrorBoundaryProps,
  AppErrorBoundaryState
> {
  state: AppErrorBoundaryState = {};

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    if (import.meta.env.DEV) console.error('Kumbh Kavach render error', error, info);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return <main className="application-error" role="alert">
      <AlertTriangle/>
      <h1>The family view needs a refresh.</h1>
      <p>Your last locally saved demo state is still available. No emergency action was sent.</p>
      <Button onClick={() => location.reload()}><RefreshCcw/>Reload application</Button>
    </main>;
  }
}
