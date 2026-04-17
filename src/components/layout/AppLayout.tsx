import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { auth } from '../../lib/firebase';
import { signOut } from 'firebase/auth';
import { Button } from '../ui/button';
import { 
  LayoutDashboard, 
  Store, 
  ShoppingCart, 
  Megaphone, 
  LogOut,
  Menu,
  X,
  Shield,
  Settings,
  User,
  Slice
} from 'lucide-react';
import { useState } from 'react';

export function AppLayout() {
  const { profile } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/login');
  };

  const navItems = profile?.role === 'ADMIN' ? [
    { name: 'Painel Admin', path: '/painel', icon: LayoutDashboard },
    { name: 'Meu Perfil', path: '/perfil', icon: User },
    { name: 'Perfis e Permissões', path: '/admin/usuarios', icon: Shield },
    { name: 'Catálogo Geral', path: '/catalogo', icon: Store },
    { name: 'Todas as Demandas', path: '/demandas', icon: Megaphone },
    { name: 'Todos os Pedidos', path: '/pedidos', icon: ShoppingCart },
    { name: 'Configurações', path: '/configuracoes', icon: Settings },
  ] : profile?.role === 'PRODUTOR' ? [
    { name: 'Dashboard', path: '/painel', icon: LayoutDashboard },
    { name: 'Meu Perfil', path: '/perfil', icon: User },
    { name: 'Publicar Queijo', path: '/catalogo', icon: Slice },
    { name: 'Pedidos Recebidos', path: '/pedidos', icon: ShoppingCart },
    { name: 'Painel de Demandas', path: '/demandas', icon: Megaphone },
    { name: 'Configurações', path: '/configuracoes', icon: Settings },
  ] : [
    { name: 'Dashboard', path: '/painel', icon: LayoutDashboard },
    { name: 'Meu Perfil', path: '/perfil', icon: User },
    { name: 'Catálogo de Queijos', path: '/catalogo', icon: Store },
    { name: 'Meus Pedidos', path: '/pedidos', icon: ShoppingCart },
    { name: 'Minhas Demandas', path: '/demandas', icon: Megaphone },
    { name: 'Configurações', path: '/configuracoes', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 bg-card border-b border-border shadow-sm z-50 sticky top-0">
        <div className="flex items-center gap-3 font-bold text-primary text-2xl whitespace-nowrap">
          <div className="w-14 h-14 flex items-center justify-center">
            <img src="https://i.ibb.co/jvsrNzd3/Banco-do-Queijo-sem-fundo.png" alt="Banco do Queijo" className="w-full h-full object-contain" />
          </div>
          Banco do Queijo
        </div>
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="text-white hover:text-primary transition-colors"
        >
          {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </div>

      {/* Sidebar */}
      <aside className={`
        ${isMobileMenuOpen ? 'flex absolute top-[85px] bottom-0 left-0 right-0' : 'hidden'} 
        md:flex md:sticky md:top-0 md:h-screen w-full md:w-[280px] bg-card border-r border-border shadow-sm flex-shrink-0 flex-col z-40
      `}>
        <div className="hidden md:flex p-6 items-center gap-3 font-bold text-primary text-2xl whitespace-nowrap">
          <div className="w-12 h-12 flex items-center justify-center">
            <img src="https://i.ibb.co/jvsrNzd3/Banco-do-Queijo-sem-fundo.png" alt="Banco do Queijo" className="w-full h-full object-contain" />
          </div>
          Banco do Queijo
        </div>

        <nav className="flex-1 overflow-y-auto px-4 py-4 space-y-1.5 scrollbar-thin">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                  isActive 
                    ? 'bg-primary text-primary-foreground font-semibold shadow-sm' 
                    : 'text-white/70 hover:bg-secondary hover:text-white'
                }`}
              >
                <Icon size={20} className={isActive ? "text-primary-foreground" : "opacity-70"} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border/50 mt-auto bg-card">
          <div className="mb-4 px-4">
            <p className="text-sm font-bold text-white truncate">{profile?.name}</p>
            <p className="text-xs text-muted-foreground truncate">{profile?.email}</p>
            <div className="mt-2 inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-primary/20 text-primary">
              {profile?.role}
            </div>
          </div>
          <button 
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-[25px] bg-[#4a2000]/50 hover:bg-[#4a2000] text-primary transition-all font-bold text-sm shadow-sm" 
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4" />
            Sair
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto p-4 md:p-8">
        <Outlet />
      </main>
    </div>
  );
}
