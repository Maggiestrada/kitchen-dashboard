import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { supabase } from './lib/supabase';
import { InsumaKitchenDashboard } from './components/generated/InsumaKitchenDashboard';
import { OnboardingFlow } from './components/generated/OnboardingFlow';
import { LoginScreen } from './components/generated/LoginScreen';
import { findNegocioByAuthUser, authSignOut, setNegocioId, validateInviteCode } from './lib/db';

type AppState = 'loading' | 'login' | 'invite_code' | 'onboarding' | 'app';

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

// ─── Pantalla de carga ────────────────────────────────────────────────────────

const LoadingScreen = () => (
  <div className="fixed inset-0 flex flex-col items-center justify-center" style={{ background: GRADIENT, maxWidth: 448, margin: '0 auto' }}>
    <InsumaLogo height={48} />
    <Loader2 size={20} className="text-white/50 animate-spin mt-8" strokeWidth={1.5} />
  </div>
);

// ─── Pantalla de código de invitación ─────────────────────────────────────────

const InviteCodeScreen = ({
  email, value, onChange, onValidate, loading, error,
}: {
  email: string;
  value: string;
  onChange: (v: string) => void;
  onValidate: () => void;
  loading: boolean;
  error: string | null;
}) => (
  <div className="fixed inset-0 flex flex-col" style={{ background: GRADIENT, maxWidth: 448, margin: '0 auto' }}>
    <div className="flex-1 flex flex-col items-center justify-center px-8 gap-2">
      <InsumaLogo height={48} />
    </div>

    <motion.div
      initial={{ y: 40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', damping: 28, stiffness: 280, delay: 0.1 }}
      className="mx-4 mb-10 rounded-3xl px-6 py-8 space-y-5"
      style={{ background: 'rgba(255,255,255,0.13)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.3)' }}
    >
      <div>
        <h2 className="text-white text-xl font-light mb-1">Código de invitación</h2>
        <p className="text-white/60 text-sm">
          Ingresá el código para activar tu cuenta
          {email ? ` (${email})` : ''}.
        </p>
      </div>

      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: 'rgba(255,255,255,0.6)' }}>
          Código
        </p>
        <input
          type="text"
          value={value}
          onChange={e => onChange(e.target.value.toUpperCase())}
          placeholder="INSUMA-001"
          autoFocus
          className="w-full rounded-2xl border px-4 py-4 text-sm bg-transparent outline-none placeholder-white/40 font-mono tracking-widest"
          style={{ color: '#fff', borderColor: 'rgba(255,255,255,0.45)', background: 'rgba(255,255,255,0.18)' }}
        />
        {error && <p className="text-red-200 text-xs mt-2">{error}</p>}
      </div>

      <button
        onClick={onValidate}
        disabled={loading || value.length < 9}
        className="w-full bg-white rounded-2xl py-4 text-sm font-bold text-neutral-800 active:scale-[0.98] transition-all disabled:opacity-40 flex items-center justify-center gap-2 shadow-lg"
      >
        {loading && <Loader2 size={16} className="animate-spin text-neutral-400" />}
        <span>{loading ? 'Verificando...' : 'Activar cuenta'}</span>
      </button>
    </motion.div>
  </div>
);

// ─── App ──────────────────────────────────────────────────────────────────────

function App() {
  const [appState, setAppState] = useState<AppState>('loading');
  const [authUser, setAuthUser] = useState<{ id: string; email: string } | null>(null);
  const [pendingInviteCode, setPendingInviteCode] = useState('');
  const [inviteCodeInput, setInviteCodeInput] = useState('INSUMA-');
  const [inviteCodeError, setInviteCodeError] = useState<string | null>(null);
  const [inviteCodeLoading, setInviteCodeLoading] = useState(false);

  const handleAuthUser = async (userId: string, email: string) => {
    setAuthUser({ id: userId, email });
    const negocioId = await findNegocioByAuthUser(userId);
    if (negocioId) {
      setNegocioId(negocioId);
      localStorage.setItem('insuma_onboarding_ok', '1');
      setAppState('app');
    } else {
      setAppState('invite_code');
    }
  };

  useEffect(() => {
    const sessionTimeout = setTimeout(() => setAppState('login'), 5000);

    supabase.auth.getSession().then(async ({ data }) => {
      clearTimeout(sessionTimeout);
      if (data.session?.user) {
        await handleAuthUser(data.session.user.id, data.session.user.email ?? '');
      } else {
        setAppState('login');
      }
    }).catch(() => {
      clearTimeout(sessionTimeout);
      setAppState('login');
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        await handleAuthUser(session.user.id, session.user.email ?? '');
      } else if (event === 'SIGNED_OUT') {
        setAuthUser(null);
        setAppState('login');
      }
    });

    return () => subscription.unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleValidateInviteCode = async () => {
    setInviteCodeLoading(true);
    setInviteCodeError(null);
    const valid = await validateInviteCode(inviteCodeInput);
    if (valid) {
      setPendingInviteCode(inviteCodeInput);
      setAppState('onboarding');
    } else {
      setInviteCodeError('Código inválido o ya utilizado');
    }
    setInviteCodeLoading(false);
  };

  const handleSignOut = async () => {
    await authSignOut();
    setAuthUser(null);
    setInviteCodeInput('INSUMA-');
    setInviteCodeError(null);
    setAppState('login');
  };

  return (
    <AnimatePresence mode="wait">
      {appState === 'loading' && (
        <motion.div key="loading" initial={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <LoadingScreen />
        </motion.div>
      )}
      {appState === 'login' && (
        <motion.div key="login" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <LoginScreen />
        </motion.div>
      )}
      {appState === 'invite_code' && (
        <motion.div key="invite" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <InviteCodeScreen
            email={authUser?.email ?? ''}
            value={inviteCodeInput}
            onChange={setInviteCodeInput}
            onValidate={handleValidateInviteCode}
            loading={inviteCodeLoading}
            error={inviteCodeError}
          />
        </motion.div>
      )}
      {appState === 'onboarding' && (
        <motion.div key="onboarding" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <OnboardingFlow
            authUserId={authUser?.id}
            inviteCode={pendingInviteCode}
            onComplete={() => setAppState('app')}
          />
        </motion.div>
      )}
      {appState === 'app' && (
        <motion.div key="app" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <InsumaKitchenDashboard
            authUserEmail={authUser?.email}
            onSignOut={handleSignOut}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default App;
