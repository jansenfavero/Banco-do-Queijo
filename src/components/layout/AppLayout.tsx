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
    { name: 'Vitrine', path: '/vitrine', icon: Store },
    { name: 'Todas as Demandas', path: '/demandas', icon: Megaphone },
    { name: 'Todos os Pedidos', path: '/pedidos', icon: ShoppingCart },
    { name: 'Configurações', path: '/configuracoes', icon: Settings },
  ] : profile?.role === 'PRODUTOR' ? [
    { name: 'Dashboard', path: '/painel', icon: LayoutDashboard },
    { name: 'Meu Perfil', path: '/perfil', icon: User },
    { name: 'Vitrine', path: '/vitrine', icon: Store },
    { name: 'Pedidos Recebidos', path: '/pedidos', icon: ShoppingCart },
    { name: 'Painel de Demandas', path: '/demandas', icon: Megaphone },
    { name: 'Configurações', path: '/configuracoes', icon: Settings },
  ] : [
    { name: 'Dashboard', path: '/painel', icon: LayoutDashboard },
    { name: 'Meu Perfil', path: '/perfil', icon: User },
    { name: 'Vitrine', path: '/vitrine', icon: Store },
    { name: 'Meus Pedidos', path: '/pedidos', icon: ShoppingCart },
    { name: 'Minhas Demandas', path: '/demandas', icon: Megaphone },
    { name: 'Configurações', path: '/configuracoes', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-app-cardDark flex flex-col md:flex-row">
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 bg-app-cardDark border-b border-[#4a2000] shadow-2xl z-50 sticky top-0">
        <div className="flex items-center gap-3 font-bold text-app-accent text-2xl whitespace-nowrap">
          <div className="w-14 h-14 flex items-center justify-center">
            <img src="https://i.ibb.co/jvsrNzd3/Banco-do-Queijo-sem-fundo.png" alt="Banco do Queijo" className="w-full h-full object-contain" />
          </div>
          Banco do Queijo
        </div>
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="text-white hover:text-app-accent transition-colors"
        >
          {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </div>

      {/* Sidebar */}
      <aside className={`
        ${isMobileMenuOpen ? 'flex absolute top-[85px] bottom-0 left-0 right-0' : 'hidden'} 
        md:flex md:sticky md:top-0 md:h-screen w-full md:w-[280px] bg-app-cardDark border-r border-[#4a2000] shadow-2xl flex-shrink-0 flex-col z-40
      `}>
        <div className="hidden md:flex p-6 items-center gap-3 font-bold text-app-accent text-2xl whitespace-nowrap">
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
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${
                  isActive 
                    ? 'bg-app-accent text-app-bgDark font-bold shadow-lg' 
                    : 'text-white/70 hover:bg-[#703200] hover:text-white'
                }`}
              >
                <Icon size={20} className={isActive ? "text-app-bgDark" : "opacity-70 mb-0.5"} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-[#4a2000] mt-auto bg-app-cardDark">
          <div className="mb-4 px-4 bg-[#4a2000] rounded-[20px] p-4 border border-white/5">
            <p className="text-sm font-bold text-white truncate">{profile?.name}</p>
            <p className="text-xs text-white/50 truncate mt-0.5">{profile?.email}</p>
            <div className="mt-2 inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-app-accent text-app-bgDark shadow-sm">
              {profile?.role}
            </div>
          </div>
          <button 
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[#4a2000] hover:bg-red-500/20 hover:text-red-400 text-white transition-all font-bold text-sm border border-white/5" 
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4" />
            Sair da Conta
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto bg-app-cardDark">
        <Outlet />
      </main>
    </div>
  );
}
