import { createContext, type FormEvent, type ReactNode, useContext, useEffect, useMemo, useState } from 'react';
import { ArrowDownLeft, ArrowUpRight, BarChart3, Check, ChevronRight, CircleDollarSign, Download, Edit3, FileSpreadsheet, HeartPulse, LayoutDashboard, Menu, PieChart as PieChartIcon, Plus, RotateCcw, Settings2, Target, Trash2, TrendingUp, Wallet, X } from 'lucide-react';
import * as XLSX from 'xlsx';
import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Link, Route, Switch, useLocation } from 'wouter';

type MovementType = 'income' | 'expense';
type Movement = { id: string; type: MovementType; description: string; category: string; amount: number; date: string };
type Budget = { id: string; category: string; amount: number };
type FinanceData = { movements: Movement[]; budgets: Budget[] };
type CurrencyCode = 'COP' | 'USD' | 'EUR' | 'MXN' | 'PEN' | 'GBP';
type LanguageCode = 'es' | 'en';

const STORAGE_KEY = 'control-financiero-data-v1';
const CURRENCY_STORAGE_KEY = 'control-financiero-currency-v1';
const LANGUAGE_STORAGE_KEY = 'control-financiero-language-v1';
const categories = ['Vivienda', 'Alimentación', 'Transporte', 'Bienestar', 'Ocio', 'Ahorro', 'Otros'];
const currencyOptions: { code: CurrencyCode; label: string; symbol: string }[] = [
  { code: 'COP', label: 'Peso colombiano', symbol: '$' },
  { code: 'USD', label: 'Dólar estadounidense', symbol: 'US$' },
  { code: 'EUR', label: 'Euro', symbol: '€' },
  { code: 'MXN', label: 'Peso mexicano', symbol: 'MX$' },
  { code: 'PEN', label: 'Sol peruano', symbol: 'S/' },
  { code: 'GBP', label: 'Libra esterlina', symbol: '£' },
];
const currencyLabels: Record<CurrencyCode, Record<LanguageCode, string>> = {
  COP: { es: 'Peso colombiano', en: 'Colombian peso' },
  USD: { es: 'Dólar estadounidense', en: 'US dollar' },
  EUR: { es: 'Euro', en: 'Euro' },
  MXN: { es: 'Peso mexicano', en: 'Mexican peso' },
  PEN: { es: 'Sol peruano', en: 'Peruvian sol' },
  GBP: { es: 'Libra esterlina', en: 'British pound' },
};
const categoryColors: Record<string, string> = {
  Vivienda: '#ef927d', Alimentación: '#e6b95f', Transporte: '#75a8a0',
  Bienestar: '#bb91a8', Ocio: '#d5824f', Ahorro: '#2c8b83', Otros: '#a39c88',
};
const categoryLabels: Record<string, Record<LanguageCode, string>> = {
  Vivienda: { es: 'Vivienda', en: 'Housing' },
  Alimentación: { es: 'Alimentación', en: 'Food' },
  Transporte: { es: 'Transporte', en: 'Transport' },
  Bienestar: { es: 'Bienestar', en: 'Wellness' },
  Ocio: { es: 'Ocio', en: 'Leisure' },
  Ahorro: { es: 'Ahorro', en: 'Savings' },
  Otros: { es: 'Otros', en: 'Other' },
};

