import React, { useEffect, useState } from 'react';
import { 
  CheckCircle2, 
  AlertCircle, 
  Info, 
  AlertTriangle, 
  X, 
  Sparkles, 
  Check,
  UploadCloud,
  FileSpreadsheet,
  Coins,
  QrCode,
  Users
} from 'lucide-react';
import confetti from 'canvas-confetti';

export type FeedbackType = 'success' | 'error' | 'info' | 'warning' | 'celebrate' | 'sync';

export interface FeedbackToastItem {
  id: string;
  type: FeedbackType;
  title: string;
  message?: string;
  duration?: number;
  iconType?: 'check' | 'money' | 'attendance' | 'user' | 'sheet' | 'sparkles';
}

export interface ActionFeedbackModalData {
  isOpen: boolean;
  type: FeedbackType;
  title: string;
  message: string;
  badge?: string;
  iconType?: 'check' | 'money' | 'attendance' | 'user' | 'sheet' | 'sparkles';
}

// Play pleasant web audio chime for instant sensory feedback
export const playActionFeedbackSound = (type: FeedbackType = 'success') => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const now = ctx.currentTime;

    if (type === 'celebrate' || type === 'success') {
      // Pleasant two-tone bell chime (C5 -> G5)
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sine';
      osc2.type = 'sine';

      osc1.frequency.setValueAtTime(523.25, now); // C5
      osc1.frequency.exponentialRampToValueAtTime(783.99, now + 0.1); // G5

      osc2.frequency.setValueAtTime(659.25, now + 0.08); // E5
      osc2.frequency.exponentialRampToValueAtTime(1046.50, now + 0.2); // C6

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(now);
      osc1.stop(now + 0.35);
      osc2.start(now + 0.08);
      osc2.stop(now + 0.45);
    } else if (type === 'error') {
      // Low dual warning tone
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.setValueAtTime(180, now + 0.12);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.35);
    }
  } catch (e) {
    // Audio context may be restricted by browser autoplay policy before user interaction
  }
};

/**
 * Triggers full confetti burst on screen
 */
export const triggerConfettiBurst = (options?: { particleCount?: number; spread?: number; origin?: { x: number; y: number } }) => {
  try {
    confetti({
      particleCount: options?.particleCount || 70,
      spread: options?.spread || 70,
      origin: options?.origin || { y: 0.65 },
      colors: ['#4f46e5', '#10b981', '#f59e0b', '#06b6d4', '#ec4899'],
      disableForReducedMotion: true,
    });
  } catch (err) {
    console.error('Confetti error:', err);
  }
};

interface FeedbackNotificationProps {
  toasts: FeedbackToastItem[];
  onRemoveToast: (id: string) => void;
  actionModal: ActionFeedbackModalData | null;
  onCloseActionModal: () => void;
}

