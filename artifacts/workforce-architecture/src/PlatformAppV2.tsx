import { useMemo, useState } from 'react';
import { ArrowRight, Bot, BriefcaseBusiness, Building2, CheckCircle2, CircleDollarSign, FileText, Gauge, LockKeyhole, Save, Search, ShieldCheck, Sparkles, Users, WandSparkles, Workflow } from 'lucide-react';
import WorkforceApp from './WorkforceApp';

type View = 'home' | 'workforce';
type DiagnosticAnswer = { teamSize: string; industry: string; priority: string; pain: string; hours: string };
type DiagnosticResult = { score: number; headline: string; summary: string; recommendations: Array<{ title: string; detail: string }>; source?: string };
type Workspace = { companyName: string; industry: string; teamSize: string; country: string; goals: string; lastDiagnostic?: DiagnosticResult };
type MarginInput = { contractValue: string; plannedCost: string; actualCost: string; percentComplete: string; approvedChanges: string; unapprovedScope: string };

const WORKSPACE_KEY = 'northstar.businessWorkspace.v1';

function readWorkspace(): Workspace {
  try {
    const raw = localStorage.getItem(WORKSPACE_KEY);
    return raw ? JSON.parse(raw) : { companyName: '', industry: '', teamSize: '11-50', country: 'Canada', goals: '' };
  } catch {
    return { companyName: '', industry: '', teamSize: '11-50', country: 'Canada', goals: '' };
  }
}

function writeWorkspace(workspace: Workspace) {
  localStorage.setItem(WORKSPACE_KEY, JSON.stringify(workspace));
}

function deterministicDiagnostic(answer: DiagnosticAnswer): DiagnosticResult {
  const hours = Number(answer.hours || 0);
  let score = 42;
  if (hours >= 5) score += 12;
  if (hours >= 15) score += 12;
  if (['margin', 'operations', 'workforce'].includes(answer.priority)) score += 10;
  if (answer.pain.trim().length > 60) score += 8;
  if (['11-50', '51-250', '251-499'].includes(answer.teamSize)) score += 8;
  return {
    score: Math.min(score, 92),
    headline: 'Start with value, then choose the technology.',
    summary: `For a ${answer.teamSize} person ${answer.industry || 'SMB'}, start with one measurable workflow, a clear owner and a human approval point for material decisions.`,
    recommendations: [
      { title: 'Automate one repeated workflow first', detail: `Start with a process consuming roughly ${answer.hours || 10} hours per week and measure the baseline.` },
      { title: answer.priority === 'margin' ? 'Run Project Margin Analyzer' : 'Run AI Opportunity Map', detail: answer.priority === 'margin' ? 'Quantify cost-to-complete, scope exposure and decisions before adding automation.' : 'Map work, systems, decision rights and risks before selecting an agent.' },
      { title: 'Create a 30-day value baseline', detail: 'Track hours, cycle time, error rate and cost so the business can prove whether the intervention improves the outcome.' },
    ],
    source: 'browser-fallback',
  };
}

function Modal({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0f2b2a]/45 p-4 backdrop-blur-sm"><div className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-[28px] border border-[#d9e6df] bg-[#fbfaf6] shadow-2xl">{children}<div className="px-6 pb-6 text-right"><button onClick={onClose} className="rounded-xl border border-[#d7ddd8] px-4 py-2 text-sm font-semibold text-[#546762]">Close</button></div></div></div>;
}

