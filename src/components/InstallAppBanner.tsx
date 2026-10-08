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
    // 1. Robust Service Worker Registration
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      const registerSW = () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((reg) => {
            console.log('PWA Service Worker registered at scope:', reg.scope);
          })
          .catch((err) => {
            console.log('PWA Service Worker registration notice:', err);
          });
      };

      if (document.readyState === 'complete') {
        registerSW();
      } else {
        window.addEventListener('load', registerSW);
      }
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

    // 6. On mobile phones, always surface notification banner after brief delay
    const dismissedTime = localStorage.getItem('skyland_pwa_dismissed');
    const isRecentlyDismissed =
      dismissedTime && Date.now() - parseInt(dismissedTime, 10) < 4 * 60 * 60 * 1000; // 4 hours

    if (isMobile && !isRecentlyDismissed && !isStandalone) {
      const timer = setTimeout(() => {
        setShowBanner(true);
      }, 1200);
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
    localStorage.setItem('skyland_pwa_dismissed', Date.now().toString());
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

      {/* Floating Mobile App Download Notification Banner */}
      {showBanner && !isInstalled && (
        <div className="fixed bottom-3 left-3 right-3 sm:left-auto sm:right-6 sm:bottom-6 sm:max-w-md z-40 bg-slate-900/95 backdrop-blur-md text-white p-4 sm:p-5 rounded-3xl shadow-2xl border border-slate-700 animate-in fade-in slide-in-from-bottom-5 duration-300">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shrink-0 shadow-lg shadow-indigo-500/30">
                <Smartphone className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <h4 className="font-bold text-sm text-white leading-tight">Install Skyland on Phone</h4>
                </div>
                <p className="text-xs text-slate-300 mt-0.5 leading-snug">
                  Get the app on your home screen for instant shift punch in, live roster & notifications.
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

          <div className="flex items-center gap-2.5 mt-3.5 pt-3 border-t border-slate-800">
            <button
              onClick={handleInstallClick}
              className="flex-1 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-98"
            >
              <Download className="w-4 h-4" />
              <span>{isIOS ? 'Install on iPhone' : 'Download App on Phone'}</span>
            </button>

            <button
              onClick={handleDismiss}
              className="py-2 px-3 text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors"
            >
              Later
            </button>
          </div>
        </div>
      )}

      {/* Visual Step-by-Step Installation Modal */}
      {showGuideModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-slate-900 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">
                    {isIOS ? 'Install on iPhone / iPad' : 'Install on Android / Phone'}
                  </h3>
                  <p className="text-[11px] text-slate-400">Add directly to your home screen</p>
                </div>
              </div>
              <button
                onClick={() => setShowGuideModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* iOS Instructions */}
            {isIOS ? (
              <div className="space-y-3.5 my-4 text-xs text-slate-600">
                <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-100">
                  <div className="w-6 h-6 rounded-lg bg-indigo-600 text-white font-bold flex items-center justify-center shrink-0 text-xs">
                    1
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 flex items-center gap-1.5">
                      Tap the Share button <Share className="w-3.5 h-3.5 text-indigo-600 inline" />
                    </p>
                    <p className="text-slate-500 mt-0.5">At the bottom menu bar in Safari.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-100">
                  <div className="w-6 h-6 rounded-lg bg-indigo-600 text-white font-bold flex items-center justify-center shrink-0 text-xs">
                    2
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 flex items-center gap-1.5">
                      Tap "Add to Home Screen" <PlusSquare className="w-3.5 h-3.5 text-indigo-600 inline" />
                    </p>
                    <p className="text-slate-500 mt-0.5">Scroll down slightly in the share menu options.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-100">
                  <div className="w-6 h-6 rounded-lg bg-indigo-600 text-white font-bold flex items-center justify-center shrink-0 text-xs">
                    3
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">Tap "Add" in the top right</p>
                    <p className="text-slate-500 mt-0.5">Skyland icon will appear on your phone home screen.</p>
                  </div>
                </div>
              </div>
            ) : (
              /* Android / Chrome Instructions */
              <div className="space-y-3.5 my-4 text-xs text-slate-600">
                <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-100">
                  <div className="w-6 h-6 rounded-lg bg-indigo-600 text-white font-bold flex items-center justify-center shrink-0 text-xs">
                    1
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 flex items-center gap-1.5">
                      Tap browser menu <MoreVertical className="w-3.5 h-3.5 text-indigo-600 inline" />
                    </p>
                    <p className="text-slate-500 mt-0.5">The three dots in the top-right corner of Chrome.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-100">
                  <div className="w-6 h-6 rounded-lg bg-indigo-600 text-white font-bold flex items-center justify-center shrink-0 text-xs">
                    2
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 flex items-center gap-1.5">
                      Tap "Install app" or "Add to Home screen"
                    </p>
                    <p className="text-slate-500 mt-0.5">Select the option from the browser dropdown.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-100">
                  <div className="w-6 h-6 rounded-lg bg-indigo-600 text-white font-bold flex items-center justify-center shrink-0 text-xs">
                    3
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">Confirm "Install"</p>
                    <p className="text-slate-500 mt-0.5">The native app will download and install instantly.</p>
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={() => setShowGuideModal(false)}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs"
            >
              Got it, thanks!
            </button>
          </div>
        </div>
      )}
    </>
  );
}
