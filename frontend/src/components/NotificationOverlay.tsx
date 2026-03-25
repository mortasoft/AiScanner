import React from 'react';
import { CheckCircle, XCircle, Info, Trash2, AlertTriangle } from 'lucide-react';

interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface ConfirmDialog {
  show: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  type: 'danger' | 'warning' | 'info';
}

interface NotificationOverlayProps {
  toasts: Toast[];
  confirmDialog: ConfirmDialog;
  closeConfirm: () => void;
}

export default function NotificationOverlay({ toasts, confirmDialog, closeConfirm }: NotificationOverlayProps) {
  return (
    <>
      {/* Custom Confirmation Modal */}
      {confirmDialog.show && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={closeConfirm}></div>
          <div className="relative bg-slate-900 border border-slate-700/50 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className={`p-2 rounded-lg ${
                  confirmDialog.type === 'danger' ? 'bg-red-500/10 text-red-400' :
                  confirmDialog.type === 'warning' ? 'bg-amber-500/10 text-amber-400' : 'bg-cyan-500/10 text-cyan-400'
                }`}>
                  {confirmDialog.type === 'danger' ? <Trash2 className="w-5 h-5" /> : 
                   confirmDialog.type === 'warning' ? <AlertTriangle className="w-5 h-5" /> : <Info className="w-5 h-5" />}
                </div>
                <h3 className="text-lg font-bold text-white">{confirmDialog.title}</h3>
              </div>
              <p className="text-sm text-slate-400 leading-relaxed mb-6 font-medium">
                {confirmDialog.message}
              </p>
              <div className="flex space-x-3">
                <button 
                  onClick={closeConfirm}
                  className="flex-1 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-400 bg-slate-800 hover:bg-slate-700 transition-all font-mono uppercase tracking-widest"
                >
                  CANCEL
                </button>
                <button 
                  onClick={() => {
                    confirmDialog.onConfirm();
                    closeConfirm();
                  }}
                  className={`flex-1 px-4 py-2.5 rounded-xl text-xs font-bold text-white transition-all shadow-lg font-mono uppercase tracking-widest ${
                    confirmDialog.type === 'danger' ? 'bg-red-600 hover:bg-red-500 shadow-red-500/20' :
                    confirmDialog.type === 'warning' ? 'bg-amber-600 hover:bg-amber-500 shadow-amber-500/20' : 'bg-cyan-600 hover:bg-cyan-500 shadow-cyan-500/20'
                  }`}
                >
                  {confirmDialog.type === 'danger' ? 'DELETE' : 'CONFIRM'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Floating Toasts Container */}
      <div className="fixed bottom-6 right-6 z-[110] flex flex-col space-y-3 pointer-events-none">
        {toasts.map(toast => (
          <div key={toast.id} className="pointer-events-auto min-w-[300px] animate-in slide-in-from-right-10 duration-300">
            <div className="bg-slate-900/95 backdrop-blur-xl border border-slate-700/50 rounded-xl p-4 shadow-2xl flex items-center space-x-3">
              <div className={`p-1.5 rounded-lg shrink-0 ${
                toast.type === 'success' ? 'bg-emerald-500/10 text-emerald-400' :
                toast.type === 'error' ? 'bg-red-500/10 text-red-400' : 'bg-blue-500/10 text-blue-400'
              }`}>
                {toast.type === 'success' ? <CheckCircle className="w-5 h-5" /> :
                 toast.type === 'error' ? <XCircle className="w-5 h-5" /> : <Info className="w-5 h-5" />}
              </div>
              <p className="text-sm font-semibold text-slate-100">{toast.message}</p>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
