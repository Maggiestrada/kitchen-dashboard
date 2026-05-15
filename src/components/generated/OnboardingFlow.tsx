import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ChefHat, Store, Truck, MoreHorizontal, X, Check, User, Lock, Loader2 } from 'lucide-react';
import { guardarOnboarding } from '../../lib/db';
import { InsumaLogo } from './InsumaLogo';

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

// ─── Constants ────────────────────────────────────────────────────────────────

const PAISES_LATAM = [
  'Argentina', 'Bolivia', 'Brasil', 'Chile', 'Colombia',
  'Costa Rica', 'Cuba', 'Ecuador', 'El Salvador', 'Guatemala',
  'Honduras', 'México', 'Nicaragua', 'Panamá', 'Paraguay',
  'Perú', 'Rep. Dominicana', 'Uruguay', 'Venezuela',
];

const TIPOS_NEGOCIO = [
  { id: 'restaurante' as const, label: 'Restaurante', emoji: '🍽️' },
  { id: 'local' as const, label: 'Local gastronómico', emoji: '🏪' },
  { id: 'delivery' as const, label: 'Delivery', emoji: '🛵' },
  { id: 'otro' as const, label: 'Otro', emoji: '✳️' },
];

// ─── Progress Bar ─────────────────────────────────────────────────────────────

const ProgressBar: React.FC<{ step: number; total: number }> = ({ step, total }) => (
  <div className="flex gap-1.5 px-5 pt-3 pb-1">
    {Array.from({ length: total }).map((_, i) => (
      <div
        key={i}
        className="h-1 flex-1 rounded-full transition-all duration-300"
        style={{ backgroundColor: i < step ? '#72BDE8' : '#e5e7eb' }}
      />
    ))}
  </div>
);

// ─── Mini-sheet para agregar usuario ─────────────────────────────────────────

