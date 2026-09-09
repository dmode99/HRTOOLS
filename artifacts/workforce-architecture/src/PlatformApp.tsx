import { useMemo, useState } from 'react';
import {
  ArrowRight,
  Bot,
  BriefcaseBusiness,
  Building2,
  CheckCircle2,
  CircleDollarSign,
  FileText,
  Gauge,
  LayoutGrid,
  LockKeyhole,
  MessageSquareMore,
  PackageOpen,
  Search,
  ShieldCheck,
  Sparkles,
  Store,
  Users,
  WandSparkles,
  Workflow,
} from 'lucide-react';
import WorkforceApp from './WorkforceApp';

type View = 'home' | 'workforce';
type ToolStatus = 'Live' | 'Beta' | 'Coming soon';
type DiagnosticAnswer = {
  teamSize: string;
  industry: string;
  priority: string;
  pain: string;
  hours: string;
};

type ToolCard = {
  title: string;
  description: string;
  category: string;
  status: ToolStatus;
  action: string;
  icon: typeof Gauge;
  onClick?: () => void;
};

const navItems = ['Discover', 'Tools', 'Agents', 'Downloads', 'Learn', 'Community'];

const outcomeCards = [
  { title: 'Save time', description: 'Find repetitive work and identify safe AI automation opportunities.', icon: Workflow },
  { title: 'Improve project profit', description: 'Surface margin pressure, scope drift and delivery risks earlier.', icon: CircleDollarSign },
  { title: 'Build my workforce', description: 'Design roles, skills, structures and the right human + AI mix.', icon: Users },
  { title: 'Introduce AI safely', description: 'Prioritize practical use cases with clear controls and ownership.', icon: ShieldCheck },
];

function scoreDiagnostic(answer: DiagnosticAnswer) {
  const hours = Number(answer.hours || 0);
  let score = 42;
  if (hours >= 5) score += 12;
  if (hours >= 15) score += 12;
  if (['margin', 'operations', 'workforce'].includes(answer.priority)) score += 10;
  if (answer.pain.trim().length > 60) score += 8;
  if (['11-50', '51-250', '251-499'].includes(answer.teamSize)) score += 8;
  return Math.min(score, 92);
}

