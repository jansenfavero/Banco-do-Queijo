import React, { useState, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Checkbox } from '../components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '../components/ui/radio-group';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { toast } from 'sonner';
import { db } from '../lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { Upload, X, MapPin, Package, Truck, Image as ImageIcon, User } from 'lucide-react';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';

export function Profile() {
  const { profile } = useAuth();
  
  if (!profile) {
    return <div>Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 mb-2">
        <div className="p-3 bg-card rounded-2xl border border-border/50 shadow-sm shrink-0">
          <User className="h-8 w-8 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary mb-1">
            Meu Perfil
          </h1>
          <p className="text-muted-foreground text-sm md:text-base">
            Gerencie suas informações pessoais e de comercialização.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="col-span-1 md:col-span-3">
          <ProfileDetailsCard profile={profile} />
        </div>
      </div>
    </div>
  );
}

function ProfileDetailsCard({ profile }: { profile: any }) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: profile.name || '',
    phone: profile.phone || '',
    cpf: profile.cpf || '',
    cnpj: profile.cnpj || '',
    weeklyVolume: profile.weeklyVolume || '',
    packaging: profile.packaging || '',
    cheeseTypes: profile.cheeseTypes || [],
    chargesFreight: profile.chargesFreight ? 'SIM' : 'NAO',
    freightType: profile.freightType || 'FIXO',
    freightValue: profile.freightValue || '',
    address: {
      zipCode: profile.address?.zipCode || '',
      street: profile.address?.street || '',
      number: profile.address?.number || '',
      complement: profile.address?.complement || '',
      neighborhood: profile.address?.neighborhood || '',
      city: profile.address?.city || '',
      state: profile.address?.state || '',
    }
  });

  const [images, setImages] = useState<string[]>(profile.images || []);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCheckboxChange = (type: string, checked: boolean) => {
    if (checked) {
      setFormData({ ...formData, cheeseTypes: [...formData.cheeseTypes, type] });
    } else {
      setFormData({ ...formData, cheeseTypes: formData.cheeseTypes.filter((t: string) => t !== type) });
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    if (images.length + files.length > (profile.role === 'PRODUTOR' ? 5 : 3)) {
      toast.error(`Você pode enviar no máximo ${profile.role === 'PRODUTOR' ? 5 : 3} imagens.`);
      return;
    }

    setUploading(true);
    const storage = getStorage();
    const newImages = [...images];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const imageRef = storageRef(storage, `profiles/${profile.id}/${Date.now()}_${file.name}`);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.cheeseTypes.length === 0) {
      toast.error('Selecione pelo menos um tipo de queijo.');
      return;
    }
    setLoading(true);
    try {
      await updateDoc(doc(db, 'users', profile.id), {
        name: formData.name,
        phone: formData.phone,
        weeklyVolume: Number(formData.weeklyVolume),
        packaging: formData.packaging,
        chargesFreight: formData.chargesFreight === 'SIM',
        freightType: formData.freightType,
        freightValue: formData.chargesFreight === 'SIM' ? Number(formData.freightValue) : 0,
        cheeseTypes: formData.cheeseTypes,
        address: formData.address,
        images: images,
      });
      toast.success('Perfil atualizado com sucesso!');
      setIsDialogOpen(false);
    } catch (error) {
      console.error(error);
      toast.error('Erro ao atualizar perfil.');
    } finally {
      setLoading(false);
    }
  };

  const isProdutor = profile.role === 'PRODUTOR';

  return (
    <Card className="shadow-lg border-border">
      <CardHeader className="bg-card border-b border-border flex flex-row items-center justify-between pb-4 pt-6">
        <div>
          <CardTitle className="text-2xl text-primary">Seus Dados</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Mantenha seu perfil atualizado para que {isProdutor ? 'os Atacadistas' : 'os Produtores'} conheçam você.
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#d36101] hover:bg-[#a64b00] text-white">Editar Perfil</Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-[#d36101] border-none text-white shadow-2xl" overlayClassName="bg-[#4a2000]/80 backdrop-blur-sm">
            <DialogHeader>
              <DialogTitle className="text-2xl">Editar Perfil</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6 pt-4">
              
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-white">Nome / Razão Social</Label>
                  <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="bg-black/20 border-white/30 text-white placeholder:text-white/50" />
                </div>
                <div className="space-y-2">
                  <Label className="text-white">Telefone</Label>
                  <Input value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="bg-black/20 border-white/30 text-white placeholder:text-white/50" />
                </div>
              </div>

              <div className="space-y-4">
                <Label className="text-white">
                  {isProdutor ? 'Tipos de Queijo Produzidos' : 'Tipos de Queijo que Compra'}
                </Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {['mussarela', 'prato', 'provolone', 'parmesao', 'colonial', 'requeijao'].map((type) => (
                    <div key={type} className="flex items-center space-x-2">
                      <Checkbox 
                        id={`edit-${type}`}
                        checked={formData.cheeseTypes.includes(type)}
                        onCheckedChange={(checked) => handleCheckboxChange(type, checked as boolean)}
                        className="border-white/50 data-[state=checked]:bg-white data-[state=checked]:text-[#d36101]"
                      />
                      <Label htmlFor={`edit-${type}`} className="text-sm font-medium capitalize text-white">{type}</Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="weeklyVolume" className="text-white">Volume Semanal (kg)</Label>
                  <Input 
                    id="weeklyVolume" 
                    type="number"
                    value={formData.weeklyVolume}
                    onChange={(e) => setFormData({ ...formData, weeklyVolume: e.target.value })}
                    className="bg-black/20 border-white/30 text-white placeholder:text-white/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="packaging" className="text-white">Tipo de Embalagem</Label>
                  <Input 
                    id="packaging" 
                    value={formData.packaging}
                    onChange={(e) => setFormData({ ...formData, packaging: e.target.value })}
                    className="bg-black/20 border-white/30 text-white placeholder:text-white/50"
                  />
                </div>
              </div>

              {isProdutor && (
                <div className="space-y-4 bg-black/10 p-4 rounded-lg border border-white/10">
                  <Label className="text-white text-lg">Logística e Frete</Label>
                  <div className="space-y-4">
                    <Label className="text-white">Você cobra frete para entrega?</Label>
                    <RadioGroup 
                      value={formData.chargesFreight}
                      onValueChange={(value) => setFormData({ ...formData, chargesFreight: value })}
                      className="flex gap-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="SIM" id="freight-yes" className="border-white text-white fill-white" />
                        <Label htmlFor="freight-yes" className="text-white">Sim</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="NAO" id="freight-no" className="border-white text-white fill-white" />
                        <Label htmlFor="freight-no" className="text-white">Não (Incluso no valor)</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  {formData.chargesFreight === 'SIM' && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-white">Tipo de Cobrança</Label>
                        <RadioGroup 
                          value={formData.freightType}
                          onValueChange={(value) => setFormData({ ...formData, freightType: value })}
                          className="space-y-2"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="FIXO" id="type-fixed" className="border-white text-white fill-white" />
                            <Label htmlFor="type-fixed" className="text-white">Valor Fixo por kg</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="PERCENTUAL" id="type-percent" className="border-white text-white fill-white" />
                            <Label htmlFor="type-percent" className="text-white">Percentual do pedido</Label>
                          </div>
                        </RadioGroup>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="freightValue" className="text-white">Valor/Percentual do Frete</Label>
                        <Input 
                          id="freightValue" 
                          type="number"
                          value={formData.freightValue}
                          onChange={(e) => setFormData({ ...formData, freightValue: e.target.value })}
                          className="bg-black/20 border-white/30 text-white placeholder:text-white/50"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-4">
                <Label className="text-white text-lg">
                  {isProdutor ? 'Fotos dos Seus Queijos' : 'Fotos do Seu Comércio'}
                </Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {images.map((img, index) => (
                    <div key={index} className="relative aspect-square rounded-lg overflow-hidden bg-black/20 border border-white/20">
                      <img src={img} alt={`Upload ${index + 1}`} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(index)}
                        className="absolute top-2 right-2 p-1 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  {images.length < (isProdutor ? 5 : 3) && (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className="aspect-square rounded-lg border-2 border-dashed border-white/30 flex flex-col items-center justify-center text-white/70 hover:text-white hover:border-white/50 hover:bg-white/5 transition-colors disabled:opacity-50"
                    >
                      <Upload className="w-6 h-6 mb-2" />
                      <span className="text-sm">{uploading ? 'Enviando...' : 'Adicionar Foto'}</span>
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

              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-white/20">
                <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)} className="text-white hover:bg-white/10">
                  Cancelar
                </Button>
                <Button type="submit" disabled={loading} className="bg-[#facc15] text-[#854d0e] hover:bg-[#eab308] font-bold">
                  {loading ? 'Salvando...' : 'Salvar Alterações'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      
      <CardContent className="p-6">
        <div className="grid gap-8 md:grid-cols-2 font-medium">
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-1">Informações Básicas</h3>
              <p className="text-xl text-primary font-bold">{profile.name}</p>
              <p className="text-muted-foreground">{profile.email}</p>
              <p className="text-muted-foreground">{profile.phone}</p>
              <p className="text-muted-foreground">{profile.cpf || profile.cnpj}</p>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-2">
                <MapPin className="w-4 h-4" /> Endereço
              </h3>
              <p className="text-foreground">
                {profile.address?.street}, {profile.address?.number} {profile.address?.complement && `- ${profile.address.complement}`}
              </p>
              <p className="text-muted-foreground">
                {profile.address?.neighborhood} - {profile.address?.city}/{profile.address?.state}
              </p>
              <p className="text-muted-foreground">CEP: {profile.address?.zipCode}</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-2">
                <Package className="w-4 h-4" /> Produção / Capacidade
              </h3>
              <div className="bg-muted/50 rounded-lg p-4 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground uppercase">Volume Semanal</p>
                  <p className="text-lg font-bold text-foreground">{profile.weeklyVolume} kg</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase">Embalagem</p>
                  <p className="text-lg font-bold text-foreground">{profile.packaging}</p>
                </div>
                <div className="col-span-2">
                   <p className="text-xs text-muted-foreground uppercase mb-2">Tipos de Queijo</p>
                   <div className="flex flex-wrap gap-2">
                     {profile.cheeseTypes?.map((c: string) => (
                       <span key={c} className="bg-primary/10 text-primary text-xs px-2 py-1 rounded-md font-semibold capitalize shadow-sm">
                         {c}
                       </span>
                     ))}
                   </div>
                </div>
              </div>
            </div>

            {isProdutor && (
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-2">
                  <Truck className="w-4 h-4" /> Logística
                </h3>
                <div className="bg-muted/50 rounded-lg p-4">
                  <p className="text-lg font-bold text-foreground">
                    {profile.chargesFreight 
                      ? `${profile.freightType === 'FIXO' ? 'Valor Fixo: R$' : 'Percentual:'} ${profile.freightValue}${profile.freightType === 'PERCENTUAL' ? '%' : ' por kg'}` 
                      : 'Frete Incluso / Retirada'}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {profile.images && profile.images.length > 0 && (
          <div className="mt-8">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
              <ImageIcon className="w-4 h-4" /> {isProdutor ? 'Galeria de Produção' : 'Fachada/Interior'}
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {profile.images.map((img: string, idx: number) => (
                <div key={idx} className="aspect-square rounded-xl overflow-hidden shadow-md border border-border hover:shadow-lg transition-shadow">
                  <img src={img} alt={`Imagem ${idx + 1}`} className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
