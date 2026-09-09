import { Component, type ReactNode } from "react";

type Props = { children: ReactNode; fallback?: ReactNode };
type State = { hasError: boolean };

/**
 * Without this, an uncaught error anywhere in the page (WebGL init on a
 * fussy GPU, a canvas race on a cold refresh, whatever) unmounts the whole
 * React tree and leaves the visitor staring at a stuck screen with no way
 * back. Catch it, log it, and keep the rest of the page alive instead.
 */
export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: unknown, info: unknown) {
    // eslint-disable-next-line no-console
    console.error("[ErrorBoundary] caught:", error, info);
  }

  render() {
    if (this.state.hasError) return this.props.fallback ?? null;
    return this.props.children;
  }
}
