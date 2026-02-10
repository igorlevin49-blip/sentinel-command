import { useLocation, useNavigate } from 'react-router-dom';
import { Shield, Clock, MapPin, AlertTriangle, User } from 'lucide-react';
import { cn } from '@/lib/utils';

const tabs = [
  { key: 'home', label: 'Главная', icon: Shield, path: '/m/guard/home' },
  { key: 'shift', label: 'Смена', icon: Clock, path: '/m/guard/shift' },
  { key: 'patrol', label: 'Обход', icon: MapPin, path: '/m/guard/patrol' },
  { key: 'incidents', label: 'Инциденты', icon: AlertTriangle, path: '/m/guard/incidents' },
  { key: 'profile', label: 'Профиль', icon: User, path: '/m/guard/profile' },
] as const;

interface GuardMobileLayoutProps {
  children: React.ReactNode;
  title?: string;
}

export default function GuardMobileLayout({ children, title }: GuardMobileLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const activeTab = tabs.find((t) => location.pathname === t.path)?.key ?? 'home';

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur-md px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <span className="text-sm font-bold text-foreground">S-OMS</span>
          </div>
          {title && <p className="text-sm font-medium text-foreground">{title}</p>}
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-success animate-status-pulse" />
            <span className="text-[11px] text-muted-foreground">Online</span>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto p-4 pb-24">
        {children}
      </main>

      {/* Bottom navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-background/95 backdrop-blur-md safe-area-bottom">
        <div className="flex items-center justify-around py-1.5">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => navigate(tab.path)}
              className={cn(
                'flex flex-col items-center gap-0.5 px-2 py-1.5 transition-colors min-w-[56px]',
                activeTab === tab.key ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              <tab.icon className="h-5 w-5" />
              <span className="text-[10px] font-medium leading-tight">{tab.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
