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
  Slice,
  MessageCircle,
  AlertCircle
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { Footer } from './Footer';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';

function ProfileCompletionPopup({ role, onClose, onComplete }: { role: string; onClose: () => void; onComplete: () => void }) {
  const isProducer = role === 'PRODUTOR';
  
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-[#4a2000] border-2 border-[#d36101] rounded-[24px] shadow-2xl max-w-md w-full overflow-hidden text-center p-8 animate-in zoom-in-95 duration-300">
        <div className="w-16 h-16 bg-app-accent/20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner border border-app-accent/30">
          <AlertCircle className="w-8 h-8 text-app-accent" />
        </div>
        
        <h2 className="text-2xl font-bold text-white mb-2">Complete seu Perfil</h2>
        
        <div className="text-white/80 space-y-4 mb-8 text-sm leading-relaxed">
          {isProducer ? (
            <p>
              Produtor, para que seus produtos sejam exibidos na vitrine e você possa receber propostas, precisamos de mais alguns dados sobre a sua queijaria e seus produtos.
            </p>
          ) : (
            <p>
              Atacadista, para garantir a segurança das negociações na plataforma, precisamos que você complete os dados do seu cadastro antes de realizar compras.
            </p>
          )}
          <p className="font-medium text-app-accent">
            Leva menos de 2 minutos!
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <Button 
            onClick={onComplete}
            className="w-full bg-app-accent hover:bg-app-accentHover text-app-bgDark font-bold rounded-full py-6 shadow-[0_0_15px_rgba(244,215,99,0.3)] transition-all active:scale-95"
          >
            Completar seu perfil agora
          </Button>
          <button 
            onClick={onClose}
            className="text-white/50 hover:text-white text-sm font-medium transition-colors py-2"
          >
            deixar para depois
          </button>
        </div>
      </div>
    </div>
  );
}

