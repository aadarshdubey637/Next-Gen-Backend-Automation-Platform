import React, { Component } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Generator from './pages/Generator'
import Navbar from './components/Navbar'

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-black flex flex-col items-center justify-center p-10 text-center">
          <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          </div>
          <h1 className="text-3xl font-bold text-white mb-4">Dashboard Error</h1>
          <p className="text-slate-400 max-w-md mb-8">
            The application encountered a critical error and had to stop. This is often caused by a data mismatch or a failed network request.
          </p>
          <div className="bg-[#1a1a1a] p-4 rounded-md text-left mb-8 w-full max-w-2xl overflow-auto max-h-40 border border-white/10">
            <code className="text-red-400 text-xs">
              {this.state.error && this.state.error.toString()}
            </code>
          </div>
          <button 
            onClick={() => window.location.reload()}
            className="px-8 py-3 bg-primary text-black font-bold rounded-md hover:bg-primary/90 transition-all"
          >
            Refresh Dashboard
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

function App() {
  return (
    <Router>
      <ErrorBoundary>
        <div className="min-h-screen bg-black text-slate-200 overflow-x-hidden">
          <Navbar />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/generator" element={<Generator />} />
          </Routes>
        </div>
      </ErrorBoundary>
    </Router>
  )
}

export default App
