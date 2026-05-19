import React, { useState } from 'react';

const BLUE = '#72BDE8';
const GRADIENT = 'linear-gradient(160deg, #2E86C1 0%, #72BDE8 55%, #AED6F1 100%)';

const LogoPlaceholder = ({ white = false, size = 'md' }: { white?: boolean; size?: 'sm' | 'md' | 'lg' }) => {
  const color = white ? '#fff' : BLUE;
  const scale = size === 'sm' ? 0.55 : size === 'lg' ? 1.3 : 1;
  return (
    <svg
      viewBox="0 0 240 60"
      height={Math.round(46 * scale)}
      aria-label="insuma"
      style={{ display: 'block' }}
    >
      {/* Dot flotante personalizado */}
      <circle cx="14" cy="7" r="4" fill={color} />
      {/* "ı" = i sin punto (U+0131) + "nsuma" — evita doble punto */}
      <text
        x="4" y="54"
        fontFamily="Georgia, 'Times New Roman', serif"
        fontStyle="italic"
        fontWeight="300"
        fontSize="52"
        fill={color}
        letterSpacing="1"
      >{'ınsuma'}</text>
    </svg>
  );
};

const screens = ['onboarding1', 'onboarding2', 'onboarding3', 'onboarding4', 'dashboard', 'proveedor'] as const;
type Screen = typeof screens[number];

// Fondo azul degradé compartido para pantallas 2, 3 y 4
const BlueBg = ({ children }: { children: React.ReactNode }) => (
  <div style={{
    flex: 1, display: 'flex', flexDirection: 'column',
    background: GRADIENT, minHeight: '100%'
  }}>
    {children}
  </div>
);

// Barra de progreso
const Progress = ({ step, total = 4 }: { step: number; total?: number }) => (
  <div style={{ display: 'flex', gap: 6, padding: '56px 24px 0' }}>
    {Array.from({ length: total }).map((_, i) => (
      <div key={i} style={{
        flex: 1, height: 3, borderRadius: 99,
        background: i < step ? '#fff' : 'rgba(255,255,255,0.3)'
      }} />
    ))}
  </div>
);

