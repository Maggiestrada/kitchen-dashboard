import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, X, User, Lock, Eye, EyeOff, Loader2, Check } from 'lucide-react';
import { guardarOnboarding } from '../../lib/db';
import { supabase } from '../../lib/supabase';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface UsuarioConfig {
  id: string;
  nombre: string;
  rol: 'admin' | 'cocinero';
  pin?: string;
}

interface NegocioConfig {
  nombre: string;
  tipo: 'restaurante' | 'local' | 'delivery' | 'otro';
  pais: string;
  email: string;
}

type Plan = 'trial' | 'pro';

// ─── Constants ────────────────────────────────────────────────────────────────

const BLUE = '#72BDE8';
const GRADIENT = 'linear-gradient(160deg, #2E86C1 0%, #72BDE8 55%, #AED6F1 100%)';

const TIPOS_NEGOCIO = [
  { id: 'restaurante' as const, label: 'Restaurante', emoji: '🍽️' },
  { id: 'local' as const, label: 'Local gastronómico', emoji: '🏪' },
  { id: 'delivery' as const, label: 'Delivery', emoji: '🛵' },
  { id: 'otro' as const, label: 'Otro', emoji: '✳️' },
];

// ─── Logo SVG ─────────────────────────────────────────────────────────────────

const InsumaLogo = ({ white = true, height = 44 }: { white?: boolean; height?: number }) => (
  <svg viewBox="0 0 240 60" height={height} aria-label="insuma" style={{ display: 'block' }}>
    <circle cx="14" cy="7" r="4" fill={white ? '#fff' : BLUE} />
    <text x="4" y="54" fontFamily="Georgia, 'Times New Roman', serif" fontStyle="italic"
      fontWeight="300" fontSize="52" fill={white ? '#fff' : BLUE} letterSpacing="1">
      {'ınsuma'}
    </text>
  </svg>
);

// ─── Progress Bar ─────────────────────────────────────────────────────────────

const ProgressBar: React.FC<{ step: number; total: number; onBlue?: boolean }> = ({ step, total, onBlue }) => (
  <div className="flex gap-1.5 px-5 pt-3 pb-1">
    {Array.from({ length: total }).map((_, i) => (
      <div key={i} className="h-0.5 flex-1 rounded-full transition-all duration-300"
        style={{ background: i < step ? (onBlue ? '#fff' : BLUE) : onBlue ? 'rgba(255,255,255,0.3)' : '#e5e7eb' }}
      />
    ))}
  </div>
);

// ─── Blue screen wrapper ───────────────────────────────────────────────────────

const BlueScreen: React.FC<{
  step: number; total: number; title: string; subtitle: string;
  onBack: () => void; children: React.ReactNode; footer?: React.ReactNode;
}> = ({ step, total, title, subtitle, onBack, children, footer }) => (
  <div className="absolute inset-0 flex flex-col" style={{ background: GRADIENT }}>
    <ProgressBar step={step} total={total} onBlue />
    <div className="px-5 h-10 flex items-center">
      <button onClick={onBack}
        className="w-8 h-8 rounded-full flex items-center justify-center active:scale-90 transition-transform"
        style={{ background: 'rgba(255,255,255,0.2)' }}>
        <ArrowLeft size={16} strokeWidth={1.75} color="#fff" />
      </button>
    </div>
    <div className="flex-1 mx-4 mb-4 rounded-3xl overflow-hidden flex flex-col"
      style={{ background: 'rgba(255,255,255,0.13)', backdropFilter: 'blur(16px)' }}>
      <div className="px-6 pt-6 pb-4">
        <h1 className="text-2xl font-light leading-tight" style={{ color: '#fff' }}>{title}</h1>
        <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.7)' }}>{subtitle}</p>
      </div>
      <div className="flex-1 overflow-y-auto px-6 pb-2">{children}</div>
      {footer && <div className="px-6 pb-6 pt-2">{footer}</div>}
    </div>
  </div>
);

// ─── White button ─────────────────────────────────────────────────────────────

