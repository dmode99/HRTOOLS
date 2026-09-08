import { useEffect, useState } from 'react';
import WorkforceApp from './WorkforceApp';

type DemoSession = { mode?: string; customerId?: string; customerName?: string; synthetic?: boolean };
type DemoQuote = { id: string; title: string; credits: number; status: 'Quoted' | 'Accepted' | 'Failed' | 'Succeeded' | 'Refunded'; createdAt: string };
type StoredCredits = { balance: number; spendingLimit: number; acceptedQuotes?: DemoQuote[] };
type StoredWorkspace = { credits?: StoredCredits };

const demoCustomers = [
  { customerId: 'northstar', customerName: 'Northstar Systems' },
  { customerId: 'lumen', customerName: 'Lumen Care Network' },
];

function readDemoSession(): DemoSession | null {
  try {
    const value = localStorage.getItem('wa.session');
    return value ? JSON.parse(value) as DemoSession : null;
  } catch {
    return null;
  }
}

function readDemoWorkspace(customerId: string): StoredWorkspace {
  try {
    const value = localStorage.getItem(`wa.workspace.${customerId}`);
    return value ? JSON.parse(value) as StoredWorkspace : {};
  } catch {
    return {};
  }
}

function DemoWorkspaceTools({ session }: { session: DemoSession }) {
  const [open, setOpen] = useState(false);
  const [workspace, setWorkspace] = useState<StoredWorkspace>(() => readDemoWorkspace(session.customerId ?? 'northstar'));
  const quotes = workspace.credits?.acceptedQuotes ?? [];
  const latest = quotes[0];
  const credits = workspace.credits ?? { balance: 100, spendingLimit: 100, acceptedQuotes: [] };

  useEffect(() => {
    setWorkspace(readDemoWorkspace(session.customerId ?? 'northstar'));
  }, [session.customerId]);

  const save = (nextCredits: StoredCredits) => {
    const nextWorkspace = { ...workspace, credits: nextCredits };
    localStorage.setItem(`wa.workspace.${session.customerId}`, JSON.stringify(nextWorkspace));
    setWorkspace(nextWorkspace);
  };

  const createQuote = () => {
    const quote: DemoQuote = { id: `quote-${Date.now()}`, title: 'Test-mode role analysis', credits: 20, status: 'Quoted', createdAt: new Date().toISOString() };
    save({ ...credits, acceptedQuotes: [quote, ...quotes] });
  };

  const acceptQuote = () => {
    if (!latest || latest.status !== 'Quoted') return;
    if (credits.balance < latest.credits || latest.credits > credits.spendingLimit) {
      save({ ...credits, acceptedQuotes: quotes.map((quote) => quote.id === latest.id ? { ...quote, status: 'Failed' } : quote) });
      return;
    }
    save({ ...credits, balance: credits.balance - latest.credits, acceptedQuotes: quotes.map((quote) => quote.id === latest.id ? { ...quote, status: 'Accepted' } : quote) });
  };

  const runOrRetry = () => {
    if (!latest || (latest.status !== 'Accepted' && latest.status !== 'Failed')) return;
    save({ ...credits, acceptedQuotes: quotes.map((quote) => quote.id === latest.id ? { ...quote, status: latest.status === 'Accepted' ? 'Failed' : 'Succeeded' } : quote) });
  };

  const refund = () => {
    if (!latest || latest.status !== 'Failed' || credits.balance + latest.credits > credits.spendingLimit) return;
    save({ ...credits, balance: credits.balance + latest.credits, acceptedQuotes: quotes.map((quote) => quote.id === latest.id ? { ...quote, status: 'Refunded' } : quote) });
  };

  return <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2">
    {open && <div className="absolute bottom-12 right-0 w-[290px] rounded-xl border border-[#b7d2c6] bg-[#fbfaf5] p-4 shadow-[0_14px_36px_rgba(31,58,55,.16)]"><div className="flex items-start justify-between gap-3"><div><p className="font-mono text-[10px] font-semibold uppercase tracking-[.12em] text-[#39786f]">Test mode only</p><p className="mt-1 text-sm font-semibold text-[#405056]">Credits & package checks</p></div><button onClick={() => setOpen(false)} className="text-[#87918b]" aria-label="Close tools">×</button></div><div className="mt-4 grid grid-cols-2 gap-2"><div className="rounded-lg bg-[#eef4ef] p-2.5"><p className="text-[10px] text-[#7c8780]">Balance</p><p className="mt-1 font-display text-xl font-semibold text-[#317468]">{credits.balance}</p></div><div className="rounded-lg bg-[#f5e9c4] p-2.5"><p className="text-[10px] text-[#806b39]">Limit</p><p className="mt-1 font-display text-xl font-semibold text-[#916d28]">{credits.spendingLimit}</p></div></div><p className="mt-3 text-[11px] leading-5 text-[#7c8780]">Installed package: Core workforce release + spreadsheet import. No real billing or analysis service is connected.</p>{latest && <div className="mt-3 rounded-lg border border-[#e3ded3] p-2.5"><div className="flex items-center justify-between gap-2"><span className="text-xs font-semibold">{latest.title}</span><span className="text-[10px] font-semibold text-[#39786f]">{latest.status}</span></div><p className="mt-1 text-[11px] text-[#89918d]">{latest.credits} credits · {new Date(latest.createdAt).toLocaleDateString()}</p></div>}<div className="mt-3 grid gap-2"><button onClick={createQuote} className="rounded-lg border border-[#cfd9d2] px-3 py-2 text-xs font-semibold text-[#39786f]">Create quote (20 credits)</button>{latest?.status === 'Quoted' && <button onClick={acceptQuote} className="rounded-lg bg-[#2e7067] px-3 py-2 text-xs font-semibold text-[#f8faf5]">Accept quote</button>}{latest?.status === 'Accepted' && <button onClick={runOrRetry} className="rounded-lg bg-[#c7866c] px-3 py-2 text-xs font-semibold text-white">Run test action (fail)</button>}{latest?.status === 'Failed' && <div className="grid grid-cols-2 gap-2"><button onClick={runOrRetry} className="rounded-lg bg-[#2e7067] px-3 py-2 text-xs font-semibold text-[#f8faf5]">Retry</button><button onClick={refund} className="rounded-lg border border-[#e5bbb1] px-3 py-2 text-xs font-semibold text-[#a75548]">Refund</button></div>}</div></div>}<span className="hidden rounded-lg border border-[#b7d2c6] bg-[#fbfaf5]/95 px-2 py-1.5 text-[10px] font-semibold text-[#39786f] shadow-[0_10px_30px_rgba(31,58,55,.14)] sm:inline">Demo customer</span><select value={session.customerId} aria-label="Switch synthetic demo customer" onChange={(event) => { const customer = demoCustomers.find((item) => item.customerId === event.target.value); if (!customer) return; const next = { ...session, ...customer, synthetic: true, mode: 'demo' }; localStorage.setItem('wa.session', JSON.stringify(next)); window.location.reload(); }} className="h-8 rounded-lg border border-[#d9d5ca] bg-[#fbfaf5] px-2 text-xs font-semibold text-[#405056] outline-none">{demoCustomers.map((customer) => <option key={customer.customerId} value={customer.customerId}>{customer.customerName}</option>)}</select><button onClick={() => setOpen(!open)} className="h-8 rounded-lg border border-[#b7d2c6] bg-[#fbfaf5] px-2.5 text-[10px] font-semibold text-[#39786f] shadow-[0_10px_30px_rgba(31,58,55,.14)]">{credits.balance} credits</button></div>;
}

function DemoCustomerSwitcher() {
  const [session, setSession] = useState<DemoSession | null>(() => readDemoSession());

  useEffect(() => {
    const timer = window.setInterval(() => setSession(readDemoSession()), 500);
    return () => window.clearInterval(timer);
  }, []);

  if (!session?.synthetic) return null;

  return <DemoWorkspaceTools session={session} />;
}

export default function App() {
  return (
    <>
      <WorkforceApp />
      <DemoCustomerSwitcher />
    </>
  );
}