const translations = {
  es: {
    brandSubtitle: 'finanzas', space: 'Tu espacio', reminderTitle: 'Un pequeño recordatorio',
    reminderBody: 'Mirar tus números también es una forma de cuidarte.', resetData: 'Restablecer datos de ejemplo',
    resetDataMobile: 'Restablecer ejemplo', openMenu: 'Abrir menú', monthPrompt: 'Un vistazo amable a tu dinero',
    greeting: 'Hola, Clara', walletCalm: 'Tu bolsillo, en calma', currency: 'Moneda',
    selectCurrency: 'Seleccionar moneda', language: 'Idioma', selectLanguage: 'Seleccionar idioma',
    spanish: 'Español', english: 'Inglés', navSummary: 'Resumen', navMovements: 'Movimientos',
    navBudget: 'Presupuesto', navAnalysis: 'Análisis', summaryEyebrow: 'Resumen mensual',
    summaryTitle: 'Tu dinero, más claro.', summaryDescription: 'Una pausa breve para saber dónde estás y decidir el siguiente paso con tranquilidad.',
    addMovement: 'Añadir movimiento', income: 'Ingresos', incomeNote: 'Lo que ha entrado este mes',
    expenses: 'Gastos', expense: 'Gasto', expenseNote: 'Lo que ha salido este mes', available: 'Disponible',
    availablePositive: 'Vas en una buena dirección', availableNegative: 'Conviene revisar el ritmo',
    healthLabel: 'Salud financiera', healthStable: 'Este mes se siente estable', healthMoving: 'Este mes se siente en movimiento',
    healthPositive: 'Tu margen está respirando.', healthNeedsAttention: 'Tu margen necesita atención.',
    healthSavings: 'Tu ahorro disponible representa {health}% de lo que ingresó. Cada pequeño ajuste suma.',
    spendingVsBudget: 'Gasto frente a presupuesto', budget: 'Presupuesto', budgetHeadline: 'Gastar con intención se nota.',
    budgetUsed: 'Has usado {spent} de {budget} planificados.', seeDetail: 'Ver detalle',
    recentActivity: 'Actividad reciente', lastMovements: 'Tus últimos movimientos', seeAll: 'Ver todos',
    noMovementsTitle: 'Todavía no hay movimientos', noMovementsDescription: 'Añade tu primer ingreso o gasto para empezar a verlo todo más claro.',
    activityEyebrow: 'Tu actividad', movementsTitle: 'Movimientos',
    movementsDescription: 'Registra lo que entra y sale. Verlo escrito hace que tus decisiones pesen menos.',
    newMovement: 'Nuevo movimiento', all: 'Todos', movement: 'movimiento', movements: 'movimientos',
    noMovementsHereTitle: 'Nada por aquí todavía', noMovementsHereDescription: 'Cuando apuntes un ingreso o un gasto, aparecerá en este espacio.',
    incomesRegistered: 'Ingresos registrados', expensesRegistered: 'Gastos registrados',
    planEyebrow: 'Plan del mes', budgetTitle: 'Presupuesto',
    budgetDescription: 'Ponle un destino a cada cantidad y deja que el progreso te acompañe, no que te persiga.',
    addCategory: 'Añadir categoría', planned: 'Planificado', spent: 'Gastado', remaining: 'Queda por decidir',
    overBudget: 'Te has pasado', noExpensesYet: 'Aún sin gastos', usedPercent: '{percent}% utilizado',
    availableAmount: 'disponible', startBudgetTitle: 'Tu presupuesto empieza aquí',
    startBudgetDescription: 'Crea categorías para darle una intención concreta a tus gastos del mes.',
    createBudget: 'Crear presupuesto',
    readingEyebrow: 'Lectura del mes', analysis: 'Análisis',
    analysisDescription: 'Entiende en qué se va tu dinero y cuánto margen te queda frente a lo que planeaste.',
    exportExcel: 'Exportar a Excel', totalSpent: 'Total gastado', categoriesWithExpenses: 'categorías con egresos',
    budgetSum: 'Suma de tus categorías', availableMargin: 'Margen disponible', stillDecide: 'Aún puedes decidir',
    planExceeded: 'Has superado el plan', distribution: 'Distribución', expensesQuestion: '¿En qué se van tus gastos?',
    noExpensesTitle: 'Aún no hay gastos', noExpensesDescription: 'Registra un egreso para ver cómo se distribuye tu dinero.',
    addMovementFromTab: 'Añade un movimiento desde la pestaña Movimientos', comparison: 'Comparación',
    planReality: 'Plan frente a realidad', startPlanTitle: 'Tu plan empieza aquí',
    startPlanDescription: 'Crea un presupuesto por categoría para comparar lo que planeas con lo que gastas.',
    addBudgetFromTab: 'Añade un presupuesto desde la pestaña Presupuesto', categoryDetail: 'Detalle por categoría',
    margins: 'Tus márgenes', highestSpend: 'Mayor gasto', category: 'Categoría', margin: 'Margen',
    status: 'Estado', withinPlan: 'Dentro del plan', exceeded: 'Excedido',
    noBudgetCategoriesTitle: 'Sin categorías presupuestadas',
    noBudgetCategoriesDescription: 'Crea al menos una categoría para ver sus márgenes.',
    goBudget: 'Ve a Presupuesto para empezar',
    excelNote: 'El archivo Excel incluirá las hojas de resumen, movimientos, presupuestos y gastos por categoría.',
    editMovement: 'Editar movimiento', movementModalDescription: 'Anota el contexto; te ayudará a entender tus hábitos.',
    description: 'Descripción', descriptionPlaceholder: 'Ej. Compra semanal', amountIn: 'Importe en',
    date: 'Fecha', formError: 'Completa todos los campos con un importe mayor que 0.', saveMovement: 'Guardar movimiento',
    editBudget: 'Editar presupuesto', newCategory: 'Nueva categoría',
    budgetModalDescription: 'Define un límite que te ayude a elegir, no a castigarte.', monthlyBudget: 'Presupuesto mensual en',
    budgetError: 'Elige una categoría e indica un importe mayor que 0.', saveBudget: 'Guardar presupuesto',
    close: 'Cerrar', edit: 'Editar', delete: 'Eliminar', notFound: 'Esta página no existe',
    backToSummary: 'Volver al resumen', deleteMovementConfirm: '¿Eliminar este movimiento?',
    deleteBudgetConfirm: '¿Eliminar este presupuesto?', resetConfirm: '¿Quieres volver a cargar los datos de ejemplo? Tus cambios actuales se reemplazarán.',
    excelSummary: 'Resumen', excelMovements: 'Movimientos', excelBudgets: 'Presupuestos',
    excelCategories: 'Gastos por categoría', excelCurrency: 'Moneda', excelValue: 'Valor', excelDate: 'Fecha', excelIncome: 'Ingresos',
    excelExpenses: 'Gastos', excelBalance: 'Saldo disponible', excelPlanned: 'Presupuesto planificado',
    excelMargin: 'Margen frente al presupuesto', excelType: 'Tipo', excelDescription: 'Descripción',
    excelCategory: 'Categoría', excelAmount: 'Importe', excelSpent: 'Gastado', excelStatus: 'Estado',
    excelOver: 'Excedido', excelWithin: 'Dentro del presupuesto',
  },
  en: {
    brandSubtitle: 'finance', space: 'Your space', reminderTitle: 'A gentle reminder',
    reminderBody: 'Looking at your numbers is also a way to take care of yourself.', resetData: 'Reset sample data',
    resetDataMobile: 'Reset sample', openMenu: 'Open menu', monthPrompt: 'A kind look at your money',
    greeting: 'Hello, Clara', walletCalm: 'Your wallet, at ease', currency: 'Currency',
    selectCurrency: 'Select currency', language: 'Language', selectLanguage: 'Select language',
    spanish: 'Spanish', english: 'English', navSummary: 'Summary', navMovements: 'Transactions',
    navBudget: 'Budget', navAnalysis: 'Analysis', summaryEyebrow: 'Monthly summary',
    summaryTitle: 'Your money, made clearer.', summaryDescription: 'A short pause to see where you stand and choose the next step with confidence.',
    addMovement: 'Add transaction', income: 'Income', incomeNote: 'What came in this month',
    expenses: 'Expenses', expense: 'Expense', expenseNote: 'What went out this month', available: 'Available',
    availablePositive: 'You are heading in a good direction', availableNegative: 'It may be time to review the pace',
    healthLabel: 'Financial health', healthStable: 'This month feels steady', healthMoving: 'This month is in motion',
    healthPositive: 'Your margin has room to breathe.', healthNeedsAttention: 'Your margin needs attention.',
    healthSavings: 'Your available savings represent {health}% of what came in. Every small adjustment adds up.',
    spendingVsBudget: 'Spending vs. budget', budget: 'Budget', budgetHeadline: 'Intentional spending makes a difference.',
    budgetUsed: 'You have used {spent} of {budget} planned.', seeDetail: 'See details',
    recentActivity: 'Recent activity', lastMovements: 'Your latest transactions', seeAll: 'See all',
    noMovementsTitle: 'No transactions yet', noMovementsDescription: 'Add your first income or expense to start seeing everything clearly.',
    activityEyebrow: 'Your activity', movementsTitle: 'Transactions',
    movementsDescription: 'Record what comes in and goes out. Seeing it written down makes decisions feel lighter.',
    newMovement: 'New transaction', all: 'All', movement: 'transaction', movements: 'transactions',
    noMovementsHereTitle: 'Nothing here yet', noMovementsHereDescription: 'When you record an income or expense, it will appear here.',
    incomesRegistered: 'Recorded income', expensesRegistered: 'Recorded expenses',
    planEyebrow: 'Monthly plan', budgetTitle: 'Budget',
    budgetDescription: 'Give every amount a purpose and let progress guide you, not chase you.',
    addCategory: 'Add category', planned: 'Planned', spent: 'Spent', remaining: 'Still to decide',
    overBudget: 'Over budget', noExpensesYet: 'No expenses yet', usedPercent: '{percent}% used',
    availableAmount: 'available', startBudgetTitle: 'Your budget starts here',
    startBudgetDescription: 'Create categories to give your monthly spending a clear purpose.',
    createBudget: 'Create budget',
    readingEyebrow: 'Monthly view', analysis: 'Analysis',
    analysisDescription: 'Understand where your money goes and how much room remains against your plan.',
    exportExcel: 'Export to Excel', totalSpent: 'Total spent', categoriesWithExpenses: 'categories with expenses',
    budgetSum: 'Sum of your categories', availableMargin: 'Available margin', stillDecide: 'You can still decide',
    planExceeded: 'You have exceeded the plan', distribution: 'Distribution', expensesQuestion: 'Where are your expenses going?',
    noExpensesTitle: 'No expenses yet', noExpensesDescription: 'Record an expense to see how your money is distributed.',
    addMovementFromTab: 'Add a transaction from the Transactions tab', comparison: 'Comparison',
    planReality: 'Plan vs. reality', startPlanTitle: 'Your plan starts here',
    startPlanDescription: 'Create a budget by category to compare what you planned with what you spend.',
    addBudgetFromTab: 'Add a budget from the Budget tab', categoryDetail: 'Category details',
    margins: 'Your margins', highestSpend: 'Highest spend', category: 'Category', margin: 'Margin',
    status: 'Status', withinPlan: 'Within plan', exceeded: 'Over budget',
    noBudgetCategoriesTitle: 'No budget categories',
    noBudgetCategoriesDescription: 'Create at least one category to see its margins.',
    goBudget: 'Go to Budget to get started',
    excelNote: 'The Excel file will include summary, transactions, budgets, and expenses by category.',
    editMovement: 'Edit transaction', movementModalDescription: 'Add context to help you understand your habits.',
    description: 'Description', descriptionPlaceholder: 'E.g. Weekly groceries', amountIn: 'Amount in',
    date: 'Date', formError: 'Complete all fields with an amount greater than 0.', saveMovement: 'Save transaction',
    editBudget: 'Edit budget', newCategory: 'New category',
    budgetModalDescription: 'Set a limit that helps you choose, not punish you.', monthlyBudget: 'Monthly budget in',
    budgetError: 'Choose a category and enter an amount greater than 0.', saveBudget: 'Save budget',
    close: 'Close', edit: 'Edit', delete: 'Delete', notFound: 'This page does not exist',
    backToSummary: 'Back to summary', deleteMovementConfirm: 'Delete this transaction?',
    deleteBudgetConfirm: 'Delete this budget?', resetConfirm: 'Do you want to reload the sample data? Your current changes will be replaced.',
    excelSummary: 'Summary', excelMovements: 'Transactions', excelBudgets: 'Budgets',
    excelCategories: 'Expenses by category', excelCurrency: 'Currency', excelValue: 'Value', excelDate: 'Date', excelIncome: 'Income',
    excelExpenses: 'Expenses', excelBalance: 'Available balance', excelPlanned: 'Planned budget',
    excelMargin: 'Margin vs. budget', excelType: 'Type', excelDescription: 'Description',
    excelCategory: 'Category', excelAmount: 'Amount', excelSpent: 'Spent', excelStatus: 'Status',
    excelOver: 'Over budget', excelWithin: 'Within budget',
  },
} as const;

type TranslationKey = keyof typeof translations.es;
const LanguageContext = createContext<{ languageCode: LanguageCode; setLanguageCode: (value: LanguageCode) => void }>({ languageCode: 'es', setLanguageCode: () => undefined });
function useI18n() {
  const { languageCode, setLanguageCode } = useContext(LanguageContext);
  return { languageCode, setLanguageCode, t: (key: TranslationKey) => translations[languageCode][key] };
}
function text(languageCode: LanguageCode, key: TranslationKey) { return translations[languageCode][key]; }
function categoryLabel(category: string, languageCode: LanguageCode) { return categoryLabels[category]?.[languageCode] || category; }

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

