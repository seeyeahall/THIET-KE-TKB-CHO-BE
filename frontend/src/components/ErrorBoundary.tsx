'use client';

import React, { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // eslint-disable-next-line no-console
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReload = () => {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <main className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-br from-kid-yellow/20 via-white to-kid-blue/20">
          <div className="max-w-sm w-full text-center">
            <div className="text-6xl mb-4">🙈</div>
            <h1 className="text-2xl font-black text-kid-orange mb-2">Oops!</h1>
            <p className="text-gray-600 font-bold mb-6">Có lỗi xảy ra</p>
            <p className="text-sm text-gray-400 mb-8 px-4">
              {this.state.error?.message || 'Đã có lỗi không mong muốn. Hãy thử tải lại trang nhé!'}
            </p>
            <button
              onClick={this.handleReload}
              className="w-full bg-kid-orange text-white font-black py-4 rounded-2xl hover:scale-[1.02] transition-transform shadow-lg"
            >
              🔄 Tải lại trang
            </button>
          </div>
        </main>
      );
    }

    return this.props.children;
  }
}
