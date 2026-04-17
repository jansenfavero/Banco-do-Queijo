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
  Shield
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
    { name: 'Painel Admin', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Perfis e Permissões', path: '/admin/users', icon: Shield },
    { name: 'Catálogo Geral', path: '/catalog', icon: Store },
    { name: 'Todas as Demandas', path: '/demands', icon: Megaphone },
    { name: 'Todos os Pedidos', path: '/orders', icon: ShoppingCart },
  ] : profile?.role === 'PRODUTOR' ? [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Meus Produtos', path: '/catalog', icon: Store },
    { name: 'Pedidos Recebidos', path: '/orders', icon: ShoppingCart },
    { name: 'Painel de Demandas', path: '/demands', icon: Megaphone },
  ] : [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Catálogo de Queijos', path: '/catalog', icon: Store },
    { name: 'Meus Pedidos', path: '/orders', icon: ShoppingCart },
    { name: 'Minhas Demandas', path: '/demands', icon: Megaphone },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 bg-white border-b border-border shadow-sm">
        <div className="flex items-center gap-3 font-bold text-primary text-3xl">
          <div className="w-14 h-14 flex items-center justify-center">
            <img src="https://i.ibb.co/jvsrNzd3/Banco-do-Queijo-sem-fundo.png" alt="Banco do Queijo" className="w-full h-full object-contain" />
          </div>
          Banco do Queijo
        </div>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
          {isMobileMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Sidebar */}
      <aside className={`
        ${isMobileMenuOpen ? 'block' : 'hidden'} 
        md:block w-full md:w-64 bg-white border-r border-border shadow-sm flex-shrink-0 flex flex-col z-10
      `}>
        <div className="hidden md:flex p-6 items-center gap-2 font-bold text-primary text-2xl">
          <div className="w-12 h-12 flex items-center justify-center">
            <img src="https://i.ibb.co/jvsrNzd3/Banco-do-Queijo-sem-fundo.png" alt="Banco do Queijo" className="w-full h-full object-contain" />
          </div>
          Banco do Queijo
        </div>

        <nav className="flex-1 px-4 py-4 space-y-1.5">
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
                    : 'text-muted-foreground hover:bg-secondary hover:text-secondary-foreground'
                }`}
              >
                <Icon size={20} className={isActive ? "text-primary-foreground" : "opacity-70"} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t">
          <div className="mb-4 px-4">
            <p className="text-sm font-medium truncate">{profile?.name}</p>
            <p className="text-xs text-muted-foreground truncate">{profile?.email}</p>
            <div className="mt-1 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-secondary/20 text-secondary-foreground">
              {profile?.role}
            </div>
          </div>
          <Button variant="outline" className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Sair
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto p-4 md:p-8">
        <Outlet />
      </main>
    </div>
  );
}
