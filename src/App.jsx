import React, { useState, useEffect, useMemo } from "react";
import {
  PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
} from "recharts";
import {
  Home, Receipt, Target, PiggyBank, Repeat, SlidersHorizontal, Plus, X, Trash2,
  TrendingUp, TrendingDown, Wallet, Sparkles, AlertTriangle, CheckCircle2, Clock,
  ArrowUpRight, ArrowDownRight, Rocket, Flame,
} from "lucide-react";

/* ---------------------------------- constants ---------------------------------- */

const EXPENSE_CATEGORIES = [
  "Food", "Groceries", "Rent", "Transport", "Entertainment",
  "Shopping", "Health", "Education", "Subscriptions", "Other",
];
const INCOME_CATEGORIES = ["Salary", "Freelance", "Allowance", "Gift", "Investment", "Other"];

const CATEGORY_COLORS = {
  Food: "#fb923c", Groceries: "#34d399", Rent: "#a78bfa", Transport: "#60a5fa",
  Entertainment: "#f472b6", Shopping: "#fbbf24", Health: "#f87171", Education: "#38bdf8",
  Subscriptions: "#c084fc", Other: "#94a3b8",
};

const ACCENT = { income: "#2dd4bf", expense: "#fb7185", goal: "#fbbf24", fund: "#38bdf8", budget: "#a78bfa" };

/* ---------------------------------- helpers ---------------------------------- */

const formatINR = (n) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n || 0);

const todayStr = () => new Date().toISOString().slice(0, 10);
const monthKeyOf = (dateStr) => (dateStr || todayStr()).slice(0, 7);
const currentMonthKey = () => todayStr().slice(0, 7);

function last6MonthKeys() {
  const out = [];
  const d = new Date();
  for (let i = 5; i >= 0; i--) {
    const dt = new Date(d.getFullYear(), d.getMonth() - i, 1);
    out.push({
      key: `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}`,
      label: dt.toLocaleString("default", { month: "short" }),
    });
  }
  return out;
}

function daysUntil(dateStr) {
  const d = new Date(dateStr + "T00:00:00");
  const t = new Date(todayStr() + "T00:00:00");
  return Math.round((d - t) / 86400000);
}

function nextBillDueDate(dueDay) {
  const now = new Date();
  let due = new Date(now.getFullYear(), now.getMonth(), dueDay);
  if (due < new Date(now.getFullYear(), now.getMonth(), now.getDate())) {
    due = new Date(now.getFullYear(), now.getMonth() + 1, dueDay);
  }
  return due.toISOString().slice(0, 10);
}

/* ---------------------------------- storage hook ---------------------------------- */

function useStorageState(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw != null ? JSON.parse(raw) : initialValue;
    } catch (e) {
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error("storage save failed", key, e);
    }
  }, [key, value]);

  return [value, setValue, true];
}

/* ---------------------------------- shared UI bits ---------------------------------- */