export const FeedbackNotification: React.FC<FeedbackNotificationProps> = ({
  toasts,
  onRemoveToast,
  actionModal,
  onCloseActionModal,
}) => {
  // Auto-close action modal after 2.5 seconds
  useEffect(() => {
    if (actionModal && actionModal.isOpen) {
      const timer = setTimeout(() => {
        onCloseActionModal();
      }, 2400);
      return () => clearTimeout(timer);
    }
  }, [actionModal, onCloseActionModal]);

  const getIcon = (type: FeedbackType, iconType?: string) => {
    if (iconType === 'money') return <Coins className="w-5 h-5" />;
    if (iconType === 'attendance') return <QrCode className="w-5 h-5" />;
    if (iconType === 'user') return <Users className="w-5 h-5" />;
    if (iconType === 'sheet') return <FileSpreadsheet className="w-5 h-5" />;
    if (iconType === 'sparkles') return <Sparkles className="w-5 h-5" />;

    switch (type) {
      case 'success':
      case 'celebrate':
        return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
      case 'sync':
        return <UploadCloud className="w-5 h-5 text-indigo-500 animate-bounce" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-rose-500" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-amber-500" />;
      case 'info':
      default:
        return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  return (
    <>
      {/* 1. TOAST NOTIFICATIONS CONTAINER (BOTTOM-RIGHT) */}
      <div 
        id="toast-notifications-container" 
        className="fixed bottom-5 right-5 z-50 flex flex-col space-y-2.5 max-w-sm w-full pointer-events-none px-3 sm:px-0"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            id={`toast-${t.id}`}
            className="pointer-events-auto bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-slate-200/90 p-4 transition-all duration-300 transform translate-y-0 opacity-100 flex items-start space-x-3 text-slate-800 animate-in slide-in-from-bottom-5 fade-in"
          >
            <div className={`p-2 rounded-xl shrink-0 ${
              t.type === 'success' || t.type === 'celebrate'
                ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                : t.type === 'sync'
                ? 'bg-indigo-50 text-indigo-600 border border-indigo-200'
                : t.type === 'error'
                ? 'bg-rose-50 text-rose-600 border border-rose-200'
                : t.type === 'warning'
                ? 'bg-amber-50 text-amber-600 border border-amber-200'
                : 'bg-blue-50 text-blue-600 border border-blue-200'
            }`}>
              {getIcon(t.type, t.iconType)}
            </div>

            <div className="flex-1 min-w-0 pr-1">
              <h4 className="text-xs font-bold text-slate-900 leading-tight">
                {t.title}
              </h4>
              {t.message && (
                <p className="text-xs text-slate-600 mt-0.5 leading-snug break-words">
                  {t.message}
                </p>
              )}
            </div>

            <button
              onClick={() => onRemoveToast(t.id)}
              className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>

      {/* 2. ACTION POPUP ANIMATION OVERLAY (CENTER MODAL FEEDBACK) */}
      {actionModal && actionModal.isOpen && (
        <div 
          id="action-feedback-overlay"
          onClick={onCloseActionModal}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs transition-opacity duration-300 animate-in fade-in cursor-pointer"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl border border-slate-100 transform transition-all duration-300 animate-in zoom-in-95 relative overflow-hidden"
          >
            {/* Background Glow Ring */}
            <div className={`absolute -top-12 -right-12 w-36 h-36 rounded-full blur-2xl opacity-40 ${
              actionModal.type === 'error' ? 'bg-rose-400' : 'bg-emerald-400'
            }`} />
            <div className={`absolute -bottom-12 -left-12 w-36 h-36 rounded-full blur-2xl opacity-40 ${
              actionModal.type === 'error' ? 'bg-amber-400' : 'bg-indigo-400'
            }`} />

            {/* Pulsing Icon Animation */}
            <div className="relative mx-auto mb-5 flex items-center justify-center">
              <div className={`w-20 h-20 rounded-3xl flex items-center justify-center shadow-lg transition-transform animate-bounce ${
                actionModal.type === 'error'
                  ? 'bg-rose-500 text-white shadow-rose-200'
                  : actionModal.type === 'sync'
                  ? 'bg-indigo-600 text-white shadow-indigo-200'
                  : 'bg-emerald-500 text-white shadow-emerald-200'
              }`}>
                {actionModal.type === 'error' ? (
                  <AlertCircle className="w-10 h-10" />
                ) : actionModal.type === 'sync' ? (
                  <UploadCloud className="w-10 h-10 animate-pulse" />
                ) : (
                  <Check className="w-10 h-10 stroke-[3]" />
                )}
              </div>

              {/* Ripple Ring Effect */}
              <span className={`absolute w-24 h-24 rounded-3xl animate-ping opacity-30 ${
                actionModal.type === 'error' ? 'bg-rose-400' : 'bg-emerald-400'
              }`} />
            </div>

            {/* Badge */}
            {actionModal.badge && (
              <span className="inline-block px-3 py-1 mb-2 rounded-full text-2xs font-bold uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200">
                {actionModal.badge}
              </span>
            )}

            {/* Title & Message */}
            <h3 className="text-lg font-extrabold text-slate-900 tracking-tight">
              {actionModal.title}
            </h3>
            <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
              {actionModal.message}
            </p>

            {/* Done button */}
            <div className="mt-6">
              <button
                type="button"
                id="btn-dismiss-feedback"
                onClick={onCloseActionModal}
                className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
              >
                Selesai
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