function loadData(): FinanceData {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored) as FinanceData;
  } catch { /* use demo data when storage is unavailable */ }
  return demoData;
}

function loadCurrency(): CurrencyCode {
  try {
    const stored = localStorage.getItem(CURRENCY_STORAGE_KEY);
    if (currencyOptions.some((item) => item.code === stored)) return stored as CurrencyCode;
  } catch { /* use the default currency when storage is unavailable */ }
  return 'COP';
}

function loadLanguage(): LanguageCode {
  try {
    const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (stored === 'es' || stored === 'en') return stored;
  } catch { /* use Spanish when storage is unavailable */ }
  return 'es';
}

function formatMoney(value: number, currencyCode: CurrencyCode, languageCode: LanguageCode = 'es') {
  const noDecimals = currencyCode === 'COP';
  return new Intl.NumberFormat(languageCode === 'en' ? 'en-US' : 'es-CO', {
    style: 'currency',
    currency: currencyCode,
    minimumFractionDigits: noDecimals ? 0 : 2,
    maximumFractionDigits: noDecimals ? 0 : 2,
  }).format(value);
}
function formatDate(value: string, languageCode: LanguageCode = 'es') {
  return new Intl.DateTimeFormat(languageCode === 'en' ? 'en-US' : 'es-ES', { day: 'numeric', month: 'short' }).format(new Date(`${value}T12:00:00`));
}
function today() { return new Date().toISOString().slice(0, 10); }
function monthLabel(languageCode: LanguageCode) {
  return new Intl.DateTimeFormat(languageCode === 'en' ? 'en-US' : 'es-ES', { month: 'long', year: 'numeric' }).format(new Date()).replace(/^./, (letter) => letter.toUpperCase());
}

function exportToExcel(data: FinanceData, currencyCode: CurrencyCode, languageCode: LanguageCode) {
  const income = data.movements.filter((item) => item.type === 'income').reduce((sum, item) => sum + item.amount, 0);
  const expenses = data.movements.filter((item) => item.type === 'expense').reduce((sum, item) => sum + item.amount, 0);
  const budgetTotal = data.budgets.reduce((sum, item) => sum + item.amount, 0);
  const spentByCategory = data.movements.filter((item) => item.type === 'expense').reduce<Record<string, number>>((acc, item) => ({ ...acc, [item.category]: (acc[item.category] || 0) + item.amount }), {});

  const summary = [
    { [languageCode === 'en' ? 'Metric' : 'Indicador']: text(languageCode, 'excelCurrency'), [text(languageCode, 'excelValue')]: currencyCode },
    { [languageCode === 'en' ? 'Metric' : 'Indicador']: text(languageCode, 'excelIncome'), [text(languageCode, 'excelValue')]: income },
    { [languageCode === 'en' ? 'Metric' : 'Indicador']: text(languageCode, 'excelExpenses'), [text(languageCode, 'excelValue')]: expenses },
    { [languageCode === 'en' ? 'Metric' : 'Indicador']: text(languageCode, 'excelBalance'), [text(languageCode, 'excelValue')]: income - expenses },
    { [languageCode === 'en' ? 'Metric' : 'Indicador']: text(languageCode, 'excelPlanned'), [text(languageCode, 'excelValue')]: budgetTotal },
    { [languageCode === 'en' ? 'Metric' : 'Indicador']: text(languageCode, 'excelMargin'), [text(languageCode, 'excelValue')]: budgetTotal - expenses },
  ];
  const movements = data.movements.map((item) => ({
    [text(languageCode, 'excelDate')]: item.date,
    [text(languageCode, 'excelType')]: item.type === 'income' ? text(languageCode, 'excelIncome') : languageCode === 'en' ? 'Expense' : 'Egreso',
    [text(languageCode, 'excelDescription')]: item.description,
    [text(languageCode, 'excelCategory')]: categoryLabel(item.category, languageCode),
    [text(languageCode, 'excelAmount')]: item.amount,
    [text(languageCode, 'excelCurrency')]: currencyCode,
  }));
  const budgets = data.budgets.map((item) => {
    const spent = spentByCategory[item.category] || 0;
    return {
      [text(languageCode, 'excelCategory')]: categoryLabel(item.category, languageCode),
      [text(languageCode, 'excelPlanned')]: item.amount,
      [text(languageCode, 'excelSpent')]: spent,
      [text(languageCode, 'excelMargin')]: item.amount - spent,
      [text(languageCode, 'excelStatus')]: spent > item.amount ? text(languageCode, 'excelOver') : text(languageCode, 'excelWithin'),
      [text(languageCode, 'excelCurrency')]: currencyCode,
    };
  });
  const categories = Object.entries(spentByCategory).map(([category, amount]) => ({
    [text(languageCode, 'excelCategory')]: categoryLabel(category, languageCode),
    [text(languageCode, 'excelSpent')]: amount,
    [text(languageCode, 'excelCurrency')]: currencyCode,
  }));

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(summary), text(languageCode, 'excelSummary'));
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(movements), text(languageCode, 'excelMovements'));
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(budgets), text(languageCode, 'excelBudgets'));
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(categories), text(languageCode, 'excelCategories'));
  XLSX.writeFile(workbook, `${languageCode === 'en' ? 'financial-control' : 'control-financiero'}-${today()}.xlsx`);
}

function App() {
  const [data, setData] = useState<FinanceData>(loadData);
  const [currencyCode, setCurrencyCode] = useState<CurrencyCode>(loadCurrency);
  const [languageCode, setLanguageCode] = useState<LanguageCode>(loadLanguage);
  const [menuOpen, setMenuOpen] = useState(false);
  const [movementEditor, setMovementEditor] = useState<Movement | 'new' | null>(null);
  const [budgetEditor, setBudgetEditor] = useState<Budget | 'new' | null>(null);

  useEffect(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); }, [data]);
  useEffect(() => { localStorage.setItem(CURRENCY_STORAGE_KEY, currencyCode); }, [currencyCode]);
  useEffect(() => { localStorage.setItem(LANGUAGE_STORAGE_KEY, languageCode); }, [languageCode]);

  const updateData = (next: FinanceData) => setData(next);
  const removeMovement = (id: string) => updateData({ ...data, movements: data.movements.filter((item) => item.id !== id) });
  const removeBudget = (id: string) => updateData({ ...data, budgets: data.budgets.filter((item) => item.id !== id) });
  const resetData = () => {
    if (window.confirm(text(languageCode, 'resetConfirm'))) {
      updateData({ movements: demoData.movements.map((item) => ({ ...item })), budgets: demoData.budgets.map((item) => ({ ...item })) });
    }
  };

  return <LanguageContext.Provider value={{ languageCode, setLanguageCode }}>
    <div className="app-shell">
      <div className="flex min-h-[100dvh]">
        <aside className="sidebar hidden w-[250px] shrink-0 flex-col px-5 py-7 md:flex">
          <Brand />
          <div className="mt-12 flex-1">
            <p className="mb-4 px-3 text-[10px] font-bold uppercase tracking-[.18em] opacity-55">{text(languageCode, 'space')}</p>
            <Navigation />
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[.06] p-4">
            <div className="mb-3 flex items-center gap-2 text-xs font-semibold text-[#f3d889]"><HeartPulse size={15} /> {text(languageCode, 'reminderTitle')}</div>
            <p className="text-sm leading-relaxed text-white/75">{text(languageCode, 'reminderBody')}</p>
          </div>
          <button type="button" onClick={resetData} data-testid="button-reset-data" className="mt-5 flex items-center gap-2 px-3 text-xs font-semibold text-white/55 transition-colors hover:text-white">
            <RotateCcw size={14} /> {text(languageCode, 'resetData')}
          </button>
        </aside>
        <div className="min-w-0 flex-1">
          <header className="sticky top-0 z-20 flex h-[74px] items-center justify-between border-b border-[#ded7c8] bg-[#f5f1e8]/90 px-5 backdrop-blur-md md:px-10">
            <button type="button" aria-label={text(languageCode, 'openMenu')} onClick={() => setMenuOpen(!menuOpen)} data-testid="button-open-menu" className="rounded-full p-2 text-[#0b6e69] md:hidden"><Menu size={22} /></button>
            <div className="hidden md:block">
              <p className="text-xs font-semibold uppercase tracking-[.16em] text-[#7b8279]">{monthLabel(languageCode)}</p>
              <p className="serif mt-0.5 text-[17px] text-[#183f3e]">{text(languageCode, 'monthPrompt')}</p>
            </div>
            <div className="ml-auto flex items-center gap-3">
              <LanguagePicker value={languageCode} onChange={setLanguageCode} />
              <CurrencyPicker value={currencyCode} onChange={setCurrencyCode} />
              <div className="hidden text-right sm:block"><p className="text-sm font-bold text-[#183f3e]">{text(languageCode, 'greeting')}</p><p className="text-xs text-[#7b8279]">{text(languageCode, 'walletCalm')}</p></div>
              <div className="grid h-10 w-10 place-items-center rounded-full bg-[#e9bd63] font-serif text-lg font-bold text-[#174b49]">C</div>
            </div>
          </header>
          {menuOpen && <div className="fixed inset-0 z-30 bg-[#153f3d]/25 md:hidden" onClick={() => setMenuOpen(false)}><div className="sidebar h-full w-[270px] p-6 shadow-2xl" onClick={(event) => event.stopPropagation()}><Brand /><div className="mt-10"><Navigation onNavigate={() => setMenuOpen(false)} /></div><button type="button" onClick={resetData} data-testid="button-reset-data-mobile" className="mt-10 flex items-center gap-2 text-xs font-semibold text-white/60"><RotateCcw size={14} /> {text(languageCode, 'resetDataMobile')}</button></div></div>}
          <main className="mobile-safe page-enter mx-auto max-w-[1440px] px-5 py-7 md:px-10 md:py-10">
            <Switch>
               <Route path="/" component={() => <DashboardPage data={data} currencyCode={currencyCode} onNew={() => setMovementEditor('new')} />} />
               <Route path="/movimientos" component={() => <MovementsPage data={data} currencyCode={currencyCode} onNew={() => setMovementEditor('new')} onEdit={setMovementEditor} onDelete={removeMovement} />} />
               <Route path="/presupuesto" component={() => <BudgetPage data={data} currencyCode={currencyCode} onNew={() => setBudgetEditor('new')} onEdit={setBudgetEditor} onDelete={removeBudget} />} />
                <Route path="/analisis" component={() => <AnalysisPage data={data} currencyCode={currencyCode} onExport={() => exportToExcel(data, currencyCode, languageCode)} />} />
              <Route component={NotFound} />
            </Switch>
          </main>
        </div>
      </div>
      <div className="fixed bottom-0 left-0 right-0 z-20 border-t border-[#ded7c8] bg-[#f5f1e8]/95 px-3 py-2 backdrop-blur-md md:hidden"><Navigation mobile /></div>
     {movementEditor && <MovementModal value={movementEditor === 'new' ? null : movementEditor} currencyCode={currencyCode} onClose={() => setMovementEditor(null)} onSave={(movement) => { updateData({ ...data, movements: movementEditor === 'new' ? [movement, ...data.movements] : data.movements.map((item) => item.id === movement.id ? movement : item) }); setMovementEditor(null); }} />}
       {budgetEditor && <BudgetModal value={budgetEditor === 'new' ? null : budgetEditor} currencyCode={currencyCode} existing={data.budgets} onClose={() => setBudgetEditor(null)} onSave={(budget) => { updateData({ ...data, budgets: budgetEditor === 'new' ? [...data.budgets, budget] : data.budgets.map((item) => item.id === budget.id ? budget : item) }); setBudgetEditor(null); }} />}
     </div>
  </LanguageContext.Provider>;
}

