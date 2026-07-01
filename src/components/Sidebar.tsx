import React, { useState } from 'react';
import { Headset, HelpCircle, ListChecks, BookOpen, Info, Settings, Plus, ExternalLink, X, Trash2, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AppSettings, Shortcut } from '@/types';

interface SidebarProps {
  activeItem?: string;
  onNavigate?: (item: string) => void;
  appSettings?: AppSettings;
  onUpdateSettings?: (settings: AppSettings) => void;
}

export function Sidebar({ activeItem = 'Atendimento', onNavigate, appSettings, onUpdateSettings }: SidebarProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [shortcutTitle, setShortcutTitle] = useState('');
  const [shortcutUrl, setShortcutUrl] = useState('');

  const menuItems = [
    { name: 'Atendimento', icon: Headset },
    { name: 'SLA', icon: Activity },
    { name: 'FAQs', icon: HelpCircle },
    { name: 'Orientações', icon: ListChecks },
    { name: 'Dúvidas Técnicas', icon: BookOpen },
    { name: 'Informações', icon: Info },
  ];

  const shortcuts = appSettings?.shortcuts || [];

  const handleSaveShortcut = () => {
    if (!shortcutTitle || !shortcutUrl || !appSettings || !onUpdateSettings) return;

    const newShortcut: Shortcut = {
      id: Date.now().toString(),
      title: shortcutTitle,
      url: shortcutUrl.startsWith('http') ? shortcutUrl : `https://${shortcutUrl}`
    };

    onUpdateSettings({
      ...appSettings,
      shortcuts: [...shortcuts, newShortcut]
    });

    setShortcutTitle('');
    setShortcutUrl('');
    setIsModalOpen(false);
  };

  const handleDeleteShortcut = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!appSettings || !onUpdateSettings) return;
    
    onUpdateSettings({
      ...appSettings,
      shortcuts: shortcuts.filter(s => s.id !== id)
    });
  };

  return (
    <aside className="w-64 bg-slate-900 flex flex-col shrink-0 h-screen fixed left-0 top-0">
      <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
        <div className="flex items-center gap-3 mb-10">
          <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center text-white font-bold">
            S
          </div>
          <h1 className="font-semibold text-white text-lg tracking-tight">
            Central de Suporte
          </h1>
        </div>

        <div className="mb-2 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
          Menu
        </div>
        <nav className="space-y-1">
          {menuItems.map((item) => (
            <button
              key={item.name}
              onClick={() => onNavigate?.(item.name)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors",
                activeItem === item.name 
                  ? "bg-blue-600/20 text-blue-400 border-r-4 border-blue-500 rounded-sm" 
                  : "text-slate-400 hover:bg-slate-800 hover:text-white rounded-sm"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.name}
            </button>
          ))}
        </nav>

        <div className="mt-8 mb-2 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
          <span>Atalhos rápidos</span>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="text-slate-400 hover:text-white p-1 rounded transition-colors"
            title="Adicionar Atalho"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>
        <div className="px-2 space-y-1">
          {shortcuts.length === 0 ? (
            <div className="px-2 py-2 text-xs text-slate-500">
              Nenhum atalho ainda
            </div>
          ) : (
            shortcuts.map(shortcut => (
              <a
                key={shortcut.id}
                href={shortcut.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center justify-between px-3 py-2 text-xs text-slate-400 hover:bg-slate-800 hover:text-white rounded-sm transition-colors"
              >
                <div className="flex items-center gap-2 truncate">
                  <ExternalLink className="h-3.5 w-3.5 shrink-0 opacity-50" />
                  <span className="truncate">{shortcut.title}</span>
                </div>
                <button
                  onClick={(e) => handleDeleteShortcut(shortcut.id, e)}
                  className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-red-400 transition-all"
                  title="Remover"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </a>
            ))
          )}
        </div>
      </div>

      <div className="mt-auto p-6 border-t border-slate-800 bg-slate-900 shrink-0">
        <button 
          onClick={() => onNavigate?.('Configurações')}
          className={cn(
            "w-full flex items-center gap-3 px-4 py-3 rounded-sm text-sm font-medium transition-colors",
            activeItem === 'Configurações'
              ? "bg-blue-600/20 text-blue-400 border-r-4 border-blue-500" 
              : "text-slate-400 hover:bg-slate-800 hover:text-white"
          )}
        >
          <Settings className="h-4 w-4" />
          Configurações
        </button>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm">
            <div className="flex items-center justify-between p-4 border-b border-slate-200">
              <h2 className="text-base font-bold text-slate-800">Novo Atalho</h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Título</label>
                <input
                  type="text"
                  value={shortcutTitle}
                  onChange={(e) => setShortcutTitle(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-black"
                  placeholder="Ex: Painel Admin"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Link (URL)</label>
                <input
                  type="text"
                  value={shortcutUrl}
                  onChange={(e) => setShortcutUrl(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-black"
                  placeholder="Ex: admin.empresa.com"
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 p-4 border-t border-slate-200 bg-slate-50 rounded-b-xl">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-200 rounded"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveShortcut}
                disabled={!shortcutTitle || !shortcutUrl}
                className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded disabled:opacity-50"
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
