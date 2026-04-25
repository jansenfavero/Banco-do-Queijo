import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { ShoppingCart, Package, DollarSign, Activity } from 'lucide-react';

export function Orders() {
  const { profile } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Status computation for stats
  const [stats, setStats] = useState({ totalOrders: 0, pendingOrders: 0, totalVolume: 0, totalValue: 0 });

  useEffect(() => {
    if (!profile) return;

    let q;
    if (profile.role === 'ADMIN') {
      q = query(collection(db, 'orders'));
    } else {
      const field = profile.role === 'PRODUTOR' ? 'produtorId' : 'compradorId';
      q = query(collection(db, 'orders'), where(field, '==', profile.id));
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ords: any[] = [];
      let totalAmount = 0;
      let totalVolume = 0;
      let pendingOrders = 0;
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        ords.push({ id: doc.id, ...data });
        
        if (data.status !== 'RECUSADO') {
          totalAmount += Number(data.totalAmount || 0);
          totalVolume += Number(data.quantityKg || 0);
        }
        if (data.status === 'PENDENTE') {
          pendingOrders += 1;
        }
      });
      
      // Sort by createdAt client-side for now
      ords.sort((a, b) => b.createdAt?.toMillis() - a.createdAt?.toMillis());
      setOrders(ords);
      
      setStats({
        totalOrders: ords.length,
        pendingOrders,
        totalVolume,
        totalValue: totalAmount
      });
      
      setLoading(false);
    }, (error) => {
      console.error("Error fetching orders:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [profile]);

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'PENDENTE': return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Pendente</Badge>;
      case 'ACEITO': return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Aceito</Badge>;
      case 'EM_TRANSITO': return <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">Em Trânsito</Badge>;
      case 'ENTREGUE': return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Entregue</Badge>;
      case 'RECUSADO': return <Badge variant="destructive">Recusado</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  return (
    <div className="space-y-8 p-6 md:p-10 w-full max-w-7xl mx-auto">
      <div className="flex items-center gap-4">
        <div className="p-3 bg-app-cardDark rounded-2xl border-2 border-[#d36101] shadow-sm shrink-0">
          <ShoppingCart className="h-8 w-8 text-app-accent" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-1">
            {profile?.role === 'ATACADISTA' ? 'Minhas Compras' : profile?.role === 'PRODUTOR' ? 'Pedidos Recebidos' : 'Todos os Pedidos'}
          </h1>
          <p className="text-white/70 text-sm md:text-base">
            Acompanhe o status e histórico das transações.
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="p-0 gap-0 shadow-2xl border-2 border-[#d36101] bg-[#703200] text-white overflow-hidden rounded-[24px]">
          <CardHeader className="rounded-none flex flex-row items-center justify-between space-y-0 px-6 py-5 bg-[#d36101] border-b border-white/10 m-0">
            <CardTitle className="text-sm font-medium">Transações Totais</CardTitle>
            <DollarSign className="h-4 w-4 text-app-accent" />
          </CardHeader>
          <CardContent className="p-6">
            <div className="text-2xl font-bold">{loading ? '--' : fmt(stats.totalValue)}</div>
            <p className="text-xs text-white/70 mt-1">Acumulado geral</p>
          </CardContent>
        </Card>

        <Card className="p-0 gap-0 shadow-2xl border-2 border-[#d36101] bg-[#703200] text-white overflow-hidden rounded-[24px]">
          <CardHeader className="rounded-none flex flex-row items-center justify-between space-y-0 px-6 py-5 bg-[#d36101] border-b border-white/10 m-0">
            <CardTitle className="text-sm font-medium">Volume Adquirido</CardTitle>
            <Package className="h-4 w-4 text-app-accent" />
          </CardHeader>
          <CardContent className="p-6">
            <div className="text-2xl font-bold">{loading ? '--' : `${stats.totalVolume.toFixed(0)} kg`}</div>
            <p className="text-xs text-white/70 mt-1">Total de queijo transacionado</p>
          </CardContent>
        </Card>

        <Card className="p-0 gap-0 shadow-2xl border-2 border-[#d36101] bg-[#703200] text-white overflow-hidden rounded-[24px]">
          <CardHeader className="rounded-none flex flex-row items-center justify-between space-y-0 px-6 py-5 bg-[#d36101] border-b border-white/10 m-0">
            <CardTitle className="text-sm font-medium">Pedidos Cadastrados</CardTitle>
            <ShoppingCart className="h-4 w-4 text-app-accent" />
          </CardHeader>
          <CardContent className="p-6">
            <div className="text-2xl font-bold">{loading ? '--' : stats.totalOrders}</div>
            <p className="text-xs text-white/70 mt-1">Registros no histórico</p>
          </CardContent>
        </Card>

        <Card className="p-0 gap-0 shadow-2xl border-2 border-[#d36101] bg-[#703200] text-white overflow-hidden rounded-[24px]">
          <CardHeader className="rounded-none flex flex-row items-center justify-between space-y-0 px-6 py-5 bg-[#d36101] border-b border-white/10 m-0">
            <CardTitle className="text-sm font-medium">Aguardando Ação</CardTitle>
            <Activity className="h-4 w-4 text-app-accent" />
          </CardHeader>
          <CardContent className="p-6">
            <div className="text-2xl font-bold text-yellow-400">{loading ? '--' : stats.pendingOrders}</div>
            <p className="text-xs text-white/70 mt-1">Pedidos pendentes</p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <Card className="p-0 gap-0 shadow-2xl border-2 border-[#d36101] bg-[#703200] text-white rounded-[24px] overflow-hidden">
          <CardHeader className="rounded-t-[24px] bg-[#d36101] border-b border-white/10 px-6 py-5 text-left m-0">
            <CardTitle className="text-xl text-white flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-white" />
              Histórico de Pedidos
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 sm:p-8">
            {loading ? (
              <div className="flex justify-center py-10 text-white/70">Carregando pedidos...</div>
            ) : orders.length === 0 ? (
              <div className="text-center py-10 text-white/70 bg-[#4a2000] rounded-[20px] shadow-sm border border-white/10 w-full flex flex-col items-center gap-2">
                 <ShoppingCart className="h-10 w-10 text-white/30 mb-2" />
                 <h3 className="text-lg font-bold text-white">
                  {profile?.role === 'ATACADISTA' ? 'Nenhuma compra encontrada' : 'Nenhum pedido encontrado'}
                 </h3>
                 <p className="text-sm">
                  {profile?.role === 'ATACADISTA' ? 'Você ainda não possui histórico de compras.' : 'Você ainda não possui histórico de pedidos.'}
                 </p>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map((order) => (
                  <div key={order.id} className="bg-[#4a2000] rounded-[20px] p-6 border border-white/10 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 transition-all hover:border-[#d36101]">
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center gap-3">
                        <h3 className="text-[17px] font-bold text-white">
                          Pedido #{order.id.slice(0, 8).toUpperCase()}
                        </h3>
                        {getStatusBadge(order.status)}
                      </div>
                      <p className="text-sm text-white/60 font-medium">
                        Efetuado em: {order.createdAt?.toDate().toLocaleDateString('pt-BR')}  às {order.createdAt?.toDate().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                      <div className="flex flex-wrap gap-4 pt-1">
                        <div className="bg-black/20 px-3 py-1.5 rounded-lg border border-white/5">
                          <p className="text-[11px] text-white/50 uppercase tracking-wider font-bold mb-0.5">Produto ID</p>
                          <p className="text-[13px] text-white">{order.productId}</p>
                        </div>
                        <div className="bg-black/20 px-3 py-1.5 rounded-lg border border-white/5">
                          <p className="text-[11px] text-white/50 uppercase tracking-wider font-bold mb-0.5">Tipo do Pagamento</p>
                          <p className="text-[13px] text-white">{order.paymentMethod}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center border-t border-white/10 md:border-none pt-4 md:pt-0 pb-1 md:pb-0">
                      <div className="text-left md:text-right">
                        <p className="text-[11px] text-white/50 uppercase tracking-wider font-bold mb-0.5">Valor Total</p>
                        <div className="font-bold text-[22px] text-app-accent leading-none">{fmt(order.totalAmount || 0)}</div>
                      </div>
                      <div className="text-right">
                        <p className="text-[11px] text-white/50 uppercase tracking-wider font-bold mb-0.5 md:mt-3">Volume Final</p>
                        <div className="text-sm font-bold text-white bg-black/30 px-3 py-1 rounded-full border border-white/10">{order.quantityKg} kg</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
