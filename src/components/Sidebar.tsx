import { Headset, HelpCircle, ListChecks, BookOpen, Monitor, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarProps {
  activeItem?: string;
  onNavigate?: (item: string) => void;
}

export function Sidebar({ activeItem = 'Atendimento', onNavigate }: SidebarProps) {
  const menuItems = [
    { name: 'Atendimento', icon: Headset },
    { name: 'FAQs', icon: HelpCircle },
    { name: 'Orientações', icon: ListChecks },
    { name: 'Dúvidas Técnicas', icon: BookOpen },
    { name: 'Sistemas Senado', icon: Monitor },
  ];

  return (
    <aside className="w-64 bg-slate-900 flex flex-col shrink-0 h-screen fixed left-0 top-0">
      <div className="p-6">
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

        <div className="mt-8 mb-2 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
          Atalhos rápidos
        </div>
        <div className="px-4 text-sm text-slate-500">
          Nenhum atalho ainda
        </div>
      </div>

      <div className="mt-auto p-6 border-t border-slate-800">
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
    </aside>
  );
}
