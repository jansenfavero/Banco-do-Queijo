import React, { useEffect, useState, useMemo, useRef } from 'react';
import { collection, query, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Shield, ShieldAlert, ShieldCheck, Users, Store, Phone } from 'lucide-react';
import { toast } from 'sonner';

// Helper for search text normalization
const normalizeStr = (str: string) => {
  if (!str) return '';
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
};

const containsStr = (source: string | undefined, query: string) => {
  if (!source) return false;
  return normalizeStr(source).includes(normalizeStr(query));
};

export function AdminUsers() {
  const { profile } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [textSearch, setTextSearch] = useState('');
  const [locationSearch, setLocationSearch] = useState('');
  const [statusSearch, setStatusSearch] = useState('todos');
  const [isLocationDropdownOpen, setIsLocationDropdownOpen] = useState(false);
  const locationDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (locationDropdownRef.current && !locationDropdownRef.current.contains(event.target as Node)) {
        setIsLocationDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Derived metrics
  const uniqueLocations = useMemo(() => {
    const locs = new Set<string>();
    users.forEach(u => {
      if (u.city && u.state) locs.add(`${u.city}, ${u.state}`);
    });
    return Array.from(locs).sort();
  }, [users]);

  const filteredLocations = useMemo(() => {
    if (!locationSearch) return uniqueLocations;
    return uniqueLocations.filter(loc => containsStr(loc, locationSearch));
  }, [uniqueLocations, locationSearch]);

  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      let pass = true;
      if (textSearch) {
        const query = normalizeStr(textSearch);
        const nameMatch = containsStr(user.name, query);
        const docMatch = containsStr(user.cpfCnpj, query) || user.cpfCnpj?.replace(/\D/g, '').includes(query);
        const phoneMatch = containsStr(user.phone, query) || user.phone?.replace(/\D/g, '').includes(query);
        if (!nameMatch && !docMatch && !phoneMatch) pass = false;
      }

      if (locationSearch) {
        const locStr = `${user.city || ''}, ${user.state || ''}`;
        if (!containsStr(locStr, locationSearch)) pass = false;
      }

      if (statusSearch !== 'todos') {
         if (user.kycStatus !== statusSearch) pass = false;
      }

      return pass;
    });
  }, [users, textSearch, locationSearch, statusSearch]);

  const filteredProducerCount = filteredUsers.filter(u => u.role === 'PRODUTOR').length;
  const filteredWholesalerCount = filteredUsers.filter(u => u.role === 'ATACADISTA').length;

  useEffect(() => {
    if (profile?.role !== 'ADMIN') return;

    const q = query(collection(db, 'users'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const usersData: any[] = [];
      snapshot.forEach((doc) => {
        usersData.push({ id: doc.id, ...doc.data() });
      });
      // Sort admins first, then by name
      usersData.sort((a, b) => {
        if (a.role === 'ADMIN' && b.role !== 'ADMIN') return -1;
        if (a.role !== 'ADMIN' && b.role === 'ADMIN') return 1;
        return a.name.localeCompare(b.name);
      });
      setUsers(usersData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [profile]);

  const updateUserRole = async (userId: string, newRole: string) => {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, { role: newRole });
      toast.success(`Nível de acesso alterado para ${newRole} com sucesso!`);
    } catch (error: any) {
      console.error(error);
      toast.error('Erro ao atualizar nível de acesso. Verifique as permissões.');
    }
  };

  const updateUserStatus = async (userId: string, newStatus: string) => {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, { kycStatus: newStatus });
      toast.success(`Status da conta alterado para ${newStatus} com sucesso!`);
    } catch (error: any) {
      console.error(error);
      toast.error('Erro ao atualizar status.');
    }
  };

  if (profile?.role !== 'ADMIN') {
    return <div className="p-6 text-center text-red-500">Acesso negado. Apenas administradores.</div>;
  }

  return (
    <div className="space-y-8 p-6 md:p-10 max-w-7xl mx-auto">
      <div className="flex items-center gap-4">
        <div className="p-3 bg-app-cardDark rounded-2xl border border-app-accent/20 shadow-sm shrink-0">
          <Shield className="h-8 w-8 text-app-accent" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-1">
            Configurações e Permissões
          </h1>
          <p className="text-white/70 text-sm md:text-base">
            Gerencie o nível de acesso e o status de todos os usuários da plataforma.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-[#d36101] p-6 rounded-[24px] border border-white/10 flex items-center gap-4">
            <div className="p-4 bg-white/10 rounded-full text-white">
                <Store className="w-8 h-8" />
            </div>
            <div>
                <p className="text-white/90 text-sm uppercase tracking-wider font-semibold">Total de Produtores</p>
                <p className="text-4xl font-bold text-white">{loading ? '-' : filteredProducerCount}</p>
            </div>
        </div>
        <div className="bg-[#d36101] p-6 rounded-[24px] border border-white/10 flex items-center gap-4">
            <div className="p-4 bg-white/10 rounded-full text-white">
                <Users className="w-8 h-8" />
            </div>
            <div>
                <p className="text-white/90 text-sm uppercase tracking-wider font-semibold">Total de Atacadistas</p>
                <p className="text-4xl font-bold text-white">{loading ? '-' : filteredWholesalerCount}</p>
            </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-[#703200] p-5 rounded-[24px] border border-[#d36101] shadow-lg grid grid-cols-1 md:grid-cols-3 gap-5 items-end">
        <div className="flex flex-col gap-1.5 w-full">
          <Label className="text-white/80 font-medium text-sm ml-1">
            Buscar (Nome, CNPJ, Whats...)
          </Label>
          <Input 
            placeholder="Digite aqui..." 
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
              className="w-full bg-black/20 border-white/10 text-white placeholder:text-white/40 focus:ring-app-accent focus:border-app-accent rounded-[10px] h-11 px-4 transition-all"
            />
            {isLocationDropdownOpen && (
              <div className="absolute top-[calc(100%+4px)] left-0 w-full bg-[#b85200] border border-[#d36101] rounded-[10px] shadow-2xl z-50 max-h-60 overflow-y-auto flex flex-col">
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
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-1.5 w-full">
          <Label className="text-white/80 font-medium text-sm ml-1">Status da Conta</Label>
          <Select value={statusSearch} onValueChange={setStatusSearch}>
            <SelectTrigger className="w-full bg-black/20 border-white/10 text-white rounded-[10px] !h-11 px-4 transition-all focus:ring-app-accent focus:border-app-accent">
              <SelectValue placeholder="Qualquer" />
            </SelectTrigger>
            <SelectContent className="bg-[#b85200] border-[#d36101] text-white rounded-[10px] shadow-xl p-0 overflow-hidden outline-none ring-0">
              <div className="flex flex-col">
                <SelectItem value="todos" className="px-4 py-2.5 focus:bg-[#d36101] hover:bg-[#d36101] data-[highlighted]:bg-[#d36101] data-[highlighted]:text-white cursor-pointer rounded-none border-b border-[#a64b00]">Qualquer Status</SelectItem>
                <SelectItem value="VALIDADO" className="px-4 py-2.5 focus:bg-[#d36101] hover:bg-[#d36101] data-[highlighted]:bg-[#d36101] data-[highlighted]:text-white cursor-pointer rounded-none border-b border-[#a64b00]">Validado (Liberado)</SelectItem>
                <SelectItem value="PENDENTE" className="px-4 py-2.5 focus:bg-[#d36101] hover:bg-[#d36101] data-[highlighted]:bg-[#d36101] data-[highlighted]:text-white cursor-pointer rounded-none border-b border-[#a64b00]">Pendente</SelectItem>
                <SelectItem value="BLOQUEADO" className="px-4 py-2.5 focus:bg-[#d36101] hover:bg-[#d36101] data-[highlighted]:bg-[#d36101] data-[highlighted]:text-white cursor-pointer rounded-none">Bloqueado</SelectItem>
              </div>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-6">
        {loading ? (
          <div className="flex justify-center p-6">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center p-12 bg-[#703200] rounded-[24px] border border-white/10">
            <p className="text-white/70">Nenhum usuário encontrado com os filtros atuais.</p>
          </div>
        ) : (
          filteredUsers.map((user) => (
            <Card key={user.id} className={`p-0 gap-0 shadow-2xl border border-transparent overflow-hidden rounded-[24px] transition-all bg-[#703200] text-white`}>
              <CardHeader className={`rounded-t-[24px] px-6 py-5 border-b border-white/10 ${user.role === 'ADMIN' ? 'bg-[#4a2000]' : 'bg-[#d36101]'}`}>
                <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-xl border border-white/10 ${user.role === 'ADMIN' ? 'bg-[#d36101] text-white' : 'bg-[#4a2000] text-app-accent'}`}>
                      {user.role === 'ADMIN' ? <ShieldCheck className="h-6 w-6" /> : <Shield className="h-6 w-6" />}
                    </div>
                    <div>
                      <CardTitle className="text-xl font-bold text-white">
                        {user.name}
                      </CardTitle>
                      <CardDescription className="text-white/80 mt-1 text-sm">{user.email}</CardDescription>
                    </div>
                  </div>
                  {user.role !== 'ADMIN' && (
                    <div className="text-left md:text-right">
                      <p className="text-sm font-medium text-white flex items-center gap-1 md:justify-end">CNPJ/CPF: <span className="font-mono text-white/50">{user.cpfCnpj}</span></p>
                      {user.phone && (
                        <p className="text-sm font-medium text-white flex items-center md:justify-end gap-1"><Phone className="w-3 h-3 text-white/50" /> Whatsapp: <span className="font-mono text-white/50">{user.phone}</span></p>
                      )}
                      <p className="text-sm text-white/50 mt-1">{user.city} - {user.state}</p>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="flex-1 space-y-4">
                    <label className="text-sm font-semibold uppercase tracking-wider text-white/70">Perfil de Acesso:</label>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant={user.role === 'ADMIN' ? 'default' : 'outline'}
                        className={user.role === 'ADMIN' ? 'bg-app-accent hover:bg-app-accentHover text-app-bgDark border-transparent font-bold' : 'hover:bg-white/10 border-white/20 text-white bg-transparent'}
                        onClick={() => updateUserRole(user.id, 'ADMIN')}
                        size="sm"
                      >
                        Administrador
                      </Button>
                      <Button
                        variant={user.role === 'PRODUTOR' ? 'default' : 'outline'}
                        className={user.role === 'PRODUTOR' ? 'bg-app-accent hover:bg-app-accentHover text-app-bgDark border-transparent font-bold' : 'hover:bg-white/10 border-white/20 text-white bg-transparent'}
                        onClick={() => updateUserRole(user.id, 'PRODUTOR')}
                        size="sm"
                      >
                        Produtor
                      </Button>
                      <Button
                        variant={user.role === 'ATACADISTA' ? 'default' : 'outline'}
                        className={user.role === 'ATACADISTA' ? 'bg-app-accent hover:bg-app-accentHover text-app-bgDark border-transparent font-bold' : 'hover:bg-white/10 border-white/20 text-white bg-transparent'}
                        onClick={() => updateUserRole(user.id, 'ATACADISTA')}
                        size="sm"
                      >
                        Atacadista/Comprador
                      </Button>
                    </div>
                  </div>
                  
                  <div className="flex-1 space-y-4">
                    <label className="text-sm font-semibold uppercase tracking-wider text-white/70">Status da Conta (Verificação):</label>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant={user.kycStatus === 'VALIDADO' ? 'default' : 'outline'}
                        className={user.kycStatus === 'VALIDADO' ? 'bg-green-600 hover:bg-green-700 text-white border-transparent font-bold' : 'hover:bg-green-500/20 border-white/20 text-white bg-transparent hover:text-green-400'}
                        onClick={() => updateUserStatus(user.id, 'VALIDADO')}
                        size="sm"
                      >
                        Validado (Liberado)
                      </Button>
                      <Button
                        variant={user.kycStatus === 'PENDENTE' ? 'default' : 'outline'}
                        className={user.kycStatus === 'PENDENTE' ? 'bg-yellow-500 hover:bg-yellow-600 text-white border-transparent font-bold' : 'hover:bg-yellow-500/20 border-white/20 text-white bg-transparent hover:text-yellow-400'}
                        onClick={() => updateUserStatus(user.id, 'PENDENTE')}
                        size="sm"
                      >
                        Pendente
                      </Button>
                      <Button
                        variant={user.kycStatus === 'BLOQUEADO' ? 'default' : 'outline'}
                        className={user.kycStatus === 'BLOQUEADO' ? 'bg-red-600 hover:bg-red-700 text-white border-transparent font-bold' : 'hover:bg-red-500/20 border-white/20 text-white bg-transparent hover:text-red-400'}
                        onClick={() => updateUserStatus(user.id, 'BLOQUEADO')}
                        size="sm"
                      >
                        <ShieldAlert className="h-4 w-4 mr-2" /> Bloqueado
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