function Brand() {
  const { t } = useI18n();
  return <Link href="/" className="flex items-center gap-3" data-testid="link-brand"><div className="grid h-10 w-10 place-items-center rounded-[13px] bg-[#f3d889] text-[#0b6e69]"><Wallet size={22} strokeWidth={2.5} /></div><div><p className="serif text-xl font-semibold leading-none tracking-tight">Claro</p><p className="mt-1 text-[10px] font-bold uppercase tracking-[.22em] text-white/55">{t('brandSubtitle')}</p></div></Link>;
}

function CurrencyPicker({ value, onChange }: { value: CurrencyCode; onChange: (value: CurrencyCode) => void }) {
  const { languageCode, t } = useI18n();
  return <label className="flex items-center gap-2 rounded-xl border border-[#ded7c8] bg-[#fbf8f1] px-2.5 py-1.5 text-xs font-bold text-[#183f3e]" title={t('selectCurrency')}>
    <span className="hidden text-[#7b8279] sm:inline">{t('currency')}</span>
    <select aria-label={t('selectCurrency')} value={value} onChange={(event) => onChange(event.target.value as CurrencyCode)} data-testid="select-currency" className="cursor-pointer bg-transparent pr-1 text-xs font-bold text-[#0b6e69] outline-none">
      {currencyOptions.map((item) => <option key={item.code} value={item.code}>{item.code} · {currencyLabels[item.code][languageCode]}</option>)}
    </select>
  </label>;
}

function LanguagePicker({ value, onChange }: { value: LanguageCode; onChange: (value: LanguageCode) => void }) {
  const { t } = useI18n();
  return <label className="flex items-center gap-2 rounded-xl border border-[#ded7c8] bg-[#fbf8f1] px-2.5 py-1.5 text-xs font-bold text-[#183f3e]" title={t('selectLanguage')}>
    <span className="hidden text-[#7b8279] sm:inline">{t('language')}</span>
    <select aria-label={t('selectLanguage')} value={value} onChange={(event) => onChange(event.target.value as LanguageCode)} data-testid="select-language" className="cursor-pointer bg-transparent pr-1 text-xs font-bold text-[#0b6e69] outline-none">
      <option value="es">ES · {t('spanish')}</option>
      <option value="en">EN · {t('english')}</option>
    </select>
  </label>;
}

function Navigation({ mobile = false, onNavigate }: { mobile?: boolean; onNavigate?: () => void }) {
  const [location] = useLocation();
  const { t } = useI18n();
  const links = [
    { href: '/', label: t('navSummary'), testId: 'summary', icon: LayoutDashboard },
    { href: '/movimientos', label: t('navMovements'), testId: 'movements', icon: BarChart3 },
    { href: '/presupuesto', label: t('navBudget'), testId: 'budget', icon: Target },
    { href: '/analisis', label: t('navAnalysis'), testId: 'analysis', icon: PieChartIcon },
  ];
  return <nav className={mobile ? 'mx-auto flex max-w-md items-center justify-around' : 'space-y-2'}>{links.map(({ href, label, testId, icon: Icon }) => {
    const active = location === href;
    return <Link key={href} href={href} onClick={onNavigate} data-testid={`link-nav-${testId}`} className={`nav-link flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold ${mobile ? `flex-col gap-1 px-3 py-1 text-[10px] ${active ? 'text-[#0b6e69]' : 'text-[#7b8279]'}` : active ? 'bg-white/12 text-white' : 'text-white/65 hover:bg-white/8 hover:text-white'}`}><Icon size={mobile ? 19 : 18} strokeWidth={active ? 2.5 : 2} /><span>{label}</span>{!mobile && active && <ChevronRight className="ml-auto opacity-60" size={15} />}</Link>;
  })}</nav>;
}

function PageTitle({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: ReactNode }) {
  return <div className="mb-8 flex flex-col justify-between gap-5 md:flex-row md:items-end"><div><p className="mb-2 text-[11px] font-bold uppercase tracking-[.2em] text-[#0b6e69]">{eyebrow}</p><h1 className="serif text-[clamp(2.2rem,5vw,3.6rem)] leading-[.96] tracking-[-.04em] text-[#183f3e]">{title}</h1><p className="mt-3 max-w-xl text-[15px] leading-relaxed text-[#69756e]">{description}</p></div>{action}</div>;
}

function SummaryCard({ label, value, note, type }: { label: string; value: string; note: string; type: 'income' | 'expense' | 'balance' }) {
  const positive = type !== 'expense';
  return <div className={`lift-on-hover card-shadow rounded-[22px] border p-5 ${type === 'balance' ? 'border-[#0b6e69] bg-[#0b6e69] text-[#f8f1e5]' : 'border-[#e2dbcd] bg-[#fbf8f1]'}`} data-testid={`card-summary-${type}`}><div className="flex items-start justify-between"><span className={`text-xs font-bold uppercase tracking-[.12em] ${type === 'balance' ? 'text-white/65' : 'text-[#7b8279]'}`}>{label}</span><span className={`grid h-8 w-8 place-items-center rounded-full ${type === 'income' ? 'bg-[#d5e5d6] text-[#39715f]' : type === 'expense' ? 'bg-[#f7d8ce] text-[#bd5f4a]' : 'bg-[#f3d889] text-[#0b6e69]'}`}>{type === 'income' ? <ArrowDownLeft size={16} /> : type === 'expense' ? <ArrowUpRight size={16} /> : <CircleDollarSign size={16} />}</span></div><p className={`mt-5 font-serif text-3xl tracking-tight ${type === 'balance' ? 'text-[#f8f1e5]' : 'text-[#183f3e]'}`}>{value}</p><p className={`mt-1 text-xs ${type === 'balance' ? 'text-white/65' : positive ? 'text-[#578073]' : 'text-[#a66b5d]'}`}>{note}</p></div>;
}

