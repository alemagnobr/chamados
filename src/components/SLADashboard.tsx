import React, { useState, useMemo } from 'react';
import { Ticket, AppSettings } from '@/types';
import { isToday, isThisWeek, isThisMonth, format, parseISO } from 'date-fns';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';
import { cn } from '@/lib/utils';
import { Filter, Calendar, Info } from 'lucide-react';

interface SLADashboardProps {
  tickets: Ticket[];
  appSettings: AppSettings;
}

type TimeFilter = 'all' | 'today' | 'week' | 'month';

export function SLADashboard({ tickets, appSettings }: SLADashboardProps) {
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('month');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const finishedTickets = useMemo(() => {
    return tickets.filter(t => t.status === 'FINALIZADO' && !t.deleted);
  }, [tickets]);

  const filteredTickets = useMemo(() => {
    return finishedTickets.filter(t => {
      const dateStr = t.finishedAt || t.createdAt;
      const date = new Date(dateStr);
      if (timeFilter === 'today' && !isToday(date)) return false;
      if (timeFilter === 'week' && !isThisWeek(date)) return false;
      if (timeFilter === 'month' && !isThisMonth(date)) return false;
      
      if (selectedCategory !== 'all' && t.category !== selectedCategory) return false;

      return true;
    });
  }, [finishedTickets, timeFilter, selectedCategory]);

  const totalFiltered = filteredTickets.length;
  const avgSlaSeconds = totalFiltered > 0 
    ? filteredTickets.reduce((acc, t) => acc + t.durationSeconds, 0) / totalFiltered 
    : 0;

  const formatDuration = (secs: number) => {
    if (secs === 0 || isNaN(secs)) return '00:00';
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = Math.floor(secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const getSlaColor = (avgMinutes: number) => {
    if (avgMinutes <= appSettings.sla.otima) return 'text-emerald-600';
    if (avgMinutes <= appSettings.sla.boa) return 'text-blue-600';
    if (avgMinutes <= appSettings.sla.atencao) return 'text-amber-500';
    if (avgMinutes <= appSettings.sla.ruim) return 'text-orange-500';
    return 'text-red-600';
  };

  const categoryData = useMemo(() => {
    const data: Record<string, { count: number, totalSeconds: number }> = {};
    
    // Calculate for selected time filter, ignoring category filter
    const baseTickets = finishedTickets.filter(t => {
      const dateStr = t.finishedAt || t.createdAt;
      const date = new Date(dateStr);
      if (timeFilter === 'today' && !isToday(date)) return false;
      if (timeFilter === 'week' && !isThisWeek(date)) return false;
      if (timeFilter === 'month' && !isThisMonth(date)) return false;
      return true;
    });

    baseTickets.forEach(t => {
      const cat = t.category || 'Sem categoria';
      if (!data[cat]) data[cat] = { count: 0, totalSeconds: 0 };
      data[cat].count++;
      data[cat].totalSeconds += t.durationSeconds;
    });

    return Object.keys(data).map(cat => ({
      name: cat,
      count: data[cat].count,
      avgMinutes: (data[cat].totalSeconds / data[cat].count) / 60,
    })).sort((a, b) => b.count - a.count);
  }, [finishedTickets, timeFilter]);


  const timelineData = useMemo(() => {
    const data: Record<string, { count: number, totalSeconds: number }> = {};
    
    filteredTickets.forEach(t => {
      const dateStr = t.finishedAt || t.createdAt;
      const dateKey = format(parseISO(dateStr), 'dd/MM');
      if (!data[dateKey]) data[dateKey] = { count: 0, totalSeconds: 0 };
      data[dateKey].count++;
      data[dateKey].totalSeconds += t.durationSeconds;
    });

    return Object.keys(data).map(date => ({
      date,
      count: data[date].count,
      avgMinutes: Math.round(((data[date].totalSeconds / data[date].count) / 60) * 10) / 10,
    })).sort((a, b) => {
       const [d1, m1] = a.date.split('/');
       const [d2, m2] = b.date.split('/');
       if (m1 !== m2) return Number(m1) - Number(m2);
       return Number(d1) - Number(d2);
    });
  }, [filteredTickets]);

  const recommendation = useMemo(() => {
    if (totalFiltered === 0) return null;
    
    const otima = appSettings.sla.otima * 60;
    const boa = appSettings.sla.boa * 60;
    const atencao = appSettings.sla.atencao * 60;
    const ruim = appSettings.sla.ruim * 60;

    let targetSlaSecs = otima;
    let targetName = 'Ótima';
    let targetMin = appSettings.sla.otima;

    if (avgSlaSeconds <= otima) {
      return {
        type: 'success',
        message: 'Excelente! A média geral de tempo para este filtro está na categoria Ótima. Continue assim!'
      };
    } else if (avgSlaSeconds <= boa) {
      targetSlaSecs = otima;
      targetName = 'Ótima';
      targetMin = appSettings.sla.otima;
    } else if (avgSlaSeconds <= atencao) {
      targetSlaSecs = boa;
      targetName = 'Boa';
      targetMin = appSettings.sla.boa;
    } else if (avgSlaSeconds <= ruim) {
      targetSlaSecs = atencao;
      targetName = 'Atenção';
      targetMin = appSettings.sla.atencao;
    } else {
      targetSlaSecs = ruim;
      targetName = 'Ruim';
      targetMin = appSettings.sla.ruim;
    }

    const totalCurrentSecs = avgSlaSeconds * totalFiltered;
    const nextTicketsCount = 10;
    const allowedTotalSecs = targetSlaSecs * (totalFiltered + nextTicketsCount);
    const requiredSecsForNext = allowedTotalSecs - totalCurrentSecs;
    const maxAvgSecsForNext = requiredSecsForNext / nextTicketsCount;

    if (maxAvgSecsForNext <= 0) {
      return {
        type: 'impossible',
        message: `Para voltar ao nível ${targetName}, foque em reduzir o tempo gradativamente nos próximos chamados.`
      };
    } else {
      const maxMins = Math.floor(maxAvgSecsForNext / 60);
      const maxSecs = Math.floor(maxAvgSecsForNext % 60);
      return {
        type: 'warning',
        message: `Para alcançar a média ${targetName} (${targetMin} min), os próximos ${nextTicketsCount} chamados devem ter média máx de ${maxMins}m ${maxSecs}s.`
      };
    }
  }, [avgSlaSeconds, totalFiltered, appSettings.sla]);


  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Top Filters */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2 mr-4">
          <Filter className="h-4 w-4 text-slate-400" />
          <span className="text-sm font-bold text-slate-700">Filtros:</span>
        </div>
        
        <div className="flex bg-slate-100 p-1 rounded-lg">
          <button 
            onClick={() => setTimeFilter('today')} 
            className={cn("px-4 py-1.5 text-xs font-bold rounded-md transition-colors", timeFilter === 'today' ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700")}
          >
            Hoje
          </button>
          <button 
            onClick={() => setTimeFilter('week')} 
            className={cn("px-4 py-1.5 text-xs font-bold rounded-md transition-colors", timeFilter === 'week' ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700")}
          >
            Nesta Semana
          </button>
          <button 
            onClick={() => setTimeFilter('month')} 
            className={cn("px-4 py-1.5 text-xs font-bold rounded-md transition-colors", timeFilter === 'month' ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700")}
          >
            Neste Mês
          </button>
          <button 
            onClick={() => setTimeFilter('all')} 
            className={cn("px-4 py-1.5 text-xs font-bold rounded-md transition-colors", timeFilter === 'all' ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700")}
          >
            Todo período
          </button>
        </div>

        <div className="h-6 w-px bg-slate-200"></div>

        <select 
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block px-3 py-2 outline-none font-medium"
        >
          <option value="all">Todas Categorias</option>
          {appSettings.categories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
          <option value="">Sem categoria</option>
        </select>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">Chamados Finalizados</p>
            <h3 className="text-3xl font-black text-slate-800">{totalFiltered}</h3>
          </div>
          <div className="h-12 w-12 bg-blue-50 rounded-full flex items-center justify-center">
            <span className="text-xl font-black text-blue-600">#</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">Tempo Médio Geral (SLA)</p>
            <h3 className={cn("text-3xl font-black", getSlaColor(avgSlaSeconds / 60))}>{formatDuration(avgSlaSeconds)}</h3>
          </div>
          <div className="h-12 w-12 bg-slate-50 rounded-full flex items-center justify-center">
            <Calendar className="h-6 w-6 text-slate-400" />
          </div>
        </div>
      </div>

      {/* Recommendation Card */}
      {recommendation && recommendation.type !== 'success' && (
        <div className={cn(
          "p-5 rounded-xl border flex items-start gap-4 shadow-sm",
          recommendation.type === 'warning' ? "bg-amber-50 border-amber-200 text-amber-900" : "bg-red-50 border-red-200 text-red-900"
        )}>
           <Info className={cn("h-6 w-6 shrink-0 mt-0.5", recommendation.type === 'warning' ? "text-amber-500" : "text-red-500")} />
           <div>
             <h4 className="font-bold text-base mb-1">Dica de Rota para SLA Ótimo</h4>
             <p className="text-sm font-medium opacity-90 leading-relaxed">{recommendation.message}</p>
           </div>
        </div>
      )}
      
      {recommendation && recommendation.type === 'success' && (
        <div className="p-5 rounded-xl border flex items-start gap-4 shadow-sm bg-emerald-50 border-emerald-200 text-emerald-900">
           <Info className="h-6 w-6 shrink-0 mt-0.5 text-emerald-500" />
           <div>
             <h4 className="font-bold text-base mb-1">SLA no Alvo</h4>
             <p className="text-sm font-medium opacity-90 leading-relaxed">{recommendation.message}</p>
           </div>
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 gap-6">
        {/* Category Breakdown (Bar Chart) */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col h-[500px]">
          <h3 className="font-bold text-slate-800 mb-6">SLA por Categoria (Médias em Minutos)</h3>
          {categoryData.length > 0 ? (
            <div className="flex-1 w-full min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryData} margin={{ top: 10, right: 30, left: -20, bottom: 120 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} dy={10} interval={0} angle={-45} textAnchor="end" />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                  <Tooltip 
                    cursor={{ fill: '#f1f5f9' }}
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    formatter={(value: number) => [`${value.toFixed(1)} min`, 'Tempo Médio']}
                  />
                  <Bar dataKey="avgMinutes" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={60} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-slate-400 font-medium">Sem dados para exibir.</p>
            </div>
          )}
        </div>

        {/* Timeline (Line Chart) */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col h-[500px]">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-slate-800">Evolução do SLA no Tempo (Minutos)</h3>
            {selectedCategory !== 'all' && (
              <span className="px-3 py-1 bg-blue-50 text-blue-600 text-xs font-bold rounded-full border border-blue-100">
                {selectedCategory}
              </span>
            )}
          </div>
          
          {timelineData.length > 0 ? (
            <div className="flex-1 w-full min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={timelineData} margin={{ top: 10, right: 30, left: -20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    formatter={(value: number, name: string) => [
                      name === 'avgMinutes' ? `${value.toFixed(1)} min` : value, 
                      name === 'avgMinutes' ? 'Tempo Médio' : 'Qtd Chamados'
                    ]}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                  <Line type="monotone" dataKey="avgMinutes" name="Média (Min)" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-slate-400 font-medium">Sem dados no período/categoria selecionados.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
