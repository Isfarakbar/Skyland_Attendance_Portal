'use client';

import React, { useState, useEffect } from 'react';
import { Smartphone, Download, X, Share, PlusSquare, CheckCircle, MoreVertical, Sparkles } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function InstallAppBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [justInstalled, setJustInstalled] = useState(false);

  useEffect(() => {
    // 1. Instant Service Worker Registration (No waiting for window.onload)
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => {
          console.log('PWA Service Worker registered at scope:', reg.scope);
        })
        .catch((err) => {
          console.log('PWA Service Worker registration notice:', err);
        });
    }

    // 2. Check if already installed / standalone
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true ||
      document.referrer.includes('android-app://');

    if (isStandalone) {
      setIsInstalled(true);
      return;
    }

    // 3. Platform Detection
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    const isAndroidDevice = /android/.test(userAgent);
    const isMobile = isIosDevice || isAndroidDevice || window.innerWidth <= 768;

    setIsIOS(isIosDevice);
    setIsAndroid(isAndroidDevice);

    // 4. Capture native browser install prompt (Android Chrome, Edge, desktop Chrome)
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    // 5. Track successful install
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setShowBanner(false);
      setShowGuideModal(false);
      setJustInstalled(true);
      setTimeout(() => setJustInstalled(false), 5000);
    });

    // 6. Surface notification banner immediately when opening portal link (if not installed)
    const dismissedTime = sessionStorage.getItem('skyland_pwa_dismissed');
    const isRecentlyDismissed =
      dismissedTime && Date.now() - parseInt(dismissedTime, 10) < 15 * 60 * 1000; // 15 mins in current session

    if (!isRecentlyDismissed && !isStandalone) {
      const timer = setTimeout(() => {
        setShowBanner(true);
      }, 150);
      return () => clearTimeout(timer);
    }

    // 7. Global listener for Navbar "Install App" button clicks
    const handleOpenInstall = () => {
      if (deferredPrompt) {
        handleInstallClick();
      } else {
        setShowGuideModal(true);
      }
    };
    window.addEventListener('open-pwa-install', handleOpenInstall);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('open-pwa-install', handleOpenInstall);
    };
  }, [deferredPrompt]);

  const handleInstallClick = async () => {
    // If native prompt is captured, trigger it immediately
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const choiceResult = await deferredPrompt.userChoice;
        if (choiceResult.outcome === 'accepted') {
          setShowBanner(false);
          setShowGuideModal(false);
          setJustInstalled(true);
          setTimeout(() => setJustInstalled(false), 5000);
        }
        setDeferredPrompt(null);
        return;
      } catch (err) {
        console.error('Install prompt error:', err);
      }
    }

    // Otherwise (iOS, or Android without deferred prompt triggered yet), open visual guide
    setShowGuideModal(true);
  };

  const handleDismiss = () => {
    setShowBanner(false);
    sessionStorage.setItem('skyland_pwa_dismissed', Date.now().toString());
  };

  if (isInstalled && !justInstalled) return null;

  return (
    <>
      {/* Success Notification after install */}
      {justInstalled && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300">
          <CheckCircle className="w-5 h-5 text-emerald-100" />
          <span className="text-sm font-bold">Skyland App successfully installed!</span>
        </div>
      )}

      {/* Floating App Download Notification Banner */}
      {showBanner && !isInstalled && (
        <div className="fixed bottom-3 left-3 right-3 sm:left-auto sm:right-6 sm:bottom-6 sm:max-w-md z-40 bg-[#0D1527]/95 backdrop-blur-md text-white p-4 sm:p-5 rounded-3xl shadow-2xl border border-orange-500/40 animate-in fade-in slide-in-from-bottom-5 duration-300">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#FF6B00] to-amber-500 flex items-center justify-center shrink-0 shadow-lg shadow-orange-500/25">
                <Smartphone className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <h4 className="font-bold text-sm text-white leading-tight">Install Skyland Attendance App</h4>
                </div>
                <p className="text-xs text-slate-300 mt-0.5 leading-snug">
                  Install the app now to mark your daily attendance with live GPS location in one tap.
                </p>
              </div>
            </div>

            <button
              onClick={handleDismiss}
              className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer shrink-0"
              title="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-2.5 mt-3.5 pt-3 border-t border-slate-800/80">
            <button
              onClick={handleInstallClick}
              className="flex-1 py-2.5 px-4 bg-[#FF6B00] hover:bg-[#FF8533] text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-orange-500/20 flex items-center justify-center gap-2 cursor-pointer active:scale-98"
            >
              <Download className="w-4 h-4" />
              <span>{isIOS ? 'Install on iPhone' : isAndroid ? 'Install on Android Phone' : 'Install Skyland App'}</span>
            </button>

            <button
              onClick={handleDismiss}
              className="py-2 px-3 text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
            >
              Later
            </button>
          </div>
        </div>
      )}

      {/* Visual Step-by-Step Installation Modal */}
      {showGuideModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="bg-[#0D1527] border border-slate-800 rounded-3xl max-w-sm w-full p-6 text-slate-100 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-[#FF6B00] flex items-center justify-center border border-orange-500/20">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">
                    {isIOS ? 'Install on iPhone / iPad' : 'Install on Android'}
                  </h3>
                  <p className="text-[11px] text-slate-400">Add to your Home Screen as an App</p>
                </div>
              </div>
              <button
                onClick={() => setShowGuideModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* iOS Instructions */}
            {isIOS ? (
              <div className="space-y-3 my-4 text-xs">
                <div className="flex items-start gap-3 p-3 rounded-2xl bg-[#0B1120] border border-slate-800/80">
                  <div className="w-6 h-6 rounded-lg bg-[#FF6B00] text-white font-bold flex items-center justify-center shrink-0 text-xs shadow-xs">
                    1
                  </div>
                  <div>
                    <p className="font-bold text-slate-100 flex items-center gap-1.5">
                      Tap the Share button <Share className="w-3.5 h-3.5 text-[#FF6B00] inline" />
                    </p>
                    <p className="text-slate-400 mt-0.5">Found at the bottom menu bar in Safari.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-2xl bg-[#0B1120] border border-slate-800/80">
                  <div className="w-6 h-6 rounded-lg bg-[#FF6B00] text-white font-bold flex items-center justify-center shrink-0 text-xs shadow-xs">
                    2
                  </div>
                  <div>
                    <p className="font-bold text-slate-100 flex items-center gap-1.5">
                      Tap &quot;Add to Home Screen&quot; <PlusSquare className="w-3.5 h-3.5 text-[#FF6B00] inline" />
                    </p>
                    <p className="text-slate-400 mt-0.5">Scroll down slightly in the share sheet.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-2xl bg-[#0B1120] border border-slate-800/80">
                  <div className="w-6 h-6 rounded-lg bg-[#FF6B00] text-white font-bold flex items-center justify-center shrink-0 text-xs shadow-xs">
                    3
                  </div>
                  <div>
                    <p className="font-bold text-slate-100">Tap &quot;Add&quot; in top right</p>
                    <p className="text-slate-400 mt-0.5">Skyland Portal will appear on your iPhone screen.</p>
                  </div>
                </div>
              </div>
            ) : (
              /* Android / Chrome Instructions */
              <div className="space-y-3 my-4 text-xs">
                <div className="flex items-start gap-3 p-3 rounded-2xl bg-[#0B1120] border border-slate-800/80">
                  <div className="w-6 h-6 rounded-lg bg-[#FF6B00] text-white font-bold flex items-center justify-center shrink-0 text-xs shadow-xs">
                    1
                  </div>
                  <div>
                    <p className="font-bold text-slate-100 flex items-center gap-1.5">
                      Tap Chrome menu <MoreVertical className="w-3.5 h-3.5 text-[#FF6B00] inline" />
                    </p>
                    <p className="text-slate-400 mt-0.5">The three dots in the top-right corner of Chrome.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-2xl bg-[#0B1120] border border-slate-800/80">
                  <div className="w-6 h-6 rounded-lg bg-[#FF6B00] text-white font-bold flex items-center justify-center shrink-0 text-xs shadow-xs">
                    2
                  </div>
                  <div>
                    <p className="font-bold text-slate-100 flex items-center gap-1.5">
                      Tap &quot;Install app&quot; or &quot;Add to Home screen&quot;
                    </p>
                    <p className="text-slate-400 mt-0.5">Select the option from the browser menu.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-2xl bg-[#0B1120] border border-slate-800/80">
                  <div className="w-6 h-6 rounded-lg bg-[#FF6B00] text-white font-bold flex items-center justify-center shrink-0 text-xs shadow-xs">
                    3
                  </div>
                  <div>
                    <p className="font-bold text-slate-100">Tap &quot;Install&quot; to confirm</p>
                    <p className="text-slate-400 mt-0.5">The native APK app will install on your phone instantly.</p>
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={() => setShowGuideModal(false)}
              className="w-full py-2.5 bg-[#FF6B00] hover:bg-[#FF8533] text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-lg shadow-orange-500/20 active:scale-98"
            >
              Got it, thanks!
            </button>
          </div>
        </div>
      )}
    </>
  );
}
