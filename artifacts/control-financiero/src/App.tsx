import { type FormEvent, type ReactNode, useEffect, useMemo, useState } from 'react';
import { ArrowDownLeft, ArrowUpRight, BarChart3, Check, ChevronRight, CircleDollarSign, Edit3, HeartPulse, LayoutDashboard, Menu, Plus, RotateCcw, Settings2, Target, Trash2, TrendingUp, Wallet, X } from 'lucide-react';
import { Link, Route, Switch, useLocation } from 'wouter';

type MovementType = 'income' | 'expense';
type Movement = { id: string; type: MovementType; description: string; category: string; amount: number; date: string };
type Budget = { id: string; category: string; amount: number };
type FinanceData = { movements: Movement[]; budgets: Budget[] };

const STORAGE_KEY = 'control-financiero-data-v1';
const categories = ['Vivienda', 'Alimentación', 'Transporte', 'Bienestar', 'Ocio', 'Ahorro', 'Otros'];
const categoryColors: Record<string, string> = {
  Vivienda: '#ef927d', Alimentación: '#e6b95f', Transporte: '#75a8a0',
  Bienestar: '#bb91a8', Ocio: '#d5824f', Ahorro: '#2c8b83', Otros: '#a39c88',
};

const demoData: FinanceData = {
  movements: [
    { id: 'm-1', type: 'income', description: 'Nómina mensual', category: 'Otros', amount: 2450, date: '2025-03-01' },
    { id: 'm-2', type: 'expense', description: 'Alquiler', category: 'Vivienda', amount: 780, date: '2025-03-02' },
    { id: 'm-3', type: 'expense', description: 'Compra semanal', category: 'Alimentación', amount: 64.8, date: '2025-03-06' },
    { id: 'm-4', type: 'expense', description: 'Abono transporte', category: 'Transporte', amount: 42, date: '2025-03-07' },
    { id: 'm-5', type: 'expense', description: 'Clase de yoga', category: 'Bienestar', amount: 28, date: '2025-03-09' },
    { id: 'm-6', type: 'expense', description: 'Cena con amigos', category: 'Ocio', amount: 47.5, date: '2025-03-12' },
    { id: 'm-7', type: 'expense', description: 'Café y tostada', category: 'Alimentación', amount: 6.2, date: '2025-03-14' },
    { id: 'm-8', type: 'expense', description: 'Aportación mensual', category: 'Ahorro', amount: 250, date: '2025-03-03' },
  ],
  budgets: [
    { id: 'b-1', category: 'Vivienda', amount: 800 },
    { id: 'b-2', category: 'Alimentación', amount: 320 },
    { id: 'b-3', category: 'Transporte', amount: 120 },
    { id: 'b-4', category: 'Bienestar', amount: 100 },
    { id: 'b-5', category: 'Ocio', amount: 180 },
    { id: 'b-6', category: 'Ahorro', amount: 300 },
  ],
};

const currency = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' });
const dateFormat = new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'short' });
const monthFormat = new Intl.DateTimeFormat('es-ES', { month: 'long', year: 'numeric' });

function loadData(): FinanceData {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored) as FinanceData;
  } catch { /* use demo data when storage is unavailable */ }
  return demoData;
}

function formatMoney(value: number) { return currency.format(value); }
function formatDate(value: string) { return dateFormat.format(new Date(`${value}T12:00:00`)); }
function today() { return new Date().toISOString().slice(0, 10); }
function monthLabel() { return monthFormat.format(new Date()).replace(/^./, (letter) => letter.toUpperCase()); }

