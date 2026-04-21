import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, where, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../hooks/useAuth';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { toast } from 'sonner';
import { Store, Slice, Info, ArrowRight, Star, MapPin, ChevronLeft, ChevronRight, Maximize2, X, Gavel } from 'lucide-react';

const CHEESE_TYPES = ['Coalho', 'Mussarela', 'Prato', 'Provolone', 'Parmesão', 'Colonial', 'Requeijão'];

import { MOCK_PRODUCTS, MOCK_WHOLESALERS } from './CatalogPublic';
import { Link } from 'react-router-dom';

import { CatalogMetrics } from './CatalogMetrics';

function CardImageCarousel({ images, alt, onImageClick }: { images: string[], alt: string, onImageClick: (images: string[], index: number) => void }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const prev = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentIndex(c => c === 0 ? images.length - 1 : c - 1);
  };

  const next = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentIndex(c => c === images.length - 1 ? 0 : c + 1);
  };

  return (
    <div className="w-full h-full relative group/carousel h-full overflow-hidden">
      <img 
        src={images[currentIndex]} 
        alt={alt} 
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 cursor-pointer" 
        loading="lazy" 
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); onImageClick(images, currentIndex); }}
      />
      
      {images.length > 1 && (
        <>
          <button 
            type="button"
            onClick={prev}
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white p-1.5 rounded-full opacity-0 group-hover/carousel:opacity-100 transition-opacity hover:bg-black/80 z-20"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button 
            type="button"
            onClick={next}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white p-1.5 rounded-full opacity-0 group-hover/carousel:opacity-100 transition-opacity hover:bg-black/80 z-20"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5 z-20">
            {images.map((_, i) => (
              <div key={i} className={`w-1.5 h-1.5 rounded-full shadow-sm ${i === currentIndex ? 'bg-app-accent' : 'bg-white/60'}`} />
            ))}
          </div>
        </>
      )}

      <button
        type="button"
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); onImageClick(images, currentIndex); }}
        className="absolute top-3 left-3 bg-black/50 backdrop-blur-sm text-white p-2 rounded-md opacity-0 group-hover/carousel:opacity-100 transition-all hover:bg-black/80 hover:text-app-accent z-20"
        title="Expandir Imagem"
      >
        <Maximize2 className="w-4 h-4" />
      </button>
    </div>
  );
}

