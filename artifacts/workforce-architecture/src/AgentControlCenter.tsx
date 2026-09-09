import { useEffect, useMemo, useState } from 'react';
import { Bot, CheckCircle2, Clock3, DollarSign, PauseCircle, PlayCircle, ShieldCheck, XCircle } from 'lucide-react';

type Agent = {
  id: string;
  key: string;
  name: string;
  purpose: string;
  triggerType: string;
  permissions: string[];
  approvalMode: string;
  monthlyCostLimitCad: string;
  enabled: boolean;
};

type Job = {
  id: string;
  agentId: string;
  status: string;
  task: string;
  approvalRequired: boolean;
  approvalStatus: string;
  costCad: string;
  createdAt: string;
};

const demoAgents: Agent[] = [
  { id: 'demo-operations', key: 'operations', name: 'Operations Agent', purpose: 'Analyse repeatable workflows and prepare bounded improvement actions.', triggerType: 'manual', permissions: ['workspace:read', 'tool-runs:read'], approvalMode: 'material-actions', monthlyCostLimitCad: '25', enabled: false },
  { id: 'demo-assurance', key: 'project-assurance', name: 'Project Assurance Agent', purpose: 'Review project economics, scope signals and delivery risk.', triggerType: 'manual', permissions: ['workspace:read', 'projects:read'], approvalMode: 'material-actions', monthlyCostLimitCad: '40', enabled: false },
  { id: 'demo-success', key: 'customer-success', name: 'Customer Success Agent', purpose: 'Prepare customer follow-up without sending externally by default.', triggerType: 'manual', permissions: ['workspace:read', 'customer-data:read'], approvalMode: 'external-communications', monthlyCostLimitCad: '25', enabled: false },
  { id: 'demo-governance', key: 'governance', name: 'Governance Agent', purpose: 'Check permissions, evidence, privacy controls and approvals.', triggerType: 'scheduled', permissions: ['audit:read', 'agents:read'], approvalMode: 'always-review', monthlyCostLimitCad: '20', enabled: false },
];

