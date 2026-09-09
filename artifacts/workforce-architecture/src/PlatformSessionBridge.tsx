import { useEffect, useRef, useState } from 'react';

const WORKSPACE_KEY = 'northstar.businessWorkspace.v1';

type ServerWorkspace = { id: string; name?: string; industry?: string; employeeBand?: string; locations?: string[]; strategy?: string; goals?: string[]; communicationStyle?: string };
type BootstrapResponse = { workspace?: ServerWorkspace; tenant?: { id: string; name: string; plan: string; countryCode: string; dataRegion: string; currency: string }; wallet?: { balance: number; monthlyAllowance: number; spendingLimit: number } };

type Status = 'local' | 'connecting' | 'connected' | 'error';

export default function PlatformSessionBridge() {
  const [status, setStatus] = useState<Status>('connecting');
  const workspaceId = useRef<string | null>(null);
  const lastSynced = useRef<string>('');

  useEffect(() => {
    let cancelled = false;
    const bootstrap = async () => {
      try {
        const localRaw = localStorage.getItem(WORKSPACE_KEY);
        const local = localRaw ? JSON.parse(localRaw) : {};
        const response = await fetch('/api/platform/bootstrap', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ companyName: local.companyName || 'My Business' }),
        });
        if (response.status === 401) {
          if (!cancelled) setStatus('local');
          return;
        }
        if (!response.ok) throw new Error(String(response.status));
        const data = await response.json() as BootstrapResponse;
        if (cancelled) return;
        workspaceId.current = data.workspace?.id ?? null;
        if (data.workspace && !localRaw) {
          const mapped = {
            companyName: data.workspace.name || '',
            industry: data.workspace.industry || '',
            teamSize: data.workspace.employeeBand || '11-50',
            country: data.workspace.locations?.[0] || 'Canada',
            goals: (data.workspace.goals || []).join('\n'),
          };
          const raw = JSON.stringify(mapped);
          localStorage.setItem(WORKSPACE_KEY, raw);
          lastSynced.current = raw;
        } else if (localRaw) {
          lastSynced.current = localRaw;
        }
        setStatus('connected');
      } catch {
        if (!cancelled) setStatus('error');
      }
    };
    bootstrap();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (status !== 'connected') return;
    const timer = window.setInterval(async () => {
      const id = workspaceId.current;
      if (!id) return;
      const raw = localStorage.getItem(WORKSPACE_KEY) || '';
      if (!raw || raw === lastSynced.current) return;
      try {
        const local = JSON.parse(raw);
        const payload = {
          name: local.companyName || 'My Business',
          industry: local.industry || '',
          employeeBand: local.teamSize || '',
          locations: local.country ? [local.country] : ['Canada'],
          goals: String(local.goals || '').split('\n').map((value) => value.trim()).filter(Boolean),
        };
        const response = await fetch(`/api/platform/workspace/${id}`, {
          method: 'PATCH', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
        });
        if (response.ok) lastSynced.current = raw;
      } catch {
        // Keep local data; retry on the next interval.
      }
    }, 2000);
    return () => window.clearInterval(timer);
  }, [status]);

  const label = status === 'connected' ? 'Workspace synced' : status === 'connecting' ? 'Connecting…' : status === 'local' ? 'Local beta mode' : 'Sync unavailable';
  return <div className="fixed bottom-4 left-4 z-[90] rounded-full border border-[#cedbd5] bg-[#fbfaf6]/95 px-3 py-1.5 text-[10px] font-semibold text-[#58716b] shadow-lg backdrop-blur">{label}</div>;
}