export function AppLayout() {
  const { profile, user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showCompletionPopup, setShowCompletionPopup] = useState(false);

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'chats'),
      where('participants', 'array-contains', user.uid)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      let count = 0;
      snapshot.forEach(doc => {
         const chat = doc.data();
         if (chat.unreadCount && chat.unreadCount[user.uid]) {
            count += chat.unreadCount[user.uid];
         }
      });
      setUnreadCount(count);
    });
    return () => unsubscribe();
  }, [user]);

  // Show profile completion popup if incomplete
  useEffect(() => {
    // Only check if profile is loaded and the user is NOT already on the profile page
    if (profile && location.pathname !== '/perfil' && profile.role !== 'ADMIN') {
      const isComplete = profile.kycStatus === 'VALIDADO';
      
      // Store that we've shown it this session so it doesn't pop up on every page navigation
      const hasSeenPopup = sessionStorage.getItem(`profile_popup_seen_${profile.id}`);
      
      if (!isComplete && !hasSeenPopup) {
        setShowCompletionPopup(true);
      }
    } else {
      setShowCompletionPopup(false);
    }
  }, [profile, location.pathname]);

  const handleClosePopup = () => {
    if (profile) {
      sessionStorage.setItem(`profile_popup_seen_${profile.id}`, 'true');
    }
    setShowCompletionPopup(false);
    navigate('/painel');
  };

  const handleCompleteNow = () => {
    if (profile) {
      sessionStorage.setItem(`profile_popup_seen_${profile.id}`, 'true');
    }
    setShowCompletionPopup(false);
    navigate('/perfil');
  };

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/login');
  };

  const navItems = profile?.role === 'ADMIN' ? [
    { name: 'Vitrine', path: '/vitrine', icon: Store },
    { name: 'Painel Admin', path: '/painel', icon: LayoutDashboard },
    { name: 'Meu Perfil', path: '/perfil', icon: User },
    { name: 'Mensagens', path: '/mensagens', icon: MessageCircle, badge: unreadCount },
    { name: 'Perfis e Permissões', path: '/admin/usuarios', icon: Shield },
    { name: 'Todos os Pedidos', path: '/compras', icon: ShoppingCart },
    { name: 'Configurações', path: '/configuracoes', icon: Settings },
  ] : profile?.role === 'PRODUTOR' ? [
    { name: 'Vitrine', path: '/vitrine', icon: Store },
    { name: 'Dashboard', path: '/painel', icon: LayoutDashboard },
    { name: 'Meu Perfil', path: '/perfil', icon: User },
    { name: 'Mensagens', path: '/mensagens', icon: MessageCircle, badge: unreadCount },
    { name: 'Pedidos Recebidos', path: '/compras', icon: ShoppingCart },
    { name: 'Configurações', path: '/configuracoes', icon: Settings },
  ] : [
    { name: 'Vitrine', path: '/vitrine', icon: Store },
    { name: 'Dashboard', path: '/painel', icon: LayoutDashboard },
    { name: 'Meu Perfil', path: '/perfil', icon: User },
    { name: 'Mensagens', path: '/mensagens', icon: MessageCircle, badge: unreadCount },
    { name: 'Minhas Compras', path: '/compras', icon: ShoppingCart },
    { name: 'Configurações', path: '/configuracoes', icon: Settings },
  ];

  return (
    <div className="h-[100dvh] bg-app-cardDark flex flex-col md:flex-row overflow-hidden">
      {showCompletionPopup && profile && (
        <ProfileCompletionPopup 
          role={profile.role} 
          onClose={handleClosePopup}
          onComplete={handleCompleteNow}
        />
      )}

      {/* Mobile Header */}
      <div className={`md:hidden shrink-0 items-center justify-between p-4 bg-[#d36101] border-b border-[#a64b00] shadow-2xl z-50 ${location.pathname.startsWith('/mensagens') ? 'hidden' : 'flex'}`}>
        <div className="flex items-center gap-3 font-bold text-app-accent text-2xl whitespace-nowrap">
          <div className="w-14 h-14 flex items-center justify-center">
            <img src="https://i.ibb.co/jvsrNzd3/Banco-do-Queijo-sem-fundo.png" alt="Banco do Queijo" className="w-full h-full object-contain" />
          </div>
          Banco do Queijo
        </div>
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="text-white hover:text-white/80 transition-colors"
        >
          {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </div>

      {/* Sidebar */}
      <aside className={`
        ${isMobileMenuOpen ? 'flex absolute top-[85px] bottom-0 left-0 right-0' : 'hidden'} 
        md:flex md:sticky md:top-0 md:h-screen w-full md:w-[280px] bg-[#d36101] shadow-2xl flex-shrink-0 flex-col z-40
      `}>
        <div className="hidden md:flex p-6 items-center gap-3 font-bold text-app-accent text-2xl whitespace-nowrap border-b border-[#a64b00]">
          <div className="w-12 h-12 flex items-center justify-center">
            <img src="https://i.ibb.co/jvsrNzd3/Banco-do-Queijo-sem-fundo.png" alt="Banco do Queijo" className="w-full h-full object-contain" />
          </div>
          Banco do Queijo
        </div>

        <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-2 scrollbar-thin">
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
                    ? 'bg-white text-[#d36101] font-bold shadow-lg' 
                    : 'text-white hover:bg-[#a64b00] hover:text-white'
                }`}
              >
                <Icon size={20} className={isActive ? "text-[#d36101]" : "opacity-80"} />
                <span className="flex-1">{item.name}</span>
                {item.badge ? (
                  <span className="bg-app-accent text-app-bgDark text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {item.badge}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-[#a64b00] mt-auto bg-[#d36101]">
          <div className="mb-4 px-4 bg-[#a64b00] rounded-[20px] p-4 shadow-inner border border-white/10">
            <p className="text-sm font-bold text-white truncate">{profile?.name}</p>
            <p className="text-xs text-white/80 truncate mt-0.5">{profile?.email}</p>
            <div className="mt-2 inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-white text-[#d36101] shadow-sm">
              {profile?.role}
            </div>
          </div>
          <button 
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[#a64b00] hover:bg-black/20 text-white transition-all font-bold text-sm" 
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4" />
            Sair da Conta
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 bg-[#2b1400] flex flex-col min-h-0 relative">
        <div className="flex-1 flex flex-col min-h-0 overflow-y-auto">
          <Outlet />
        </div>
        <div className={`shrink-0 ${location.pathname === '/mensagens' ? 'hidden md:block' : ''}`}>
          <Footer />
        </div>
      </main>
    </div>
  );
}
