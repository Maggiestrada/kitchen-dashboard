import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, Check, Building2, User, Phone, Mail, CreditCard, Hash, Truck, Clock, Tag } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

type FormStep = 1 | 2 | 3;
interface ProveedorForm {
  nombreEmpresa: string;
  nombrePersona: string;
  rubro: string;
  telefono: string;
  contactoTipo: 'whatsapp' | 'mail';
  contactoValor: string;
  nombreVentas: string;
  cbu: string;
  alias: string;
  diasEntrega: string[];
  plazoPago: string;
}

// ─── Static Data ──────────────────────────────────────────────────────────────

const RUBROS = [{
  id: 'r-verd',
  label: 'Verduras'
}, {
  id: 'r-carn',
  label: 'Carnes'
}, {
  id: 'r-pesc',
  label: 'Pescados'
}, {
  id: 'r-alm',
  label: 'Almacén'
}, {
  id: 'r-lact',
  label: 'Lácteos'
}, {
  id: 'r-beb',
  label: 'Bebidas'
}, {
  id: 'r-limp',
  label: 'Limpieza'
}, {
  id: 'r-otro',
  label: 'Otros'
}] as any[];
const DIAS_SEMANA = [{
  id: 'lun',
  label: 'Lun'
}, {
  id: 'mar',
  label: 'Mar'
}, {
  id: 'mie',
  label: 'Mié'
}, {
  id: 'jue',
  label: 'Jue'
}, {
  id: 'vie',
  label: 'Vie'
}, {
  id: 'sab',
  label: 'Sáb'
}, {
  id: 'dom',
  label: 'Dom'
}] as any[];
const PLAZOS_PAGO = [{
  id: 'contado',
  label: 'Contado'
}, {
  id: '7d',
  label: '7 días'
}, {
  id: '15d',
  label: '15 días'
}, {
  id: '30d',
  label: '30 días'
}, {
  id: '45d',
  label: '45 días'
}, {
  id: '60d',
  label: '60 días'
}, {
  id: 'otros',
  label: 'Otros'
}] as any[];
const STEP_LABELS: Record<FormStep, {
  title: string;
  subtitle: string;
}> = {
  1: {
    title: 'Datos del Proveedor',
    subtitle: 'Empresa y contacto'
  },
  2: {
    title: 'Datos de Pago',
    subtitle: 'CBU, alias y plazo'
  },
  3: {
    title: 'Logística',
    subtitle: 'Días de entrega'
  }
};
const EMPTY_FORM: ProveedorForm = {
  nombreEmpresa: '',
  nombrePersona: '',
  rubro: '',
  telefono: '',
  contactoTipo: 'whatsapp',
  contactoValor: '',
  nombreVentas: '',
  cbu: '',
  alias: '',
  diasEntrega: [],
  plazoPago: ''
};

// ─── Step Indicator ───────────────────────────────────────────────────────────

const StepDots = ({
  step
}: {
  step: FormStep;
}) => <div className="flex gap-1.5 items-center">
    {([1, 2, 3] as FormStep[]).map(s => <div key={s} className="h-1 rounded-full transition-all duration-300" style={{
    width: step === s ? 28 : 10,
    backgroundColor: step >= s ? '#000' : '#E5E7EB'
  }} />)}
  </div>;

// ─── Field Component ──────────────────────────────────────────────────────────

const Field = ({
  label,
  icon: Icon,
  children,
  optional
}: {
  label: string;
  icon: React.ElementType;
  children: React.ReactNode;
  optional?: boolean;
}) => <div className="space-y-1.5">
    <div className="flex items-center gap-1.5">
      <Icon size={12} strokeWidth={2.5} className="text-neutral-400" />
      <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">
        {label}
      </label>
      {optional && <span className="text-[9px] font-medium text-neutral-300 uppercase tracking-wide ml-1">
          opcional
        </span>}
    </div>
    {children}
  </div>;