function App() {
  const [data, setData] = useState<FinanceData>(loadData);
  const [menuOpen, setMenuOpen] = useState(false);
  const [movementEditor, setMovementEditor] = useState<Movement | 'new' | null>(null);
  const [budgetEditor, setBudgetEditor] = useState<Budget | 'new' | null>(null);

  useEffect(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); }, [data]);

  const updateData = (next: FinanceData) => setData(next);
  const removeMovement = (id: string) => updateData({ ...data, movements: data.movements.filter((item) => item.id !== id) });
  const removeBudget = (id: string) => updateData({ ...data, budgets: data.budgets.filter((item) => item.id !== id) });
  const resetData = () => {
    if (window.confirm('¿Quieres volver a cargar los datos de ejemplo? Tus cambios actuales se reemplazarán.')) {
      updateData({ movements: demoData.movements.map((item) => ({ ...item })), budgets: demoData.budgets.map((item) => ({ ...item })) });
    }
  };

  return (
    <div className="app-shell">
      <div className="flex min-h-[100dvh]">
        <aside className="sidebar hidden w-[250px] shrink-0 flex-col px-5 py-7 md:flex">
          <Brand />
          <div className="mt-12 flex-1">
            <p className="mb-4 px-3 text-[10px] font-bold uppercase tracking-[.18em] opacity-55">Tu espacio</p>
            <Navigation />
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[.06] p-4">
            <div className="mb-3 flex items-center gap-2 text-xs font-semibold text-[#f3d889]"><HeartPulse size={15} /> Un pequeño recordatorio</div>
            <p className="text-sm leading-relaxed text-white/75">Mirar tus números también es una forma de cuidarte.</p>
          </div>
          <button type="button" onClick={resetData} data-testid="button-reset-data" className="mt-5 flex items-center gap-2 px-3 text-xs font-semibold text-white/55 transition-colors hover:text-white">
            <RotateCcw size={14} /> Restablecer datos de ejemplo
          </button>
        </aside>
        <div className="min-w-0 flex-1">
          <header className="sticky top-0 z-20 flex h-[74px] items-center justify-between border-b border-[#ded7c8] bg-[#f5f1e8]/90 px-5 backdrop-blur-md md:px-10">
            <button type="button" aria-label="Abrir menú" onClick={() => setMenuOpen(!menuOpen)} data-testid="button-open-menu" className="rounded-full p-2 text-[#0b6e69] md:hidden"><Menu size={22} /></button>
            <div className="hidden md:block">
              <p className="text-xs font-semibold uppercase tracking-[.16em] text-[#7b8279]">{monthLabel()}</p>
              <p className="serif mt-0.5 text-[17px] text-[#183f3e]">Un vistazo amable a tu dinero</p>
            </div>
            <div className="ml-auto flex items-center gap-3">
              <div className="hidden text-right sm:block"><p className="text-sm font-bold text-[#183f3e]">Hola, Clara</p><p className="text-xs text-[#7b8279]">Tu bolsillo, en calma</p></div>
              <div className="grid h-10 w-10 place-items-center rounded-full bg-[#e9bd63] font-serif text-lg font-bold text-[#174b49]">C</div>
            </div>
          </header>
          {menuOpen && <div className="fixed inset-0 z-30 bg-[#153f3d]/25 md:hidden" onClick={() => setMenuOpen(false)}><div className="sidebar h-full w-[270px] p-6 shadow-2xl" onClick={(event) => event.stopPropagation()}><Brand /><div className="mt-10"><Navigation onNavigate={() => setMenuOpen(false)} /></div><button type="button" onClick={resetData} data-testid="button-reset-data-mobile" className="mt-10 flex items-center gap-2 text-xs font-semibold text-white/60"><RotateCcw size={14} /> Restablecer ejemplo</button></div></div>}
          <main className="mobile-safe page-enter mx-auto max-w-[1440px] px-5 py-7 md:px-10 md:py-10">
            <Switch>
              <Route path="/" component={() => <DashboardPage data={data} onNew={() => setMovementEditor('new')} />} />
              <Route path="/movimientos" component={() => <MovementsPage data={data} onNew={() => setMovementEditor('new')} onEdit={setMovementEditor} onDelete={removeMovement} />} />
              <Route path="/presupuesto" component={() => <BudgetPage data={data} onNew={() => setBudgetEditor('new')} onEdit={setBudgetEditor} onDelete={removeBudget} />} />
              <Route component={NotFound} />
            </Switch>
          </main>
        </div>
      </div>
      <div className="fixed bottom-0 left-0 right-0 z-20 border-t border-[#ded7c8] bg-[#f5f1e8]/95 px-3 py-2 backdrop-blur-md md:hidden"><Navigation mobile /></div>
      {movementEditor && <MovementModal value={movementEditor === 'new' ? null : movementEditor} onClose={() => setMovementEditor(null)} onSave={(movement) => { updateData({ ...data, movements: movementEditor === 'new' ? [movement, ...data.movements] : data.movements.map((item) => item.id === movement.id ? movement : item) }); setMovementEditor(null); }} />}
      {budgetEditor && <BudgetModal value={budgetEditor === 'new' ? null : budgetEditor} existing={data.budgets} onClose={() => setBudgetEditor(null)} onSave={(budget) => { updateData({ ...data, budgets: budgetEditor === 'new' ? [...data.budgets, budget] : data.budgets.map((item) => item.id === budget.id ? budget : item) }); setBudgetEditor(null); }} />}
    </div>
  );
}

