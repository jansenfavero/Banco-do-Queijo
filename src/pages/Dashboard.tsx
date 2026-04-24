import { useAuth } from '../hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Package, Users, DollarSign, TrendingUp, ShoppingBag, LayoutDashboard, ShieldCheck, ShoppingCart, Loader2 } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { CatalogMetrics } from './CatalogMetrics';
import { collection, query, where, onSnapshot, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';

export function Dashboard() {
  const { profile } = useAuth();

  if (!profile) return null;

  return (
    <div className="space-y-8 p-6 md:p-10 w-full max-w-7xl mx-auto">
      <div className="flex items-center gap-4">
        <div className="p-3 bg-app-cardDark rounded-2xl border-2 border-[#d36101] shadow-sm shrink-0">
          <LayoutDashboard className="h-8 w-8 text-app-accent" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-1">
            Dashboard
          </h1>
          <p className="text-white/70 text-sm md:text-base">
            Bem-vindo de volta, {profile.name}. Aqui está o resumo da sua conta.
          </p>
        </div>
      </div>

      <CatalogMetrics />

      {profile.kycStatus === 'PENDENTE' && profile.role !== 'ADMIN' && (
        <div className="bg-[#b85200]/20 border border-[#f4d763]/50 p-5 rounded-[20px] shadow-[0_0_15px_rgba(244,215,99,0.1)]">
          <div className="flex">
            <div className="flex-shrink-0 mt-0.5">
              <ShieldCheck className="h-6 w-6 text-[#f4d763]" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-bold text-[#f4d763] mb-1">Ação Necessária</h3>
              <p className="text-sm text-white/90">
                Seu perfil ainda não está completo. Somente após completar <strong>todos os seus dados e informações em "Meu Perfil"</strong> (incluindo CPF/CNPJ válidos, endereço e fotos) você estará habilitado e sua conta será ativada automaticamente para aparecer na vitrine de negociação.
              </p>
            </div>
          </div>
        </div>
      )}

      {profile.role === 'ADMIN' ? <AdminDashboard /> : profile.role === 'PRODUTOR' ? <ProducerDashboard profile={profile} /> : <WholesalerDashboard profile={profile} />}
    </div>
  );
}

// ─── ADMIN ──────────────────────────────────────────────────────────────────

function AdminDashboard() {
  const [stats, setStats] = useState({ users: 0, volume: 0, orders: 0, demands: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [usersSnap, ordersSnap, demandsSnap] = await Promise.all([
          getDocs(collection(db, 'users')),
          getDocs(collection(db, 'orders')),
          getDocs(collection(db, 'demands')),
        ]);
        let volume = 0;
        ordersSnap.forEach(d => { volume += Number(d.data().totalAmount || 0); });
        setStats({
          users: usersSnap.size,
          volume,
          orders: ordersSnap.size,
          demands: demandsSnap.size,
        });
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  return (
    <div className="space-y-8">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total de Usuários" icon={<Users className="h-4 w-4 text-app-accent" />} value={loading ? null : String(stats.users)} sub="Produtores e Atacadistas" />
        <StatCard title="Transações Totais" icon={<DollarSign className="h-4 w-4 text-app-accent" />} value={loading ? null : fmt(stats.volume)} sub="Volume transacionado" />
        <StatCard title="Pedidos Realizados" icon={<ShoppingCart className="h-4 w-4 text-app-accent" />} value={loading ? null : String(stats.orders)} sub="No catálogo geral" />
        <StatCard title="Demandas Ativas" icon={<TrendingUp className="h-4 w-4 text-app-accent" />} value={loading ? null : String(stats.demands)} sub="Aguardando propostas" />
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7 pt-4">
        <Card className="col-span-7 p-0 gap-0 shadow-2xl border-2 border-[#d36101] bg-[#703200] text-white overflow-hidden rounded-[24px]">
          <CardHeader className="rounded-none bg-[#d36101] border-b border-white/10 px-6 py-5 flex flex-col items-center justify-center m-0">
            <CardTitle className="text-xl flex items-center gap-2">
              <ShieldCheck className="w-5 h-5" />
              Painel Administrativo
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="text-center py-10 text-white/70 bg-[#4a2000] rounded-[20px] shadow-sm border border-white/10">
              Você tem acesso total à plataforma. Use o menu lateral para gerenciar o catálogo, demandas e pedidos.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ─── PRODUTOR ────────────────────────────────────────────────────────────────

function ProducerDashboard({ profile }: { profile: any }) {
  const [stats, setStats] = useState({ revenue30: 0, activeOrders: 0, buyers: 0, weeklyVolume: 0 });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile?.id) return;

    const q = query(collection(db, 'orders'), where('produtorId', '==', profile.id));
    const unsub = onSnapshot(q, snap => {
      const orders: any[] = [];
      snap.forEach(d => orders.push({ id: d.id, ...d.data() }));

      const now = Date.now();
      const ms30 = 30 * 24 * 60 * 60 * 1000;
      const ms90 = 90 * 24 * 60 * 60 * 1000;

      const revenue30 = orders
        .filter(o => o.createdAt?.toMillis && now - o.createdAt.toMillis() <= ms30)
        .reduce((s, o) => s + Number(o.totalAmount || 0), 0);

      const activeOrders = orders.filter(o => ['PENDENTE', 'ACEITO', 'EM_TRANSITO'].includes(o.status)).length;

      const buyers90 = new Set(
        orders
          .filter(o => o.createdAt?.toMillis && now - o.createdAt.toMillis() <= ms90)
          .map(o => o.compradorId)
      ).size;

      orders.sort((a, b) => (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0));
      setRecentOrders(orders.slice(0, 5));
      setStats({
        revenue30,
        activeOrders,
        buyers: buyers90,
        weeklyVolume: Number(profile.weeklyVolume || 0),
      });
      setLoading(false);
    }, () => setLoading(false));

    return () => unsub();
  }, [profile]);

  const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const statusLabel: Record<string, string> = {
    PENDENTE: 'Pendente', ACEITO: 'Aceito', EM_TRANSITO: 'Em Trânsito', ENTREGUE: 'Entregue', RECUSADO: 'Recusado',
  };
  const statusColor: Record<string, string> = {
    PENDENTE: 'text-yellow-400', ACEITO: 'text-blue-400', EM_TRANSITO: 'text-purple-400', ENTREGUE: 'text-green-400', RECUSADO: 'text-red-400',
  };

  return (
    <div className="space-y-8">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Faturamento (30 dias)" icon={<DollarSign className="h-4 w-4 text-app-accent" />} value={loading ? null : fmt(stats.revenue30)} sub="Vendas do último mês" />
        <StatCard title="Pedidos Ativos" icon={<ShoppingBag className="h-4 w-4 text-app-accent" />} value={loading ? null : String(stats.activeOrders)} sub="Aguardando ação" />
        <StatCard title="Compradores Ativos" icon={<Users className="h-4 w-4 text-app-accent" />} value={loading ? null : String(stats.buyers)} sub="Clientes nos últimos 90 dias" />
        <StatCard title="Produção Semanal" icon={<Package className="h-4 w-4 text-app-accent" />} value={loading ? null : `${stats.weeklyVolume} kg`} sub="Volume declarado no perfil" />
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7 pt-4">
        <Card className="col-span-4 p-0 gap-0 shadow-2xl border-2 border-[#d36101] bg-[#703200] text-white overflow-hidden rounded-[24px]">
          <CardHeader className="rounded-none bg-[#d36101] border-b border-white/10 px-6 py-5 text-left m-0">
            <CardTitle className="text-xl flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-white" />
              Últimos Pedidos
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {loading ? (
              <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 text-app-accent animate-spin" /></div>
            ) : recentOrders.length === 0 ? (
              <div className="text-center py-10 text-white/70 bg-[#4a2000] rounded-[20px] shadow-sm border border-white/10">Nenhum pedido recente.</div>
            ) : (
              <div className="space-y-3">
                {recentOrders.map(o => (
                  <div key={o.id} className="flex items-center justify-between bg-[#4a2000] rounded-[16px] px-5 py-3 border border-white/10">
                    <div>
                      <p className="text-sm font-bold text-white">Pedido #{o.id.slice(0, 8).toUpperCase()}</p>
                      <p className="text-xs text-white/50">{o.createdAt?.toDate?.().toLocaleDateString('pt-BR') ?? '--'} · {o.quantityKg ?? '--'} kg</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-white">{fmt(Number(o.totalAmount || 0))}</p>
                      <p className={`text-xs font-semibold ${statusColor[o.status] || 'text-white/50'}`}>{statusLabel[o.status] || o.status}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="col-span-3 p-0 gap-0 shadow-2xl border-2 border-[#d36101] bg-[#703200] text-white overflow-hidden rounded-[24px]">
          <CardHeader className="rounded-none flex flex-row items-center justify-start bg-[#d36101] border-b border-white/10 px-6 py-5 m-0">
            <CardTitle className="text-xl flex items-center gap-2">
              <Package className="w-5 h-5 text-white" />
              Meus Queijos
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {profile.cheeseTypes && profile.cheeseTypes.length > 0 ? (
              <div className="space-y-3">
                {profile.cheeseTypes.map((type: string) => (
                  <div key={type} className="flex items-center justify-between bg-[#4a2000] rounded-[16px] px-5 py-3 border border-white/10">
                    <span className="text-sm font-bold text-white capitalize">{type}</span>
                    <span className="text-sm font-bold text-app-accent">
                      {profile.cheesePrices?.[type]
                        ? `R$ ${Number(profile.cheesePrices[type]).toFixed(2)}/kg`
                        : 'Preço não definido'}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10 text-white/70 flex flex-col items-center gap-4 bg-[#4a2000] rounded-[20px] shadow-sm border border-white/10 p-4">
                <p>Seu Perfil e Produtos ainda não estão publicados, publique para que fique disponível aos Atacadistas Compradores.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ─── ATACADISTA ──────────────────────────────────────────────────────────────

function WholesalerDashboard({ profile }: { profile: any }) {
  const [stats, setStats] = useState({ volume30: 0, spend30: 0, suppliers: 0 });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile?.id) return;

    const q = query(collection(db, 'orders'), where('compradorId', '==', profile.id));
    const unsub = onSnapshot(q, snap => {
      const orders: any[] = [];
      snap.forEach(d => orders.push({ id: d.id, ...d.data() }));

      const now = Date.now();
      const ms30 = 30 * 24 * 60 * 60 * 1000;

      const orders30 = orders.filter(o => o.createdAt?.toMillis && now - o.createdAt.toMillis() <= ms30);
      const volume30 = orders30.reduce((s, o) => s + Number(o.quantityKg || 0), 0);
      const spend30 = orders30.reduce((s, o) => s + Number(o.totalAmount || 0), 0);
      const suppliers = new Set(orders.map(o => o.produtorId)).size;

      orders.sort((a, b) => (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0));
      setRecentOrders(orders.slice(0, 5));
      setStats({ volume30, spend30, suppliers });
      setLoading(false);
    }, () => setLoading(false));

    return () => unsub();
  }, [profile]);

  const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const statusLabel: Record<string, string> = {
    PENDENTE: 'Pendente', ACEITO: 'Aceito', EM_TRANSITO: 'Em Trânsito', ENTREGUE: 'Entregue', RECUSADO: 'Recusado',
  };
  const statusColor: Record<string, string> = {
    PENDENTE: 'text-yellow-400', ACEITO: 'text-blue-400', EM_TRANSITO: 'text-purple-400', ENTREGUE: 'text-green-400', RECUSADO: 'text-red-400',
  };

  return (
    <div className="space-y-8">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <StatCard title="Volume Comprado (30 dias)" icon={<Package className="h-4 w-4 text-app-accent" />} value={loading ? null : `${stats.volume30.toFixed(0)} kg`} sub="Nos últimos 30 dias" />
        <StatCard title="Valor Pago (30 dias)" icon={<DollarSign className="h-4 w-4 text-app-accent" />} value={loading ? null : fmt(stats.spend30)} sub="Nos últimos 30 dias" />
        <StatCard title="Fornecedores" icon={<Users className="h-4 w-4 text-app-accent" />} value={loading ? null : String(stats.suppliers)} sub="Produtores com quem negociou" />
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7 pt-4">
        <Card className="col-span-4 p-0 gap-0 shadow-2xl border-2 border-[#d36101] bg-[#703200] text-white overflow-hidden rounded-[24px]">
          <CardHeader className="rounded-none bg-[#d36101] border-b border-white/10 px-6 py-5 text-left m-0">
            <CardTitle className="text-xl flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-white" />
              Histórico de Compras
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {loading ? (
              <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 text-app-accent animate-spin" /></div>
            ) : recentOrders.length === 0 ? (
              <div className="text-center py-10 text-white/70 bg-[#4a2000] rounded-[20px] shadow-sm border border-white/10">Nenhuma compra recente.</div>
            ) : (
              <div className="space-y-3">
                {recentOrders.map(o => (
                  <div key={o.id} className="flex items-center justify-between bg-[#4a2000] rounded-[16px] px-5 py-3 border border-white/10">
                    <div>
                      <p className="text-sm font-bold text-white">Compra #{o.id.slice(0, 8).toUpperCase()}</p>
                      <p className="text-xs text-white/50">{o.createdAt?.toDate?.().toLocaleDateString('pt-BR') ?? '--'} · {o.quantityKg ?? '--'} kg</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-white">{fmt(Number(o.totalAmount || 0))}</p>
                      <p className={`text-xs font-semibold ${statusColor[o.status] || 'text-white/50'}`}>{statusLabel[o.status] || o.status}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="col-span-3 p-0 gap-0 shadow-2xl border-2 border-[#d36101] bg-[#703200] text-white overflow-hidden rounded-[24px]">
          <CardHeader className="rounded-none bg-[#d36101] border-b border-white/10 px-6 py-5 text-left m-0">
            <CardTitle className="text-xl flex items-center gap-2">
              <Users className="w-5 h-5 text-white" />
              Tipos de Queijo de Interesse
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {profile.cheeseTypes && profile.cheeseTypes.length > 0 ? (
              <div className="space-y-3">
                {profile.cheeseTypes.map((type: string) => (
                  <div key={type} className="flex items-center justify-between bg-[#4a2000] rounded-[16px] px-5 py-3 border border-white/10">
                    <span className="text-sm font-bold text-white capitalize">{type}</span>
                    <span className="text-xs text-white/50 uppercase tracking-wider">Demanda Ativa</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10 text-white/70 bg-[#4a2000] rounded-[20px] shadow-sm border border-white/10">
                Nenhum fornecedor ainda.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ─── SHARED ──────────────────────────────────────────────────────────────────

function StatCard({ title, icon, value, sub }: { title: string; icon: React.ReactNode; value: string | null; sub: string }) {
  return (
    <Card className="p-0 gap-0 shadow-2xl border-2 border-[#d36101] bg-[#703200] text-white overflow-hidden rounded-[24px]">
      <CardHeader className="rounded-none flex flex-row items-center justify-between space-y-0 px-6 py-5 bg-[#d36101] border-b border-white/10 m-0">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent className="p-6">
        {value === null ? (
          <Loader2 className="w-5 h-5 text-app-accent animate-spin" />
        ) : (
          <div className="text-2xl font-bold">{value}</div>
        )}
        <p className="text-xs text-white/70 mt-1">{sub}</p>
      </CardContent>
    </Card>
  );
}
