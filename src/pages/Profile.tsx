import React, { useState, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Checkbox } from '../components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '../components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
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
    <div className="space-y-8 p-6 md:p-10 max-w-7xl mx-auto">
      <div className="flex items-center gap-4">
        <div className="p-3 bg-app-cardDark rounded-2xl border border-app-accent/20 shadow-sm shrink-0">
          <User className="h-8 w-8 text-app-accent" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-1">
            Meu Perfil
          </h1>
          <p className="text-white/70 text-sm md:text-base">
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
    <Card className="p-0 gap-0 shadow-2xl border-none bg-[#703200] text-white overflow-hidden rounded-[24px]">
      <CardHeader className="rounded-t-[24px] bg-[#d36101] border-b border-white/10 flex flex-col md:flex-row items-start md:items-center justify-between px-6 py-5 gap-4">
        <div>
          <CardTitle className="text-3xl text-white font-bold tracking-tight flex items-center gap-3">
            <User className="w-6 h-6" />
            Seus Dados
          </CardTitle>
          <p className="text-base text-white/80 mt-2 font-medium">
            Mantenha seu perfil atualizado para que {isProdutor ? 'os Atacadistas' : 'os Produtores'} conheçam você.
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="font-bold">Editar Perfil</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto bg-[#b85200] border-white/10 text-white shadow-2xl rounded-[24px]" overlayClassName="bg-black/60 backdrop-blur-sm">
            <DialogHeader>
              <DialogTitle className="text-2xl text-white font-bold tracking-tight">Editar Perfil</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6 pt-4">
              
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-white font-semibold">Nome / Razão Social</Label>
                  <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="bg-black/20 border-white/20 text-white placeholder:text-white/40 focus:ring-amber-500 rounded-xl px-4" />
                </div>
                <div className="space-y-2">
                  <Label className="text-white font-semibold">Telefone</Label>
                  <Input value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="bg-black/20 border-white/20 text-white placeholder:text-white/40 focus:ring-amber-500 rounded-xl px-4" />
                </div>
              </div>

              <div className="space-y-4">
                <Label className="text-white font-semibold">
                  {isProdutor ? 'Tipos de Queijo Produzidos' : 'Tipos de Queijo que Compra'}
                </Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {['qualho', 'mussarela', 'prato', 'provolone', 'parmesao', 'colonial', 'requeijao'].map((type) => (
                    <div key={type} className="flex items-center space-x-2">
                      <Checkbox 
                        id={`edit-${type}`}
                        checked={formData.cheeseTypes.includes(type)}
                        onCheckedChange={(checked) => handleCheckboxChange(type, checked as boolean)}
                        className="border-white/30 data-[state=checked]:bg-app-accent data-[state=checked]:text-app-bgDark rounded"
                      />
                      <Label htmlFor={`edit-${type}`} className="text-sm font-medium capitalize text-white/90">{type}</Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="weeklyVolume" className="text-white font-semibold">Volume Semanal (kg)</Label>
                  <Input 
                    id="weeklyVolume" 
                    type="number"
                    value={formData.weeklyVolume}
                    onChange={(e) => setFormData({ ...formData, weeklyVolume: e.target.value })}
                    className="bg-black/20 border-white/20 text-white placeholder:text-white/40 focus:ring-amber-500 rounded-xl px-4"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="packaging" className="text-white font-semibold">Tipo de Embalagem</Label>
                  <Select value={formData.packaging} onValueChange={(v) => setFormData({ ...formData, packaging: v })}>
                    <SelectTrigger id="packaging" className="flex h-10 w-full bg-black/20 border border-white/20 text-white focus:ring-amber-500 rounded-xl px-4 py-2 outline-none cursor-pointer">
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent className="bg-[#b85200] border border-white/20 text-white rounded-xl shadow-xl" position="popper" sideOffset={4}>
                      <SelectItem value="Com Rótulo" className="hover:bg-white/10 focus:bg-white/10 cursor-pointer rounded-lg">Com Rótulo</SelectItem>
                      <SelectItem value="Sem Rótulo" className="hover:bg-white/10 focus:bg-white/10 cursor-pointer rounded-lg">Sem Rótulo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

                <div className="space-y-4 bg-black/20 p-5 rounded-[20px] border border-white/10">
                <Label className="text-white font-semibold text-lg flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-[#f4d763]" /> Endereço
                </Label>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label className="text-white/90">CEP</Label>
                    <Input value={formData.address.zipCode} onChange={e => setFormData({...formData, address: {...formData.address, zipCode: e.target.value}})} className="bg-black/20 border-white/20 text-white placeholder:text-white/40 focus:ring-amber-500 rounded-xl px-4" />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label className="text-white/90">Rua/Logradouro</Label>
                    <Input value={formData.address.street} onChange={e => setFormData({...formData, address: {...formData.address, street: e.target.value}})} className="bg-black/20 border-white/20 text-white placeholder:text-white/40 focus:ring-amber-500 rounded-xl px-4" />
                  </div>
                </div>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label className="text-white/90">Número</Label>
                    <Input value={formData.address.number} onChange={e => setFormData({...formData, address: {...formData.address, number: e.target.value}})} className="bg-black/20 border-white/20 text-white placeholder:text-white/40 focus:ring-amber-500 rounded-xl px-4" />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label className="text-white/90">Complemento</Label>
                    <Input value={formData.address.complement} onChange={e => setFormData({...formData, address: {...formData.address, complement: e.target.value}})} className="bg-black/20 border-white/20 text-white placeholder:text-white/40 focus:ring-amber-500 rounded-xl px-4" />
                  </div>
                </div>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label className="text-white/90">Bairro</Label>
                    <Input value={formData.address.neighborhood} onChange={e => setFormData({...formData, address: {...formData.address, neighborhood: e.target.value}})} className="bg-black/20 border-white/20 text-white placeholder:text-white/40 focus:ring-amber-500 rounded-xl px-4" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-white/90">Cidade</Label>
                    <Input value={formData.address.city} onChange={e => setFormData({...formData, address: {...formData.address, city: e.target.value}})} className="bg-black/20 border-white/20 text-white placeholder:text-white/40 focus:ring-amber-500 rounded-xl px-4" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-white/90">Estado (UF)</Label>
                    <Input value={formData.address.state} maxLength={2} onChange={e => setFormData({...formData, address: {...formData.address, state: e.target.value}})} className="bg-black/20 border-white/20 text-white placeholder:text-white/40 focus:ring-amber-500 rounded-xl px-4 uppercase" />
                  </div>
                </div>
              </div>

              {isProdutor && (
                <div className="space-y-4 bg-black/20 p-5 rounded-[20px] border border-white/10">
                  <Label className="text-white font-semibold text-lg flex items-center gap-2">
                    <Truck className="w-5 h-5 text-[#f4d763]" /> Logística e Frete
                  </Label>
                  <div className="space-y-3">
                    <Label className="text-white/90">Você cobra frete para entrega?</Label>
                    <RadioGroup 
                      value={formData.chargesFreight}
                      onValueChange={(value) => setFormData({ ...formData, chargesFreight: value })}
                      className="flex flex-col sm:flex-row gap-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="SIM" id="freight-yes" className="border-white/50 text-amber-500 data-[state=checked]:border-amber-500" />
                        <Label htmlFor="freight-yes" className="text-white">Sim</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="NAO" id="freight-no" className="border-white/50 text-amber-500 data-[state=checked]:border-amber-500" />
                        <Label htmlFor="freight-no" className="text-white">Não (Incluso no valor)</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  {formData.chargesFreight === 'SIM' && (
                    <div className="grid grid-cols-2 gap-4 mt-4">
                      <div className="space-y-2">
                        <Label className="text-white/90">Tipo de Cobrança</Label>
                        <RadioGroup 
                          value={formData.freightType}
                          onValueChange={(value) => setFormData({ ...formData, freightType: value })}
                          className="space-y-2"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="FIXO" id="type-fixed" className="border-white/50 text-amber-500 data-[state=checked]:border-amber-500" />
                            <Label htmlFor="type-fixed" className="text-white">Valor Fixo por kg</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="PERCENTUAL" id="type-percent" className="border-white/50 text-amber-500 data-[state=checked]:border-amber-500" />
                            <Label htmlFor="type-percent" className="text-white">Percentual do pedido</Label>
                          </div>
                        </RadioGroup>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="freightValue" className="text-white/90">Valor/Percentual do Frete</Label>
                        <Input 
                          id="freightValue" 
                          type="number"
                          value={formData.freightValue}
                          onChange={(e) => setFormData({ ...formData, freightValue: e.target.value })}
                          className="bg-black/20 border-white/20 text-white placeholder:text-white/40 focus:ring-amber-500 rounded-xl px-4"
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

              <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-white/10">
                <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)} className="text-white hover:bg-white/10 font-medium">
                  Cancelar
                </Button>
                <Button type="submit" disabled={loading} className="bg-app-accent text-app-bgDark hover:bg-app-accentHover font-bold px-6">
                  {loading ? 'Salvando...' : 'Salvar Alterações'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      
      <CardContent className="p-6">
        <div className="grid gap-6 md:grid-cols-2 font-medium">
          <div className="space-y-6">
            <div className="bg-[#4a2000] rounded-[20px] p-6 border border-white/10 shadow-sm">
              <h3 className="text-sm font-semibold text-white/70 uppercase tracking-wider mb-4 flex items-center gap-2">
                <User className="w-4 h-4 text-app-accent" /> Informações Básicas
              </h3>
              <div className="space-y-1">
                <p className="text-xl text-white font-bold">{profile.name}</p>
                <p className="text-white/70">{profile.email}</p>
                <p className="text-white/70">{profile.phone}</p>
                <p className="text-white/70">{profile.cpf || profile.cnpj}</p>
              </div>
            </div>

            <div className="bg-[#4a2000] rounded-[20px] p-6 border border-white/10 shadow-sm">
              <h3 className="text-sm font-semibold text-white/70 uppercase tracking-wider mb-4 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-app-accent" /> Endereço
              </h3>
              <div className="space-y-1">
                <p className="text-white">
                  {profile.address?.street}, {profile.address?.number} {profile.address?.complement && `- ${profile.address.complement}`}
                </p>
                <p className="text-white/70">
                  {profile.address?.neighborhood} - {profile.address?.city}/{profile.address?.state}
                </p>
                <p className="text-white/70">CEP: {profile.address?.zipCode}</p>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-[#4a2000] rounded-[20px] p-6 border border-white/10 shadow-sm">
              <h3 className="text-sm font-semibold text-white/70 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Package className="w-4 h-4 text-app-accent" /> Secao de Comercialização
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-white/60 uppercase mb-1">Volume Semanal</p>
                  <p className="text-lg font-bold text-white">{profile.weeklyVolume} kg</p>
                </div>
                <div>
                  <p className="text-xs text-white/60 uppercase mb-1">Embalagem</p>
                  <p className="text-lg font-bold text-white">{profile.packaging}</p>
                </div>
                <div className="col-span-2">
                   <p className="text-xs text-white/60 uppercase mb-2 mt-2">Tipos de Queijo</p>
                   <div className="flex flex-wrap gap-2">
                     {profile.cheeseTypes?.map((c: string) => (
                       <span key={c} className="bg-white/10 border border-white/20 text-white text-xs px-3 py-1.5 rounded-full font-bold capitalize shadow-sm">
                         {c}
                       </span>
                     ))}
                   </div>
                </div>
              </div>
            </div>

            {isProdutor && (
              <div className="bg-[#4a2000] rounded-[20px] p-6 border border-white/10 shadow-sm">
                <h3 className="text-sm font-semibold text-white/70 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Truck className="w-4 h-4 text-app-accent" /> Logística
                </h3>
                <p className="text-lg font-bold text-white">
                  {profile.chargesFreight 
                    ? `${profile.freightType === 'FIXO' ? 'Valor Fixo: R$' : 'Percentual:'} ${profile.freightValue}${profile.freightType === 'PERCENTUAL' ? '%' : ' por kg'}` 
                    : 'Frete Incluso / Retirada'}
                </p>
              </div>
            )}
          </div>
        </div>

        {profile.images && profile.images.length > 0 && (
          <div className="mt-8 bg-[#4a2000] rounded-[20px] p-6 border border-white/10 shadow-sm">
            <h3 className="text-sm font-semibold text-white/70 uppercase tracking-wider mb-4 flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-app-accent" /> {isProdutor ? 'Galeria de Produção' : 'Fachada/Interior'}
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {profile.images.map((img: string, idx: number) => (
                <div key={idx} className="aspect-square rounded-[16px] overflow-hidden shadow-sm border border-white/10 hover:shadow-md transition-shadow">
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