function Brand() {
  return <Link href="/" className="flex items-center gap-3" data-testid="link-brand"><div className="grid h-10 w-10 place-items-center rounded-[13px] bg-[#f3d889] text-[#0b6e69]"><Wallet size={22} strokeWidth={2.5} /></div><div><p className="serif text-xl font-semibold leading-none tracking-tight">Claro</p><p className="mt-1 text-[10px] font-bold uppercase tracking-[.22em] text-white/55">finanzas</p></div></Link>;
}

function Navigation({ mobile = false, onNavigate }: { mobile?: boolean; onNavigate?: () => void }) {
  const [location] = useLocation();
  const links = [
    { href: '/', label: 'Resumen', icon: LayoutDashboard },
    { href: '/movimientos', label: 'Movimientos', icon: BarChart3 },
    { href: '/presupuesto', label: 'Presupuesto', icon: Target },
  ];
  return <nav className={mobile ? 'mx-auto flex max-w-md items-center justify-around' : 'space-y-2'}>{links.map(({ href, label, icon: Icon }) => {
    const active = location === href;
    return <Link key={href} href={href} onClick={onNavigate} data-testid={`link-nav-${label.toLowerCase()}`} className={`nav-link flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold ${mobile ? `flex-col gap-1 px-3 py-1 text-[10px] ${active ? 'text-[#0b6e69]' : 'text-[#7b8279]'}` : active ? 'bg-white/12 text-white' : 'text-white/65 hover:bg-white/8 hover:text-white'}`}><Icon size={mobile ? 19 : 18} strokeWidth={active ? 2.5 : 2} /><span>{label}</span>{!mobile && active && <ChevronRight className="ml-auto opacity-60" size={15} />}</Link>;
  })}</nav>;
}

function PageTitle({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: ReactNode }) {
  return <div className="mb-8 flex flex-col justify-between gap-5 md:flex-row md:items-end"><div><p className="mb-2 text-[11px] font-bold uppercase tracking-[.2em] text-[#0b6e69]">{eyebrow}</p><h1 className="serif text-[clamp(2.2rem,5vw,3.6rem)] leading-[.96] tracking-[-.04em] text-[#183f3e]">{title}</h1><p className="mt-3 max-w-xl text-[15px] leading-relaxed text-[#69756e]">{description}</p></div>{action}</div>;
}

function SummaryCard({ label, value, note, type }: { label: string; value: string; note: string; type: 'income' | 'expense' | 'balance' }) {
  const positive = type !== 'expense';
  return <div className={`lift-on-hover card-shadow rounded-[22px] border p-5 ${type === 'balance' ? 'border-[#0b6e69] bg-[#0b6e69] text-[#f8f1e5]' : 'border-[#e2dbcd] bg-[#fbf8f1]'}`} data-testid={`card-summary-${type}`}><div className="flex items-start justify-between"><span className={`text-xs font-bold uppercase tracking-[.12em] ${type === 'balance' ? 'text-white/65' : 'text-[#7b8279]'}`}>{label}</span><span className={`grid h-8 w-8 place-items-center rounded-full ${type === 'income' ? 'bg-[#d5e5d6] text-[#39715f]' : type === 'expense' ? 'bg-[#f7d8ce] text-[#bd5f4a]' : 'bg-[#f3d889] text-[#0b6e69]'}`}>{type === 'income' ? <ArrowDownLeft size={16} /> : type === 'expense' ? <ArrowUpRight size={16} /> : <CircleDollarSign size={16} />}</span></div><p className={`mt-5 font-serif text-3xl tracking-tight ${type === 'balance' ? 'text-[#f8f1e5]' : 'text-[#183f3e]'}`}>{value}</p><p className={`mt-1 text-xs ${type === 'balance' ? 'text-white/65' : positive ? 'text-[#578073]' : 'text-[#a66b5d]'}`}>{note}</p></div>;
}

