import { useEffect, useMemo, useState, type ComponentType, type FormEvent, type ReactNode } from 'react';
import { ClerkProvider, SignIn, SignUp, useClerk, useUser } from '@clerk/react';
import { publishableKeyFromHost } from '@clerk/react/internal';
import { shadcn } from '@clerk/themes';
import * as XLSX from 'xlsx';
import {
  ArrowRight,
  BarChart3,
  BriefcaseBusiness,
  Building2,
  Calculator,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CircleAlert,
  CircleHelp,
  ClipboardCheck,
  FileCheck2,
  FileSpreadsheet,
  FileText,
  GitBranch,
  History,
  Info,
  Layers3,
  LayoutDashboard,
  Lock,
  LogOut,
  Menu,
  MessageSquare,
  Pencil,
  Plus,
  RefreshCcw,
  Save,
  Search,
  Settings2,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Target,
  Upload,
  UserRound,
  Users,
  Workflow,
  X,
  Zap,
} from 'lucide-react';
import { Link, Redirect, Router as WouterRouter, useLocation } from 'wouter';

import '@clerk/themes/shadcn.css';

const PRODUCT_NAME = 'Workforce Architecture';
const basePath = import.meta.env.BASE_URL.replace(/\/$/, '');
const clerkPubKey = publishableKeyFromHost(window.location.hostname, import.meta.env.VITE_CLERK_PUBLISHABLE_KEY);
const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;

type Approval = 'Draft' | 'Needs review' | 'Approved';
type CustomerRole = 'customer-admin' | 'reviewer' | 'viewer';
type OutcomeId = 'structure' | 'roles' | 'reward' | 'capacity' | 'business-case';
type TeamStatus = 'On track' | 'Needs attention' | 'At risk';
type RoleStatus = 'Covered' | 'Hiring plan' | 'Critical gap';

type Outcome = { id: OutcomeId; title: string; description: string; icon: ComponentType<{ size?: number; className?: string }> };
type OrganizationContext = {
  mission: string;
  vision: string;
  strategy: string;
  outcomes: string;
  industry: string;
  size: string;
  locations: string;
  policies: string;
  values: string;
  terminology: string;
  systems: string;
  approvedAt?: string;
};
type Team = {
  id: string;
  name: string;
  function: string;
  headcount: number;
  capacity: number;
  status: TeamStatus;
  lead: string;
  color: string;
};
type Role = {
  id: string;
  title: string;
  team: string;
  level: string;
  incumbents: number;
  target: number;
  skills: string[];
  criticality: 'Core' | 'Important' | 'Emerging';
  status: RoleStatus;
  framework: string;
  referenceCode: string;
  source: string;
  licence: string;
  evidence: string;
  profile: string;
  recruitmentAd: string;
  lockedText: string;
  approval: Approval;
  comment: string;
  attributes: Record<string, string>;
  updatedAt: string;
};
type Scenario = {
  id: string;
  name: string;
  description: string;
  headcountDelta: number;
  budgetDelta: number;
  confidence: number;
  changes: string[];
  active: boolean;
};
type StyleSettings = {
  preset: 'Board paper' | 'Internal profile' | 'Recruitment advert';
  tone: 'Clear' | 'Warm' | 'Direct';
  locale: 'English (UK)' | 'English (US)' | 'English (international)';
  terminology: string;
  length: 'Concise' | 'Standard' | 'Detailed';
};
type ImportRecord = {
  id: string;
  fileName: string;
  rows: number;
  validRows: number;
  exceptions: string[];
  status: Approval;
  mapping: Record<string, string>;
  customFields: string[];
  createdAt: string;
};
type RewardSettings = {
  currency: string;
  bandMin: number;
  bandMid: number;
  bandMax: number;
  baseSalary: number;
  benefitEligible: boolean;
  targetBonus: number;
  performance: number;
  threshold: number;
  cap: number;
  weight: number;
  proration: number;
  rounding: 'Nearest whole' | 'Nearest 100' | 'No rounding';
  fundingRule: string;
  benchmarkSource: string;
  benchmarkDate: string;
  salaryPeriod: string;
};
type CapacityTask = {
  id: string;
  task: string;
  workType: 'Human-led' | 'Agent-assisted' | 'Agent-executable';
  hours: number;
  reviewHours: number;
  reworkRate: number;
  restrictions: string;
  evidence: string;
  autonomy: 'Not authorised' | 'Tested' | 'Authorised';
  accountableHuman: string;
};
type BusinessCase = {
  option: 'Do nothing' | 'Redeploy capacity' | 'Automate with review';
  baselineCost: number;
  investment: number;
  targetAnnualValue: number;
  ongoingCost: number;
  owner: string;
  baselineMeasure: string;
  targetMeasure: string;
  actualMeasure: string;
  roadmap: string[];
};
type Credits = {
  balance: number;
  spendingLimit: number;
  acceptedQuotes: { id: string; title: string; credits: number; status: 'Accepted' | 'Failed' | 'Refunded'; createdAt: string }[];
};
type WorkspaceState = {
  customerId: string;
  selectedOutcome?: OutcomeId;
  onboardingComplete: boolean;
  context: OrganizationContext;
  style: StyleSettings;
  teams: Team[];
  roles: Role[];
  scenarios: Scenario[];
  imports: ImportRecord[];
  rewards: RewardSettings;
  capacity: CapacityTask[];
  businessCase: BusinessCase;
  credits: Credits;
  lastApprovedRevision?: string;
  savedAt?: string;
};
type Session = { mode: 'demo' | 'real'; customerId: string; customerName: string; role: CustomerRole; synthetic: boolean };
type DemoCustomer = Session & { industry: string; description: string };

const outcomes: Outcome[] = [
  { id: 'structure', title: 'Structure our organisation', description: 'See teams, spans, capacity and the shape of the work.', icon: Building2 },
  { id: 'roles', title: 'Define roles and skills', description: 'Build editable role profiles with evidence and sources.', icon: BriefcaseBusiness },
  { id: 'reward', title: 'Review reward', description: 'Model bands, bonus rules and eligibility without inventing benchmarks.', icon: BarChart3 },
  { id: 'capacity', title: 'Plan human and AI capacity', description: 'Assess tasks, review, exceptions, autonomy and accountable humans.', icon: Workflow },
  { id: 'business-case', title: 'Build a business case', description: 'Compare choices with traceable ROI and Return on Value.', icon: Calculator },
];

const demoCustomers: DemoCustomer[] = [
  {
    mode: 'demo',
    customerId: 'northstar',
    customerName: 'Northstar Systems',
    role: 'customer-admin',
    synthetic: true,
    industry: 'B2B software',
    description: 'Synthetic HR examples covering product, revenue, operations and engineering.',
  },
  {
    mode: 'demo',
    customerId: 'lumen',
    customerName: 'Lumen Care Network',
    role: 'reviewer',
    synthetic: true,
    industry: 'Community health',
    description: 'Synthetic HR examples covering clinical operations, PMO and support services.',
  },
];

const seededTeams: Team[] = [
  { id: 'product', name: 'Product & Design', function: 'Build', headcount: 42, capacity: 84, status: 'On track', lead: 'Maya Chen', color: '#d8ad54' },
  { id: 'revenue', name: 'Revenue', function: 'Grow', headcount: 38, capacity: 71, status: 'Needs attention', lead: 'Jon Bell', color: '#4d9b8d' },
  { id: 'operations', name: 'Operations', function: 'Run', headcount: 51, capacity: 89, status: 'On track', lead: 'Priya Shah', color: '#7b93c4' },
  { id: 'people', name: 'People & Culture', function: 'Enable', headcount: 16, capacity: 62, status: 'At risk', lead: 'Ari Romero', color: '#c7866c' },
  { id: 'finance', name: 'Finance & Legal', function: 'Steward', headcount: 19, capacity: 76, status: 'On track', lead: 'Nora Okafor', color: '#967caf' },
  { id: 'engineering', name: 'Engineering', function: 'Scale', headcount: 20, capacity: 68, status: 'Needs attention', lead: 'Eli Brooks', color: '#7aa47b' },
];

function seededRoles(customerId: string): Role[] {
  const care = customerId === 'lumen';
  const now = '2026-09-08';
  return care
    ? [
        role('Clinical Operations Manager', 'Operations', 'L6', 4, 5, ['Service design', 'Safeguarding', 'Planning'], 'Core', 'Critical gap', 'CIPD', 'care-ops-01', 'Synthetic internal example', now),
        role('PMO Lead', 'Operations', 'L6', 1, 2, ['Portfolio', 'Risk', 'Facilitation'], 'Important', 'Hiring plan', 'SFIA', 'pmo-01', 'Synthetic internal example', now),
        role('Member Support Specialist', 'Revenue', 'L4', 18, 20, ['Case management', 'Empathy', 'Triage'], 'Core', 'Hiring plan', 'O*NET/SOC', '21-1099', 'Synthetic occupational reference', now),
        role('People Partner', 'People & Culture', 'L5', 2, 3, ['Org design', 'Coaching', 'Employee relations'], 'Core', 'Critical gap', 'CIPD', 'people-01', 'Synthetic internal example', now),
      ]
    : [
        role('Product Manager', 'Product & Design', 'L5', 5, 7, ['Discovery', 'Strategy', 'Pricing'], 'Core', 'Hiring plan', 'SFIA', 'PROD-05', 'Synthetic internal example', now),
        role('Staff Product Designer', 'Product & Design', 'L6', 2, 3, ['Systems thinking', 'Research', 'Prototyping'], 'Important', 'Hiring plan', 'SFIA', 'DES-06', 'Synthetic internal example', now),
        role('Account Executive', 'Revenue', 'L4', 11, 14, ['Enterprise sales', 'Negotiation', 'Forecasting'], 'Core', 'Hiring plan', 'O*NET/SOC', '41-4011', 'Synthetic occupational reference', now),
        role('Solutions Consultant', 'Revenue', 'L5', 4, 5, ['Architecture', 'Storytelling', 'Discovery'], 'Important', 'Covered', 'SFIA', 'CONS-05', 'Synthetic internal example', now),
        role('Revenue Operations Lead', 'Revenue', 'L6', 1, 2, ['Systems', 'Analytics', 'Process design'], 'Core', 'Critical gap', 'SFIA', 'REVOPS-06', 'Synthetic internal example', now),
        role('Operations Program Manager', 'Operations', 'L5', 6, 6, ['Planning', 'Change', 'Risk'], 'Important', 'Covered', 'SFIA', 'PMO-05', 'Synthetic internal example', now),
        role('People Partner', 'People & Culture', 'L5', 2, 3, ['Org design', 'Coaching', 'Employee relations'], 'Core', 'Critical gap', 'CIPD', 'PEOPLE-05', 'Synthetic internal example', now),
        role('Talent Programs Manager', 'People & Culture', 'L4', 1, 2, ['Programs', 'Facilitation', 'Analytics'], 'Important', 'Hiring plan', 'CIPD', 'TALENT-04', 'Synthetic internal example', now),
        role('Financial Analyst', 'Finance & Legal', 'L4', 4, 5, ['Modeling', 'Scenario planning', 'Controls'], 'Emerging', 'Hiring plan', 'NOC', '11101', 'Synthetic occupational reference', now),
        role('Senior Software Engineer', 'Engineering', 'L5', 8, 10, ['Distributed systems', 'APIs', 'Reliability'], 'Core', 'Hiring plan', 'SFIA', 'PROG-05', 'Synthetic internal example', now),
        role('Engineering Manager', 'Engineering', 'L6', 2, 3, ['Coaching', 'Technical strategy', 'Planning'], 'Important', 'Critical gap', 'SFIA', 'LEAD-06', 'Synthetic internal example', now),
        role('Legal Counsel', 'Finance & Legal', 'L6', 2, 2, ['Commercial', 'Privacy', 'Risk'], 'Core', 'Covered', 'NOC', '41101', 'Synthetic occupational reference', now),
      ];
}

function role(title: string, team: string, level: string, incumbents: number, target: number, skills: string[], criticality: Role['criticality'], status: RoleStatus, framework: string, referenceCode: string, source: string, updatedAt: string): Role {
  return {
    id: `${title.toLowerCase().replaceAll(' ', '-')}-${referenceCode.toLowerCase()}`,
    title,
    team,
    level,
    incumbents,
    target,
    skills,
    criticality,
    status,
    framework,
    referenceCode,
    source,
    licence: source.includes('Synthetic') ? 'Synthetic demonstration content' : 'Customer-provided reference',
    evidence: 'Add observable evidence before treating this as a capability assessment.',
    profile: `${title} owns outcomes within ${team}. Scope, responsibilities and evidence requirements must be agreed with the customer before publication.`,
    recruitmentAd: `We are looking for a ${title} to help ${team} deliver its next stage of work. This draft uses approved organisation context and still needs customer review.`,
    lockedText: 'This statement is locked because it describes customer policy or an approved requirement.',
    approval: 'Needs review',
    comment: '',
    attributes: { 'Source type': source.includes('Synthetic') ? 'Synthetic' : 'Customer-provided' },
    updatedAt,
  };
}

