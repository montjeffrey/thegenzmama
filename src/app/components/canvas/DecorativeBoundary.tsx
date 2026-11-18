"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";

interface DecorativeBoundaryProps {
    children: ReactNode;
    /** Rendered in place of children if they throw. Defaults to nothing. */
    fallback?: ReactNode;
}

interface DecorativeBoundaryState {
    hasError: boolean;
}

/**
 * Error boundary for purely decorative UI (e.g. the WebGL hero background).
 *
 * Without it, any render error in the 3D layer -- no WebGL support (Lockdown
 * Mode, blocklisted GPUs, privacy browsers) or a renderer/React mismatch --
 * bubbles up to the root and Next.js replaces the entire page with its
 * "This page couldn't load" screen. Decoration must never take the page down.
 */
export default class DecorativeBoundary extends Component<DecorativeBoundaryProps, DecorativeBoundaryState> {
    state: DecorativeBoundaryState = { hasError: false };

    static getDerivedStateFromError(): DecorativeBoundaryState {
        return { hasError: true };
    }

    componentDidCatch(error: Error, info: ErrorInfo) {
        console.warn("Decorative component failed to render and was hidden:", error, info.componentStack);
    }

    render() {
        if (this.state.hasError) {
            return this.props.fallback ?? null;
        }
        return this.props.children;
    }
}
