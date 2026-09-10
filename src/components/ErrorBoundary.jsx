import { Component } from 'react';

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, info) {
    console.error('[MuwanShots] Gallery error:', error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="mx-auto max-w-[1280px] px-6 py-16 text-center">
          <h2 className="font-serif text-2xl">Something went wrong loading the gallery.</h2>
          <p className="mt-2 text-sm text-[var(--text-muted)]">{String(this.state.error?.message || 'Unknown error')}</p>
          <div className="mt-6 flex gap-3 justify-center">
            <button onClick={() => this.setState({ hasError: false, error: null })} className="rounded-full bg-[var(--text-primary)] text-[var(--bg)] px-6 py-3 text-sm font-semibold">Try again</button>
            <a href="/gallery" className="rounded-full border border-[var(--border)] px-6 py-3 text-sm">Back to Gallery</a>
          </div>
          <p className="mt-4 text-xs text-[var(--text-muted)]">If this persists, hard-reload (Ctrl+Shift+R) or restart dev server.</p>
        </div>
      );
    }
    return this.props.children;
  }
}
