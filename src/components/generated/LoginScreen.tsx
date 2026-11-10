import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { signInWithGoogle } from '../../lib/db';

const GRADIENT = 'linear-gradient(160deg, #2E86C1 0%, #72BDE8 55%, #AED6F1 100%)';

const InsumaLogo = ({ height = 44 }: { height?: number }) => (
  <svg viewBox="0 0 240 60" height={height} aria-label="insuma" style={{ display: 'block' }}>
    <circle cx="14" cy="7" r="4" fill="#fff" />
    <text x="4" y="54" fontFamily="Georgia, 'Times New Roman', serif" fontStyle="italic"
      fontWeight="300" fontSize="52" fill="#fff" letterSpacing="1">
      {'ınsuma'}
    </text>
  </svg>
);

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
    <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
    <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.909-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
    <path d="M3.964 10.707A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.039l3.007-2.332z" fill="#FBBC05"/>
    <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.961L3.964 6.293C4.672 4.166 6.656 3.58 9 3.58z" fill="#EA4335"/>
  </svg>
);

export const LoginScreen: React.FC<{ onDemoLogin?: () => void }> = ({ onDemoLogin }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogle = async () => {
    setLoading(true);
    setError(null);
    const { error } = await signInWithGoogle();
    if (error) {
      setError('No se pudo conectar con Google. Intentá de nuevo.');
      setLoading(false);
    }
    // Si no hay error, el redirect de OAuth sucede automáticamente
  };

  return (
    <div className="fixed inset-0 flex flex-col" style={{ background: GRADIENT, maxWidth: 448, margin: '0 auto' }}>
      <div className="flex-1 flex flex-col items-center justify-center px-8 gap-2">
        <InsumaLogo height={52} />
        <p className="text-white/60 text-sm font-light tracking-wide text-center mt-1">
          Gestión de cocina profesional
        </p>
      </div>

      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', damping: 28, stiffness: 280, delay: 0.1 }}
        className="mx-4 mb-10 rounded-3xl px-6 py-8"
        style={{ background: 'rgba(255,255,255,0.13)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.3)' }}
      >
        <h2 className="text-white text-xl font-light mb-1">Bienvenido</h2>
        <p className="text-white/60 text-sm mb-6">Iniciá sesión para acceder a tu cocina</p>

        <button
          onClick={handleGoogle}
          disabled={loading}
          className="w-full bg-white rounded-2xl py-4 flex items-center justify-center gap-3 text-sm font-medium text-neutral-800 active:scale-[0.98] transition-all disabled:opacity-60 shadow-lg"
        >
          {loading ? (
            <Loader2 size={18} className="animate-spin text-neutral-400" />
          ) : (
            <GoogleIcon />
          )}
          <span>{loading ? 'Conectando...' : 'Continuar con Google'}</span>
        </button>

        {onDemoLogin && (
          <button
            onClick={onDemoLogin}
            className="w-full mt-3 rounded-2xl py-3 flex items-center justify-center gap-2 text-sm font-medium text-white/80 active:scale-[0.98] transition-all"
            style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)' }}
          >
            Ver demo sin cuenta
          </button>
        )}

        {error && (
          <p className="text-center text-xs text-red-200 mt-3">{error}</p>
        )}

        <p className="text-center text-white/35 text-[10px] mt-5 leading-relaxed">
          Tu cuenta de Google se usa únicamente para identificarte.
        </p>
      </motion.div>
    </div>
  );
};