export default function DesignMockup() {
  const [screen, setScreen] = useState<Screen>('onboarding1');

  return (
    <div style={{ background: '#f0f0f0', minHeight: '100vh', padding: '24px', fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif' }}>

      {/* Nav tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
        {[
          { id: 'onboarding1', label: '① Bienvenida' },
          { id: 'onboarding2', label: '② Negocio' },
          { id: 'onboarding3', label: '③ Crear cuenta' },
          { id: 'onboarding4', label: '④ Equipo' },
          { id: 'dashboard', label: 'Dashboard' },
          { id: 'proveedor', label: 'Proveedor' },
        ].map(s => (
          <button key={s.id} onClick={() => setScreen(s.id as Screen)}
            style={{
              padding: '8px 16px', borderRadius: 999, border: 'none', cursor: 'pointer',
              background: screen === s.id ? '#111' : '#fff',
              color: screen === s.id ? '#fff' : '#111',
              fontSize: 13, fontWeight: 600,
              boxShadow: '0 1px 4px rgba(0,0,0,0.12)'
            }}>
            {s.label}
          </button>
        ))}
      </div>

      {/* Phone frame */}
      <div style={{
        width: 390, margin: '0 auto',
        background: '#fff', borderRadius: 40,
        boxShadow: '0 24px 80px rgba(0,0,0,0.22)',
        overflow: 'hidden', minHeight: 844,
        position: 'relative', display: 'flex', flexDirection: 'column'
      }}>

        {/* ── ONBOARDING 1: Bienvenida + nombre del negocio ── */}
        {screen === 'onboarding1' && (
          <div style={{
            flex: 1, display: 'flex', flexDirection: 'column',
            background: GRADIENT,
            padding: '80px 28px 52px',
            alignItems: 'center', justifyContent: 'center', gap: 0
          }}>
            {/* Logo */}
            <LogoPlaceholder white />

            <p style={{
              color: 'rgba(255,255,255,0.7)', fontSize: 11, margin: '10px 0 0',
              letterSpacing: '0.22em', textTransform: 'uppercase', fontWeight: 500
            }}>
              para cocinas
            </p>

            <p style={{
              color: 'rgba(255,255,255,0.88)', fontSize: 15, margin: '20px 0 40px',
              textAlign: 'center', lineHeight: 1.65, fontWeight: 300, maxWidth: 260
            }}>
              Controlá pedidos, insumos y costos desde un solo lugar.
            </p>

            {/* Input integrado */}
            <div style={{ width: '100%', maxWidth: 320 }}>
              <p style={{
                fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.7)',
                letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 8
              }}>
                Nombre de tu negocio
              </p>
              <div style={{
                width: '100%', background: 'rgba(255,255,255,0.18)',
                border: '1.5px solid rgba(255,255,255,0.45)',
                borderRadius: 16, padding: '14px 16px', fontSize: 15,
                color: 'rgba(255,255,255,0.6)', boxSizing: 'border-box', marginBottom: 14
              }}>
                Ej: El Fuego, La Parrilla…
              </div>
              <div style={{
                width: '100%', background: '#fff', borderRadius: 18,
                padding: '16px', textAlign: 'center', color: '#111',
                fontSize: 15, fontWeight: 700, letterSpacing: 0.2,
                boxShadow: '0 4px 16px rgba(0,0,0,0.12)'
              }}>
                Continuar →
              </div>
              <p style={{ textAlign: 'center', fontSize: 11, color: 'rgba(255,255,255,0.45)', marginTop: 14 }}>
                Al continuar aceptás los términos de uso
              </p>
            </div>
          </div>
        )}

        {/* ── ONBOARDING 2: Tipo de negocio ── */}
        {screen === 'onboarding2' && (
          <BlueBg>
            <Progress step={1} />
            {/* White card content */}
            <div style={{
              margin: '24px 20px 0', flex: 1,
              background: 'rgba(255,255,255,0.15)',
              backdropFilter: 'blur(12px)',
              borderRadius: '24px 24px 0 0', padding: '28px 22px 40px',
              display: 'flex', flexDirection: 'column'
            }}>
              <h1 style={{ fontSize: 26, fontWeight: 300, color: '#fff', margin: '0 0 6px', lineHeight: 1.2 }}>
                ¿Qué tipo de<br/>negocio tenés?
              </h1>
              <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14, margin: '0 0 28px', fontWeight: 400 }}>
                Personalizamos tu experiencia según tu operación.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, flex: 1 }}>
                {[
                  { emoji: '🍽️', label: 'Restaurante', active: true },
                  { emoji: '🏪', label: 'Local gastronómico', active: false },
                  { emoji: '🛵', label: 'Delivery', active: false },
                  { emoji: '✳️', label: 'Otro', active: false },
                ].map(t => (
                  <div key={t.label} style={{
                    border: t.active ? '2px solid #fff' : '2px solid rgba(255,255,255,0.25)',
                    background: t.active ? '#fff' : 'rgba(255,255,255,0.12)',
                    borderRadius: 20, padding: '20px 16px',
                    display: 'flex', flexDirection: 'column', gap: 12,
                  }}>
                    <span style={{ fontSize: 28 }}>{t.emoji}</span>
                    <span style={{ fontSize: 14, fontWeight: 600, color: t.active ? '#111' : 'rgba(255,255,255,0.9)', lineHeight: 1.3 }}>{t.label}</span>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 24, background: '#fff', borderRadius: 18, padding: '16px', textAlign: 'center', color: '#111', fontSize: 15, fontWeight: 700, boxShadow: '0 4px 16px rgba(0,0,0,0.1)' }}>
                Siguiente →
              </div>
            </div>
          </BlueBg>
        )}

        {/* ── ONBOARDING 3: Crear cuenta ── */}
        {screen === 'onboarding3' && (
          <BlueBg>
            <Progress step={2} />
            <div style={{
              margin: '24px 20px 0', flex: 1,
              background: 'rgba(255,255,255,0.15)',
              backdropFilter: 'blur(12px)',
              borderRadius: '24px 24px 0 0', padding: '28px 22px 40px',
              display: 'flex', flexDirection: 'column'
            }}>
              <h1 style={{ fontSize: 26, fontWeight: 300, color: '#fff', margin: '0 0 6px', lineHeight: 1.2 }}>
                Creá tu cuenta
              </h1>
              <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14, margin: '0 0 28px', fontWeight: 400 }}>
                Con estos datos entrás como administrador.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 14, flex: 1 }}>
                {/* Email */}
                <div>
                  <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.7)', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 6 }}>
                    Email
                  </p>
                  <div style={{
                    background: 'rgba(255,255,255,0.18)', border: '1.5px solid rgba(255,255,255,0.45)',
                    borderRadius: 14, padding: '14px 16px', fontSize: 14, color: 'rgba(255,255,255,0.55)'
                  }}>
                    tu@email.com
                  </div>
                </div>

                {/* Contraseña */}
                <div>
                  <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.7)', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 6 }}>
                    Contraseña
                  </p>
                  <div style={{
                    background: 'rgba(255,255,255,0.18)', border: '1.5px solid rgba(255,255,255,0.45)',
                    borderRadius: 14, padding: '14px 16px', fontSize: 14, color: 'rgba(255,255,255,0.55)',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                  }}>
                    <span>••••••••</span>
                    <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>👁</span>
                  </div>
                </div>

                {/* Confirmar */}
                <div>
                  <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.7)', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 6 }}>
                    Confirmar contraseña
                  </p>
                  <div style={{
                    background: 'rgba(255,255,255,0.18)', border: '1.5px solid rgba(255,255,255,0.45)',
                    borderRadius: 14, padding: '14px 16px', fontSize: 14, color: 'rgba(255,255,255,0.55)'
                  }}>
                    ••••••••
                  </div>
                </div>

                {/* Divider */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '4px 0' }}>
                  <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.25)' }} />
                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', fontWeight: 500 }}>o</span>
                  <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.25)' }} />
                </div>

                {/* Google */}
                <div style={{
                  background: 'rgba(255,255,255,0.18)', border: '1.5px solid rgba(255,255,255,0.4)',
                  borderRadius: 14, padding: '13px 16px', textAlign: 'center',
                  color: '#fff', fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
                }}>
                  <span>G</span> Continuar con Google
                </div>
              </div>

              <div style={{ marginTop: 20, background: '#fff', borderRadius: 18, padding: '16px', textAlign: 'center', color: '#111', fontSize: 15, fontWeight: 700, boxShadow: '0 4px 16px rgba(0,0,0,0.1)' }}>
                Crear cuenta →
              </div>
            </div>
          </BlueBg>
        )}

        {/* ── ONBOARDING 4: Equipo ── */}
        {screen === 'onboarding4' && (
          <BlueBg>
            <Progress step={3} />
            <div style={{
              margin: '24px 20px 0', flex: 1,
              background: 'rgba(255,255,255,0.15)',
              backdropFilter: 'blur(12px)',
              borderRadius: '24px 24px 0 0', padding: '28px 22px 40px',
              display: 'flex', flexDirection: 'column'
            }}>
              <h1 style={{ fontSize: 26, fontWeight: 300, color: '#fff', margin: '0 0 6px' }}>Configurá tu equipo</h1>
              <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14, margin: '0 0 24px' }}>Quiénes van a usar Insuma.</p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 16, flex: 1 }}>
                {/* Operadores */}
                <div style={{ background: 'rgba(255,255,255,0.92)', borderRadius: 20, padding: '18px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                    <div>
                      <p style={{ fontSize: 14, fontWeight: 600, color: '#111', margin: '0 0 2px' }}>Operadores</p>
                      <p style={{ fontSize: 11, color: '#9ca3af', margin: 0 }}>Sin PIN — acceso directo</p>
                    </div>
                    <div style={{ background: '#f3f4f6', borderRadius: 10, padding: '6px 12px', fontSize: 12, fontWeight: 600, color: '#111' }}>
                      + Agregar
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {['tiago', 'maggie'].map(n => (
                      <div key={n} style={{ background: '#e5e7eb', borderRadius: 10, padding: '6px 12px', fontSize: 12, fontWeight: 500, color: '#111', display: 'flex', alignItems: 'center', gap: 6 }}>
                        {n} <span style={{ color: '#9ca3af', fontSize: 10 }}>✕</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Admins */}
                <div style={{ background: '#111', borderRadius: 20, padding: '18px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                    <div>
                      <p style={{ fontSize: 14, fontWeight: 600, color: '#fff', margin: '0 0 2px' }}>Admins</p>
                      <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', margin: 0 }}>Con PIN de 4 dígitos</p>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.12)', borderRadius: 10, padding: '6px 12px', fontSize: 12, fontWeight: 600, color: '#fff' }}>
                      + Agregar
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 10, padding: '6px 12px', fontSize: 12, fontWeight: 500, color: '#fff', display: 'flex', alignItems: 'center', gap: 6 }}>
                      santiago <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 9 }}>PIN ••••</span>
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ marginTop: 24, background: '#fff', borderRadius: 18, padding: '16px', textAlign: 'center', color: '#111', fontSize: 15, fontWeight: 700, boxShadow: '0 4px 16px rgba(0,0,0,0.1)' }}>
                Empezar 🚀
              </div>
            </div>
          </BlueBg>
        )}

        {/* ── DASHBOARD ── */}
        {screen === 'dashboard' && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#fafafa' }}>
            <div style={{ background: '#fff', padding: '52px 20px 14px', borderBottom: '1px solid #f3f4f6' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 16, fontWeight: 700, color: BLUE, fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>insuma</span>
                  <span style={{ fontSize: 11, fontWeight: 500, color: '#9ca3af', letterSpacing: '0.12em', textTransform: 'uppercase' }}>MAGGIE</span>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <div style={{ background: '#f3f4f6', borderRadius: 99, padding: '6px 14px', fontSize: 12, fontWeight: 600, color: '#111', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ width: 7, height: 7, borderRadius: 99, background: '#22c55e', display: 'inline-block' }} />
                    tiago
                  </div>
                  <div style={{ position: 'relative' }}>
                    <div style={{ width: 34, height: 34, borderRadius: 99, background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>🔔</div>
                    <div style={{ position: 'absolute', top: -2, right: -2, width: 16, height: 16, background: '#ef4444', borderRadius: 99, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 800, color: '#fff', border: '2px solid #fff' }}>1</div>
                  </div>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginTop: 14 }}>
                {[
                  { label: 'Activos', value: '02', color: '#f59e0b' },
                  { label: 'Alertas', value: '01', color: '#ef4444' },
                  { label: 'Recibidos', value: '03', color: '#22c55e' },
                ].map(s => (
                  <div key={s.label} style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 14, padding: '10px 12px' }}>
                    <p style={{ fontSize: 9, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.14em', margin: '0 0 4px' }}>{s.label}</p>
                    <p style={{ fontSize: 22, fontWeight: 900, color: s.color, margin: 0 }}>{s.value}</p>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ flex: 1, padding: '16px 20px' }}>
              <p style={{ fontSize: 9, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.16em', margin: '0 0 10px' }}>Accesos rápidos</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 20 }}>
                <div style={{ background: '#111', borderRadius: 18, padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ width: 30, height: 30, background: 'rgba(255,255,255,0.1)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>📦</div>
                  <span style={{ fontSize: 12, color: '#fff', fontWeight: 300, lineHeight: 1.3 }}>Nuevo<br/>Pedido</span>
                </div>
                <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 18, padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ width: 30, height: 30, background: '#e5e7eb', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>🚚</div>
                  <span style={{ fontSize: 12, color: '#111', fontWeight: 300 }}>Recepcionar</span>
                </div>
                <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 18, padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ width: 30, height: 30, background: '#e5e7eb', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>➕</div>
                  <span style={{ fontSize: 12, color: '#111', fontWeight: 300 }}>Insumo</span>
                </div>
              </div>
              <p style={{ fontSize: 9, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.16em', margin: '0 0 10px' }}>Pedidos de hoy</p>
              {[
                { proveedor: 'Fura', items: 2, estado: 'En espera', color: '#f59e0b', monto: '$22.000', quien: 'tiago', entrega: 'Mañana' },
                { proveedor: 'Cocorokeen', items: 3, estado: 'En camino', color: BLUE, monto: '$8.500', quien: 'maggie', entrega: 'Hoy' },
              ].map(p => (
                <div key={p.proveedor} style={{ background: '#fff', border: '1px solid #f3f4f6', borderRadius: 18, padding: '14px', marginBottom: 8, position: 'relative', overflow: 'hidden' }}>
                  <div style={{ width: 3, background: p.color, position: 'absolute', left: 0, top: 0, bottom: 0 }} />
                  <div style={{ paddingLeft: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <p style={{ fontSize: 14, fontWeight: 900, color: '#111', margin: '0 0 2px' }}>{p.proveedor}</p>
                      <p style={{ fontSize: 10, color: '#9ca3af', margin: 0 }}>{p.items} items · {p.monto} · 🚚 {p.entrega}</p>
                      <p style={{ fontSize: 10, color: '#d1d5db', margin: '2px 0 0' }}>por {p.quien}</p>
                    </div>
                    <div style={{ background: p.color + '20', border: `1px solid ${p.color}40`, borderRadius: 99, padding: '4px 10px', fontSize: 10, fontWeight: 700, color: p.color, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
                      {p.estado}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ background: BLUE, padding: '10px 0 28px', display: 'flex' }}>
              {[
                { icon: '🏪', label: 'Proveedores' },
                { icon: '📦', label: 'Recibir' },
                { icon: '💳', label: 'Pagos' },
                { icon: '📖', label: 'Recetas' },
                { icon: '📊', label: 'Métricas', active: true },
              ].map(n => (
                <div key={n.label} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                  <div style={{ fontSize: 20, opacity: n.active ? 1 : 0.65 }}>{n.icon}</div>
                  <span style={{ fontSize: 9, fontWeight: n.active ? 700 : 500, color: n.active ? '#fff' : 'rgba(255,255,255,0.7)' }}>{n.label}</span>
                  {n.active && <div style={{ width: 4, height: 4, borderRadius: 99, background: '#fff' }} />}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── PROVEEDOR SHEET ── */}
        {screen === 'proveedor' && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#fafafa' }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)' }} />
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: '#fff', borderRadius: '28px 28px 0 0', padding: '0 0 32px' }}>
                <div style={{ width: 36, height: 4, background: '#e5e7eb', borderRadius: 99, margin: '12px auto 0' }} />
                <div style={{ padding: '16px 20px 0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 44, height: 44, borderRadius: 14, background: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 900, color: '#fff' }}>F</div>
                      <div>
                        <p style={{ fontSize: 16, fontWeight: 900, color: '#111', margin: 0 }}>Fura</p>
                        <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                          <span style={{ fontSize: 10, color: '#9ca3af', border: '1px solid #e5e7eb', borderRadius: 99, padding: '2px 8px' }}>🏷 Carnes</span>
                          <span style={{ fontSize: 10, color: BLUE, border: `1px solid ${BLUE}40`, borderRadius: 99, padding: '2px 8px' }}>ⓘ ficha</span>
                        </div>
                      </div>
                    </div>
                    <div style={{ width: 34, height: 34, borderRadius: 99, border: '1.5px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, color: '#9ca3af' }}>✕</div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 12 }}>
                    <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 14, padding: '10px 12px' }}>
                      <p style={{ fontSize: 9, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.12em', margin: '0 0 4px' }}>Este mes</p>
                      <p style={{ fontSize: 16, fontWeight: 900, color: '#111', margin: 0 }}>$22.000</p>
                    </div>
                    <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 14, padding: '10px 12px' }}>
                      <p style={{ fontSize: 9, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.12em', margin: '0 0 4px' }}>Pedidos</p>
                      <p style={{ fontSize: 16, fontWeight: 900, color: '#111', margin: 0 }}>1</p>
                    </div>
                    <div style={{ background: '#fee2e2', border: '1px solid #fecaca', borderRadius: 14, padding: '10px 12px' }}>
                      <p style={{ fontSize: 9, fontWeight: 700, color: '#991b1b', textTransform: 'uppercase', letterSpacing: '0.12em', margin: '0 0 4px' }}>Alertas</p>
                      <p style={{ fontSize: 16, fontWeight: 900, color: '#ef4444', margin: 0 }}>1</p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                    <div style={{ flex: 2, background: '#111', borderRadius: 14, padding: '13px', textAlign: 'center', color: '#fff', fontSize: 13, fontWeight: 700 }}>📦 Nuevo pedido</div>
                    <div style={{ flex: 2, background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 14, padding: '13px', textAlign: 'center', color: '#111', fontSize: 13, fontWeight: 600 }}>↺ Repetir último</div>
                    <div style={{ flex: 1, background: '#eff6ff', border: `1px solid ${BLUE}40`, borderRadius: 14, padding: '13px', textAlign: 'center', fontSize: 16 }}>📅</div>
                    <div style={{ flex: 1, background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 14, padding: '13px', textAlign: 'center', fontSize: 16 }}>💬</div>
                  </div>
                  <div style={{ display: 'flex', background: '#f3f4f6', borderRadius: 14, padding: 3, marginBottom: 14 }}>
                    {['Historial', 'Métricas', 'Programados'].map((t, i) => (
                      <div key={t} style={{ flex: 1, textAlign: 'center', padding: '8px', borderRadius: 11, background: i === 0 ? '#fff' : 'transparent', fontSize: 12, fontWeight: i === 0 ? 700 : 500, color: i === 0 ? '#111' : '#9ca3af', boxShadow: i === 0 ? '0 1px 4px rgba(0,0,0,0.08)' : 'none' }}>
                        {t}
                      </div>
                    ))}
                  </div>
                  <div style={{ background: '#fff', border: '1px solid #f3f4f6', borderRadius: 16, overflow: 'hidden', display: 'flex' }}>
                    <div style={{ width: 3, background: '#22c55e' }} />
                    <div style={{ flex: 1, padding: '12px 14px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <p style={{ fontSize: 10, color: '#9ca3af', margin: '0 0 4px' }}>📅 02:07 p.m. · 📦 2 items</p>
                          <p style={{ fontSize: 16, fontWeight: 900, color: '#111', margin: 0 }}>$22.000</p>
                        </div>
                        <div style={{ background: '#dcfce7', border: '1px solid #bbf7d0', borderRadius: 99, padding: '4px 10px', fontSize: 10, fontWeight: 700, color: '#15803d', textTransform: 'uppercase' }}>
                          ✓ RECIBIDO
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>

      <p style={{ textAlign: 'center', color: '#9ca3af', fontSize: 11, marginTop: 16 }}>
        Mockup de diseño — no es código final · Logo placeholder (reemplazar con asset real)
      </p>
    </div>
  );
}