export function Catalog() {
  const { profile } = useAuth();
  const [products, setProducts] = useState<any[]>([]);
  const [wholesalers, setWholesalers] = useState<any[]>([]);
  const [usersInfo, setUsersInfo] = useState<Record<string, any>>({});
  
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [loadingUsers, setLoadingUsers] = useState(true);
  
  const [activeTab, setActiveTab] = useState<'produtores' | 'atacadistas'>('produtores');

  const [lightboxImages, setLightboxImages] = useState<string[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState<number>(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  const openLightbox = (images: string[], index: number = 0) => {
    setLightboxImages(images);
    setLightboxIndex(index);
    setIsLightboxOpen(true);
  };
  
  // Custom Searchable Dropdown for Location
  const [isLocationDropdownOpen, setIsLocationDropdownOpen] = useState(false);
  
  // States for Smart Filtering
  const [textSearch, setTextSearch] = useState('');
  const [locationSearch, setLocationSearch] = useState('');
  const [cheeseTypeSearch, setCheeseTypeSearch] = useState('todos');
  const [packagingSearch, setPackagingSearch] = useState('todos');
  const [freightSearch, setFreightSearch] = useState('todos');
  
  const locationDropdownRef = React.useRef<HTMLDivElement>(null);

  const uniqueLocations = React.useMemo(() => {
    return Array.from(new Set([
      ...MOCK_PRODUCTS.map(p => p.local),
      ...MOCK_WHOLESALERS.map(w => w.local),
      ...Object.values(usersInfo).map((u: any) => `${u.city || ''}, ${u.state || ''}`.replace(/^,\s*|,\s*$/g, '').trim()).filter(Boolean)
    ])).sort((a, b) => a.localeCompare(b));
  }, [usersInfo]);

  const filteredLocations = React.useMemo(() => {
    const normalizeStr = (str: string) => (str || '').normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    const searchNormalized = normalizeStr(locationSearch);
    return uniqueLocations.filter(loc => normalizeStr(loc).includes(searchNormalized));
  }, [uniqueLocations, locationSearch]);

  const loading = loadingProducts || loadingUsers;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (locationDropdownRef.current && !locationDropdownRef.current.contains(event.target as Node)) {
        setIsLocationDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (profile) {
      if (profile.role === 'PRODUTOR') {
        setActiveTab('atacadistas');
      } else if (profile.role === 'ATACADISTA') {
        setActiveTab('produtores');
      }
    }
  }, [profile]);

  useEffect(() => {
    const unsubscribeUsers = onSnapshot(query(collection(db, 'users'), where('kycStatus', '==', 'VALIDADO')), (snapshot) => {
      const usersData: Record<string, any> = {};
      const wholesaleArr: any[] = [];
      const producerArr: any[] = [];
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        usersData[doc.id] = data;
        
        const isProfilePublic = data.isPublic !== false;
        const canSee = isProfilePublic || profile?.role === 'ADMIN' || profile?.id === doc.id;
        
        if (canSee) {
          if (data.role === 'ATACADISTA') {
            wholesaleArr.push({ id: doc.id, ...data });
          } else if (data.role === 'PRODUTOR') {
            producerArr.push({ id: doc.id, ...data });
          }
        }
      });
      setUsersInfo(usersData);
      setWholesalers(wholesaleArr);
      setProducts(producerArr); // using setProducts to hold producers to minimize massive refactoring needed for `products` state name
      setLoadingUsers(false);
      setLoadingProducts(false); // We skip fetching actual products
    }, (error) => {
      console.error("Error fetching users:", error);
      setLoadingUsers(false);
      setLoadingProducts(false);
    });

    return () => {
      unsubscribeUsers();
    };
  }, [profile]);

  // SMARTER COMBINED FILTER LOGIC
  const { filteredProducts, filteredWholesalers } = React.useMemo(() => {
    // Normalize string handling (remove accents and make lowercase)
    const normalizeStr = (str: string) => (str || '').normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    const filterText = normalizeStr(textSearch).trim();
    const filterLoc = normalizeStr(locationSearch).trim();
    
    const containsStr = (src: string, target: string) => normalizeStr(src).includes(target);
    const exactStr = (src: string, target: string) => normalizeStr(src) === target;

    // Filter Producers and Unroll into separate cards per cheese (Stored in products state)
    const activeProducers = products.flatMap(owner => {
       return (owner.cheeseTypes || []).map((cheeseType: string) => {
         
         // Priority: specific cheese image -> any specific cheese images -> general images -> fallback
         const specificCheeseImages = owner.cheeseImages?.[cheeseType] || [];
         const displayImages = specificCheeseImages.length > 0 
            ? specificCheeseImages 
            : (owner.images?.length ? owner.images : ['https://images.unsplash.com/photo-1473401171573-000c010c73ea?auto=format&fit=crop&q=80&w=600']);

         return {
           ...owner,
           _isRealProdCard: true,
           _displayCheese: cheeseType,
           _displayPrice: owner.cheesePrices?.[cheeseType] || 0,
           _displayImages: displayImages,
           _uniqueId: `${owner.id}-${cheeseType}`
         };
       });
    }).filter(item => {
      const locStr = `${item.city || ''}, ${item.state || ''}`;
      let pass = true;
      if (filterText && !containsStr(item.name, filterText)) pass = false;
      if (filterLoc && !containsStr(locStr, filterLoc)) pass = false;
      if (cheeseTypeSearch !== 'todos' && !exactStr(item._displayCheese, normalizeStr(cheeseTypeSearch))) pass = false;
      
      if (packagingSearch === 'com' && !exactStr(item.packaging, 'Com Rótulo') && !exactStr(item.packaging, 'Ambos') && !exactStr(item.packaging, 'Com Rotulo')) pass = false;
      if (packagingSearch === 'sem' && !exactStr(item.packaging, 'Sem Rótulo') && !exactStr(item.packaging, 'Ambos') && !exactStr(item.packaging, 'Sem Rotulo')) pass = false;
      if (packagingSearch === 'ambos' && !exactStr(item.packaging, 'Ambos')) pass = false;

      if (freightSearch === 'gratis' && item.chargesFreight) pass = false;
      if (freightSearch === 'pago' && !item.chargesFreight) pass = false;
      
      return pass;
    });

    // Filter MOCK Products
    const mockProds = MOCK_PRODUCTS.filter(p => {
      let pass = true;
      if (filterText && !containsStr(p.nome, filterText) && !containsStr(p.produtor, filterText)) pass = false;
      if (filterLoc && !containsStr(p.local, filterLoc)) pass = false;
      if (cheeseTypeSearch !== 'todos' && !exactStr(p.categoria, normalizeStr(cheeseTypeSearch))) pass = false;
      // Mocks have no packaging or freight properties, assume they match or skip filtering
      return pass;
    });
    
    // Filter Wholesalers (Real)
    const activeWholesalers = wholesalers.filter(w => {
      const locStr = `${w.city || ''}, ${w.state || ''}`;
      
      let pass = true;
      if (filterText && !containsStr(w.name, filterText)) pass = false;
      if (filterLoc && !containsStr(locStr, filterLoc)) pass = false;
      if (cheeseTypeSearch !== 'todos' && !(w.cheeseTypes || []).some((t: string) => exactStr(t, normalizeStr(cheeseTypeSearch)))) pass = false;
      
      if (packagingSearch === 'com' && !exactStr(w.packaging, 'Com Rótulo') && !exactStr(w.packaging, 'Ambos') && !exactStr(w.packaging, 'Com Rotulo')) pass = false;
      if (packagingSearch === 'sem' && !exactStr(w.packaging, 'Sem Rótulo') && !exactStr(w.packaging, 'Ambos') && !exactStr(w.packaging, 'Sem Rotulo')) pass = false;
      if (packagingSearch === 'ambos' && !exactStr(w.packaging, 'Ambos')) pass = false;

      if (freightSearch === 'gratis' && w.chargesFreight) pass = false;
      if (freightSearch === 'pago' && !w.chargesFreight) pass = false;

      return pass;
    });

    // Filter MOCK Wholesalers
    const mockWholesalersFiltered = MOCK_WHOLESALERS.filter(w => {
      let pass = true;
      if (filterText && !containsStr(w.empresa, filterText) && !containsStr(w.comprador, filterText)) pass = false;
      if (filterLoc && !containsStr(w.local, filterLoc)) pass = false;
      // Mocks lack detailed data
      return pass;
    });

    return { 
      filteredProducts: [...activeProducers, ...mockProds], 
      filteredWholesalers: [...activeWholesalers, ...mockWholesalersFiltered] 
    };
  }, [products, wholesalers, usersInfo, textSearch, locationSearch, cheeseTypeSearch, packagingSearch, freightSearch]);

  return (
    <div className="space-y-8 p-6 md:p-10 max-w-7xl mx-auto">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-app-cardDark rounded-2xl border border-app-accent/20 shadow-sm shrink-0">
            <Store className="h-8 w-8 text-app-accent" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white mb-1">
              Vitrine
            </h1>
            <p className="text-white/70 text-sm md:text-base">
              Explore o catálogo geral de queijos da plataforma.
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="bg-[#d36101]/20 border border-[#d36101]/50 rounded-2xl p-4 max-w-sm shrink-0 animate-pulse-slow shadow-[0_0_15px_rgba(211,97,1,0.15)] flex items-start gap-3 mt-4 md:mt-0">
            <Info className="w-5 h-5 text-app-accent shrink-0 mt-0.5" />
            <p className="text-xs text-white/80 leading-relaxed font-medium">
              <strong className="text-app-accent">Os dados atuais da vitrine são para efeito de demonstração</strong>, os dados reais de Produtores e Atacadistas estarão disponíveis em breve para negociação.
            </p>
          </div>
        </div>
      </div>

      {(!profile || profile.role === 'ADMIN') && (
        <div className="flex bg-app-cardDark p-1.5 rounded-[24px] border border-[#4a2000] w-fit shadow-lg">
          <button
            onClick={() => setActiveTab('produtores')}
            className={`px-6 py-2.5 rounded-xl text-sm md:text-base font-bold transition-all duration-300 ${activeTab === 'produtores' ? 'bg-app-accent text-app-bgDark shadow-sm' : 'text-white/50 hover:text-white hover:bg-[#4a2000]/50'}`}
          >
            Produtores
          </button>
          <button
            onClick={() => setActiveTab('atacadistas')}
            className={`px-6 py-2.5 rounded-xl text-sm md:text-base font-bold transition-all duration-300 ${activeTab === 'atacadistas' ? 'bg-app-accent text-app-bgDark shadow-sm' : 'text-white/50 hover:text-white hover:bg-[#4a2000]/50'}`}
          >
            Atacadistas
          </button>
        </div>
      )}

      {/* Filtros */}
      <div className="bg-[#703200] p-5 rounded-[24px] border-2 border-[#d36101] shadow-lg grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-x-5 gap-y-5 items-end">
        <div className="flex flex-col gap-1.5 w-full">
          <Label className="text-white/80 font-medium text-sm ml-1">
            Nome/Empresa
          </Label>
          <Input 
            placeholder="Digite o nome..." 
            value={textSearch}
            onChange={(e) => setTextSearch(e.target.value)}
            className="w-full bg-black/20 border-white/10 text-white placeholder:text-white/40 focus:ring-app-accent focus:border-app-accent rounded-[10px] h-11 px-4 transition-all"
          />
        </div>

        <div className="flex flex-col gap-1.5 relative w-full" ref={locationDropdownRef}>
          <Label className="text-white/80 font-medium text-sm ml-1">Localização</Label>
          <div className="relative w-full">
            <Input 
              placeholder="Cidade ou Estado"
              value={locationSearch}
              onChange={(e) => {
                setLocationSearch(e.target.value);
                setIsLocationDropdownOpen(true);
              }}
              onFocus={() => setIsLocationDropdownOpen(true)}
              className="w-full bg-black/20 border-white/10 text-white placeholder:text-white/40 focus:ring-app-accent focus:border-app-accent rounded-[10px] h-11 px-4 transition-all pr-10"
            />
            {isLocationDropdownOpen && (
              <div className="absolute top-[calc(100%+4px)] left-0 w-full bg-[#b85200] border border-[#d36101] rounded-[10px] shadow-2xl z-50 max-h-60 overflow-y-auto overflow-x-hidden flex flex-col">
                <div 
                  className="px-4 py-2.5 text-sm font-medium text-white hover:bg-[#d36101] cursor-pointer transition-colors border-b border-[#a64b00]"
                  onClick={() => {
                     setLocationSearch('');
                     setIsLocationDropdownOpen(false);
                  }}
                >
                  Qualquer Região
                </div>
                {filteredLocations.map((loc, idx) => (
                  <div 
                    key={loc}
                    className={`px-4 py-2.5 text-sm font-medium text-white hover:bg-[#d36101] cursor-pointer transition-colors ${idx !== filteredLocations.length - 1 ? 'border-b border-[#a64b00]' : ''}`}
                    onClick={() => {
                      setLocationSearch(loc);
                      setIsLocationDropdownOpen(false);
                    }}
                  >
                    {loc}
                  </div>
                ))}
                {filteredLocations.length === 0 && (
                  <div className="px-4 py-3 text-sm text-white/50 italic text-center">Nenhuma cidade encontrada</div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-1.5 w-full">
          <Label className="text-white/80 font-medium text-sm ml-1">Tipo de Queijo</Label>
          <Select value={cheeseTypeSearch} onValueChange={setCheeseTypeSearch}>
            <SelectTrigger className="w-full bg-black/20 border-white/10 text-white rounded-[10px] !h-11 px-4 transition-all focus:ring-app-accent focus:border-app-accent">
              <SelectValue placeholder="Qualquer" />
            </SelectTrigger>
            <SelectContent className="bg-[#b85200] border-[#d36101] text-white rounded-[10px] shadow-xl p-0 overflow-hidden outline-none ring-0">
              <div className="flex flex-col">
                <SelectItem value="todos" className="px-4 py-2.5 focus:bg-[#d36101] hover:bg-[#d36101] data-[highlighted]:bg-[#d36101] data-[highlighted]:text-white cursor-pointer rounded-none border-b border-[#a64b00]">Qualquer</SelectItem>
                {CHEESE_TYPES.map((type, idx) => (
                  <SelectItem key={type} value={type} className={`px-4 py-2.5 focus:bg-[#d36101] hover:bg-[#d36101] data-[highlighted]:bg-[#d36101] data-[highlighted]:text-white cursor-pointer rounded-none ${idx !== CHEESE_TYPES.length - 1 ? 'border-b border-[#a64b00]' : ''}`}>{type}</SelectItem>
                ))}
              </div>
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5 w-full">
          <Label className="text-white/80 font-medium text-sm ml-1">Embalagem</Label>
          <Select value={packagingSearch} onValueChange={setPackagingSearch}>
            <SelectTrigger className="w-full bg-black/20 border-white/10 text-white rounded-[10px] !h-11 px-4 transition-all focus:ring-app-accent focus:border-app-accent">
              <SelectValue placeholder="Qualquer" />
            </SelectTrigger>
            <SelectContent className="bg-[#b85200] border-[#d36101] text-white rounded-[10px] shadow-xl p-0 overflow-hidden outline-none ring-0">
              <div className="flex flex-col">
                <SelectItem value="todos" className="px-4 py-2.5 focus:bg-[#d36101] hover:bg-[#d36101] data-[highlighted]:bg-[#d36101] data-[highlighted]:text-white cursor-pointer rounded-none border-b border-[#a64b00]">Qualquer</SelectItem>
                <SelectItem value="com" className="px-4 py-2.5 focus:bg-[#d36101] hover:bg-[#d36101] data-[highlighted]:bg-[#d36101] data-[highlighted]:text-white cursor-pointer rounded-none border-b border-[#a64b00]">Com Rótulo</SelectItem>
                <SelectItem value="sem" className="px-4 py-2.5 focus:bg-[#d36101] hover:bg-[#d36101] data-[highlighted]:bg-[#d36101] data-[highlighted]:text-white cursor-pointer rounded-none border-b border-[#a64b00]">Sem Rótulo</SelectItem>
                <SelectItem value="ambos" className="px-4 py-2.5 focus:bg-[#d36101] hover:bg-[#d36101] data-[highlighted]:bg-[#d36101] data-[highlighted]:text-white cursor-pointer rounded-none">Ambos</SelectItem>
              </div>
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5 w-full">
          <Label className="text-white/80 font-medium text-sm ml-1">Frete</Label>
          <Select value={freightSearch} onValueChange={setFreightSearch}>
            <SelectTrigger className="w-full bg-black/20 border-white/10 text-white rounded-[10px] !h-11 px-4 transition-all focus:ring-app-accent focus:border-app-accent">
              <SelectValue placeholder="Qualquer" />
            </SelectTrigger>
            <SelectContent className="bg-[#b85200] border-[#d36101] text-white rounded-[10px] shadow-xl p-0 overflow-hidden outline-none ring-0">
              <div className="flex flex-col">
                <SelectItem value="todos" className="px-4 py-2.5 focus:bg-[#d36101] hover:bg-[#d36101] data-[highlighted]:bg-[#d36101] data-[highlighted]:text-white cursor-pointer rounded-none border-b border-[#a64b00]">Qualquer</SelectItem>
                <SelectItem value="gratis" className="px-4 py-2.5 focus:bg-[#d36101] hover:bg-[#d36101] data-[highlighted]:bg-[#d36101] data-[highlighted]:text-white cursor-pointer rounded-none border-b border-[#a64b00]">Frete Incluso</SelectItem>
                <SelectItem value="pago" className="px-4 py-2.5 focus:bg-[#d36101] hover:bg-[#d36101] data-[highlighted]:bg-[#d36101] data-[highlighted]:text-white cursor-pointer rounded-none">Cobra Frete</SelectItem>
              </div>
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-10 text-white">Carregando catálogo...</div>
      ) : activeTab === 'produtores' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map((product) => (
            product.produtor ? ( // Assume it's a MOCK product if it has 'produtor'
              <div key={product.id} className="group rounded-[24px] bg-[#d36101] shadow-2xl transition-all duration-300 hover:-translate-y-1 flex flex-col">
                <div className="relative mx-0 mt-0 aspect-[4/3] rounded-t-[24px] rounded-b-none overflow-hidden">
                  <CardImageCarousel 
                    images={[product.imagem]} 
                    alt={product.nome} 
                    onImageClick={openLightbox}
                  />
                  <div className="absolute top-3 left-3 flex gap-2 pointer-events-none">
                    <span className="px-2 py-1 bg-[#4a2000]/90 backdrop-blur-sm rounded-md text-xs font-bold text-app-accent shadow-sm capitalize border border-app-accent/20">
                      {product.categoria}
                    </span>
                  </div>
                  <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 bg-app-accent rounded-md text-xs font-bold text-app-bgDark shadow-sm pointer-events-none">
                    <Star className="w-3 h-3 fill-current" /> {product.avaliacao}
                  </div>
                </div>
                <div className="p-5 flex flex-col flex-1 bg-[#d36101] rounded-b-[24px]">
                  <h3 className="font-bold text-lg leading-tight mb-2 group-hover:text-app-accent transition-colors text-white">{product.nome}</h3>
                  <p className="text-sm text-white/70 mb-4 font-medium flex-1">{product.produtor}</p>
                  <div className="flex items-center gap-2 text-xs text-white/70 mb-4 bg-[#a64b00] p-2 rounded-[15px] border border-white/10 w-fit">
                    <MapPin className="w-4 h-4 text-app-accent" />
                    <span>{product.local}</span>
                  </div>
                  <div className="flex items-center justify-between mt-auto pt-4 border-t border-[#4a2000]">
                    <div>
                      <span className="text-xs text-white/50 uppercase tracking-wider block mb-0.5">R$ / Kg</span>
                      <span className="font-bold text-xl text-white">R$ {product.preco.toFixed(2)}</span>
                    </div>
                    <button className="h-9 px-4 rounded-full bg-app-accent flex justify-center items-center text-app-bgDark hover:bg-app-accentHover transition-colors font-bold text-[13px] min-w-[100px]">
                      Comprar
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div key={product._uniqueId || product.id} className="group rounded-[24px] bg-[#d36101] shadow-2xl transition-all duration-300 hover:-translate-y-1 flex flex-col">
                <div className="relative mx-0 mt-0 aspect-[4/3] rounded-t-[24px] rounded-b-none overflow-hidden">
                  <CardImageCarousel 
                    images={product._displayImages} 
                    alt={product.empresa || product.name} 
                    onImageClick={openLightbox}
                  />
                  <div className="absolute top-3 left-3 flex gap-2 pointer-events-none">
                    <span className="px-2 py-1 bg-[#4a2000]/90 backdrop-blur-sm rounded-md text-xs font-bold text-app-accent shadow-sm capitalize border border-app-accent/20">
                      {product._displayCheese}
                    </span>
                  </div>
                  <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 bg-app-accent rounded-md text-xs font-bold text-app-bgDark shadow-sm pointer-events-none">
                    <Star className="w-3 h-3 fill-current" /> {product.avaliacao || '5.0'}
                  </div>
                </div>
                <div className="p-5 flex flex-col flex-1 bg-[#d36101] rounded-b-[24px]">
                  <h3 className="font-bold text-lg leading-tight mb-2 group-hover:text-app-accent transition-colors text-white">{product.name}</h3>
                  <p className="text-sm text-white/70 mb-4 font-medium flex-1 cursor-help group-hover/tooltip hover:text-white" title={`Produção Semanal: ${product.weeklyVolume} kg/sem | Embalagem: ${product.packaging}`}>Queijo {product._displayCheese}</p>
                  
                  <div className="flex items-center gap-2 text-xs text-white/70 mb-4 bg-[#a64b00] p-2 rounded-[15px] border border-white/10 w-fit">
                    <MapPin className="w-4 h-4 text-app-accent" />
                    <span>{product.city}, {product.state}</span>
                  </div>
                  <div className="flex items-center justify-between mt-auto pt-4 border-t border-[#4a2000]">
                    <div>
                      <span className="text-xs text-white/50 uppercase tracking-wider block mb-0.5">R$ / Kg</span>
                      <span className="font-bold text-xl text-white">R$ {Number(product._displayPrice || 0).toFixed(2)}</span>
                    </div>
                    {profile?.id === product.id || profile?.role === 'ADMIN' ? (
                        <Link to="/perfil">
                            <Button variant="outline" className="text-white border-white/20 hover:bg-white/10 rounded-full h-9 px-4 font-bold text-[13px] min-w-[90px]">Editar</Button>
                        </Link>
                    ) : (
                        <Button className="h-9 px-4 rounded-full bg-app-accent flex justify-center items-center text-app-bgDark hover:bg-app-accentHover transition-colors font-bold text-[13px] min-w-[100px]">Comprar</Button>
                    )}
                  </div>
                </div>
              </div>
            )
          ))}
          {filteredProducts.length === 0 && (
            <div className="col-span-full flex justify-center py-10 text-white/50 font-medium">Nenhum produto encontrado com os filtros atuais.</div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredWholesalers.map((wholesaler) => (
             <div key={wholesaler.id} className="group rounded-[24px] bg-[#d36101] shadow-2xl transition-all duration-300 hover:-translate-y-1 flex flex-col">
              <div className="relative mx-0 mt-0 aspect-[4/3] rounded-t-[24px] rounded-b-none overflow-hidden">
                <CardImageCarousel 
                  images={wholesaler.images?.length ? wholesaler.images : [wholesaler.imagem || 'https://images.unsplash.com/photo-1473401171573-000c010c73ea?auto=format&fit=crop&q=80&w=600']} 
                  alt={wholesaler.empresa || wholesaler.name} 
                  onImageClick={openLightbox}
                />
                <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 bg-app-accent rounded-md text-xs font-bold text-app-bgDark shadow-sm pointer-events-none">
                  <Star className="w-3 h-3 fill-current" /> {wholesaler.avaliacao || '5.0'}
                </div>
              </div>
              <div className="p-5 flex flex-col flex-1 bg-[#d36101] rounded-b-[24px]">
                <h3 className="font-bold text-lg leading-tight mb-2 group-hover:text-app-accent transition-colors text-white flex items-center gap-2">
                  {wholesaler.empresa || wholesaler.name}
                </h3>
                <p className="text-sm text-white/70 mb-4 font-medium flex-1">Comprador: {wholesaler.comprador || wholesaler.name}</p>
                <div className="flex items-center gap-2 text-xs text-white/70 mb-4 bg-[#a64b00] p-2 rounded-[15px] border border-white/10 w-fit">
                  <MapPin className="w-4 h-4 text-app-accent" />
                  <span>{wholesaler.local || `${wholesaler.city}, ${wholesaler.state}`}</span>
                </div>
                <div className="flex flex-col mt-auto pt-4 border-t border-[#4a2000] gap-3">
                  <span className="text-[10px] text-[#FAE678] uppercase tracking-wider font-semibold mb-[-8px]">Volume Demandado</span>
                  <div className="flex items-end justify-between leading-none">
                    <span className="font-bold text-[28px] text-white leading-none">{wholesaler.quantidade || wholesaler.weeklyVolume} <span className="text-[16px] lowercase">kg/sem</span></span>
                  </div>
                  <button className="w-full h-11 rounded-full bg-app-accent flex items-center justify-center text-app-bgDark hover:bg-app-accentHover transition-colors font-bold text-sm gap-2 mt-2">
                    <Gavel className="w-4 h-4" /> Fazer Oferta
                  </button>
                </div>
              </div>
            </div>
          ))}
          {filteredWholesalers.length === 0 && (
            <div className="col-span-full flex justify-center py-10 text-white/50 font-medium">Nenhum comprador encontrado com os filtros atuais.</div>
          )}
        </div>
      )}

      {isLightboxOpen && (
        <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center animate-in fade-in duration-200">
          <button 
            onClick={() => setIsLightboxOpen(false)}
            className="absolute top-4 right-4 text-white hover:text-app-accent bg-black/50 p-2 rounded-full transition-colors z-50"
          >
            <X className="w-6 h-6" />
          </button>
          
          {lightboxImages.length > 1 && (
            <>
              <button 
                onClick={(e) => { e.stopPropagation(); setLightboxIndex(c => c === 0 ? lightboxImages.length - 1 : c - 1); }}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/10 p-3 rounded-full transition-colors z-50"
              >
                <ChevronLeft className="w-8 h-8" />
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); setLightboxIndex(c => c === lightboxImages.length - 1 ? 0 : c + 1); }}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/10 p-3 rounded-full transition-colors z-50"
              >
                <ChevronRight className="w-8 h-8" />
              </button>
            </>
          )}

          <img 
            src={lightboxImages[lightboxIndex]} 
            alt="Expanded View" 
            className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg"
          />
          
          {lightboxImages.length > 1 && (
             <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-50 bg-black/50 px-4 py-2 rounded-full">
               {lightboxImages.map((_, i) => (
                 <button 
                   key={i} 
                   onClick={() => setLightboxIndex(i)}
                   className={`w-2.5 h-2.5 rounded-full transition-colors ${i === lightboxIndex ? 'bg-app-accent' : 'bg-white/50 hover:bg-white/80'}`} 
                 />
               ))}
             </div>
          )}
        </div>
      )}
    </div>
  );
}