const WhiteBtn: React.FC<{ onClick: () => void; disabled?: boolean; loading?: boolean; children: React.ReactNode }> = ({ onClick, disabled, loading, children }) => (
  <button onClick={onClick} disabled={disabled || loading}
    className="w-full rounded-2xl py-4 text-sm font-bold active:scale-[0.98] transition-all disabled:opacity-40 flex items-center justify-center gap-2"
    style={{ background: '#fff', color: '#111', boxShadow: '0 4px 16px rgba(0,0,0,0.12)' }}>
    {loading ? <><Loader2 size={16} className="animate-spin" /> Guardando...</> : children}
  </button>
);

// ─── Blue input (sobre fondo azul) ────────────────────────────────────────────

const BlueInput: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label: string; suffix?: React.ReactNode }> = ({ label, suffix, ...props }) => (
  <div>
    <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: 'rgba(255,255,255,0.7)' }}>{label}</p>
    <div className="flex items-center rounded-2xl border px-4"
      style={{ background: 'rgba(255,255,255,0.18)', borderColor: 'rgba(255,255,255,0.45)' }}>
      <input {...props}
        className="flex-1 py-4 text-sm bg-transparent outline-none placeholder-white/50"
        style={{ color: '#fff' }} />
      {suffix}
    </div>
  </div>
);

// ─── Mini-sheet para agregar usuario ─────────────────────────────────────────

const AgregarUsuarioSheet: React.FC<{
  rol: 'cocinero' | 'admin'; onSave: (u: UsuarioConfig) => void; onClose: () => void;
}> = ({ rol, onSave, onClose }) => {
  const [nombre, setNombre] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  const handleSave = () => {
    if (!nombre.trim()) { setError('El nombre es requerido'); return; }
    if (pin.length !== 4) { setError('El PIN debe tener 4 dígitos'); return; }
    onSave({ id: `usr-${Date.now()}`, nombre: nombre.trim(), rol, pin });
  };

  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/40 z-[60]" onClick={onClose} />
      <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
        className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white rounded-t-3xl z-[60] px-5 pt-4 pb-10"
        onClick={e => e.stopPropagation()}>
        <div className="w-10 h-1 bg-neutral-200 rounded-full mx-auto mb-4" />
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-base font-medium text-black">
            {rol === 'cocinero' ? 'Agregar operador' : 'Agregar admin'}
          </h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-500 active:scale-90 transition-transform">
            <X size={14} strokeWidth={2} />
          </button>
        </div>
        <div className="space-y-4">
          <div>
            <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-2">Nombre</p>
            <input type="text" value={nombre} onChange={e => { setNombre(e.target.value); setError(''); }}
              placeholder={rol === 'cocinero' ? 'Ej: María, Juan…' : 'Ej: Carlos, Ana…'}
              autoFocus
              className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3.5 py-3 text-sm text-black outline-none placeholder-neutral-400 focus:border-neutral-400 transition-colors" />
          </div>
          {(
            <div>
              <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-2">PIN de acceso (4 dígitos)</p>
              <div className="flex gap-1.5 justify-center mb-3">
                {[0, 1, 2, 3].map(i => (
                  <div key={i} className={`w-12 h-12 rounded-xl border-2 flex items-center justify-center text-lg font-black transition-all ${pin.length > i ? 'bg-black border-black text-white' : 'border-neutral-200'}`}>
                    {pin.length > i ? '•' : '·'}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, '', 0, '⌫'].map((key, i) => (
                  <button key={i} disabled={key === ''}
                    onClick={() => {
                      if (key === '⌫') { setPin(p => p.slice(0, -1)); setError(''); }
                      else if (typeof key === 'number' && pin.length < 4) { setPin(p => p + String(key)); setError(''); }
                    }}
                    className={`h-12 rounded-2xl text-base font-medium flex items-center justify-center transition-all active:scale-90 ${key === '' ? 'pointer-events-none' : 'bg-neutral-100 active:bg-neutral-200 text-black'}`}>
                    {key}
                  </button>
                ))}
              </div>
            </div>
          )}
          {error && <p className="text-xs text-red-500 text-center">{error}</p>}
          <button onClick={handleSave} className="w-full bg-black text-white rounded-2xl py-4 text-sm font-medium active:scale-[0.98] transition-transform">
            Guardar
          </button>
        </div>
      </motion.div>
    </>
  );
};

// ─── Usuario chip ─────────────────────────────────────────────────────────────

