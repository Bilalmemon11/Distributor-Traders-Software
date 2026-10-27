import React from "react";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="bg-[#ef4444]/10 border border-[#ef4444]/30 rounded-xl p-5 text-center">
          <h3 className="text-[#ef4444] font-bold mb-2">Something went wrong in this section.</h3>
          <p className="text-[#64748b] text-xs mb-4">Please try refreshing the page or contact support.</p>
          <button 
            onClick={() => this.setState({ hasError: false })}
            className="px-4 py-2 bg-[#ef4444] text-[#1e293b] text-xs rounded-lg"
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
