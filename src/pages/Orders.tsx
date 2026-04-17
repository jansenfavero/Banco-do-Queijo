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
    <div className="space-y-6">
      <div className="flex items-center gap-4 mb-8">
        <div className="p-3 bg-card rounded-2xl border border-border/50 shadow-sm shrink-0">
          <ShoppingCart className="h-8 w-8 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary mb-1">
            Todos os Pedidos
          </h1>
          <p className="text-muted-foreground text-sm md:text-base">
            Acompanhe o status e histórico das transações.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-10">Carregando pedidos...</div>
      ) : orders.length === 0 ? (
        <div className="text-center py-20 bg-card rounded-lg border border-dashed border-border/50">
          <h3 className="text-lg font-medium">Nenhum pedido encontrado</h3>
          <p className="text-muted-foreground mt-1">
            Você ainda não possui histórico de pedidos.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <Card key={order.id}>
              <CardHeader className="pb-2 flex flex-row items-start justify-between">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    Pedido #{order.id.slice(0, 8).toUpperCase()}
                    {getStatusBadge(order.status)}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    {order.createdAt?.toDate().toLocaleDateString('pt-BR')}
                  </p>
                </div>
                <div className="text-right">
                  <div className="font-bold text-lg">R$ {order.totalAmount.toFixed(2)}</div>
                  <div className="text-sm text-muted-foreground">{order.quantityKg} kg</div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-sm">
                  <p><strong>Produto ID:</strong> {order.productId}</p>
                  <p><strong>Pagamento:</strong> {order.paymentMethod}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