function DashboardPage({ data, currencyCode, onNew }: { data: FinanceData; currencyCode: CurrencyCode; onNew: () => void }) {
  const { languageCode, t } = useI18n();
  const income = data.movements.filter((item) => item.type === 'income').reduce((sum, item) => sum + item.amount, 0);
  const expenses = data.movements.filter((item) => item.type === 'expense').reduce((sum, item) => sum + item.amount, 0);
  const balance = income - expenses;
  const spentByCategory = useMemo(() => data.movements.filter((item) => item.type === 'expense').reduce<Record<string, number>>((acc, item) => ({ ...acc, [item.category]: (acc[item.category] || 0) + item.amount }), {}), [data.movements]);
  const budgetTotal = data.budgets.reduce((sum, item) => sum + item.amount, 0);
  const health = income === 0 ? 0 : Math.max(0, Math.min(100, Math.round((balance / income) * 100)));
  const recent = [...data.movements].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);
  return <div>
    <PageTitle eyebrow={t('summaryEyebrow')} title={t('summaryTitle')} description={t('summaryDescription')} action={<button type="button" onClick={onNew} data-testid="button-add-movement-dashboard" className="flex items-center justify-center gap-2 rounded-xl bg-[#0b6e69] px-5 py-3 text-sm font-bold text-[#f8f1e5] shadow-sm transition-transform hover:-translate-y-0.5"><Plus size={17} /> {t('addMovement')}</button>} />
     <div className="grid gap-4 sm:grid-cols-3"><SummaryCard label={t('income')} value={formatMoney(income, currencyCode, languageCode)} note={t('incomeNote')} type="income" /><SummaryCard label={t('expenses')} value={formatMoney(expenses, currencyCode, languageCode)} note={t('expenseNote')} type="expense" /><SummaryCard label={t('available')} value={formatMoney(balance, currencyCode, languageCode)} note={balance >= 0 ? t('availablePositive') : t('availableNegative')} type="balance" /></div>
    <div className="mt-5 grid gap-5 lg:grid-cols-[1.15fr_.85fr]">
      <section className="card-shadow rounded-[26px] border border-[#e2dbcd] bg-[#fbf8f1] p-6 md:p-7" data-testid="section-financial-health">
         <div className="flex items-start justify-between"><div><p className="text-xs font-bold uppercase tracking-[.16em] text-[#7b8279]">{t('healthLabel')}</p><h2 className="serif mt-2 text-2xl text-[#183f3e]">{health >= 35 ? t('healthStable') : t('healthMoving')}</h2></div><div className="grid h-11 w-11 place-items-center rounded-2xl bg-[#d5e5d6] text-[#39715f]"><HeartPulse size={22} /></div></div>
         <div className="mt-7 flex items-center gap-6"><div className="relative grid h-28 w-28 shrink-0 place-items-center rounded-full" style={{ background: `conic-gradient(#2c8b83 ${health}%, #e6e0d3 0)` }}><div className="grid h-[88px] w-[88px] place-items-center rounded-full bg-[#fbf8f1]"><span className="font-serif text-2xl text-[#183f3e]">{health}<small className="text-sm">%</small></span></div></div><div><p className="text-sm font-bold text-[#183f3e]">{health >= 35 ? t('healthPositive') : t('healthNeedsAttention')}</p><p className="mt-1 text-sm leading-relaxed text-[#69756e]">{t('healthSavings').replace('{health}', String(health))}</p></div></div>
         <div className="mt-8 border-t border-[#e6dfd2] pt-5"><div className="flex justify-between text-xs text-[#7b8279]"><span>{t('spendingVsBudget')}</span><span className="font-bold text-[#183f3e]">{budgetTotal ? Math.round((expenses / budgetTotal) * 100) : 0}%</span></div><div className="progress-track mt-3"><div className="progress-fill bg-[#e9bd63]" style={{ width: `${Math.min(100, budgetTotal ? (expenses / budgetTotal) * 100 : 0)}%` }} /></div></div>
      </section>
      <section className="dot-grid overflow-hidden rounded-[26px] border border-[#e9d8a9] bg-[#f3d889] p-6 md:p-7" data-testid="section-budget-glance">
         <div className="flex items-center justify-between"><p className="text-xs font-bold uppercase tracking-[.16em] text-[#5f674e]">{t('budget')}</p><Target size={20} className="text-[#0b6e69]" /></div><h2 className="serif mt-3 max-w-xs text-3xl leading-tight text-[#183f3e]">{t('budgetHeadline')}</h2><p className="mt-3 text-sm leading-relaxed text-[#536658]">{t('budgetUsed').replace('{spent}', formatMoney(expenses, currencyCode, languageCode)).replace('{budget}', formatMoney(budgetTotal, currencyCode, languageCode))}</p>
         <Link href="/presupuesto" data-testid="link-see-budget" className="mt-8 inline-flex items-center gap-2 text-sm font-bold text-[#0b6e69]">{t('seeDetail')} <ChevronRight size={16} /></Link>
      </section>
    </div>
    <section className="mt-5 rounded-[26px] border border-[#e2dbcd] bg-[#fbf8f1] p-6 md:p-7" data-testid="section-recent-movements">
       <div className="mb-5 flex items-center justify-between"><div><p className="text-xs font-bold uppercase tracking-[.16em] text-[#7b8279]">{t('recentActivity')}</p><h2 className="serif mt-1 text-2xl text-[#183f3e]">{t('lastMovements')}</h2></div><Link href="/movimientos" data-testid="link-see-movements" className="text-sm font-bold text-[#0b6e69]">{t('seeAll')}</Link></div>
       {recent.length ? <div className="divide-y divide-[#e9e2d6]">{recent.map((item) => <MovementRow key={item.id} movement={item} currencyCode={currencyCode} compact />)}</div> : <EmptyState title={t('noMovementsTitle')} description={t('noMovementsDescription')} action={onNew} actionLabel={t('addMovement')} />}
    </section>
  </div>;
}

function MovementRow({ movement, currencyCode, compact = false, onEdit, onDelete }: { movement: Movement; currencyCode: CurrencyCode; compact?: boolean; onEdit?: () => void; onDelete?: () => void }) {
  const { languageCode, t } = useI18n();
  const income = movement.type === 'income';
  return <div className={`group flex items-center gap-3 py-3 ${compact ? '' : 'px-1'}`} data-testid={`row-movement-${movement.id}`}><div className={`grid h-10 w-10 shrink-0 place-items-center rounded-[13px] ${income ? 'bg-[#d5e5d6] text-[#39715f]' : 'bg-[#f7d8ce] text-[#bd5f4a]'}`}>{income ? <ArrowDownLeft size={18} /> : <ArrowUpRight size={18} />}</div><div className="min-w-0 flex-1"><p className="truncate text-sm font-bold text-[#294846]">{movement.description}</p><p className="mt-0.5 text-xs text-[#8a9188]">{categoryLabel(movement.category, languageCode)} · {formatDate(movement.date, languageCode)}</p></div><p className={`shrink-0 text-sm font-bold ${income ? 'text-[#39715f]' : 'text-[#bd5f4a]'}`}>{income ? '+' : '−'}{formatMoney(movement.amount, currencyCode, languageCode)}</p>{onEdit && <div className="flex gap-1 pl-2 md:invisible md:group-hover:visible"><button type="button" onClick={onEdit} aria-label={`${t('edit')} ${t('movement').toLowerCase()}`} data-testid={`button-edit-movement-${movement.id}`} className="rounded-lg p-2 text-[#7b8279] hover:bg-[#eee7d9] hover:text-[#0b6e69]"><Edit3 size={15} /></button><button type="button" onClick={onDelete} aria-label={`${t('delete')} ${t('movement').toLowerCase()}`} data-testid={`button-delete-movement-${movement.id}`} className="rounded-lg p-2 text-[#7b8279] hover:bg-[#f7d8ce] hover:text-[#bd5f4a]"><Trash2 size={15} /></button></div>}</div>;
}