function defaultContext(customerId: string): OrganizationContext {
  return customerId === 'lumen'
    ? {
        mission: 'Make community care easier to access and safer to deliver.',
        vision: 'A trusted care network that helps people thrive locally.',
        strategy: 'Strengthen frontline coordination, service consistency and support capacity.',
        outcomes: 'Shorter wait times; safer handoffs; sustainable team capacity.',
        industry: 'Community health',
        size: '250–500 people',
        locations: 'United Kingdom; regional hubs',
        policies: 'Synthetic demonstration policy wording only. Replace with approved customer policy.',
        values: 'Dignity; evidence; stewardship; learning.',
        terminology: 'Use member rather than customer; use team member rather than employee.',
        systems: 'Synthetic HRIS; synthetic service desk; no live integrations configured.',
        approvedAt: '2026-09-01',
      }
    : {
        mission: 'Help teams make better work visible and actionable.',
        vision: 'The most trusted operating system for durable organisational growth.',
        strategy: 'Focus enterprise growth while protecting the operating spine.',
        outcomes: 'Increase enterprise coverage; close critical capability gaps; improve manager leverage.',
        industry: 'B2B software',
        size: '100–250 people',
        locations: 'United Kingdom; United States; remote',
        policies: 'Synthetic demonstration policy wording only. Replace with approved customer policy.',
        values: 'Clarity; ownership; curiosity; care.',
        terminology: 'Use organisation and role architecture; use people rather than headcount when appropriate.',
        systems: 'Synthetic HRIS; synthetic project system; no live integrations configured.',
        approvedAt: '2026-09-01',
      };
}

function defaultWorkspace(customerId: string): WorkspaceState {
  const care = customerId === 'lumen';
  return {
    customerId,
    selectedOutcome: undefined,
    onboardingComplete: false,
    context: defaultContext(customerId),
    style: { preset: 'Internal profile', tone: 'Clear', locale: 'English (UK)', terminology: care ? 'member; team member' : 'organisation; role architecture', length: 'Standard' },
    teams: seededTeams,
    roles: seededRoles(customerId),
    scenarios: [
      { id: 's-01', name: care ? 'Safer service spine' : 'Focused growth', description: care ? 'Close critical service and coordination gaps before expanding delivery.' : 'Fund the next two enterprise segments while protecting the operating spine.', headcountDelta: care ? 8 : 14, budgetDelta: care ? 1.4 : 2.1, confidence: care ? 86 : 82, changes: care ? ['Add 1 Clinical Operations Manager', 'Stand up PMO Lead', 'Redesign member support handoffs'] : ['Add 3 Account Executives', 'Stand up Revenue Operations Lead', 'Add 2 Product Managers', 'Shift one designer to onboarding'], active: true },
      { id: 's-02', name: 'Durable core', description: 'Close critical capability gaps before adding new growth capacity.', headcountDelta: 7, budgetDelta: 1.1, confidence: 91, changes: ['Add 1 People Partner', 'Add 1 Engineering Manager', 'Create manager enablement program'], active: false },
      { id: 's-03', name: 'Efficiency reset', description: 'Hold headcount flat and rebalance work toward the highest-value moments.', headcountDelta: -4, budgetDelta: -0.8, confidence: 68, changes: ['Consolidate two program roles', 'Pause backfill', 'Redesign team spans'], active: false },
    ],
    imports: [],
    rewards: { currency: 'GBP', bandMin: 60000, bandMid: 72000, bandMax: 88000, baseSalary: 72000, benefitEligible: true, targetBonus: 12, performance: 82, threshold: 70, cap: 150, weight: 100, proration: 100, rounding: 'Nearest 100', fundingRule: 'Funded within approved people budget', benchmarkSource: '', benchmarkDate: '', salaryPeriod: 'Annual' },
    capacity: [
      { id: 'task-1', task: care ? 'Member case triage' : 'Enterprise opportunity qualification', workType: 'Agent-assisted', hours: care ? 18 : 14, reviewHours: 4, reworkRate: 8, restrictions: 'No sensitive decisions without accountable human review.', evidence: 'Synthetic demonstration task evidence.', autonomy: 'Tested', accountableHuman: care ? 'Service lead' : 'Revenue operations lead' },
      { id: 'task-2', task: care ? 'Weekly service coordination' : 'Quarterly planning pack', workType: 'Human-led', hours: 12, reviewHours: 2, reworkRate: 4, restrictions: 'Use approved data only.', evidence: 'Synthetic demonstration task evidence.', autonomy: 'Not authorised', accountableHuman: care ? 'Operations director' : 'Chief of staff' },
    ],
    businessCase: { option: 'Redeploy capacity', baselineCost: 180000, investment: 42000, targetAnnualValue: 160000, ongoingCost: 18000, owner: care ? 'Operations director' : 'People strategy lead', baselineMeasure: care ? 'Average case handling hours' : 'Qualified opportunities per quarter', targetMeasure: care ? 'Reduce handling time without reducing safety' : 'Increase coverage without adding avoidable work', actualMeasure: '', roadmap: ['Validate baseline with customer data', 'Pilot with accountable human review', 'Review exceptions and rework', 'Approve scale decision'] },
    credits: { balance: 100, spendingLimit: 100, acceptedQuotes: [] },
  };
}

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

function readJson<T>(key: string, fallback: T): T {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) as T : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value));
}

function formatMoney(value: number, currency = 'GBP') {
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency, maximumFractionDigits: 0 }).format(value);
}

function formatBudget(value: number) {
  return `${value > 0 ? '+' : ''}$${value.toFixed(1)}m`;
}

function statusTone(status: string) {
  if (status === 'Approved' || status === 'Covered' || status === 'On track') return 'text-[#317468] bg-[#dceee8]';
  if (status === 'Needs review' || status === 'Hiring plan' || status === 'Needs attention') return 'text-[#916d28] bg-[#f6ebc9]';
  return 'text-[#a75548] bg-[#f3dfd8]';
}

function capacityTone(value: number) {
  if (value >= 80) return { label: 'Healthy', className: 'text-[#317468] bg-[#dceee8]' };
  if (value >= 70) return { label: 'Watch', className: 'text-[#916d28] bg-[#f6ebc9]' };
  return { label: 'Gap', className: 'text-[#a75548] bg-[#f3dfd8]' };
}

function SectionEyebrow({ children, icon: Icon = Info }: { children: ReactNode; icon?: ComponentType<{ size?: number; className?: string }> }) {
  return <div className="mb-2 flex items-center gap-2 font-mono text-[10px] font-medium uppercase tracking-[.18em] text-[#7c8883]"><Icon size={13} className="text-[#4d9b8d]" />{children}</div>;
}

function Notice({ kind = 'info', children }: { kind?: 'info' | 'warning' | 'success' | 'error'; children: ReactNode }) {
  const styles = {
    info: 'border-[#c9dcd6] bg-[#eef4ef] text-[#49665f]',
    warning: 'border-[#ead8a8] bg-[#fbf3d9] text-[#77612d]',
    success: 'border-[#b6d8ca] bg-[#e2f2eb] text-[#317468]',
    error: 'border-[#e5bbb1] bg-[#f8e8e3] text-[#964d43]',
  };
  return <div className={cn('flex gap-2 rounded-lg border px-3 py-2.5 text-xs leading-5', styles[kind])}><Info size={15} className="mt-0.5 shrink-0" />{children}</div>;
}

function Modal({ title, description, onClose, children }: { title: string; description: string; onClose: () => void; children: ReactNode }) {
  return <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#202f38]/35 p-0 backdrop-blur-sm sm:items-center sm:p-4"><button className="absolute inset-0 cursor-default" onClick={onClose} aria-label="Close dialog" /><div role="dialog" aria-modal="true" className="relative max-h-[92dvh] w-full max-w-xl overflow-y-auto rounded-t-2xl border border-[#d9d5ca] bg-[#fbfaf5] p-5 shadow-[0_24px_70px_rgba(24,40,43,.2)] sm:rounded-2xl sm:p-6"><div className="mb-5 flex items-start justify-between gap-4"><div><h2 className="font-display text-xl font-semibold tracking-[-.035em]">{title}</h2><p className="mt-1 text-xs leading-5 text-[#7c8780]">{description}</p></div><button onClick={onClose} className="rounded-lg p-1.5 text-[#8b948d] transition hover:bg-[#eeeae0]" aria-label="Close dialog"><X size={18} /></button></div>{children}</div></div>;
}

function Field({ label, value, onChange, placeholder, multiline = false, type = 'text', disabled = false }: { label: string; value: string | number; onChange: (value: string) => void; placeholder?: string; multiline?: boolean; type?: string; disabled?: boolean }) {
  const className = "w-full rounded-lg border border-[#d9d5ca] bg-[#fbfaf5] px-3 py-2.5 text-sm text-[#344449] outline-none transition placeholder:text-[#a2a69e] focus:border-[#75a79d] focus:ring-2 focus:ring-[#75a79d]/15 disabled:cursor-not-allowed disabled:bg-[#f0eee7] disabled:text-[#929a94]";
  return <label className="block"><span className="mb-1.5 block text-xs font-semibold text-[#516068]">{label}</span>{multiline ? <textarea value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} disabled={disabled} rows={3} className={className} /> : <input type={type} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} disabled={disabled} className={className} />}</label>;
}

function StatusPill({ status }: { status: string }) {
  return <span className={cn('inline-flex rounded-full px-2 py-1 text-[10px] font-semibold', statusTone(status))}>{status}</span>;
}

function CapacityBar({ value }: { value: number }) {
  const tone = capacityTone(value);
  return <div className="flex items-center gap-2"><div className="h-2 flex-1 overflow-hidden rounded-full bg-[#e5e2d9]"><div className={cn('h-full rounded-full transition-all duration-700', value >= 80 ? 'bg-[#4d9b8d]' : value >= 70 ? 'bg-[#d8ad54]' : 'bg-[#c7866c]')} style={{ width: `${Math.max(0, Math.min(value, 100))}%` }} /></div><span className={cn('font-mono text-xs font-medium', tone.className.split(' ')[0])}>{value}%</span></div>;
}

