import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Search, MapPin, ArrowRight, ShieldCheck, Star, ChevronDown } from 'lucide-react';
import { Footer } from '../components/layout/Footer';
import { collection, query, onSnapshot, where } from 'firebase/firestore';
import { db } from '../lib/firebase';

export const CATEGORIES = [
  { id: 'todos', title: 'Todos' },
  { id: 'coalho', title: 'Coalho' },
  { id: 'mussarela', title: 'Mussarela' },
  { id: 'parmesao', title: 'Parmesão' },
  { id: 'prato', title: 'Prato' },
  { id: 'gorgonzola', title: 'Gorgonzola' },
  { id: 'canastra', title: 'Canastra' },
  { id: 'minas', title: 'Minas Frescal/Padrão' },
  { id: 'colonial', title: 'Colonial' },
  { id: 'requeijao', title: 'Requeijão' }
];

export function CatalogPublic() {
  const [catalogType, setCatalogType] = useState<'produtores' | 'atacadistas'>('produtores');
  const [activeCategory, setActiveCategory] = useState<string>('todos');
  const [isRegionDropdownOpen, setIsRegionDropdownOpen] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const [usersInfo, setUsersInfo] = useState<Record<string, any>>({});
  const [producers, setProducers] = useState<any[]>([]);
  const [wholesalers, setWholesalers] = useState<any[]>([]);

  useEffect(() => {
    const unsubscribeUsers = onSnapshot(query(collection(db, 'users'), where('kycStatus', '==', 'VALIDADO')), (snapshot) => {
      const usersData: Record<string, any> = {};
      const wholesaleArr: any[] = [];
      const producerArr: any[] = [];
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        usersData[doc.id] = data;
        
        const isProfilePublic = data.isPublic !== false;
        
        if (isProfilePublic) {
          if (data.role === 'ATACADISTA') {
            wholesaleArr.push({ id: doc.id, ...data });
          } else if (data.role === 'PRODUTOR') {
            producerArr.push({ id: doc.id, ...data });
          }
        }
      });
      setUsersInfo(usersData);
      setWholesalers(wholesaleArr);
      setProducers(producerArr);
    });

    return () => unsubscribeUsers();
  }, []);

  const activeProducers = useMemo(() => {
    return producers.flatMap(owner => {
       return (owner.cheeseTypes || []).map((cheeseType: string) => {
         const specificCheeseImages = owner.cheeseImages?.[cheeseType] || [];
         const displayImages = specificCheeseImages.length > 0 
            ? specificCheeseImages 
            : (owner.images?.length ? owner.images : ['https://images.unsplash.com/photo-1473401171573-000c010c73ea?auto=format&fit=crop&q=80&w=600']);

         return {
           id: `${owner.id}-${cheeseType}`,
           nome: owner.name,
           produtor: owner.cpfCnpj,
           local: `${owner.city || ''}, ${owner.state || ''}`,
           avaliacao: owner.rating || 5.0,
           imagem: displayImages[0],
           categoria: cheeseType.toLowerCase().replace('ã', 'a')
         };
       });
    });
  }, [producers]);

  const activeWholesalers = useMemo(() => {
    return wholesalers.map(owner => {
        return {
           id: owner.id,
           empresa: owner.name,
           comprador: owner.cpfCnpj,
           local: `${owner.city || ''}, ${owner.state || ''}`,
           avaliacao: owner.rating || 5.0,
           imagem: owner.images?.length ? owner.images[0] : 'https://i.ibb.co/276Ft1JW/v2-8w8ff-wt3zb.jpg',
           categoria: `${owner.city || ''}, ${owner.state || ''}`.replace(/^,\s*|,\s*$/g, '').trim() || 'Desconhecida',
           foco: owner.buyerType || 'Não Informado'
        };
    });
  }, [wholesalers]);

  const wholesalerCategories = useMemo(() => {
    const locations = Array.from(new Set(activeWholesalers.map(w => w.categoria))).filter(c => c && c !== 'Desconhecida').sort();
    return [
      { id: 'todos', title: 'Todos' },
      ...locations.map(loc => ({ id: loc, title: loc }))
    ];
  }, [activeWholesalers]);

  const regions = [
    { value: '', label: 'Qualquer Região' },
    { value: 'mg', label: 'Minas Gerais' },
    { value: 'sp', label: 'São Paulo' },
    { value: 'ce', label: 'Ceará' },
  ];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsRegionDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="h-[100dvh] bg-app-bgDark w-full relative flex flex-col overflow-hidden">
      
      {/* Scrollable container for main content */}
      <div className="flex-1 overflow-y-auto flex flex-col pt-0 w-full relative">
        {/* Background elements */}
        <div className="absolute top-0 left-0 w-full h-[70vh] md:h-[90vh] z-0 overflow-hidden pointer-events-none bg-[#2b1400]">
          <video 
            src="https://video.wixstatic.com/video/6acedd_b8aa7ae2be2f4d0fb1c8dd81ac1e15bf/720p/mp4/file.mp4" 
            autoPlay 
            loop 
            muted 
            playsInline 
            className="absolute inset-0 w-full h-full object-cover object-right md:object-center opacity-70" 
          />
          <div className="absolute inset-0 bg-[#3e1c00]/40"></div>
          <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-app-bgDark via-app-bgDark/90 to-transparent"></div>
        </div>

        <header className="relative z-30 pt-6 pb-4 px-4 md:px-8 max-w-[95%] xl:max-w-[1400px] mx-auto w-full flex justify-between items-center bg-transparent">
          <Link to="/" className="flex items-center gap-3 md:gap-4 hover:opacity-90 transition-opacity">
            <div className="w-16 h-16 md:w-20 md:h-20 shrink-0 flex items-center justify-center">
              <img src="https://i.ibb.co/jvsrNzd3/Banco-do-Queijo-sem-fundo.png" alt="Banco do Queijo" className="w-full h-full object-contain" />
            </div>
            <div className="flex flex-col justify-center">
              <h1 className="text-2xl md:text-4xl font-bold text-app-accent tracking-tight leading-none">Banco do Queijo</h1>
            </div>
          </Link>
          <div className="flex">
            <Link to="/login" className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-app-cardDark/90 backdrop-blur-md shadow-lg flex items-center justify-center text-white hover:bg-[#5a2800] border border-[#5a2800] transition-all active:scale-95" title="Entrar">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-user"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            </Link>
          </div>
        </header>

        <main className="flex-1 w-full relative flex flex-col">
        
        {/* Título Hero Section */}
        <div className="px-4 sm:px-8 max-w-[95%] xl:max-w-[1400px] mx-auto mt-[4vh] md:mt-[15vh] mb-16 md:mb-24 animate-in fade-in slide-in-from-bottom-8 duration-700 relative z-30 text-left md:text-center flex flex-col items-start md:items-center">
          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-app-accent/20 border border-app-accent/30 text-app-accent text-[10px] font-bold uppercase tracking-widest mb-4 backdrop-blur-md shadow-lg cursor-default">
             <Star className="w-3 h-3 text-app-accent" /> Negociação Direta
          </span>
          <h2 className="text-4xl md:text-[3.5rem] leading-[1.1] font-bold text-white tracking-tight max-w-4xl drop-shadow-2xl">
            Mais Vendas para Quem Produz,<br className="hidden md:block"/><span className="text-transparent bg-clip-text bg-gradient-to-r from-app-accent to-yellow-200">Mais Lucro para Quem Vende.</span>
          </h2>
          <p className="text-white mt-5 mb-8 max-w-3xl text-lg md:text-xl font-medium drop-shadow-md">
            Conectamos Produtores Artesanais a Compradores Atacadistas. Elimine Intermediários, Reduza Custos e Garanta Sempre o Melhor Queijo, com o Melhor Preço, com Cotação em Tempo Real.
          </p>
          <Link to="/cadastro" className="inline-flex px-8 py-4 rounded-full bg-app-accent shadow-[0_0_20px_rgba(244,215,99,0.4)] items-center justify-center text-app-bgDark hover:bg-app-accentHover transition-all active:scale-95 glow-hover text-base md:text-lg font-bold whitespace-nowrap animate-float">
            Abra Sua Conta Grátis
          </Link>
        </div>

        {/* Nova Seção de Catálogo */}
        <div className={`${catalogType === 'produtores' ? 'bg-[#703200]' : 'bg-app-cardDark'} w-full relative z-30 pt-10 md:pt-16 pb-8 border-t border-white/10 flex-grow flex flex-col transition-colors duration-500`}>
          
          {/* Abas de Alternância */}
          <div className="max-w-[95%] xl:max-w-[1400px] mx-auto px-4 sm:px-8 mb-8 w-full flex justify-center animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="flex bg-black/20 p-1.5 rounded-full border border-white/10">
              <button
                onClick={() => { setCatalogType('produtores'); setActiveCategory('todos'); }}
                className={`px-6 py-2.5 rounded-full text-sm md:text-base font-bold transition-all duration-300 ${catalogType === 'produtores' ? 'bg-app-accent text-app-bgDark shadow-lg' : 'text-white/70 hover:text-white hover:bg-white/5'}`}
              >
                Produtores
              </button>
              <button
                onClick={() => { setCatalogType('atacadistas'); setActiveCategory('todos'); }}
                className={`px-6 py-2.5 rounded-full text-sm md:text-base font-bold transition-all duration-300 ${catalogType === 'atacadistas' ? 'bg-app-accent text-app-bgDark shadow-lg' : 'text-white/70 hover:text-white hover:bg-white/5'}`}
              >
                Atacadistas
              </button>
            </div>
          </div>

          {/* Título da Seção */}
          <div className="max-w-[95%] xl:max-w-[1400px] mx-auto px-4 sm:px-8 mb-8 w-full text-left animate-in fade-in slide-in-from-bottom-8 duration-700">
            <h2 className="text-3xl md:text-4xl font-bold text-app-accent mb-2 tracking-tight">
              {catalogType === 'produtores' ? 'Encontre os Melhores Produtores' : 'Encontre os Melhores Atacadistas'}
            </h2>
            <p className="text-white text-base md:text-lg font-medium">
              {catalogType === 'produtores' 
                ? 'Explore nosso catálogo e conecte-se diretamente com produtores artesanais de todo o Brasil.' 
                : 'Explore nosso catálogo e conecte-se com os maiores distribuidores e atacadistas de queijo do Brasil.'}
            </p>
          </div>
          
          {/* Categorias (Pílulas) */}
          <div className="max-w-[95%] xl:max-w-[1400px] mx-auto mb-8 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100 relative z-30 px-4 sm:px-8 w-full">
          <div className="flex flex-wrap pb-2 gap-2 md:gap-3">
            {(catalogType === 'produtores' ? CATEGORIES : wholesalerCategories).map(cat => (
              <button 
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`shrink-0 px-4 py-1.5 md:py-2 rounded-full text-sm font-bold outline-none flex items-center gap-2 glow-hover transition-colors ${activeCategory === cat.id ? 'bg-app-accent text-app-bgDark glow-active' : `${catalogType === 'produtores' ? 'bg-app-cardDark' : 'bg-[#703200]'} text-white border border-[#d36101]/50`}`}
              >
                {cat.title}
              </button>
            ))}
          </div>
        </div>

        {/* Filtros com Efeito Circular Luminoso */}
        <div className="max-w-[95%] xl:max-w-[1400px] mx-auto mb-10 px-4 sm:px-8 w-full animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200 relative z-40">
          <div className="flex flex-col md:flex-row gap-4 justify-start w-full">
            
            {/* Busca */}
            <div className="relative flex-1 shrink-0 group">
              <div className={`absolute inset-0 rounded-full border-2 border-[#f4d763] ${catalogType === 'produtores' ? 'bg-app-cardDark' : 'bg-[#703200]'} shadow-[0_0_20px_rgba(244,215,99,0.3)] pointer-events-none transition-colors duration-500`}></div>
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-white/70 z-10 w-5 h-5 pointer-events-none" />
              <input type="text" placeholder="Buscar por tipo, produtor ou cidade..." className="relative z-10 w-full min-w-0 pl-14 pr-5 py-2.5 bg-transparent border-none rounded-full text-sm md:text-base font-bold text-white outline-none placeholder-white/50" />
            </div>

            {/* Local Custom Dropdown */}
            <div className="relative w-full md:w-[30%] shrink-0" ref={dropdownRef}>
              <div className={`absolute inset-0 rounded-full border-2 border-[#f4d763] ${catalogType === 'produtores' ? 'bg-app-cardDark' : 'bg-[#703200]'} shadow-[0_0_20px_rgba(244,215,99,0.3)] pointer-events-none transition-colors duration-500`}></div>
              <MapPin className="absolute left-5 top-1/2 -translate-y-1/2 text-white/70 z-10 w-5 h-5 pointer-events-none" />
              
              <div 
                className="relative z-10 w-full min-w-0 pl-14 pr-5 py-2.5 bg-transparent border-none rounded-full text-sm md:text-base font-bold text-white outline-none cursor-pointer flex items-center justify-between h-full"
                onClick={() => setIsRegionDropdownOpen(!isRegionDropdownOpen)}
              >
                <span>{regions.find(r => r.value === selectedRegion)?.label || 'Qualquer Região'}</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${isRegionDropdownOpen ? 'rotate-180' : ''}`} />
              </div>

              {isRegionDropdownOpen && (
                <div className={`absolute top-[calc(100%+8px)] left-0 w-full ${catalogType === 'produtores' ? 'bg-app-cardDark' : 'bg-[#703200]'} border-2 border-[#f4d763] rounded-[10px] shadow-2xl z-50 flex flex-col transition-colors duration-500 overflow-y-auto max-h-60 overflow-x-hidden`}>
                  {regions.map((region, idx) => (
                    <div 
                      key={region.value}
                      className={`px-5 py-3 text-sm md:text-base font-bold cursor-pointer transition-colors ${selectedRegion === region.value ? 'bg-[#d36101] text-white' : 'text-white hover:bg-[#d36101]'} ${idx !== regions.length - 1 ? 'border-b border-[#a64b00]' : ''}`}
                      onClick={() => {
                        setSelectedRegion(region.value);
                        setIsRegionDropdownOpen(false);
                      }}
                    >
                      {region.label}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Linha Divisória Pontilhada */}
        <div className="max-w-[95%] xl:max-w-[1400px] mx-auto px-4 sm:px-8 mb-10 w-full">
          <div className="w-full border-t-[3px] border-dotted border-[#f4d763]/40"></div>
        </div>

        {/* Container de Produtos */}
        <div className="w-full pb-16 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300">
          {(catalogType === 'produtores' ? CATEGORIES : wholesalerCategories).filter(cat => cat.id !== 'todos' && (activeCategory === 'todos' || activeCategory === cat.id)).map((cat, index) => {
            const currentCatalog = catalogType === 'produtores' ? activeProducers : activeWholesalers;
            const categoryProducts = currentCatalog.filter(p => p.categoria === cat.id);
            if (categoryProducts.length === 0) return null;

            return (
              <React.Fragment key={cat.id}>
                {index > 0 && (
                  <div className="max-w-[95%] xl:max-w-[1400px] mx-auto px-4 sm:px-8 mb-10 w-full">
                    <div className="w-full border-t-[3px] border-dotted border-[#f4d763]/40"></div>
                  </div>
                )}
                <div className="mb-12 w-full">
                  <div className="flex items-center justify-between mb-6 px-4 sm:px-8 max-w-[95%] xl:max-w-[1400px] mx-auto">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-app-cardDark flex justify-center items-center text-app-accent shadow-sm border border-[#d36101]/50">
                            <ShieldCheck className="w-5 h-5" />
                        </div>
                        <h3 className="text-2xl font-bold text-white tracking-tight">{cat.title}</h3>
                    </div>
                    <div className="flex md:hidden items-center gap-1 text-app-accent/70 text-[10px] font-bold uppercase tracking-wider">
                        <span>Deslize</span>
                        <ArrowRight className="w-3 h-3" />
                    </div>
                </div>
                
                <div className="w-full relative group/carousel">
                  <div className="flex md:grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 overflow-x-auto md:overflow-visible gap-6 pb-6 px-4 sm:px-8 max-w-[95%] xl:max-w-[1400px] mx-auto no-scrollbar snap-x md:snap-none relative z-20">
                    
                    {categoryProducts.map((product: any) => (
                      <div key={product.id} className={`w-[85vw] sm:w-[320px] md:w-auto shrink-0 md:shrink flex-col snap-start md:snap-align-none ${catalogType === 'produtores' ? 'bg-app-cardDark' : 'bg-[#703200]'} rounded-[2rem] shadow-lg border-2 border-[#d36101] overflow-hidden flex group relative cursor-pointer glow-hover transition-colors duration-500`}>
                        <div className="relative h-48 sm:h-52 w-full overflow-hidden shrink-0">
                            <img src={product.imagem} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt={product.nome} />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent"></div>
                            
                            <div className={`absolute top-4 left-4 ${catalogType === 'produtores' ? 'bg-app-cardDark/90' : 'bg-[#703200]/90'} backdrop-blur-md border border-[#d36101]/50 rounded-2xl px-3 py-2 flex flex-col items-center justify-center shadow-lg transition-colors duration-500`}>
                                <span className="text-sm font-bold text-white leading-none flex items-center gap-1"><Star className="w-3 h-3 text-app-accent fill-app-accent" /> {product.avaliacao}</span>
                            </div>
                            
                            <div className="absolute bottom-4 right-4 flex flex-col gap-2 items-end">
                                <span className="bg-app-accent/90 backdrop-blur-md text-app-bgDark px-3 py-1.5 rounded-xl text-[11px] font-bold shadow-lg shadow-app-accent/30">
                                  {catalogType === 'produtores' ? `R$ ${product.preco?.toFixed(2)}/kg` : `${product.quantidade} kg / semana`}
                                </span>
                            </div>
                        </div>
                        
                        <div className="p-6 flex flex-col flex-grow">
                            <p className="text-[10px] text-app-accent font-bold mb-1.5 uppercase tracking-widest truncate">
                                {catalogType === 'produtores' ? product.produtor : product.comprador}
                            </p>
                            <h3 className="text-xl font-bold text-white leading-tight mb-4 line-clamp-2">
                                {catalogType === 'produtores' ? product.nome : product.empresa}
                            </h3>
                            
                            <div className="flex items-center justify-between mt-auto pt-4 border-t border-[#d36101]">
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="w-10 h-10 rounded-full bg-[#703200] flex items-center justify-center text-app-accent shrink-0">
                                      <MapPin className="w-4 h-4" />
                                    </div>
                                    <div className="flex flex-col min-w-0">
                                        <span className="text-[10px] font-bold text-[#d36101] uppercase tracking-widest">Origem</span>
                                        <span className="text-xs font-bold text-white truncate max-w-[120px] md:max-w-[150px]">{product.local}</span>
                                    </div>
                                </div>
                                <button
                                    onClick={() => {
                                        window.location.href = '/login';
                                    }}
                                    className="h-10 px-4 rounded-full bg-app-accent hover:bg-app-accentHover text-app-bgDark flex items-center justify-center shadow-lg shadow-app-accent/30 transition-transform active:scale-95 shrink-0 font-bold text-sm whitespace-nowrap"
                                >
                                     Entrar para Falar
                                </button>
                            </div>
                        </div>
                      </div>
                    ))}

                  </div>
                </div>
                </div>
              </React.Fragment>
            );
          })}
          </div>
        </div>
      </main>
      </div>
      
      <div className="shrink-0 relative z-50">
        <Footer />
      </div>
    </div>
  );
}
