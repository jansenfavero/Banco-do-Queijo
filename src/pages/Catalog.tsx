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

export function Catalog() {
  const { profile } = useAuth();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  useEffect(() => {
    let q;
    if (profile?.role === 'PRODUTOR') {
      q = query(collection(db, 'products'), where('produtorId', '==', profile.id));
    } else {
      q = query(collection(db, 'products'), where('active', '==', true));
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const prods: any[] = [];
      snapshot.forEach((doc) => {
        prods.push({ id: doc.id, ...doc.data() });
      });
      setProducts(prods);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching products:", error);
      toast.error("Erro ao carregar catálogo.");
      setLoading(false);
    });

    return () => unsubscribe();
  }, [profile]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Catálogo de Queijos</h1>
          <p className="text-muted-foreground">
            {profile?.role === 'PRODUTOR' ? 'Gerencie seus anúncios.' : 'Encontre os melhores queijos artesanais.'}
          </p>
        </div>
        {profile?.role === 'PRODUTOR' && (
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>Novo Anúncio</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Criar Novo Anúncio</DialogTitle>
                <DialogDescription>
                  Preencha os detalhes do seu produto para listá-lo no catálogo.
                </DialogDescription>
              </DialogHeader>
              <AddProductForm onSuccess={() => setIsAddDialogOpen(false)} />
            </DialogContent>
          </Dialog>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-10">Carregando catálogo...</div>
      ) : products.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-lg border border-dashed">
          <h3 className="text-lg font-medium">Nenhum produto encontrado</h3>
          <p className="text-muted-foreground mt-1">
            {profile?.role === 'PRODUTOR' ? 'Você ainda não possui anúncios ativos.' : 'Não há produtos disponíveis no momento.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} role={profile?.role} />
          ))}
        </div>
      )}
    </div>
  );
}

function ProductCard({ product, role }: { key?: React.Key, product: any, role?: string }) {
  return (
    <Card className="overflow-hidden flex flex-col">
      <div className="aspect-video bg-muted relative">
        {product.photos && product.photos.length > 0 ? (
          <img src={product.photos[0]} alt={product.cheeseType} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-orange-100 text-orange-300">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
          </div>
        )}
        {!product.active && (
          <div className="absolute top-2 right-2">
            <Badge variant="destructive">Inativo</Badge>
          </div>
        )}
      </div>
      <CardHeader className="p-4 pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg">{product.cheeseType}</CardTitle>
          <span className="font-bold text-primary">R$ {product.pricePerKg.toFixed(2)}/kg</span>
        </div>
        <CardDescription>{product.format}</CardDescription>
      </CardHeader>
      <CardContent className="p-4 pt-2 flex-1">
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Disponível:</span>
            <span className="font-medium">{product.availableKg} kg</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Embalagem:</span>
            <span>{product.vacuumPacked ? 'Vácuo' : 'Normal'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Rótulo:</span>
            <span>{product.labelType === 'COMPLETO_SIE' ? 'SIE' : 'Simples'}</span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0 border-t mt-auto">
        {role === 'ATACADISTA' ? (
          <Button className="w-full mt-4">Fazer Pedido</Button>
        ) : (
          <Button variant="outline" className="w-full mt-4">Editar Anúncio</Button>
        )}
      </CardFooter>
    </Card>
  );
}

function AddProductForm({ onSuccess }: { onSuccess: () => void }) {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    cheeseType: '',
    format: '',
    pricePerKg: '',
    availableKg: '',
    vacuumPacked: 'false',
    labelType: 'SIMPLES',
    sliceable: 'false',
    deliveryType: 'entrego'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    
    if (profile.kycStatus !== 'VALIDADO') {
      toast.error('Você precisa ter o cadastro validado para criar anúncios.');
      return;
    }

    setLoading(true);
    try {
      await addDoc(collection(db, 'products'), {
        produtorId: profile.id,
        cheeseType: formData.cheeseType,
        format: formData.format,
        pricePerKg: parseFloat(formData.pricePerKg),
        availableKg: parseFloat(formData.availableKg),
        vacuumPacked: formData.vacuumPacked === 'true',
        labelType: formData.labelType,
        sliceable: formData.sliceable === 'true',
        deliveryType: formData.deliveryType,
        paymentMethods: ['PIX', 'BOLETO'], // Default for MVP
        photos: [], // Empty for now, would need Storage upload
        active: true,
        createdAt: serverTimestamp()
      });
      toast.success('Anúncio criado com sucesso!');
      onSuccess();
    } catch (error: any) {
      console.error(error);
      toast.error('Erro ao criar anúncio: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="cheeseType">Tipo de Queijo</Label>
          <Input id="cheeseType" value={formData.cheeseType} onChange={(e) => setFormData({...formData, cheeseType: e.target.value})} required placeholder="Ex: Canastra, Coalho..." />
        </div>
        <div className="space-y-2">
          <Label htmlFor="format">Formato</Label>
          <Input id="format" value={formData.format} onChange={(e) => setFormData({...formData, format: e.target.value})} required placeholder="Ex: Barra 1kg, Redondo 500g..." />
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="pricePerKg">Preço por Kg (R$)</Label>
          <Input id="pricePerKg" type="number" step="0.01" min="0" value={formData.pricePerKg} onChange={(e) => setFormData({...formData, pricePerKg: e.target.value})} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="availableKg">Quantidade Disponível (Kg)</Label>
          <Input id="availableKg" type="number" step="0.1" min="0" value={formData.availableKg} onChange={(e) => setFormData({...formData, availableKg: e.target.value})} required />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="vacuumPacked">Embalagem a Vácuo?</Label>
          <Select value={formData.vacuumPacked} onValueChange={(v) => setFormData({...formData, vacuumPacked: v})}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="true">Sim</SelectItem>
              <SelectItem value="false">Não</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="labelType">Rótulo SIE?</Label>
          <Select value={formData.labelType} onValueChange={(v) => setFormData({...formData, labelType: v})}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="COMPLETO_SIE">Sim (SIE)</SelectItem>
              <SelectItem value="SIMPLES">Não (Simples)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <DialogFooter className="pt-4">
        <Button type="button" variant="outline" onClick={onSuccess}>Cancelar</Button>
        <Button type="submit" disabled={loading}>{loading ? 'Salvando...' : 'Salvar Anúncio'}</Button>
      </DialogFooter>
    </form>
  );
}