function Gauge({ percent, size = 132, stroke = 11, color, track = "#1e293b", children }) {
  const clamped = Math.max(0, Math.min(100, percent || 0));
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (clamped / 100) * c;
  const ticks = Array.from({ length: 24 });
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke={track} strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2} cy={size / 2} r={r} stroke={color} strokeWidth={stroke} fill="none"
          strokeDasharray={c} strokeDashoffset={offset} strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 0.7s cubic-bezier(.4,0,.2,1)" }}
        />
      </svg>
      <svg width={size} height={size} className="absolute inset-0">
        {ticks.map((_, i) => {
          const angle = (i / ticks.length) * 2 * Math.PI;
          const rOuter = size / 2 - 2;
          const rInner = size / 2 - 6;
          const x1 = size / 2 + rOuter * Math.cos(angle);
          const y1 = size / 2 + rOuter * Math.sin(angle);
          const x2 = size / 2 + rInner * Math.cos(angle);
          const y2 = size / 2 + rInner * Math.sin(angle);
          return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#334155" strokeWidth="1.5" />;
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">{children}</div>
    </div>
  );
}

function Card({ children, className = "" }) {
  return (
    <div className={`bg-slate-900/70 border border-slate-800 rounded-2xl p-5 ${className}`}>
      {children}
    </div>
  );
}

function SectionHeader({ eyebrow, title, action }) {
  return (
    <div className="flex items-end justify-between mb-4">
      <div>
        {eyebrow && <p className="text-xs uppercase tracking-wider text-slate-500 font-medium mb-1">{eyebrow}</p>}
        <h2 className="font-display text-xl sm:text-2xl text-slate-100">{title}</h2>
      </div>
      {action}
    </div>
  );
}

function IconBtn({ onClick, children, className = "" }) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 text-slate-900 text-sm font-semibold hover:bg-white transition-colors ${className}`}
    >
      {children}
    </button>
  );
}

function DeleteButton({ onDelete, className = "" }) {
  const [confirming, setConfirming] = useState(false);
  useEffect(() => {
    if (!confirming) return;
    const t = setTimeout(() => setConfirming(false), 2500);
    return () => clearTimeout(t);
  }, [confirming]);
  return confirming ? (
    <button
      onClick={onDelete}
      className={`text-xs px-2 py-1 rounded-lg bg-rose-500/20 text-rose-300 border border-rose-500/40 whitespace-nowrap ${className}`}
    >
      Confirm delete
    </button>
  ) : (
    <button
      onClick={() => setConfirming(true)}
      className={`p-1.5 rounded-full hover:bg-slate-800 text-slate-500 hover:text-rose-400 transition-colors ${className}`}
    >
      <Trash2 size={14} />
    </button>
  );
}

function Modal({ title, onClose, children }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/70 backdrop-blur-sm p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-md bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-2xl p-5 max-h-[88vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-display text-lg text-slate-100">{title}</h3>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400">
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block mb-3.5">
      <span className="block text-xs font-medium text-slate-400 mb-1.5">{label}</span>
      {children}
    </label>
  );
}

const inputCls =
  "w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-100 text-sm outline-none focus:border-slate-400 transition-colors";

function EmptyState({ icon: Icon, title, subtitle }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-12 px-4">
      <div className="w-14 h-14 rounded-2xl bg-slate-800/60 flex items-center justify-center mb-4">
        <Icon size={24} className="text-slate-500" />
      </div>
      <p className="text-slate-300 font-medium mb-1">{title}</p>
      <p className="text-slate-500 text-sm max-w-xs">{subtitle}</p>
    </div>
  );
}

/* ---------------------------------- app ---------------------------------- */

export default function App() {
  const [tab, setTab] = useState("dashboard");
  const [transactions, setTransactions, txLoaded] = useStorageState("transactions", []);
  const [goals, setGoals, goalsLoaded] = useStorageState("goals", []);
  const [fund, setFund, fundLoaded] = useStorageState("emergencyFund", { target: 0, saved: 0 });
  const [budgets, setBudgets, budgetsLoaded] = useStorageState("budgets", {});
  const [bills, setBills, billsLoaded] = useStorageState("bills", []);
  const [modal, setModal] = useState(null);

  const loaded = txLoaded && goalsLoaded && fundLoaded && budgetsLoaded && billsLoaded;

  /* -------- derived numbers -------- */
  const totals = useMemo(() => {
    const totalIncome = transactions.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
    const totalExpense = transactions.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
    const totalGoalSaved = goals.reduce((s, g) => s + g.saved, 0);
    const balance = totalIncome - totalExpense - totalGoalSaved - fund.saved;

    const mk = currentMonthKey();
    const monthTx = transactions.filter((t) => monthKeyOf(t.date) === mk);
    const monthIncome = monthTx.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
    const monthExpense = monthTx.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
    const savingsRate = monthIncome > 0 ? ((monthIncome - monthExpense) / monthIncome) * 100 : 0;

    const byCategory = {};
    monthTx.filter((t) => t.type === "expense").forEach((t) => {
      byCategory[t.category] = (byCategory[t.category] || 0) + t.amount;
    });
    const spendingByCategory = Object.entries(byCategory)
      .map(([name, value]) => ({ name, value, color: CATEGORY_COLORS[name] || "#94a3b8" }))
      .sort((a, b) => b.value - a.value);

    const months = last6MonthKeys();
    const trend = months.map(({ key, label }) => {
      const inc = transactions.filter((t) => t.type === "income" && monthKeyOf(t.date) === key).reduce((s, t) => s + t.amount, 0);
      const exp = transactions.filter((t) => t.type === "expense" && monthKeyOf(t.date) === key).reduce((s, t) => s + t.amount, 0);
      return { label, Income: inc, Expense: exp };
    });

    const last3ExpenseMonths = months.slice(-3).map((m) =>
      transactions.filter((t) => t.type === "expense" && monthKeyOf(t.date) === m.key).reduce((s, t) => s + t.amount, 0)
    );
    const avgMonthlyExpense = last3ExpenseMonths.reduce((a, b) => a + b, 0) / 3;

    return { totalIncome, totalExpense, totalGoalSaved, balance, monthIncome, monthExpense, savingsRate, spendingByCategory, trend, avgMonthlyExpense };
  }, [transactions, goals, fund]);

  /* -------- handlers -------- */
  const addTransaction = (tx) => setTransactions((p) => [{ ...tx, id: Date.now().toString() }, ...p]);
  const deleteTransaction = (id) => setTransactions((p) => p.filter((t) => t.id !== id));

  const addGoal = (g) => setGoals((p) => [...p, { ...g, id: Date.now().toString(), saved: 0 }]);
  const deleteGoal = (id) => setGoals((p) => p.filter((g) => g.id !== id));
  const addFundsToGoal = (id, amt) => setGoals((p) => p.map((g) => (g.id === id ? { ...g, saved: Math.max(0, g.saved + amt) } : g)));

  const addBill = (b) => setBills((p) => [...p, { ...b, id: Date.now().toString(), paidMonths: [] }]);
  const deleteBill = (id) => setBills((p) => p.filter((b) => b.id !== id));
  const markBillPaid = (bill) => {
    const mk = currentMonthKey();
    setBills((p) => p.map((b) => (b.id === bill.id ? { ...b, paidMonths: [...b.paidMonths, mk] } : b)));
    addTransaction({ type: "expense", amount: bill.amount, category: bill.category, date: todayStr(), note: `Bill: ${bill.name}` });
  };

  const setBudgetLimit = (category, limit) => setBudgets((p) => ({ ...p, [category]: limit }));

  if (!loaded) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex items-center gap-3 text-slate-400">
          <Rocket size={20} className="animate-pulse" />
          <span className="font-body text-sm">Loading your dashboard…</span>
        </div>
      </div>
    );
  }

  const NAV = [
    { id: "dashboard", label: "Dashboard", icon: Home },
    { id: "transactions", label: "Transactions", icon: Receipt },
    { id: "goals", label: "Goals", icon: Target },
    { id: "emergency", label: "Emergency", icon: PiggyBank },
    { id: "budgets", label: "Budgets", icon: SlidersHorizontal },
    { id: "bills", label: "Bills", icon: Repeat },
  ];

  return (
    <div className="min-h-screen bg-slate-950 font-body text-slate-100">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@500;700&display=swap');
        .font-display { font-family: 'Space Grotesk', sans-serif; }
        .font-body { font-family: 'Inter', sans-serif; }
        .font-num { font-family: 'JetBrains Mono', monospace; }
        ::-webkit-scrollbar { width: 8px; height: 8px; }
        ::-webkit-scrollbar-thumb { background: #334155; border-radius: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
      `}</style>

      <div className="flex">
        {/* sidebar (desktop) */}
        <aside className="hidden md:flex md:flex-col w-56 shrink-0 border-r border-slate-800 min-h-screen p-4 sticky top-0 h-screen">
          <div className="flex items-center gap-2 px-2 mb-8 mt-2">
            <div className="w-8 h-8 rounded-lg bg-amber-400/15 flex items-center justify-center">
              <Rocket size={16} className="text-amber-400" />
            </div>
            <span className="font-display text-lg tracking-tight">Paisa Pilot</span>
          </div>
          <nav className="flex flex-col gap-1">
            {NAV.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  tab === id ? "bg-slate-100 text-slate-900" : "text-slate-400 hover:bg-slate-900 hover:text-slate-200"
                }`}
              >
                <Icon size={17} />
                {label}
              </button>
            ))}
          </nav>
          <div className="mt-auto px-2 text-xs text-slate-600">Built for tracking real life, not spreadsheets.</div>
        </aside>

        {/* main content */}
        <main className="flex-1 min-w-0 pb-24 md:pb-8">
          <div className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8">
            {/* mobile top bar */}
            <div className="flex md:hidden items-center gap-2 mb-6">
              <div className="w-8 h-8 rounded-lg bg-amber-400/15 flex items-center justify-center">
                <Rocket size={16} className="text-amber-400" />
              </div>
              <span className="font-display text-lg tracking-tight">Paisa Pilot</span>
            </div>

            {tab === "dashboard" && (
              <Dashboard totals={totals} fund={fund} goals={goals} bills={bills} onAddTx={() => setModal({ type: "tx" })} />
            )}
            {tab === "transactions" && (
              <TransactionsTab
                transactions={transactions}
                onAdd={() => setModal({ type: "tx" })}
                onDelete={deleteTransaction}
              />
            )}
            {tab === "goals" && (
              <GoalsTab goals={goals} onAdd={() => setModal({ type: "goal" })} onDelete={deleteGoal} onAddFunds={addFundsToGoal} />
            )}
            {tab === "emergency" && (
              <EmergencyTab fund={fund} setFund={setFund} avgMonthlyExpense={totals.avgMonthlyExpense} />
            )}
            {tab === "budgets" && (
              <BudgetsTab budgets={budgets} setBudgetLimit={setBudgetLimit} monthExpense={totals.monthExpense} spendingByCategory={totals.spendingByCategory} />
            )}
            {tab === "bills" && (
              <BillsTab bills={bills} onAdd={() => setModal({ type: "bill" })} onDelete={deleteBill} onMarkPaid={markBillPaid} />
            )}
          </div>
        </main>
      </div>

      {/* bottom nav (mobile) */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 bg-slate-900/95 backdrop-blur border-t border-slate-800 flex z-40">
        {NAV.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 text-[10px] font-medium ${
              tab === id ? "text-amber-400" : "text-slate-500"
            }`}
          >
            <Icon size={18} />
            {label}
          </button>
        ))}
      </nav>

      {/* modals */}
      {modal?.type === "tx" && <AddTransactionModal onClose={() => setModal(null)} onSubmit={addTransaction} />}
      {modal?.type === "goal" && <AddGoalModal onClose={() => setModal(null)} onSubmit={addGoal} />}
      {modal?.type === "bill" && <AddBillModal onClose={() => setModal(null)} onSubmit={addBill} />}
    </div>
  );
}

