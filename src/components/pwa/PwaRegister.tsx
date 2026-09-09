'use client';

import { useEffect, useState } from 'react';
import { Download, X, Smartphone } from 'lucide-react';

export function PwaRegister() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if already running in standalone PWA mode
    if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone) {
      setIsStandalone(true);
      return;
    }

    // Register Service Worker
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => console.log('PWA Service Worker registered:', reg.scope))
        .catch((err) => console.log('SW registration failed:', err));
    }

    // Capture install prompt event
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowBanner(false);
    }
    setDeferredPrompt(null);
  };

  if (isStandalone || !showBanner) return null;

  return (
    <div className="fixed bottom-16 md:bottom-6 right-4 left-4 md:left-auto md:w-96 z-50 bg-slate-900/95 backdrop-blur-md border border-brand-500/40 rounded-2xl p-4 shadow-2xl shadow-brand-950/80 text-white animate-in slide-in-from-bottom-5">
      <div className="flex items-start gap-3">
        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-brand-500 to-indigo-600 flex items-center justify-center flex-shrink-0 shadow-md shadow-brand-500/30">
          <Smartphone className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-white tracking-tight">Install Pixellar CRM</h4>
          <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
            Install on your phone for faster access, offline site visits, and 1-tap pipeline management.
          </p>
          <div className="flex items-center gap-2 mt-3">
            <button
              onClick={handleInstallClick}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-brand-500 hover:bg-brand-600 text-xs font-semibold text-white shadow-sm transition-all active:scale-95"
            >
              <Download className="w-3.5 h-3.5" />
              Install App
            </button>
            <button
              onClick={() => setShowBanner(false)}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors"
            >
              Later
            </button>
          </div>
        </div>
        <button
          onClick={() => setShowBanner(false)}
          className="text-slate-400 hover:text-slate-200 p-1 -mr-1 -mt-1 rounded-lg"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