function DashboardPage({ data, onNew }: { data: FinanceData; onNew: () => void }) {
  const income = data.movements.filter((item) => item.type === 'income').reduce((sum, item) => sum + item.amount, 0);
  const expenses = data.movements.filter((item) => item.type === 'expense').reduce((sum, item) => sum + item.amount, 0);
  const balance = income - expenses;
  const spentByCategory = useMemo(() => data.movements.filter((item) => item.type === 'expense').reduce<Record<string, number>>((acc, item) => ({ ...acc, [item.category]: (acc[item.category] || 0) + item.amount }), {}), [data.movements]);
  const budgetTotal = data.budgets.reduce((sum, item) => sum + item.amount, 0);
  const health = income === 0 ? 0 : Math.max(0, Math.min(100, Math.round((balance / income) * 100)));
  const recent = [...data.movements].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);
  return <div>
    <PageTitle eyebrow="Resumen mensual" title="Tu dinero, más claro." description="Una pausa breve para saber dónde estás y decidir el siguiente paso con tranquilidad." action={<button type="button" onClick={onNew} data-testid="button-add-movement-dashboard" className="flex items-center justify-center gap-2 rounded-xl bg-[#0b6e69] px-5 py-3 text-sm font-bold text-[#f8f1e5] shadow-sm transition-transform hover:-translate-y-0.5"><Plus size={17} /> Añadir movimiento</button>} />
    <div className="grid gap-4 sm:grid-cols-3"><SummaryCard label="Ingresos" value={formatMoney(income)} note="Lo que ha entrado este mes" type="income" /><SummaryCard label="Gastos" value={formatMoney(expenses)} note="Lo que ha salido este mes" type="expense" /><SummaryCard label="Disponible" value={formatMoney(balance)} note={balance >= 0 ? 'Vas en una buena dirección' : 'Conviene revisar el ritmo'} type="balance" /></div>
    <div className="mt-5 grid gap-5 lg:grid-cols-[1.15fr_.85fr]">
      <section className="card-shadow rounded-[26px] border border-[#e2dbcd] bg-[#fbf8f1] p-6 md:p-7" data-testid="section-financial-health">
        <div className="flex items-start justify-between"><div><p className="text-xs font-bold uppercase tracking-[.16em] text-[#7b8279]">Salud financiera</p><h2 className="serif mt-2 text-2xl text-[#183f3e]">Este mes se siente {health >= 35 ? 'estable' : 'en movimiento'}</h2></div><div className="grid h-11 w-11 place-items-center rounded-2xl bg-[#d5e5d6] text-[#39715f]"><HeartPulse size={22} /></div></div>
        <div className="mt-7 flex items-center gap-6"><div className="relative grid h-28 w-28 shrink-0 place-items-center rounded-full" style={{ background: `conic-gradient(#2c8b83 ${health}%, #e6e0d3 0)` }}><div className="grid h-[88px] w-[88px] place-items-center rounded-full bg-[#fbf8f1]"><span className="font-serif text-2xl text-[#183f3e]">{health}<small className="text-sm">%</small></span></div></div><div><p className="text-sm font-bold text-[#183f3e]">{health >= 35 ? 'Tu margen está respirando.' : 'Tu margen necesita atención.'}</p><p className="mt-1 text-sm leading-relaxed text-[#69756e]">Tu ahorro disponible representa {health}% de lo que ingresó. Cada pequeño ajuste suma.</p></div></div>
        <div className="mt-8 border-t border-[#e6dfd2] pt-5"><div className="flex justify-between text-xs text-[#7b8279]"><span>Gasto frente a presupuesto</span><span className="font-bold text-[#183f3e]">{budgetTotal ? Math.round((expenses / budgetTotal) * 100) : 0}%</span></div><div className="progress-track mt-3"><div className="progress-fill bg-[#e9bd63]" style={{ width: `${Math.min(100, budgetTotal ? (expenses / budgetTotal) * 100 : 0)}%` }} /></div></div>
      </section>
      <section className="dot-grid overflow-hidden rounded-[26px] border border-[#e9d8a9] bg-[#f3d889] p-6 md:p-7" data-testid="section-budget-glance">
        <div className="flex items-center justify-between"><p className="text-xs font-bold uppercase tracking-[.16em] text-[#5f674e]">Presupuesto</p><Target size={20} className="text-[#0b6e69]" /></div><h2 className="serif mt-3 max-w-xs text-3xl leading-tight text-[#183f3e]">Gastar con intención se nota.</h2><p className="mt-3 text-sm leading-relaxed text-[#536658]">Has usado {formatMoney(expenses)} de {formatMoney(budgetTotal)} planificados.</p>
        <Link href="/presupuesto" data-testid="link-see-budget" className="mt-8 inline-flex items-center gap-2 text-sm font-bold text-[#0b6e69]">Ver detalle <ChevronRight size={16} /></Link>
      </section>
    </div>
    <section className="mt-5 rounded-[26px] border border-[#e2dbcd] bg-[#fbf8f1] p-6 md:p-7" data-testid="section-recent-movements">
      <div className="mb-5 flex items-center justify-between"><div><p className="text-xs font-bold uppercase tracking-[.16em] text-[#7b8279]">Actividad reciente</p><h2 className="serif mt-1 text-2xl text-[#183f3e]">Tus últimos movimientos</h2></div><Link href="/movimientos" data-testid="link-see-movements" className="text-sm font-bold text-[#0b6e69]">Ver todos</Link></div>
      {recent.length ? <div className="divide-y divide-[#e9e2d6]">{recent.map((item) => <MovementRow key={item.id} movement={item} compact />)}</div> : <EmptyState title="Todavía no hay movimientos" description="Añade tu primer ingreso o gasto para empezar a verlo todo más claro." action={onNew} actionLabel="Añadir movimiento" />}
    </section>
  </div>;
}

