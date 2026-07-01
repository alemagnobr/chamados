import { useState, ChangeEvent, useEffect } from 'react';
import { Plus, X, Edit2, Check, ChevronDown, ChevronUp } from 'lucide-react';
import { AppSettings } from '@/types';

interface SettingsPanelProps {
  appSettings: AppSettings;
  onUpdateSettings: (settings: AppSettings) => void;
}

function AccordionSection({ 
  title, 
  isExpanded, 
  onToggle, 
  children,
  headerAction
}: { 
  title: string; 
  isExpanded: boolean; 
  onToggle: () => void; 
  children: React.ReactNode;
  headerAction?: React.ReactNode;
}) {
  return (
    <div className="border-b border-slate-200 last:border-0">
      <div 
        className="flex items-center justify-between p-6 cursor-pointer bg-white hover:bg-slate-50 transition-colors select-none"
        onClick={onToggle}
      >
        <h2 className="text-xl font-bold text-slate-800">{title}</h2>
        <div className="flex items-center gap-4">
          {headerAction && <div onClick={e => e.stopPropagation()}>{headerAction}</div>}
          {isExpanded ? <ChevronUp className="h-5 w-5 text-slate-400" /> : <ChevronDown className="h-5 w-5 text-slate-400" />}
        </div>
      </div>
      {isExpanded && (
        <div className="p-6 pt-0 bg-white animate-in fade-in slide-in-from-top-2 duration-200">
          {children}
        </div>
      )}
    </div>
  );
}