const TextInput = ({
  value,
  onChange,
  placeholder,
  type = 'text',
  inputMode
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  type?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode'];
}) => <input type={type} inputMode={inputMode} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3.5 text-sm font-bold text-black placeholder:text-neutral-300 outline-none focus:border-black focus:bg-white transition-all" />;

// ─── Main Component ───────────────────────────────────────────────────────────

interface NuevoProveedorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProveedorCreated: (nombre: string) => void;
}
export const NuevoProveedorModal = ({
  isOpen,
  onClose,
  onProveedorCreated
}: NuevoProveedorModalProps) => {
  const [step, setStep] = useState<FormStep>(1);
  const [form, setForm] = useState<ProveedorForm>(EMPTY_FORM);
  const [saved, setSaved] = useState(false);
  const set = (key: keyof ProveedorForm, value: string | string[]) => setForm(prev => ({
    ...prev,
    [key]: value
  }));
  const toggleDia = (dia: string) => {
    setForm(prev => ({
      ...prev,
      diasEntrega: prev.diasEntrega.includes(dia) ? prev.diasEntrega.filter(d => d !== dia) : [...prev.diasEntrega, dia]
    }));
  };
  const canContinueStep1 = form.nombreEmpresa.trim().length > 0 && form.rubro.length > 0 && form.telefono.trim().length > 0;
  const canContinueStep2 = true; // pago es opcional

  const canSave = form.diasEntrega.length > 0;
  const resetAndClose = () => {
    onClose();
    setTimeout(() => {
      setStep(1);
      setForm(EMPTY_FORM);
      setSaved(false);
    }, 400);
  };
  const handleSave = () => {
    setSaved(true);
    setTimeout(() => {
      onProveedorCreated(form.nombreEmpresa);
      resetAndClose();
    }, 1400);
  };
  const stepInfo = STEP_LABELS[step];
  return <AnimatePresence>
      {isOpen && <motion.div initial={{
      opacity: 0
    }} animate={{
      opacity: 1
    }} exit={{
      opacity: 0
    }} transition={{
      duration: 0.18
    }} className="fixed inset-0 z-50 flex flex-col justify-end" style={{
      maxWidth: 448,
      margin: '0 auto'
    }}>
          {/* Backdrop */}
          <motion.div initial={{
        opacity: 0
      }} animate={{
        opacity: 1
      }} exit={{
        opacity: 0
      }} className="absolute inset-0 bg-black/50" onClick={resetAndClose} />

          {/* Sheet */}
          <motion.div initial={{
        y: '100%'
      }} animate={{
        y: 0
      }} exit={{
        y: '100%'
      }} transition={{
        type: 'spring',
        damping: 30,
        stiffness: 320
      }} className="relative flex flex-col bg-white rounded-t-3xl overflow-hidden" style={{
        height: '92vh'
      }}>
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1 shrink-0">
              <div className="w-9 h-1 rounded-full bg-neutral-200" />
            </div>

            {/* Header */}
            <div className="px-5 pt-2 pb-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                {step > 1 && !saved && <button onClick={() => setStep(s => s - 1 as FormStep)} className="w-9 h-9 rounded-full border border-neutral-200 flex items-center justify-center text-neutral-600 active:scale-90 transition-transform shrink-0">
                    <ChevronLeft size={19} strokeWidth={2} />
                  </button>}
                <div>
                  <h2 className="text-lg font-black text-black leading-tight">
                    {stepInfo.title}
                  </h2>
                  <p className="text-xs text-neutral-400 font-medium mt-0.5">
                    {stepInfo.subtitle}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <StepDots step={step} />
                <button onClick={resetAndClose} className="w-9 h-9 rounded-full border border-neutral-200 flex items-center justify-center text-neutral-500 active:scale-90 transition-transform">
                  <X size={17} strokeWidth={2} />
                </button>
              </div>
            </div>

            <div className="h-px bg-neutral-100 mx-5 shrink-0" />

            {/* Steps */}
            <AnimatePresence mode="wait">

              {/* ── STEP 1 — Datos empresa y contacto ── */}
              {step === 1 && <motion.div key="s1" initial={{
            opacity: 0,
            x: 24
          }} animate={{
            opacity: 1,
            x: 0
          }} exit={{
            opacity: 0,
            x: -24
          }} transition={{
            duration: 0.2
          }} className="flex flex-col flex-1 overflow-hidden">
                  <div className="flex-1 overflow-y-auto px-5 pt-5 pb-4 space-y-5">

                    {/* Empresa */}
                    <Field label="Nombre de la empresa" icon={Building2}>
                      <TextInput value={form.nombreEmpresa} onChange={v => set('nombreEmpresa', v)} placeholder="Ej: Huerta Orgánica S.A." />
                    </Field>

                    {/* Nombre persona */}
                    <Field label="Nombre del contacto" icon={User} optional>
                      <TextInput value={form.nombrePersona} onChange={v => set('nombrePersona', v)} placeholder="Ej: Jorge Martínez" />
                    </Field>

                    {/* Rubro */}
                    <Field label="Rubro" icon={Tag}>
                      <div className="grid grid-cols-4 gap-2">
                        {RUBROS.map(r => <button key={r.id} onClick={() => set('rubro', r.label)} className={`py-2.5 px-1 rounded-xl border text-center text-xs font-black transition-all active:scale-95 ${form.rubro === r.label ? 'bg-black text-white border-black' : 'bg-white text-neutral-600 border-neutral-200'}`}>
                            {r.label}
                          </button>)}
                      </div>
                    </Field>

                    {/* Teléfono */}
                    <Field label="Teléfono" icon={Phone}>
                      <TextInput value={form.telefono} onChange={v => set('telefono', v)} placeholder="+54 9 11 1234-5678" type="tel" inputMode="tel" />
                    </Field>

                    {/* Contacto preferido */}
                    <Field label="Contacto preferido" icon={Mail}>
                      <div className="flex gap-2 mb-2">
                        {(['whatsapp', 'mail'] as const).map(tipo => <button key={tipo} onClick={() => set('contactoTipo', tipo)} className={`flex-1 py-2.5 rounded-xl border text-xs font-black transition-all active:scale-95 uppercase tracking-wide ${form.contactoTipo === tipo ? 'bg-black text-white border-black' : 'bg-white text-neutral-600 border-neutral-200'}`}>
                            {tipo === 'whatsapp' ? 'WhatsApp' : 'E-mail'}
                          </button>)}
                      </div>
                      <TextInput value={form.contactoValor} onChange={v => set('contactoValor', v)} placeholder={form.contactoTipo === 'whatsapp' ? '+54 9 11 1234-5678' : 'proveedor@email.com'} type={form.contactoTipo === 'mail' ? 'email' : 'tel'} inputMode={form.contactoTipo === 'mail' ? 'email' : 'tel'} />
                    </Field>

                    {/* Nombre ventas */}
                    <Field label="Persona de ventas" icon={User} optional>
                      <TextInput value={form.nombreVentas} onChange={v => set('nombreVentas', v)} placeholder="Ej: María López" />
                    </Field>
                  </div>

                  {/* CTA */}
                  <div className="px-5 pb-8 pt-3 shrink-0 border-t border-neutral-100 bg-white">
                    <button onClick={() => setStep(2)} disabled={!canContinueStep1} className="w-full py-4 rounded-2xl font-black text-sm bg-black text-white flex items-center justify-center gap-2 active:scale-[0.98] transition-all disabled:opacity-25 disabled:cursor-not-allowed">
                      <span>Continuar</span>
                      <ChevronRight size={18} strokeWidth={2.5} />
                    </button>
                  </div>
                </motion.div>}

              {/* ── STEP 2 — Datos de pago ── */}
              {step === 2 && <motion.div key="s2" initial={{
            opacity: 0,
            x: 24
          }} animate={{
            opacity: 1,
            x: 0
          }} exit={{
            opacity: 0,
            x: -24
          }} transition={{
            duration: 0.2
          }} className="flex flex-col flex-1 overflow-hidden">
                  <div className="flex-1 overflow-y-auto px-5 pt-5 pb-4 space-y-5">

                    {/* Info banner */}
                    <div className="bg-neutral-50 border border-neutral-100 rounded-2xl px-4 py-3 flex items-start gap-3">
                      <CreditCard size={16} strokeWidth={2} className="text-neutral-400 shrink-0 mt-0.5" />
                      <p className="text-xs text-neutral-500 leading-relaxed">
                        <span className="font-bold text-neutral-700">Datos de pago opcionales.</span>
                        <span> Los necesitás para poder ejecutar pagos digitales desde el panel admin.</span>
                      </p>
                    </div>

                    {/* CBU */}
                    <Field label="CBU" icon={CreditCard} optional>
                      <TextInput value={form.cbu} onChange={v => set('cbu', v)} placeholder="0000000000000000000000" inputMode="numeric" />
                    </Field>

                    {/* Alias */}
                    <Field label="Alias" icon={Hash} optional>
                      <TextInput value={form.alias} onChange={v => set('alias', v)} placeholder="Ej: huerta.organica.mp" />
                    </Field>

                    {/* Plazo de pago */}
                    <Field label="Plazo de pago" icon={Clock} optional>
                      <div className="grid grid-cols-3 gap-2">
                        {PLAZOS_PAGO.map((p: { id: string; label: string }) => {
                          const isPreset = p.id !== 'otros';
                          const isSelected = isPreset ? form.plazoPago === p.label : !PLAZOS_PAGO.filter((x: { id: string }) => x.id !== 'otros').map((x: { label: string }) => x.label).includes(form.plazoPago) && form.plazoPago !== '';
                          return <button key={p.id} onClick={() => { if (p.id === 'otros') { set('plazoPago', '__otros__'); } else { set('plazoPago', p.label); } }} className={`py-3 px-2 rounded-xl border text-center text-xs font-black transition-all active:scale-95 ${isSelected ? 'bg-black text-white border-black' : 'bg-white text-neutral-600 border-neutral-200'}`}>
                            {p.label}
                          </button>;
                        })}
                      </div>
                      {form.plazoPago === '__otros__' || (!PLAZOS_PAGO.filter((p: { id: string }) => p.id !== 'otros').map((p: { label: string }) => p.label).includes(form.plazoPago) && form.plazoPago !== '' && form.plazoPago !== '__otros__') ? (
                        <div className="mt-2 flex items-center gap-2 bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2.5">
                          <input
                            type="number"
                            inputMode="numeric"
                            min={1}
                            placeholder="Ej: 20"
                            value={form.plazoPago === '__otros__' ? '' : form.plazoPago.replace(' días', '')}
                            onChange={e => set('plazoPago', e.target.value ? `${e.target.value} días` : '__otros__')}
                            className="flex-1 bg-transparent text-sm font-bold text-black outline-none w-0 min-w-0"
                            autoFocus
                          />
                          <span className="text-sm text-neutral-400 shrink-0">días</span>
                        </div>
                      ) : null}
                    </Field>
                  </div>

                  {/* CTA */}
                  <div className="px-5 pb-8 pt-3 shrink-0 border-t border-neutral-100 bg-white">
                    <button onClick={() => setStep(3)} disabled={!canContinueStep2} className="w-full py-4 rounded-2xl font-black text-sm bg-black text-white flex items-center justify-center gap-2 active:scale-[0.98] transition-all disabled:opacity-25 disabled:cursor-not-allowed">
                      <span>Continuar</span>
                      <ChevronRight size={18} strokeWidth={2.5} />
                    </button>
                  </div>
                </motion.div>}

              {/* ── STEP 3 — Logística / días de entrega ── */}
              {step === 3 && <motion.div key="s3" initial={{
            opacity: 0,
            x: 24
          }} animate={{
            opacity: 1,
            x: 0
          }} exit={{
            opacity: 0,
            x: -24
          }} transition={{
            duration: 0.2
          }} className="flex flex-col flex-1 overflow-hidden">
                  <div className="flex-1 overflow-y-auto px-5 pt-5 pb-4 space-y-5">

                    {/* Días de entrega */}
                    <Field label="Días de entrega" icon={Truck}>
                      <p className="text-xs text-neutral-400 mb-3">
                        Seleccioná los días en que este proveedor hace entregas habitualmente.
                      </p>
                      <div className="grid grid-cols-7 gap-1.5">
                        {DIAS_SEMANA.map(dia => <button key={dia.id} onClick={() => toggleDia(dia.id)} className={`py-3 rounded-xl border text-center text-[11px] font-black transition-all active:scale-95 ${form.diasEntrega.includes(dia.id) ? 'bg-black text-white border-black' : 'bg-white text-neutral-500 border-neutral-200'}`}>
                            {dia.label}
                          </button>)}
                      </div>
                      {form.diasEntrega.length > 0 && <motion.p initial={{
                  opacity: 0
                }} animate={{
                  opacity: 1
                }} className="text-xs font-bold text-neutral-500 mt-2">
                          <span>Entrega: </span>
                          <span className="text-black">
                            {form.diasEntrega.map(d => DIAS_SEMANA.find(x => x.id === d)?.label).join(', ')}
                          </span>
                        </motion.p>}
                    </Field>

                    {/* Resumen */}
                    <div className="bg-neutral-50 border border-neutral-100 rounded-2xl overflow-hidden">
                      <div className="px-4 py-3 border-b border-neutral-100">
                        <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">
                          Resumen del proveedor
                        </p>
                      </div>
                      <div className="px-4 py-3 space-y-2.5">
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-neutral-400 font-medium">Empresa</span>
                          <span className="text-xs font-black text-black">{form.nombreEmpresa || '—'}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-neutral-400 font-medium">Rubro</span>
                          <span className="text-xs font-black text-black">{form.rubro || '—'}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-neutral-400 font-medium">Teléfono</span>
                          <span className="text-xs font-black text-black">{form.telefono || '—'}</span>
                        </div>
                        {form.plazoPago && form.plazoPago !== '__otros__' && <div className="flex justify-between items-center">
                            <span className="text-xs text-neutral-400 font-medium">Plazo de pago</span>
                            <span className="text-xs font-black text-black">{form.plazoPago}</span>
                          </div>}
                        {form.alias && <div className="flex justify-between items-center">
                            <span className="text-xs text-neutral-400 font-medium">Alias</span>
                            <span className="text-xs font-black text-black">{form.alias}</span>
                          </div>}
                      </div>
                    </div>
                  </div>

                  {/* CTA */}
                  <div className="px-5 pb-8 pt-3 shrink-0 border-t border-neutral-100 bg-white">
                    <AnimatePresence mode="wait">
                      {!saved ? <motion.button key="save-btn" exit={{
                  opacity: 0,
                  scale: 0.96
                }} onClick={handleSave} disabled={!canSave} className="w-full py-4 rounded-2xl font-black text-sm bg-black text-white flex items-center justify-center gap-2 active:scale-[0.98] transition-all disabled:opacity-25 disabled:cursor-not-allowed">
                          <Check size={18} strokeWidth={2.5} />
                          <span>Guardar proveedor</span>
                        </motion.button> : <motion.div key="saved-feedback" initial={{
                  opacity: 0,
                  scale: 0.9
                }} animate={{
                  opacity: 1,
                  scale: 1
                }} className="w-full py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 bg-neutral-900 text-white">
                          <Check size={18} strokeWidth={3} />
                          <span>¡Proveedor guardado!</span>
                        </motion.div>}
                    </AnimatePresence>
                  </div>
                </motion.div>}

            </AnimatePresence>
          </motion.div>
        </motion.div>}
    </AnimatePresence>;
};