function OpportunityDiagnostic({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState(0);
  const [answer, setAnswer] = useState<DiagnosticAnswer>({
    teamSize: '11-50',
    industry: '',
    priority: 'operations',
    pain: '',
    hours: '10',
  });
  const score = useMemo(() => scoreDiagnostic(answer), [answer]);

  const recommendations = useMemo(() => {
    const items = [
      {
        title: 'Automate one repeated workflow first',
        detail: `Start with a process consuming roughly ${answer.hours || '10'} hours per week and keep a human approval point for material decisions.`,
      },
      {
        title: answer.priority === 'margin' ? 'Run Project Margin Analyzer' : 'Run AI Opportunity Map',
        detail: answer.priority === 'margin'
          ? 'Quantify cost-to-complete, scope exposure and management actions before adding more automation.'
          : 'Map the work, decision rights, systems and risks before choosing an agent or tool.',
      },
      {
        title: 'Create a 30-day value baseline',
        detail: 'Capture current hours, cycle time, error rate and cost so the business can prove whether AI actually improves the outcome.',
      },
    ];
    return items;
  }, [answer]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0f2b2a]/45 p-4 backdrop-blur-sm">
      <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-[28px] border border-[#d9e6df] bg-[#fbfaf6] shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#e4e8e0] px-6 py-5 sm:px-8">
          <div>
            <p className="font-mono text-[11px] font-semibold uppercase tracking-[.18em] text-[#38786d]">Free diagnostic · Canada beta</p>
            <h2 className="mt-1 text-2xl font-semibold text-[#233c3a]">AI Opportunity Diagnostic</h2>
          </div>
          <button onClick={onClose} className="rounded-full border border-[#d9ded8] px-3 py-1.5 text-sm text-[#667471]">Close</button>
        </div>

        {step === 0 && (
          <div className="p-6 sm:p-8">
            <div className="grid gap-5 sm:grid-cols-2">
              <label className="grid gap-2 text-sm font-semibold text-[#344b48]">Team size
                <select value={answer.teamSize} onChange={(e) => setAnswer({ ...answer, teamSize: e.target.value })} className="rounded-xl border border-[#d9dfda] bg-white px-4 py-3 font-normal outline-none focus:border-[#4b8d82]">
                  <option>1-10</option><option>11-50</option><option>51-250</option><option>251-499</option>
                </select>
              </label>
              <label className="grid gap-2 text-sm font-semibold text-[#344b48]">Industry
                <input value={answer.industry} onChange={(e) => setAnswer({ ...answer, industry: e.target.value })} placeholder="e.g. consulting, construction, healthcare" className="rounded-xl border border-[#d9dfda] bg-white px-4 py-3 font-normal outline-none focus:border-[#4b8d82]" />
              </label>
              <label className="grid gap-2 text-sm font-semibold text-[#344b48]">Main priority
                <select value={answer.priority} onChange={(e) => setAnswer({ ...answer, priority: e.target.value })} className="rounded-xl border border-[#d9dfda] bg-white px-4 py-3 font-normal outline-none focus:border-[#4b8d82]">
                  <option value="operations">Save operational time</option>
                  <option value="margin">Improve project margin</option>
                  <option value="workforce">Build the workforce</option>
                  <option value="growth">Grow revenue</option>
                  <option value="governance">Introduce AI safely</option>
                </select>
              </label>
              <label className="grid gap-2 text-sm font-semibold text-[#344b48]">Hours spent each week on the problem
                <input type="number" min="0" value={answer.hours} onChange={(e) => setAnswer({ ...answer, hours: e.target.value })} className="rounded-xl border border-[#d9dfda] bg-white px-4 py-3 font-normal outline-none focus:border-[#4b8d82]" />
              </label>
            </div>
            <label className="mt-5 grid gap-2 text-sm font-semibold text-[#344b48]">What is happening today?
              <textarea value={answer.pain} onChange={(e) => setAnswer({ ...answer, pain: e.target.value })} rows={5} placeholder="Describe the manual work, bottleneck, cost, delay or risk you want to improve." className="rounded-xl border border-[#d9dfda] bg-white px-4 py-3 font-normal outline-none focus:border-[#4b8d82]" />
            </label>
            <div className="mt-6 flex justify-end">
              <button onClick={() => setStep(1)} disabled={!answer.industry.trim() || !answer.pain.trim()} className="inline-flex items-center gap-2 rounded-xl bg-[#2d6f66] px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40">Generate opportunity map <ArrowRight size={16} /></button>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="p-6 sm:p-8">
            <div className="grid gap-5 lg:grid-cols-[220px_1fr]">
              <div className="rounded-2xl bg-[#e8f2ed] p-5">
                <p className="text-xs font-semibold uppercase tracking-[.16em] text-[#5b7b74]">Opportunity score</p>
                <p className="mt-4 text-6xl font-semibold tracking-tight text-[#2d6f66]">{score}</p>
                <p className="mt-1 text-sm text-[#57706b]">/ 100</p>
                <p className="mt-5 text-sm leading-6 text-[#48615d]">A prioritisation score, not a promise of savings. Validate the highest-value workflow before scaling.</p>
              </div>
              <div>
                <div className="flex items-center gap-2 text-[#2d6f66]"><CheckCircle2 size={18} /><span className="text-sm font-semibold">Good candidate for a focused AI pilot</span></div>
                <h3 className="mt-3 text-2xl font-semibold text-[#233c3a]">Start with value, then choose the technology.</h3>
                <p className="mt-3 text-sm leading-7 text-[#65736f]">For a {answer.teamSize} person {answer.industry} business, the first target should be a measurable workflow with a clear owner, stable inputs and an agreed human approval point.</p>
                <div className="mt-5 grid gap-3">
                  {recommendations.map((item, index) => (
                    <div key={item.title} className="rounded-xl border border-[#dde4df] bg-white p-4">
                      <div className="flex gap-3"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#edf4f0] text-xs font-bold text-[#2d6f66]">{index + 1}</span><div><p className="font-semibold text-[#344b48]">{item.title}</p><p className="mt-1 text-sm leading-6 text-[#6a7774]">{item.detail}</p></div></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="mt-7 flex flex-col gap-3 rounded-2xl border border-[#eadfbf] bg-[#fff8e8] p-5 sm:flex-row sm:items-center sm:justify-between">
              <div><p className="font-semibold text-[#5c5035]">Next platform step</p><p className="mt-1 text-sm text-[#756b53]">Save this assessment to a Business Workspace and turn the top recommendation into a tracked implementation plan.</p></div>
              <button className="whitespace-nowrap rounded-xl bg-[#2d6f66] px-4 py-2.5 text-sm font-semibold text-white">Create workspace</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function PlatformHome({ openWorkforce }: { openWorkforce: () => void }) {
  const [diagnosticOpen, setDiagnosticOpen] = useState(false);
  const [query, setQuery] = useState('');

  const tools: ToolCard[] = [
    { title: 'AI Opportunity Diagnostic', description: 'Find the highest-value workflow to improve before you buy or build more AI.', category: 'Run my business', status: 'Live', action: 'Start free', icon: Sparkles, onClick: () => setDiagnosticOpen(true) },
    { title: 'Project Margin Analyzer', description: 'Understand cost-to-complete, margin pressure, scope leakage and management actions.', category: 'Projects & profit', status: 'Beta', action: 'Preview', icon: Gauge },
    { title: 'Human + AI Workforce Designer', description: 'Design roles, skills and work allocation across people, agents and hybrid roles.', category: 'People & workforce', status: 'Beta', action: 'Open workforce app', icon: Users, onClick: openWorkforce },
    { title: 'Job Description Builder', description: 'Create practical role profiles for growing teams using your business context.', category: 'People & workforce', status: 'Coming soon', action: 'Join waitlist', icon: FileText },
  ];

  const visibleTools = tools.filter((tool) => `${tool.title} ${tool.description} ${tool.category}`.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="min-h-screen bg-[#f7f6f1] text-[#263c3a]">
      {diagnosticOpen && <OpportunityDiagnostic onClose={() => setDiagnosticOpen(false)} />}
      <header className="sticky top-0 z-50 border-b border-[#dde4df] bg-[#f7f6f1]/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4 sm:px-8">
          <button className="flex items-center gap-3 text-left">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#2d6f66] text-white"><WandSparkles size={20} /></span>
            <span><span className="block text-sm font-bold tracking-tight">Northstar AI</span><span className="block text-[10px] uppercase tracking-[.15em] text-[#7a8985]">Working brand · Canada</span></span>
          </button>
          <nav className="hidden items-center gap-6 lg:flex">{navItems.map((item) => <a key={item} href={`#${item.toLowerCase()}`} className="text-sm font-medium text-[#5c6c68] hover:text-[#2d6f66]">{item}</a>)}</nav>
          <div className="flex items-center gap-2"><button className="hidden rounded-xl px-3 py-2 text-sm font-semibold text-[#4c615d] sm:block">Sign in</button><button onClick={() => setDiagnosticOpen(true)} className="rounded-xl bg-[#2d6f66] px-4 py-2.5 text-sm font-semibold text-white">Start free</button></div>
        </div>
      </header>

      <main>
        <section className="mx-auto grid max-w-7xl gap-10 px-5 pb-16 pt-14 sm:px-8 lg:grid-cols-[1.05fr_.95fr] lg:items-center lg:pb-20 lg:pt-20">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#cfe0d8] bg-[#edf5f1] px-3 py-1.5 text-xs font-semibold text-[#39796f]"><span>🇨🇦</span> Built for Canadian SMBs · designed to scale globally</div>
            <h1 className="mt-6 max-w-3xl text-5xl font-semibold leading-[1.02] tracking-[-.04em] text-[#203a37] sm:text-6xl">Run a stronger business with practical AI.</h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-[#667571]">Tools, digital workers and workforce intelligence for growing businesses — without enterprise software complexity.</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row"><button onClick={() => setDiagnosticOpen(true)} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#2d6f66] px-5 py-3.5 text-sm font-semibold text-white">Find my best AI opportunity <ArrowRight size={17} /></button><button onClick={openWorkforce} className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#cfd9d4] bg-white px-5 py-3.5 text-sm font-semibold text-[#3f5954]">Explore workforce tools</button></div>
            <div className="mt-7 flex flex-wrap gap-x-5 gap-y-2 text-xs font-medium text-[#6c7c78]"><span className="inline-flex items-center gap-1.5"><LockKeyhole size={13} /> Canada-first architecture</span><span className="inline-flex items-center gap-1.5"><ShieldCheck size={13} /> Human approvals for material actions</span><span className="inline-flex items-center gap-1.5"><Building2 size={13} /> SMB-first</span></div>
          </div>

          <div className="relative rounded-[30px] border border-[#dce4df] bg-white p-5 shadow-[0_30px_70px_rgba(36,72,67,.12)] sm:p-7">
            <div className="flex items-center justify-between"><div><p className="text-xs font-semibold uppercase tracking-[.15em] text-[#7b8b86]">Business workspace</p><h2 className="mt-1 text-xl font-semibold">Your AI operating centre</h2></div><span className="rounded-full bg-[#eaf4ef] px-3 py-1 text-xs font-semibold text-[#35766c]">Demo</span></div>
            <div className="mt-6 grid grid-cols-2 gap-3">
              {[['AI opportunities','7','3 ready to test'],['Agent tasks','12','2 need approval'],['Hours identified','34h','per week'],['Value tracking','4','active baselines']].map(([label,value,meta]) => <div key={label} className="rounded-2xl bg-[#f5f6f2] p-4"><p className="text-xs text-[#71807c]">{label}</p><p className="mt-2 text-2xl font-semibold text-[#284b46]">{value}</p><p className="mt-1 text-[11px] text-[#8b9793]">{meta}</p></div>)}
            </div>
            <div className="mt-4 rounded-2xl border border-[#e1e6e1] p-4"><div className="flex items-center justify-between"><p className="text-sm font-semibold">Recommended next action</p><Bot size={18} className="text-[#39796f]" /></div><p className="mt-2 text-sm leading-6 text-[#697874]">Review project status reporting. The process appears repeatable, rules-based and suitable for a controlled AI pilot.</p><button onClick={() => setDiagnosticOpen(true)} className="mt-4 text-sm font-semibold text-[#2d6f66]">Review opportunity →</button></div>
          </div>
        </section>

        <section className="border-y border-[#e0e5df] bg-white/70">
          <div className="mx-auto max-w-7xl px-5 py-12 sm:px-8">
            <div className="max-w-2xl"><p className="text-xs font-semibold uppercase tracking-[.16em] text-[#3b7b70]">Start with the outcome</p><h2 className="mt-2 text-3xl font-semibold tracking-[-.025em]">What do you want to improve?</h2></div>
            <div className="mt-7 grid gap-4 md:grid-cols-2 xl:grid-cols-4">{outcomeCards.map((item) => { const Icon = item.icon; return <button key={item.title} className="group rounded-2xl border border-[#dfe5e0] bg-[#fbfbf8] p-5 text-left transition hover:-translate-y-0.5 hover:border-[#b9d1c8] hover:shadow-lg"><Icon size={22} className="text-[#2d6f66]" /><h3 className="mt-5 font-semibold">{item.title}</h3><p className="mt-2 text-sm leading-6 text-[#71807c]">{item.description}</p><span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-[#39796f]">Find tools <ArrowRight size={13} /></span></button> })}</div>
          </div>
        </section>

        <section id="tools" className="mx-auto max-w-7xl px-5 py-16 sm:px-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between"><div><p className="text-xs font-semibold uppercase tracking-[.16em] text-[#3b7b70]">Tool storefront</p><h2 className="mt-2 text-3xl font-semibold tracking-[-.025em]">Practical tools for growing businesses</h2><p className="mt-3 max-w-2xl text-sm leading-6 text-[#71807c]">Start free, use credits for premium analysis, or add expert support when the problem needs implementation rather than another report.</p></div><label className="flex w-full max-w-sm items-center gap-2 rounded-xl border border-[#d8dfda] bg-white px-3 py-2.5"><Search size={16} className="text-[#82908c]" /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search tools" className="w-full bg-transparent text-sm outline-none" /></label></div>
          <div className="mt-8 grid gap-5 md:grid-cols-2">{visibleTools.map((tool) => { const Icon = tool.icon; return <article key={tool.title} className="rounded-[24px] border border-[#dfe5e0] bg-white p-6 shadow-[0_12px_30px_rgba(39,70,66,.05)]"><div className="flex items-start justify-between gap-4"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#edf4f0] text-[#2d6f66]"><Icon size={21} /></span><span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[.1em] ${tool.status === 'Live' ? 'bg-[#e8f5ed] text-[#327159]' : tool.status === 'Beta' ? 'bg-[#fff4d9] text-[#856a2c]' : 'bg-[#f0f1ef] text-[#76817e]'}`}>{tool.status}</span></div><p className="mt-5 text-xs font-semibold uppercase tracking-[.12em] text-[#83908c]">{tool.category}</p><h3 className="mt-2 text-xl font-semibold">{tool.title}</h3><p className="mt-3 text-sm leading-6 text-[#6d7b77]">{tool.description}</p><button onClick={tool.onClick} className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[#2d6f66]">{tool.action}<ArrowRight size={15} /></button></article> })}</div>
        </section>

        <section id="agents" className="bg-[#173d39] text-white">
          <div className="mx-auto grid max-w-7xl gap-10 px-5 py-16 sm:px-8 lg:grid-cols-2 lg:items-center">
            <div><p className="text-xs font-semibold uppercase tracking-[.16em] text-[#9dd0c4]">Digital workers</p><h2 className="mt-3 text-3xl font-semibold tracking-[-.025em]">Agents with jobs, permissions and accountability.</h2><p className="mt-4 max-w-xl text-sm leading-7 text-[#c7d8d4]">No fake “agent” buttons. Each digital worker is designed around a defined task, approved tools, state, cost limits, audit logs and human escalation.</p><button className="mt-6 rounded-xl bg-[#eff8f4] px-4 py-3 text-sm font-semibold text-[#234d47]">Explore the agent catalogue</button></div>
            <div className="grid gap-3 sm:grid-cols-2">{[[Bot,'Operations Agent','Workflow support'],[BriefcaseBusiness,'Project Assurance','Margin & delivery'],[MessageSquareMore,'Customer Success','Follow-up & insight'],[ShieldCheck,'Governance Agent','Controls & audit']].map(([Icon,title,meta]) => { const AgentIcon = Icon as typeof Bot; return <div key={String(title)} className="rounded-2xl border border-white/10 bg-white/5 p-5"><AgentIcon size={20} className="text-[#a9d9ce]" /><p className="mt-5 font-semibold">{String(title)}</p><p className="mt-1 text-sm text-[#acc2bd]">{String(meta)}</p></div> })}</div>
          </div>
        </section>

        <section id="downloads" className="mx-auto max-w-7xl px-5 py-16 sm:px-8">
          <div className="grid gap-5 lg:grid-cols-3">{[[PackageOpen,'Digital downloads','Prompts, templates, playbooks and calculators.'],[Store,'Marketplace','Curated tools and resources; creator marketplace follows after quality controls.'],[LayoutGrid,'Business workspace','One company profile feeding multiple tools, reports and agents.']].map(([Icon,title,text]) => { const CardIcon = Icon as typeof PackageOpen; return <div key={String(title)} className="rounded-2xl border border-[#dfe5e0] bg-white p-6"><CardIcon size={22} className="text-[#2d6f66]" /><h3 className="mt-5 font-semibold">{String(title)}</h3><p className="mt-2 text-sm leading-6 text-[#71807c]">{String(text)}</p></div> })}</div>
        </section>
      </main>

      <footer className="border-t border-[#dde4df] bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-5 py-8 text-sm text-[#74817e] sm:px-8 md:flex-row md:items-center md:justify-between"><div><p className="font-semibold text-[#36534e]">Northstar AI <span className="font-normal text-[#8b9693]">· working brand</span></p><p className="mt-1 text-xs">Canada-first SMB AI operating platform.</p></div><div className="flex flex-wrap gap-5 text-xs"><a href="#tools">Tools</a><a href="#agents">Agents</a><a href="#downloads">Downloads</a><a href="#">Privacy</a><a href="#">Terms</a></div></div>
      </footer>
    </div>
  );
}

export default function PlatformApp() {
  const [view, setView] = useState<View>('home');
  if (view === 'workforce') {
    return <div><button onClick={() => setView('home')} className="fixed left-4 top-4 z-[120] rounded-xl border border-[#cfd9d4] bg-[#fbfaf6] px-3 py-2 text-xs font-semibold text-[#2d6f66] shadow-lg">← Platform home</button><WorkforceApp /></div>;
  }
  return <PlatformHome openWorkforce={() => setView('workforce')} />;
}