function WelcomePage({ onDemo }: { onDemo: (customer: DemoCustomer, outcome?: OutcomeId) => void }) {
  const [chosen, setChosen] = useState<OutcomeId | undefined>();
  const [, setLocation] = useLocation();
  return <div className="min-h-[100dvh] bg-[#f8f5ed] text-[#26353a]"><div className="mx-auto flex min-h-[100dvh] max-w-7xl flex-col px-5 py-6 md:px-10 md:py-8"><header className="flex items-center justify-between"><Link href="/" className="flex items-center gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-[#d8ad54] text-[#202f38]"><span className="h-4 w-4 rounded-[5px] border-[3px] border-[#202f38]" /></div><div><div className="font-display text-[15px] font-semibold">Workforce</div><div className="font-mono text-[10px] uppercase tracking-[.14em] text-[#4d9b8d]">Architecture</div></div></Link><div className="flex items-center gap-2"><button onClick={() => setLocation('/sign-in')} className="rounded-lg px-3 py-2 text-xs font-semibold text-[#536269] hover:bg-[#eeeae0]">Sign in</button><button onClick={() => setLocation('/sign-up')} className="rounded-lg bg-[#2e7067] px-3 py-2 text-xs font-semibold text-[#f8f5ed] hover:bg-[#255e57]">Create account</button></div></header><main className="flex flex-1 items-center py-10"><div className="grid w-full gap-10 lg:grid-cols-[.85fr_1.15fr] lg:items-center"><div className="animate-rise-in"><SectionEyebrow icon={Sparkles}>A guided workspace for better people decisions</SectionEyebrow><h1 className="max-w-xl font-display text-[clamp(2.8rem,6vw,5.8rem)] font-semibold leading-[.94] tracking-[-.07em]">Make the shape of work <span className="text-[#4d9b8d]">visible.</span></h1><p className="mt-6 max-w-lg text-base leading-7 text-[#68746f]">Workforce Architecture keeps approved organisation context, roles, skills, reward, capacity and business cases connected—so your next decision has a clear trail.</p><div className="mt-8 flex flex-wrap items-center gap-3"><button onClick={() => onDemo(demoCustomers[0], chosen)} className="flex items-center gap-2 rounded-lg bg-[#d8ad54] px-4 py-3 text-xs font-bold text-[#26353a] shadow-[0_3px_0_#ae8836] transition hover:-translate-y-0.5">Explore synthetic demo <ArrowRight size={15} /></button><span className="text-xs text-[#8c948e]">No live HR data required</span></div></div><div className="rounded-2xl border border-[#d9d5ca] bg-[#fbfaf5] p-5 shadow-[0_18px_40px_rgba(48,54,50,.06)] md:p-7"><SectionEyebrow icon={Target}>Start with an outcome</SectionEyebrow><h2 className="font-display text-2xl font-semibold tracking-[-.04em]">What would you like to achieve?</h2><p className="mt-2 text-sm leading-6 text-[#7a8580]">Choose one starting point. You can change direction later without losing the approved context you build.</p><div className="mt-6 grid gap-2">{outcomes.map((outcome) => { const Icon = outcome.icon; const active = chosen === outcome.id; return <button key={outcome.id} onClick={() => setChosen(outcome.id)} className={cn('group flex items-center gap-4 rounded-xl border px-4 py-3.5 text-left transition', active ? 'border-[#4d9b8d] bg-[#eef4ef] shadow-[0_6px_16px_rgba(56,116,105,.08)]' : 'border-[#e2ddd1] hover:border-[#b7c6bd] hover:bg-[#f7f3eb]')}><span className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-lg', active ? 'bg-[#4d9b8d] text-[#f8f5ed]' : 'bg-[#eeeae0] text-[#65756e]')}><Icon size={17} /></span><span className="flex-1"><span className="block text-sm font-semibold text-[#405056]">{outcome.title}</span><span className="mt-0.5 block text-xs leading-5 text-[#87918b]">{outcome.description}</span></span><ChevronRight size={16} className={cn('text-[#b1b6b0] transition group-hover:translate-x-0.5', active && 'text-[#39786f]')} /></button>; })}</div><div className="mt-5 border-t border-[#e6e2d8] pt-4"><p className="text-[11px] leading-5 text-[#8a938e]"><ShieldCheck size={13} className="mr-1 inline text-[#4d9b8d]" />Synthetic demonstrations are clearly labelled. Customer work is scoped to its own workspace.</p><button onClick={() => onDemo(demoCustomers[0], chosen)} disabled={!chosen} className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-[#2e7067] py-3 text-xs font-semibold text-[#f8f5ed] transition hover:bg-[#255e57] disabled:cursor-not-allowed disabled:opacity-40">Start guided workspace <ArrowRight size={14} /></button></div></div></div></main><footer className="flex flex-col justify-between gap-2 border-t border-[#e3ded3] pt-4 text-[11px] text-[#929a94] sm:flex-row"><span>{PRODUCT_NAME} · customer work stays scoped to its workspace</span><span>AI, benchmark and payment services are unconfigured in this release</span></footer></div></div>;
}

function OnboardingPage({ workspace, setWorkspace, onComplete, session }: { workspace: WorkspaceState; setWorkspace: (next: WorkspaceState) => void; onComplete: () => void; session: Session }) {
  const [step, setStep] = useState(1);
  const updateContext = (key: keyof OrganizationContext, value: string) => setWorkspace({ ...workspace, context: { ...workspace.context, [key]: value } });
  const outcome = outcomes.find((item) => item.id === workspace.selectedOutcome);
  const preview = workspace.style.preset === 'Board paper' ? 'Decision: align the organisation around approved outcomes and the capability evidence required to deliver them.' : workspace.style.preset === 'Recruitment advert' ? 'Join a team making better work visible. You will help turn strategy into clear, accountable delivery.' : 'This role exists to make approved organisation outcomes easier to deliver, with clear scope and evidence.';
  return <div className="min-h-[100dvh] bg-[#f8f5ed] p-5 text-[#26353a] md:p-10"><div className="mx-auto max-w-6xl"><div className="mb-10 flex items-center justify-between"><Link href="/" className="flex items-center gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-[#d8ad54]"><span className="h-4 w-4 rounded-[5px] border-[3px] border-[#202f38]" /></div><span className="font-display text-base font-semibold">Workforce Architecture</span></Link><span className="rounded-full bg-[#eef4ef] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[.12em] text-[#39786f]">{session.synthetic ? 'Synthetic demonstration' : 'Customer workspace'}</span></div><div className="grid gap-8 lg:grid-cols-[190px_1fr]"><aside className="space-y-2"><p className="mb-4 font-mono text-[10px] uppercase tracking-[.18em] text-[#89918d]">Setup path</p>{['Context', 'Writing controls', 'Review & start'].map((label, index) => <div key={label} className={cn('flex items-center gap-3 rounded-lg px-3 py-2 text-xs', step === index + 1 ? 'bg-[#dceee8] font-semibold text-[#317468]' : 'text-[#89918d]')}><span className={cn('flex h-6 w-6 items-center justify-center rounded-full font-mono text-[10px]', step > index + 1 ? 'bg-[#4d9b8d] text-white' : 'bg-[#e6e2d8]')}>{step > index + 1 ? <Check size={12} /> : index + 1}</span>{label}</div>)}<div className="mt-8 rounded-lg border border-[#d9d5ca] bg-[#fbfaf5] p-3 text-[11px] leading-5 text-[#7c8780]"><Lock size={13} className="mb-1 text-[#4d9b8d]" />Approved context is reused until it becomes outdated or you change it explicitly.</div></aside><section><div className="mb-6"><SectionEyebrow icon={Target}>{outcome?.title ?? 'Guided workspace'}</SectionEyebrow><h1 className="font-display text-4xl font-semibold tracking-[-.06em]">{step === 1 ? 'Tell us what should stay true.' : step === 2 ? 'Set the way your organisation speaks.' : 'Review the foundation before you start.'}</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-[#68746f]">{step === 1 ? 'We ask only for context that changes the answer. Synthetic examples are pre-filled and clearly labelled; replace them with approved customer context for real work.' : step === 2 ? 'These controls change tone and formatting, not facts, numbers, requirements or locked policy wording.' : 'This is the context that role profiles, imports and business cases will reuse. You can edit it later with a new review status.'}</p></div>{step === 1 && <div className="space-y-5"><div className="grid gap-4 md:grid-cols-2"><Field label="Mission" value={workspace.context.mission} onChange={(value) => updateContext('mission', value)} multiline /><Field label="Vision" value={workspace.context.vision} onChange={(value) => updateContext('vision', value)} multiline /><Field label="Strategy" value={workspace.context.strategy} onChange={(value) => updateContext('strategy', value)} multiline /><Field label="Business outcomes" value={workspace.context.outcomes} onChange={(value) => updateContext('outcomes', value)} multiline /><Field label="Industry" value={workspace.context.industry} onChange={(value) => updateContext('industry', value)} /><Field label="Size" value={workspace.context.size} onChange={(value) => updateContext('size', value)} /><Field label="Locations" value={workspace.context.locations} onChange={(value) => updateContext('locations', value)} /><Field label="Values" value={workspace.context.values} onChange={(value) => updateContext('values', value)} /></div><Field label="Policies" value={workspace.context.policies} onChange={(value) => updateContext('policies', value)} multiline /><div className="grid gap-4 md:grid-cols-2"><Field label="Terminology preferences" value={workspace.context.terminology} onChange={(value) => updateContext('terminology', value)} multiline /><Field label="Systems and integrations" value={workspace.context.systems} onChange={(value) => updateContext('systems', value)} multiline /></div></div>}{step === 2 && <div className="grid gap-5 lg:grid-cols-[1fr_.8fr]"><div className="space-y-4"><label className="block"><span className="mb-1.5 block text-xs font-semibold text-[#516068]">Preset</span><select value={workspace.style.preset} onChange={(event) => setWorkspace({ ...workspace, style: { ...workspace.style, preset: event.target.value as StyleSettings['preset'] } })} className="h-11 w-full rounded-lg border border-[#d9d5ca] bg-[#fbfaf5] px-3 text-sm outline-none"><option>Board paper</option><option>Internal profile</option><option>Recruitment advert</option></select></label><div className="grid gap-4 sm:grid-cols-2"><label className="block"><span className="mb-1.5 block text-xs font-semibold text-[#516068]">Tone</span><select value={workspace.style.tone} onChange={(event) => setWorkspace({ ...workspace, style: { ...workspace.style, tone: event.target.value as StyleSettings['tone'] } })} className="h-11 w-full rounded-lg border border-[#d9d5ca] bg-[#fbfaf5] px-3 text-sm outline-none"><option>Clear</option><option>Warm</option><option>Direct</option></select></label><label className="block"><span className="mb-1.5 block text-xs font-semibold text-[#516068]">Locale / spelling</span><select value={workspace.style.locale} onChange={(event) => setWorkspace({ ...workspace, style: { ...workspace.style, locale: event.target.value as StyleSettings['locale'] } })} className="h-11 w-full rounded-lg border border-[#d9d5ca] bg-[#fbfaf5] px-3 text-sm outline-none"><option>English (UK)</option><option>English (US)</option><option>English (international)</option></select></label></div><Field label="Preferred terminology" value={workspace.style.terminology} onChange={(value) => setWorkspace({ ...workspace, style: { ...workspace.style, terminology: value } })} /><label className="block"><span className="mb-1.5 block text-xs font-semibold text-[#516068]">Length</span><select value={workspace.style.length} onChange={(event) => setWorkspace({ ...workspace, style: { ...workspace.style, length: event.target.value as StyleSettings['length'] } })} className="h-11 w-full rounded-lg border border-[#d9d5ca] bg-[#fbfaf5] px-3 text-sm outline-none"><option>Concise</option><option>Standard</option><option>Detailed</option></select></label></div><div className="rounded-xl border border-[#d9d5ca] bg-[#fbfaf5] p-5"><SectionEyebrow icon={Pencil}>Live preview</SectionEyebrow><p className="font-display text-xl font-semibold tracking-[-.03em]">{workspace.style.preset}</p><p className="mt-4 text-sm leading-7 text-[#586861]">{preview}</p><div className="mt-5 border-t border-[#e3ded3] pt-4 text-[11px] leading-5 text-[#8a938e]"><Lock size={12} className="mr-1 inline text-[#4d9b8d]" />Locked policy wording remains unchanged when tone or length changes.</div></div></div>}{step === 3 && <div className="space-y-4"><div className="grid gap-3 md:grid-cols-3"><div className="rounded-xl border border-[#d9d5ca] bg-[#fbfaf5] p-4"><p className="text-[11px] text-[#89918d]">Organisation</p><p className="mt-1 font-display text-lg font-semibold">{session.customerName}</p><p className="mt-1 text-xs text-[#7d8982]">{workspace.context.industry} · {workspace.context.size}</p></div><div className="rounded-xl border border-[#d9d5ca] bg-[#fbfaf5] p-4"><p className="text-[11px] text-[#89918d]">Starting outcome</p><p className="mt-1 font-display text-lg font-semibold">{outcome?.title ?? 'General workspace'}</p><p className="mt-1 text-xs text-[#7d8982]">You can change direction later.</p></div><div className="rounded-xl border border-[#d9d5ca] bg-[#fbfaf5] p-4"><p className="text-[11px] text-[#89918d]">Approval state</p><p className="mt-1"><StatusPill status={workspace.context.approvedAt ? 'Approved' : 'Needs review'} /></p><p className="mt-2 text-xs text-[#7d8982]">No policy is invented.</p></div></div><Notice kind="warning">This release uses clearly labelled synthetic content for demonstration. Real customer work should replace the example policy wording and validate the organisation context before approval.</Notice><div className="rounded-xl border border-[#d9d5ca] bg-[#fbfaf5] p-5"><div className="flex items-start gap-3"><ShieldCheck className="mt-0.5 text-[#4d9b8d]" size={18} /><div><p className="text-sm font-semibold">Ready to enter the workspace</p><p className="mt-1 text-xs leading-5 text-[#7d8982]">Your choices will autosave locally for this customer workspace. Live external integrations, AI, benchmarks and payments remain visibly unconfigured.</p></div></div></div></div>}<div className="mt-8 flex items-center justify-between border-t border-[#e3ded3] pt-5"><button onClick={() => setStep(Math.max(1, step - 1))} disabled={step === 1} className="rounded-lg px-3 py-2 text-xs font-semibold text-[#6d7973] hover:bg-[#eeeae0] disabled:invisible">Back</button>{step < 3 ? <button onClick={() => setStep(step + 1)} className="flex items-center gap-2 rounded-lg bg-[#2e7067] px-4 py-2.5 text-xs font-semibold text-[#f8f5ed] hover:bg-[#255e57]">Continue <ArrowRight size={14} /></button> : <button onClick={() => { setWorkspace({ ...workspace, onboardingComplete: true, context: { ...workspace.context, approvedAt: new Date().toISOString() } }); onComplete(); }} className="flex items-center gap-2 rounded-lg bg-[#2e7067] px-4 py-2.5 text-xs font-semibold text-[#f8f5ed] hover:bg-[#255e57]">Open workspace <ArrowRight size={14} /></button>}</div></section></div></div></div>;
}

function AppShell({ session, savedAt, onSignOut, children }: { session: Session; savedAt?: string; onSignOut: () => void; children: ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [location, setLocation] = useLocation();
  const nav = [
    { href: '/workspace', label: 'Overview', icon: LayoutDashboard },
    { href: '/roles', label: 'Roles & skills', icon: BriefcaseBusiness },
    { href: '/imports', label: 'Imports', icon: FileSpreadsheet },
    { href: '/rewards', label: 'Reward', icon: BarChart3 },
    { href: '/capacity', label: 'Human + AI capacity', icon: Workflow },
    { href: '/business-case', label: 'Business case', icon: Calculator },
    { href: '/content', label: 'Content studio', icon: FileText },
    { href: '/settings', label: 'Workspace settings', icon: Settings2 },
  ];
  const title = nav.find((item) => item.href === location)?.label ?? PRODUCT_NAME;
  return <div className="flex min-h-[100dvh] bg-[#f8f5ed] text-[#26353a]"><>{menuOpen && <button className="fixed inset-0 z-30 bg-[#17272d]/35 md:hidden" onClick={() => setMenuOpen(false)} aria-label="Close navigation" />}<aside className={cn('fixed inset-y-0 left-0 z-40 flex w-[268px] flex-col bg-[#202f38] text-[#eef0e9] transition-transform duration-300 md:relative md:z-0 md:translate-x-0', menuOpen ? 'translate-x-0' : '-translate-x-full')}><div className="flex h-[72px] items-center justify-between border-b border-[#3b4a51] px-6"><Link href="/workspace" onClick={() => setMenuOpen(false)} className="flex items-center gap-3"><div className="relative flex h-8 w-8 items-center justify-center rounded-[9px] bg-[#d8ad54] text-[#202f38]"><span className="absolute h-3.5 w-3.5 rounded-[4px] border-2 border-[#202f38]" /><span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-[#76b3a7]" /></div><div><div className="font-display text-[15px] font-semibold">{session.customerName}</div><div className="font-mono text-[9px] uppercase tracking-[.14em] text-[#9eada9]">{PRODUCT_NAME}</div></div></Link><button className="rounded p-1 text-[#9eada9] hover:bg-[#31434b] md:hidden" onClick={() => setMenuOpen(false)} aria-label="Close navigation"><X size={18} /></button></div><div className="flex-1 overflow-y-auto px-4 pt-6"><div className="mb-3 flex items-center justify-between px-2"><p className="font-mono text-[10px] uppercase tracking-[.18em] text-[#849894]">Workspace</p><StatusPill status={session.role === 'customer-admin' ? 'Admin' : session.role === 'reviewer' ? 'Reviewer' : 'Viewer'} /></div><nav className="space-y-1">{nav.map((item) => { const Icon = item.icon; const active = location === item.href; return <Link key={item.href} href={item.href} onClick={() => setMenuOpen(false)} className={cn('group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition', active ? 'bg-[#d8ad54] font-semibold text-[#202f38]' : 'text-[#b9c4bf] hover:bg-[#30414a] hover:text-[#f4f3eb]')}><Icon size={17} strokeWidth={active ? 2.4 : 1.8} />{item.label}</Link>; })}</nav><div className="mt-8 rounded-lg border border-[#3b4a51] bg-[#2a3b44] p-3"><div className="flex items-start gap-2"><ShieldCheck size={15} className="mt-0.5 text-[#76b3a7]" /><div><p className="text-xs font-semibold text-[#eef0e9]">{session.synthetic ? 'Synthetic demonstration' : 'Customer workspace'}</p><p className="mt-1 text-[11px] leading-5 text-[#9eada9]">{session.synthetic ? 'No customer or live system data is connected.' : 'Data is scoped to your signed-in workspace.'}</p></div></div></div></div><div className="border-t border-[#3b4a51] p-4"><div className="mb-3 flex items-center gap-3 rounded-lg bg-[#2a3b44] p-3"><div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#76b3a7] text-xs font-bold text-[#202f38]">{session.customerName.slice(0, 2).toUpperCase()}</div><div className="min-w-0"><p className="truncate text-xs font-semibold text-[#eef0e9]">{session.customerName}</p><p className="truncate text-[11px] text-[#91a19d]">{session.role.replace('-', ' ')}</p></div></div><button onClick={onSignOut} className="flex w-full items-center gap-2 px-2 text-xs text-[#91a19d] transition hover:text-[#eef0e9]"><LogOut size={14} />Sign out</button></div></aside></><div className="min-w-0 flex-1"><header className="sticky top-0 z-20 flex h-[72px] items-center justify-between border-b border-[#d9d5ca] bg-[#f8f5ed]/95 px-5 backdrop-blur-md md:px-8"><div className="flex items-center gap-3"><button onClick={() => setMenuOpen(true)} className="rounded-lg p-2 text-[#52616b] hover:bg-[#ece7db] md:hidden" aria-label="Open navigation"><Menu size={20} /></button><div><div className="hidden items-center gap-2 text-[10px] font-semibold uppercase tracking-[.18em] text-[#8a8e89] sm:flex"><span>{session.customerName}</span><span className="text-[#c8c2b6]">/</span><span>{PRODUCT_NAME}</span></div><h1 className="font-display text-xl font-semibold tracking-[-.03em] md:text-2xl">{title}</h1></div></div><div className="flex items-center gap-3"><span className="hidden items-center gap-1.5 text-[11px] text-[#87918b] sm:flex"><Save size={13} className="text-[#4d9b8d]" />{savedAt ? `Saved ${new Date(savedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'Autosave on'}</span><div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#d8ad54] text-xs font-bold text-[#26353a]" title="Signed-in workspace">{session.customerName.slice(0, 2).toUpperCase()}</div></div></header><main>{children}</main></div></div>;
}

function OverviewPage({ workspace, setLocation }: { workspace: WorkspaceState; setLocation: (path: string) => void }) {
  const totalGap = workspace.roles.reduce((sum, item) => sum + Math.max(item.target - item.incumbents, 0), 0);
  const activeScenario = workspace.scenarios.find((scenario) => scenario.active) ?? workspace.scenarios[0];
  const selectedTeam = workspace.teams[0];
  return <div className="min-h-[calc(100dvh-72px)] bg-[#f8f5ed]"><div className="mx-auto max-w-[1500px] px-5 py-7 md:px-8 md:py-9"><div className="mb-8 flex flex-col justify-between gap-5 lg:flex-row lg:items-end"><div><SectionEyebrow icon={Sparkles}>Current state / {workspace.context.industry}</SectionEyebrow><h2 className="max-w-2xl font-display text-[clamp(2rem,4vw,3.5rem)] font-semibold leading-[.98] tracking-[-.055em]">See the shape.<br /><span className="text-[#4d9b8d]">Choose the move.</span></h2><p className="mt-4 max-w-xl text-sm leading-6 text-[#68746f]">{workspace.context.outcomes}</p></div><div className="rounded-xl border border-[#d9d5ca] bg-[#fbfaf5] px-4 py-3 shadow-[0_8px_24px_rgba(48,54,50,.04)]"><p className="font-mono text-[10px] uppercase tracking-[.15em] text-[#89918d]">Next step</p><p className="mt-1 text-sm font-semibold text-[#36464a]">{workspace.roles.some((role) => role.approval === 'Needs review') ? 'Review role evidence before publishing' : 'Choose a scenario to compare'}</p><button onClick={() => setLocation(workspace.roles.some((role) => role.approval === 'Needs review') ? '/roles' : '/business-case')} className="mt-2 flex items-center gap-1 text-xs font-semibold text-[#39786f] hover:underline">Open next step <ArrowRight size={13} /></button></div></div><div className="mb-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><Metric label="Organisation headcount" value="186" detail={`${workspace.teams.length} functions`} icon={Users} /><Metric label="Capacity pulse" value="78%" detail="Based on active work" icon={Zap} /><Metric label="Open role gaps" value={String(totalGap)} detail="Needs evidence and review" icon={Target} /><Metric label="Credits" value={String(workspace.credits.balance)} detail="Manual work remains free" icon={BarChart3} /></div><div className="mb-5 grid gap-5 xl:grid-cols-[1.25fr_.75fr]"><section className="rounded-xl border border-[#d9d5ca] bg-[#fbfaf5] shadow-[0_12px_30px_rgba(48,54,50,.045)]"><div className="border-b border-[#e3ded3] px-5 py-5 md:px-6"><SectionEyebrow icon={Layers3}>Organisation view</SectionEyebrow><h3 className="font-display text-lg font-semibold tracking-[-.025em]">Where the organisation is carrying weight</h3><p className="mt-1 text-xs text-[#89918d]">Table view is available through Roles & skills. Capacity is a planning signal, not a performance score.</p></div><div className="divide-y divide-[#e8e3d8]">{workspace.teams.map((team) => { const tone = capacityTone(team.capacity); return <button key={team.id} onClick={() => setLocation('/roles')} className="grid w-full grid-cols-[minmax(150px,1.3fr)_minmax(100px,.8fr)_auto] items-center gap-3 px-5 py-4 text-left transition hover:bg-[#f7f3eb] md:grid-cols-[minmax(180px,1.4fr)_minmax(180px,1fr)_100px_90px] md:px-6"><div className="flex min-w-0 items-center gap-3"><span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: team.color }} /><span className="min-w-0"><span className="block truncate text-sm font-semibold text-[#344449]">{team.name}</span><span className="block text-[11px] text-[#8a938e]">{team.function} · {team.lead}</span></span></div><CapacityBar value={team.capacity} /><span className={cn('hidden w-fit rounded-full px-2 py-1 text-[10px] font-semibold md:inline-flex', tone.className)}>{tone.label}</span><ChevronRight size={17} className="justify-self-end text-[#a6ada7]" /></button>; })}</div></section><section className="rounded-xl border border-[#d9d5ca] bg-[#263a41] p-5 text-[#f3f1e9] shadow-[0_12px_30px_rgba(48,54,50,.08)] md:p-6"><SectionEyebrow icon={GitBranch}>Active scenario</SectionEyebrow><h3 className="font-display text-2xl font-semibold tracking-[-.04em]">{activeScenario.name}</h3><p className="mt-2 text-sm leading-6 text-[#b5c3be]">{activeScenario.description}</p><div className="mt-7 grid grid-cols-3 gap-2 border-t border-[#4b5c61] pt-5"><div><p className="font-mono text-[9px] uppercase tracking-[.12em] text-[#8fa49f]">Headcount</p><p className="mt-1 font-display text-2xl font-semibold text-[#d8ad54]">{activeScenario.headcountDelta > 0 ? '+' : ''}{activeScenario.headcountDelta}</p></div><div><p className="font-mono text-[9px] uppercase tracking-[.12em] text-[#8fa49f]">Budget</p><p className="mt-1 font-display text-2xl font-semibold text-[#d8ad54]">{formatBudget(activeScenario.budgetDelta)}</p></div><div><p className="font-mono text-[9px] uppercase tracking-[.12em] text-[#8fa49f]">Confidence</p><p className="mt-1 font-display text-2xl font-semibold text-[#d8ad54]">{activeScenario.confidence}%</p></div></div><button onClick={() => setLocation('/business-case')} className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-[#d8ad54] py-2.5 text-xs font-bold text-[#263a41] hover:bg-[#e6bd68]">Build a traceable case <ArrowRight size={14} /></button></section></div><div className="grid gap-5 lg:grid-cols-3"><QuickCard icon={BriefcaseBusiness} title="Role architecture" detail={`${workspace.roles.length} roles with source and approval state`} action="Review roles" onClick={() => setLocation('/roles')} /><QuickCard icon={Upload} title="Import safely" detail="Preview CSV or spreadsheet mappings before saving" action="Open imports" onClick={() => setLocation('/imports')} /><QuickCard icon={ShieldCheck} title="Customer boundary" detail="Synthetic demo is labelled; no live services are connected" action="View settings" onClick={() => setLocation('/settings')} /></div></div></div>;
}

function Metric({ label, value, detail, icon: Icon }: { label: string; value: string; detail: string; icon: ComponentType<{ size?: number }> }) {
  return <div className="rounded-xl border border-[#d9d5ca] bg-[#fbfaf5] p-4 shadow-[0_8px_22px_rgba(48,54,50,.035)]"><div className="flex items-start justify-between"><p className="text-xs font-medium text-[#7d8781]">{label}</p><span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#dceee8] text-[#317468]"><Icon size={15} /></span></div><p className="mt-3 font-display text-3xl font-semibold tracking-[-.055em] text-[#304047]">{value}</p><p className="mt-1 text-[11px] text-[#8c948e]">{detail}</p></div>;
}

function QuickCard({ icon: Icon, title, detail, action, onClick }: { icon: ComponentType<{ size?: number }>; title: string; detail: string; action: string; onClick: () => void }) {
  return <section className="rounded-xl border border-[#d9d5ca] bg-[#fbfaf5] p-5"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#f5e9c4] text-[#916d28]"><Icon size={16} /></span><h3 className="mt-4 font-display text-base font-semibold">{title}</h3><p className="mt-1 text-xs leading-5 text-[#7c8780]">{detail}</p><button onClick={onClick} className="mt-4 flex items-center gap-1 text-xs font-semibold text-[#39786f] hover:underline">{action} <ArrowRight size={13} /></button></section>;
}

function RolesPage({ workspace, setWorkspace, canEdit, onOpenContent }: { workspace: WorkspaceState; setWorkspace: (next: WorkspaceState) => void; canEdit: boolean; onOpenContent: (role: Role) => void }) {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('All');
  const [selected, setSelected] = useState<Role | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const filtered = useMemo(() => workspace.roles.filter((role) => `${role.title} ${role.team} ${role.skills.join(' ')}`.toLowerCase().includes(query.toLowerCase()) && (filter === 'All' || role.approval === filter || role.status === filter)), [workspace.roles, query, filter]);
  const updateRole = (next: Role) => setWorkspace({ ...workspace, roles: workspace.roles.map((role) => role.id === next.id ? next : role) });
  return <PageFrame eyebrow="Role architecture / evidence first" title="Roles & skills" description="Connect frameworks to functions, families, tracks, levels, positions, skills and evidence. Match by scope and responsibilities, not title alone."><div className="mb-5 flex flex-wrap items-center gap-2"><label className="relative min-w-[240px] flex-1"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8e9790]" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search roles, skills, teams" className="h-10 w-full rounded-lg border border-[#d9d5ca] bg-[#fbfaf5] pl-9 pr-3 text-sm outline-none focus:border-[#75a79d]" /></label><select value={filter} onChange={(event) => setFilter(event.target.value)} className="h-10 rounded-lg border border-[#d9d5ca] bg-[#fbfaf5] px-3 text-xs outline-none"><option>All</option><option>Approved</option><option>Needs review</option><option>Draft</option><option>Critical gap</option><option>Hiring plan</option></select>{canEdit && <button onClick={() => setAddOpen(true)} className="flex h-10 items-center gap-2 rounded-lg bg-[#2e7067] px-3 text-xs font-semibold text-[#f8f5ed] hover:bg-[#255e57]"><Plus size={15} /> Add role</button>}</div><div className="mb-4 grid gap-3 md:grid-cols-3"><Notice>Reference frameworks are labelled separately: O*NET/SOC, NOC, ESCO and ISCO are occupational references; CIPD, SHRM and SFIA are profession-specific references.</Notice><Notice kind="warning">Missing evidence is not zero ability. Proficiency, job level and performance remain separate fields.</Notice><Notice kind="info">Synthetic and customer-provided sources are shown on every role. Crosswalk certainty and endorsements are never invented.</Notice></div><div className="overflow-hidden rounded-xl border border-[#d9d5ca] bg-[#fbfaf5] shadow-[0_12px_30px_rgba(48,54,50,.045)]"><div className="hidden grid-cols-[minmax(210px,1.35fr)_minmax(130px,.9fr)_80px_120px_150px_100px] gap-4 border-b border-[#e1ddd2] bg-[#f4f0e7] px-5 py-3 font-mono text-[9px] uppercase tracking-[.15em] text-[#89918d] md:grid"><span>Role</span><span>Coverage</span><span>Level</span><span>Framework</span><span>Skills</span><span>Approval</span></div>{filtered.map((role) => <button key={role.id} onClick={() => setSelected(role)} className="grid w-full grid-cols-1 gap-3 border-b border-[#ebe6dc] px-5 py-4 text-left transition last:border-0 hover:bg-[#f5f2ea] md:grid-cols-[minmax(210px,1.35fr)_minmax(130px,.9fr)_80px_120px_150px_100px] md:items-center md:gap-4"><div className="flex items-center gap-3"><span className={cn('h-2 w-2 shrink-0 rounded-full', role.approval === 'Approved' ? 'bg-[#4d9b8d]' : role.approval === 'Needs review' ? 'bg-[#d8ad54]' : 'bg-[#c7866c]')} /><div className="min-w-0"><p className="truncate text-sm font-semibold text-[#405056]">{role.title}</p><p className="truncate text-[11px] text-[#929a94]">{role.team} · {role.source}</p></div></div><div><CapacityBar value={Math.round((role.incumbents / Math.max(role.target, 1)) * 100)} /><span className="font-mono text-[10px] text-[#818b85]">{role.incumbents}/{role.target}</span></div><span className="text-xs font-semibold text-[#66736e]">{role.level}</span><span className="w-fit rounded bg-[#eeeae0] px-2 py-1 text-[10px] font-medium text-[#707c76]">{role.framework}</span><div className="flex flex-wrap gap-1">{role.skills.slice(0, 2).map((skill) => <span key={skill} className="rounded bg-[#eef2ee] px-1.5 py-1 text-[10px] text-[#62726d]">{skill}</span>)}</div><StatusPill status={role.approval} /></button>)}{filtered.length === 0 && <div className="p-12 text-center text-sm text-[#89918d]">No roles match this view.</div>}</div>{selected && <RoleDrawer role={selected} canEdit={canEdit} onClose={() => setSelected(null)} onSave={(next) => { updateRole(next); setSelected(next); }} onOpenContent={() => { setSelected(null); onOpenContent(selected); }} />}{addOpen && <AddRoleModal onClose={() => setAddOpen(false)} onAdd={(newRole) => { setWorkspace({ ...workspace, roles: [newRole, ...workspace.roles] }); setAddOpen(false); }} />}</PageFrame>;
}

function RoleDrawer({ role, canEdit, onClose, onSave, onOpenContent }: { role: Role; canEdit: boolean; onClose: () => void; onSave: (role: Role) => void; onOpenContent: () => void }) {
  const [draft, setDraft] = useState(role);
  return <div className="fixed inset-0 z-40 flex justify-end bg-[#202f38]/25 backdrop-blur-[2px]"><button className="absolute inset-0" onClick={onClose} aria-label="Close role detail" /><aside className="relative h-full w-full max-w-xl overflow-y-auto bg-[#fbfaf5] p-6 shadow-[-18px_0_45px_rgba(24,40,43,.12)] md:p-8"><button onClick={onClose} className="absolute right-5 top-5 rounded-lg p-2 text-[#8c958f] hover:bg-[#eeeae0]" aria-label="Close role detail"><X size={18} /></button><SectionEyebrow icon={BriefcaseBusiness}>Role detail · {draft.source}</SectionEyebrow><h2 className="pr-8 font-display text-3xl font-semibold leading-tight tracking-[-.05em]">{draft.title}</h2><p className="mt-2 text-sm text-[#7b8580]">{draft.team} · {draft.level} · {draft.framework} / {draft.referenceCode}</p><div className="mt-5 flex flex-wrap gap-2"><StatusPill status={draft.approval} /><span className="rounded-full bg-[#eeeae0] px-2 py-1 text-[10px] text-[#707c76]">{draft.licence}</span></div><div className="mt-7 grid grid-cols-2 gap-3"><div className="rounded-lg bg-[#eef4ef] p-3"><p className="text-[10px] text-[#7e8a83]">Current coverage</p><p className="mt-1 font-display text-2xl font-semibold text-[#317468]">{draft.incumbents}/{draft.target}</p></div><div className="rounded-lg bg-[#f5e9c4] p-3"><p className="text-[10px] text-[#806b39]">Criticality</p><p className="mt-1 font-display text-2xl font-semibold text-[#916d28]">{draft.criticality}</p></div></div><div className="mt-7 space-y-4"><Field label="Scope and responsibilities" value={draft.profile} onChange={(value) => setDraft({ ...draft, profile: value, approval: 'Needs review' })} multiline disabled={!canEdit} /><Field label="Evidence requirements" value={draft.evidence} onChange={(value) => setDraft({ ...draft, evidence: value, approval: 'Needs review' })} multiline disabled={!canEdit} /><Field label="Locked policy wording" value={draft.lockedText} onChange={() => undefined} multiline disabled /></div><div className="mt-6"><p className="mb-2 font-mono text-[10px] uppercase tracking-[.16em] text-[#858e88]">Skills mapped to role</p><div className="flex flex-wrap gap-2">{draft.skills.map((skill) => <span key={skill} className="rounded-lg border border-[#d8e1db] bg-[#eef4ef] px-2.5 py-2 text-xs font-medium text-[#526a64]">{skill}</span>)}</div></div><div className="mt-6 rounded-lg border border-[#d9d5ca] bg-[#f7f3eb] p-3 text-xs leading-5 text-[#69766f]"><Info size={13} className="mr-1 inline text-[#4d9b8d]" />Source and approval state are preserved. Recommendations explain whether they are standard, hybrid or custom; no official crosswalk certainty is inferred.</div><div className="mt-7 flex flex-wrap gap-2 border-t border-[#e3ded3] pt-5">{canEdit && <button onClick={() => onSave({ ...draft, approval: 'Needs review', updatedAt: new Date().toISOString() })} className="flex items-center gap-2 rounded-lg bg-[#2e7067] px-4 py-2.5 text-xs font-semibold text-[#f8f5ed]"><Save size={14} />Save as needs review</button>}<button onClick={onOpenContent} className="flex items-center gap-2 rounded-lg border border-[#cfd9d2] px-4 py-2.5 text-xs font-semibold text-[#39786f]"><Pencil size={14} />Open content studio</button></div></aside></div>;
}

function AddRoleModal({ onClose, onAdd }: { onClose: () => void; onAdd: (role: Role) => void }) {
  const [title, setTitle] = useState('');
  const [team, setTeam] = useState('Product & Design');
  const [framework, setFramework] = useState('Custom');
  const [level, setLevel] = useState('L5');
  const [target, setTarget] = useState('1');
  return <Modal title="Add a role" description="Create a draft placeholder. It remains Needs review until scope and evidence are approved." onClose={onClose}><form onSubmit={(event) => { event.preventDefault(); if (!title.trim()) return; onAdd(role(title.trim(), team, level, 0, Math.max(1, Number(target)), ['To be mapped'], 'Important', 'Hiring plan', framework, 'CUSTOM-DRAFT', 'Customer-provided draft', new Date().toISOString())); }} className="space-y-4"><Field label="Role title" value={title} onChange={setTitle} placeholder="e.g. Director of Customer Education" /><div className="grid gap-3 sm:grid-cols-2"><label className="block"><span className="mb-1.5 block text-xs font-semibold text-[#516068]">Team</span><select value={team} onChange={(event) => setTeam(event.target.value)} className="h-10 w-full rounded-lg border border-[#d9d5ca] bg-[#fbfaf5] px-2 text-xs"><option>Product & Design</option><option>Revenue</option><option>Operations</option><option>People & Culture</option><option>Finance & Legal</option><option>Engineering</option></select></label><label className="block"><span className="mb-1.5 block text-xs font-semibold text-[#516068]">Reference</span><select value={framework} onChange={(event) => setFramework(event.target.value)} className="h-10 w-full rounded-lg border border-[#d9d5ca] bg-[#fbfaf5] px-2 text-xs"><option>Custom</option><option>O*NET/SOC</option><option>NOC</option><option>ESCO</option><option>ISCO</option><option>CIPD</option><option>SHRM</option><option>SFIA</option></select></label></div><div className="grid gap-3 sm:grid-cols-2"><Field label="Level" value={level} onChange={setLevel} /><Field label="Target positions" value={target} onChange={setTarget} type="number" /></div><div className="flex justify-end gap-2 border-t border-[#e3ded3] pt-4"><button type="button" onClick={onClose} className="rounded-lg px-3 py-2 text-xs font-semibold text-[#6d7973] hover:bg-[#f0ece3]">Cancel</button><button type="submit" className="rounded-lg bg-[#2e7067] px-4 py-2 text-xs font-semibold text-[#f8f5ed]">Create draft</button></div></form></Modal>;
}

function ImportsPage({ workspace, setWorkspace, canEdit }: { workspace: WorkspaceState; setWorkspace: (next: WorkspaceState) => void; canEdit: boolean }) {
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [fileName, setFileName] = useState('');
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [error, setError] = useState('');
  const standardFields = ['title', 'team', 'level', 'incumbents', 'target', 'skills', 'framework', 'referenceCode'];
  const suggested = headers.reduce<Record<string, string>>((acc, header) => { const normalized = header.toLowerCase().replaceAll(/[^a-z]/g, ''); const field = standardFields.find((item) => normalized.includes(item.replaceAll(/[^a-z]/g, '')) || (item === 'title' && normalized.includes('role'))); if (field) acc[header] = field; return acc; }, {});
  const activeMapping = Object.keys(mapping).length ? mapping : suggested;
  const missing = ['title', 'team'].filter((field) => !Object.values(activeMapping).includes(field));
  const parseFile = async (file: File) => {
    setError('');
    try {
      const workbook = XLSX.read(await file.arrayBuffer(), { type: 'array' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const parsed = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' });
      if (!parsed.length) throw new Error('The first sheet has no data rows.');
      setRows(parsed.slice(0, 100));
      setHeaders(Object.keys(parsed[0]));
      setMapping({});
      setFileName(file.name);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'We could not read that file.');
    }
  };
  const saveImport = () => {
    const exceptions: string[] = [];
    const nextRoles = rows.map((row, index) => {
      const get = (field: string) => { const key = Object.entries(activeMapping).find(([, value]) => value === field)?.[0]; return key ? String(row[key] ?? '').trim() : ''; };
      if (!get('title') || !get('team')) exceptions.push(`Row ${index + 2}: title and team are required.`);
      const title = get('title') || `Unmapped role ${index + 2}`;
      return role(title, get('team') || 'Unmapped', get('level') || 'L5', Number(get('incumbents')) || 0, Number(get('target')) || 1, (get('skills') || 'To be mapped').split(',').map((item) => item.trim()).filter(Boolean), 'Important', 'Hiring plan', get('framework') || 'Custom', get('referenceCode') || 'IMPORTED', 'Customer-provided spreadsheet', new Date().toISOString());
    });
    const record: ImportRecord = { id: `import-${Date.now()}`, fileName, rows: rows.length, validRows: rows.length - exceptions.length, exceptions, status: exceptions.length ? 'Needs review' : 'Draft', mapping: activeMapping, customFields: headers.filter((header) => !Object.keys(activeMapping).includes(header)), createdAt: new Date().toISOString() };
    setWorkspace({ ...workspace, roles: [...nextRoles, ...workspace.roles], imports: [record, ...workspace.imports] });
    setRows([]);
    setHeaders([]);
    setFileName('');
    setMapping({});
  };
  return <PageFrame eyebrow="Data foundation / preview first" title="Imports" description="Bring in role-only CSV or spreadsheet data without silently discarding extra fields, overwriting records or requiring employee data."><div className="grid gap-5 xl:grid-cols-[.8fr_1.2fr]"><section className="rounded-xl border border-[#d9d5ca] bg-[#fbfaf5] p-5 md:p-6"><SectionEyebrow icon={Upload}>1 · Select a file</SectionEyebrow><label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-[#aebfb6] bg-[#f3f7f2] px-6 py-12 text-center transition hover:bg-[#eaf2ec]"><FileSpreadsheet size={28} className="text-[#4d9b8d]" /><p className="mt-3 text-sm font-semibold text-[#405056]">{fileName || 'Choose CSV, XLSX or XLS'}</p><p className="mt-1 text-xs text-[#7c8780]">Role-only imports are supported; employee data is not required.</p><input type="file" accept=".csv,.xlsx,.xls" className="sr-only" onChange={(event) => { const file = event.target.files?.[0]; if (file) void parseFile(file); }} /></label>{error && <div className="mt-4"><Notice kind="error">{error}</Notice></div>}<div className="mt-5"><Notice kind="info">Import previews are limited to 100 rows in this release. The full file is not sent anywhere; the parsed result stays in this customer workspace.</Notice></div></section><section className="rounded-xl border border-[#d9d5ca] bg-[#fbfaf5] p-5 md:p-6"><SectionEyebrow icon={ClipboardCheck}>2 · Correct the mapping</SectionEyebrow>{!headers.length ? <div className="flex min-h-[280px] flex-col items-center justify-center text-center text-[#89918d]"><FileCheck2 size={30} className="text-[#b9c6be]" /><p className="mt-3 text-sm font-semibold text-[#65756e]">Preview appears here</p><p className="mt-1 max-w-sm text-xs leading-5">We suggest mappings, show missing mandatory fields and preserve custom attributes before anything is saved.</p></div> : <><div className="mb-4 flex flex-wrap items-center justify-between gap-2"><div><p className="text-sm font-semibold text-[#405056]">{rows.length} rows detected</p><p className="text-xs text-[#89918d]">{headers.length} columns · {headers.filter((header) => !Object.keys(activeMapping).includes(header)).length} extra fields preserved</p></div><StatusPill status={missing.length ? 'Needs review' : 'Draft'} /></div><div className="space-y-2">{headers.map((header) => <div key={header} className="grid grid-cols-[1fr_auto_1fr] items-center gap-2"><span className="truncate rounded bg-[#f3f0e7] px-2 py-2 text-xs text-[#65756e]">{header}</span><ArrowRight size={13} className="text-[#aab4ae]" /><select value={activeMapping[header] ?? ''} onChange={(event) => setMapping({ ...activeMapping, [header]: event.target.value })} className="h-9 rounded-lg border border-[#d9d5ca] bg-[#fbfaf5] px-2 text-xs"><option value="">Custom attribute</option>{standardFields.map((field) => <option key={field} value={field}>{field}</option>)}</select></div>)}</div>{missing.length > 0 && <div className="mt-4"><Notice kind="warning">Missing mandatory mapping: {missing.join(', ')}. Correct it before approval.</Notice></div>}<button disabled={!canEdit || missing.length > 0} onClick={saveImport} className="mt-5 flex items-center gap-2 rounded-lg bg-[#2e7067] px-4 py-2.5 text-xs font-semibold text-[#f8f5ed] disabled:cursor-not-allowed disabled:opacity-40"><Check size={14} />Save import as draft</button></>}</section></div><section className="mt-5 rounded-xl border border-[#d9d5ca] bg-[#fbfaf5] p-5 md:p-6"><div className="flex items-center justify-between"><div><SectionEyebrow icon={History}>3 · Reconciliation history</SectionEyebrow><h3 className="font-display text-lg font-semibold">Imports in this workspace</h3></div><span className="text-xs text-[#89918d]">{workspace.imports.length} imports</span></div>{workspace.imports.length === 0 ? <p className="mt-6 text-sm text-[#89918d]">No imports yet. Nothing is overwritten by this release.</p> : <div className="mt-5 space-y-2">{workspace.imports.map((item) => <div key={item.id} className="flex flex-col justify-between gap-3 rounded-lg border border-[#e3ded3] p-3 sm:flex-row sm:items-center"><div><p className="text-sm font-semibold">{item.fileName}</p><p className="mt-1 text-xs text-[#89918d]">{item.validRows}/{item.rows} rows valid · {item.customFields.length} custom fields preserved</p></div><div className="flex items-center gap-3"><StatusPill status={item.status} />{item.exceptions.length > 0 && <span className="text-[11px] text-[#a75548]">{item.exceptions.length} exceptions</span>}</div></div>)}</div>}</section></PageFrame>;
}

function RewardsPage({ workspace, setWorkspace, canEdit }: { workspace: WorkspaceState; setWorkspace: (next: WorkspaceState) => void; canEdit: boolean }) {
  const reward = workspace.rewards;
  const update = (key: keyof RewardSettings, value: string | number | boolean) => setWorkspace({ ...workspace, rewards: { ...reward, [key]: value } });
  const factor = reward.performance < reward.threshold ? 0 : Math.min(reward.cap / 100, (reward.performance - reward.threshold) / Math.max(1, 100 - reward.threshold));
  const targetEarnings = reward.baseSalary * (reward.targetBonus / 100);
  const earned = Math.round((targetEarnings * factor * (reward.weight / 100) * (reward.proration / 100)) / (reward.rounding === 'Nearest 100' ? 100 : reward.rounding === 'Nearest whole' ? 1 : .01)) * (reward.rounding === 'Nearest 100' ? 100 : reward.rounding === 'Nearest whole' ? 1 : .01);
  const compa = reward.bandMid ? reward.baseSalary / reward.bandMid : 0;
  return <PageFrame eyebrow="Reward / customer rules only" title="Reward review" description="Model bands and bonus rules transparently. Benchmark data is never invented; simulation is separate from proposal and approval."><div className="mb-5 grid gap-3 md:grid-cols-3"><Notice kind="warning">No authorised benchmark source is configured. Add source, date, currency and salary period before using external benchmark comparisons.</Notice><Notice>Factors below are weighted and capped, not silently multiplied. Review the rule with your reward owner.</Notice><Notice kind="info">No payroll execution or automatic employment decision is available in this release.</Notice></div><div className="grid gap-5 xl:grid-cols-[1fr_.8fr]"><section className="rounded-xl border border-[#d9d5ca] bg-[#fbfaf5] p-5 md:p-6"><div className="flex items-start justify-between"><div><SectionEyebrow icon={BarChart3}>Customer-input rules</SectionEyebrow><h3 className="font-display text-lg font-semibold">Band and bonus inputs</h3></div><StatusPill status={canEdit ? 'Draft' : 'Needs review'} /></div><div className="mt-5 grid gap-4 sm:grid-cols-3"><Field label="Band minimum" value={reward.bandMin} onChange={(value) => update('bandMin', Number(value))} type="number" disabled={!canEdit} /><Field label="Band midpoint" value={reward.bandMid} onChange={(value) => update('bandMid', Number(value))} type="number" disabled={!canEdit} /><Field label="Band maximum" value={reward.bandMax} onChange={(value) => update('bandMax', Number(value))} type="number" disabled={!canEdit} /></div><div className="mt-4 grid gap-4 sm:grid-cols-2"><Field label="Base salary" value={reward.baseSalary} onChange={(value) => update('baseSalary', Number(value))} type="number" disabled={!canEdit} /><Field label="Target bonus %" value={reward.targetBonus} onChange={(value) => update('targetBonus', Number(value))} type="number" disabled={!canEdit} /><Field label="Performance %" value={reward.performance} onChange={(value) => update('performance', Number(value))} type="number" disabled={!canEdit} /><Field label="Threshold %" value={reward.threshold} onChange={(value) => update('threshold', Number(value))} type="number" disabled={!canEdit} /><Field label="Cap %" value={reward.cap} onChange={(value) => update('cap', Number(value))} type="number" disabled={!canEdit} /><Field label="Weight %" value={reward.weight} onChange={(value) => update('weight', Number(value))} type="number" disabled={!canEdit} /><Field label="Proration %" value={reward.proration} onChange={(value) => update('proration', Number(value))} type="number" disabled={!canEdit} /><Field label="Funding rule" value={reward.fundingRule} onChange={(value) => update('fundingRule', value)} disabled={!canEdit} /></div><div className="mt-4 grid gap-4 sm:grid-cols-3"><Field label="Benchmark source" value={reward.benchmarkSource} onChange={(value) => update('benchmarkSource', value)} placeholder="Required to compare" disabled={!canEdit} /><Field label="Source date" value={reward.benchmarkDate} onChange={(value) => update('benchmarkDate', value)} placeholder="YYYY-MM-DD" disabled={!canEdit} /><Field label="Salary period" value={reward.salaryPeriod} onChange={(value) => update('salaryPeriod', value)} disabled={!canEdit} /></div></section><aside className="rounded-xl border border-[#d9d5ca] bg-[#263a41] p-5 text-[#f3f1e9] shadow-[0_12px_30px_rgba(48,54,50,.08)] md:p-6"><SectionEyebrow icon={Calculator}>Transparent simulation</SectionEyebrow><h3 className="font-display text-2xl font-semibold">Illustrative only</h3><p className="mt-2 text-sm leading-6 text-[#b5c3be]">This calculation uses only customer-entered rules. It does not create a proposal or approval.</p><div className="mt-7 space-y-3 border-t border-[#4b5c61] pt-5"><div className="flex justify-between text-sm"><span className="text-[#b5c3be]">Compa-ratio</span><strong>{(compa * 100).toFixed(0)}%</strong></div><div className="flex justify-between text-sm"><span className="text-[#b5c3be]">Target bonus</span><strong>{formatMoney(targetEarnings, reward.currency)}</strong></div><div className="flex justify-between text-sm"><span className="text-[#b5c3be]">Earned simulation</span><strong className="text-[#d8ad54]">{formatMoney(earned, reward.currency)}</strong></div><div className="flex justify-between text-sm"><span className="text-[#b5c3be]">Eligibility</span><strong>{reward.benefitEligible ? 'Eligible' : 'Not eligible'}</strong></div></div><div className="mt-6"><Notice kind="warning">Benchmark salaries: data required, not invented.</Notice></div></aside></div></PageFrame>;
}

function CapacityPage({ workspace, setWorkspace, canEdit }: { workspace: WorkspaceState; setWorkspace: (next: WorkspaceState) => void; canEdit: boolean }) {
  const [taskOpen, setTaskOpen] = useState(false);
  const totalHours = workspace.capacity.reduce((sum, task) => sum + task.hours, 0);
  const released = workspace.capacity.reduce((sum, task) => sum + (task.workType === 'Human-led' ? 0 : Math.max(0, task.hours - task.reviewHours) * (1 - task.reworkRate / 100)), 0);
  return <PageFrame eyebrow="Capacity / accountable humans" title="Human + AI capacity" description="Assess work at task level. Review, exceptions and rework remain visible; agent count is never treated as human FTE."><div className="mb-5 grid gap-3 md:grid-cols-3"><Notice>Released capacity is not savings. It may be redeployed, validate avoided hiring, or remain a hypothesis.</Notice><Notice kind="warning">AI services are unconfigured. The examples below are synthetic demonstrations, not tested live capability.</Notice><Notice kind="info">Every executable task requires restrictions, tested evidence, authorised autonomy and an accountable human.</Notice></div><div className="mb-5 grid gap-3 sm:grid-cols-3"><Metric label="Tasks assessed" value={String(workspace.capacity.length)} detail="Task-level view" icon={ClipboardCheck} /><Metric label="Hours reviewed" value={`${totalHours}h`} detail="Current weekly estimate" icon={History} /><Metric label="Potentially released" value={`${released.toFixed(1)}h`} detail="After review and rework" icon={Zap} /></div><section className="rounded-xl border border-[#d9d5ca] bg-[#fbfaf5] p-5 md:p-6"><div className="flex items-start justify-between"><div><SectionEyebrow icon={Workflow}>Work assessment</SectionEyebrow><h3 className="font-display text-lg font-semibold">Work that can be discussed</h3></div>{canEdit && <button onClick={() => setTaskOpen(true)} className="flex items-center gap-2 rounded-lg bg-[#2e7067] px-3 py-2 text-xs font-semibold text-[#f8f5ed]"><Plus size={14} /> Add task</button>}</div><div className="mt-5 space-y-2">{workspace.capacity.map((task) => <div key={task.id} className="grid gap-3 rounded-lg border border-[#e3ded3] p-4 lg:grid-cols-[1.2fr_.8fr_.6fr_.8fr_auto] lg:items-center"><div><p className="text-sm font-semibold">{task.task}</p><p className="mt-1 text-[11px] text-[#89918d]">{task.accountableHuman} · {task.restrictions}</p></div><span className="w-fit rounded-full bg-[#eef4ef] px-2 py-1 text-[10px] font-semibold text-[#39786f]">{task.workType}</span><span className="text-xs text-[#68746f]">{task.hours}h / {task.reviewHours}h review</span><span className="text-xs text-[#68746f]">{task.reworkRate}% rework · {task.autonomy}</span><span className="text-xs font-semibold text-[#39786f]">{task.evidence.includes('Synthetic') ? 'Synthetic evidence' : 'Customer evidence'}</span></div>)}</div></section>{taskOpen && <TaskModal onClose={() => setTaskOpen(false)} onAdd={(task) => { setWorkspace({ ...workspace, capacity: [...workspace.capacity, task] }); setTaskOpen(false); }} />}</PageFrame>;
}

function TaskModal({ onClose, onAdd }: { onClose: () => void; onAdd: (task: CapacityTask) => void }) {
  const [task, setTask] = useState('');
  const [hours, setHours] = useState('8');
  const [workType, setWorkType] = useState<CapacityTask['workType']>('Agent-assisted');
  return <Modal title="Add a task assessment" description="Keep the task, restrictions and accountable human visible before discussing capacity." onClose={onClose}><form onSubmit={(event) => { event.preventDefault(); if (!task.trim()) return; onAdd({ id: `task-${Date.now()}`, task: task.trim(), workType, hours: Number(hours) || 0, reviewHours: 2, reworkRate: 10, restrictions: 'Customer review required before action.', evidence: 'Customer evidence required.', autonomy: 'Not authorised', accountableHuman: 'Unassigned owner' }); }} className="space-y-4"><Field label="Task" value={task} onChange={setTask} placeholder="e.g. Draft weekly service summary" /><div className="grid gap-3 sm:grid-cols-2"><Field label="Weekly hours" value={hours} onChange={setHours} type="number" /><label className="block"><span className="mb-1.5 block text-xs font-semibold text-[#516068]">Work type</span><select value={workType} onChange={(event) => setWorkType(event.target.value as CapacityTask['workType'])} className="h-10 w-full rounded-lg border border-[#d9d5ca] bg-[#fbfaf5] px-2 text-xs"><option>Human-led</option><option>Agent-assisted</option><option>Agent-executable</option></select></label></div><Notice kind="warning">New tasks start as Not authorised with customer evidence required.</Notice><div className="flex justify-end gap-2 border-t border-[#e3ded3] pt-4"><button type="button" onClick={onClose} className="rounded-lg px-3 py-2 text-xs font-semibold text-[#6d7973]">Cancel</button><button type="submit" className="rounded-lg bg-[#2e7067] px-4 py-2 text-xs font-semibold text-[#f8f5ed]">Add assessment</button></div></form></Modal>;
}

function BusinessCasePage({ workspace, setWorkspace, canEdit }: { workspace: WorkspaceState; setWorkspace: (next: WorkspaceState) => void; canEdit: boolean }) {
  const model = workspace.businessCase;
  const annualBenefit = model.targetAnnualValue - model.ongoingCost;
  const roi = model.investment > 0 ? ((annualBenefit - model.investment) / model.investment) * 100 : 0;
  const actualKnown = Boolean(model.actualMeasure.trim());
  return <PageFrame eyebrow="Business case / traceable value" title="Build a business case" description="Compare doing nothing, redeploying capacity and automation with review. ROI and Return on Value remain separate measures."><div className="mb-5"><Notice kind="warning">External AI, benchmark and payment services are unconfigured. Any analysis requiring them stays visibly unavailable and cannot spend credits.</Notice></div><div className="grid gap-5 xl:grid-cols-[.9fr_1.1fr]"><section className="rounded-xl border border-[#d9d5ca] bg-[#fbfaf5] p-5 md:p-6"><SectionEyebrow icon={Calculator}>1 · Model the option</SectionEyebrow><div className="grid gap-4 sm:grid-cols-2"><label className="block sm:col-span-2"><span className="mb-1.5 block text-xs font-semibold text-[#516068]">Option</span><select value={model.option} onChange={(event) => setWorkspace({ ...workspace, businessCase: { ...model, option: event.target.value as BusinessCase['option'] } })} className="h-11 w-full rounded-lg border border-[#d9d5ca] bg-[#fbfaf5] px-3 text-sm"><option>Do nothing</option><option>Redeploy capacity</option><option>Automate with review</option></select></label><Field label="Ongoing do-nothing cost" value={model.baselineCost} onChange={(value) => setWorkspace({ ...workspace, businessCase: { ...model, baselineCost: Number(value) } })} type="number" disabled={!canEdit} /><Field label="One-off investment" value={model.investment} onChange={(value) => setWorkspace({ ...workspace, businessCase: { ...model, investment: Number(value) } })} type="number" disabled={!canEdit} /><Field label="Target annual value" value={model.targetAnnualValue} onChange={(value) => setWorkspace({ ...workspace, businessCase: { ...model, targetAnnualValue: Number(value) } })} type="number" disabled={!canEdit} /><Field label="Ongoing annual cost" value={model.ongoingCost} onChange={(value) => setWorkspace({ ...workspace, businessCase: { ...model, ongoingCost: Number(value) } })} type="number" disabled={!canEdit} /><Field label="Owner" value={model.owner} onChange={(value) => setWorkspace({ ...workspace, businessCase: { ...model, owner: value } })} disabled={!canEdit} /></div><div className="mt-5 border-t border-[#e3ded3] pt-5"><SectionEyebrow icon={Target}>Return on Value</SectionEyebrow><div className="grid gap-4"><Field label="Baseline measure" value={model.baselineMeasure} onChange={(value) => setWorkspace({ ...workspace, businessCase: { ...model, baselineMeasure: value } })} multiline disabled={!canEdit} /><Field label="Target measure" value={model.targetMeasure} onChange={(value) => setWorkspace({ ...workspace, businessCase: { ...model, targetMeasure: value } })} multiline disabled={!canEdit} /><Field label="Actual measure" value={model.actualMeasure} onChange={(value) => setWorkspace({ ...workspace, businessCase: { ...model, actualMeasure: value } })} multiline disabled={!canEdit} /></div></div></section><aside className="rounded-xl border border-[#d9d5ca] bg-[#263a41] p-5 text-[#f3f1e9] shadow-[0_12px_30px_rgba(48,54,50,.08)] md:p-6"><SectionEyebrow icon={BarChart3}>2 · Reviewable output</SectionEyebrow><h3 className="font-display text-2xl font-semibold">{model.option}</h3><div className="mt-7 space-y-3 border-t border-[#4b5c61] pt-5"><div className="flex justify-between text-sm"><span className="text-[#b5c3be]">Annual benefit after ongoing cost</span><strong>{formatMoney(annualBenefit)}</strong></div><div className="flex justify-between text-sm"><span className="text-[#b5c3be]">Traceable ROI</span><strong className="text-[#d8ad54]">{roi.toFixed(1)}%</strong></div><div className="flex justify-between text-sm"><span className="text-[#b5c3be]">ROV baseline</span><strong>{model.baselineMeasure ? 'Set' : 'Required'}</strong></div><div className="flex justify-between text-sm"><span className="text-[#b5c3be]">ROV actual</span><strong>{actualKnown ? 'Recorded' : 'Not yet measured'}</strong></div></div><div className="mt-6"><Notice kind="info">ROI uses one-off investment once and ongoing cost once. It does not count released capacity and avoided hiring twice.</Notice></div></aside></div><section className="mt-5 rounded-xl border border-[#d9d5ca] bg-[#fbfaf5] p-5 md:p-6"><div className="flex items-center justify-between"><div><SectionEyebrow icon={GitBranch}>3 · Implementation roadmap</SectionEyebrow><h3 className="font-display text-lg font-semibold">Review before approval</h3></div><span className="text-xs text-[#89918d]">Owner: {model.owner}</span></div><div className="mt-5 grid gap-2 md:grid-cols-4">{model.roadmap.map((step, index) => <div key={step} className="rounded-lg border border-[#e3ded3] p-3"><span className="font-mono text-[10px] text-[#4d9b8d]">0{index + 1}</span><p className="mt-2 text-xs leading-5 text-[#526269]">{step}</p></div>)}</div><div className="mt-5 flex items-center gap-2 border-t border-[#e3ded3] pt-4 text-xs text-[#7c8780]"><StatusPill status="Needs review" /> Business cases need an owner, baseline, target and actual measure before approval.</div></section></PageFrame>;
}

function ContentPage({ workspace, setWorkspace, canEdit, initialRole }: { workspace: WorkspaceState; setWorkspace: (next: WorkspaceState) => void; canEdit: boolean; initialRole?: Role }) {
  const [roleId, setRoleId] = useState(initialRole?.id ?? workspace.roles[0]?.id ?? '');
  const current = workspace.roles.find((role) => role.id === roleId) ?? workspace.roles[0];
  const [preset, setPreset] = useState<StyleSettings['preset']>(workspace.style.preset);
  const [mode, setMode] = useState<'profile' | 'advert'>('profile');
  if (!current) return <PageFrame eyebrow="Content studio" title="No role selected" description="Add a role before writing content." />;
  const update = (next: Role) => setWorkspace({ ...workspace, roles: workspace.roles.map((role) => role.id === next.id ? next : role) });
  const text = mode === 'profile' ? current.profile : current.recruitmentAd;
  const preview = preset === 'Board paper' ? `Decision note: ${text}` : preset === 'Recruitment advert' ? text.replace('customer review', 'candidate review') : text;
  return <PageFrame eyebrow="Content studio / versioned outputs" title="Write, review, approve" description="Presets change tone and formatting only. Facts, numbers, job requirements and locked policy wording stay intact."><div className="mb-5 grid gap-3 md:grid-cols-3"><Notice>Approved content blocks can be reused across outputs. Customer edits create a new Needs review revision.</Notice><Notice kind="warning">Targeted rewrites and comments are local to the selected role in this release.</Notice><Notice kind="info">Source: {current.source} · Licence: {current.licence}</Notice></div><div className="grid gap-5 xl:grid-cols-[.75fr_1.25fr]"><aside className="rounded-xl border border-[#d9d5ca] bg-[#fbfaf5] p-5"><SectionEyebrow icon={FileText}>Select a role</SectionEyebrow><div className="space-y-1">{workspace.roles.map((role) => <button key={role.id} onClick={() => setRoleId(role.id)} className={cn('flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-xs transition', role.id === current.id ? 'bg-[#eef4ef] font-semibold text-[#317468]' : 'hover:bg-[#f4f0e7]')}><span className="truncate">{role.title}</span><StatusPill status={role.approval} /></button>)}</div></aside><section className="rounded-xl border border-[#d9d5ca] bg-[#fbfaf5] p-5 md:p-6"><div className="flex flex-col justify-between gap-4 border-b border-[#e3ded3] pb-5 md:flex-row md:items-center"><div><SectionEyebrow icon={Pencil}>Editable output</SectionEyebrow><h3 className="font-display text-lg font-semibold">{current.title}</h3></div><div className="flex flex-wrap gap-2"><select value={preset} onChange={(event) => setPreset(event.target.value as StyleSettings['preset'])} className="h-9 rounded-lg border border-[#d9d5ca] bg-[#fbfaf5] px-2 text-xs"><option>Board paper</option><option>Internal profile</option><option>Recruitment advert</option></select><select value={mode} onChange={(event) => setMode(event.target.value as 'profile' | 'advert')} className="h-9 rounded-lg border border-[#d9d5ca] bg-[#fbfaf5] px-2 text-xs"><option value="profile">Internal profile</option><option value="advert">Recruitment advert</option></select></div></div><div className="mt-5 grid gap-5 lg:grid-cols-2"><div><label className="block"><span className="mb-1.5 block text-xs font-semibold text-[#516068]">Draft content</span><textarea value={text} disabled={!canEdit} onChange={(event) => update({ ...current, ...(mode === 'profile' ? { profile: event.target.value } : { recruitmentAd: event.target.value }), approval: 'Needs review', updatedAt: new Date().toISOString() })} rows={11} className="w-full rounded-lg border border-[#d9d5ca] bg-[#fbfaf5] px-3 py-2.5 text-sm leading-6 outline-none focus:border-[#75a79d] disabled:bg-[#f0eee7]" /></label><div className="mt-3 rounded-lg border border-[#ead8a8] bg-[#fbf3d9] p-3 text-xs leading-5 text-[#77612d]"><Lock size={13} className="mr-1 inline" />{current.lockedText}</div><div className="mt-4 flex flex-wrap gap-2">{canEdit && <button onClick={() => update({ ...current, approval: 'Needs review', updatedAt: new Date().toISOString() })} className="flex items-center gap-2 rounded-lg bg-[#2e7067] px-3 py-2.5 text-xs font-semibold text-[#f8f5ed]"><Save size={14} />Save revision</button>}{current.approval !== 'Approved' && <button disabled={!canEdit} onClick={() => update({ ...current, approval: 'Approved', updatedAt: new Date().toISOString() })} className="flex items-center gap-2 rounded-lg border border-[#b7d2c6] px-3 py-2.5 text-xs font-semibold text-[#39786f] disabled:opacity-40"><CheckCircle2 size={14} />Approve</button>}</div></div><div className="rounded-xl bg-[#f4f0e7] p-5"><div className="flex items-center justify-between"><p className="font-mono text-[10px] uppercase tracking-[.16em] text-[#858e88]">Live preview</p><StatusPill status={current.approval} /></div><h4 className="mt-4 font-display text-xl font-semibold">{current.title}</h4><p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-[#526269]">{preview}</p><div className="mt-6 border-t border-[#ded9ce] pt-4"><p className="text-[11px] font-semibold text-[#63726c]">Source and assumptions</p><p className="mt-1 text-xs leading-5 text-[#89918d]">{current.source}; {current.framework}/{current.referenceCode}; missing evidence is explicitly called out.</p></div></div></div></section></div></PageFrame>;
}

function SettingsPage({ workspace, setWorkspace, session }: { workspace: WorkspaceState; setWorkspace: (next: WorkspaceState) => void; session: Session }) {
  return <PageFrame eyebrow="Workspace / controls" title="Settings" description="Customer admins manage their own branding, users, templates and rules. Platform plans, pricing and packages remain separate from customer administration."><div className="grid gap-5 xl:grid-cols-2"><section className="rounded-xl border border-[#d9d5ca] bg-[#fbfaf5] p-5 md:p-6"><SectionEyebrow icon={Building2}>Customer context</SectionEyebrow><h3 className="font-display text-lg font-semibold">{session.customerName}</h3><p className="mt-1 text-xs text-[#89918d]">{session.role} · scoped customer workspace</p><div className="mt-5 space-y-2 text-xs text-[#66736e]">{[['Mission', workspace.context.mission], ['Systems', workspace.context.systems], ['Terminology', workspace.context.terminology], ['Policy state', workspace.context.policies]].map(([label, value]) => <div key={label} className="rounded-lg border border-[#e3ded3] p-3"><p className="font-semibold text-[#405056]">{label}</p><p className="mt-1 leading-5">{value}</p></div>)}</div></section><section className="rounded-xl border border-[#d9d5ca] bg-[#fbfaf5] p-5 md:p-6"><SectionEyebrow icon={ShieldCheck}>Trust boundary</SectionEyebrow><h3 className="font-display text-lg font-semibold">What is configured</h3><div className="mt-5 space-y-2"><div className="flex items-center justify-between rounded-lg bg-[#eef4ef] p-3 text-xs"><span>Secure sign-in</span><span className="font-semibold text-[#317468]">Configured</span></div><div className="flex items-center justify-between rounded-lg bg-[#fbf3d9] p-3 text-xs"><span>AI / benchmark integrations</span><span className="font-semibold text-[#916d28]">Not configured</span></div><div className="flex items-center justify-between rounded-lg bg-[#fbf3d9] p-3 text-xs"><span>Payments / credit purchases</span><span className="font-semibold text-[#916d28]">Test mode only</span></div><div className="flex items-center justify-between rounded-lg bg-[#eef4ef] p-3 text-xs"><span>Local autosave</span><span className="font-semibold text-[#317468]">Enabled</span></div></div><p className="mt-5 text-xs leading-5 text-[#89918d]">Support access and platform-owner actions are not self-selectable. Production support access needs explicit authorisation and an audit trail.</p></section></div><section className="mt-5 rounded-xl border border-[#d9d5ca] bg-[#263a41] p-5 text-[#f3f1e9] md:p-6"><div className="flex flex-col justify-between gap-4 md:flex-row md:items-center"><div><SectionEyebrow icon={ShieldAlert}>Platform boundary</SectionEyebrow><h3 className="font-display text-lg font-semibold">Platform administrator area</h3><p className="mt-1 max-w-xl text-xs leading-5 text-[#b5c3be]">Platform plans, pricing, packages, support access and audit controls are not available from a customer session.</p></div><Link href="/platform-admin" className="flex items-center gap-2 rounded-lg border border-[#60736f] px-3 py-2.5 text-xs font-semibold text-[#eff1e9] hover:bg-[#354c53]">View boundary <ArrowRight size={14} /></Link></div></section></PageFrame>;
}

function PlatformAdminPage() {
  return <div className="flex min-h-[calc(100dvh-72px)] items-center justify-center bg-[#f8f5ed] p-6"><div className="max-w-lg rounded-2xl border border-[#d9d5ca] bg-[#fbfaf5] p-8 text-center shadow-[0_14px_34px_rgba(48,54,50,.06)]"><ShieldAlert size={32} className="mx-auto text-[#c7866c]" /><p className="mt-4 font-mono text-[10px] uppercase tracking-[.18em] text-[#a75548]">Authorisation required</p><h2 className="mt-3 font-display text-3xl font-semibold tracking-[-.05em]">Platform owner access is separate.</h2><p className="mt-3 text-sm leading-6 text-[#68746f]">This customer session cannot access plans, pricing, package management or support tooling. Privileged access is granted through an authorised platform-owner session and audited separately.</p><Link href="/settings" className="mt-6 inline-flex items-center gap-2 rounded-lg bg-[#2e7067] px-4 py-2.5 text-xs font-semibold text-[#f8f5ed]">Return to settings <ArrowRight size={14} /></Link></div></div>;
}

function PageFrame({ eyebrow, title, description, children }: { eyebrow: string; title: string; description: string; children?: ReactNode }) {
  return <div className="min-h-[calc(100dvh-72px)] bg-[#f8f5ed]"><div className="mx-auto max-w-[1500px] px-5 py-7 md:px-8 md:py-9"><div className="mb-7"><SectionEyebrow icon={Layers3}>{eyebrow}</SectionEyebrow><h2 className="font-display text-[clamp(2rem,4vw,3rem)] font-semibold leading-none tracking-[-.055em]">{title}</h2><p className="mt-3 max-w-2xl text-sm leading-6 text-[#68746f]">{description}</p></div>{children}</div></div>;
}

function WorkspaceApp({ session, workspace, setWorkspace, savedAt, onSignOut }: { session: Session; workspace: WorkspaceState; setWorkspace: (next: WorkspaceState) => void; savedAt?: string; onSignOut: () => void }) {
  const [location, setLocation] = useLocation();
  const canEdit = session.role === 'customer-admin';
  const [contentRole, setContentRole] = useState<Role | undefined>();
  const page = location === '/roles' ? <RolesPage workspace={workspace} setWorkspace={setWorkspace} canEdit={canEdit} onOpenContent={(role) => { setContentRole(role); setLocation('/content'); }} /> : location === '/imports' ? <ImportsPage workspace={workspace} setWorkspace={setWorkspace} canEdit={canEdit} /> : location === '/rewards' ? <RewardsPage workspace={workspace} setWorkspace={setWorkspace} canEdit={canEdit} /> : location === '/capacity' ? <CapacityPage workspace={workspace} setWorkspace={setWorkspace} canEdit={canEdit} /> : location === '/business-case' ? <BusinessCasePage workspace={workspace} setWorkspace={setWorkspace} canEdit={canEdit} /> : location === '/content' ? <ContentPage workspace={workspace} setWorkspace={setWorkspace} canEdit={canEdit} initialRole={contentRole} /> : location === '/settings' ? <SettingsPage workspace={workspace} setWorkspace={setWorkspace} session={session} /> : location === '/platform-admin' ? <PlatformAdminPage /> : <OverviewPage workspace={workspace} setLocation={setLocation} />;
  return <AppShell session={session} savedAt={savedAt} onSignOut={onSignOut}>{page}</AppShell>;
}

function SignInPage() {
  return <div className="flex min-h-[100dvh] items-center justify-center bg-[#f8f5ed] px-4"><SignIn routing="path" path={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} /></div>;
}

function SignUpPage() {
  return <div className="flex min-h-[100dvh] items-center justify-center bg-[#f8f5ed] px-4"><SignUp routing="path" path={`${basePath}/sign-up`} signInUrl={`${basePath}/sign-in`} /></div>;
}

function AppContent() {
  const { isLoaded, isSignedIn, user } = useUser();
  const { signOut } = useClerk();
  const [demoSession, setDemoSession] = useState<Session | null>(() => readJson<Session | null>('wa.session', null));
  const [location, setLocation] = useLocation();
  const realSession: Session | null = isSignedIn && user ? { mode: 'real', customerId: `user-${user.id}`, customerName: user.fullName ?? user.primaryEmailAddress?.emailAddress ?? 'Customer workspace', role: 'customer-admin', synthetic: false } : null;
  const session = demoSession ?? realSession;
  const customerId = session?.customerId;
  const [workspace, setWorkspace] = useState<WorkspaceState>(() => customerId ? readJson(`wa.workspace.${customerId}`, defaultWorkspace(customerId)) : defaultWorkspace('northstar'));
  const [savedAt, setSavedAt] = useState<string | undefined>(workspace.savedAt);
  useEffect(() => { if (customerId) { const next = readJson<WorkspaceState>(`wa.workspace.${customerId}`, defaultWorkspace(customerId)); setWorkspace(next); setSavedAt(next.savedAt); } }, [customerId]);
  useEffect(() => { if (!customerId || !workspace) return; const timer = window.setTimeout(() => { const next = { ...workspace, savedAt: new Date().toISOString() }; writeJson(`wa.workspace.${customerId}`, next); setSavedAt(next.savedAt); }, 500); return () => window.clearTimeout(timer); }, [workspace, customerId]);
  if (!isLoaded) return <div className="flex min-h-[100dvh] items-center justify-center bg-[#f8f5ed] text-sm text-[#6f7c76]">Loading secure workspace…</div>;
  if (location.startsWith('/sign-in')) return <SignInPage />;
  if (location.startsWith('/sign-up')) return <SignUpPage />;
  if (!session) return <WelcomePage onDemo={(customer, outcome) => { const next = { ...customer, customerId: customer.customerId } as Session; setDemoSession(next); writeJson('wa.session', next); const initial = readJson<WorkspaceState>(`wa.workspace.${customer.customerId}`, defaultWorkspace(customer.customerId)); setWorkspace({ ...initial, selectedOutcome: outcome }); setLocation('/onboarding'); }} />;
  if (location === '/onboarding' && !workspace.onboardingComplete) return <OnboardingPage workspace={workspace} setWorkspace={setWorkspace} session={session} onComplete={() => setLocation('/workspace')} />;
  if (!workspace.onboardingComplete && location !== '/onboarding') return <Redirect to="/onboarding" />;
  return <WorkspaceApp session={session} workspace={workspace} setWorkspace={setWorkspace} savedAt={savedAt} onSignOut={() => { if (demoSession) { localStorage.removeItem('wa.session'); setDemoSession(null); setLocation('/'); } else { void signOut({ redirectUrl: basePath || '/' }); } }} />;
}

export default function WorkforceApp() {
  if (!clerkPubKey) return <div className="flex min-h-[100dvh] items-center justify-center bg-[#f8f5ed] p-6"><div className="max-w-md text-center"><CircleAlert className="mx-auto text-[#c7866c]" /><h1 className="mt-4 font-display text-2xl font-semibold">Secure sign-in is not configured</h1><p className="mt-2 text-sm leading-6 text-[#68746f]">This release needs the app's managed authentication configuration before it can open a customer workspace.</p></div></div>;
  return <WouterRouter base={basePath}><ClerkProvider publishableKey={clerkPubKey} proxyUrl={clerkProxyUrl} appearance={{ theme: shadcn, cssLayerName: 'clerk', options: { logoPlacement: 'inside', logoLinkUrl: basePath || '/', logoImageUrl: `${window.location.origin}${basePath}/logo.svg` }, variables: { colorPrimary: '#2e7067', colorForeground: '#26353a', colorMutedForeground: '#68746f', colorBackground: '#fbfaf5', colorInput: '#fbfaf5', colorInputForeground: '#26353a', colorNeutral: '#d9d5ca', fontFamily: 'DM Sans', borderRadius: '0.75rem' }, elements: { cardBox: 'bg-[#fbfaf5] rounded-2xl w-[440px] max-w-full overflow-hidden', card: '!shadow-none !border-0 !bg-transparent !rounded-none', footer: '!shadow-none !border-0 !bg-transparent !rounded-none', headerTitle: 'text-[#26353a]', headerSubtitle: 'text-[#68746f]', formFieldLabel: 'text-[#516068]', footerActionLink: 'text-[#39786f]', footerActionText: 'text-[#68746f]', dividerText: 'text-[#68746f]', formButtonPrimary: 'bg-[#2e7067] hover:bg-[#255e57]', formFieldInput: 'bg-[#fbfaf5] text-[#26353a] border-[#d9d5ca]' } }} signInUrl={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} localization={{ signIn: { start: { title: 'Welcome back to Workforce Architecture', subtitle: 'Sign in to continue your customer workspace' } }, signUp: { start: { title: 'Create your Workforce Architecture account', subtitle: 'Start with a guided organisation context' } } }}><AppContent /></ClerkProvider></WouterRouter>;
}