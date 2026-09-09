import { useState } from 'react';
import { BookOpen, Download, FileSpreadsheet, MessageSquareText, PackageOpen, Users } from 'lucide-react';

type Tab = 'downloads' | 'learn' | 'community';

export default function ResourceHub({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [tab, setTab] = useState<Tab>('downloads');
  if (!open) return null;

  const tabs: Array<{ key: Tab; label: string; icon: typeof Download }> = [
    { key: 'downloads', label: 'Downloads', icon: Download },
    { key: 'learn', label: 'Learn', icon: BookOpen },
    { key: 'community', label: 'Community', icon: Users },
  ];

  return <div className="fixed inset-0 z-[165] overflow-y-auto bg-[#0e2927]/60 p-3 backdrop-blur-sm sm:p-6">
    <div className="mx-auto max-w-6xl rounded-[28px] bg-[#f7f6f1] shadow-2xl">
      <header className="flex flex-col gap-4 border-b border-[#dae3de] bg-white px-5 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <div><p className="text-[10px] font-bold uppercase tracking-[.17em] text-[#39796f]">Resource storefront · Beta shell</p><h2 className="mt-1 text-3xl font-semibold text-[#203a37]">Resources for practical AI adoption</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-[#71807c]">Useful assets and learning around the tools. Community features stay intentionally lightweight until real users validate what they need.</p></div>
        <button onClick={onClose} className="self-start rounded-xl border border-[#d7dfda] px-4 py-2 text-sm font-semibold text-[#526762]">Close</button>
      </header>

      <div className="border-b border-[#dae3de] px-5 sm:px-8"><div className="flex gap-1 overflow-x-auto py-3">{tabs.map(({ key, label, icon: Icon }) => <button key={key} onClick={() => setTab(key)} className={`inline-flex items-center gap-2 whitespace-nowrap rounded-xl px-4 py-2 text-sm font-semibold ${tab === key ? 'bg-[#e7f2ed] text-[#2d6f66]' : 'text-[#667671]'}`}><Icon size={16}/>{label}</button>)}</div></div>

      <div className="p-5 sm:p-8">
        {tab === 'downloads' && <div><div className="max-w-2xl"><p className="text-xs font-bold uppercase tracking-[.14em] text-[#72817d]">Digital downloads</p><h3 className="mt-2 text-2xl font-semibold text-[#304b46]">Start with assets that support a real workflow.</h3></div><div className="mt-6 grid gap-5 md:grid-cols-3">{[
          [PackageOpen, 'AI Opportunity Interview Guide', 'A structured prompt/checklist for finding repetitive work, measurable pain and decision ownership.', 'Free'],
          [FileSpreadsheet, 'Project Margin Input Template', 'A simple input structure for contract value, planned/actual cost, progress and scope exposure.', 'Free'],
          [MessageSquareText, 'Human + AI Decision Rights Checklist', 'A reusable checklist for agent-owned, human-reviewed and human-owned decisions.', '5 credits'],
        ].map(([Icon, title, text, price]) => { const ItemIcon = Icon as typeof PackageOpen; return <article key={String(title)} className="rounded-2xl border border-[#dfe5e0] bg-white p-5"><ItemIcon size={20} className="text-[#39796f]"/><h4 className="mt-4 font-semibold text-[#304b46]">{String(title)}</h4><p className="mt-2 text-sm leading-6 text-[#6b7874]">{String(text)}</p><div className="mt-5 flex items-center justify-between"><span className="text-xs font-bold text-[#39796f]">{String(price)}</span><button disabled className="rounded-lg border border-[#d9e1dc] px-3 py-2 text-xs font-semibold text-[#8b9793]">Package build pending</button></div></article> })}</div></div>}

        {tab === 'learn' && <div><div className="max-w-2xl"><p className="text-xs font-bold uppercase tracking-[.14em] text-[#72817d]">Learning</p><h3 className="mt-2 text-2xl font-semibold text-[#304b46]">Short, outcome-based learning—not a content library for its own sake.</h3><p className="mt-3 text-sm leading-6 text-[#6b7874]">Initial learning will be tied to the tools customers actually use, with future support for guided course creation and customer-authored learning.</p></div><div className="mt-6 grid gap-4 md:grid-cols-2">{[
          ['Choose your first AI workflow', '15 min', 'How to define pain, evidence, owner, baseline and approval boundaries before automation.'],
          ['Read a project margin forecast', '12 min', 'How cost-to-complete, scope exposure and forecast margin translate into management actions.'],
          ['Design safe digital workers', '20 min', 'Permissions, cost limits, approvals, logs, escalation and human ownership.'],
          ['Human + AI workforce basics', '20 min', 'Separate tasks, skills and decision rights across human, agent and hybrid capacity.'],
        ].map(([title, time, text]) => <div key={title} className="rounded-2xl border border-[#dfe5e0] bg-white p-5"><div className="flex items-center gap-2 text-[#39796f]"><BookOpen size={17}/><span className="text-xs font-bold">{time}</span></div><h4 className="mt-3 font-semibold text-[#304b46]">{title}</h4><p className="mt-2 text-sm leading-6 text-[#6b7874]">{text}</p><span className="mt-4 inline-block rounded-full bg-[#f2f3ef] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-[#7c8985]">Curriculum queued</span></div>)}</div></div>}

        {tab === 'community' && <div><div className="max-w-2xl"><p className="text-xs font-bold uppercase tracking-[.14em] text-[#72817d]">Community</p><h3 className="mt-2 text-2xl font-semibold text-[#304b46]">Build around useful exchanges, not vanity member counts.</h3><p className="mt-3 text-sm leading-6 text-[#6b7874]">The launch community will focus on practical SMB use cases, tool requests, implementation lessons and peer learning. Advertising/sponsorship stays off until audience quality is demonstrated.</p></div><div className="mt-6 grid gap-4 md:grid-cols-3">{[
          ['Ask & solve', 'SMB owners and operators share a workflow problem and how they solved it.'],
          ['Tool requests', 'Members vote on the next practical tools rather than us guessing what to build.'],
          ['Implementation library', 'Approved anonymised examples of AI workflows, controls and outcomes.'],
        ].map(([title, text]) => <div key={title} className="rounded-2xl border border-[#dfe5e0] bg-white p-5"><Users size={19} className="text-[#39796f]"/><h4 className="mt-4 font-semibold text-[#304b46]">{title}</h4><p className="mt-2 text-sm leading-6 text-[#6b7874]">{text}</p><span className="mt-4 inline-block rounded-full bg-[#fff5dc] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-[#866b31]">Private beta</span></div>)}</div></div>}
      </div>
    </div>
  </div>;
}
