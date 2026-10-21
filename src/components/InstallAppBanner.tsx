'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Smartphone, Download, X, Share, PlusSquare, CheckCircle, MoreVertical, Loader2 } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function InstallAppBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const deferredPromptRef = useRef<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [installingInProgress, setInstallingInProgress] = useState(false);
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [justInstalled, setJustInstalled] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // 1. Purge any legacy PWA caches (v1-v4) immediately so Android WebAPK icon hashes match the server 100%
    if ('caches' in window) {
      caches
        .keys()
        .then((keys) => {
          keys.forEach((key) => {
            if (key !== 'skyland-pwa-v5') {
              caches.delete(key).catch(() => {});
            }
          });
        })
        .catch(() => {});
    }

    // 2. Register & force-update Service Worker immediately
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js', { updateViaCache: 'none' })
        .then((reg) => {
          reg.update().catch(() => {});
        })
        .catch(() => {});
    }

    // 3. Check if already running inside installed standalone app
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true ||
      document.referrer.includes('android-app://');

    if (isStandalone) {
      setIsInstalled(true);
      return;
    }

    // 4. Platform Detection
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    const isAndroidDevice = /android/.test(userAgent);

    setIsIOS(isIosDevice);
    setIsAndroid(isAndroidDevice);

    // 5. Capture native browser install prompt (Android Chrome, Edge, desktop Chrome)
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      deferredPromptRef.current = promptEvent;
      setDeferredPrompt(promptEvent);
      setShowBanner(true);
    };

    // 6. Track when Android/Chrome finishes installing the WebAPK
    const handleAppInstalled = () => {
      setInstallingInProgress(false);
      setIsInstalled(true);
      setShowBanner(false);
      setShowGuideModal(false);
      setJustInstalled(true);
      setTimeout(() => setJustInstalled(false), 8000);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);

    // 7. Surface notification banner immediately when opening portal link (if not installed)
    const dismissedTime = sessionStorage.getItem('skyland_pwa_dismissed');
    const isRecentlyDismissed =
      dismissedTime && Date.now() - parseInt(dismissedTime, 10) < 15 * 60 * 1000;

    let timer: ReturnType<typeof setTimeout> | null = null;
    if (!isRecentlyDismissed) {
      timer = setTimeout(() => {
        setShowBanner(true);
      }, 250);
    }

    // 8. Global listener for "Install App" button clicks
    const handleOpenInstall = () => {
      if (deferredPromptRef.current) {
        triggerNativePrompt(deferredPromptRef.current);
      } else {
        setShowGuideModal(true);
      }
    };
    window.addEventListener('open-pwa-install', handleOpenInstall);

    return () => {
      if (timer) clearTimeout(timer);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('open-pwa-install', handleOpenInstall);
    };
  }, []);

  const triggerNativePrompt = async (promptEvent: BeforeInstallPromptEvent) => {
    try {
      await promptEvent.prompt();
      const choiceResult = await promptEvent.userChoice;
      deferredPromptRef.current = null;
      setDeferredPrompt(null);

      if (choiceResult.outcome === 'accepted') {
        setShowBanner(false);
        setShowGuideModal(false);
        setInstallingInProgress(true);
        // Fallback timeout in case the browser doesn't fire 'appinstalled'
        setTimeout(() => {
          setInstallingInProgress((prev) => {
            if (prev) {
              setJustInstalled(true);
              setTimeout(() => setJustInstalled(false), 7000);
            }
            return false;
          });
        }, 12000);
      }
    } catch (err) {
      console.error('Install prompt error:', err);
      setShowGuideModal(true);
    }
  };

  const handleInstallClick = async () => {
    if (deferredPromptRef.current) {
      await triggerNativePrompt(deferredPromptRef.current);
      return;
    }

    // If user clicked very fast before Chrome finished evaluating beforeinstallprompt, wait up to 1.5s
    if (isAndroid) {
      for (let i = 0; i < 6; i++) {
        await new Promise((r) => setTimeout(r, 250));
        if (deferredPromptRef.current) {
          await triggerNativePrompt(deferredPromptRef.current);
          return;
        }
      }
    }

    setShowGuideModal(true);
  };

  const handleDismiss = () => {
    setShowBanner(false);
    sessionStorage.setItem('skyland_pwa_dismissed', Date.now().toString());
  };

  if (isInstalled && !justInstalled && !installingInProgress) return null;

  return (
    <>
      {/* Live Installing Progress Toast (while Android builds the WebAPK) */}
      {installingInProgress && (
        <div className="fixed top-4 left-3 right-3 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 sm:max-w-md z-50 bg-[#0D1527] border border-orange-500/50 text-white px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3.5 animate-in fade-in slide-in-from-top-4 duration-300">
          <Loader2 className="w-5 h-5 text-[#FF6B00] animate-spin shrink-0" />
          <div className="text-xs leading-relaxed">
            <p className="font-bold text-white">Building &amp; Installing Skyland App...</p>
            <p className="text-slate-300">Keep Chrome open for 5–10 seconds while Android adds it to your Apps &amp; Home Screen.</p>
          </div>
        </div>
      )}

      {/* Success Notification after Android finishes installing */}
      {justInstalled && !installingInProgress && (
        <div className="fixed top-4 left-3 right-3 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 sm:max-w-md z-50 bg-emerald-600 text-white px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300">
          <CheckCircle className="w-5 h-5 text-emerald-100 shrink-0" />
          <div className="text-xs leading-relaxed">
            <p className="font-bold">Skyland App Installed!</p>
            <p className="text-emerald-100">Look for &ldquo;Skyland&rdquo; on your Home Screen or at the end of your App Drawer.</p>
          </div>
        </div>
      )}

      {/* Floating App Download Notification Banner */}
      {showBanner && !isInstalled && !installingInProgress && (
        <div className="fixed bottom-3 left-3 right-3 sm:left-auto sm:right-6 sm:bottom-6 sm:max-w-md z-40 bg-[#0D1527]/95 backdrop-blur-md text-white p-4 sm:p-5 rounded-3xl shadow-2xl border border-orange-500/40 animate-in fade-in slide-in-from-bottom-5 duration-300">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-white p-1.5 flex items-center justify-center shrink-0 shadow-lg shadow-orange-500/25">
                <img src="/icon-192-v5.png" alt="Skyland App Icon" className="w-full h-full object-contain" />
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
              <span>
                {deferredPrompt
                  ? 'Install App Now'
                  : isIOS
                  ? 'Install on iPhone'
                  : isAndroid
                  ? 'Install on Android Phone'
                  : 'Install Skyland App'}
              </span>
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
                  <p className="text-[11px] text-slate-400">Add to your Home Screen &amp; App Drawer</p>
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
                      Open in Chrome &amp; tap menu <MoreVertical className="w-3.5 h-3.5 text-[#FF6B00] inline" />
                    </p>
                    <p className="text-slate-400 mt-0.5">Tap the three dots in the top-right corner of Google Chrome.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-2xl bg-[#0B1120] border border-slate-800/80">
                  <div className="w-6 h-6 rounded-lg bg-[#FF6B00] text-white font-bold flex items-center justify-center shrink-0 text-xs shadow-xs">
                    2
                  </div>
                  <div>
                    <p className="font-bold text-slate-100">
                      Tap &quot;Install app&quot; or &quot;Add to Home screen&quot;
                    </p>
                    <p className="text-slate-400 mt-0.5">
                      If it says &quot;Open Skyland&quot;, an older version is already installed — tap it to open or uninstall the old one first.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-2xl bg-[#0B1120] border border-slate-800/80">
                  <div className="w-6 h-6 rounded-lg bg-[#FF6B00] text-white font-bold flex items-center justify-center shrink-0 text-xs shadow-xs">
                    3
                  </div>
                  <div>
                    <p className="font-bold text-slate-100">Wait 5–10 seconds for Android installer</p>
                    <p className="text-slate-400 mt-0.5">
                      Keep Chrome open for a few seconds until Android finishes adding &quot;Skyland&quot; to your Home Screen &amp; App Drawer.
                    </p>
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
