import { useState } from 'react';
import { Plus, Trash2, Edit2, X, ChevronDown, ChevronRight } from 'lucide-react';
import { AppSettings, Orientation } from '@/types';

interface ProcedurePanelProps {
  appSettings: AppSettings;
  onUpdateSettings: (settings: AppSettings) => void;
}

export function ProcedurePanel({ appSettings, onUpdateSettings }: ProcedurePanelProps) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<Omit<Orientation, 'id'>>({
    name: '',
    description: '',
    steps: '',
    category: ''
  });

  const [expandedOrientations, setExpandedOrientations] = useState<Record<string, boolean>>({});

  const handleOpenForm = (orientation?: Orientation) => {
    if (orientation) {
      setEditingId(orientation.id);
      setFormData({
        name: orientation.name || '',
        description: orientation.description || '',
        steps: orientation.steps || '',
        category: orientation.category || ''
      });
    } else {
      setEditingId(null);
      setFormData({
        name: '',
        description: '',
        steps: '',
        category: ''
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

    let newOrientations = appSettings.orientations || [];
    if (editingId) {
      newOrientations = newOrientations.map(p => p.id === editingId ? { ...formData, id: editingId } : p);
    } else {
      const newOrientation: Orientation = { ...formData, id: Date.now().toString() };
      newOrientations = [...newOrientations, newOrientation];
    }
    
    onUpdateSettings({ ...appSettings, orientations: newOrientations });
    handleCloseForm();
  };

  const handleDelete = (id: string) => {
    const newOrientations = (appSettings.orientations || []).filter(p => p.id !== id);
    onUpdateSettings({ ...appSettings, orientations: newOrientations });
  };

  const toggleExpand = (id: string) => {
    setExpandedOrientations(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const orientations = appSettings.orientations || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-800">Orientações</h2>
          <p className="text-sm text-slate-500">Gerencie a base de conhecimento de orientações.</p>
        </div>
        <button
          onClick={() => handleOpenForm()}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Nova Orientação
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        {orientations.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            Nenhuma orientação cadastrada.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {orientations.map((orient, index) => (
              <div key={orient.id} className="p-4 hover:bg-slate-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-2">
                      <span className="px-2 py-1 bg-slate-100 text-slate-600 text-xs font-bold rounded">#{index + 1}</span>
                      <h3 className="font-bold text-slate-800 flex-1">{orient.name}</h3>
                    </div>
                    {orient.category && (
                      <span className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-full mb-3 inline-block">
                        {orient.category}
                      </span>
                    )}
                    
                    <button 
                      onClick={() => toggleExpand(orient.id)}
                      className="flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors"
                    >
                      {expandedOrientations[orient.id] ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      Ver detalhes
                    </button>
                    
                    {expandedOrientations[orient.id] && (
                      <div className="mt-4 pl-6 border-l-2 border-slate-100 space-y-4">
                        <div>
                          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Descrição</h4>
                          <p className="text-sm text-slate-700 whitespace-pre-wrap">{orient.description}</p>
                        </div>
                        {orient.steps && (
                          <div>
                            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Passos</h4>
                            <p className="text-sm text-slate-700 whitespace-pre-wrap">{orient.steps}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2 ml-4">
                    <button onClick={() => handleOpenForm(orient)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors">
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button onClick={() => handleDelete(orient.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {isFormOpen && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-start justify-center p-4 sm:p-8 z-50 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full my-4 sm:my-8 relative">
            <div className="flex items-center justify-between p-6 border-b border-slate-200 sticky top-0 bg-white rounded-t-xl z-10">
              <h2 className="text-xl font-bold text-slate-800">{editingId ? 'Editar Orientação' : 'Novo registro'}</h2>
              <button onClick={handleCloseForm} className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Título <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full p-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Descrição</label>
                <textarea
                  rows={4}
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  className="w-full p-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Passos</label>
                <textarea
                  rows={6}
                  value={formData.steps || ''}
                  onChange={e => setFormData({ ...formData, steps: e.target.value })}
                  className="w-full p-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Categoria</label>
                <select
                  value={formData.category || ''}
                  onChange={e => setFormData({ ...formData, category: e.target.value })}
                  className="w-full p-3 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Selecione a categoria</option>
                  {(appSettings.categories || []).map((cat, i) => (
                    <option key={i} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

            </div>
            
            <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-200 bg-slate-50 rounded-b-xl">
              <button 
                onClick={handleCloseForm}
                className="px-6 py-2.5 rounded-lg text-sm font-bold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={handleSave}
                disabled={!formData.name}
                className="px-6 py-2.5 rounded-lg text-sm font-bold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-50 transition-colors"
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
