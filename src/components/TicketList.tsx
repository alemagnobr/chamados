import { Eye, Edit, Trash2, Search as SearchIcon } from 'lucide-react';
import { useState, useMemo } from 'react';
import { isToday, isThisWeek, isThisMonth } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Ticket, AppSettings } from '@/types';
import { cn } from '@/lib/utils';

interface TicketListProps {
  tickets: Ticket[];
  appSettings: AppSettings;
  onDelete?: (id: string) => void;
  onEdit?: (id: string) => void;
  onUpdate?: (ticket: Ticket) => void;
}

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s}s`;
}

function formatDateStr(dateString: string) {
  const d = new Date(dateString);
  return d.toLocaleString('pt-BR', { 
    day: '2-digit', month: '2-digit', year: 'numeric', 
    hour: '2-digit', minute: '2-digit', second: '2-digit' 
  });
}

export function TicketList({ tickets, appSettings, onDelete, onEdit, onUpdate }: TicketListProps) {
  const [filter, setFilter] = useState('Todos');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewingTicket, setViewingTicket] = useState<Ticket | null>(null);
  const [isEditingTime, setIsEditingTime] = useState(false);
  const [editMinutes, setEditMinutes] = useState('0');
  const [editSeconds, setEditSeconds] = useState('0');

  const filteredTickets = tickets.filter(ticket => {
    // Hide deleted tickets
    if (ticket.deleted) return false;
    
    // Date filter
    const dateStr = ticket.finishedAt || ticket.createdAt;
    if (!dateStr) return false;
    const date = new Date(dateStr);
    let dateMatch = true;
    if (filter === 'Dia') dateMatch = isToday(date);
    else if (filter === 'Semana') dateMatch = isThisWeek(date);
    else if (filter === 'Mês') dateMatch = isThisMonth(date);
    
    if (!dateMatch) return false;

    // Category filter
    if (categoryFilter && ticket.category !== categoryFilter) return false;

    // Search filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      const content = `
        ${ticket.description || ''} 
        ${ticket.id || ''}
        ${ticket.networkLogin || ''}
        ${ticket.extension || ''}
        ${ticket.mobile || ''}
      `.toLowerCase();
      
      if (!content.includes(term)) return false;
    }

    return true;
  });

  // Dashboard Metrics Calculation
  const finishedFilteredTickets = filteredTickets.filter(t => t.status === 'FINALIZADO');
  
  const buckets = [
    { name: 'Até 3 min', max: 3 * 60, count: 0 },
    { name: 'Até 5 min', max: 5 * 60, count: 0 },
    { name: 'Até 10 min', max: 10 * 60, count: 0 },
    { name: 'Até 15 min', max: 15 * 60, count: 0 },
    { name: 'Até 20 min', max: 20 * 60, count: 0 },
    { name: 'Até 30 min', max: 30 * 60, count: 0 },
    { name: 'Mais de 30 min', max: Infinity, count: 0 },
  ];

  finishedFilteredTickets.forEach(ticket => {
    for (const bucket of buckets) {
      if (ticket.durationSeconds <= bucket.max) {
        bucket.count++;
        break;
      }
    }
  });

  const totalSeconds = finishedFilteredTickets.reduce((acc, t) => acc + t.durationSeconds, 0);
  const avgSeconds = finishedFilteredTickets.length > 0 ? totalSeconds / finishedFilteredTickets.length : 0;
  const avgMinutes = avgSeconds / 60;

  let slaStatus = 'Sem dados';
  let slaColor = 'bg-slate-200';
  let slaTextColor = 'text-slate-500';

  if (finishedFilteredTickets.length > 0) {
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

  const shortRecommendation = useMemo(() => {
    if (finishedFilteredTickets.length === 0) return null;
    
    const otima = appSettings.sla.otima * 60;
    const boa = appSettings.sla.boa * 60;
    const atencao = appSettings.sla.atencao * 60;
    const ruim = appSettings.sla.ruim * 60;

    let targetSlaSecs = otima;
    let targetName = 'Ótima';

    if (avgSeconds <= otima) {
      return null;
    } else if (avgSeconds <= boa) {
      targetSlaSecs = otima;
      targetName = 'Ótima';
    } else if (avgSeconds <= atencao) {
      targetSlaSecs = boa;
      targetName = 'Boa';
    } else if (avgSeconds <= ruim) {
      targetSlaSecs = atencao;
      targetName = 'Atenção';
    } else {
      targetSlaSecs = ruim;
      targetName = 'Ruim';
    }

    const totalCurrentSecs = avgSeconds * finishedFilteredTickets.length;
    const nextTicketsCount = 10;
    const allowedTotalSecs = targetSlaSecs * (finishedFilteredTickets.length + nextTicketsCount);
    const requiredSecsForNext = allowedTotalSecs - totalCurrentSecs;
    const maxAvgSecsForNext = requiredSecsForNext / nextTicketsCount;

    if (maxAvgSecsForNext <= 0) {
      return `Foque em reduzir o tempo gradativamente nos próximos chamados.`;
    } else {
      const maxMins = Math.floor(maxAvgSecsForNext / 60);
      const maxSecs = Math.floor(maxAvgSecsForNext % 60);
      return `Próx ${nextTicketsCount} chamados em até ${maxMins}m${maxSecs}s para SLA ${targetName}.`;
    }
  }, [avgSeconds, finishedFilteredTickets.length, appSettings.sla]);

  return (
    <div className="space-y-8 mt-8">
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
        <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div>
            <h3 className="font-bold text-slate-800">Tempo de finalização de chamados</h3>
            <p className="text-xs text-slate-400 mt-1">{finishedFilteredTickets.length} chamado(s) finalizado(s) no período</p>
            {shortRecommendation && (
              <p className="text-[11px] font-medium text-blue-600 mt-2 bg-blue-50 px-2 py-1 rounded inline-block">💡 {shortRecommendation}</p>
            )}
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
          </div>
        </div>

        {finishedFilteredTickets.length > 0 && (
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
        )}
      </div>

      <div>
        <div className="flex flex-col gap-4 mb-4">
          <h3 className="font-bold text-slate-800">Últimos chamados registrados</h3>
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-1 relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Buscar em chamados finalizados..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select 
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todas as categorias</option>
            {appSettings.categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          <select 
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option>Dia</option>
            <option>Semana</option>
            <option>Mês</option>
            <option>Todos</option>
          </select>
        </div>
      </div>

      <div className="space-y-4">
        {filteredTickets.map(ticket => (
          <div key={ticket.id} className="bg-white border border-slate-200 rounded-xl p-5 hover:border-blue-300 transition-colors shadow-sm">
            <div className="flex justify-between items-start gap-4">
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-3">
                  <span className={cn(
                    "px-2.5 py-0.5 rounded-full text-xs font-bold",
                    ticket.status === 'FINALIZADO' ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                  )}>
                    {ticket.status === 'FINALIZADO' ? 'FINALIZADO' : 'EM ANDAMENTO'}
                  </span>
                  {onUpdate ? (
                    <select
                      value={ticket.category || ''}
                      onChange={(e) => {
                        e.stopPropagation();
                        onUpdate({ ...ticket, category: e.target.value });
                      }}
                      className="px-2 py-0.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold outline-none cursor-pointer hover:bg-indigo-100 transition-colors"
                    >
                      <option value="">Sem categoria</option>
                      {appSettings.categories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  ) : ticket.category && (
                    <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-bold">
                      {ticket.category}
                    </span>
                  )}
                  {ticket.isEscalated && (
                    <span className="px-2.5 py-0.5 rounded-full bg-blue-100 border border-blue-200 text-blue-700 text-xs font-bold">
                      ESCALONADO
                    </span>
                  )}
                  {ticket.status === 'FINALIZADO' ? (
                    <div className="flex items-center gap-2 group">
                      <span className="text-sm font-bold text-slate-600 flex items-center gap-1">
                        {formatDuration(ticket.durationSeconds)}
                      </span>
                      {onUpdate && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setViewingTicket(ticket);
                            setEditMinutes(Math.floor(ticket.durationSeconds / 60).toString());
                            setEditSeconds((ticket.durationSeconds % 60).toString());
                            setIsEditingTime(true);
                          }}
                          className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-all"
                          title="Editar tempo"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  ) : (
                    <span className="text-sm font-bold text-slate-600 flex items-center gap-1">
                      {formatDuration(ticket.durationSeconds)}
                    </span>
                  )}
                </div>
                
                <h4 className="text-sm font-medium text-slate-900">
                  {ticket.networkLogin} <span className="text-slate-400 font-normal">· Ramal {ticket.extension}</span>
                </h4>
                
                <p className="text-sm text-slate-600 line-clamp-2">
                  <span className="font-medium text-slate-700">Problema:</span> {ticket.description}
                </p>
                
                <div className="text-xs text-slate-400 mt-1 flex flex-wrap gap-x-2 gap-y-1">
                  <span>ID: {ticket.id}</span>
                  {ticket.networkLogin && <span>• Login: {ticket.networkLogin}</span>}
                  {ticket.extension && <span>• Ramal: {ticket.extension}</span>}
                  {ticket.microLogicalAddress && <span>• Micro: {ticket.microLogicalAddress}</span>}
                  {ticket.printerLogicalAddress && <span>• Impressora: {ticket.printerLogicalAddress}</span>}
                  {ticket.monitorLogicalAddress && <span>• Monitor: {ticket.monitorLogicalAddress}</span>}
                  <span>• Finalizado: {ticket.finishedAt ? formatDateStr(ticket.finishedAt) : '-'}</span>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setViewingTicket(ticket)}
                  className="text-blue-600 text-xs font-bold hover:text-blue-800 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                >
                  VER
                </button>
                {onEdit && (
                  <button 
                    onClick={() => onEdit(ticket.id)}
                    className="text-slate-600 text-xs font-bold hover:text-slate-800 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    EDITAR
                  </button>
                )}
                {onDelete && (
                  <button onClick={() => onDelete(ticket.id)} className="text-red-600 text-xs font-bold hover:text-red-800 px-3 py-1.5 bg-red-50 hover:bg-red-100 rounded-lg transition-colors">
                    EXCLUIR
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}

        {filteredTickets.length === 0 && (
          <div className="text-center py-10 bg-white rounded-xl border border-slate-200 border-dashed">
            <p className="text-slate-500 text-sm font-medium">Nenhum chamado registrado ainda.</p>
          </div>
        )}
      </div>

      {viewingTicket && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h2 className="text-xl font-bold text-slate-800">Chamado {viewingTicket.id}</h2>
                  {viewingTicket.isEscalated && (
                    <span className="px-2.5 py-0.5 rounded-full bg-blue-100 border border-blue-200 text-blue-700 text-xs font-bold">
                      ESCALONADO
                    </span>
                  )}
                </div>
                <p className="text-sm text-slate-500">Finalizado em {viewingTicket.finishedAt ? formatDateStr(viewingTicket.finishedAt) : '-'}</p>
              </div>
              <button 
                onClick={() => setViewingTicket(null)}
                className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>
            
            <div className="p-6 space-y-8">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex flex-col justify-center">
                  <div className="flex items-center justify-between mb-1">
                    <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">Duração</span>
                    {onUpdate && !isEditingTime && (
                      <button 
                        onClick={() => {
                          setEditMinutes(Math.floor(viewingTicket.durationSeconds / 60).toString());
                          setEditSeconds((viewingTicket.durationSeconds % 60).toString());
                          setIsEditingTime(true);
                        }}
                        className="text-slate-400 hover:text-blue-600"
                        title="Editar duração"
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                  {isEditingTime ? (
                    <div className="flex items-center gap-1 mt-1">
                      <input 
                        type="number" 
                        value={editMinutes} 
                        onChange={e => setEditMinutes(e.target.value)} 
                        className="w-12 px-1 py-0.5 text-xs border border-slate-300 rounded focus:outline-none focus:border-blue-500" 
                        min="0"
                      />
                      <span className="text-xs text-slate-500 font-bold">m</span>
                      <input 
                        type="number" 
                        value={editSeconds} 
                        onChange={e => setEditSeconds(e.target.value)} 
                        className="w-12 px-1 py-0.5 text-xs border border-slate-300 rounded focus:outline-none focus:border-blue-500" 
                        min="0" max="59"
                      />
                      <span className="text-xs text-slate-500 font-bold">s</span>
                      <button 
                        onClick={() => {
                          const newSeconds = parseInt(editMinutes || '0', 10) * 60 + parseInt(editSeconds || '0', 10);
                          const updated = { ...viewingTicket, durationSeconds: newSeconds };
                          setViewingTicket(updated);
                          if (onUpdate) onUpdate(updated);
                          setIsEditingTime(false);
                        }}
                        className="ml-1 text-emerald-600 hover:text-emerald-700"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                      </button>
                      <button onClick={() => setIsEditingTime(false)} className="text-red-500 hover:text-red-600">
                         <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                      </button>
                    </div>
                  ) : (
                    <span className="text-sm font-bold text-slate-800">{formatDuration(viewingTicket.durationSeconds)}</span>
                  )}
                </div>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Categoria</span>
                  <span className="text-sm font-bold text-slate-800">{viewingTicket.category || '-'}</span>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Login/Ramal</span>
                  <span className="text-sm font-bold text-slate-800">{viewingTicket.networkLogin || '-'} / {viewingTicket.extension || '-'}</span>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Celular</span>
                  <span className="text-sm font-bold text-slate-800">{viewingTicket.mobile || '-'}</span>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-3">Endereços Lógicos</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <span className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Micro</span>
                    <span className="text-sm font-medium text-slate-700">{viewingTicket.microLogicalAddress || '-'}</span>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <span className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Impressora</span>
                    <span className="text-sm font-medium text-slate-700">{viewingTicket.printerLogicalAddress || '-'}</span>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <span className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Monitor</span>
                    <span className="text-sm font-medium text-slate-700">{viewingTicket.monitorLogicalAddress || '-'}</span>
                  </div>
                </div>
              </div>

              {viewingTicket.structuredResult && (
                <div>
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                    Texto Estruturado (IA)
                  </h3>
                  <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-5">
                    <pre className="whitespace-pre-wrap font-sans text-sm text-slate-700 leading-relaxed">
                      {viewingTicket.structuredResult}
                    </pre>
                  </div>
                </div>
              )}

              <div>
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-3">Descrição Original</h3>
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-5">
                  <pre className="whitespace-pre-wrap font-sans text-sm text-slate-700 leading-relaxed">
                    {viewingTicket.description || <span className="italic text-slate-400">Nenhuma descrição original registrada.</span>}
                  </pre>
                </div>
              </div>
              
              <div className="pt-6 flex justify-end">
                <button 
                  onClick={() => setViewingTicket(null)}
                  className="px-6 py-2.5 bg-slate-100 text-slate-700 rounded-lg text-sm font-bold hover:bg-slate-200 transition-colors"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
