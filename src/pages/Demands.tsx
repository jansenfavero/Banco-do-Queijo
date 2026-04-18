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
import { toast } from 'sonner';
import { Megaphone } from 'lucide-react';

export function Demands() {
  const { profile } = useAuth();
  const [demands, setDemands] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  useEffect(() => {
    let q;
    if (profile?.role === 'ADMIN') {
      q = query(collection(db, 'demands'));
    } else {
      q = query(collection(db, 'demands'), where('active', '==', true));
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const dems: any[] = [];
      snapshot.forEach((doc) => {
        dems.push({ id: doc.id, ...doc.data() });
      });
      setDemands(dems);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching demands:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-2">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-card rounded-2xl border border-border/50 shadow-sm shrink-0">
            <Megaphone className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-primary mb-1">Todas as Demandas</h1>
            <p className="text-muted-foreground text-sm md:text-base">
              {profile?.role === 'ATACADISTA' ? 'Publique o que você precisa e receba propostas.' : 'Encontre compradores buscando fornecedores.'}
            </p>
          </div>
        </div>
        {profile?.role === 'ATACADISTA' && (
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>Nova Demanda</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Publicar Necessidade</DialogTitle>
                <DialogDescription>
                  Descreva o que você está buscando para que produtores possam te encontrar.
                </DialogDescription>
              </DialogHeader>
              <AddDemandForm onSuccess={() => setIsAddDialogOpen(false)} />
            </DialogContent>
          </Dialog>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-10">Carregando demandas...</div>
      ) : demands.length === 0 ? (
        <div className="text-center py-20 bg-[#703200] text-white rounded-[24px] border-none shadow-2xl">
          <h3 className="text-lg font-bold">Nenhuma demanda ativa</h3>
          <p className="text-white/70 mt-1">
            Não há compradores buscando produtos no momento.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {demands.map((demand) => (
            <Card key={demand.id} className="shadow-2xl border-none bg-[#703200] text-white rounded-[24px] overflow-hidden flex flex-col">
              <CardHeader className="bg-black/10 border-b border-white/10 pb-4">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-xl text-app-accent">{demand.cheeseType}</CardTitle>
                  <Badge variant="secondary" className="bg-[#4a2000] text-white hover:bg-[#4a2000]/80 border-none">{demand.quantityKg} kg</Badge>
                </div>
                <CardDescription className="text-white/70">{demand.region}</CardDescription>
              </CardHeader>
              <CardContent className="pt-6 flex-1">
                <div className="space-y-3 text-sm bg-[#4a2000] p-4 rounded-[20px] shadow-sm border border-white/10">
                  <div className="flex justify-between">
                    <span className="text-white/70 font-semibold">Frequência:</span>
                    <span className="font-bold text-white">{demand.frequency}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/70 font-semibold">Pagamento:</span>
                    <span className="font-bold text-white">{demand.paymentMethod}</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="pb-6">
                {profile?.role === 'PRODUTOR' ? (
                  <Button className="w-full bg-app-accent text-app-bgDark hover:bg-app-accentHover font-bold rounded-xl">Tenho Interesse</Button>
                ) : demand.compradorId === profile?.id ? (
                  <Button variant="outline" className="w-full border-red-500/50 text-red-300 hover:bg-red-500/20 rounded-xl">Encerrar Demanda</Button>
                ) : null}
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function AddDemandForm({ onSuccess }: { onSuccess: () => void }) {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    cheeseType: '',
    quantityKg: '',
    frequency: '',
    region: '',
    paymentMethod: 'PIX'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    setLoading(true);
    try {
      await addDoc(collection(db, 'demands'), {
        compradorId: profile.id,
        cheeseType: formData.cheeseType,
        quantityKg: parseFloat(formData.quantityKg),
        frequency: formData.frequency,
        region: formData.region,
        paymentMethod: formData.paymentMethod,
        fachadaPhoto: 'placeholder.jpg',
        active: true,
        createdAt: serverTimestamp()
      });
      toast.success('Demanda publicada com sucesso!');
      onSuccess();
    } catch (error: any) {
      console.error(error);
      toast.error('Erro ao publicar demanda: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="cheeseType">Tipo de Queijo Buscado</Label>
        <Input id="cheeseType" value={formData.cheeseType} onChange={(e) => setFormData({...formData, cheeseType: e.target.value})} required placeholder="Ex: Muçarela, Canastra..." />
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="quantityKg">Volume (Kg)</Label>
          <Input id="quantityKg" type="number" min="1" value={formData.quantityKg} onChange={(e) => setFormData({...formData, quantityKg: e.target.value})} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="frequency">Frequência</Label>
          <Input id="frequency" value={formData.frequency} onChange={(e) => setFormData({...formData, frequency: e.target.value})} required placeholder="Ex: Semanal, Mensal..." />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="region">Região de Entrega</Label>
        <Input id="region" value={formData.region} onChange={(e) => setFormData({...formData, region: e.target.value})} required placeholder="Ex: São Paulo - SP, Capital..." />
      </div>

      <DialogFooter className="pt-4">
        <Button type="button" variant="outline" onClick={onSuccess}>Cancelar</Button>
        <Button type="submit" disabled={loading}>{loading ? 'Publicando...' : 'Publicar Demanda'}</Button>
      </DialogFooter>
    </form>
  );
}
