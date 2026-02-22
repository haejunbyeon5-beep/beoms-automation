
import React, { useEffect, useRef } from 'react';
import { Terminal } from 'lucide-react';

interface StatusMonitorProps {
  logs: string[];
}

const StatusMonitor: React.FC<StatusMonitorProps> = ({ logs }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="flex flex-col h-full bg-[#0a0a0b] rounded-xl border border-slate-800/50 shadow-xl overflow-hidden">
      <div className="flex items-center gap-2.5 px-5 py-3 bg-[#12141a] border-b border-slate-800/50">
        <Terminal size={18} className="text-slate-500" />
        <span className="text-sm font-mono font-bold text-slate-400">PRODUCTION MONITOR</span>
      </div>
      <div 
        ref={scrollRef}
        className="flex-1 p-5 font-mono text-sm overflow-y-auto space-y-2 scroll-smooth"
      >
        {logs.length === 0 ? (
          <div className="text-slate-600 italic text-sm">Waiting for script input to begin generation...</div>
        ) : (
          logs.map((log, i) => (
            <div key={i} className="text-slate-300 flex gap-2.5 leading-relaxed">
              <span className="text-slate-600 shrink-0">[{new Date().toLocaleTimeString()}]</span>
              <span className="font-medium">{log}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default StatusMonitor;