function ProductCard({ product, role, owner, currentUserId }: { key?: React.Key, product: any, role?: string, owner?: any, currentUserId?: string }) {
  const isOwner = currentUserId === product.produtorId;
  const isAdmin = role === 'ADMIN';
  const canEdit = isOwner || isAdmin;
  
  return (
    <Card className="p-0 gap-0 overflow-hidden flex flex-col shadow-2xl border-none bg-[#d36101] text-white rounded-[24px]">
      <div className="aspect-[4/3] relative rounded-[16px] mx-4 mt-4 overflow-hidden">
        {product.photos && product.photos.length > 0 ? (
          <img src={product.photos[0]} alt={product.cheeseType} className="w-full h-full object-cover transition-transform duration-700 hover:scale-105" referrerPolicy="no-referrer" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-[#a64b00] text-app-accent/50">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
          </div>
        )}
        {!product.active && (
          <div className="absolute top-2 right-2">
             <span className="px-2 py-1 bg-red-500/90 backdrop-blur-sm rounded-md text-xs font-bold text-white shadow-sm border border-white/10 uppercase">
              Inativo
            </span>
          </div>
        )}
      </div>
      <CardHeader className="bg-[#d36101] border-none pt-4 px-4 pb-2 text-left">
        <div className="flex flex-col gap-2 w-full">
          {owner && (
            <div className="text-sm font-medium text-white/70 truncate">{owner.name}</div>
          )}
          <div className="flex justify-between items-start w-full">
            <div>
              <CardTitle className="text-xl text-white group-hover:text-app-accent transition-colors flex items-center gap-2">
                <Slice className="w-4 h-4 text-app-accent shrink-0" />
                <span className="truncate">{product.cheeseType}</span>
              </CardTitle>
              <CardDescription className="text-white/80 font-medium text-sm mt-1">{product.format}</CardDescription>
            </div>
             <span className="font-bold text-xl text-white shrink-0 mt-1">R$ {product.pricePerKg.toFixed(2)}<span className="text-xs text-white/50 tracking-wider font-normal"> / Kg</span></span>
          </div>
          {owner && owner.city && owner.state && (
            <div className="flex items-center gap-2 text-xs text-white/70 bg-[#a64b00] p-2 rounded-[15px] border border-white/10 w-fit mt-1">
              <MapPin className="w-4 h-4 text-app-accent" />
              <span>{owner.city}, {owner.state}</span>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-4 flex-1">
        <div className="space-y-3 text-sm bg-[#a64b00] p-4 rounded-[15px] border border-white/10">
          <div className="flex justify-between border-b border-white/5 pb-2">
            <span className="text-white/70 font-semibold">Disponível:</span>
            <span className="font-bold text-white">{product.availableKg} kg</span>
          </div>
          <div className="flex justify-between border-b border-white/5 pb-2">
            <span className="text-white/70 font-semibold">Embalagem:</span>
            <span className="font-bold text-white">{product.packagingType === 'com-rotulo' ? 'Com Rótulo' : 'Sem Rótulo'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-white/70 font-semibold">Pagamento:</span>
            <span className="font-bold text-white text-xs text-right max-w-[120px] truncate">{product.paymentMethods?.join(', ') || 'A combinar'}</span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0 mt-auto border-t border-[#4a2000] pt-4 items-center justify-between">
        {canEdit ? (
          <Button variant="outline" className="w-full text-white border-white/20 hover:bg-white/10 rounded-xl">Editar Anúncio</Button>
        ) : (
          <Button className="h-10 w-full px-6 rounded-full bg-app-accent flex items-center justify-center text-app-bgDark hover:bg-app-accentHover transition-colors font-bold text-sm">Comprar</Button>
        )}
      </CardFooter>
    </Card>
  );
}


