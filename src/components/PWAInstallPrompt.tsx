import React, { useState, useEffect } from 'react';
import { Download, Smartphone, X, Check, Share } from 'lucide-react';

export const PWAInstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState<boolean>(false);
  const [isIOS, setIsIOS] = useState<boolean>(false);
  const [isStandalone, setIsStandalone] = useState<boolean>(false);
  const [dismissed, setDismissed] = useState<boolean>(false);
  const [showIOSGuide, setShowIOSGuide] = useState<boolean>(false);

  useEffect(() => {
    // Check if already running in standalone PWA / App mode
    const isRunningStandalone = 
      window.matchMedia('(display-mode: standalone)').matches || 
      (window.navigator as any).standalone === true;
    
    setIsStandalone(isRunningStandalone);

    // Detect iOS devices
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isAppleDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isAppleDevice);

    // Listen for beforeinstallprompt event (Android / Chromium)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Check if user dismissed recently
    const isDismissed = sessionStorage.getItem('pwa_prompt_dismissed');
    if (isDismissed) {
      setDismissed(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstallable(false);
        setDeferredPrompt(null);
      }
    } else if (isIOS) {
      setShowIOSGuide(true);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    sessionStorage.setItem('pwa_prompt_dismissed', 'true');
  };

  // Do not show if already in standalone app mode or dismissed
  if (isStandalone || dismissed) {
    return null;
  }

  // Only show if installable on Android/Desktop or on iOS Safari
  if (!isInstallable && !isIOS) {
    return null;
  }

  return (
    <>
      {/* Top / Floating Install Banner for Mobile */}
      <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:max-w-md z-50 bg-slate-900/95 text-white p-4 rounded-2xl shadow-2xl border border-teal-500/40 backdrop-blur-xl animate-in slide-in-from-bottom-5 duration-300">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-500/20 border border-teal-400/30 flex items-center justify-center flex-shrink-0 text-teal-400">
            <Smartphone className="w-5 h-5" />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-teal-400">Install Mobile App</h4>
              <span className="text-[10px] bg-teal-500/20 text-teal-300 px-1.5 py-0.5 rounded font-mono">PWA</span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5 font-medium leading-relaxed">
              Use LesionXpert.AI as a full phone app with offline access & direct camera capture.
            </p>

            <div className="flex items-center gap-2 mt-3">
              <button
                type="button"
                onClick={handleInstallClick}
                className="px-3.5 py-1.5 rounded-lg bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-teal-500/20 transition-transform active:scale-95"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{isIOS ? 'Add to Home Screen' : 'Install to Phone'}</span>
              </button>

              <button
                type="button"
                onClick={handleDismiss}
                className="px-2.5 py-1.5 rounded-lg text-slate-400 hover:text-white text-xs font-semibold hover:bg-slate-800 transition-colors"
              >
                Not now
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={handleDismiss}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* iOS Installation Instruction Modal */}
      {showIOSGuide && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 text-white rounded-3xl p-6 max-w-sm w-full border border-teal-500/30 shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-teal-400 font-bold text-sm">
                <Smartphone className="w-5 h-5" />
                <span>Install on iPhone / iPad</span>
              </div>
              <button onClick={() => setShowIOSGuide(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-300">
              <div className="flex items-start gap-3 p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60">
                <div className="w-6 h-6 rounded-full bg-teal-500/20 text-teal-400 flex items-center justify-center font-bold flex-shrink-0">1</div>
                <div>
                  Tap the <strong className="text-white">Share</strong> icon <Share className="w-3.5 h-3.5 inline text-teal-400 mx-1" /> in Safari's bottom toolbar.
                </div>
              </div>

              <div className="flex items-start gap-3 p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60">
                <div className="w-6 h-6 rounded-full bg-teal-500/20 text-teal-400 flex items-center justify-center font-bold flex-shrink-0">2</div>
                <div>
                  Scroll down and tap <strong className="text-white">'Add to Home Screen'</strong> with the plus icon (+).
                </div>
              </div>

              <div className="flex items-start gap-3 p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60">
                <div className="w-6 h-6 rounded-full bg-teal-500/20 text-teal-400 flex items-center justify-center font-bold flex-shrink-0">3</div>
                <div>
                  Tap <strong className="text-teal-400">Add</strong> in top right. LesionXpert icon is now on your home screen!
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowIOSGuide(false)}
              className="w-full py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs text-center transition-colors"
            >
              Got it!
            </button>
          </div>
        </div>
      )}
    </>
  );
};
