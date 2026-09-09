import { useState } from 'react';
import { Bot, CreditCard, LibraryBig } from 'lucide-react';
import PlatformAppV2 from './PlatformAppV2';
import AgentControlCenter from './AgentControlCenter';
import CommercialCenter from './CommercialCenter';
import PlatformSessionBridge from './PlatformSessionBridge';
import ResourceHub from './ResourceHub';

export default function App() {
  const [agentsOpen, setAgentsOpen] = useState(false);
  const [commercialOpen, setCommercialOpen] = useState(false);
  const [resourcesOpen, setResourcesOpen] = useState(false);

  return <>
    <PlatformAppV2 />
    <PlatformSessionBridge />
    <div className="fixed bottom-4 right-4 z-[95] flex flex-col gap-2 sm:flex-row">
      <button onClick={() => setResourcesOpen(true)} className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#cfdbd5] bg-[#fbfaf6]/95 px-3.5 py-2.5 text-xs font-semibold text-[#41655e] shadow-lg backdrop-blur"><LibraryBig size={15}/> Resources</button>
      <button onClick={() => setCommercialOpen(true)} className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#cfdbd5] bg-[#fbfaf6]/95 px-3.5 py-2.5 text-xs font-semibold text-[#41655e] shadow-lg backdrop-blur"><CreditCard size={15}/> Plans & credits</button>
      <button onClick={() => setAgentsOpen(true)} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#2d6f66] px-3.5 py-2.5 text-xs font-semibold text-white shadow-lg"><Bot size={15}/> Agent control</button>
    </div>
    <ResourceHub open={resourcesOpen} onClose={() => setResourcesOpen(false)} />
    <AgentControlCenter open={agentsOpen} onClose={() => setAgentsOpen(false)} />
    <CommercialCenter open={commercialOpen} onClose={() => setCommercialOpen(false)} />
  </>;
}
