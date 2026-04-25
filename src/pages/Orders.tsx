import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { ShoppingCart } from 'lucide-react';

export function Orders() {
  const { profile } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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
      snapshot.forEach((doc) => {
        ords.push({ id: doc.id, ...doc.data() });
      });
      // Sort by createdAt client-side for now to avoid needing a composite index immediately
      ords.sort((a, b) => b.createdAt?.toMillis() - a.createdAt?.toMillis());
      setOrders(ords);
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

  return (
    <div className="space-y-8 p-6 md:p-10 max-w-7xl mx-auto">
      <div className="flex items-center gap-4">
        <div className="p-3 bg-app-cardDark rounded-2xl border-2 border-[#d36101] shadow-sm shrink-0">
          <ShoppingCart className="h-8 w-8 text-app-accent" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-1">
            Todos os Pedidos
          </h1>
          <p className="text-white/70 text-sm md:text-base">
            Acompanhe o status e histórico das transações.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-10 text-white">Carregando pedidos...</div>
      ) : orders.length === 0 ? (
        <div className="text-center py-20 bg-app-cardDark text-white rounded-[24px] border-2 border-[#d36101] shadow-2xl">
          <h3 className="text-lg font-bold">Nenhum pedido encontrado</h3>
          <p className="text-white/70 mt-1">
            Você ainda não possui histórico de pedidos.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <Card className="p-0 gap-0 shadow-2xl border-2 border-[#d36101] bg-[#703200] text-white rounded-[24px] overflow-hidden">
            <CardHeader className="rounded-t-[24px] bg-[#d36101] border-b border-white/10 px-6 py-5 text-left">
              <CardTitle className="text-xl text-white flex items-center gap-2">
                <ShoppingCart className="w-5 h-5" />
                Lista de Pedidos
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-8 px-8 pb-8 space-y-4">
              {orders.map((order) => (
                <div key={order.id} className="bg-[#4a2000] rounded-[20px] p-6 border border-app-accent/10 shadow-sm flex flex-col md:flex-row justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-bold flex items-center gap-2 text-app-accent mb-1">
                      Pedido #{order.id.slice(0, 8).toUpperCase()}
                      {getStatusBadge(order.status)}
                    </h3>
                    <p className="text-sm text-white/70 font-medium">
                      Efetuado em: {order.createdAt?.toDate().toLocaleDateString('pt-BR')}
                    </p>
                    <div className="mt-3 text-sm text-white/80 space-y-1">
                      <p><strong>Produto ID:</strong> {order.productId}</p>
                      <p><strong>Pagamento:</strong> {order.paymentMethod}</p>
                    </div>
                  </div>
                  <div className="text-left md:text-right">
                    <div className="font-bold text-2xl text-white">R$ {order.totalAmount?.toFixed(2)}</div>
                    <div className="text-sm text-white/70 uppercase tracking-wider">{order.quantityKg} kg</div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