function MovementRow({ movement, compact = false, onEdit, onDelete }: { movement: Movement; compact?: boolean; onEdit?: () => void; onDelete?: () => void }) {
  const income = movement.type === 'income';
  return <div className={`group flex items-center gap-3 py-3 ${compact ? '' : 'px-1'}`} data-testid={`row-movement-${movement.id}`}><div className={`grid h-10 w-10 shrink-0 place-items-center rounded-[13px] ${income ? 'bg-[#d5e5d6] text-[#39715f]' : 'bg-[#f7d8ce] text-[#bd5f4a]'}`}>{income ? <ArrowDownLeft size={18} /> : <ArrowUpRight size={18} />}</div><div className="min-w-0 flex-1"><p className="truncate text-sm font-bold text-[#294846]">{movement.description}</p><p className="mt-0.5 text-xs text-[#8a9188]">{movement.category} · {formatDate(movement.date)}</p></div><p className={`shrink-0 text-sm font-bold ${income ? 'text-[#39715f]' : 'text-[#bd5f4a]'}`}>{income ? '+' : '−'}{formatMoney(movement.amount)}</p>{onEdit && <div className="flex gap-1 pl-2 md:invisible md:group-hover:visible"><button type="button" onClick={onEdit} aria-label="Editar movimiento" data-testid={`button-edit-movement-${movement.id}`} className="rounded-lg p-2 text-[#7b8279] hover:bg-[#eee7d9] hover:text-[#0b6e69]"><Edit3 size={15} /></button><button type="button" onClick={onDelete} aria-label="Eliminar movimiento" data-testid={`button-delete-movement-${movement.id}`} className="rounded-lg p-2 text-[#7b8279] hover:bg-[#f7d8ce] hover:text-[#bd5f4a]"><Trash2 size={15} /></button></div>}</div>;
}

