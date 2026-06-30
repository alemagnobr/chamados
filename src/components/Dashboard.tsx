import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { isToday, isThisWeek, isThisMonth } from 'date-fns';
import { Ticket, AppSettings } from '@/types';
import { cn } from '@/lib/utils';

interface DashboardProps {
  tickets: Ticket[];
  appSettings: AppSettings;
}

export function Dashboard({ tickets, appSettings }: DashboardProps) {
  const [filter, setFilter] = useState('Todos');

  const filteredTickets = tickets.filter(ticket => {
    if (ticket.deleted || ticket.status !== 'FINALIZADO' || !ticket.finishedAt) return false;
    const date = new Date(ticket.finishedAt);
    if (filter === 'Dia') return isToday(date);
    if (filter === 'Semana') return isThisWeek(date);
    if (filter === 'Mês') return isThisMonth(date);
    return true; // Todos
  });

  // Simple bucketing for demo purposes
  const buckets = [
    { name: 'Até 3 min', max: 3 * 60, count: 0 },
    { name: 'Até 5 min', max: 5 * 60, count: 0 },
    { name: 'Até 10 min', max: 10 * 60, count: 0 },
    { name: 'Até 15 min', max: 15 * 60, count: 0 },
    { name: 'Até 20 min', max: 20 * 60, count: 0 },
    { name: 'Até 30 min', max: 30 * 60, count: 0 },
    { name: 'Mais de 30 min', max: Infinity, count: 0 },
  ];

  filteredTickets.forEach(ticket => {
    for (const bucket of buckets) {
      if (ticket.durationSeconds <= bucket.max) {
        bucket.count++;
        break;
      }
    }
  });

  const totalSeconds = filteredTickets.reduce((acc, t) => acc + t.durationSeconds, 0);
  const avgSeconds = filteredTickets.length > 0 ? totalSeconds / filteredTickets.length : 0;
  const avgMinutes = avgSeconds / 60;

  let slaStatus = 'Sem dados';
  let slaColor = 'bg-slate-200';
  let slaTextColor = 'text-slate-500';

  if (filteredTickets.length > 0) {
    if (avgMinutes <= appSettings.sla.otima) {
      slaStatus = 'Ótima';
      slaColor = 'bg-emerald-500';
      slaTextColor = 'text-emerald-700';
    } else if (avgMinutes <= appSettings.sla.boa) {
      slaStatus = 'Boa';
      slaColor = 'bg-blue-500';
      slaTextColor = 'text-blue-700';
    } else if (avgMinutes <= appSettings.sla.atencao) {
      slaStatus = 'Atenção';
      slaColor = 'bg-amber-500';
      slaTextColor = 'text-amber-700';
    } else if (avgMinutes <= appSettings.sla.ruim) {
      slaStatus = 'Ruim';
      slaColor = 'bg-orange-500';
      slaTextColor = 'text-orange-700';
    } else {
      slaStatus = 'Crítica';
      slaColor = 'bg-red-500';
      slaTextColor = 'text-red-700';
    }
  }

  const formatAvg = (secs: number) => {
    if (secs === 0) return '00:00';
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = Math.floor(secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
      <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h3 className="font-bold text-slate-800">Tempo de finalização de chamados</h3>
          <p className="text-xs text-slate-400 mt-1">{filteredTickets.length} chamado(s) finalizado(s) no período</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 px-4 py-2 bg-slate-50 rounded-lg border border-slate-100">
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">SLA Médio</span>
              <span className={cn("text-sm font-bold", slaTextColor)}>{formatAvg(avgSeconds)}</span>
            </div>
            <div className="h-8 w-px bg-slate-200"></div>
            <div className="flex items-center gap-2">
              <div className={cn("h-2.5 w-2.5 rounded-full", slaColor)}></div>
              <span className={cn("text-sm font-bold", slaTextColor)}>{slaStatus}</span>
            </div>
          </div>

          <select 
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 h-[38px]"
          >
            <option>Dia</option>
            <option>Semana</option>
            <option>Mês</option>
            <option>Todos</option>
          </select>
        </div>
      </div>

      <div className="h-64 mt-6 px-6">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={buckets} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} dy={10} />
            <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
            <Tooltip 
              cursor={{ fill: '#f1f5f9' }}
              contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            />
            <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={80} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      
      <div className="p-6 bg-slate-50 mt-6">
        <h4 className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-4">Relatório no dia</h4>
        <div className="grid grid-cols-2 gap-x-12 gap-y-4">
          {buckets.map((bucket, index) => (
            <div key={bucket.name} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
              <span className="text-sm font-medium text-slate-600">{bucket.name}</span>
              <span className="text-sm font-bold text-slate-900">{bucket.count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
