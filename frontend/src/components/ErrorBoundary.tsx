import { Component } from "react";
import type { ErrorInfo, ReactNode } from "react";

interface State { hasError: boolean }

export default class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("UI error:", error, info.componentStack);
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <div className="center-screen" style={{ textAlign: "center", padding: 24 }}>
        <div>
          <h1>Something went wrong</h1>
          <p className="muted" style={{ margin: "8px 0 16px" }}>Please refresh the page and try again.</p>
          <button className="btn" onClick={() => window.location.assign("/")}>Back to home</button>
        </div>
      </div>
    );
  }
}