function WorkspaceEditor({ onClose }: { onClose: () => void }) {
  const [workspace, setWorkspace] = useState(readWorkspace);
  const [saved, setSaved] = useState(false);
  const save = () => { writeWorkspace(workspace); setSaved(true); };
  return <Modal onClose={onClose}><div className="border-b border-[#e4e8e0] px-6 py-5 sm:px-8"><p className="font-mono text-[11px] font-semibold uppercase tracking-[.18em] text-[#38786d]">Business Workspace</p><h2 className="mt-1 text-2xl font-semibold text-[#233c3a]">Create your reusable company context</h2><p className="mt-2 text-sm text-[#6b7874]">Saved locally in this beta. Every platform tool can reuse this context instead of asking the same questions again.</p></div><div className="grid gap-5 p-6 sm:grid-cols-2 sm:p-8">
    <label className="grid gap-2 text-sm font-semibold">Company name<input value={workspace.companyName} onChange={e=>setWorkspace({...workspace,companyName:e.target.value})} className="rounded-xl border bg-white px-4 py-3 font-normal" /></label>
    <label className="grid gap-2 text-sm font-semibold">Industry<input value={workspace.industry} onChange={e=>setWorkspace({...workspace,industry:e.target.value})} className="rounded-xl border bg-white px-4 py-3 font-normal" /></label>
    <label className="grid gap-2 text-sm font-semibold">Team size<select value={workspace.teamSize} onChange={e=>setWorkspace({...workspace,teamSize:e.target.value})} className="rounded-xl border bg-white px-4 py-3 font-normal"><option>1-10</option><option>11-50</option><option>51-250</option><option>251-499</option></select></label>
    <label className="grid gap-2 text-sm font-semibold">Primary market<input value={workspace.country} onChange={e=>setWorkspace({...workspace,country:e.target.value})} className="rounded-xl border bg-white px-4 py-3 font-normal" /></label>
    <label className="grid gap-2 text-sm font-semibold sm:col-span-2">Business goals<textarea rows={4} value={workspace.goals} onChange={e=>setWorkspace({...workspace,goals:e.target.value})} className="rounded-xl border bg-white px-4 py-3 font-normal" /></label>
    <div className="sm:col-span-2 flex items-center justify-between"><span className="text-sm text-[#4b746c]">{saved ? 'Workspace saved.' : 'Use this once, then reuse it across tools.'}</span><button onClick={save} className="inline-flex items-center gap-2 rounded-xl bg-[#2d6f66] px-5 py-3 text-sm font-semibold text-white"><Save size={16}/> Save workspace</button></div>
  </div></Modal>;
}

function OpportunityDiagnostic({ onClose, onOpenWorkspace }: { onClose: () => void; onOpenWorkspace: () => void }) {
  const workspace = readWorkspace();
  const [answer, setAnswer] = useState<DiagnosticAnswer>({ teamSize: workspace.teamSize || '11-50', industry: workspace.industry || '', priority: 'operations', pain: '', hours: '10' });
  const [result, setResult] = useState<DiagnosticResult | null>(null);
  const [loading, setLoading] = useState(false);
  const run = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/ai/opportunity-diagnostic', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(answer) });
      if (!response.ok) throw new Error('diagnostic failed');
      const data = await response.json() as DiagnosticResult;
      setResult(data);
      writeWorkspace({ ...workspace, industry: answer.industry, teamSize: answer.teamSize, lastDiagnostic: data });
    } catch {
      const fallback = deterministicDiagnostic(answer);
      setResult(fallback);
      writeWorkspace({ ...workspace, industry: answer.industry, teamSize: answer.teamSize, lastDiagnostic: fallback });
    } finally { setLoading(false); }
  };
  return <Modal onClose={onClose}><div className="border-b border-[#e4e8e0] px-6 py-5 sm:px-8"><p className="font-mono text-[11px] font-semibold uppercase tracking-[.18em] text-[#38786d]">Free diagnostic · Canada beta</p><h2 className="mt-1 text-2xl font-semibold text-[#233c3a]">AI Opportunity Diagnostic</h2></div>{!result ? <div className="p-6 sm:p-8"><div className="grid gap-5 sm:grid-cols-2">
    <label className="grid gap-2 text-sm font-semibold">Team size<select value={answer.teamSize} onChange={e=>setAnswer({...answer,teamSize:e.target.value})} className="rounded-xl border bg-white px-4 py-3 font-normal"><option>1-10</option><option>11-50</option><option>51-250</option><option>251-499</option></select></label>
    <label className="grid gap-2 text-sm font-semibold">Industry<input value={answer.industry} onChange={e=>setAnswer({...answer,industry:e.target.value})} className="rounded-xl border bg-white px-4 py-3 font-normal" placeholder="e.g. consulting" /></label>
    <label className="grid gap-2 text-sm font-semibold">Main priority<select value={answer.priority} onChange={e=>setAnswer({...answer,priority:e.target.value})} className="rounded-xl border bg-white px-4 py-3 font-normal"><option value="operations">Save operational time</option><option value="margin">Improve project margin</option><option value="workforce">Build the workforce</option><option value="growth">Grow revenue</option><option value="governance">Introduce AI safely</option></select></label>
    <label className="grid gap-2 text-sm font-semibold">Hours/week on this problem<input type="number" min="0" value={answer.hours} onChange={e=>setAnswer({...answer,hours:e.target.value})} className="rounded-xl border bg-white px-4 py-3 font-normal" /></label>
    <label className="grid gap-2 text-sm font-semibold sm:col-span-2">What is happening today?<textarea rows={5} value={answer.pain} onChange={e=>setAnswer({...answer,pain:e.target.value})} className="rounded-xl border bg-white px-4 py-3 font-normal" /></label>
  </div><div className="mt-6 text-right"><button onClick={run} disabled={loading || !answer.industry.trim() || !answer.pain.trim()} className="rounded-xl bg-[#2d6f66] px-5 py-3 text-sm font-semibold text-white disabled:opacity-40">{loading ? 'Analysing…' : 'Generate opportunity map'}</button></div></div> : <div className="p-6 sm:p-8"><div className="grid gap-5 lg:grid-cols-[220px_1fr]"><div className="rounded-2xl bg-[#e8f2ed] p-5"><p className="text-xs font-semibold uppercase tracking-[.16em] text-[#5b7b74]">Opportunity score</p><p className="mt-4 text-6xl font-semibold text-[#2d6f66]">{result.score}</p><p className="text-sm text-[#57706b]">/ 100</p><p className="mt-4 text-xs text-[#6a7774]">Source: {result.source || 'analysis service'}</p></div><div><div className="flex items-center gap-2 text-[#2d6f66]"><CheckCircle2 size={18}/><span className="text-sm font-semibold">Prioritised opportunity</span></div><h3 className="mt-3 text-2xl font-semibold">{result.headline}</h3><p className="mt-3 text-sm leading-7 text-[#65736f]">{result.summary}</p><div className="mt-5 grid gap-3">{result.recommendations.map((item,i)=><div key={item.title} className="rounded-xl border bg-white p-4"><p className="font-semibold">{i+1}. {item.title}</p><p className="mt-1 text-sm leading-6 text-[#6a7774]">{item.detail}</p></div>)}</div></div></div><div className="mt-6 flex justify-end"><button onClick={onOpenWorkspace} className="rounded-xl bg-[#2d6f66] px-5 py-3 text-sm font-semibold text-white">Open Business Workspace</button></div></div>}</Modal>;
}