function MovementsPage({ data, currencyCode, onNew, onEdit, onDelete }: { data: FinanceData; currencyCode: CurrencyCode; onNew: () => void; onEdit: (movement: Movement) => void; onDelete: (id: string) => void }) {
  const { languageCode, t } = useI18n();
  const [filter, setFilter] = useState<'all' | MovementType>('all');
  const sorted = [...data.movements].filter((item) => filter === 'all' || item.type === filter).sort((a, b) => b.date.localeCompare(a.date));
  const askDelete = (id: string) => { if (window.confirm(t('deleteMovementConfirm'))) onDelete(id); };
  return <div><PageTitle eyebrow={t('activityEyebrow')} title={t('movementsTitle')} description={t('movementsDescription')} action={<button type="button" onClick={onNew} data-testid="button-add-movement" className="flex items-center justify-center gap-2 rounded-xl bg-[#0b6e69] px-5 py-3 text-sm font-bold text-[#f8f1e5]"><Plus size={17} /> {t('newMovement')}</button>} />
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3"><div className="flex rounded-xl border border-[#ded7c8] bg-[#fbf8f1] p-1">{(['all', 'income', 'expense'] as const).map((key) => <button type="button" key={key} onClick={() => setFilter(key)} data-testid={`button-filter-${key}`} className={`rounded-lg px-3 py-2 text-xs font-bold transition-colors ${filter === key ? 'bg-[#0b6e69] text-[#f8f1e5]' : 'text-[#7b8279] hover:text-[#183f3e]'}`}>{key === 'all' ? t('all') : key === 'income' ? t('income') : t('expenses')}</button>)}</div><p className="text-xs text-[#8a9188]">{sorted.length} {sorted.length === 1 ? t('movement') : t('movements')}</p></div>
     <section className="rounded-[26px] border border-[#e2dbcd] bg-[#fbf8f1] p-5 md:p-7">{sorted.length ? <div className="divide-y divide-[#e9e2d6]">{sorted.map((item) => <MovementRow key={item.id} movement={item} currencyCode={currencyCode} onEdit={() => onEdit(item)} onDelete={() => askDelete(item.id)} />)}</div> : <EmptyState title={t('noMovementsHereTitle')} description={t('noMovementsHereDescription')} action={onNew} actionLabel={t('addMovement')} />}</section>
     <div className="mt-5 grid gap-4 sm:grid-cols-2"><div className="rounded-[22px] bg-[#d5e5d6] p-5"><p className="text-xs font-bold uppercase tracking-[.14em] text-[#527468]">{t('incomesRegistered')}</p><p className="serif mt-2 text-2xl text-[#183f3e]">{formatMoney(data.movements.filter((item) => item.type === 'income').reduce((sum, item) => sum + item.amount, 0), currencyCode, languageCode)}</p></div><div className="rounded-[22px] bg-[#f7d8ce] p-5"><p className="text-xs font-bold uppercase tracking-[.14em] text-[#9c6558]">{t('expensesRegistered')}</p><p className="serif mt-2 text-2xl text-[#183f3e]">{formatMoney(data.movements.filter((item) => item.type === 'expense').reduce((sum, item) => sum + item.amount, 0), currencyCode, languageCode)}</p></div></div>
  </div>;
}

function BudgetPage({ data, currencyCode, onNew, onEdit, onDelete }: { data: FinanceData; currencyCode: CurrencyCode; onNew: () => void; onEdit: (budget: Budget) => void; onDelete: (id: string) => void }) {
  const { languageCode, t } = useI18n();
  const spent = useMemo(() => data.movements.filter((item) => item.type === 'expense').reduce<Record<string, number>>((acc, item) => ({ ...acc, [item.category]: (acc[item.category] || 0) + item.amount }), {}), [data.movements]);
  const totalBudget = data.budgets.reduce((sum, item) => sum + item.amount, 0);
  const totalSpent = Object.values(spent).reduce((sum, value) => sum + value, 0);
  const askDelete = (id: string) => { if (window.confirm(t('deleteBudgetConfirm'))) onDelete(id); };
   return <div><PageTitle eyebrow={t('planEyebrow')} title={t('budgetTitle')} description={t('budgetDescription')} action={<button type="button" onClick={onNew} data-testid="button-add-budget" className="flex items-center justify-center gap-2 rounded-xl bg-[#0b6e69] px-5 py-3 text-sm font-bold text-[#f8f1e5]"><Plus size={17} /> {t('addCategory')}</button>} />
     <div className="mb-6 grid gap-4 sm:grid-cols-3"><div className="rounded-[22px] border border-[#e2dbcd] bg-[#fbf8f1] p-5"><p className="text-xs font-bold uppercase tracking-[.12em] text-[#7b8279]">{t('planned')}</p><p className="serif mt-2 text-2xl text-[#183f3e]">{formatMoney(totalBudget, currencyCode, languageCode)}</p></div><div className="rounded-[22px] border border-[#e2dbcd] bg-[#fbf8f1] p-5"><p className="text-xs font-bold uppercase tracking-[.12em] text-[#7b8279]">{t('spent')}</p><p className="serif mt-2 text-2xl text-[#183f3e]">{formatMoney(totalSpent, currencyCode, languageCode)}</p></div><div className="rounded-[22px] bg-[#f3d889] p-5"><p className="text-xs font-bold uppercase tracking-[.12em] text-[#5f674e]">{t('remaining')}</p><p className="serif mt-2 text-2xl text-[#183f3e]">{formatMoney(Math.max(0, totalBudget - totalSpent), currencyCode, languageCode)}</p></div></div>
     <section className="grid gap-4 md:grid-cols-2">{data.budgets.length ? data.budgets.map((item) => { const amount = spent[item.category] || 0; const percent = Math.round((amount / item.amount) * 100); const over = percent > 100; return <article key={item.id} className="lift-on-hover rounded-[24px] border border-[#e2dbcd] bg-[#fbf8f1] p-5" data-testid={`card-budget-${item.id}`}><div className="flex items-start justify-between"><div className="flex items-center gap-3"><div className="h-3 w-3 rounded-full" style={{ backgroundColor: categoryColors[item.category] || categoryColors.Otros }} /><div><h2 className="font-bold text-[#294846]">{categoryLabel(item.category, languageCode)}</h2><p className="mt-0.5 text-xs text-[#8a9188]">{formatMoney(amount, currencyCode, languageCode)} {languageCode === 'en' ? 'of' : 'de'} {formatMoney(item.amount, currencyCode, languageCode)}</p></div></div><div className="flex gap-1"><button type="button" onClick={() => onEdit(item)} aria-label={`${t('edit')} ${t('budget').toLowerCase()}`} data-testid={`button-edit-budget-${item.id}`} className="rounded-lg p-2 text-[#7b8279] hover:bg-[#eee7d9] hover:text-[#0b6e69]"><Edit3 size={15} /></button><button type="button" onClick={() => askDelete(item.id)} aria-label={`${t('delete')} ${t('budget').toLowerCase()}`} data-testid={`button-delete-budget-${item.id}`} className="rounded-lg p-2 text-[#7b8279] hover:bg-[#f7d8ce] hover:text-[#bd5f4a]"><Trash2 size={15} /></button></div></div><div className="mt-5 flex items-center justify-between text-xs"><span className={over ? 'font-bold text-[#bd5f4a]' : 'font-semibold text-[#527468]'}>{over ? t('overBudget') : percent === 0 ? t('noExpensesYet') : t('usedPercent').replace('{percent}', String(percent))}</span><span className="text-[#8a9188]">{formatMoney(Math.max(0, item.amount - amount), currencyCode, languageCode)} {t('availableAmount')}</span></div><div className="progress-track mt-2"><div className={`progress-fill ${over ? 'bg-[#bd5f4a]' : 'bg-[#2c8b83]'}`} style={{ width: `${Math.min(100, percent)}%` }} /></div></article>; }) : <div className="md:col-span-2"><EmptyState title={t('startBudgetTitle')} description={t('startBudgetDescription')} action={onNew} actionLabel={t('createBudget')} /></div>}</section>
  </div>;
}

function AnalysisPage({ data, currencyCode, onExport }: { data: FinanceData; currencyCode: CurrencyCode; onExport: () => void }) {
  const { languageCode, t } = useI18n();
  const expensesByCategory = useMemo(() => data.movements
    .filter((item) => item.type === 'expense')
    .reduce<Record<string, number>>((acc, item) => ({ ...acc, [item.category]: (acc[item.category] || 0) + item.amount }), {}), [data.movements]);
  const pieData = Object.entries(expensesByCategory).map(([name, value]) => ({ name: categoryLabel(name, languageCode), value, fill: categoryColors[name] || categoryColors.Otros }));
  const budgetData = data.budgets.map((item) => {
    const spent = expensesByCategory[item.category] || 0;
    return { category: categoryLabel(item.category, languageCode), presupuesto: item.amount, gastado: spent, margen: item.amount - spent };
  });
  const totalExpenses = pieData.reduce((sum, item) => sum + item.value, 0);
  const totalBudget = budgetData.reduce((sum, item) => sum + item.presupuesto, 0);
  const totalMargin = totalBudget - totalExpenses;
  const topCategory = pieData.length ? [...pieData].sort((a, b) => b.value - a.value)[0] : null;

  return <div>
    <PageTitle
      eyebrow={t('readingEyebrow')}
      title={t('analysis')}
      description={t('analysisDescription')}
      action={<button type="button" onClick={onExport} data-testid="button-export-excel" className="flex items-center justify-center gap-2 rounded-xl bg-[#0b6e69] px-5 py-3 text-sm font-bold text-[#f8f1e5] shadow-sm transition-transform hover:-translate-y-0.5"><Download size={17} /> {t('exportExcel')}</button>}
    />

    <div className="mb-5 grid gap-4 sm:grid-cols-3">
      <div className="rounded-[22px] border border-[#e2dbcd] bg-[#fbf8f1] p-5"><p className="text-xs font-bold uppercase tracking-[.12em] text-[#7b8279]">{t('totalSpent')}</p><p className="serif mt-2 text-2xl text-[#183f3e]">{formatMoney(totalExpenses, currencyCode, languageCode)}</p><p className="mt-1 text-xs text-[#8a9188]">{pieData.length} {t('categoriesWithExpenses')}</p></div>
      <div className="rounded-[22px] border border-[#e2dbcd] bg-[#fbf8f1] p-5"><p className="text-xs font-bold uppercase tracking-[.12em] text-[#7b8279]">{t('budget')}</p><p className="serif mt-2 text-2xl text-[#183f3e]">{formatMoney(totalBudget, currencyCode, languageCode)}</p><p className="mt-1 text-xs text-[#8a9188]">{t('budgetSum')}</p></div>
      <div className={`rounded-[22px] p-5 ${totalMargin >= 0 ? 'bg-[#d5e5d6]' : 'bg-[#f7d8ce]'}`}><p className="text-xs font-bold uppercase tracking-[.12em] text-[#527468]">{t('availableMargin')}</p><p className="serif mt-2 text-2xl text-[#183f3e]">{formatMoney(totalMargin, currencyCode, languageCode)}</p><p className="mt-1 text-xs text-[#69756e]">{totalMargin >= 0 ? t('stillDecide') : t('planExceeded')}</p></div>
    </div>

    <div className="grid gap-5 lg:grid-cols-2">
      <section className="rounded-[26px] border border-[#e2dbcd] bg-[#fbf8f1] p-6 md:p-7" data-testid="chart-expenses-by-category">
        <div className="mb-2"><p className="text-xs font-bold uppercase tracking-[.16em] text-[#7b8279]">{t('distribution')}</p><h2 className="serif mt-1 text-2xl text-[#183f3e]">{t('expensesQuestion')}</h2></div>
        {pieData.length ? <div className="h-[310px]"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={pieData} dataKey="value" nameKey="name" innerRadius={72} outerRadius={104} paddingAngle={3} stroke="none">{pieData.map((item) => <Cell key={item.name} fill={item.fill} />)}</Pie><Tooltip formatter={(value) => formatMoney(Number(value), currencyCode, languageCode)} contentStyle={{ borderRadius: 12, border: '1px solid #e2dbcd', background: '#fbf8f1', fontSize: 12 }} /><Legend iconType="circle" wrapperStyle={{ fontSize: 12, color: '#52635c' }} /></PieChart></ResponsiveContainer></div> : <EmptyState title={t('noExpensesTitle')} description={t('noExpensesDescription')} actionHref="/movimientos" actionLabel={t('addMovementFromTab')} />}
      </section>

      <section className="rounded-[26px] border border-[#e2dbcd] bg-[#fbf8f1] p-6 md:p-7" data-testid="chart-budget-comparison">
        <div className="mb-2"><p className="text-xs font-bold uppercase tracking-[.16em] text-[#7b8279]">{t('comparison')}</p><h2 className="serif mt-1 text-2xl text-[#183f3e]">{t('planReality')}</h2></div>
        {budgetData.length ? <div className="h-[310px]"><ResponsiveContainer width="100%" height="100%"><BarChart data={budgetData} margin={{ top: 12, right: 8, left: 8, bottom: 4 }}><CartesianGrid stroke="#e9e2d6" vertical={false} /><XAxis dataKey="category" tick={{ fontSize: 11, fill: '#69756e' }} tickLine={false} axisLine={false} /><YAxis tickFormatter={(value) => formatMoney(Number(value), currencyCode, languageCode)} tick={{ fontSize: 10, fill: '#8a9188' }} tickLine={false} axisLine={false} width={76} /><Tooltip formatter={(value) => formatMoney(Number(value), currencyCode, languageCode)} contentStyle={{ borderRadius: 12, border: '1px solid #e2dbcd', background: '#fbf8f1', fontSize: 12 }} /><Legend iconType="circle" wrapperStyle={{ fontSize: 12, color: '#52635c' }} /><Bar dataKey="presupuesto" name={t('planned')} fill="#e9bd63" radius={[5, 5, 0, 0]} /><Bar dataKey="gastado" name={t('spent')} fill="#2c8b83" radius={[5, 5, 0, 0]} /></BarChart></ResponsiveContainer></div> : <EmptyState title={t('startPlanTitle')} description={t('startPlanDescription')} actionHref="/presupuesto" actionLabel={t('addBudgetFromTab')} />}
      </section>
    </div>

    <section className="mt-5 rounded-[26px] border border-[#e2dbcd] bg-[#fbf8f1] p-6 md:p-7" data-testid="section-budget-margins">
      <div className="mb-5 flex items-end justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[.16em] text-[#7b8279]">{t('categoryDetail')}</p><h2 className="serif mt-1 text-2xl text-[#183f3e]">{t('margins')}</h2></div>{topCategory && <p className="hidden text-right text-xs text-[#7b8279] sm:block">{t('highestSpend')}: <span className="font-bold text-[#183f3e]">{topCategory.name}</span></p>}</div>
      {budgetData.length ? <div className="overflow-x-auto"><table className="w-full min-w-[650px] text-left text-sm"><thead><tr className="border-b border-[#e9e2d6] text-xs uppercase tracking-[.1em] text-[#8a9188]"><th className="pb-3 font-bold">{t('category')}</th><th className="pb-3 font-bold">{t('planned')}</th><th className="pb-3 font-bold">{t('spent')}</th><th className="pb-3 font-bold">{t('margin')}</th><th className="pb-3 text-right font-bold">{t('status')}</th></tr></thead><tbody className="divide-y divide-[#eee7d9]">{budgetData.map((item) => <tr key={item.category}><td className="py-4 font-bold text-[#294846]">{item.category}</td><td className="py-4 text-[#69756e]">{formatMoney(item.presupuesto, currencyCode, languageCode)}</td><td className="py-4 text-[#69756e]">{formatMoney(item.gastado, currencyCode, languageCode)}</td><td className={`py-4 font-bold ${item.margen >= 0 ? 'text-[#39715f]' : 'text-[#bd5f4a]'}`}>{formatMoney(item.margen, currencyCode, languageCode)}</td><td className="py-4 text-right"><span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${item.margen >= 0 ? 'bg-[#d5e5d6] text-[#39715f]' : 'bg-[#f7d8ce] text-[#a75041]'}`}>{item.margen >= 0 ? t('withinPlan') : t('exceeded')}</span></td></tr>)}</tbody></table></div> : <EmptyState title={t('noBudgetCategoriesTitle')} description={t('noBudgetCategoriesDescription')} actionHref="/presupuesto" actionLabel={t('goBudget')} />}
    </section>

    <div className="mt-5 flex items-center gap-3 rounded-2xl border border-[#e2dbcd] bg-[#f3d889]/35 p-4 text-sm text-[#536658]"><FileSpreadsheet className="shrink-0 text-[#0b6e69]" size={19} /><p>{t('excelNote')}</p></div>
  </div>;
}

function EmptyState({ title, description, action, actionLabel, actionHref }: { title: string; description: string; action?: () => void; actionLabel: string; actionHref?: string }) {
  const actionContent = actionHref ? <Link href={actionHref} data-testid="link-empty-action" className="mt-5 inline-flex rounded-xl bg-[#0b6e69] px-4 py-2.5 text-sm font-bold text-[#f8f1e5]">{actionLabel}</Link> : <button type="button" onClick={action} data-testid="button-empty-action" className="mt-5 rounded-xl bg-[#0b6e69] px-4 py-2.5 text-sm font-bold text-[#f8f1e5]">{actionLabel}</button>;
  return <div className="dot-grid rounded-2xl border border-dashed border-[#cfc7b6] px-6 py-12 text-center"><div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-[#d5e5d6] text-[#0b6e69]"><TrendingUp size={22} /></div><h3 className="serif mt-4 text-2xl text-[#183f3e]">{title}</h3><p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-[#7b8279]">{description}</p>{actionContent}</div>;
}

function ModalShell({ title, description, onClose, children }: { title: string; description: string; onClose: () => void; children: ReactNode }) {
  const { t } = useI18n();
  return <div className="fixed inset-0 z-50 grid place-items-center bg-[#153f3d]/35 p-4 backdrop-blur-[2px]" onMouseDown={onClose}><div className="soft-pop max-h-[calc(100dvh-32px)] w-full max-w-lg overflow-y-auto rounded-[26px] border border-[#ded7c8] bg-[#fbf8f1] p-6 shadow-2xl md:p-7" onMouseDown={(event) => event.stopPropagation()}><div className="flex items-start justify-between"><div><h2 className="serif text-3xl text-[#183f3e]">{title}</h2><p className="mt-2 text-sm text-[#7b8279]">{description}</p></div><button type="button" onClick={onClose} aria-label={t('close')} data-testid="button-close-modal" className="rounded-full p-2 text-[#7b8279] hover:bg-[#eee7d9]"><X size={19} /></button></div>{children}</div></div>;
}

function Field({ label, error, children }: { label: string; error?: string; children: ReactNode }) {
  return <label className="block"><span className="mb-1.5 block text-xs font-bold text-[#52635c]">{label}</span>{children}{error && <span className="mt-1 block text-xs font-semibold text-[#bd5f4a]">{error}</span>}</label>;
}
const inputClass = 'w-full rounded-xl border border-[#d9d1c1] bg-[#f8f4eb] px-3.5 py-3 text-sm text-[#183f3e] outline-none transition focus:border-[#0b6e69] focus:ring-2 focus:ring-[#0b6e69]/10';

function MovementModal({ value, currencyCode, onClose, onSave }: { value: Movement | null; currencyCode: CurrencyCode; onClose: () => void; onSave: (movement: Movement) => void }) {
  const { languageCode, t } = useI18n();
  const [type, setType] = useState<MovementType>(value?.type || 'expense');
  const [description, setDescription] = useState(value?.description || '');
  const [category, setCategory] = useState(value?.category || 'Alimentación');
  const [amount, setAmount] = useState(value?.amount ? String(value.amount) : '');
  const [date, setDate] = useState(value?.date || today());
  const [error, setError] = useState('');
  const submit = (event: FormEvent) => { event.preventDefault(); const numeric = Number(amount.replace(',', '.')); if (!description.trim() || !category || !date || !Number.isFinite(numeric) || numeric <= 0) { setError(t('formError')); return; } onSave({ id: value?.id || `m-${Date.now()}`, type, description: description.trim(), category, amount: numeric, date }); };
  const currencySymbol = currencyOptions.find((item) => item.code === currencyCode)?.symbol || currencyCode;
  return <ModalShell title={value ? t('editMovement') : t('newMovement')} description={t('movementModalDescription')} onClose={onClose}><form onSubmit={submit} className="mt-7 space-y-4"><div className="grid grid-cols-2 gap-2 rounded-xl bg-[#eee7d9] p-1"><button type="button" onClick={() => setType('expense')} data-testid="button-type-expense" className={`rounded-lg py-2.5 text-sm font-bold ${type === 'expense' ? 'bg-[#f7d8ce] text-[#a75041]' : 'text-[#7b8279]'}`}>{t('expense')}</button><button type="button" onClick={() => setType('income')} data-testid="button-type-income" className={`rounded-lg py-2.5 text-sm font-bold ${type === 'income' ? 'bg-[#d5e5d6] text-[#39715f]' : 'text-[#7b8279]'}`}>{t('income').replace(/s$/, '')}</button></div><Field label={t('description')}><input value={description} onChange={(event) => setDescription(event.target.value)} placeholder={t('descriptionPlaceholder')} data-testid="input-movement-description" className={inputClass} /></Field><div className="grid gap-4 sm:grid-cols-2"><Field label={t('category')}><select value={category} onChange={(event) => setCategory(event.target.value)} data-testid="select-movement-category" className={inputClass}>{categories.map((item) => <option key={item} value={item}>{categoryLabel(item, languageCode)}</option>)}</select></Field><Field label={`${t('amountIn')} ${currencyCode}`}><div className="relative"><input value={amount} onChange={(event) => setAmount(event.target.value)} inputMode="decimal" placeholder={currencyCode === 'COP' ? '0' : languageCode === 'en' ? '0.00' : '0,00'} data-testid="input-movement-amount" className={`${inputClass} pr-10`} /><span className="absolute right-3 top-3 text-sm text-[#8a9188]">{currencySymbol}</span></div></Field></div><Field label={t('date')}><input type="date" value={date} onChange={(event) => setDate(event.target.value)} data-testid="input-movement-date" className={inputClass} /></Field>{error && <p className="rounded-xl bg-[#f7d8ce] px-3 py-2.5 text-xs font-semibold text-[#a75041]" data-testid="status-form-error">{error}</p>}<button type="submit" data-testid="button-save-movement" className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-[#0b6e69] py-3.5 text-sm font-bold text-[#f8f1e5]"><Check size={17} /> {t('saveMovement')}</button></form></ModalShell>;
}

function BudgetModal({ value, currencyCode, existing, onClose, onSave }: { value: Budget | null; currencyCode: CurrencyCode; existing: Budget[]; onClose: () => void; onSave: (budget: Budget) => void }) {
  const { languageCode, t } = useI18n();
  const [category, setCategory] = useState(value?.category || categories.find((item) => !existing.some((budget) => budget.category === item)) || categories[0]);
  const [amount, setAmount] = useState(value?.amount ? String(value.amount) : '');
  const [error, setError] = useState('');
  const available = categories.filter((item) => item === value?.category || !existing.some((budget) => budget.category === item));
  const submit = (event: FormEvent) => { event.preventDefault(); const numeric = Number(amount.replace(',', '.')); if (!category || !Number.isFinite(numeric) || numeric <= 0) { setError(t('budgetError')); return; } onSave({ id: value?.id || `b-${Date.now()}`, category, amount: numeric }); };
  const currencySymbol = currencyOptions.find((item) => item.code === currencyCode)?.symbol || currencyCode;
  return <ModalShell title={value ? t('editBudget') : t('newCategory')} description={t('budgetModalDescription')} onClose={onClose}><form onSubmit={submit} className="mt-7 space-y-4"><Field label={t('category')}><select value={category} onChange={(event) => setCategory(event.target.value)} data-testid="select-budget-category" className={inputClass}>{available.map((item) => <option key={item} value={item}>{categoryLabel(item, languageCode)}</option>)}</select></Field><Field label={`${t('monthlyBudget')} ${currencyCode}`}><div className="relative"><input value={amount} onChange={(event) => setAmount(event.target.value)} inputMode="decimal" placeholder={currencyCode === 'COP' ? '0' : languageCode === 'en' ? '0.00' : '0,00'} data-testid="input-budget-amount" className={`${inputClass} pr-10`} /><span className="absolute right-3 top-3 text-sm text-[#8a9188]">{currencySymbol}</span></div></Field>{error && <p className="rounded-xl bg-[#f7d8ce] px-3 py-2.5 text-xs font-semibold text-[#a75041]" data-testid="status-budget-error">{error}</p>}<button type="submit" data-testid="button-save-budget" className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-[#0b6e69] py-3.5 text-sm font-bold text-[#f8f1e5]"><Check size={17} /> {t('saveBudget')}</button></form></ModalShell>;
}

function NotFound() {
  const { t } = useI18n();
  return <div className="rounded-[26px] border border-[#e2dbcd] bg-[#fbf8f1] p-12 text-center"><Settings2 className="mx-auto text-[#0b6e69]" size={28} /><h1 className="serif mt-4 text-3xl text-[#183f3e]">{t('notFound')}</h1><Link href="/" data-testid="link-back-home" className="mt-5 inline-flex rounded-xl bg-[#0b6e69] px-4 py-2.5 text-sm font-bold text-[#f8f1e5]">{t('backToSummary')}</Link></div>;
}

export default App;