export default function AgentControlCenter({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [agents, setAgents] = useState<Agent[]>(demoAgents);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selected, setSelected] = useState<string>(demoAgents[0].id);
  const [task, setTask] = useState('');
  const [materialAction, setMaterialAction] = useState(false);
  const [mode, setMode] = useState<'server' | 'demo'>('demo');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!open) return;
    fetch('/api/platform/agents', { credentials: 'include' })
      .then(async (response) => {
        if (!response.ok) throw new Error(String(response.status));
        return response.json();
      })
      .then((data) => {
        if (Array.isArray(data.agents) && data.agents.length) {
          setAgents(data.agents);
          setJobs(Array.isArray(data.jobs) ? data.jobs : []);
          setSelected(data.agents[0].id);
          setMode('server');
        }
      })
      .catch(() => setMode('demo'));
  }, [open]);

  const active = useMemo(() => agents.find((agent) => agent.id === selected) ?? agents[0], [agents, selected]);
  const pendingApprovals = jobs.filter((job) => job.approvalStatus === 'pending').length;
  const running = jobs.filter((job) => ['queued', 'running'].includes(job.status)).length;
  const cost = jobs.reduce((sum, job) => sum + Number(job.costCad || 0), 0);

  const updateAgent = async (agent: Agent, enabled: boolean) => {
    if (mode === 'server') {
      const response = await fetch(`/api/platform/agents/${agent.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ enabled }) });
      if (!response.ok) return setMessage('Agent update failed.');
      const data = await response.json();
      setAgents((current) => current.map((item) => item.id === agent.id ? data.agent : item));
    } else {
      setAgents((current) => current.map((item) => item.id === agent.id ? { ...item, enabled } : item));
    }
  };

  const queueJob = async () => {
    if (!active || !task.trim()) return;
    if (!active.enabled) return setMessage('Enable the agent before assigning work.');
    if (mode === 'server') {
      const response = await fetch(`/api/platform/agents/${active.id}/jobs`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ task, materialAction }) });
      const data = await response.json();
      if (!response.ok) return setMessage(data.error || 'Job creation failed.');
      setJobs((current) => [data.job, ...current]);
    } else {
      const approval = materialAction || active.approvalMode === 'always-review' || active.approvalMode === 'external-communications';
      setJobs((current) => [{ id: `demo-job-${Date.now()}`, agentId: active.id, status: approval ? 'waiting-approval' : 'queued', task, approvalRequired: approval, approvalStatus: approval ? 'pending' : 'not-required', costCad: '0', createdAt: new Date().toISOString() }, ...current]);
    }
    setTask('');
    setMaterialAction(false);
    setMessage('Job created.');
  };

  const decide = async (job: Job, decision: 'approve' | 'reject') => {
    if (mode === 'server') {
      const response = await fetch(`/api/platform/jobs/${job.id}/approve`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ decision }) });
      const data = await response.json();
      if (!response.ok) return setMessage(data.error || 'Approval update failed.');
      setJobs((current) => current.map((item) => item.id === job.id ? data.job : item));
    } else {
      setJobs((current) => current.map((item) => item.id === job.id ? { ...item, approvalStatus: decision === 'approve' ? 'approved' : 'rejected', status: decision === 'approve' ? 'queued' : 'cancelled' } : item));
    }
  };

  if (!open) return null;

  return <div className="fixed inset-0 z-[160] overflow-y-auto bg-[#0e2927]/60 p-3 backdrop-blur-sm sm:p-6">
    <div className="mx-auto min-h-[calc(100vh-3rem)] max-w-7xl overflow-hidden rounded-[28px] bg-[#f7f6f1] shadow-2xl">
      <header className="flex flex-col gap-4 border-b border-[#dae3de] bg-white px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-7">
        <div><p className="text-[10px] font-bold uppercase tracking-[.17em] text-[#39796f]">Agent operations · {mode === 'server' ? 'Connected workspace' : 'Safe demo mode'}</p><h2 className="mt-1 text-2xl font-semibold text-[#203a37]">Agent Control Centre</h2><p className="mt-1 text-sm text-[#71807c]">Jobs, permissions, approvals, cost limits and audit-aware digital workers.</p></div>
        <button onClick={onClose} className="self-start rounded-xl border border-[#d7dfda] px-4 py-2 text-sm font-semibold text-[#526762]">Close</button>
      </header>

      <div className="grid gap-4 border-b border-[#dae3de] px-5 py-5 sm:grid-cols-3 sm:px-7">
        <div className="rounded-2xl border border-[#dde5e0] bg-white p-4"><div className="flex items-center gap-2 text-[#39796f]"><PlayCircle size={17}/><span className="text-xs font-semibold uppercase tracking-wide">Queued / running</span></div><p className="mt-2 text-3xl font-semibold">{running}</p></div>
        <div className="rounded-2xl border border-[#eadfbd] bg-[#fffaf0] p-4"><div className="flex items-center gap-2 text-[#8a6b2f]"><Clock3 size={17}/><span className="text-xs font-semibold uppercase tracking-wide">Needs approval</span></div><p className="mt-2 text-3xl font-semibold">{pendingApprovals}</p></div>
        <div className="rounded-2xl border border-[#dde5e0] bg-white p-4"><div className="flex items-center gap-2 text-[#39796f]"><DollarSign size={17}/><span className="text-xs font-semibold uppercase tracking-wide">Tracked job cost</span></div><p className="mt-2 text-3xl font-semibold">C${cost.toFixed(2)}</p></div>
      </div>

      <div className="grid lg:grid-cols-[310px_1fr]">
        <aside className="border-b border-[#dae3de] bg-[#f1f4ef] p-5 lg:border-b-0 lg:border-r">
          <p className="text-xs font-bold uppercase tracking-[.14em] text-[#72817d]">Digital workers</p>
          <div className="mt-4 grid gap-2">{agents.map((agent) => <button key={agent.id} onClick={() => setSelected(agent.id)} className={`rounded-xl border p-3 text-left ${agent.id === active?.id ? 'border-[#94bdb3] bg-white' : 'border-transparent bg-transparent hover:bg-white/70'}`}><div className="flex items-start justify-between gap-2"><div><p className="text-sm font-semibold text-[#304b46]">{agent.name}</p><p className="mt-1 text-xs text-[#7a8985]">{agent.triggerType} · {agent.approvalMode}</p></div><span className={`mt-1 h-2.5 w-2.5 rounded-full ${agent.enabled ? 'bg-[#4b9a73]' : 'bg-[#c5cbc7]'}`} /></div></button>)}</div>
        </aside>

        <main className="p-5 sm:p-7">
          {active && <>
            <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between"><div className="max-w-2xl"><div className="flex items-center gap-2 text-[#39796f]"><Bot size={20}/><span className="text-xs font-bold uppercase tracking-[.14em]">{active.key}</span></div><h3 className="mt-2 text-2xl font-semibold text-[#203a37]">{active.name}</h3><p className="mt-2 text-sm leading-6 text-[#687873]">{active.purpose}</p></div><button onClick={() => updateAgent(active, !active.enabled)} className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold ${active.enabled ? 'border border-[#e2c7c0] bg-white text-[#9c574a]' : 'bg-[#2d6f66] text-white'}`}>{active.enabled ? <PauseCircle size={16}/> : <PlayCircle size={16}/>} {active.enabled ? 'Disable agent' : 'Enable agent'}</button></div>

            <div className="mt-6 grid gap-4 md:grid-cols-3"><div className="rounded-2xl border border-[#dfe5e0] bg-white p-4"><p className="text-xs font-semibold text-[#7a8985]">Approval mode</p><p className="mt-2 font-semibold text-[#3f5752]">{active.approvalMode}</p></div><div className="rounded-2xl border border-[#dfe5e0] bg-white p-4"><p className="text-xs font-semibold text-[#7a8985]">Monthly cost limit</p><p className="mt-2 font-semibold text-[#3f5752]">C${Number(active.monthlyCostLimitCad).toFixed(2)}</p></div><div className="rounded-2xl border border-[#dfe5e0] bg-white p-4"><p className="text-xs font-semibold text-[#7a8985]">Permissions</p><p className="mt-2 text-sm font-semibold text-[#3f5752]">{active.permissions.join(' · ')}</p></div></div>

            <section className="mt-6 rounded-2xl border border-[#dfe5e0] bg-white p-5"><div className="flex items-center gap-2"><ShieldCheck size={18} className="text-[#39796f]"/><h4 className="font-semibold text-[#304b46]">Assign bounded work</h4></div><textarea value={task} onChange={(event) => setTask(event.target.value)} rows={4} placeholder="Describe one clear task with the evidence or output you expect." className="mt-4 w-full rounded-xl border border-[#d7dfda] p-3 text-sm outline-none focus:border-[#4b8d82]"/><label className="mt-3 flex items-start gap-3 text-sm text-[#5d6f6a]"><input type="checkbox" checked={materialAction} onChange={(event) => setMaterialAction(event.target.checked)} className="mt-1"/><span>This task could cause a material action (external communication, commitment, financial/commercial decision, or sensitive change). Require approval before execution.</span></label><div className="mt-4 flex items-center justify-between gap-4"><p className="text-xs text-[#7a8985]">{message}</p><button onClick={queueJob} disabled={!task.trim()} className="rounded-xl bg-[#2d6f66] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-40">Create job</button></div></section>
          </>}

          <section className="mt-6"><div className="flex items-end justify-between"><div><p className="text-xs font-bold uppercase tracking-[.14em] text-[#72817d]">Job queue</p><h4 className="mt-1 text-xl font-semibold text-[#304b46]">Recent activity</h4></div></div><div className="mt-4 grid gap-3">{jobs.length === 0 ? <div className="rounded-2xl border border-dashed border-[#ccd8d2] p-8 text-center text-sm text-[#7a8985]">No jobs yet. Enable an agent and assign one bounded task.</div> : jobs.map((job) => { const agent = agents.find((item) => item.id === job.agentId); return <div key={job.id} className="rounded-2xl border border-[#dfe5e0] bg-white p-4"><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><div className="flex flex-wrap items-center gap-2"><span className="font-semibold text-[#304b46]">{agent?.name || 'Agent'}</span><span className="rounded-full bg-[#f0f3ef] px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-[#6d7b77]">{job.status}</span>{job.approvalStatus === 'pending' && <span className="rounded-full bg-[#fff2d4] px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-[#806528]">approval needed</span>}</div><p className="mt-2 text-sm leading-6 text-[#667671]">{job.task}</p></div>{job.approvalStatus === 'pending' && <div className="flex shrink-0 gap-2"><button onClick={() => decide(job, 'approve')} className="inline-flex items-center gap-1 rounded-lg bg-[#e7f3ec] px-3 py-2 text-xs font-semibold text-[#347055]"><CheckCircle2 size={14}/>Approve</button><button onClick={() => decide(job, 'reject')} className="inline-flex items-center gap-1 rounded-lg bg-[#f8e9e5] px-3 py-2 text-xs font-semibold text-[#995345]"><XCircle size={14}/>Reject</button></div>}</div></div> })}</div></section>
        </main>
      </div>
    </div>
  </div>;
}
