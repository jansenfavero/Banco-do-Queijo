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
import { Store, Slice } from 'lucide-react';

export function Catalog() {
  const { profile } = useAuth();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  useEffect(() => {
    let q;
    if (profile?.role === 'ADMIN') {
      q = query(collection(db, 'products'));
    } else if (profile?.role === 'PRODUTOR') {
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
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-2">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-card rounded-2xl border border-border/50 shadow-sm shrink-0">
            {profile?.role === 'PRODUTOR' ? <Slice className="h-8 w-8 text-primary" /> : <Store className="h-8 w-8 text-primary" />}
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-primary mb-1">
              {profile?.role === 'PRODUTOR' ? 'Publicar Queijo' : 'Catálogo Geral'}
            </h1>
            <p className="text-muted-foreground text-sm md:text-base">
              {profile?.role === 'PRODUTOR' ? 'Gerencie sua produção e publicação.' : 'Encontre os melhores queijos artesanais.'}
            </p>
          </div>
        </div>
        {profile?.role === 'PRODUTOR' && (
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-full">
                Publicar Queijo
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] bg-[#d36101] border-none text-white shadow-2xl" overlayClassName="bg-[#4a2000]/80 backdrop-blur-sm">
              <DialogHeader>
                <DialogTitle className="text-2xl">Publicar Queijo</DialogTitle>
                <DialogDescription className="text-white/80">
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
        <div className="text-center py-20 bg-card rounded-lg border border-dashed border-border/50">
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

import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Camera, Image as ImageIcon, Check, CheckCircle2, Save, Upload, X } from 'lucide-react';
import { useRef } from 'react';

function AddProductForm({ onSuccess }: { onSuccess: () => void }) {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [savingAsDraft, setSavingAsDraft] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    if (images.length + files.length > 5) {
      toast.error('Você pode enviar no máximo 5 imagens.');
      return;
    }

    setUploading(true);
    const storage = getStorage();
    const newImages = [...images];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const imageRef = storageRef(storage, `products/${profile?.id}/${Date.now()}_${file.name}`);
        await uploadBytes(imageRef, file);
        const url = await getDownloadURL(imageRef);
        newImages.push(url);
      }
      setImages(newImages);
      toast.success('Imagens enviadas com sucesso!');
    } catch (error) {
      console.error(error);
      toast.error('Erro ao enviar imagens.');
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = (index: number) => {
    const newImages = [...images];
    newImages.splice(index, 1);
    setImages(newImages);
  };

  const submitAction = async (isDraft: boolean) => {
    if (!profile) return;
    
    // allow draft if not validated? Let's say yes for now, but not active.
    if (!isDraft && profile.kycStatus !== 'VALIDADO') {
      toast.error('Você precisa ter o cadastro validado para publicar anúncios. Tente salvar sem publicar.');
      return;
    }

    if (images.length === 0 && !isDraft) {
      toast.error('Adicione pelo menos 1 imagem para publicar.');
      return;
    }

    if (isDraft) setSavingAsDraft(true);
    else setLoading(true);

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
        paymentMethods: ['PIX', 'BOLETO'],
        photos: images,
        active: !isDraft, // false if draft
        createdAt: serverTimestamp()
      });
      toast.success(isDraft ? 'Salvo em rascunhos!' : 'Queijo publicado com sucesso!');
      onSuccess();
    } catch (error: any) {
      console.error(error);
      toast.error('Erro ao salvar anúncio: ' + error.message);
    } finally {
      setLoading(false);
      setSavingAsDraft(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="cheeseType" className="text-white">Tipo de Queijo</Label>
          <Input id="cheeseType" value={formData.cheeseType} onChange={(e) => setFormData({...formData, cheeseType: e.target.value})} required placeholder="Ex: Canastra, Coalho..." className="bg-black/20 border-white/10 text-white placeholder:text-white/40 focus:ring-white/20 hover:bg-black/30" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="format" className="text-white">Formato</Label>
          <Input id="format" value={formData.format} onChange={(e) => setFormData({...formData, format: e.target.value})} required placeholder="Ex: Barra 1kg..." className="bg-black/20 border-white/10 text-white placeholder:text-white/40 focus:ring-white/20 hover:bg-black/30" />
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="pricePerKg" className="text-white">Preço por Kg (R$)</Label>
          <Input id="pricePerKg" type="number" step="0.01" min="0" value={formData.pricePerKg} onChange={(e) => setFormData({...formData, pricePerKg: e.target.value})} required className="bg-black/20 border-white/10 text-white placeholder:text-white/40 focus:ring-white/20 hover:bg-black/30" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="availableKg" className="text-white">Qtd Disponível (Kg)</Label>
          <Input id="availableKg" type="number" step="0.1" min="0" value={formData.availableKg} onChange={(e) => setFormData({...formData, availableKg: e.target.value})} required className="bg-black/20 border-white/10 text-white placeholder:text-white/40 focus:ring-white/20 hover:bg-black/30" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="vacuumPacked" className="text-white">Embalagem a Vácuo?</Label>
          <Select value={formData.vacuumPacked} onValueChange={(v) => setFormData({...formData, vacuumPacked: v})}>
            <SelectTrigger className="bg-black/20 border-white/10 text-white focus:ring-white/20 hover:bg-black/30"><SelectValue /></SelectTrigger>
            <SelectContent className="bg-[#4a2000] border-white/10 text-white">
              <SelectItem value="true">Sim</SelectItem>
              <SelectItem value="false">Não</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="labelType" className="text-white">Rótulo SIE?</Label>
          <Select value={formData.labelType} onValueChange={(v) => setFormData({...formData, labelType: v})}>
            <SelectTrigger className="bg-black/20 border-white/10 text-white focus:ring-white/20 hover:bg-black/30"><SelectValue /></SelectTrigger>
            <SelectContent className="bg-[#4a2000] border-white/10 text-white">
              <SelectItem value="COMPLETO_SIE">Sim (SIE)</SelectItem>
              <SelectItem value="SIMPLES">Não (Simples)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-white">Fotos do Queijo (Até 5)</Label>
        <div className="grid grid-cols-5 gap-2">
          {images.map((img, index) => (
            <div key={index} className="relative aspect-square rounded-md overflow-hidden bg-black/20 border border-white/20">
              <img src={img} alt={`Upload ${index + 1}`} className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => handleRemoveImage(index)}
                className="absolute top-1 right-1 p-1 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
                title="Remover"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
          {images.length < 5 && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="aspect-square rounded-md border border-dashed border-white/30 flex flex-col items-center justify-center text-white/50 hover:text-white hover:border-white/50 hover:bg-white/5 transition-colors disabled:opacity-50"
            >
              <Camera className="w-5 h-5 mb-1" />
              <span className="text-[10px] leading-tight text-center px-1">
                {uploading ? 'Enviando...' : 'Add Foto'}
              </span>
            </button>
          )}
        </div>
        <input
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          ref={fileInputRef}
          onChange={handleImageUpload}
        />
      </div>

      <DialogFooter className="pt-4 flex flex-col sm:flex-row gap-2 sm:gap-0 mt-4">
        <Button 
          type="button" 
          variant="outline" 
          className="border-none bg-[#4a2000] text-white hover:bg-[#3a1800] hover:text-white rounded-full font-bold mr-auto" 
          onClick={onSuccess}
        >
          Cancelar
        </Button>
        <div className="flex gap-2">
          <Button 
            type="button" 
            variant="outline"
            className="border-white/20 bg-black/20 text-white hover:bg-black/40 hover:text-white rounded-full font-bold" 
            onClick={() => submitAction(true)}
            disabled={loading || savingAsDraft}
          >
            <Save className="w-4 h-4 mr-2" />
            {savingAsDraft ? 'Salvando...' : 'Salvar Sem Publicar'}
          </Button>
          <Button 
            type="button"
            className="bg-[#ffcb05] text-[#4a2000] hover:bg-[#ffb000] rounded-full font-bold" 
            onClick={() => submitAction(false)}
            disabled={loading || savingAsDraft}
          >
            <CheckCircle2 className="w-4 h-4 mr-2" />
            {loading ? 'Publicando...' : 'Publicar Agora'}
          </Button>
        </div>
      </DialogFooter>
    </div>
  );
}
