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
import { Store, Slice, Info, ArrowRight } from 'lucide-react';

const CHEESE_TYPES = ['Coalho', 'Mussarela', 'Prato', 'Provolone', 'Parmesão', 'Colonial', 'Requeijão'];

import { MOCK_PRODUCTS, MOCK_WHOLESALERS } from './CatalogPublic';
import { Link } from 'react-router-dom';
import { Star, MapPin } from 'lucide-react';

import { CatalogMetrics } from './CatalogMetrics';

export function Catalog() {
  const { profile } = useAuth();
  const [products, setProducts] = useState<any[]>([]);
  const [wholesalers, setWholesalers] = useState<any[]>([]);
  const [usersInfo, setUsersInfo] = useState<Record<string, any>>({});
  
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [loadingUsers, setLoadingUsers] = useState(true);
  
  const [activeTab, setActiveTab] = useState<'produtores' | 'atacadistas'>('produtores');
  
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
    return uniqueLocations.filter(loc => loc.toLowerCase().includes(locationSearch.toLowerCase()));
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
    const filterText = textSearch.toLowerCase().trim();
    const filterLoc = locationSearch.toLowerCase().trim();
    
    // Normalize string handling
    const containsStr = (src: string, target: string) => (src || '').toLowerCase().includes(target);
    const exactStr = (src: string, target: string) => (src || '').toLowerCase() === target;

    // Filter Producers (Stored in products state)
    const activeProducers = products.filter(owner => {
      const locStr = `${owner.city || ''}, ${owner.state || ''}`.toLowerCase();
      let pass = true;
      if (filterText && !containsStr(owner.name, filterText)) pass = false;
      if (filterLoc && !locStr.includes(filterLoc)) pass = false;
      if (cheeseTypeSearch !== 'todos' && !(owner.cheeseTypes || []).some((t: string) => exactStr(t, cheeseTypeSearch.toLowerCase()))) pass = false;
      if (packagingSearch === 'com' && exactStr(owner.packaging, 'Sem Rótulo')) pass = false;
      if (packagingSearch === 'sem' && exactStr(owner.packaging, 'Com Rótulo')) pass = false;
      if (freightSearch === 'gratis' && owner.chargesFreight) pass = false;
      if (freightSearch === 'pago' && !owner.chargesFreight) pass = false;
      
      return pass;
    });

    // Filter MOCK Products
    const mockProds = MOCK_PRODUCTS.filter(p => {
      let pass = true;
      if (filterText && !containsStr(p.nome, filterText) && !containsStr(p.produtor, filterText)) pass = false;
      if (filterLoc && !containsStr(p.local, filterLoc)) pass = false;
      if (cheeseTypeSearch !== 'todos' && !exactStr(p.categoria, cheeseTypeSearch.toLowerCase())) pass = false;
      // Mocks have no packaging or freight properties, assume they match or skip filtering
      return pass;
    });
    
    // Filter Wholesalers (Real)
    const activeWholesalers = wholesalers.filter(w => {
      const locStr = `${w.city || ''}, ${w.state || ''}`.toLowerCase();
      
      let pass = true;
      if (filterText && !containsStr(w.name, filterText)) pass = false;
      if (filterLoc && !locStr.includes(filterLoc)) pass = false;
      if (cheeseTypeSearch !== 'todos' && !(w.cheeseTypes || []).some((t: string) => exactStr(t, cheeseTypeSearch.toLowerCase()))) pass = false;
      if (packagingSearch === 'com' && exactStr(w.packaging, 'A granel')) pass = false;
      if (packagingSearch === 'sem' && !exactStr(w.packaging, 'A granel')) pass = false;
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
                  <img src={product.imagem} alt={product.nome} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" loading="lazy" />
                  <div className="absolute top-3 left-3 flex gap-2">
                    <span className="px-2 py-1 bg-[#4a2000]/90 backdrop-blur-sm rounded-md text-xs font-bold text-app-accent shadow-sm capitalize border border-app-accent/20">
                      {product.categoria}
                    </span>
                  </div>
                  <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 bg-app-accent rounded-md text-xs font-bold text-app-bgDark shadow-sm">
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
                    <button className="h-10 px-6 rounded-full bg-app-accent flex items-center justify-center text-app-bgDark hover:bg-app-accentHover transition-colors font-bold text-sm">
                      Comprar
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div key={product.id} className="group rounded-[24px] bg-[#d36101] shadow-2xl transition-all duration-300 hover:-translate-y-1 flex flex-col">
                <div className="relative mx-0 mt-0 aspect-[4/3] rounded-t-[24px] rounded-b-none overflow-hidden">
                  <img src={product.imagem || (product.images && product.images[0]) || 'https://images.unsplash.com/photo-1473401171573-000c010c73ea?auto=format&fit=crop&q=80&w=600'} alt={product.empresa || product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" loading="lazy" />
                  <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 bg-app-accent rounded-md text-xs font-bold text-app-bgDark shadow-sm">
                    <Star className="w-3 h-3 fill-current" /> {product.avaliacao || '5.0'}
                  </div>
                </div>
                <div className="p-5 flex flex-col flex-1 bg-[#d36101] rounded-b-[24px]">
                  <h3 className="font-bold text-lg leading-tight mb-2 group-hover:text-app-accent transition-colors text-white flex items-center gap-2">
                    <Store className="w-5 h-5 text-app-accent" />
                    {product.name}
                  </h3>
                  <div className="flex flex-wrap gap-1 mb-4">
                     {product.cheeseTypes?.slice(0, 3).map((c: string) => (
                       <span key={c} className="bg-white/10 px-2 py-0.5 rounded text-[10px] text-white uppercase tracking-wider">{c}</span>
                     ))}
                     {(product.cheeseTypes?.length || 0) > 3 && <span className="bg-white/10 px-2 py-0.5 rounded text-[10px] text-white uppercase tracking-wider">+{product.cheeseTypes.length - 3}</span>}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-white/70 mb-4 bg-[#a64b00] p-2 rounded-[15px] border border-white/10 w-fit">
                    <MapPin className="w-4 h-4 text-app-accent" />
                    <span>{product.city}, {product.state}</span>
                  </div>
                  <div className="flex items-center justify-between mt-auto pt-4 border-t border-[#4a2000]">
                    <div>
                      <span className="text-xs text-white/50 uppercase tracking-wider block mb-0.5">Volume Produzido</span>
                      <span className="font-bold text-lg text-white">{product.weeklyVolume} kg/sem</span>
                    </div>
                    {profile?.id === product.id || profile?.role === 'ADMIN' ? (
                        <Link to="/perfil">
                            <Button variant="outline" className="text-white border-white/20 hover:bg-white/10 rounded-full h-10 px-6 font-bold text-sm">Editar</Button>
                        </Link>
                    ) : (
                        <Button className="h-10 px-6 rounded-full bg-app-accent flex items-center justify-center text-app-bgDark hover:bg-app-accentHover transition-colors font-bold text-sm">Contatar</Button>
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
                <img src={wholesaler.imagem || (wholesaler.images && wholesaler.images[0]) || 'https://images.unsplash.com/photo-1473401171573-000c010c73ea?auto=format&fit=crop&q=80&w=600'} alt={wholesaler.empresa || wholesaler.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" loading="lazy" />
                <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 bg-app-accent rounded-md text-xs font-bold text-app-bgDark shadow-sm">
                  <Star className="w-3 h-3 fill-current" /> {wholesaler.avaliacao || '5.0'}
                </div>
              </div>
              <div className="p-5 flex flex-col flex-1 bg-[#d36101] rounded-b-[24px]">
                <h3 className="font-bold text-lg leading-tight mb-2 group-hover:text-app-accent transition-colors text-white flex items-center gap-2">
                  <Store className="w-5 h-5 text-app-accent" />
                  {wholesaler.empresa || wholesaler.name}
                </h3>
                <p className="text-sm text-white/70 mb-4 font-medium flex-1">Comprador: {wholesaler.comprador || wholesaler.name}</p>
                <div className="flex items-center gap-2 text-xs text-white/70 mb-4 bg-[#a64b00] p-2 rounded-[15px] border border-white/10 w-fit">
                  <MapPin className="w-4 h-4 text-app-accent" />
                  <span>{wholesaler.local || `${wholesaler.city}, ${wholesaler.state}`}</span>
                </div>
                <div className="flex items-center justify-between mt-auto pt-4 border-t border-[#4a2000]">
                  <div>
                    <span className="text-xs text-white/50 uppercase tracking-wider block mb-0.5">Volume Demandado</span>
                    <span className="font-bold text-lg text-white">{wholesaler.quantidade || wholesaler.weeklyVolume} kg/mês</span>
                  </div>
                  <button className="h-10 px-6 rounded-full bg-app-accent flex items-center justify-center text-app-bgDark hover:bg-app-accentHover transition-colors font-bold text-sm">
                    Oferecer
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


