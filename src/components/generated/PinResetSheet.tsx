import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, CheckCircle2, Loader2, ArrowRight } from 'lucide-react';
import { sendPinResetOtp, verifyPinOtp, updateAdminPin, getNegocioId } from '../../lib/db';

type Step = 'send' | 'verify' | 'new_pin' | 'success';

export const PinResetSheet: React.FC<{
  isOpen: boolean;
  email: string;
  onClose: () => void;
  onPinUpdated: (newPin: string) => void;
}> = ({ isOpen, email, onClose, onPinUpdated }) => {
  const [step, setStep] = useState<Step>('send');
  const [otpInput, setOtpInput] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [activeInput, setActiveInput] = useState<'new' | 'confirm'>('new');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setStep('send');
    setOtpInput('');
    setNewPin('');
    setConfirmPin('');
    setActiveInput('new');
    setLoading(false);
    setError(null);
  };

  const handleClose = () => {
    onClose();
    setTimeout(reset, 400);
  };

  const handleSendOtp = async () => {
    setLoading(true);
    setError(null);
    const { error } = await sendPinResetOtp(email);
    setLoading(false);
    if (error) {
      setError('No se pudo enviar el código. Verificá tu conexión.');
    } else {
      setStep('verify');
    }
  };

  const handleVerifyOtp = async () => {
    if (otpInput.length < 6) { setError('Ingresá el código completo'); return; }
    setLoading(true);
    setError(null);
    const { error } = await verifyPinOtp(email, otpInput);
    setLoading(false);
    if (error) {
      setError('Código incorrecto o expirado');
    } else {
      setStep('new_pin');
    }
  };

  const handlePinKey = (key: number | '⌫') => {
    setError(null);
    if (activeInput === 'new') {
      if (key === '⌫') {
        setNewPin(p => p.slice(0, -1));
      } else if (newPin.length < 4) {
        const next = newPin + String(key);
        setNewPin(next);
        if (next.length === 4) setActiveInput('confirm');
      }
    } else {
      if (key === '⌫') {
        setConfirmPin(p => p.slice(0, -1));
      } else if (confirmPin.length < 4) {
        setConfirmPin(p => p + String(key));
      }
    }
  };

  const handleSavePin = async () => {
    if (newPin.length < 4) { setError('El PIN debe tener 4 dígitos'); return; }
    if (newPin !== confirmPin) { setError('Los PINs no coinciden'); setConfirmPin(''); setActiveInput('confirm'); return; }
    setLoading(true);
    setError(null);
    const negocioId = getNegocioId();
    if (negocioId) await updateAdminPin(negocioId, newPin);
    setLoading(false);
    setStep('success');
    onPinUpdated(newPin);
    setTimeout(handleClose, 2000);
  };

  return (
    <AnimatePresence>
      {isOpen && <>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/40 z-[60]" onClick={handleClose} />
        <motion.div
          initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 28, stiffness: 300 }}
          className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white rounded-t-3xl z-[60] px-5 pt-4 pb-10"
          onClick={e => e.stopPropagation()}
        >
          <div className="w-10 h-1 bg-neutral-200 rounded-full mx-auto mb-5" />

          <div className="flex items-center justify-between mb-6">
            <h3 className="text-base font-black text-black">Recuperar PIN</h3>
            <button onClick={handleClose} className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-500 active:scale-90 transition-transform">
              <X size={14} strokeWidth={2} />
            </button>
          </div>

          {/* Step: send */}
          {step === 'send' && (
            <div className="space-y-5">
              <div className="bg-neutral-50 border border-neutral-100 rounded-2xl px-4 py-4 flex items-start gap-3">
                <Mail size={16} className="text-neutral-400 mt-0.5 shrink-0" strokeWidth={2} />
                <div>
                  <p className="text-xs font-black text-neutral-800">Verificación por email</p>
                  <p className="text-[11px] text-neutral-500 font-medium mt-0.5">
                    Te enviamos un código de 6 dígitos a{' '}
                    <span className="font-black text-neutral-700">{email}</span>
                  </p>
                </div>
              </div>
              {error && <p className="text-xs text-red-500 text-center">{error}</p>}
              <button
                onClick={handleSendOtp}
                disabled={loading}
                className="w-full py-4 rounded-2xl bg-black text-white text-sm font-black flex items-center justify-center gap-2 active:scale-[0.98] transition-all disabled:opacity-50"
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : <Mail size={16} strokeWidth={2.5} />}
                <span>{loading ? 'Enviando...' : 'Enviar código al mail'}</span>
              </button>
            </div>
          )}

          {/* Step: verify OTP */}
          {step === 'verify' && (
            <div className="space-y-5">
              <p className="text-sm text-neutral-500">
                Ingresá el código que enviamos a <span className="font-black text-neutral-800">{email}</span>
              </p>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={otpInput}
                onChange={e => { setOtpInput(e.target.value.replace(/\D/g, '')); setError(null); }}
                placeholder="000000"
                autoFocus
                className="w-full text-center text-3xl font-black tracking-[0.4em] bg-neutral-50 border border-neutral-200 rounded-2xl py-4 outline-none focus:border-black transition-colors tabular-nums"
              />
              {error && <p className="text-xs text-red-500 text-center">{error}</p>}
              <button
                onClick={handleVerifyOtp}
                disabled={loading || otpInput.length < 6}
                className="w-full py-4 rounded-2xl bg-black text-white text-sm font-black flex items-center justify-center gap-2 active:scale-[0.98] transition-all disabled:opacity-50"
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : <ArrowRight size={16} strokeWidth={2.5} />}
                <span>{loading ? 'Verificando...' : 'Verificar código'}</span>
              </button>
              <button onClick={() => { setStep('send'); setError(null); }} className="w-full text-center text-xs text-neutral-400 py-1">
                ← Reenviar código
              </button>
            </div>
          )}

          {/* Step: new PIN */}
          {step === 'new_pin' && (
            <div className="space-y-5">
              <div className="space-y-3">
                <div>
                  <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-2">
                    {activeInput === 'new' ? 'Nuevo PIN (4 dígitos)' : 'Confirmar nuevo PIN'}
                  </p>
                  <div className="flex items-center gap-2">
                    {/* New PIN dots */}
                    <div className="flex-1 flex justify-center gap-3">
                      {[0,1,2,3].map(i => (
                        <div key={i} className={`w-4 h-4 rounded-full border-2 transition-all ${
                          newPin.length > i
                            ? activeInput === 'new' ? 'bg-black border-black' : 'bg-neutral-300 border-neutral-300'
                            : 'bg-transparent border-neutral-200'
                        }`} />
                      ))}
                    </div>
                    <span className="text-neutral-300 text-sm">·</span>
                    {/* Confirm PIN dots */}
                    <div className="flex-1 flex justify-center gap-3">
                      {[0,1,2,3].map(i => (
                        <div key={i} className={`w-4 h-4 rounded-full border-2 transition-all ${
                          confirmPin.length > i
                            ? 'bg-black border-black'
                            : activeInput === 'confirm' ? 'bg-transparent border-neutral-400' : 'bg-transparent border-neutral-200'
                        }`} />
                      ))}
                    </div>
                  </div>
                  <div className="flex mt-1">
                    <p className={`flex-1 text-center text-[9px] font-bold uppercase tracking-wide ${activeInput === 'new' ? 'text-black' : 'text-neutral-300'}`}>Nuevo</p>
                    <div className="w-6" />
                    <p className={`flex-1 text-center text-[9px] font-bold uppercase tracking-wide ${activeInput === 'confirm' ? 'text-black' : 'text-neutral-300'}`}>Confirmar</p>
                  </div>
                </div>
              </div>

              {error && <p className="text-xs text-red-500 text-center">{error}</p>}

              <div className="grid grid-cols-3 gap-2">
                {[1,2,3,4,5,6,7,8,9,'',0,'⌫'].map((key, i) => (
                  <button key={i} disabled={key === ''} onClick={() => handlePinKey(key as number | '⌫')}
                    className={`h-14 rounded-2xl text-lg font-light flex items-center justify-center transition-all active:scale-90 ${key === '' ? 'pointer-events-none' : 'bg-neutral-100 active:bg-neutral-200 text-black'}`}>
                    {key}
                  </button>
                ))}
              </div>

              {confirmPin.length === 4 && (
                <button
                  onClick={handleSavePin}
                  disabled={loading}
                  className="w-full py-4 rounded-2xl bg-black text-white text-sm font-black flex items-center justify-center gap-2 active:scale-[0.98] transition-all disabled:opacity-50"
                >
                  {loading ? <Loader2 size={16} className="animate-spin" /> : null}
                  <span>{loading ? 'Guardando...' : 'Guardar nuevo PIN'}</span>
                </button>
              )}
            </div>
          )}

          {/* Step: success */}
          {step === 'success' && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center gap-4 py-6">
              <div className="w-16 h-16 rounded-3xl bg-green-100 flex items-center justify-center">
                <CheckCircle2 size={32} className="text-green-600" strokeWidth={1.75} />
              </div>
              <div className="text-center">
                <p className="text-base font-black text-black">PIN actualizado</p>
                <p className="text-sm text-neutral-400 mt-1">Tu nuevo PIN está guardado</p>
              </div>
            </motion.div>
          )}
        </motion.div>
      </>}
    </AnimatePresence>
  );
};