const AgregarUsuarioSheet: React.FC<{
  rol: 'cocinero' | 'admin';
  onSave: (u: UsuarioConfig) => void;
  onClose: () => void;
}> = ({ rol, onSave, onClose }) => {
  const [nombre, setNombre] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  const handleSave = () => {
    if (!nombre.trim()) { setError('El nombre es requerido'); return; }
    if (rol === 'admin' && pin.length !== 4) { setError('El PIN debe tener 4 dígitos'); return; }
    onSave({
      id: `usr-${Date.now()}`,
      nombre: nombre.trim(),
      rol,
      pin: rol === 'admin' ? pin : undefined,
    });
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/40 z-[60]"
        onClick={onClose}
      />
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
        className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white rounded-t-3xl z-[60] px-5 pt-4 pb-10"
        onClick={e => e.stopPropagation()}
      >
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
            <input
              type="text"
              value={nombre}
              onChange={e => { setNombre(e.target.value); setError(''); }}
              placeholder={rol === 'cocinero' ? 'Ej: María, Juan…' : 'Ej: Carlos, Ana…'}
              autoFocus
              className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3.5 py-3 text-sm text-black outline-none placeholder-neutral-400 focus:border-neutral-400 transition-colors"
            />
          </div>

          {rol === 'admin' && (
            <div>
              <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-2">PIN de acceso (4 dígitos)</p>
              <div className="flex gap-1.5 justify-center mb-3">
                {[0, 1, 2, 3].map(i => (
                  <div
                    key={i}
                    className={`w-12 h-12 rounded-xl border-2 flex items-center justify-center text-lg font-black transition-all ${pin.length > i ? 'bg-black border-black text-white' : 'border-neutral-200 text-transparent'}`}
                  >
                    {pin.length > i ? '•' : '·'}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, '', 0, '⌫'].map((key, i) => (
                  <button
                    key={i}
                    disabled={key === ''}
                    onClick={() => {
                      if (key === '⌫') {
                        setPin(p => p.slice(0, -1));
                        setError('');
                      } else if (typeof key === 'number' && pin.length < 4) {
                        setPin(p => p + String(key));
                        setError('');
                      }
                    }}
                    className={`h-12 rounded-2xl text-base font-medium flex items-center justify-center transition-all active:scale-90 ${key === '' ? 'pointer-events-none' : 'bg-neutral-100 active:bg-neutral-200 text-black'}`}
                  >
                    {key}
                  </button>
                ))}
              </div>
            </div>
          )}

          {error && <p className="text-xs text-red-500 text-center">{error}</p>}

          <button
            onClick={handleSave}
            className="w-full bg-black text-white rounded-2xl py-4 text-sm font-medium active:scale-[0.98] transition-transform"
          >
            Guardar
          </button>
        </div>
      </motion.div>
    </>
  );
};

// ─── Chip de usuario ──────────────────────────────────────────────────────────

const UsuarioChip: React.FC<{ usuario: UsuarioConfig; onRemove: () => void }> = ({ usuario, onRemove }) => (
  <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border ${usuario.rol === 'admin' ? 'bg-black border-black' : 'bg-neutral-100 border-neutral-200'}`}>
    <div className={`w-5 h-5 rounded-full flex items-center justify-center ${usuario.rol === 'admin' ? 'bg-white/10' : 'bg-neutral-300'}`}>
      {usuario.rol === 'admin'
        ? <Lock size={10} className="text-white" />
        : <User size={10} className="text-neutral-600" />}
    </div>
    <span className={`text-xs font-medium ${usuario.rol === 'admin' ? 'text-white' : 'text-black'}`}>{usuario.nombre}</span>
    {usuario.rol === 'admin' && usuario.pin && (
      <span className="text-[10px] text-white/50 tabular-nums">PIN ••••</span>
    )}
    <button
      onClick={onRemove}
      className={`w-4 h-4 rounded-full flex items-center justify-center ml-0.5 ${usuario.rol === 'admin' ? 'bg-white/20 text-white' : 'bg-neutral-300 text-neutral-600'} active:scale-90 transition-transform`}
    >
      <X size={9} strokeWidth={2.5} />
    </button>
  </div>
);

// ─── Steps ────────────────────────────────────────────────────────────────────

const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 40 : -40, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -40 : 40, opacity: 0 }),
};

// ─── Main OnboardingFlow ──────────────────────────────────────────────────────

export const OnboardingFlow: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(1);

  // Step 1
  const [nombreNegocio, setNombreNegocio] = useState('');
  // Step 2
  const [tipoNegocio, setTipoNegocio] = useState<NegocioConfig['tipo'] | ''>('');
  // Step 3
  const [pais, setPais] = useState('Argentina');
  const [email, setEmail] = useState('');
  // Step 4
  const [usuarios, setUsuarios] = useState<UsuarioConfig[]>([]);
  const [showAgregarSheet, setShowAgregarSheet] = useState<'cocinero' | 'admin' | null>(null);

  const goTo = (next: number) => {
    setDirection(next > step ? 1 : -1);
    setStep(next);
  };

  const handleTipoSelect = (tipo: NegocioConfig['tipo']) => {
    setTipoNegocio(tipo);
    setTimeout(() => goTo(3), 180);
  };

  const removeUsuario = (id: string) => {
    setUsuarios(prev => prev.filter(u => u.id !== id));
  };

  const addUsuario = (u: UsuarioConfig) => {
    setUsuarios(prev => [...prev, u]);
    setShowAgregarSheet(null);
  };

  const cocineros = usuarios.filter(u => u.rol === 'cocinero');
  const admins = usuarios.filter(u => u.rol === 'admin');

  const [guardando, setGuardando] = useState(false);
  const [errorGuardar, setErrorGuardar] = useState<string | null>(null);

  const handleEmpezar = async () => {
    setGuardando(true);
    setErrorGuardar(null);
    const negocio: NegocioConfig = {
      nombre: nombreNegocio.trim(),
      tipo: tipoNegocio as NegocioConfig['tipo'],
      pais,
      email: email.trim(),
    };
    try {
      await guardarOnboarding(negocio, usuarios);
      onComplete();
    } catch (err) {
      console.error(err);
      setErrorGuardar('Hubo un error al guardar. Revisá tu conexión e intentá de nuevo.');
    } finally {
      setGuardando(false);
    }
  };

  const canContinueStep3 = email.trim().includes('@');
  const canEmpezar = usuarios.length >= 1;

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col" style={{ maxWidth: 448, margin: '0 auto' }}>
      {/* Progress */}
      <ProgressBar step={step} total={4} />

      {/* Back button */}
      <div className="px-5 pt-3 pb-1 h-10 flex items-center">
        {step > 1 && (
          <button
            onClick={() => goTo(step - 1)}
            className="w-8 h-8 rounded-full border border-neutral-200 flex items-center justify-center text-neutral-500 active:scale-90 transition-transform"
          >
            <ArrowLeft size={16} strokeWidth={1.75} />
          </button>
        )}
      </div>

      {/* Steps */}
      <div className="flex-1 overflow-hidden relative">
        <AnimatePresence mode="wait" custom={direction}>
          {/* ── Paso 1: Nombre del negocio ── */}
          {step === 1 && (
            <motion.div
              key="step1"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ type: 'spring', damping: 30, stiffness: 340, duration: 0.25 }}
              className="absolute inset-0 flex flex-col"
            >
              {/* Blue gradient hero */}
              <div
                className="flex flex-col items-center justify-center flex-1 px-6"
                style={{ background: 'linear-gradient(160deg, #72BDE8 0%, #a8d8f0 100%)' }}
              >
                <InsumaLogo color="white" size="xl" />
                <h1 className="text-2xl font-light text-white leading-tight tracking-wide mt-6 text-center">
                  Bienvenido a Insuma
                </h1>
                <p className="text-sm text-white/70 mt-2 text-center">
                  El sistema de cocina que ordena tu operación.
                </p>
              </div>

              {/* Bottom sheet / card blanca */}
              <div className="bg-white rounded-t-3xl px-5 pt-6 pb-10 shrink-0">
                <div className="w-10 h-1 bg-neutral-200 rounded-full mx-auto mb-6" />
                <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-2">Nombre de tu negocio</p>
                <input
                  type="text"
                  value={nombreNegocio}
                  onChange={e => setNombreNegocio(e.target.value)}
                  placeholder="Ej: El Fuego, La Parrilla…"
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3.5 text-base text-black outline-none placeholder-neutral-400 focus:border-neutral-400 transition-colors mb-5"
                  onKeyDown={e => { if (e.key === 'Enter' && nombreNegocio.trim()) goTo(2); }}
                />
                <button
                  onClick={() => goTo(2)}
                  disabled={!nombreNegocio.trim()}
                  className="w-full text-white rounded-2xl py-4 text-sm font-medium active:scale-[0.98] transition-all disabled:opacity-30"
                  style={{ backgroundColor: '#72BDE8' }}
                >
                  Continuar
                </button>
              </div>
            </motion.div>
          )}

          {/* ── Paso 2: Tipo de negocio ── */}
          {step === 2 && (
            <motion.div
              key="step2"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ type: 'spring', damping: 30, stiffness: 340, duration: 0.25 }}
              className="absolute inset-0 flex flex-col px-5 pt-6 pb-10"
            >
              <h1 className="text-2xl font-light text-black leading-tight mb-1">¿Qué tipo de negocio tenés?</h1>
              <p className="text-sm text-neutral-400 mb-8">Esto nos ayuda a personalizar tu experiencia.</p>

              <div className="grid grid-cols-2 gap-3 flex-1 content-start">
                {TIPOS_NEGOCIO.map(tipo => (
                  <button
                    key={tipo.id}
                    onClick={() => handleTipoSelect(tipo.id)}
                    className={`flex flex-col items-start gap-3 p-5 rounded-2xl border-2 transition-all active:scale-[0.97] ${tipoNegocio === tipo.id ? 'border-black bg-black' : 'border-neutral-200 bg-neutral-50'}`}
                  >
                    <span className="text-2xl">{tipo.emoji}</span>
                    <span className={`text-sm font-medium leading-tight ${tipoNegocio === tipo.id ? 'text-white' : 'text-black'}`}>
                      {tipo.label}
                    </span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* ── Paso 3: País + email ── */}
          {step === 3 && (
            <motion.div
              key="step3"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ type: 'spring', damping: 30, stiffness: 340, duration: 0.25 }}
              className="absolute inset-0 flex flex-col px-5 pt-6 pb-10"
            >
              <h1 className="text-2xl font-light text-black leading-tight mb-1">Un poco más sobre vos</h1>
              <p className="text-sm text-neutral-400 mb-8">Para personalizar tu cuenta.</p>

              <div className="flex-1 space-y-5">
                <div>
                  <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-2">País</p>
                  <div className="relative">
                    <select
                      value={pais}
                      onChange={e => setPais(e.target.value)}
                      className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3.5 text-sm text-black outline-none appearance-none focus:border-neutral-400 transition-colors"
                    >
                      {PAISES_LATAM.map(p => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                    <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-400">
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                  </div>
                </div>

                <div>
                  <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-2">Email</p>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="tu@email.com"
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3.5 text-sm text-black outline-none placeholder-neutral-400 focus:border-neutral-400 transition-colors"
                  />
                </div>
              </div>

              <button
                onClick={() => goTo(4)}
                disabled={!canContinueStep3}
                className="w-full text-white rounded-2xl py-4 text-sm font-medium active:scale-[0.98] transition-all disabled:opacity-30"
                style={{ backgroundColor: '#72BDE8' }}
              >
                Continuar
              </button>
            </motion.div>
          )}

          {/* ── Paso 4: Usuarios ── */}
          {step === 4 && (
            <motion.div
              key="step4"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ type: 'spring', damping: 30, stiffness: 340, duration: 0.25 }}
              className="absolute inset-0 flex flex-col px-5 pt-6 pb-10 overflow-y-auto"
            >
              <h1 className="text-2xl font-light text-black leading-tight mb-1">Configurá tu equipo</h1>
              <p className="text-sm text-neutral-400 mb-7">Agregá los usuarios que van a usar Insuma.</p>

              <div className="flex-1 space-y-6">
                {/* Cocineros */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-sm font-medium text-black">Operadores</p>
                      <p className="text-[11px] text-neutral-400">Sin PIN — acceso directo</p>
                    </div>
                    {cocineros.length < 3 && (
                      <button
                        onClick={() => setShowAgregarSheet('cocinero')}
                        className="flex items-center gap-1.5 bg-neutral-100 rounded-xl px-3 py-2 text-xs font-medium text-black active:scale-95 transition-transform"
                      >
                        + Agregar
                      </button>
                    )}
                  </div>
                  {cocineros.length === 0 ? (
                    <div className="bg-neutral-50 border border-dashed border-neutral-200 rounded-xl py-4 flex items-center justify-center">
                      <p className="text-xs text-neutral-400">Ningún operador agregado</p>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {cocineros.map(u => (
                        <UsuarioChip key={u.id} usuario={u} onRemove={() => removeUsuario(u.id)} />
                      ))}
                    </div>
                  )}
                </div>

                {/* Admins */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-sm font-medium text-black">Admins</p>
                      <p className="text-[11px] text-neutral-400">Con PIN de 4 dígitos</p>
                    </div>
                    {admins.length < 3 && (
                      <button
                        onClick={() => setShowAgregarSheet('admin')}
                        className="flex items-center gap-1.5 bg-black rounded-xl px-3 py-2 text-xs font-medium text-white active:scale-95 transition-transform"
                      >
                        + Agregar
                      </button>
                    )}
                  </div>
                  {admins.length === 0 ? (
                    <div className="bg-neutral-50 border border-dashed border-neutral-200 rounded-xl py-4 flex items-center justify-center">
                      <p className="text-xs text-neutral-400">Ningún admin agregado</p>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {admins.map(u => (
                        <UsuarioChip key={u.id} usuario={u} onRemove={() => removeUsuario(u.id)} />
                      ))}
                    </div>
                  )}
                </div>

                {!canEmpezar && (
                  <p className="text-xs text-neutral-400 text-center">Agregá al menos un usuario para continuar</p>
                )}
                {errorGuardar && (
                  <p className="text-xs text-red-500 text-center">{errorGuardar}</p>
                )}
              </div>

              <button
                onClick={handleEmpezar}
                disabled={!canEmpezar || guardando}
                className="w-full text-white rounded-2xl py-4 text-sm font-medium active:scale-[0.98] transition-all disabled:opacity-30 mt-6 flex items-center justify-center gap-2"
                style={{ backgroundColor: '#72BDE8' }}
              >
                {guardando ? (
                  <><Loader2 size={16} className="animate-spin" /> Guardando...</>
                ) : (
                  'Empezar 🚀'
                )}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Mini-sheet de agregar usuario */}
      <AnimatePresence>
        {showAgregarSheet && (
          <AgregarUsuarioSheet
            rol={showAgregarSheet}
            onSave={addUsuario}
            onClose={() => setShowAgregarSheet(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};