function MovementsPage({ data, onNew, onEdit, onDelete }: { data: FinanceData; onNew: () => void; onEdit: (movement: Movement) => void; onDelete: (id: string) => void }) {
  const [filter, setFilter] = useState<'all' | MovementType>('all');
  const sorted = [...data.movements].filter((item) => filter === 'all' || item.type === filter).sort((a, b) => b.date.localeCompare(a.date));
  const askDelete = (id: string) => { if (window.confirm('¿Eliminar este movimiento?')) onDelete(id); };
  return <div><PageTitle eyebrow="Tu actividad" title="Movimientos" description="Registra lo que entra y sale. Verlo escrito hace que tus decisiones pesen menos." action={<button type="button" onClick={onNew} data-testid="button-add-movement" className="flex items-center justify-center gap-2 rounded-xl bg-[#0b6e69] px-5 py-3 text-sm font-bold text-[#f8f1e5]"><Plus size={17} /> Nuevo movimiento</button>} />
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3"><div className="flex rounded-xl border border-[#ded7c8] bg-[#fbf8f1] p-1">{(['all', 'income', 'expense'] as const).map((key) => <button type="button" key={key} onClick={() => setFilter(key)} data-testid={`button-filter-${key}`} className={`rounded-lg px-3 py-2 text-xs font-bold transition-colors ${filter === key ? 'bg-[#0b6e69] text-[#f8f1e5]' : 'text-[#7b8279] hover:text-[#183f3e]'}`}>{key === 'all' ? 'Todos' : key === 'income' ? 'Ingresos' : 'Gastos'}</button>)}</div><p className="text-xs text-[#8a9188]">{sorted.length} {sorted.length === 1 ? 'movimiento' : 'movimientos'}</p></div>
    <section className="rounded-[26px] border border-[#e2dbcd] bg-[#fbf8f1] p-5 md:p-7">{sorted.length ? <div className="divide-y divide-[#e9e2d6]">{sorted.map((item) => <MovementRow key={item.id} movement={item} onEdit={() => onEdit(item)} onDelete={() => askDelete(item.id)} />)}</div> : <EmptyState title="Nada por aquí todavía" description="Cuando apuntes un ingreso o un gasto, aparecerá en este espacio." action={onNew} actionLabel="Añadir movimiento" />}</section>
    <div className="mt-5 grid gap-4 sm:grid-cols-2"><div className="rounded-[22px] bg-[#d5e5d6] p-5"><p className="text-xs font-bold uppercase tracking-[.14em] text-[#527468]">Ingresos registrados</p><p className="serif mt-2 text-2xl text-[#183f3e]">{formatMoney(data.movements.filter((item) => item.type === 'income').reduce((sum, item) => sum + item.amount, 0))}</p></div><div className="rounded-[22px] bg-[#f7d8ce] p-5"><p className="text-xs font-bold uppercase tracking-[.14em] text-[#9c6558]">Gastos registrados</p><p className="serif mt-2 text-2xl text-[#183f3e]">{formatMoney(data.movements.filter((item) => item.type === 'expense').reduce((sum, item) => sum + item.amount, 0))}</p></div></div>
  </div>;
}

function BudgetPage({ data, onNew, onEdit, onDelete }: { data: FinanceData; onNew: () => void; onEdit: (budget: Budget) => void; onDelete: (id: string) => void }) {
  const spent = useMemo(() => data.movements.filter((item) => item.type === 'expense').reduce<Record<string, number>>((acc, item) => ({ ...acc, [item.category]: (acc[item.category] || 0) + item.amount }), {}), [data.movements]);
  const totalBudget = data.budgets.reduce((sum, item) => sum + item.amount, 0);
  const totalSpent = Object.values(spent).reduce((sum, value) => sum + value, 0);
  const askDelete = (id: string) => { if (window.confirm('¿Eliminar este presupuesto?')) onDelete(id); };
  return <div><PageTitle eyebrow="Plan del mes" title="Presupuesto" description="Ponle un destino a cada euro y deja que el progreso te acompañe, no que te persiga." action={<button type="button" onClick={onNew} data-testid="button-add-budget" className="flex items-center justify-center gap-2 rounded-xl bg-[#0b6e69] px-5 py-3 text-sm font-bold text-[#f8f1e5]"><Plus size={17} /> Añadir categoría</button>} />
    <div className="mb-6 grid gap-4 sm:grid-cols-3"><div className="rounded-[22px] border border-[#e2dbcd] bg-[#fbf8f1] p-5"><p className="text-xs font-bold uppercase tracking-[.12em] text-[#7b8279]">Planificado</p><p className="serif mt-2 text-2xl text-[#183f3e]">{formatMoney(totalBudget)}</p></div><div className="rounded-[22px] border border-[#e2dbcd] bg-[#fbf8f1] p-5"><p className="text-xs font-bold uppercase tracking-[.12em] text-[#7b8279]">Gastado</p><p className="serif mt-2 text-2xl text-[#183f3e]">{formatMoney(totalSpent)}</p></div><div className="rounded-[22px] bg-[#f3d889] p-5"><p className="text-xs font-bold uppercase tracking-[.12em] text-[#5f674e]">Queda por decidir</p><p className="serif mt-2 text-2xl text-[#183f3e]">{formatMoney(Math.max(0, totalBudget - totalSpent))}</p></div></div>
    <section className="grid gap-4 md:grid-cols-2">{data.budgets.length ? data.budgets.map((item) => { const amount = spent[item.category] || 0; const percent = Math.round((amount / item.amount) * 100); const over = percent > 100; return <article key={item.id} className="lift-on-hover rounded-[24px] border border-[#e2dbcd] bg-[#fbf8f1] p-5" data-testid={`card-budget-${item.id}`}><div className="flex items-start justify-between"><div className="flex items-center gap-3"><div className="h-3 w-3 rounded-full" style={{ backgroundColor: categoryColors[item.category] || categoryColors.Otros }} /><div><h2 className="font-bold text-[#294846]">{item.category}</h2><p className="mt-0.5 text-xs text-[#8a9188]">{formatMoney(amount)} de {formatMoney(item.amount)}</p></div></div><div className="flex gap-1"><button type="button" onClick={() => onEdit(item)} aria-label="Editar presupuesto" data-testid={`button-edit-budget-${item.id}`} className="rounded-lg p-2 text-[#7b8279] hover:bg-[#eee7d9] hover:text-[#0b6e69]"><Edit3 size={15} /></button><button type="button" onClick={() => askDelete(item.id)} aria-label="Eliminar presupuesto" data-testid={`button-delete-budget-${item.id}`} className="rounded-lg p-2 text-[#7b8279] hover:bg-[#f7d8ce] hover:text-[#bd5f4a]"><Trash2 size={15} /></button></div></div><div className="mt-5 flex items-center justify-between text-xs"><span className={over ? 'font-bold text-[#bd5f4a]' : 'font-semibold text-[#527468]'}>{over ? 'Te has pasado' : percent === 0 ? 'Aún sin gastos' : `${percent}% utilizado`}</span><span className="text-[#8a9188]">{formatMoney(Math.max(0, item.amount - amount))} disponible</span></div><div className="progress-track mt-2"><div className={`progress-fill ${over ? 'bg-[#bd5f4a]' : 'bg-[#2c8b83]'}`} style={{ width: `${Math.min(100, percent)}%` }} /></div></article>; }) : <div className="md:col-span-2"><EmptyState title="Tu presupuesto empieza aquí" description="Crea categorías para darle una intención concreta a tus gastos del mes." action={onNew} actionLabel="Crear presupuesto" /></div>}</section>
  </div>;
}

function EmptyState({ title, description, action, actionLabel }: { title: string; description: string; action: () => void; actionLabel: string }) {
  return <div className="dot-grid rounded-2xl border border-dashed border-[#cfc7b6] px-6 py-12 text-center"><div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-[#d5e5d6] text-[#0b6e69]"><TrendingUp size={22} /></div><h3 className="serif mt-4 text-2xl text-[#183f3e]">{title}</h3><p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-[#7b8279]">{description}</p><button type="button" onClick={action} data-testid="button-empty-action" className="mt-5 rounded-xl bg-[#0b6e69] px-4 py-2.5 text-sm font-bold text-[#f8f1e5]">{actionLabel}</button></div>;
}

function ModalShell({ title, description, onClose, children }: { title: string; description: string; onClose: () => void; children: ReactNode }) {
  return <div className="fixed inset-0 z-50 grid place-items-center bg-[#153f3d]/35 p-4 backdrop-blur-[2px]" onMouseDown={onClose}><div className="soft-pop max-h-[calc(100dvh-32px)] w-full max-w-lg overflow-y-auto rounded-[26px] border border-[#ded7c8] bg-[#fbf8f1] p-6 shadow-2xl md:p-7" onMouseDown={(event) => event.stopPropagation()}><div className="flex items-start justify-between"><div><h2 className="serif text-3xl text-[#183f3e]">{title}</h2><p className="mt-2 text-sm text-[#7b8279]">{description}</p></div><button type="button" onClick={onClose} aria-label="Cerrar" data-testid="button-close-modal" className="rounded-full p-2 text-[#7b8279] hover:bg-[#eee7d9]"><X size={19} /></button></div>{children}</div></div>;
}

function Field({ label, error, children }: { label: string; error?: string; children: ReactNode }) {
  return <label className="block"><span className="mb-1.5 block text-xs font-bold text-[#52635c]">{label}</span>{children}{error && <span className="mt-1 block text-xs font-semibold text-[#bd5f4a]">{error}</span>}</label>;
}
const inputClass = 'w-full rounded-xl border border-[#d9d1c1] bg-[#f8f4eb] px-3.5 py-3 text-sm text-[#183f3e] outline-none transition focus:border-[#0b6e69] focus:ring-2 focus:ring-[#0b6e69]/10';

function MovementModal({ value, onClose, onSave }: { value: Movement | null; onClose: () => void; onSave: (movement: Movement) => void }) {
  const [type, setType] = useState<MovementType>(value?.type || 'expense');
  const [description, setDescription] = useState(value?.description || '');
  const [category, setCategory] = useState(value?.category || 'Alimentación');
  const [amount, setAmount] = useState(value?.amount ? String(value.amount) : '');
  const [date, setDate] = useState(value?.date || today());
  const [error, setError] = useState('');
  const submit = (event: FormEvent) => { event.preventDefault(); const numeric = Number(amount.replace(',', '.')); if (!description.trim() || !category || !date || !Number.isFinite(numeric) || numeric <= 0) { setError('Completa todos los campos con un importe mayor que 0.'); return; } onSave({ id: value?.id || `m-${Date.now()}`, type, description: description.trim(), category, amount: numeric, date }); };
  return <ModalShell title={value ? 'Editar movimiento' : 'Nuevo movimiento'} description="Anota el contexto; te ayudará a entender tus hábitos." onClose={onClose}><form onSubmit={submit} className="mt-7 space-y-4"><div className="grid grid-cols-2 gap-2 rounded-xl bg-[#eee7d9] p-1"><button type="button" onClick={() => setType('expense')} data-testid="button-type-expense" className={`rounded-lg py-2.5 text-sm font-bold ${type === 'expense' ? 'bg-[#f7d8ce] text-[#a75041]' : 'text-[#7b8279]'}`}>Gasto</button><button type="button" onClick={() => setType('income')} data-testid="button-type-income" className={`rounded-lg py-2.5 text-sm font-bold ${type === 'income' ? 'bg-[#d5e5d6] text-[#39715f]' : 'text-[#7b8279]'}`}>Ingreso</button></div><Field label="Descripción"><input value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Ej. Compra semanal" data-testid="input-movement-description" className={inputClass} /></Field><div className="grid gap-4 sm:grid-cols-2"><Field label="Categoría"><select value={category} onChange={(event) => setCategory(event.target.value)} data-testid="select-movement-category" className={inputClass}>{categories.map((item) => <option key={item}>{item}</option>)}</select></Field><Field label="Importe"><div className="relative"><input value={amount} onChange={(event) => setAmount(event.target.value)} inputMode="decimal" placeholder="0,00" data-testid="input-movement-amount" className={`${inputClass} pr-10`} /><span className="absolute right-3 top-3 text-sm text-[#8a9188]">€</span></div></Field></div><Field label="Fecha"><input type="date" value={date} onChange={(event) => setDate(event.target.value)} data-testid="input-movement-date" className={inputClass} /></Field>{error && <p className="rounded-xl bg-[#f7d8ce] px-3 py-2.5 text-xs font-semibold text-[#a75041]" data-testid="status-form-error">{error}</p>}<button type="submit" data-testid="button-save-movement" className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-[#0b6e69] py-3.5 text-sm font-bold text-[#f8f1e5]"><Check size={17} /> Guardar movimiento</button></form></ModalShell>;
}

function BudgetModal({ value, existing, onClose, onSave }: { value: Budget | null; existing: Budget[]; onClose: () => void; onSave: (budget: Budget) => void }) {
  const [category, setCategory] = useState(value?.category || categories.find((item) => !existing.some((budget) => budget.category === item)) || categories[0]);
  const [amount, setAmount] = useState(value?.amount ? String(value.amount) : '');
  const [error, setError] = useState('');
  const available = categories.filter((item) => item === value?.category || !existing.some((budget) => budget.category === item));
  const submit = (event: FormEvent) => { event.preventDefault(); const numeric = Number(amount.replace(',', '.')); if (!category || !Number.isFinite(numeric) || numeric <= 0) { setError('Elige una categoría e indica un importe mayor que 0.'); return; } onSave({ id: value?.id || `b-${Date.now()}`, category, amount: numeric }); };
  return <ModalShell title={value ? 'Editar presupuesto' : 'Nueva categoría'} description="Define un límite que te ayude a elegir, no a castigarte." onClose={onClose}><form onSubmit={submit} className="mt-7 space-y-4"><Field label="Categoría"><select value={category} onChange={(event) => setCategory(event.target.value)} data-testid="select-budget-category" className={inputClass}>{available.map((item) => <option key={item}>{item}</option>)}</select></Field><Field label="Presupuesto mensual"><div className="relative"><input value={amount} onChange={(event) => setAmount(event.target.value)} inputMode="decimal" placeholder="0,00" data-testid="input-budget-amount" className={`${inputClass} pr-10`} /><span className="absolute right-3 top-3 text-sm text-[#8a9188]">€</span></div></Field>{error && <p className="rounded-xl bg-[#f7d8ce] px-3 py-2.5 text-xs font-semibold text-[#a75041]" data-testid="status-budget-error">{error}</p>}<button type="submit" data-testid="button-save-budget" className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-[#0b6e69] py-3.5 text-sm font-bold text-[#f8f1e5]"><Check size={17} /> Guardar presupuesto</button></form></ModalShell>;
}

function NotFound() {
  return <div className="rounded-[26px] border border-[#e2dbcd] bg-[#fbf8f1] p-12 text-center"><Settings2 className="mx-auto text-[#0b6e69]" size={28} /><h1 className="serif mt-4 text-3xl text-[#183f3e]">Esta página no existe</h1><Link href="/" data-testid="link-back-home" className="mt-5 inline-flex rounded-xl bg-[#0b6e69] px-4 py-2.5 text-sm font-bold text-[#f8f1e5]">Volver al resumen</Link></div>;
}

export default App;