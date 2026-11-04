import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('POS ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReset = () => {
    localStorage.removeItem('pos_kopi_cart');
    localStorage.removeItem('pos_kopi_products');
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#f8f5f0] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-xl border border-stone-200 text-center space-y-4">
            <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-2xl mx-auto flex items-center justify-center">
              <AlertTriangle className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-stone-900">Terjadi Kesalahan Tampilan</h2>
              <p className="text-xs text-stone-500 mt-1">
                Kemungkinan terdapat data lama di browser yang perlu disinkronkan kembali.
              </p>
            </div>

            <div className="p-3 bg-stone-50 rounded-xl text-[11px] text-stone-600 font-mono text-left overflow-x-auto max-h-24">
              {this.state.error?.toString()}
            </div>

            <button
              onClick={this.handleReset}
              className="w-full py-3 bg-[#5c3a21] hover:bg-[#4a2e1a] text-white rounded-2xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition-all"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Muat Ulang Aplikasi & Perbaiki Data</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