export function SettingsPanel({ appSettings, onUpdateSettings }: SettingsPanelProps) {
  const [newCategory, setNewCategory] = useState('');

  const [newProcedureName, setNewProcedureName] = useState('');
  const [newProcedureDesc, setNewProcedureDesc] = useState('');

  const [editingProcedureId, setEditingProcedureId] = useState<string | null>(null);
  const [editingProcedureName, setEditingProcedureName] = useState('');
  const [editingProcedureDesc, setEditingProcedureDesc] = useState('');

  const [newVerificationName, setNewVerificationName] = useState('');
  const [newVerificationDesc, setNewVerificationDesc] = useState('');
  const [editingVerificationId, setEditingVerificationId] = useState<string | null>(null);
  const [editingVerificationName, setEditingVerificationName] = useState('');
  const [editingVerificationDesc, setEditingVerificationDesc] = useState('');

  const [newPredefinedTitle, setNewPredefinedTitle] = useState('');
  const [newPredefinedContent, setNewPredefinedContent] = useState('');
  const [editingPredefinedId, setEditingPredefinedId] = useState<string | null>(null);
  const [editingPredefinedTitle, setEditingPredefinedTitle] = useState('');
  const [editingPredefinedContent, setEditingPredefinedContent] = useState('');

  const [localClosingText, setLocalClosingText] = useState(appSettings.closingText);
  const [localEscalationTemplate, setLocalEscalationTemplate] = useState(appSettings.escalationTemplate || '');
  const [localAiPromptStandard, setLocalAiPromptStandard] = useState(appSettings.aiPromptStandard || '');
  const [localAiPromptEscalated, setLocalAiPromptEscalated] = useState(appSettings.aiPromptEscalated || '');
  const [localGeminiApiKey, setLocalGeminiApiKey] = useState(appSettings.geminiApiKey || '');
  
  const [newAiGuideline, setNewAiGuideline] = useState('');
  const [editingGuidelineIndex, setEditingGuidelineIndex] = useState<number | null>(null);
  const [editingGuidelineText, setEditingGuidelineText] = useState('');

  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  useEffect(() => {
    setLocalClosingText(appSettings.closingText);
    setLocalEscalationTemplate(appSettings.escalationTemplate || '');
    setLocalAiPromptStandard(appSettings.aiPromptStandard || '');
    setLocalAiPromptEscalated(appSettings.aiPromptEscalated || '');
    setLocalGeminiApiKey(appSettings.geminiApiKey || '');
  }, [appSettings.closingText, appSettings.escalationTemplate, appSettings.aiPromptStandard, appSettings.aiPromptEscalated, appSettings.geminiApiKey]);

  const handleSaveGeminiApiKey = () => {
    onUpdateSettings({ ...appSettings, geminiApiKey: localGeminiApiKey });
  };

  const handleSaveClosingText = () => {
    onUpdateSettings({ ...appSettings, closingText: localClosingText });
  };

  const handleSaveEscalationTemplate = () => {
    onUpdateSettings({ ...appSettings, escalationTemplate: localEscalationTemplate });
  };

  const handleSaveAiPromptStandard = () => {
    onUpdateSettings({ ...appSettings, aiPromptStandard: localAiPromptStandard });
  };

  const handleSaveAiPromptEscalated = () => {
    onUpdateSettings({ ...appSettings, aiPromptEscalated: localAiPromptEscalated });
  };

  const handleSlaChange = (field: keyof AppSettings['sla'], value: string) => {
    const num = parseInt(value, 10);
    if (!isNaN(num)) {
      onUpdateSettings({ 
        ...appSettings, 
        sla: { ...appSettings.sla, [field]: num } 
      });
    }
  };

  const handleToggleClosingText = () => {
    onUpdateSettings({ ...appSettings, closingTextEnabled: !appSettings.closingTextEnabled });
  };

  const handleAddAiGuideline = () => {
    if (newAiGuideline.trim()) {
      const currentGuidelines = appSettings.aiGuidelines || [];
      onUpdateSettings({
        ...appSettings,
        aiGuidelines: [...currentGuidelines, newAiGuideline.trim()]
      });
      setNewAiGuideline('');
    }
  };

  const handleRemoveAiGuideline = (index: number) => {
    const currentGuidelines = appSettings.aiGuidelines || [];
    onUpdateSettings({
      ...appSettings,
      aiGuidelines: currentGuidelines.filter((_, i) => i !== index)
    });
  };

  const handleSaveEditGuideline = (index: number) => {
    if (editingGuidelineText.trim()) {
      const currentGuidelines = [...(appSettings.aiGuidelines || [])];
      currentGuidelines[index] = editingGuidelineText.trim();
      onUpdateSettings({
        ...appSettings,
        aiGuidelines: currentGuidelines
      });
      setEditingGuidelineIndex(null);
    }
  };

  const handleAddCategory = () => {
    if (newCategory.trim() && !appSettings.categories.includes(newCategory.trim())) {
      onUpdateSettings({
        ...appSettings,
        categories: [...appSettings.categories, newCategory.trim()]
      });
      setNewCategory('');
    }
  };

  const handleRemoveCategory = (category: string) => {
    onUpdateSettings({
      ...appSettings,
      categories: appSettings.categories.filter(c => c !== category)
    });
  };

  const handleAddProcedure = () => {
    if (newProcedureName.trim() && newProcedureDesc.trim()) {
      onUpdateSettings({
        ...appSettings,
        procedures: [
          ...appSettings.procedures,
          {
            id: Date.now().toString(),
            name: newProcedureName.trim(),
            description: newProcedureDesc.trim()
          }
        ]
      });
      setNewProcedureName('');
      setNewProcedureDesc('');
    }
  };

  const handleRemoveProcedure = (id: string) => {
    onUpdateSettings({
      ...appSettings,
      procedures: appSettings.procedures.filter(p => p.id !== id)
    });
  };

  const startEditingProcedure = (proc: { id: string, name: string, description: string }) => {
    setEditingProcedureId(proc.id);
    setEditingProcedureName(proc.name);
    setEditingProcedureDesc(proc.description);
  };

  const cancelEditingProcedure = () => {
    setEditingProcedureId(null);
    setEditingProcedureName('');
    setEditingProcedureDesc('');
  };

  const saveEditedProcedure = () => {
    if (editingProcedureName.trim() && editingProcedureDesc.trim() && editingProcedureId) {
      onUpdateSettings({
        ...appSettings,
        procedures: appSettings.procedures.map(p => 
          p.id === editingProcedureId 
            ? { ...p, name: editingProcedureName.trim(), description: editingProcedureDesc.trim() }
            : p
        )
      });
      cancelEditingProcedure();
    }
  };

  const handleAddVerification = () => {
    if (newVerificationName.trim() && newVerificationDesc.trim()) {
      onUpdateSettings({
        ...appSettings,
        verifications: [
          ...(appSettings.verifications || []),
          {
            id: Date.now().toString(),
            name: newVerificationName.trim(),
            description: newVerificationDesc.trim()
          }
        ]
      });
      setNewVerificationName('');
      setNewVerificationDesc('');
    }
  };

  const handleRemoveVerification = (id: string) => {
    onUpdateSettings({
      ...appSettings,
      verifications: (appSettings.verifications || []).filter(v => v.id !== id)
    });
  };

  const startEditingVerification = (verif: { id: string, name: string, description: string }) => {
    setEditingVerificationId(verif.id);
    setEditingVerificationName(verif.name);
    setEditingVerificationDesc(verif.description);
  };

  const cancelEditingVerification = () => {
    setEditingVerificationId(null);
    setEditingVerificationName('');
    setEditingVerificationDesc('');
  };

  const saveEditedVerification = () => {
    if (editingVerificationName.trim() && editingVerificationDesc.trim() && editingVerificationId) {
      onUpdateSettings({
        ...appSettings,
        verifications: (appSettings.verifications || []).map(v => 
          v.id === editingVerificationId 
            ? { ...v, name: editingVerificationName.trim(), description: editingVerificationDesc.trim() }
            : v
        )
      });
      cancelEditingVerification();
    }
  };

  const handleAddPredefined = () => {
    if (newPredefinedTitle.trim() && newPredefinedContent.trim()) {
      onUpdateSettings({
        ...appSettings,
        predefinedSolutions: [
          ...(appSettings.predefinedSolutions || []),
          {
            id: Date.now().toString(),
            title: newPredefinedTitle.trim(),
            content: newPredefinedContent.trim()
          }
        ]
      });
      setNewPredefinedTitle('');
      setNewPredefinedContent('');
    }
  };

  const handleRemovePredefined = (id: string) => {
    onUpdateSettings({
      ...appSettings,
      predefinedSolutions: (appSettings.predefinedSolutions || []).filter(s => s.id !== id)
    });
  };

  const startEditingPredefined = (sol: { id: string, title: string, content: string }) => {
    setEditingPredefinedId(sol.id);
    setEditingPredefinedTitle(sol.title);
    setEditingPredefinedContent(sol.content);
  };

  const cancelEditingPredefined = () => {
    setEditingPredefinedId(null);
    setEditingPredefinedTitle('');
    setEditingPredefinedContent('');
  };

  const saveEditedPredefined = () => {
    if (editingPredefinedTitle.trim() && editingPredefinedContent.trim() && editingPredefinedId) {
      onUpdateSettings({
        ...appSettings,
        predefinedSolutions: (appSettings.predefinedSolutions || []).map(s => 
          s.id === editingPredefinedId 
            ? { ...s, title: editingPredefinedTitle.trim(), content: editingPredefinedContent.trim() }
            : s
        )
      });
      cancelEditingPredefined();
    }
  };

  const toggleSection = (section: string) => {
    setExpandedSection(prev => prev === section ? null : section);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm max-w-2xl mx-auto overflow-hidden">
      <AccordionSection
        title="Chave da API Gemini"
        isExpanded={expandedSection === 'gemini'}
        onToggle={() => toggleSection('gemini')}
      >
        <p className="text-sm text-slate-500 mb-6 mt-4">
          Insira sua chave da API do Google Gemini para ativar as funcionalidades de Inteligência Artificial no sistema.
        </p>

        <div className="flex gap-2">
          <input
            type="password"
            value={localGeminiApiKey}
            onChange={(e) => setLocalGeminiApiKey(e.target.value)}
            placeholder="AIzaSy..."
            className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleSaveGeminiApiKey}
            disabled={localGeminiApiKey === (appSettings.geminiApiKey || '')}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Check className="h-4 w-4" />
            Salvar
          </button>
        </div>
      </AccordionSection>

      <AccordionSection
        title="Configurações de SLA (em minutos)"
        isExpanded={expandedSection === 'sla'}
        onToggle={() => toggleSection('sla')}
      >
        <p className="text-sm text-slate-500 mb-8 mt-4">
          Defina o tempo máximo para cada categoria de SLA. O Dashboard calculará automaticamente a média dos chamados finalizados e classificará conforme essas configurações.
        </p>

        <div className="space-y-6">
          <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-lg">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                <span className="font-bold text-slate-700">Ótima</span>
              </div>
              <span className="text-xs text-slate-500">Até este tempo, a média é considerada excelente.</span>
            </div>
            <div className="flex items-center gap-2">
              <input 
                type="number" 
                value={appSettings.sla.otima}
                onChange={(e) => handleSlaChange('otima', e.target.value)}
                className="w-20 p-2 text-center rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium"
              />
              <span className="text-sm text-slate-500">min</span>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-lg">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                <span className="font-bold text-slate-700">Boa</span>
              </div>
              <span className="text-xs text-slate-500">Acima de Ótima e até este tempo.</span>
            </div>
            <div className="flex items-center gap-2">
              <input 
                type="number" 
                value={appSettings.sla.boa}
                onChange={(e) => handleSlaChange('boa', e.target.value)}
                className="w-20 p-2 text-center rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium"
              />
              <span className="text-sm text-slate-500">min</span>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-lg">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                <span className="font-bold text-slate-700">Atenção</span>
              </div>
              <span className="text-xs text-slate-500">Acima de Boa e até este tempo.</span>
            </div>
            <div className="flex items-center gap-2">
              <input 
                type="number" 
                value={appSettings.sla.atencao}
                onChange={(e) => handleSlaChange('atencao', e.target.value)}
                className="w-20 p-2 text-center rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium"
              />
              <span className="text-sm text-slate-500">min</span>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-lg">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                <span className="font-bold text-slate-700">Ruim</span>
              </div>
              <span className="text-xs text-slate-500">Acima de Atenção e até este tempo.</span>
            </div>
            <div className="flex items-center gap-2">
              <input 
                type="number" 
                value={appSettings.sla.ruim}
                onChange={(e) => handleSlaChange('ruim', e.target.value)}
                className="w-20 p-2 text-center rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium"
              />
              <span className="text-sm text-slate-500">min</span>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-lg opacity-60">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <span className="font-bold text-slate-700">Crítica</span>
              </div>
              <span className="text-xs text-slate-500">Qualquer tempo acima de Ruim.</span>
            </div>
            <div className="flex items-center gap-2">
              <input 
                type="text" 
                disabled
                value={`> ${appSettings.sla.ruim}`}
                className="w-20 p-2 text-center rounded-lg border border-slate-200 bg-slate-100 text-sm font-medium cursor-not-allowed"
              />
              <span className="text-sm text-slate-500">min</span>
            </div>
          </div>
        </div>
      </AccordionSection>
      
      <AccordionSection
        title="Prompt da IA"
        isExpanded={expandedSection === 'prompts'}
        onToggle={() => toggleSection('prompts')}
      >
        <p className="text-sm text-slate-500 mb-6 mt-4">
          Edite o prompt base utilizado pela Inteligência Artificial para estruturar os chamados. Utilize as variáveis <code>{`{description}`}</code>, <code>{`{proceduresContext}`}</code>, <code>{`{guidelinesContext}`}</code> e <code>{`{validationContext}`}</code> onde apropriado.
        </p>

        <div className="space-y-8">
          <div>
            <h3 className="text-md font-bold text-slate-700 mb-2">Prompt Padrão (Sem Escalonamento)</h3>
            <textarea
              className="w-full h-64 p-4 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 font-mono leading-relaxed focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
              value={localAiPromptStandard}
              onChange={(e) => setLocalAiPromptStandard(e.target.value)}
              placeholder="Digite o prompt padrão..."
            ></textarea>

            <div className="flex justify-end">
              <button
                onClick={handleSaveAiPromptStandard}
                disabled={localAiPromptStandard === appSettings.aiPromptStandard}
                className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Check className="h-4 w-4" />
                Salvar Prompt Padrão
              </button>
            </div>
          </div>

          <div>
            <h3 className="text-md font-bold text-slate-700 mb-2">Prompt para Escalonamento</h3>
            <textarea
              className="w-full h-64 p-4 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 font-mono leading-relaxed focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
              value={localAiPromptEscalated}
              onChange={(e) => setLocalAiPromptEscalated(e.target.value)}
              placeholder="Digite o prompt de escalonamento..."
            ></textarea>

            <div className="flex justify-end">
              <button
                onClick={handleSaveAiPromptEscalated}
                disabled={localAiPromptEscalated === appSettings.aiPromptEscalated}
                className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Check className="h-4 w-4" />
                Salvar Prompt Escalonamento
              </button>
            </div>
          </div>
        </div>
      </AccordionSection>
      
      <AccordionSection
        title="Finalização do Chamado"
        isExpanded={expandedSection === 'closing'}
        onToggle={() => toggleSection('closing')}
        headerAction={
          <label className="flex items-center cursor-pointer relative">
            <input type="checkbox" className="sr-only" checked={appSettings.closingTextEnabled} onChange={handleToggleClosingText} />
            <div className={`w-11 h-6 rounded-full transition-colors ${appSettings.closingTextEnabled ? 'bg-blue-600' : 'bg-slate-300'}`}>
              <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${appSettings.closingTextEnabled ? 'translate-x-5' : ''}`}></div>
            </div>
            <span className="ml-3 text-sm font-bold text-slate-700">Ativar</span>
          </label>
        }
      >
        <p className="text-sm text-slate-500 mb-6 mt-4">
          Esse texto será obrigatoriamente adicionado ao final da descrição após a IA processar e estruturar o chamado.
        </p>

        <textarea
          className="w-full h-48 p-4 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 font-sans leading-relaxed focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60 disabled:bg-slate-100 mb-4"
          value={localClosingText}
          onChange={(e) => setLocalClosingText(e.target.value)}
          disabled={!appSettings.closingTextEnabled}
          placeholder="Digite o texto de finalização padrão..."
        ></textarea>

        <div className="flex justify-end">
          <button
            onClick={handleSaveClosingText}
            disabled={!appSettings.closingTextEnabled || localClosingText === appSettings.closingText}
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Check className="h-4 w-4" />
            Salvar Texto
          </button>
        </div>
      </AccordionSection>

      <AccordionSection
        title="Orientações para a IA"
        isExpanded={expandedSection === 'guidelines'}
        onToggle={() => toggleSection('guidelines')}
      >
        <p className="text-sm text-slate-500 mb-6 mt-4">
          Cadastre regras ou orientações que a IA deve seguir ao estruturar o chamado (Ex: "Nunca use a palavra 'usuário', use sempre 'cliente'").
        </p>

        <div className="flex gap-2 mb-6">
          <input
            type="text"
            className="flex-1 p-3 rounded-lg border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Nova orientação..."
            value={newAiGuideline}
            onChange={(e) => setNewAiGuideline(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAddAiGuideline()}
          />
          <button
            onClick={handleAddAiGuideline}
            disabled={!newAiGuideline.trim()}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-bold text-sm hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            <Plus className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-3">
          {(appSettings.aiGuidelines || []).map((guideline, index) => (
            <div key={index} className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-lg group hover:border-blue-200 transition-colors">
              {editingGuidelineIndex === index ? (
                <div className="flex items-center gap-2 flex-1 mr-4">
                  <input
                    type="text"
                    className="flex-1 p-2 border border-blue-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={editingGuidelineText}
                    onChange={(e) => setEditingGuidelineText(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSaveEditGuideline(index)}
                    autoFocus
                  />
                  <button onClick={() => handleSaveEditGuideline(index)} className="p-2 text-green-600 hover:bg-green-50 rounded">
                    <Check className="h-4 w-4" />
                  </button>
                  <button onClick={() => setEditingGuidelineIndex(null)} className="p-2 text-slate-400 hover:bg-slate-100 rounded">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <>
                  <span className="text-sm font-medium text-slate-700 flex-1">{guideline}</span>
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => {
                        setEditingGuidelineIndex(index);
                        setEditingGuidelineText(guideline);
                      }} 
                      className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button 
                      onClick={() => handleRemoveAiGuideline(index)} 
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
          
          {(appSettings.aiGuidelines || []).length === 0 && (
            <div className="p-8 text-center border-2 border-dashed border-slate-200 rounded-lg">
              <p className="text-slate-500 text-sm">Nenhuma orientação cadastrada</p>
            </div>
          )}
        </div>
      </AccordionSection>

      <AccordionSection
        title="Template de Escalonamento"
        isExpanded={expandedSection === 'escalation'}
        onToggle={() => toggleSection('escalation')}
      >
        <p className="text-sm text-slate-500 mb-6 mt-4">
          Esse modelo será carregado automaticamente quando a opção "Escalonamento" for selecionada em um chamado.
        </p>

        <textarea
          className="w-full h-48 p-4 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 font-sans leading-relaxed focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
          value={localEscalationTemplate}
          onChange={(e) => setLocalEscalationTemplate(e.target.value)}
          placeholder="Digite o template padrão de escalonamento..."
        ></textarea>

        <div className="flex justify-end">
          <button
            onClick={handleSaveEscalationTemplate}
            disabled={localEscalationTemplate === (appSettings.escalationTemplate || '')}
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Check className="h-4 w-4" />
            Salvar Template
          </button>
        </div>
      </AccordionSection>

      <AccordionSection
        title="Categorias"
        isExpanded={expandedSection === 'categories'}
        onToggle={() => toggleSection('categories')}
      >
        <p className="text-sm text-slate-500 mb-6 mt-4">
          Cadastre as categorias que poderão ser selecionadas durante os chamados e usadas para filtrar o histórico.
        </p>

        <div className="flex gap-2 mb-6">
          <input
            type="text"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
            placeholder="Nova categoria..."
            className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleAddCategory}
            disabled={!newCategory.trim()}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="h-4 w-4" />
            Adicionar
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          {appSettings.categories.map((cat) => (
            <div key={cat} className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 border border-slate-200 rounded-full">
              <span className="text-sm font-medium text-slate-700">{cat}</span>
              <button 
                onClick={() => handleRemoveCategory(cat)}
                className="text-slate-400 hover:text-red-500 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
          {appSettings.categories.length === 0 && (
            <p className="text-sm text-slate-400 italic">Nenhuma categoria cadastrada.</p>
          )}
        </div>
      </AccordionSection>
      
      <AccordionSection
        title="Procedimentos Executados"
        isExpanded={expandedSection === 'procedures'}
        onToggle={() => toggleSection('procedures')}
      >
        <p className="text-sm text-slate-500 mb-6 mt-4">
          Cadastre os procedimentos técnicos (como comandos) que podem ser marcados como executados durante os chamados.
        </p>

        <div className="flex gap-2 mb-6 flex-col">
          <input
            type="text"
            value={newProcedureName}
            onChange={(e) => setNewProcedureName(e.target.value)}
            placeholder="Comando / Nome do Procedimento (ex: gpupdate /force)"
            className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div className="flex gap-2">
            <input
              type="text"
              value={newProcedureDesc}
              onChange={(e) => setNewProcedureDesc(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddProcedure()}
              placeholder="Descrição do que este comando faz..."
              className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleAddProcedure}
              disabled={!newProcedureName.trim() || !newProcedureDesc.trim()}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="h-4 w-4" />
              Adicionar
            </button>
          </div>
        </div>

        <div className="space-y-3">
          {appSettings.procedures.map((proc) => (
            <div key={proc.id} className="flex items-start justify-between p-4 bg-slate-50 border border-slate-100 rounded-lg">
              {editingProcedureId === proc.id ? (
                <div className="w-full flex flex-col gap-2">
                  <input
                    type="text"
                    value={editingProcedureName}
                    onChange={(e) => setEditingProcedureName(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-sm text-slate-700 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={editingProcedureDesc}
                      onChange={(e) => setEditingProcedureDesc(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && saveEditedProcedure()}
                      className="flex-1 px-3 py-1.5 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button 
                      onClick={saveEditedProcedure}
                      disabled={!editingProcedureName.trim() || !editingProcedureDesc.trim()}
                      className="p-1.5 bg-emerald-500 text-white rounded hover:bg-emerald-600 transition-colors disabled:opacity-50"
                    >
                      <Check className="h-4 w-4" />
                    </button>
                    <button 
                      onClick={cancelEditingProcedure}
                      className="p-1.5 bg-slate-200 text-slate-600 rounded hover:bg-slate-300 transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex-1">
                    <div className="font-bold text-slate-700 font-mono text-sm">{proc.name}</div>
                    <div className="text-xs text-slate-500 mt-1">{proc.description}</div>
                  </div>
                  <div className="flex items-center gap-1 ml-4">
                    <button 
                      onClick={() => startEditingProcedure(proc)}
                      className="text-slate-400 hover:text-blue-500 transition-colors p-1"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button 
                      onClick={() => handleRemoveProcedure(proc.id)}
                      className="text-slate-400 hover:text-red-500 transition-colors p-1"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
          {appSettings.procedures.length === 0 && (
            <p className="text-sm text-slate-400 italic">Nenhum procedimento cadastrado.</p>
          )}
        </div>
      </AccordionSection>
      
      <AccordionSection
        title="Verificações"
        isExpanded={expandedSection === 'verifications'}
        onToggle={() => toggleSection('verifications')}
      >
        <p className="text-sm text-slate-500 mb-6 mt-4">
          Cadastre as verificações que podem ser marcadas durante os chamados (ex: Verificado cabos, Ping OK).
        </p>

        <div className="flex gap-2 mb-6 flex-col">
          <input
            type="text"
            value={newVerificationName}
            onChange={(e) => setNewVerificationName(e.target.value)}
            placeholder="Nome da Verificação (ex: Ping no Servidor)"
            className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div className="flex gap-2">
            <input
              type="text"
              value={newVerificationDesc}
              onChange={(e) => setNewVerificationDesc(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddVerification()}
              placeholder="Descrição do que foi verificado..."
              className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleAddVerification}
              disabled={!newVerificationName.trim() || !newVerificationDesc.trim()}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="h-4 w-4" />
              Adicionar
            </button>
          </div>
        </div>

        <div className="space-y-3">
          {(appSettings.verifications || []).map((verif) => (
            <div key={verif.id} className="flex items-start justify-between p-4 bg-slate-50 border border-slate-100 rounded-lg">
              {editingVerificationId === verif.id ? (
                <div className="w-full flex flex-col gap-2">
                  <input
                    type="text"
                    value={editingVerificationName}
                    onChange={(e) => setEditingVerificationName(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-sm text-slate-700 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={editingVerificationDesc}
                      onChange={(e) => setEditingVerificationDesc(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && saveEditedVerification()}
                      className="flex-1 px-3 py-1.5 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button 
                      onClick={saveEditedVerification}
                      disabled={!editingVerificationName.trim() || !editingVerificationDesc.trim()}
                      className="p-1.5 bg-emerald-500 text-white rounded hover:bg-emerald-600 transition-colors disabled:opacity-50"
                    >
                      <Check className="h-4 w-4" />
                    </button>
                    <button 
                      onClick={cancelEditingVerification}
                      className="p-1.5 bg-slate-200 text-slate-600 rounded hover:bg-slate-300 transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex-1">
                    <div className="font-bold text-slate-700 font-mono text-sm">{verif.name}</div>
                    <div className="text-xs text-slate-500 mt-1">{verif.description}</div>
                  </div>
                  <div className="flex items-center gap-1 ml-4">
                    <button 
                      onClick={() => startEditingVerification(verif)}
                      className="text-slate-400 hover:text-blue-500 transition-colors p-1"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button 
                      onClick={() => handleRemoveVerification(verif.id)}
                      className="text-slate-400 hover:text-red-500 transition-colors p-1"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
          {(appSettings.verifications || []).length === 0 && (
            <p className="text-sm text-slate-400 italic">Nenhuma verificação cadastrada.</p>
          )}
        </div>
      </AccordionSection>
      
      <AccordionSection
        title="Soluções Padrão"
        isExpanded={expandedSection === 'solutions'}
        onToggle={() => toggleSection('solutions')}
      >
        <p className="text-sm text-slate-500 mb-6 mt-4">
          Cadastre as soluções prontas e tratativas padronizadas.
        </p>

        <div className="flex flex-col gap-2 mb-6">
          <input
            type="text"
            value={newPredefinedTitle}
            onChange={(e) => setNewPredefinedTitle(e.target.value)}
            placeholder="Título da solução (ex: Resolução de Senha Bloqueada)"
            className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div className="flex gap-2">
            <textarea
              value={newPredefinedContent}
              onChange={(e) => setNewPredefinedContent(e.target.value)}
              placeholder="Texto completo da solução..."
              className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y min-h-[80px]"
            />
            <button
              onClick={handleAddPredefined}
              disabled={!newPredefinedTitle.trim() || !newPredefinedContent.trim()}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="h-4 w-4" />
              Adicionar
            </button>
          </div>
        </div>

        <div className="space-y-3">
          {(appSettings.predefinedSolutions || []).map((sol) => (
            <div key={sol.id} className="flex items-start justify-between p-4 bg-slate-50 border border-slate-100 rounded-lg">
              {editingPredefinedId === sol.id ? (
                <div className="w-full flex flex-col gap-2">
                  <input
                    type="text"
                    value={editingPredefinedTitle}
                    onChange={(e) => setEditingPredefinedTitle(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-sm text-slate-700 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <div className="flex gap-2">
                    <textarea
                      value={editingPredefinedContent}
                      onChange={(e) => setEditingPredefinedContent(e.target.value)}
                      className="flex-1 px-3 py-1.5 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y min-h-[80px]"
                    />
                    <div className="flex flex-col gap-2">
                      <button 
                        onClick={saveEditedPredefined}
                        disabled={!editingPredefinedTitle.trim() || !editingPredefinedContent.trim()}
                        className="p-1.5 bg-emerald-500 text-white rounded hover:bg-emerald-600 transition-colors disabled:opacity-50"
                      >
                        <Check className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={cancelEditingPredefined}
                        className="p-1.5 bg-slate-200 text-slate-600 rounded hover:bg-slate-300 transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex-1">
                    <div className="font-bold text-slate-700 text-sm">{sol.title}</div>
                    <div className="text-xs text-slate-500 mt-1 whitespace-pre-wrap">{sol.content}</div>
                  </div>
                  <div className="flex items-center gap-1 ml-4">
                    <button 
                      onClick={() => startEditingPredefined(sol)}
                      className="text-slate-400 hover:text-blue-500 transition-colors p-1"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button 
                      onClick={() => handleRemovePredefined(sol.id)}
                      className="text-slate-400 hover:text-red-500 transition-colors p-1"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
          {(appSettings.predefinedSolutions || []).length === 0 && (
            <p className="text-sm text-slate-400 italic">Nenhuma solução padrão cadastrada.</p>
          )}
        </div>
      </AccordionSection>
    </div>
  );
}
