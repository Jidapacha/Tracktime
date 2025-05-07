// src/components/ErrorBoundary.js
import React, { Component } from 'react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      info: null
    };
  }

  static getDerivedStateFromError(error) {
    // Update state to display fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    // Log error and info to an error reporting service (optional)
    this.setState({
      error: error,
      info: info
    });
    console.log(error, info); // For debugging, you can log it to the console
  }

  render() {
    if (this.state.hasError) {
      // Render fallback UI if error occurs
      return (
        <div>
          <h2>Something went wrong.</h2>
          <p>{this.state.error?.message}</p>
        </div>
      );
    }

    // Otherwise, render children
    return this.props.children; 
  }
}

export default ErrorBoundary;