/* ---------------------------------- dashboard ---------------------------------- */

function Dashboard({ totals, fund, goals, bills, onAddTx }) {
  const topCategory = totals.spendingByCategory[0];
  const upcomingBills = bills
    .map((b) => ({ ...b, due: nextBillDueDate(b.dueDay) }))
    .filter((b) => !b.paidMonths.includes(currentMonthKey()))
    .sort((a, b) => daysUntil(a.due) - daysUntil(b.due))
    .slice(0, 4);

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow={new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}
        title="Your financial status"
        action={<IconBtn onClick={onAddTx}><Plus size={16} /> Add transaction</IconBtn>}
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="sm:col-span-1 flex flex-col items-center justify-center">
          <Gauge percent={Math.max(0, totals.savingsRate)} color={totals.savingsRate >= 0 ? ACCENT.income : ACCENT.expense}>
            <span className="font-num text-2xl font-bold text-slate-100">{totals.savingsRate.toFixed(0)}%</span>
            <span className="text-[11px] text-slate-500 mt-0.5">savings rate</span>
          </Gauge>
          <p className="text-xs text-slate-500 mt-3 text-center">of this month's income kept, not spent</p>
        </Card>

        <div className="sm:col-span-2 grid grid-cols-2 gap-4">
          <Card>
            <div className="flex items-center gap-2 text-slate-400 text-xs font-medium mb-2">
              <Wallet size={14} /> Available balance
            </div>
            <p className="font-num text-2xl font-bold text-slate-100 break-all">{formatINR(totals.balance)}</p>
            <p className="text-[11px] text-slate-500 mt-1">after goals & emergency fund set aside</p>
          </Card>
          <Card>
            <div className="flex items-center gap-2 text-teal-400 text-xs font-medium mb-2">
              <ArrowUpRight size={14} /> Income this month
            </div>
            <p className="font-num text-2xl font-bold text-slate-100 break-all">{formatINR(totals.monthIncome)}</p>
          </Card>
          <Card>
            <div className="flex items-center gap-2 text-rose-400 text-xs font-medium mb-2">
              <ArrowDownRight size={14} /> Expenses this month
            </div>
            <p className="font-num text-2xl font-bold text-slate-100 break-all">{formatINR(totals.monthExpense)}</p>
          </Card>
          <Card>
            <div className="flex items-center gap-2 text-amber-400 text-xs font-medium mb-2">
              <Flame size={14} /> Top spend category
            </div>
            <p className="font-display text-lg font-semibold text-slate-100">{topCategory ? topCategory.name : "—"}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">{topCategory ? formatINR(topCategory.value) : "No expenses yet"}</p>
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <p className="text-sm font-semibold text-slate-200 mb-3">Spending by category — this month</p>
          {totals.spendingByCategory.length === 0 ? (
            <EmptyState icon={Receipt} title="Nothing logged yet" subtitle="Add an expense to see your breakdown here." />
          ) : (
            <div className="h-56 flex items-center">
              <ResponsiveContainer width="55%" height="100%">
                <PieChart>
                  <Pie data={totals.spendingByCategory} dataKey="value" nameKey="name" innerRadius={45} outerRadius={75} paddingAngle={2}>
                    {totals.spendingByCategory.map((entry, i) => (
                      <Cell key={i} fill={entry.color} stroke="none" />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => formatINR(v)} contentStyle={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 10, fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-1.5 max-h-56 overflow-y-auto pr-1">
                {totals.spendingByCategory.map((c) => (
                  <div key={c.name} className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5 text-slate-300">
                      <span className="w-2 h-2 rounded-full" style={{ background: c.color }} />
                      {c.name}
                    </span>
                    <span className="font-num text-slate-400">{formatINR(c.value)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>

        <Card>
          <p className="text-sm font-semibold text-slate-200 mb-3">Income vs expenses — last 6 months</p>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={totals.trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="label" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} width={40} />
                <Tooltip formatter={(v) => formatINR(v)} contentStyle={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 10, fontSize: 12 }} />
                <Bar dataKey="Income" fill={ACCENT.income} radius={[4, 4, 0, 0]} />
                <Bar dataKey="Expense" fill={ACCENT.expense} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-slate-200">Upcoming bills</p>
            <PiggyBank size={15} className="text-sky-400" />
          </div>
          {upcomingBills.length === 0 ? (
            <p className="text-xs text-slate-500">No bills due — nothing pending right now.</p>
          ) : (
            <div className="space-y-2.5">
              {upcomingBills.map((b) => {
                const d = daysUntil(b.due);
                return (
                  <div key={b.id} className="flex items-center justify-between text-sm">
                    <div>
                      <p className="text-slate-200 font-medium">{b.name}</p>
                      <p className="text-[11px] text-slate-500">{d < 0 ? `${Math.abs(d)}d overdue` : d === 0 ? "Due today" : `Due in ${d}d`}</p>
                    </div>
                    <span className="font-num text-slate-300">{formatINR(b.amount)}</span>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-slate-200">Goals in progress</p>
            <Target size={15} className="text-amber-400" />
          </div>
          {goals.length === 0 ? (
            <p className="text-xs text-slate-500">No goals yet — set one on the Goals tab.</p>
          ) : (
            <div className="space-y-3">
              {goals.slice(0, 4).map((g) => {
                const pct = Math.min(100, (g.saved / g.target) * 100 || 0);
                return (
                  <div key={g.id}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-300 font-medium">{g.name}</span>
                      <span className="text-slate-500 font-num">{pct.toFixed(0)}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
                      <div className="h-full rounded-full bg-amber-400" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

/* ---------------------------------- transactions ---------------------------------- */

function TransactionsTab({ transactions, onAdd, onDelete }) {
  const [filter, setFilter] = useState("all");
  const filtered = transactions.filter((t) => filter === "all" || t.type === filter);

  return (
    <div className="space-y-5">
      <SectionHeader
        title="Transactions"
        action={<IconBtn onClick={onAdd}><Plus size={16} /> Add</IconBtn>}
      />
      <div className="flex gap-2">
        {["all", "income", "expense"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium capitalize transition-colors ${
              filter === f ? "bg-slate-100 text-slate-900" : "bg-slate-900 text-slate-400 border border-slate-800"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={Receipt} title="No transactions yet" subtitle="Log your first income or expense to start tracking." />
      ) : (
        <Card className="p-0 overflow-hidden">
          <div className="divide-y divide-slate-800">
            {filtered.map((t) => (
              <div key={t.id} className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                      t.type === "income" ? "bg-teal-400/15 text-teal-400" : "bg-rose-400/15 text-rose-400"
                    }`}
                  >
                    {t.type === "income" ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm text-slate-200 font-medium truncate">{t.category}{t.note ? ` · ${t.note}` : ""}</p>
                    <p className="text-[11px] text-slate-500">{t.date}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className={`font-num text-sm font-semibold ${t.type === "income" ? "text-teal-400" : "text-rose-400"}`}>
                    {t.type === "income" ? "+" : "−"}{formatINR(t.amount)}
                  </span>
                  <DeleteButton onDelete={() => onDelete(t.id)} />
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

function AddTransactionModal({ onClose, onSubmit }) {
  const [type, setType] = useState("expense");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState(EXPENSE_CATEGORIES[0]);
  const [date, setDate] = useState(todayStr());
  const [note, setNote] = useState("");
  const cats = type === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  const submit = () => {
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) return;
    onSubmit({ type, amount: amt, category, date, note: note.trim() });
    onClose();
  };

  return (
    <Modal title="Add transaction" onClose={onClose}>
      <div className="flex gap-2 mb-4">
        {["expense", "income"].map((t) => (
          <button
            key={t}
            onClick={() => { setType(t); setCategory(t === "income" ? INCOME_CATEGORIES[0] : EXPENSE_CATEGORIES[0]); }}
            className={`flex-1 py-2 rounded-xl text-sm font-semibold capitalize transition-colors ${
              type === t ? (t === "income" ? "bg-teal-400/20 text-teal-300 border border-teal-400/40" : "bg-rose-400/20 text-rose-300 border border-rose-400/40") : "bg-slate-950 text-slate-400 border border-slate-800"
            }`}
          >
            {t}
          </button>
        ))}
      </div>
      <Field label="Amount (₹)">
        <input type="number" inputMode="decimal" className={inputCls} value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0" autoFocus />
      </Field>
      <Field label="Category">
        <select className={inputCls} value={category} onChange={(e) => setCategory(e.target.value)}>
          {cats.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </Field>
      <Field label="Date">
        <input type="date" className={inputCls} value={date} onChange={(e) => setDate(e.target.value)} max={todayStr()} />
      </Field>
      <Field label="Note (optional)">
        <input type="text" className={inputCls} value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. lunch with friends" />
      </Field>
      <button onClick={submit} className="w-full mt-2 py-3 rounded-xl bg-slate-100 text-slate-900 font-semibold text-sm hover:bg-white transition-colors">
        Save transaction
      </button>
    </Modal>
  );
}

/* ---------------------------------- goals ---------------------------------- */

function GoalCard({ goal, onDelete, onAddFunds }) {
  const [amt, setAmt] = useState("");
  const pct = Math.min(100, (goal.saved / goal.target) * 100 || 0);
  const remaining = Math.max(0, goal.target - goal.saved);
  const days = goal.deadline ? daysUntil(goal.deadline) : null;

  return (
    <Card className="flex flex-col sm:flex-row gap-4 sm:items-center">
      <Gauge percent={pct} size={92} stroke={8} color={ACCENT.goal}>
        <span className="font-num text-sm font-bold text-slate-100">{pct.toFixed(0)}%</span>
      </Gauge>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <p className="font-display text-base text-slate-100">{goal.name}</p>
          <DeleteButton onDelete={() => onDelete(goal.id)} />
        </div>
        <p className="text-xs text-slate-500 mt-0.5">
          {formatINR(goal.saved)} saved of {formatINR(goal.target)} · {formatINR(remaining)} remaining
          {days !== null && (days >= 0 ? ` · ${days}d left` : ` · ${Math.abs(days)}d overdue`)}
        </p>
        <div className="flex gap-2 mt-3">
          <input
            type="number" inputMode="decimal" value={amt} onChange={(e) => setAmt(e.target.value)}
            placeholder="Add amount" className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-slate-100 outline-none focus:border-slate-400"
          />
          <button
            onClick={() => { const v = parseFloat(amt); if (v > 0) { onAddFunds(goal.id, v); setAmt(""); } }}
            className="px-3 py-1.5 rounded-lg bg-amber-400/15 text-amber-300 text-xs font-semibold hover:bg-amber-400/25"
          >
            Add funds
          </button>
        </div>
      </div>
    </Card>
  );
}

function GoalsTab({ goals, onAdd, onDelete, onAddFunds }) {
  return (
    <div className="space-y-5">
      <SectionHeader title="Savings goals" action={<IconBtn onClick={onAdd}><Plus size={16} /> New goal</IconBtn>} />
      {goals.length === 0 ? (
        <EmptyState icon={Target} title="No goals yet" subtitle="A new phone, a trip, a laptop — set a target and track your progress toward it." />
      ) : (
        <div className="space-y-4">
          {goals.map((g) => <GoalCard key={g.id} goal={g} onDelete={onDelete} onAddFunds={onAddFunds} />)}
        </div>
      )}
    </div>
  );
}

function AddGoalModal({ onClose, onSubmit }) {
  const [name, setName] = useState("");
  const [target, setTarget] = useState("");
  const [deadline, setDeadline] = useState("");

  const submit = () => {
    const t = parseFloat(target);
    if (!name.trim() || !t || t <= 0) return;
    onSubmit({ name: name.trim(), target: t, deadline: deadline || null });
    onClose();
  };

  return (
    <Modal title="New savings goal" onClose={onClose}>
      <Field label="Goal name">
        <input type="text" className={inputCls} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. New laptop" autoFocus />
      </Field>
      <Field label="Target amount (₹)">
        <input type="number" inputMode="decimal" className={inputCls} value={target} onChange={(e) => setTarget(e.target.value)} placeholder="0" />
      </Field>
      <Field label="Target date (optional)">
        <input type="date" className={inputCls} value={deadline} onChange={(e) => setDeadline(e.target.value)} min={todayStr()} />
      </Field>
      <button onClick={submit} className="w-full mt-2 py-3 rounded-xl bg-slate-100 text-slate-900 font-semibold text-sm hover:bg-white transition-colors">
        Create goal
      </button>
    </Modal>
  );
}

/* ---------------------------------- emergency fund ---------------------------------- */

function EmergencyTab({ fund, setFund, avgMonthlyExpense }) {
  const [amt, setAmt] = useState("");
  const suggested = Math.round((avgMonthlyExpense || 0) * 6);
  const pct = fund.target > 0 ? Math.min(100, (fund.saved / fund.target) * 100) : 0;
  const monthsCovered = avgMonthlyExpense > 0 ? (fund.saved / avgMonthlyExpense).toFixed(1) : "—";

  return (
    <div className="space-y-5">
      <SectionHeader eyebrow="Safety net" title="Emergency fund" />
      <Card className="flex flex-col sm:flex-row gap-6 sm:items-center">
        <Gauge percent={pct} size={140} stroke={12} color={ACCENT.fund}>
          <span className="font-num text-2xl font-bold text-slate-100">{pct.toFixed(0)}%</span>
          <span className="text-[11px] text-slate-500 mt-0.5">funded</span>
        </Gauge>
        <div className="flex-1 space-y-1">
          <p className="text-slate-300 text-sm">
            <span className="font-num font-semibold text-slate-100">{formatINR(fund.saved)}</span> saved of{" "}
            <span className="font-num font-semibold text-slate-100">{formatINR(fund.target)}</span> target
          </p>
          <p className="text-xs text-slate-500">Covers about {monthsCovered} months of your average spending.</p>
          {suggested > 0 && fund.target !== suggested && (
            <button
              onClick={() => setFund((f) => ({ ...f, target: suggested }))}
              className="mt-2 text-xs px-3 py-1.5 rounded-lg bg-sky-400/15 text-sky-300 hover:bg-sky-400/25"
            >
              Use suggested target: {formatINR(suggested)} (6× avg. monthly spend)
            </button>
          )}
        </div>
      </Card>

      <Card>
        <p className="text-sm font-semibold text-slate-200 mb-3">Manage your fund</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          <Field label="Set custom target (₹)">
            <input
              type="number" className={inputCls} defaultValue={fund.target || ""}
              onBlur={(e) => { const v = parseFloat(e.target.value); setFund((f) => ({ ...f, target: v >= 0 ? v : f.target })); }}
              placeholder="0"
            />
          </Field>
          <Field label="Add or withdraw (₹)">
            <input type="number" className={inputCls} value={amt} onChange={(e) => setAmt(e.target.value)} placeholder="e.g. 2000 or -500" />
          </Field>
        </div>
        <button
          onClick={() => { const v = parseFloat(amt); if (v) { setFund((f) => ({ ...f, saved: Math.max(0, f.saved + v) })); setAmt(""); } }}
          className="w-full py-2.5 rounded-xl bg-slate-100 text-slate-900 font-semibold text-sm hover:bg-white transition-colors"
        >
          Update balance
        </button>
      </Card>

      <Card className="bg-sky-400/5 border-sky-400/20">
        <div className="flex gap-3">
          <AlertTriangle size={18} className="text-sky-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-slate-200 font-medium mb-1">Why this matters</p>
            <p className="text-xs text-slate-400 leading-relaxed">
              An emergency fund is money set aside strictly for surprises — a medical bill, sudden travel, a laptop repair —
              not for goals or everyday spending. Most people aim to build up 3 to 6 months of essential expenses over time.
              Starting with even a small amount and adding to it regularly matters more than hitting the target fast.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}

/* ---------------------------------- budgets ---------------------------------- */

function BudgetsTab({ budgets, setBudgetLimit, monthExpense, spendingByCategory }) {
  const spentMap = Object.fromEntries(spendingByCategory.map((c) => [c.name, c.value]));

  return (
    <div className="space-y-5">
      <SectionHeader eyebrow={`${formatINR(monthExpense)} spent this month`} title="Monthly budgets" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {EXPENSE_CATEGORIES.map((cat) => {
          const limit = budgets[cat] || 0;
          const spent = spentMap[cat] || 0;
          const pct = limit > 0 ? Math.min(100, (spent / limit) * 100) : 0;
          const over = limit > 0 && spent > limit;
          const barColor = over ? "bg-rose-400" : pct > 80 ? "bg-amber-400" : "bg-teal-400";
          return (
            <Card key={cat}>
              <div className="flex items-center justify-between mb-2">
                <span className="flex items-center gap-2 text-sm font-medium text-slate-200">
                  <span className="w-2 h-2 rounded-full" style={{ background: CATEGORY_COLORS[cat] }} />
                  {cat}
                </span>
                {over && <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-400/15 text-rose-300 font-medium">Over budget</span>}
              </div>
              {limit > 0 ? (
                <>
                  <div className="h-2 rounded-full bg-slate-800 overflow-hidden mb-1.5">
                    <div className={`h-full rounded-full ${barColor}`} style={{ width: `${pct}%` }} />
                  </div>
                  <p className="text-xs text-slate-500 mb-3">{formatINR(spent)} of {formatINR(limit)}</p>
                </>
              ) : (
                <p className="text-xs text-slate-500 mb-3">No limit set — {formatINR(spent)} spent so far</p>
              )}
              <input
                type="number" defaultValue={limit || ""} placeholder="Set monthly limit"
                onBlur={(e) => { const v = parseFloat(e.target.value); setBudgetLimit(cat, v >= 0 ? v : 0); }}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-100 outline-none focus:border-slate-400"
              />
            </Card>
          );
        })}
      </div>
    </div>
  );
}

/* ---------------------------------- bills ---------------------------------- */

function BillsTab({ bills, onAdd, onDelete, onMarkPaid }) {
  const mk = currentMonthKey();
  const enriched = bills
    .map((b) => ({ ...b, due: nextBillDueDate(b.dueDay), paid: b.paidMonths.includes(mk) }))
    .sort((a, b) => a.dueDay - b.dueDay);

  return (
    <div className="space-y-5">
      <SectionHeader title="Recurring bills" action={<IconBtn onClick={onAdd}><Plus size={16} /> Add bill</IconBtn>} />
      {enriched.length === 0 ? (
        <EmptyState icon={Repeat} title="No recurring bills yet" subtitle="Add rent, subscriptions, or EMIs so you never miss a due date." />
      ) : (
        <div className="space-y-3">
          {enriched.map((b) => {
            const d = daysUntil(b.due);
            const overdue = !b.paid && d < 0;
            return (
              <Card key={b.id} className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                    b.paid ? "bg-teal-400/15 text-teal-400" : overdue ? "bg-rose-400/15 text-rose-400" : "bg-violet-400/15 text-violet-400"
                  }`}>
                    {b.paid ? <CheckCircle2 size={16} /> : overdue ? <AlertTriangle size={16} /> : <Clock size={16} />}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-200 truncate">{b.name}</p>
                    <p className="text-[11px] text-slate-500">
                      {b.category} · {b.paid ? "Paid this month" : overdue ? `${Math.abs(d)}d overdue` : `Due day ${b.dueDay}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="font-num text-sm text-slate-200">{formatINR(b.amount)}</span>
                  {!b.paid && (
                    <button onClick={() => onMarkPaid(b)} className="text-xs px-2.5 py-1.5 rounded-lg bg-teal-400/15 text-teal-300 font-medium hover:bg-teal-400/25">
                      Mark paid
                    </button>
                  )}
                  <DeleteButton onDelete={() => onDelete(b.id)} />
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function AddBillModal({ onClose, onSubmit }) {
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState(EXPENSE_CATEGORIES[0]);
  const [dueDay, setDueDay] = useState("1");

  const submit = () => {
    const amt = parseFloat(amount);
    const day = parseInt(dueDay, 10);
    if (!name.trim() || !amt || amt <= 0 || !day || day < 1 || day > 31) return;
    onSubmit({ name: name.trim(), amount: amt, category, dueDay: day });
    onClose();
  };

  return (
    <Modal title="Add recurring bill" onClose={onClose}>
      <Field label="Bill name">
        <input type="text" className={inputCls} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Netflix, Rent, Gym" autoFocus />
      </Field>
      <Field label="Amount (₹)">
        <input type="number" inputMode="decimal" className={inputCls} value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0" />
      </Field>
      <Field label="Category">
        <select className={inputCls} value={category} onChange={(e) => setCategory(e.target.value)}>
          {EXPENSE_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </Field>
      <Field label="Due day of month (1–31)">
        <input type="number" min="1" max="31" className={inputCls} value={dueDay} onChange={(e) => setDueDay(e.target.value)} />
      </Field>
      <button onClick={submit} className="w-full mt-2 py-3 rounded-xl bg-slate-100 text-slate-900 font-semibold text-sm hover:bg-white transition-colors">
        Save bill
      </button>
    </Modal>
  );
}