function ProjectMarginAnalyzer({ onClose }: { onClose: () => void }) {
  const [input, setInput] = useState<MarginInput>({ contractValue: '100000', plannedCost: '55000', actualCost: '30000', percentComplete: '50', approvedChanges: '0', unapprovedScope: '0' });
  const metrics = useMemo(()=>{
    const value = Number(input.contractValue||0)+Number(input.approvedChanges||0);
    const planned = Number(input.plannedCost||0); const actual = Number(input.actualCost||0); const pct = Math.max(1,Number(input.percentComplete||0))/100;
    const forecastCost = Math.max(actual, actual/pct); const forecastMargin = value-forecastCost; const marginPct = value ? forecastMargin/value*100 : 0; const variance = forecastCost-planned; const unapproved = Number(input.unapprovedScope||0);
    const risk = marginPct < 30 || variance > value*0.1 ? 'High' : marginPct < 45 || variance > 0 ? 'Watch' : 'Healthy';
    return { value, forecastCost, forecastMargin, marginPct, variance, unapproved, risk };
  },[input]);
  const money=(n:number)=>new Intl.NumberFormat('en-CA',{style:'currency',currency:'CAD',maximumFractionDigits:0}).format(n);
  return <Modal onClose={onClose}><div className="border-b border-[#e4e8e0] px-6 py-5 sm:px-8"><p className="font-mono text-[11px] font-semibold uppercase tracking-[.18em] text-[#38786d]">Projects & Profit · Beta</p><h2 className="mt-1 text-2xl font-semibold">Project Margin Analyzer</h2><p className="mt-2 text-sm text-[#6b7874]">A management diagnostic, not accounting advice. Enter current project economics to see cost-to-complete and margin pressure.</p></div><div className="grid gap-6 p-6 sm:p-8 lg:grid-cols-[1fr_.9fr]"><div className="grid gap-4 sm:grid-cols-2">{[
    ['Contract value','contractValue'],['Planned delivery cost','plannedCost'],['Actual cost to date','actualCost'],['% complete','percentComplete'],['Approved changes','approvedChanges'],['Potential unapproved scope','unapprovedScope']
  ].map(([label,key])=><label key={key} className="grid gap-2 text-sm font-semibold">{label}<input type="number" value={input[key as keyof MarginInput]} onChange={e=>setInput({...input,[key]:e.target.value})} className="rounded-xl border bg-white px-4 py-3 font-normal"/></label>)}</div><div className="rounded-2xl bg-[#eef4ef] p-5"><div className="flex items-center justify-between"><p className="text-xs font-semibold uppercase tracking-[.16em] text-[#5b7b74]">Forecast status</p><span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-[#2d6f66]">{metrics.risk}</span></div><div className="mt-5 grid grid-cols-2 gap-3"><Metric label="Forecast cost" value={money(metrics.forecastCost)}/><Metric label="Forecast margin" value={money(metrics.forecastMargin)}/><Metric label="Margin %" value={`${metrics.marginPct.toFixed(1)}%`}/><Metric label="Cost variance" value={money(metrics.variance)}/></div><div className="mt-5 rounded-xl bg-white p-4 text-sm leading-6 text-[#5e6d69]"><p className="font-semibold text-[#344b48]">Management actions</p><p className="mt-2">{metrics.variance>0?'Forecast cost is above plan. Revalidate remaining effort and resource mix.':'Current cost trajectory is within planned delivery cost.'}</p><p className="mt-2">{metrics.unapproved>0?`${money(metrics.unapproved)} of potential unapproved scope should be classified and commercially reviewed before more effort is committed.`:'No unapproved scope value entered.'}</p></div></div></div></Modal>;
}

function Metric({label,value}:{label:string;value:string}){return <div className="rounded-xl bg-white p-3"><p className="text-[11px] text-[#74817d]">{label}</p><p className="mt-1 text-xl font-semibold text-[#294b46]">{value}</p></div>}

function Home({ openWorkforce }: { openWorkforce:()=>void }) {
  const [diagnostic,setDiagnostic]=useState(false); const [workspace,setWorkspace]=useState(false); const [margin,setMargin]=useState(false); const [query,setQuery]=useState('');
  const tools=[
    {title:'AI Opportunity Diagnostic',desc:'Find the highest-value workflow to improve before you buy or build more AI.',status:'Live',icon:Sparkles,action:()=>setDiagnostic(true)},
    {title:'Project Margin Analyzer',desc:'Understand cost-to-complete, margin pressure, scope leakage and management actions.',status:'Beta',icon:Gauge,action:()=>setMargin(true)},
    {title:'Human + AI Workforce Designer',desc:'Design roles, skills and work allocation across people, agents and hybrid roles.',status:'Beta',icon:Users,action:openWorkforce},
    {title:'Job Description Builder',desc:'Create practical role profiles for growing teams using your business context.',status:'Coming soon',icon:FileText,action:()=>{}},
  ].filter(t=>`${t.title} ${t.desc}`.toLowerCase().includes(query.toLowerCase()));
  return <div className="min-h-screen bg-[#f7f6f1] text-[#263c3a]">{diagnostic&&<OpportunityDiagnostic onClose={()=>setDiagnostic(false)} onOpenWorkspace={()=>{setDiagnostic(false);setWorkspace(true)}}/>}{workspace&&<WorkspaceEditor onClose={()=>setWorkspace(false)}/>} {margin&&<ProjectMarginAnalyzer onClose={()=>setMargin(false)}/>}<header className="sticky top-0 z-50 border-b border-[#dde4df] bg-[#f7f6f1]/95 backdrop-blur"><div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8"><div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#2d6f66] text-white"><WandSparkles size={20}/></span><span><span className="block text-sm font-bold">Northstar AI</span><span className="block text-[10px] uppercase tracking-[.15em] text-[#7a8985]">Working brand · Canada</span></span></div><nav className="hidden gap-6 lg:flex"><a href="#tools" className="text-sm font-medium">Tools</a><a href="#agents" className="text-sm font-medium">Agents</a><a href="#workspace" className="text-sm font-medium">Workspace</a></nav><button onClick={()=>setWorkspace(true)} className="rounded-xl border border-[#b9ccc4] bg-white px-4 py-2.5 text-sm font-semibold text-[#2d6f66]">Business Workspace</button></div></header><main><section className="mx-auto grid max-w-7xl gap-10 px-5 py-16 sm:px-8 lg:grid-cols-[1.05fr_.95fr] lg:py-20"><div><div className="inline-flex items-center gap-2 rounded-full border border-[#cfe0d8] bg-[#edf5f1] px-3 py-1.5 text-xs font-semibold text-[#39796f]">🇨🇦 Built for Canadian SMBs · designed to scale globally</div><h1 className="mt-6 text-5xl font-semibold leading-[1.02] tracking-[-.04em] text-[#203a37] sm:text-6xl">Run a stronger business with practical AI.</h1><p className="mt-6 max-w-2xl text-lg leading-8 text-[#667571]">Tools, digital workers and workforce intelligence for growing businesses — without enterprise software complexity.</p><div className="mt-8 flex flex-wrap gap-3"><button onClick={()=>setDiagnostic(true)} className="inline-flex items-center gap-2 rounded-xl bg-[#2d6f66] px-5 py-3.5 text-sm font-semibold text-white">Find my best AI opportunity <ArrowRight size={17}/></button><button onClick={()=>setMargin(true)} className="rounded-xl border bg-white px-5 py-3.5 text-sm font-semibold">Check project margin</button></div><div className="mt-7 flex flex-wrap gap-4 text-xs text-[#6c7c78]"><span className="inline-flex items-center gap-1.5"><LockKeyhole size={13}/> Canada-first architecture</span><span className="inline-flex items-center gap-1.5"><ShieldCheck size={13}/> Human approvals</span><span className="inline-flex items-center gap-1.5"><Building2 size={13}/> SMB-first</span></div></div><div className="rounded-[30px] border bg-white p-7 shadow-[0_30px_70px_rgba(36,72,67,.12)]"><p className="text-xs font-semibold uppercase tracking-[.16em] text-[#5b7b74]">How it works</p><div className="mt-5 grid gap-4">{[['1','Tell us the outcome','Start with the business problem, not an AI model.'],['2','Use the right tool','Run a focused diagnostic, analyzer or workforce workflow.'],['3','Save context','Reuse your Business Workspace across tools.'],['4','Add agents carefully','Automate only proven work with clear approvals.']].map(([n,t,d])=><div key={n} className="flex gap-4 rounded-xl bg-[#f6f7f3] p-4"><span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#e5f0eb] text-sm font-bold text-[#2d6f66]">{n}</span><div><p className="font-semibold">{t}</p><p className="mt-1 text-sm text-[#6b7874]">{d}</p></div></div>)}</div></div></section><section id="tools" className="mx-auto max-w-7xl px-5 py-14 sm:px-8"><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-xs font-semibold uppercase tracking-[.16em] text-[#5b7b74]">Tool storefront</p><h2 className="mt-2 text-3xl font-semibold">Start with a business outcome.</h2></div><div className="relative"><Search size={16} className="absolute left-3 top-3.5 text-[#87928f]"/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search tools" className="rounded-xl border bg-white py-3 pl-10 pr-4 text-sm"/></div></div><div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-4">{tools.map(t=><button key={t.title} onClick={t.action} className="rounded-2xl border bg-white p-5 text-left shadow-sm transition hover:-translate-y-1"><div className="flex items-start justify-between"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#edf4f0] text-[#2d6f66]"><t.icon size={19}/></span><span className="rounded-full bg-[#f3f4ef] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide">{t.status}</span></div><h3 className="mt-5 text-lg font-semibold">{t.title}</h3><p className="mt-2 text-sm leading-6 text-[#6b7874]">{t.desc}</p></button>)}</div></section><section id="agents" className="mx-auto max-w-7xl px-5 py-14 sm:px-8"><div className="rounded-[28px] bg-[#203a37] p-7 text-white sm:p-10"><div className="flex items-center gap-3"><Bot/><p className="text-xs font-semibold uppercase tracking-[.16em] text-[#a8cbc1]">Managed agents</p></div><h2 className="mt-4 text-3xl font-semibold">Agents are workers with controls — not chat buttons.</h2><p className="mt-4 max-w-3xl text-sm leading-7 text-[#d4e1dd]">Every future agent gets a role, objective, tools, permissions, trigger, state, approval gates, logs, cost controls and KPIs before it can act for a customer.</p></div></section></main></div>;
}

export default function PlatformAppV2(){const [view,setView]=useState<View>('home'); if(view==='workforce') return <div><div className="sticky top-0 z-[90] border-b bg-[#f7f6f1] p-3"><button onClick={()=>setView('home')} className="rounded-xl border bg-white px-4 py-2 text-sm font-semibold">← Back to platform</button></div><WorkforceApp/></div>; return <Home openWorkforce={()=>setView('workforce')}/>;}