const UsuarioChip: React.FC<{ usuario: UsuarioConfig; onRemove: () => void }> = ({ usuario, onRemove }) => (
  <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border ${usuario.rol === 'admin' ? 'bg-black border-black' : 'bg-neutral-100 border-neutral-200'}`}>
    <div className={`w-5 h-5 rounded-full flex items-center justify-center ${usuario.rol === 'admin' ? 'bg-white/10' : 'bg-neutral-300'}`}>
      {usuario.rol === 'admin' ? <Lock size={10} className="text-white" /> : <User size={10} className="text-neutral-600" />}
    </div>
    <span className={`text-xs font-medium ${usuario.rol === 'admin' ? 'text-white' : 'text-black'}`}>{usuario.nombre}</span>
    {usuario.rol === 'admin' && usuario.pin && <span className="text-[10px] text-white/50">PIN ••••</span>}
    <button onClick={onRemove}
      className={`w-4 h-4 rounded-full flex items-center justify-center ml-0.5 ${usuario.rol === 'admin' ? 'bg-white/20 text-white' : 'bg-neutral-300 text-neutral-600'} active:scale-90 transition-transform`}>
      <X size={9} strokeWidth={2.5} />
    </button>
  </div>
);

// ─── Slide variants ───────────────────────────────────────────────────────────

const slide = {
  enter: (d: number) => ({ x: d > 0 ? 40 : -40, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (d: number) => ({ x: d > 0 ? -40 : 40, opacity: 0 }),
};

// ─── Main OnboardingFlow ──────────────────────────────────────────────────────

export const OnboardingFlow: React.FC<{ onComplete: () => void; authUserId?: string; authUserEmail?: string; inviteCode?: string }> = ({ onComplete, authUserId, authUserEmail, inviteCode }) => {
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(1);

  // Step 1
  const [nombreNegocio, setNombreNegocio] = useState('');
  // Step 2
  const [tipoNegocio, setTipoNegocio] = useState<NegocioConfig['tipo'] | ''>('');
  // Step 3 — Auth
  const [email, setEmail] = useState(authUserEmail ?? '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);
  // Step 3 — Código de acceso
  const [accessCode, setAccessCode] = useState('');
  const [codeError, setCodeError] = useState('');
  const [codeLoading, setCodeLoading] = useState(false);
  // Step 4 — Plan (was 3)
  const [plan, setPlan] = useState<Plan>('trial');
  // Step 5 — Equipo
  const [usuarios, setUsuarios] = useState<UsuarioConfig[]>([]);
  const [showAgregarSheet, setShowAgregarSheet] = useState<'cocinero' | 'admin' | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [errorGuardar, setErrorGuardar] = useState<string | null>(null);

  const goTo = (next: number) => { setDirection(next > step ? 1 : -1); setStep(next); };

  // Si el usuario volvió de Google OAuth y tiene un código pendiente, salteamos al Plan
  React.useEffect(() => {
    const code = localStorage.getItem('insuma_invite_code');
    if (!code) return;
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) { setStep(5); setDirection(1); }
    });
  }, []);

  // ── Validar código de acceso ──
  const handleValidateCode = async () => {
    setCodeError('');
    setCodeLoading(true);
    const code = accessCode.trim().toUpperCase();
    const PERMANENT_CODES = ['INSUMA.PRUEBA', 'INSUMA.MAGGIE'];
    if (PERMANENT_CODES.includes(code)) {
      setCodeLoading(false);
      localStorage.setItem('insuma_invite_code', code);
      goTo(4);
      return;
    }
    const { data } = await supabase
      .from('invite_codes')
      .select('id, used_by')
      .eq('code', code)
      .maybeSingle();
    setCodeLoading(false);
    if (!data) { setCodeError('Código inválido. Verificá que esté bien escrito.'); return; }
    if (data.used_by) { setCodeError('Este código ya fue utilizado.'); return; }
    localStorage.setItem('insuma_invite_code', code);
    goTo(4);
  };

  const cocineros = usuarios.filter(u => u.rol === 'cocinero');
  const admins = usuarios.filter(u => u.rol === 'admin');

  // ── Auth: crear cuenta con email/password ──
  const handleCrearCuenta = async () => {
    setAuthError('');
    if (!email.trim().includes('@')) { setAuthError('Email inválido'); return; }
    if (password.length < 6) { setAuthError('La contraseña debe tener al menos 6 caracteres'); return; }
    if (password !== confirmPassword) { setAuthError('Las contraseñas no coinciden'); return; }
    setAuthLoading(true);
    const { error } = await supabase.auth.signUp({ email: email.trim(), password });
    setAuthLoading(false);
    if (error) { setAuthError(error.message); return; }
    const code = localStorage.getItem('insuma_invite_code');
    const PERMANENT_CODES = ['INSUMA.PRUEBA', 'INSUMA.MAGGIE'];
    if (code && !PERMANENT_CODES.includes(code)) {
      await supabase.from('invite_codes').update({ used_by: email.trim(), used_at: new Date().toISOString() }).eq('code', code);
      localStorage.removeItem('insuma_invite_code');
    }
    goTo(5);
  };

  // ── Auth: Google OAuth ──
  const handleGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    });
  };

  // ── Guardar todo al finalizar ──
  const handleEmpezar = async () => {
    setGuardando(true);
    setErrorGuardar(null);
    try {
      await guardarOnboarding(
        { nombre: nombreNegocio.trim(), tipo: tipoNegocio as NegocioConfig['tipo'], pais: 'Argentina', email: email.trim() },
        usuarios,
        authUserId,
        inviteCode,
      );
      localStorage.setItem('insuma_plan', plan);
      onComplete();
    } catch (err) {
      console.error(err);
      setErrorGuardar('Hubo un error. Revisá tu conexión e intentá de nuevo.');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ maxWidth: 448, margin: '0 auto' }}>
      <AnimatePresence mode="wait" custom={direction}>

        {/* ── Paso 1: Bienvenida + nombre del negocio ── */}
        {step === 1 && (
          <motion.div key="step1" custom={direction} variants={slide} initial="enter" animate="center" exit="exit"
            transition={{ type: 'spring', damping: 30, stiffness: 340 }}
            className="absolute inset-0 flex flex-col items-center justify-center px-7 py-16"
            style={{ background: GRADIENT }}>
            <InsumaLogo white height={44} />
            <p className="text-xs mt-2 mb-6 tracking-[0.22em] uppercase" style={{ color: 'rgba(255,255,255,0.65)' }}>
              para cocinas
            </p>
            <p className="text-center text-sm leading-relaxed mb-10" style={{ color: 'rgba(255,255,255,0.85)', fontWeight: 300, maxWidth: 270 }}>
              Controlá pedidos, insumos y costos desde un solo lugar.
            </p>
            <div className="w-full max-w-xs">
              <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: 'rgba(255,255,255,0.7)' }}>
                Nombre de tu negocio
              </p>
              <input
                type="text" value={nombreNegocio}
                onChange={e => setNombreNegocio(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && nombreNegocio.trim()) goTo(2); }}
                placeholder="Ej: El Fuego, La Parrilla…"
                className="w-full rounded-2xl border px-4 py-4 text-sm mb-4 outline-none placeholder-white/50"
                style={{ background: 'rgba(255,255,255,0.18)', borderColor: 'rgba(255,255,255,0.45)', color: '#fff' }}
              />
              <WhiteBtn onClick={() => goTo(2)} disabled={!nombreNegocio.trim()}>
                Continuar →
              </WhiteBtn>
              <p className="text-center text-xs mt-4" style={{ color: 'rgba(255,255,255,0.4)' }}>
                Al continuar aceptás los términos de uso
              </p>
            </div>
          </motion.div>
        )}

        {/* ── Paso 2: Tipo de negocio ── */}
        {step === 2 && (
          <motion.div key="step2" custom={direction} variants={slide} initial="enter" animate="center" exit="exit"
            transition={{ type: 'spring', damping: 30, stiffness: 340 }}
            className="absolute inset-0">
            <BlueScreen step={1} total={5} title="¿Qué tipo de negocio tenés?" subtitle="Personalizamos tu experiencia según tu operación."
              onBack={() => goTo(1)}>
              <div className="grid grid-cols-2 gap-3 pb-4">
                {TIPOS_NEGOCIO.map(tipo => (
                  <button key={tipo.id} onClick={() => { setTipoNegocio(tipo.id); setTimeout(() => goTo(authUserId ? 5 : 4), 180); }}
                    className="flex flex-col items-start gap-3 p-5 rounded-2xl border-2 transition-all active:scale-[0.97]"
                    style={{
                      border: tipoNegocio === tipo.id ? '2px solid #fff' : '2px solid rgba(255,255,255,0.25)',
                      background: tipoNegocio === tipo.id ? '#fff' : 'rgba(255,255,255,0.12)',
                    }}>
                    <span className="text-2xl">{tipo.emoji}</span>
                    <span className="text-sm font-semibold leading-tight"
                      style={{ color: tipoNegocio === tipo.id ? '#111' : 'rgba(255,255,255,0.9)' }}>
                      {tipo.label}
                    </span>
                  </button>
                ))}
              </div>
            </BlueScreen>
          </motion.div>
        )}

        {/* ── Paso 3: Código de acceso ── */}
        {step === 3 && (
          <motion.div key="step3" custom={direction} variants={slide} initial="enter" animate="center" exit="exit"
            transition={{ type: 'spring', damping: 30, stiffness: 340 }}
            className="absolute inset-0">
            <BlueScreen step={2} total={5} title="Código de acceso" subtitle="Ingresá el código que te enviamos para activar tu cuenta."
              onBack={() => goTo(2)}
              footer={
                <div className="space-y-3">
                  {codeError && <p className="text-xs text-center" style={{ color: '#ffd5d5' }}>{codeError}</p>}
                  <WhiteBtn onClick={handleValidateCode} loading={codeLoading} disabled={accessCode.trim().length < 4}>
                    Validar código →
                  </WhiteBtn>
                </div>
              }>
              <div className="py-2">
                <BlueInput
                  label="Código de invitación"
                  value={accessCode}
                  onChange={e => { setAccessCode(e.target.value.toUpperCase()); setCodeError(''); }}
                  onKeyDown={(e: React.KeyboardEvent) => { if (e.key === 'Enter' && accessCode.trim().length >= 4) handleValidateCode(); }}
                  placeholder="Ej: INSUMA-2024"
                  autoCapitalize="characters"
                  autoCorrect="off"
                  spellCheck={false}
                />
                <p className="text-xs mt-4 text-center" style={{ color: 'rgba(255,255,255,0.5)' }}>
                  ¿No tenés un código? Escribinos a hola@insuma.app
                </p>
              </div>
            </BlueScreen>
          </motion.div>
        )}

        {/* ── Paso 4: Crear cuenta ── */}
        {step === 4 && (
          <motion.div key="step4" custom={direction} variants={slide} initial="enter" animate="center" exit="exit"
            transition={{ type: 'spring', damping: 30, stiffness: 340 }}
            className="absolute inset-0">
            <BlueScreen step={3} total={5} title="Creá tu cuenta" subtitle="Con estos datos entrás como administrador."
              onBack={() => goTo(3)}
              footer={
                <div className="space-y-3">
                  {authError && <p className="text-xs text-center" style={{ color: '#ffd5d5' }}>{authError}</p>}

                  {/* Google — primario */}
                  <WhiteBtn onClick={handleGoogle}>
                    <svg viewBox="0 0 24 24" width="18" height="18" style={{ flexShrink: 0 }}>
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    Continuar con Google
                  </WhiteBtn>

                  {/* Separador */}
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.25)' }} />
                    <span className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>o</span>
                    <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.25)' }} />
                  </div>

                  {/* Email/contraseña — secundario */}
                  {!showEmailForm ? (
                    <button onClick={() => setShowEmailForm(true)}
                      className="w-full rounded-2xl py-3.5 text-sm font-medium text-center active:scale-[0.98] transition-all"
                      style={{ background: 'rgba(255,255,255,0.12)', border: '1.5px solid rgba(255,255,255,0.3)', color: 'rgba(255,255,255,0.8)' }}>
                      Registrarme con email
                    </button>
                  ) : (
                    <WhiteBtn onClick={handleCrearCuenta} loading={authLoading}
                      disabled={!email.includes('@') || password.length < 6 || password !== confirmPassword}>
                      Crear cuenta →
                    </WhiteBtn>
                  )}
                </div>
              }>
              <div className="space-y-4 py-2">
                {showEmailForm && (
                  <>
                    <BlueInput label="Email" type="email" value={email}
                      onChange={e => { setEmail(e.target.value); setAuthError(''); }}
                      placeholder="tu@email.com" autoComplete="email" />
                    <BlueInput label="Contraseña" type={showPass ? 'text' : 'password'} value={password}
                      onChange={e => { setPassword(e.target.value); setAuthError(''); }}
                      placeholder="Mínimo 6 caracteres"
                      suffix={
                        <button onClick={() => setShowPass(v => !v)} className="ml-2 opacity-60 active:opacity-100">
                          {showPass ? <EyeOff size={16} color="#fff" /> : <Eye size={16} color="#fff" />}
                        </button>
                      } />
                    <BlueInput label="Confirmar contraseña" type={showPass ? 'text' : 'password'} value={confirmPassword}
                      onChange={e => { setConfirmPassword(e.target.value); setAuthError(''); }}
                      placeholder="Repetí la contraseña" />
                  </>
                )}
              </div>
            </BlueScreen>
          </motion.div>
        )}

        {/* ── Paso 5: Plan ── */}
        {step === 5 && (
          <motion.div key="step5" custom={direction} variants={slide} initial="enter" animate="center" exit="exit"
            transition={{ type: 'spring', damping: 30, stiffness: 340 }}
            className="absolute inset-0">
            <BlueScreen step={4} total={5} title="Elegí tu plan" subtitle="Podés cambiar o cancelar cuando quieras."
              onBack={() => goTo(authUserId ? 2 : 4)}
              footer={<WhiteBtn onClick={() => goTo(6)}>Continuar →</WhiteBtn>}>
              <div className="space-y-3 py-2">
                {/* Prueba gratis */}
                <button onClick={() => setPlan('trial')}
                  className="w-full text-left rounded-2xl p-5 transition-all active:scale-[0.98]"
                  style={{
                    background: plan === 'trial' ? '#fff' : 'rgba(255,255,255,0.12)',
                    border: plan === 'trial' ? '2px solid #fff' : '2px solid rgba(255,255,255,0.25)',
                  }}>
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-bold text-sm" style={{ color: plan === 'trial' ? '#111' : '#fff' }}>
                        Prueba gratuita
                      </p>
                      <p className="text-xs mt-1" style={{ color: plan === 'trial' ? '#6b7280' : 'rgba(255,255,255,0.65)' }}>
                        14 días con todas las funciones
                      </p>
                      <p className="text-xs mt-1" style={{ color: plan === 'trial' ? '#6b7280' : 'rgba(255,255,255,0.65)' }}>
                        Sin tarjeta de crédito
                      </p>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-2xl font-black" style={{ color: plan === 'trial' ? '#111' : '#fff' }}>$0</span>
                      <span className="text-xs" style={{ color: plan === 'trial' ? '#9ca3af' : 'rgba(255,255,255,0.5)' }}>/mes</span>
                    </div>
                  </div>
                  {plan === 'trial' && (
                    <div className="flex flex-wrap gap-1.5 mt-4">
                      {['Pedidos ilimitados', 'Proveedores', 'Recetas', 'Métricas'].map(f => (
                        <span key={f} className="flex items-center gap-1 text-[10px] font-medium px-2 py-1 rounded-full"
                          style={{ background: '#f0f9ff', color: BLUE }}>
                          <Check size={10} strokeWidth={2.5} />{f}
                        </span>
                      ))}
                    </div>
                  )}
                </button>

                {/* Pro */}
                <button onClick={() => setPlan('pro')}
                  className="w-full text-left rounded-2xl p-5 transition-all active:scale-[0.98]"
                  style={{
                    background: plan === 'pro' ? '#fff' : 'rgba(255,255,255,0.12)',
                    border: plan === 'pro' ? '2px solid #fff' : '2px solid rgba(255,255,255,0.25)',
                  }}>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-sm" style={{ color: plan === 'pro' ? '#111' : '#fff' }}>Pro</p>
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider"
                          style={{ background: plan === 'pro' ? BLUE : 'rgba(255,255,255,0.25)', color: '#fff' }}>
                          Próximamente
                        </span>
                      </div>
                      <p className="text-xs mt-1" style={{ color: plan === 'pro' ? '#6b7280' : 'rgba(255,255,255,0.65)' }}>
                        Multi-sucursal + soporte prioritario
                      </p>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-2xl font-black" style={{ color: plan === 'pro' ? '#111' : '#fff' }}>$XX</span>
                      <span className="text-xs" style={{ color: plan === 'pro' ? '#9ca3af' : 'rgba(255,255,255,0.5)' }}>/mes</span>
                    </div>
                  </div>
                </button>
              </div>
            </BlueScreen>
          </motion.div>
        )}

        {/* ── Paso 6: Equipo ── */}
        {step === 6 && (
          <motion.div key="step6" custom={direction} variants={slide} initial="enter" animate="center" exit="exit"
            transition={{ type: 'spring', damping: 30, stiffness: 340 }}
            className="absolute inset-0">
            <BlueScreen step={5} total={5} title="Configurá tu equipo" subtitle="Agregá los usuarios que van a usar Insuma."
              onBack={() => goTo(5)}
              footer={
                <div>
                  {errorGuardar && <p className="text-xs text-center mb-2" style={{ color: '#ffd5d5' }}>{errorGuardar}</p>}
                  {!guardando && usuarios.length === 0 && (
                    <p className="text-xs text-center mb-2" style={{ color: 'rgba(255,255,255,0.5)' }}>
                      Agregá al menos un usuario para continuar
                    </p>
                  )}
                  <WhiteBtn onClick={handleEmpezar} disabled={usuarios.length === 0} loading={guardando}>
                    Empezar 🚀
                  </WhiteBtn>
                </div>
              }>
              <div className="space-y-5 py-2">
                {/* Operadores */}
                <div className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.92)' }}>
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-sm font-semibold text-black">Operadores</p>
                      <p className="text-[11px] text-neutral-400">Sin PIN — acceso directo</p>
                    </div>
                    {cocineros.length < 5 && (
                      <button onClick={() => setShowAgregarSheet('cocinero')}
                        className="bg-neutral-100 rounded-xl px-3 py-2 text-xs font-medium text-black active:scale-95 transition-transform">
                        + Agregar
                      </button>
                    )}
                  </div>
                  {cocineros.length === 0
                    ? <div className="border border-dashed border-neutral-200 rounded-xl py-3 flex items-center justify-center">
                        <p className="text-xs text-neutral-400">Ningún operador agregado</p>
                      </div>
                    : <div className="flex flex-wrap gap-2">
                        {cocineros.map(u => <UsuarioChip key={u.id} usuario={u} onRemove={() => setUsuarios(prev => prev.filter(x => x.id !== u.id))} />)}
                      </div>
                  }
                </div>

                {/* Admins */}
                <div className="rounded-2xl p-4 bg-black">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-sm font-semibold text-white">Admins</p>
                      <p className="text-[11px] text-white/40">Con PIN de 4 dígitos</p>
                    </div>
                    {admins.length < 3 && (
                      <button onClick={() => setShowAgregarSheet('admin')}
                        className="rounded-xl px-3 py-2 text-xs font-medium text-white active:scale-95 transition-transform"
                        style={{ background: 'rgba(255,255,255,0.12)' }}>
                        + Agregar
                      </button>
                    )}
                  </div>
                  {admins.length === 0
                    ? <div className="border border-dashed border-white/20 rounded-xl py-3 flex items-center justify-center">
                        <p className="text-xs text-white/40">Ningún admin agregado</p>
                      </div>
                    : <div className="flex flex-wrap gap-2">
                        {admins.map(u => <UsuarioChip key={u.id} usuario={u} onRemove={() => setUsuarios(prev => prev.filter(x => x.id !== u.id))} />)}
                      </div>
                  }
                </div>
              </div>
            </BlueScreen>
          </motion.div>
        )}

      </AnimatePresence>

      {/* Mini-sheet agregar usuario */}
      <AnimatePresence>
        {showAgregarSheet && (
          <AgregarUsuarioSheet rol={showAgregarSheet}
            onSave={u => { setUsuarios(prev => [...prev, u]); setShowAgregarSheet(null); }}
            onClose={() => setShowAgregarSheet(null)} />
        )}
      </AnimatePresence>
    </div>
  );
};
