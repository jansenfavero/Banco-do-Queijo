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

import { MOCK_PRODUCTS, MOCK_WHOLESALERS } from './CatalogPublic';
import { Star, MapPin } from 'lucide-react';

export function Catalog() {
  const { profile } = useAuth();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'produtores' | 'atacadistas'>('produtores');

  useEffect(() => {
    let q;
    if (profile?.role === 'ADMIN') {
      q = query(collection(db, 'products'));
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
      toast.error("Erro ao carregar vitrine.");
      setLoading(false);
    });

    return () => unsubscribe();
  }, [profile]);

  return (
    <div className="space-y-8 bg-app-cardDark min-h-screen p-4 md:p-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-app-card rounded-2xl border border-app-accent/20 shadow-sm shrink-0">
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
        {profile?.role === 'PRODUTOR' && (
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-app-accent hover:bg-app-accentHover text-app-bgDark font-bold rounded-full">
                Publicar Queijo
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] bg-[#d36101] border-none text-white shadow-2xl rounded-2xl" overlayClassName="bg-[#4a2000]/80 backdrop-blur-sm">
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

      <div className="flex bg-app-cardDark p-1.5 rounded-2xl border border-[#4a2000] w-fit shadow-lg">
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

      {loading ? (
        <div className="flex justify-center py-10 text-white">Carregando catálogo...</div>
      ) : activeTab === 'produtores' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} role={profile?.role} />
          ))}
          {MOCK_PRODUCTS.map((prod) => (
            <div key={prod.id} className="group rounded-[24px] bg-app-cardDark border shadow-2xl transition-all border-[#4a2000] duration-300 hover:-translate-y-1 flex flex-col">
              <div className="relative mx-4 mt-4 aspect-[4/3] rounded-[16px] overflow-hidden">
                <img src={prod.imagem} alt={prod.nome} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" loading="lazy" />
                <div className="absolute top-3 left-3 flex gap-2">
                  <span className="px-2 py-1 bg-[#4a2000]/90 backdrop-blur-sm rounded-md text-xs font-bold text-app-accent shadow-sm capitalize border border-app-accent/20">
                    {prod.categoria}
                  </span>
                </div>
                <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 bg-app-accent rounded-md text-xs font-bold text-app-bgDark shadow-sm">
                  <Star className="w-3 h-3 fill-current" /> {prod.avaliacao}
                </div>
              </div>
              <div className="p-5 flex flex-col flex-1 bg-app-cardDark rounded-b-[24px]">
                <h3 className="font-bold text-lg leading-tight mb-2 group-hover:text-app-accent transition-colors text-white">{prod.nome}</h3>
                <p className="text-sm text-white/70 mb-4 font-medium flex-1">{prod.produtor}</p>
                <div className="flex items-center gap-2 text-xs text-white/70 mb-4 bg-[#4a2000] p-2 rounded-[15px] border border-app-accent/10 w-fit">
                  <MapPin className="w-4 h-4 text-app-accent" />
                  <span>{prod.local}</span>
                </div>
                <div className="flex items-center justify-between mt-auto pt-4 border-t border-[#4a2000]">
                  <div>
                    <span className="text-xs text-white/50 uppercase tracking-wider block mb-0.5">R$ / Kg</span>
                    <span className="font-bold text-xl text-white">R$ {prod.preco.toFixed(2)}</span>
                  </div>
                  <button className="w-10 h-10 rounded-full bg-app-accent flex items-center justify-center text-app-bgDark hover:bg-app-accentHover transition-colors">
                    <Store className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {MOCK_WHOLESALERS.map((wholesaler) => (
             <div key={wholesaler.id} className="group rounded-[24px] bg-app-cardDark border shadow-2xl transition-all border-[#4a2000] duration-300 hover:-translate-y-1 flex flex-col">
              <div className="relative mx-4 mt-4 aspect-[4/3] rounded-[16px] overflow-hidden">
                <img src={wholesaler.imagem} alt={wholesaler.empresa} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" loading="lazy" />
                <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 bg-app-accent rounded-md text-xs font-bold text-app-bgDark shadow-sm">
                  <Star className="w-3 h-3 fill-current" /> {wholesaler.avaliacao}
                </div>
              </div>
              <div className="p-5 flex flex-col flex-1 bg-app-cardDark rounded-b-[24px]">
                <h3 className="font-bold text-lg leading-tight mb-2 group-hover:text-app-accent transition-colors text-white">{wholesaler.empresa}</h3>
                <p className="text-sm text-white/70 mb-4 font-medium flex-1">Comprador: {wholesaler.comprador}</p>
                <div className="flex items-center gap-2 text-xs text-white/70 mb-4 bg-[#4a2000] p-2 rounded-[15px] border border-app-accent/10 w-fit">
                  <MapPin className="w-4 h-4 text-app-accent" />
                  <span>{wholesaler.local}</span>
                </div>
                <div className="flex items-center justify-between mt-auto pt-4 border-t border-[#4a2000]">
                  <div>
                    <span className="text-xs text-white/50 uppercase tracking-wider block mb-0.5">Volume Demandado</span>
                    <span className="font-bold text-lg text-white">{wholesaler.quantidade} kg/mês</span>
                  </div>
                  <button className="px-4 py-2 rounded-xl bg-app-accent text-app-bgDark font-bold hover:bg-app-accentHover transition-colors text-sm">
                    Fazer Oferta
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ProductCard({ product, role }: { key?: React.Key, product: any, role?: string }) {
  return (
    <Card className="overflow-hidden flex flex-col shadow-2xl border border-[#4a2000] bg-app-cardDark text-white rounded-[24px]">
      <div className="aspect-[4/3] relative rounded-[16px] mx-4 mt-4 overflow-hidden">
        {product.photos && product.photos.length > 0 ? (
          <img src={product.photos[0]} alt={product.cheeseType} className="w-full h-full object-cover transition-transform duration-700 hover:scale-105" referrerPolicy="no-referrer" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-[#4a2000] text-app-accent/50">
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
      <CardHeader className="bg-app-cardDark border-none pt-4 px-4 pb-2 text-left">
        <div className="flex justify-between items-start w-full">
          <div>
            <CardTitle className="text-xl text-white group-hover:text-app-accent transition-colors">{product.cheeseType}</CardTitle>
            <CardDescription className="text-white/80 font-medium text-sm mt-1">{product.format}</CardDescription>
          </div>
           <span className="font-bold text-xl text-white">R$ {product.pricePerKg.toFixed(2)}<span className="text-xs text-white/50 tracking-wider font-normal"> / Kg</span></span>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-4 flex-1">
        <div className="space-y-3 text-sm bg-[#4a2000] p-4 rounded-[15px] border border-app-accent/10">
          <div className="flex justify-between border-b border-white/5 pb-2">
            <span className="text-white/70 font-semibold">Disponível:</span>
            <span className="font-bold text-white">{product.availableKg} kg</span>
          </div>
          <div className="flex justify-between border-b border-white/5 pb-2">
            <span className="text-white/70 font-semibold">Embalagem:</span>
            <span className="font-bold text-white">{product.vacuumPacked ? 'Vácuo' : 'Normal'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-white/70 font-semibold">Rótulo:</span>
            <span className="font-bold text-white">{product.labelType === 'COMPLETO_SIE' ? 'SIE' : 'Simples'}</span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0 mt-auto border-t border-[#4a2000] pt-4 items-center justify-between">
        {role === 'ATACADISTA' ? (
          <Button className="w-full bg-app-accent text-app-bgDark hover:bg-app-accentHover font-bold rounded-xl">Fazer Pedido</Button>
        ) : (
          <Button variant="outline" className="w-full text-white border-white/20 hover:bg-white/10 rounded-xl">Editar Anúncio</Button>
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
    packagingType: 'sem-rotulo',
    paymentMethods: [] as string[],
    sliceable: 'false',
    deliveryType: 'entrego'
  });

  const togglePaymentMethod = (method: string) => {
    if (method === 'Todos') {
      if (formData.paymentMethods.length === 4) {
        setFormData({ ...formData, paymentMethods: [] });
      } else {
        setFormData({ ...formData, paymentMethods: ['PIX', 'Dinheiro', 'Cartão', 'Boleto'] });
      }
      return;
    }

    const current = formData.paymentMethods;
    if (current.includes(method)) {
      setFormData({ ...formData, paymentMethods: current.filter(m => m !== method) });
    } else {
      setFormData({ ...formData, paymentMethods: [...current, method] });
    }
  };

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
        packagingType: formData.packagingType,
        paymentMethods: formData.paymentMethods,
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
          <Label htmlFor="cheeseType" className="text-white font-semibold">Tipo de Queijo</Label>
          <Input id="cheeseType" value={formData.cheeseType} onChange={(e) => setFormData({...formData, cheeseType: e.target.value})} required placeholder="Ex: Canastra, Coalho..." className="bg-black/20 border-white/20 text-white placeholder:text-white/40 focus:ring-amber-500 rounded-full px-4" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="format" className="text-white font-semibold">Formato</Label>
          <Input id="format" value={formData.format} onChange={(e) => setFormData({...formData, format: e.target.value})} required placeholder="Ex: Barra 1kg..." className="bg-black/20 border-white/20 text-white placeholder:text-white/40 focus:ring-amber-500 rounded-full px-4" />
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="pricePerKg" className="text-white font-semibold">Preço por Kg (R$)</Label>
          <Input id="pricePerKg" type="number" step="0.01" min="0" value={formData.pricePerKg} onChange={(e) => setFormData({...formData, pricePerKg: e.target.value})} required className="bg-black/20 border-white/20 text-white placeholder:text-white/40 focus:ring-amber-500 rounded-full px-4" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="availableKg" className="text-white font-semibold">Qtd Disponível (Kg)</Label>
          <Input id="availableKg" type="number" step="0.1" min="0" value={formData.availableKg} onChange={(e) => setFormData({...formData, availableKg: e.target.value})} required className="bg-black/20 border-white/20 text-white placeholder:text-white/40 focus:ring-amber-500 rounded-full px-4" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="packagingType" className="text-white font-semibold">Tipo de Embalagem:</Label>
          <Select value={formData.packagingType} onValueChange={(v) => setFormData({...formData, packagingType: v})}>
            <SelectTrigger className="bg-black/20 border-white/20 text-white focus:ring-amber-500 rounded-full px-4"><SelectValue /></SelectTrigger>
            <SelectContent className="bg-[#a64b00] border-white/20 text-white rounded-2xl shadow-xl" position="popper" sideOffset={4}>
              <SelectItem value="com-rotulo" className="hover:bg-white/10 focus:bg-white/10 cursor-pointer rounded-xl">Com Rótulo</SelectItem>
              <SelectItem value="sem-rotulo" className="hover:bg-white/10 focus:bg-white/10 cursor-pointer rounded-xl">Sem Rótulo</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label className="text-white font-semibold">Tipos de Pagamentos Aceitos</Label>
          <Select value="" onValueChange={togglePaymentMethod}>
            <SelectTrigger className="bg-black/20 border-white/20 text-white focus:ring-amber-500 rounded-full px-4">
              <SelectValue placeholder={formData.paymentMethods.length > 0 ? `${formData.paymentMethods.length} selecionado(s)` : 'Selecione...'} />
            </SelectTrigger>
            <SelectContent className="bg-[#a64b00] border-white/20 text-white rounded-2xl shadow-xl" position="popper" sideOffset={4}>
              {['Todos', 'PIX', 'Dinheiro', 'Cartão', 'Boleto'].map((method) => (
                <div 
                  key={method} 
                  className="relative flex w-full cursor-pointer select-none items-center rounded-xl py-2 pl-8 pr-2 text-sm outline-none hover:bg-white/10 focus:bg-white/10 transition-colors"
                  onClick={() => togglePaymentMethod(method)}
                >
                  <span className="absolute left-2 flex h-4 w-4 items-center justify-center">
                    {(method === 'Todos' ? formData.paymentMethods.length === 4 : formData.paymentMethods.includes(method)) && (
                      <Check className="h-4 w-4 text-white" />
                    )}
                  </span>
                  {method}
                </div>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-white font-semibold">Fotos do Queijo (Até 5)</Label>
        <div className="grid grid-cols-5 gap-3">
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
