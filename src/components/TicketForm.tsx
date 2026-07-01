import { Play, Pause, Copy, Trash2, Sparkles, Search, Save, Loader2, X, Edit3, Info, Plus } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { ActiveTicket, AppSettings, Ticket } from '@/types';
import { cn } from '@/lib/utils';
import { generateTicketStructure, searchSolutions } from '@/lib/gemini';

interface TicketFormProps {
  ticket: ActiveTicket;
  onUpdate: (ticket: ActiveTicket) => void;
  onFinish: (ticket: ActiveTicket) => void;
  onDuplicate: (ticket: ActiveTicket) => void;
  onUpdateSettings: (settings: AppSettings) => void;
  isActive: boolean;
  appSettings: AppSettings;
  onNavigate?: (route: string) => void;
  finishedTickets: Ticket[];
}

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export function TicketForm({ ticket, onUpdate, onFinish, onDuplicate, onUpdateSettings, isActive, appSettings, onNavigate, finishedTickets }: TicketFormProps) {
  const [isPaused, setIsPaused] = useState(ticket.isPaused || false);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<string | null>(ticket.structuredResult || null);
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [showPredefinedSolutions, setShowPredefinedSolutions] = useState(false);
  const [isSearchingSolution, setIsSearchingSolution] = useState(false);
  const [searchedSolution, setSearchedSolution] = useState<{
    faqs: any[];
    procedures: any[];
    tickets: Ticket[];
  } | null>(null);
  const [selectedSolutionItem, setSelectedSolutionItem] = useState<{ type: string; item: any } | null>(null);

  const ticketRef = useRef(ticket);
  const onUpdateRef = useRef(onUpdate);

  useEffect(() => {
    setIsPaused(ticket.isPaused || false);
    setAiResult(ticket.structuredResult || null);
    setIsAddingCategory(false);
    setNewCategory('');
  }, [ticket.id]);

  useEffect(() => {
    ticketRef.current = ticket;
  }, [ticket]);

  useEffect(() => {
    onUpdateRef.current = onUpdate;
  }, [onUpdate]);

  // Timer logic
  const lastTickRef = useRef(Date.now());

  useEffect(() => {
    if (!isActive || isPaused) {
      lastTickRef.current = Date.now();
      return;
    }

    lastTickRef.current = Date.now();
    const interval = setInterval(() => {
      const now = Date.now();
      const diff = Math.floor((now - lastTickRef.current) / 1000);
      if (diff > 0) {
        lastTickRef.current = now;
        onUpdateRef.current({ ...ticketRef.current, durationSeconds: ticketRef.current.durationSeconds + diff });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isActive, isPaused]);

  const handleChange = (field: keyof ActiveTicket, value: any) => {
    onUpdate({ ...ticket, [field]: value });
  };

  const handleFinalizeIA = async () => {
    if (!ticket.description.trim()) return;
    
    if (!appSettings.geminiApiKey) {
      alert("Por favor, configure sua chave da API Gemini nas Configurações primeiro.");
      return;
    }
    
    setIsAiLoading(true);
    try {
      const selectedProcs = appSettings.procedures?.filter(p => ticket.selectedProcedures?.includes(p.id)) || [];
      const selectedVerifs = appSettings.verifications?.filter(v => ticket.selectedVerifications?.includes(v.id)) || [];
      
      const resultText = await generateTicketStructure(appSettings.geminiApiKey, { 
        description: ticket.description,
        procedures: selectedProcs.map(p => ({ name: p.name, description: p.description })),
        verifications: selectedVerifs.map(v => ({ name: v.name, description: v.description })),
        problemSolved: ticket.problemSolved,
        clientValidated: ticket.clientValidated,
        isEscalated: ticket.isEscalated,
        aiGuidelines: appSettings.aiGuidelines,
        aiPromptStandard: appSettings.aiPromptStandard,
        aiPromptEscalated: appSettings.aiPromptEscalated
      });
      
      if (resultText) {
        let finalResult = resultText;
        
        if (ticket.isEscalated && ticket.escalationContent) {
          finalResult = ticket.escalationContent + '\n\n' + finalResult;
        }

        if (!ticket.isEscalated && appSettings.closingTextEnabled && appSettings.closingText.trim()) {
          finalResult += '\n\n' + appSettings.closingText.trim();
        }
        setAiResult(finalResult);
        setIsPaused(true); // Pause timer while reviewing
      }
    } catch (error) {
      console.error('Failed to structure ticket:', error);
      alert("Erro ao estruturar chamado: " + (error as Error).message);
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleSearchSolution = async () => {
    if (!ticket.description.trim()) return;

    if (!appSettings.geminiApiKey) {
      alert("Por favor, configure sua chave da API Gemini nas Configurações primeiro.");
      return;
    }
    
    setIsSearchingSolution(true);
    setSearchedSolution(null);
    setSelectedSolutionItem(null);
    try {
      const ticketsToSearch = finishedTickets.slice(0, 50);
      const resultJson = await searchSolutions(appSettings.geminiApiKey, {
        description: ticket.description,
        faqs: appSettings.faqs || [],
        procedures: appSettings.procedures || [],
        tickets: ticketsToSearch.map(t => ({
          id: t.id,
          description: t.description,
          structuredResult: t.structuredResult,
          category: t.category,
          status: t.status
        }))
      });
      
      if (resultJson) {
        const faqsMatched = (appSettings.faqs || []).filter(f => (resultJson.faqs || []).includes(f.id));
        const proceduresMatched = (appSettings.procedures || []).filter(p => (resultJson.procedures || []).includes(p.id));
        const ticketsMatched = ticketsToSearch.filter(t => (resultJson.tickets || []).includes(t.id));
        
        setSearchedSolution({
          faqs: faqsMatched,
          procedures: proceduresMatched,
          tickets: ticketsMatched
        });
        setIsPaused(true); // Pause timer while reviewing
      }
    } catch (error) {
      console.error('Failed to search solutions:', error);
      alert("Erro ao buscar soluções: " + (error as Error).message);
    } finally {
      setIsSearchingSolution(false);
    }
  };

  const handleEditResult = () => {
    if (aiResult) {
      onUpdate({ ...ticket, description: aiResult });
      setAiResult(null);
      setIsPaused(false); // Resume timer
    }
  };

  const handleSaveResult = () => {
    if (aiResult) {
      onFinish({ ...ticket, description: ticket.description, structuredResult: aiResult });
      setAiResult(null);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm relative">
      {/* AI Result Modal Overlay */}
      {aiResult && (
        <div className="absolute inset-0 bg-white/95 backdrop-blur-sm z-20 rounded-xl border border-slate-200 flex flex-col p-6 animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-blue-600" />
              Revisão da IA
            </h3>
            <button 
              onClick={() => { setAiResult(null); setIsPaused(false); }}
              className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          
          <div className="flex-1 flex flex-col md:flex-row gap-4 mb-6 min-h-0">
            <div className="flex-1 overflow-y-auto bg-slate-50 border border-slate-200 rounded-lg p-4">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Texto Estruturado</h4>
              <pre className="whitespace-pre-wrap font-sans text-sm text-slate-700 leading-relaxed">
                {aiResult}
              </pre>
            </div>
            
            <div className="w-full md:w-80 overflow-y-auto bg-slate-50 border border-slate-200 rounded-lg p-4 shrink-0">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Dados do Chamado</h4>
              <div className="space-y-4">
                <div>
                  <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Login de Rede</span>
                  <span className="text-sm font-medium text-slate-800">{ticket.networkLogin || <span className="text-slate-400 italic">Não informado</span>}</span>
                </div>
                <div>
                  <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Ramal</span>
                  <span className="text-sm font-medium text-slate-800">{ticket.extension || <span className="text-slate-400 italic">Não informado</span>}</span>
                </div>
                <div>
                  <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Celular</span>
                  <span className="text-sm font-medium text-slate-800">{ticket.mobile || <span className="text-slate-400 italic">Não informado</span>}</span>
                </div>
                <div className="pt-2 border-t border-slate-200">
                  <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Endereço Lógico (Micro / Impressora / Monitor)</span>
                  <div className="text-sm font-medium text-slate-800 flex flex-col gap-1 mt-1">
                    <span>Micro: {ticket.microLogicalAddress || '-'}</span>
                    <span>Imp: {ticket.printerLogicalAddress || '-'}</span>
                    <span>Mon: {ticket.monitorLogicalAddress || '-'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button 
              onClick={handleEditResult}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 transition-colors"
            >
              <Edit3 className="h-4 w-4" />
              Adicionar/editar informações
            </button>
            <button 
              onClick={handleSaveResult}
              className="flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-sm"
            >
              <Save className="h-4 w-4" />
              Gravar chamado
            </button>
          </div>
        </div>
      )}

      {/* Searched Solution Modal Overlay */}
      {searchedSolution && (
        <div className="absolute inset-0 bg-white/95 backdrop-blur-sm z-20 rounded-xl border border-slate-200 flex flex-col p-6 animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Search className="h-5 w-5 text-blue-600" />
              {selectedSolutionItem ? 'Detalhes da Solução' : 'Soluções Encontradas'}
            </h3>
            <button 
              onClick={() => { setSearchedSolution(null); setSelectedSolutionItem(null); setIsPaused(false); }}
              className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto bg-slate-50 border border-slate-200 rounded-lg p-6 mb-6 min-h-0">
            {selectedSolutionItem ? (
              <div className="space-y-4">
                {selectedSolutionItem.type === 'faq' && (
                  <>
                    <h4 className="font-bold text-slate-800 mb-2">{selectedSolutionItem.item.name}</h4>
                    <div className="bg-white p-4 rounded-lg border border-slate-200 text-sm">
                      <strong className="block text-slate-600 mb-1">Informação Técnica:</strong>
                      <p className="whitespace-pre-wrap font-mono text-slate-700">{selectedSolutionItem.item.technicalInfo}</p>
                    </div>
                    {selectedSolutionItem.item.procedure && (
                      <div className="bg-white p-4 rounded-lg border border-slate-200 text-sm mt-4">
                        <strong className="block text-slate-600 mb-1">Procedimento:</strong>
                        <p className="whitespace-pre-wrap font-mono text-slate-700">{selectedSolutionItem.item.procedure}</p>
                      </div>
                    )}
                  </>
                )}
                {selectedSolutionItem.type === 'procedure' && (
                  <>
                    <h4 className="font-bold text-slate-800 mb-2">{selectedSolutionItem.item.name}</h4>
                    <div className="bg-white p-4 rounded-lg border border-slate-200 text-sm">
                      <strong className="block text-slate-600 mb-1">Descrição do Procedimento:</strong>
                      <p className="whitespace-pre-wrap font-mono text-slate-700">{selectedSolutionItem.item.description}</p>
                    </div>
                  </>
                )}
                {selectedSolutionItem.type === 'ticket' && (
                  <>
                    <h4 className="font-bold text-slate-800 mb-2">Chamado {selectedSolutionItem.item.id}</h4>
                    <div className="bg-white p-4 rounded-lg border border-slate-200 text-sm">
                      <strong className="block text-slate-600 mb-1">Relato Inicial:</strong>
                      <p className="whitespace-pre-wrap text-slate-700 mb-4">{selectedSolutionItem.item.description}</p>
                      <strong className="block text-slate-600 mb-1">Estruturação (Solução):</strong>
                      <p className="whitespace-pre-wrap font-mono text-slate-700">{selectedSolutionItem.item.structuredResult}</p>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {(searchedSolution.faqs.length === 0 && searchedSolution.procedures.length === 0 && searchedSolution.tickets.length === 0) ? (
                  <p className="text-slate-500 text-center py-8">Nenhuma solução encontrada na base de conhecimento.</p>
                ) : (
                  <>
                    {searchedSolution.faqs.length > 0 && (
                      <div>
                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">FAQs Relacionadas</h4>
                        <div className="space-y-2">
                          {searchedSolution.faqs.map(faq => (
                            <button
                              key={faq.id}
                              onClick={() => setSelectedSolutionItem({ type: 'faq', item: faq })}
                              className="w-full text-left p-3 bg-white border border-slate-200 rounded-lg hover:border-blue-400 hover:shadow-sm transition-all"
                            >
                              <span className="font-bold text-slate-800 block">{faq.name}</span>
                              <span className="text-sm text-slate-500 truncate block">{faq.subject} - {faq.service}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {searchedSolution.procedures.length > 0 && (
                      <div className="mt-4">
                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Procedimentos</h4>
                        <div className="space-y-2">
                          {searchedSolution.procedures.map(proc => (
                            <button
                              key={proc.id}
                              onClick={() => setSelectedSolutionItem({ type: 'procedure', item: proc })}
                              className="w-full text-left p-3 bg-white border border-slate-200 rounded-lg hover:border-blue-400 hover:shadow-sm transition-all"
                            >
                              <span className="font-bold text-slate-800 block">{proc.name}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {searchedSolution.tickets.length > 0 && (
                      <div className="mt-4">
                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Chamados Anteriores</h4>
                        <div className="space-y-2">
                          {searchedSolution.tickets.map(t => (
                            <button
                              key={t.id}
                              onClick={() => setSelectedSolutionItem({ type: 'ticket', item: t })}
                              className="w-full text-left p-3 bg-white border border-slate-200 rounded-lg hover:border-blue-400 hover:shadow-sm transition-all"
                            >
                              <span className="font-bold text-slate-800 block">Chamado #{t.id}</span>
                              <span className="text-sm text-slate-500 truncate block">{t.description}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
          
          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            {selectedSolutionItem ? (
              <button 
                onClick={() => setSelectedSolutionItem(null)}
                className="flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 transition-colors"
              >
                Voltar para resultados
              </button>
            ) : <div />}
            <button 
              onClick={() => { setSearchedSolution(null); setSelectedSolutionItem(null); setIsPaused(false); }}
              className="flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-sm ml-auto"
            >
              Voltar ao chamado
            </button>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold text-slate-800">Chamado {ticket.id}</h2>
        <div className="flex items-center gap-4 text-sm text-slate-600">
          <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-md font-bold text-slate-700">
            {formatTime(ticket.durationSeconds)}
          </div>
          <button 
            onClick={() => {
              setIsPaused(!isPaused);
              onUpdate({ ...ticket, isPaused: !isPaused });
            }}
            className="flex items-center gap-1.5 hover:text-blue-600 transition-colors font-medium"
          >
            {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
            {isPaused ? 'Retomar' : 'Pausar'}
          </button>
          <button 
            onClick={() => onDuplicate(ticket)}
            className="flex items-center gap-1.5 hover:text-blue-600 transition-colors font-medium">
            <Copy className="h-4 w-4" />
            Duplicar
          </button>
          <span className="text-slate-400">Rascunho salvo no navegador</span>
        </div>
      </div>

      <div className="space-y-6">
        <div className="grid grid-cols-4 gap-4">
          <div>
            <label className="block text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">Login de rede</label>
            <input 
              type="text" 
              value={ticket.networkLogin}
              onChange={(e) => handleChange('networkLogin', e.target.value)}
              className="w-full p-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" 
            />
          </div>
          <div>
            <label className="block text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">Ramal</label>
            <input 
              type="text" 
              value={ticket.extension}
              onChange={(e) => handleChange('extension', e.target.value)}
              className="w-full p-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" 
            />
          </div>
          <div>
            <label className="block text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">Celular</label>
            <input 
              type="text" 
              value={ticket.mobile}
              onChange={(e) => handleChange('mobile', e.target.value)}
              className="w-full p-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" 
            />
          </div>
          <div>
            <label className="block text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">End. lógico micro</label>
            <input 
              type="text" 
              value={ticket.microLogicalAddress}
              onChange={(e) => handleChange('microLogicalAddress', e.target.value)}
              className="w-full p-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" 
            />
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4">
          <div>
            <label className="block text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">End. lógico impressora</label>
            <input 
              type="text" 
              value={ticket.printerLogicalAddress}
              onChange={(e) => handleChange('printerLogicalAddress', e.target.value)}
              className="w-full p-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" 
            />
          </div>
          <div>
            <label className="block text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">End. lógico monitor</label>
            <input 
              type="text" 
              value={ticket.monitorLogicalAddress}
              onChange={(e) => handleChange('monitorLogicalAddress', e.target.value)}
              className="w-full p-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" 
            />
          </div>
          <div className="col-span-2">
            <label className="block text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">Categoria</label>
            {isAddingCategory ? (
              <div className="flex gap-2">
                <input
                  type="text"
                  autoFocus
                  value={newCategory}
                  onChange={e => setNewCategory(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  placeholder="Nova categoria..."
                />
                <button 
                  onClick={() => {
                    if (newCategory.trim() && !appSettings.categories.includes(newCategory.trim())) {
                      onUpdateSettings({ ...appSettings, categories: [...appSettings.categories, newCategory.trim()] });
                      handleChange('category', newCategory.trim());
                    } else if (appSettings.categories.includes(newCategory.trim())) {
                      handleChange('category', newCategory.trim());
                    }
                    setIsAddingCategory(false);
                    setNewCategory('');
                  }} 
                  className="px-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Confirmar
                </button>
                <button 
                  onClick={() => setIsAddingCategory(false)} 
                  className="px-3 bg-slate-200 text-slate-600 rounded-lg hover:bg-slate-300 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <select
                  value={ticket.category || ''}
                  onChange={(e) => handleChange('category', e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
                >
                  <option value="">Selecione uma categoria...</option>
                  {appSettings.categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
                <button 
                  onClick={() => setIsAddingCategory(true)} 
                  className="px-4 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors flex items-center justify-center font-bold text-sm"
                >
                  + Adicionar
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="col-span-4">
            <label className="block text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">Associar FAQ (Opcional)</label>
            <select
              value={ticket.associatedFaqId || ''}
              onChange={(e) => handleChange('associatedFaqId', e.target.value)}
              className="w-full p-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
            >
              <option value="">Nenhuma FAQ associada</option>
              {(appSettings.faqs || []).map(faq => (
                <option key={faq.id} value={faq.id}>{faq.faqNumber || faq.id} - {faq.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="mb-6 bg-slate-50 border border-slate-100 rounded-lg p-4">
          <label className="flex items-center cursor-pointer relative mb-2">
            <input 
              type="checkbox" 
              className="sr-only" 
              checked={ticket.isEscalated || false} 
              onChange={(e) => {
                const checked = e.target.checked;
                handleChange('isEscalated', checked);
                if (checked && !ticket.escalationContent) {
                  handleChange('escalationContent', appSettings.escalationTemplate || '');
                }
              }} 
            />
            <div className={`relative w-11 h-6 rounded-full transition-colors ${ticket.isEscalated ? 'bg-indigo-600' : 'bg-slate-300'}`}>
              <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${ticket.isEscalated ? 'translate-x-5' : ''}`}></div>
            </div>
            <span className="ml-3 text-sm font-bold text-slate-700">Escalonamento</span>
          </label>
          
          {ticket.isEscalated && (
            <div className="mt-4">
              <label className="block text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">
                Dados do Escalonamento
              </label>
              <textarea 
                value={ticket.escalationContent || ''}
                onChange={(e) => handleChange('escalationContent', e.target.value)}
                placeholder="Preencha os dados de escalonamento..."
                className="w-full min-h-[140px] p-3 rounded-lg border border-indigo-200 bg-indigo-50/40 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-y text-sm font-mono transition-colors"
              />
            </div>
          )}
        </div>

        <div>
          <label className="block text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">
            Descrição livre
          </label>
          <textarea 
            value={ticket.description}
            onChange={(e) => handleChange('description', e.target.value)}
            placeholder="Descreva a demanda, a solicitação e a tratativa/solução..."
            className="w-full min-h-[120px] p-3 rounded-lg border border-amber-200 bg-amber-50/40 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 resize-y text-sm transition-colors"
          />
          <div className="flex justify-end mt-2 mb-6 gap-2">
            <div className="relative">
              <button 
                onClick={() => setShowPredefinedSolutions(!showPredefinedSolutions)}
                className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 text-sm font-medium text-slate-600 rounded-lg hover:bg-slate-50 hover:text-blue-600 transition-colors"
              >
                <Sparkles className="h-3.5 w-3.5" />
                Soluções Padrão
              </button>
              
              {showPredefinedSolutions && (
                <div className="absolute right-0 top-full mt-1 w-72 bg-white border border-slate-200 rounded-lg shadow-xl z-50 py-1 max-h-64 overflow-y-auto">
                  {(appSettings.predefinedSolutions || []).map((sol) => (
                    <button
                      key={sol.id}
                      onClick={() => {
                        setAiResult(sol.content);
                        setShowPredefinedSolutions(false);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 font-medium truncate"
                    >
                      {sol.title}
                    </button>
                  ))}
                  {(appSettings.predefinedSolutions || []).length === 0 && (
                    <div className="px-4 py-3 text-sm text-slate-500 italic text-center">Nenhuma solução padrão cadastrada</div>
                  )}
                  <div className="border-t border-slate-100 mt-1"></div>
                  <button
                    onClick={() => {
                      setShowPredefinedSolutions(false);
                      if (onNavigate) onNavigate('Configurações');
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-blue-600 hover:bg-slate-50 font-medium flex items-center gap-1.5"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Cadastrar Solução
                  </button>
                </div>
              )}
            </div>
            <button 
              onClick={handleSearchSolution}
              disabled={isSearchingSolution || !ticket.description.trim()}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 text-sm font-medium text-slate-600 rounded-lg hover:bg-slate-50 hover:text-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSearchingSolution ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Search className="h-3.5 w-3.5" />}
              Buscar solução
            </button>
          </div>

          {appSettings.procedures && appSettings.procedures.length > 0 && (
            <div className="mb-4 p-4 bg-slate-50 border border-slate-100 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <label className="block text-slate-500 text-xs font-bold uppercase tracking-wider">Procedimentos Executados</label>
                <button
                  onClick={() => onNavigate && onNavigate('Configurações')}
                  className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-800 transition-colors"
                  title="Cadastrar outro procedimento em Configurações"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Cadastrar procedimento
                </button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {appSettings.procedures.map(proc => {
                  const isChecked = ticket.selectedProcedures?.includes(proc.id) || false;
                  return (
                    <div key={proc.id} className="flex items-center gap-2">
                      <input 
                        type="checkbox" 
                        id={`proc-${proc.id}`}
                        checked={isChecked}
                        onChange={(e) => {
                          const current = ticket.selectedProcedures || [];
                          const updated = e.target.checked 
                            ? [...current, proc.id]
                            : current.filter(id => id !== proc.id);
                          handleChange('selectedProcedures', updated);
                        }}
                        className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                      />
                      <label htmlFor={`proc-${proc.id}`} className="text-sm text-slate-700 font-medium cursor-pointer flex-1">
                        {proc.name}
                      </label>
                      <div className="group relative">
                        <Info className="h-3.5 w-3.5 text-slate-400 cursor-help" />
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-slate-800 text-white text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                          {proc.description}
                          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-slate-800"></div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {appSettings.verifications && appSettings.verifications.length > 0 && (
            <div className="mb-6 p-4 bg-slate-50 border border-slate-100 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-slate-800">Verificações</h3>
                <button
                  onClick={() => onNavigate && onNavigate('Configurações')}
                  className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-800 transition-colors"
                  title="Cadastrar outra verificação em Configurações"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Cadastrar verificação
                </button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {appSettings.verifications.map(verif => {
                  const isChecked = ticket.selectedVerifications?.includes(verif.id) || false;
                  return (
                    <div key={verif.id} className="flex items-center gap-2">
                      <input 
                        type="checkbox" 
                        id={`verif-${verif.id}`}
                        checked={isChecked}
                        onChange={(e) => {
                          const current = ticket.selectedVerifications || [];
                          const updated = e.target.checked 
                            ? [...current, verif.id]
                            : current.filter(id => id !== verif.id);
                          handleChange('selectedVerifications', updated);
                        }}
                        className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                      />
                      <label htmlFor={`verif-${verif.id}`} className="text-sm text-slate-700 font-medium cursor-pointer flex-1">
                        {verif.name}
                      </label>
                      <div className="group relative">
                        <Info className="h-3.5 w-3.5 text-slate-400 cursor-help" />
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-slate-800 text-white text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                          {verif.description}
                          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-slate-800"></div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {!ticket.isEscalated && (
            <div className="mb-6 p-4 bg-slate-50 border border-slate-100 rounded-lg flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  id="problemSolved"
                  checked={ticket.problemSolved || false}
                  onChange={(e) => handleChange('problemSolved', e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
                />
                <label htmlFor="problemSolved" className="text-sm text-slate-700 font-medium cursor-pointer">
                  Após os procedimentos, o problema foi solucionado?
                </label>
              </div>
              <div className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  id="clientValidated"
                  checked={ticket.clientValidated || false}
                  onChange={(e) => handleChange('clientValidated', e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
                />
                <label htmlFor="clientValidated" className="text-sm text-slate-700 font-medium cursor-pointer">
                  Cliente validou o chamado?
                </label>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between pt-6 mt-6 border-t border-slate-100">
          <button 
            onClick={handleFinalizeIA}
            disabled={!ticket.description.trim() || isAiLoading}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold transition-colors shadow-sm",
              ticket.description.trim() && !isAiLoading
                ? "bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100" 
                : "text-slate-400 border border-slate-200 bg-slate-50 cursor-not-allowed"
            )}
          >
            {isAiLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            {isAiLoading ? 'Processando...' : 'Finalizar (IA)'}
          </button>
          
          <button 
            onClick={() => onFinish(ticket)}
            className="flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-sm"
          >
            <Save className="h-4 w-4" />
            Gravar e finalizar
          </button>
        </div>
      </div>
    </div>
  );
}
