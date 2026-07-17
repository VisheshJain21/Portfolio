"use client";

/**
 * Generic render-error boundary — reusable anywhere a subtree might throw
 * (currently: the WebGL hero). Renders `fallback` instead of crashing the
 * page, and reports once via `onError`.
 */

import { Component, type ReactNode } from "react";

type Props = { children: ReactNode; fallback: ReactNode; onError?: () => void };
type State = { crashed: boolean };

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { crashed: false };

  static getDerivedStateFromError(): State {
    return { crashed: true };
  }

  componentDidCatch(error: unknown) {
    // eslint-disable-next-line no-console
    console.warn("ErrorBoundary caught:", error);
    this.props.onError?.();
  }

  render() {
    return this.state.crashed ? this.props.fallback : this.props.children;
  }
}
