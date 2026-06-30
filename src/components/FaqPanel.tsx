import { useState } from 'react';
import { Plus, Trash2, Edit2, Copy, ChevronDown, ChevronRight, X } from 'lucide-react';
import { AppSettings, FAQ, Ticket } from '@/types';

interface FaqPanelProps {
  appSettings: AppSettings;
  onUpdateSettings: (settings: AppSettings) => void;
  tickets?: Ticket[];
}

export function FaqPanel({ appSettings, onUpdateSettings, tickets = [] }: FaqPanelProps) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<Omit<FAQ, 'id'>>({
    faqNumber: '',
    category: '',
    name: '',
    technicalInfo: '',
    type: '',
    service: '',
    subject: '',
    system: '',
    associatedProcedureId: '',
    procedure: '',
    originalLink: ''
  });

  const [expandedFaqs, setExpandedFaqs] = useState<Record<string, { techInfo: boolean; procedure: boolean; tickets: boolean }>>({});

  const handleOpenForm = (faq?: FAQ) => {
    if (faq) {
      setEditingId(faq.id);
      setFormData({
        faqNumber: faq.faqNumber || '',
        category: faq.category || '',
        name: faq.name,
        technicalInfo: faq.technicalInfo,
        type: faq.type,
        service: faq.service,
        subject: faq.subject,
        system: faq.system,
        associatedProcedureId: faq.associatedProcedureId,
        procedure: faq.procedure,
        originalLink: faq.originalLink || '',
      });
    } else {
      setEditingId(null);
      setFormData({
        faqNumber: '',
        category: '',
        name: '',
        technicalInfo: '',
        type: '',
        service: '',
        subject: '',
        system: '',
        associatedProcedureId: '',
        procedure: '',
        originalLink: '',
      });
    }
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingId(null);
  };

  const handleSave = () => {
    if (!formData.name) return;

    let newFaqs = appSettings.faqs || [];
    if (editingId) {
      newFaqs = newFaqs.map(f => f.id === editingId ? { ...formData, id: editingId } : f);
    } else {
      const newFaq: FAQ = { ...formData, id: Date.now().toString() };
      newFaqs = [...newFaqs, newFaq];
    }
    
    onUpdateSettings({ ...appSettings, faqs: newFaqs });
    handleCloseForm();
  };

  const handleDelete = (id: string) => {
    const newFaqs = (appSettings.faqs || []).filter(f => f.id !== id);
    onUpdateSettings({ ...appSettings, faqs: newFaqs });
  };

  const toggleExpand = (id: string, section: 'techInfo' | 'procedure' | 'tickets') => {
    setExpandedFaqs(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        [section]: !prev[id]?.[section]
      }
    }));
  };

  const faqs = appSettings.faqs || [];
  const procedures = appSettings.procedures || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-800">FAQs Cadastradas</h2>
        <button 
          onClick={() => handleOpenForm()}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Nova FAQ
        </button>
      </div>

      <div className="space-y-4">
        {faqs.length === 0 ? (
          <div className="p-8 border-2 border-dashed border-slate-200 rounded-xl text-center">
            <p className="text-slate-500 font-medium">Nenhuma FAQ cadastrada.</p>
          </div>
        ) : (
          faqs.map((faq, index) => (
            <div key={faq.id} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className="px-2 py-1 bg-slate-100 text-slate-600 text-xs font-bold rounded">#{index + 1}</span>
                  <Copy className="h-4 w-4 text-slate-400 cursor-pointer hover:text-slate-600" />
                  <h3 className="font-bold text-slate-800 flex-1">FAQ#: {faq.faqNumber || faq.id} — {faq.name}</h3>
                </div>
                <div className="flex items-center gap-2">
                  {faq.originalLink && (
                    <a href={faq.originalLink} target="_blank" rel="noopener noreferrer" className="px-3 py-1 bg-slate-100 text-slate-600 hover:text-blue-600 hover:bg-blue-50 text-xs font-bold rounded-full transition-colors mr-2">
                      Ver Original
                    </a>
                  )}
                  {faq.category && (
                    <span className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-full mr-2">
                      {faq.category}
                    </span>
                  )}
                  <button onClick={() => handleOpenForm(faq)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors">
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button onClick={() => handleDelete(faq.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              
              <div className="p-4 text-sm text-slate-600 grid grid-cols-4 gap-4 bg-slate-50 border-b border-slate-100">
                <div><strong className="text-slate-700">Tipo:</strong> {faq.type || '—'}</div>
                <div><strong className="text-slate-700">Serviço:</strong> {faq.service || '—'}</div>
                <div><strong className="text-slate-700">Assunto:</strong> {faq.subject || '—'}</div>
                <div><strong className="text-slate-700">Sistema:</strong> {faq.system || '—'}</div>
              </div>

              <div className="p-2 space-y-2">
                <div>
                  <button 
                    onClick={() => toggleExpand(faq.id, 'techInfo')}
                    className="flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-800 p-2"
                  >
                    {expandedFaqs[faq.id]?.techInfo ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    Informação técnica
                  </button>
                  {expandedFaqs[faq.id]?.techInfo && (
                    <div className="mx-2 p-3 bg-slate-100 rounded text-sm text-slate-700 font-mono whitespace-pre-wrap">
                      {faq.technicalInfo || '—'}
                    </div>
                  )}
                </div>
                <div>
                  <button 
                    onClick={() => toggleExpand(faq.id, 'procedure')}
                    className="flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-800 p-2"
                  >
                    {expandedFaqs[faq.id]?.procedure ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    Procedimento
                  </button>
                  {expandedFaqs[faq.id]?.procedure && (
                    <div className="mx-2 p-3 bg-slate-100 rounded text-sm text-slate-700 font-mono whitespace-pre-wrap">
                      {faq.procedure || '—'}
                    </div>
                  )}
                </div>
              </div>
              <div className="p-4 border-t border-slate-100 bg-white">
                <button 
                  onClick={() => toggleExpand(faq.id, 'tickets')}
                  className="flex items-center gap-1 text-sm font-bold text-blue-600 hover:text-blue-700"
                >
                  {expandedFaqs[faq.id]?.tickets ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  Chamados associados ({tickets.filter(t => t.associatedFaqId === faq.id).length})
                </button>
                {expandedFaqs[faq.id]?.tickets && (
                  <div className="mt-3 space-y-2">
                    {tickets.filter(t => t.associatedFaqId === faq.id).length === 0 ? (
                      <p className="text-sm text-slate-500 italic ml-5">Nenhum chamado associado.</p>
                    ) : (
                      <div className="ml-5 flex flex-col gap-2">
                        {tickets.filter(t => t.associatedFaqId === faq.id).map(t => (
                          <div key={t.id} className="text-sm border border-slate-200 rounded p-2 bg-slate-50">
                            <span className="font-bold text-slate-700">ID: {t.id}</span> - {t.description}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {isFormOpen && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-start justify-center p-4 sm:p-8 z-50 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full my-4 sm:my-8 relative">
            <div className="flex items-center justify-between p-6 border-b border-slate-200 sticky top-0 bg-white rounded-t-xl z-10">
              <h2 className="text-xl font-bold text-slate-800">{editingId ? 'Editar FAQ' : 'Nova FAQ'}</h2>
              <button onClick={handleCloseForm} className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Número da FAQ</label>
                  <input
                    type="text"
                    value={formData.faqNumber}
                    onChange={e => setFormData({ ...formData, faqNumber: e.target.value })}
                    className="w-full p-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-bold text-slate-700 mb-2">Nome da FAQ</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="w-full p-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Categoria</label>
                  <select
                    value={formData.category}
                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                    className="w-full p-3 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Selecione a categoria</option>
                    {(appSettings.categories || []).map((cat, i) => (
                      <option key={i} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Link da FAQ original</label>
                  <input
                    type="url"
                    value={formData.originalLink || ''}
                    onChange={e => setFormData({ ...formData, originalLink: e.target.value })}
                    className="w-full p-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="https://"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Informação técnica</label>
                <textarea
                  rows={4}
                  value={formData.technicalInfo}
                  onChange={e => setFormData({ ...formData, technicalInfo: e.target.value })}
                  className="w-full p-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Tipo</label>
                  <select
                    value={formData.type}
                    onChange={e => setFormData({ ...formData, type: e.target.value as any })}
                    className="w-full p-3 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Selecione</option>
                    <option value="Incidente">Incidente</option>
                    <option value="Requisição de serviço">Requisição de serviço</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Serviço</label>
                  <input
                    type="text"
                    value={formData.service}
                    onChange={e => setFormData({ ...formData, service: e.target.value })}
                    className="w-full p-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Assunto</label>
                  <input
                    type="text"
                    value={formData.subject}
                    onChange={e => setFormData({ ...formData, subject: e.target.value })}
                    className="w-full p-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Sistema associado</label>
                  <input
                    type="text"
                    value={formData.system}
                    onChange={e => setFormData({ ...formData, system: e.target.value })}
                    placeholder="Digite o sistema..."
                    className="w-full p-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Procedimento associado</label>
                  <select
                    value={formData.associatedProcedureId}
                    onChange={e => setFormData({ ...formData, associatedProcedureId: e.target.value })}
                    className="w-full p-3 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Nenhum</option>
                    {procedures.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Procedimento</label>
                <textarea
                  rows={6}
                  value={formData.procedure}
                  onChange={e => setFormData({ ...formData, procedure: e.target.value })}
                  className="w-full p-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-200 bg-slate-50 rounded-b-xl sticky bottom-0 z-10">
              <button
                onClick={handleCloseForm}
                className="px-6 py-2.5 text-sm font-bold text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={!formData.name}
                className="px-6 py-2.5 text-sm font-bold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
