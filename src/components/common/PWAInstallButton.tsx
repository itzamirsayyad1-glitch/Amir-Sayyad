import React, { useState } from 'react';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { Download, Smartphone, X } from 'lucide-react';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [showAndroidGuide, setShowAndroidGuide] = useState(false);

  // If running in standalone mode, show clean installed status
  if (isInstalled) {
    return (
      <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
        App Installed
      </div>
    );
  }

  return (
    <>
      {isInstallable ? (
        <button
          onClick={install}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-sm transition active:scale-95"
          title="Install M1 Enterprises app on Android phone or computer"
        >
          <Download className="w-3.5 h-3.5 text-slate-950" />
          <span>Install App</span>
        </button>
      ) : (
        <button
          onClick={() => setShowAndroidGuide(true)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-800/80 hover:bg-slate-700/80 text-amber-300 border border-amber-400/30 transition"
          title="Install M1 Enterprises on phone or desktop"
        >
          <Smartphone className="w-3.5 h-3.5 text-amber-400" />
          <span className="hidden sm:inline">Install PWA</span>
          <span className="sm:hidden">App</span>
        </button>
      )}

      {/* Android & Desktop Manual Guide Modal */}
      {showAndroidGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-700 p-5 shadow-2xl text-slate-100 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-400 flex items-center justify-center font-bold text-slate-950 text-sm">
                  M1
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">Install M1 ENTERPRISES</h3>
                  <p className="text-xs text-slate-400">Android &amp; Desktop PWA</p>
                </div>
              </div>
              <button 
                onClick={() => setShowAndroidGuide(false)}
                className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs text-slate-300">
              <div className="p-3 rounded-xl bg-slate-800/70 border border-slate-700">
                <p className="font-semibold text-amber-300 mb-1">On Android Chrome / Edge:</p>
                <p>1. Tap the three dots <span className="font-mono bg-slate-700 px-1 py-0.5 rounded">⋮</span> in the top right browser menu.</p>
                <p>2. Select <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong>.</p>
                <p>3. Tap <strong>Install</strong> to get the full-screen native store experience with offline sync.</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-800/70 border border-slate-700">
                <p className="font-semibold text-sky-300 mb-1">On Windows / Mac / Desktop:</p>
                <p>Look for the <strong>Install</strong> icon in the address bar (right side of URL), or use the browser menu &rarr; <strong>Save and share &rarr; Install page as app</strong>.</p>
              </div>
            </div>

            <button
              onClick={() => setShowAndroidGuide(false)}
              className="mt-4 w-full py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs transition"
            >
              Got It
            </button>
          </div>
        </div>
      )}

      {/* iOS Safari Guide Modal */}
      {showIOSGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-700 p-5 shadow-2xl text-slate-100">
            <h3 className="text-base font-bold text-amber-300">Install on iPhone / iPad</h3>
            <p className="mt-2 text-xs text-slate-300 leading-relaxed">
              1. Tap the <strong>Share</strong> button at the bottom of Safari.<br />
              2. Scroll down and tap <strong>Add to Home Screen</strong>.<br />
              3. Tap <strong>Add</strong> in the top right corner.
            </p>
            <button
              onClick={() => setShowIOSGuide(false)}
              className="mt-4 w-full rounded-xl bg-slate-800 hover:bg-slate-700 py-2 text-xs font-semibold text-white transition"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
};
