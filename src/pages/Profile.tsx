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
import { Upload, X, MapPin, Package, Truck, Image as ImageIcon, User, ShieldCheck } from 'lucide-react';
import { getStorage, ref as storageRef, uploadBytesResumable, getDownloadURL } from 'firebase/storage';

import { Switch } from '../components/ui/switch';

export function Profile() {
  const { profile } = useAuth();
  const [isPublic, setIsPublic] = useState(profile?.isPublic !== false);
  
  if (!profile) {
    return <div>Carregando...</div>;
  }

  const handleTogglePublic = async (checked: boolean) => {
    setIsPublic(checked);
    try {
      await updateDoc(doc(db, 'users', profile.id), { isPublic: checked });
      toast.success(`Perfil agora está ${checked ? 'Ativo' : 'Oculto'}.`);
    } catch (e) {
      toast.error('Erro ao atualizar status.');
      setIsPublic(!checked);
    }
  };

  return (
    <div className="space-y-8 p-6 md:p-10 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
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

        {profile.role !== 'ADMIN' && (
          <div className="flex items-center gap-4 bg-black/20 p-4 rounded-xl border border-white/10 shrink-0">
            <div>
              <p className="text-white font-bold mb-0.5">{isPublic ? 'Ativo na Vitrine' : 'Perfil Oculto'}</p>
              <p className="text-xs text-white/50 max-w-[200px]">Deixe no modo ativo para seu perfil aparecer na Vitrine, ou Oculte para não aparecer.</p>
            </div>
            <Switch 
              checked={isPublic} 
              onCheckedChange={handleTogglePublic} 
              className="data-[state=checked]:bg-app-accent" 
            />
          </div>
        )}
      </div>
      
      {profile.kycStatus === 'PENDENTE' && profile.role !== 'ADMIN' && (
        <div className="bg-[#b85200]/20 border border-[#f4d763]/50 p-5 rounded-[20px] shadow-[0_0_15px_rgba(244,215,99,0.1)]">
          <div className="flex">
            <div className="flex-shrink-0 mt-0.5">
              <ShieldCheck className="h-6 w-6 text-[#f4d763]" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-bold text-[#f4d763] mb-1">Ação Necessária</h3>
              <p className="text-sm text-white/90">
                Seu perfil ainda não está completo. Somente após completar <strong>todos os seus dados e informações abaixo</strong> (incluindo CPF/CNPJ válidos, endereço e fotos) você estará habilitado e sua conta será ativada automaticamente para aparecer na vitrine de negociação.
              </p>
            </div>
          </div>
        </div>
      )}

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
    cpfCnpj: (profile.cpfCnpj && profile.cpfCnpj !== '00000000000') ? profile.cpfCnpj : '',
    weeklyVolume: profile.weeklyVolume || '',
    packaging: profile.packaging || '',
    cheeseTypes: (profile.cheeseTypes || []).map((c: string) => {
      const lower = c.toLowerCase();
      if (lower === 'qualho' || lower === 'coalho') return 'Coalho';
      if (lower === 'mussarela') return 'Mussarela';
      if (lower === 'prato') return 'Prato';
      if (lower === 'provolone') return 'Provolone';
      if (lower === 'parmesao' || lower === 'parmesão') return 'Parmesão';
      if (lower === 'colonial') return 'Colonial';
      if (lower === 'requeijao' || lower === 'requeijão') return 'Requeijão';
      return c;
    }),
    cheesePrices: (() => {
      const prices = profile.cheesePrices || {};
      const formatted: Record<string, string> = {};
      for (const [key, value] of Object.entries(prices)) {
        if (typeof value === 'number') {
           // format as pt-BR currency without symbol
           formatted[key] = value.toFixed(2).replace('.', ',');
        } else {
           formatted[key] = value as string;
        }
      }
      return formatted;
    })(),
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
  const [cheeseImages, setCheeseImages] = useState<Record<string, string[]>>(profile.cheeseImages || {});
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatCurrency = (val: string) => {
    let v = val.replace(/\D/g, "");
    if (v === "") return "";
    v = (parseInt(v) / 100).toFixed(2);
    v = v.replace(".", ",");
    v = v.replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1.");
    return v;
  };

  const formatCPF = (val: string) => val.replace(/\D/g, "").replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d{1,2})/, "$1-$2").replace(/(-\d{2})\d+?$/, "$1");
  const formatCNPJ = (val: string) => val.replace(/\D/g, "").replace(/(\d{2})(\d)/, "$1.$2").replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d)/, "$1/$2").replace(/(\d{4})(\d{1,2})/, "$1-$2").replace(/(-\d{2})\d+?$/, "$1");
  const formatPhone = (val: string) => {
    let r = val.replace(/\D/g,"");
    if(r.length > 11) r = r.substring(0,11);
    if(r.length > 10) return r.replace(/^(\d\d)(\d{5})(\d{4}).*/,"($1) $2-$3");
    else if(r.length > 5) return r.replace(/^(\d\d)(\d{4})(\d{0,4}).*/,"($1) $2-$3");
    else if(r.length > 2) return r.replace(/^(\d\d)(\d{0,5})/,"($1) $2");
    else return r;
  };
  const formatCep = (val: string) => val.replace(/\D/g, "").replace(/(\d{5})(\d)/, "$1-$2").replace(/(-\d{3})\d+?$/, "$1");

  const isValidCPF = (cpf: string) => {
    cpf = cpf.replace(/[^\d]+/g, "");
    if (cpf == "" || cpf.length != 11 || /^(\d)\1{10}$/.test(cpf)) return false;
    let add = 0;
    for (let i = 0; i < 9; i++) add += parseInt(cpf.charAt(i)) * (10 - i);
    let rev = 11 - (add % 11);
    if (rev == 10 || rev == 11) rev = 0;
    if (rev != parseInt(cpf.charAt(9))) return false;
    add = 0;
    for (let i = 0; i < 10; i++) add += parseInt(cpf.charAt(i)) * (11 - i);
    rev = 11 - (add % 11);
    if (rev == 10 || rev == 11) rev = 0;
    return rev == parseInt(cpf.charAt(10));
  };

  const isValidCNPJ = (cnpj: string) => {
    cnpj = cnpj.replace(/[^\d]+/g, "");
    if (cnpj == "" || cnpj.length != 14 || /^(\d)\1{13}$/.test(cnpj)) return false;
    let tamanho = cnpj.length - 2;
    let numeros = cnpj.substring(0, tamanho);
    let digitos = cnpj.substring(tamanho);
    let soma = 0;
    let pos = tamanho - 7;
    for (let i = tamanho; i >= 1; i--) { soma += parseInt(numeros.charAt(tamanho - i)) * pos--; if (pos < 2) pos = 9; }
    let resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
    if (resultado != parseInt(digitos.charAt(0))) return false;
    tamanho = tamanho + 1;
    numeros = cnpj.substring(0, tamanho);
    soma = 0;
    pos = tamanho - 7;
    for (let i = tamanho; i >= 1; i--) { soma += parseInt(numeros.charAt(tamanho - i)) * pos--; if (pos < 2) pos = 9; }
    resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
    return resultado == parseInt(digitos.charAt(1));
  };

  const handleCpfCnpjChange = (val: string) => {
    const raw = val.replace(/\D/g, "");
    if (raw.length <= 11) setFormData({ ...formData, cpfCnpj: formatCPF(raw) });
    else setFormData({ ...formData, cpfCnpj: formatCNPJ(raw) });
  };

  const fetchCnpjData = async (cnpjStr: string) => {
    const raw = cnpjStr.replace(/\D/g, "");
    if (raw.length === 14 && isValidCNPJ(raw)) {
      toast.info("Buscando dados do CNPJ...");
      try {
        const res = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${raw}`);
        if(res.ok) {
          const data = await res.json();
          let street = data.descricao_tipo_de_logradouro ? `${data.descricao_tipo_de_logradouro} ${data.logradouro}`.trim() : data.logradouro || '';
          let neighborhood = data.bairro || '';
          let city = data.municipio || '';
          let state = data.uf || '';

          // Fetch from ViaCEP using the CNPJ's CEP for richer address info (specially Logradouro)
          if (data.cep) {
            try {
               const cepRes = await fetch(`https://viacep.com.br/ws/${data.cep.replace(/\D/g, "")}/json/`);
               if (cepRes.ok) {
                 const cepData = await cepRes.json();
                 if (!cepData.erro) {
                    street = cepData.logradouro || street;
                    neighborhood = cepData.bairro || neighborhood;
                    city = cepData.localidade || city;
                    state = cepData.uf || state;
                 }
               }
            } catch(e) {}
          }

          setFormData(prev => ({
            ...prev,
            name: data.razao_social || data.nome_fantasia || prev.name,
            phone: data.ddd_telefone_1 ? formatPhone(data.ddd_telefone_1) : prev.phone,
            address: {
              ...prev.address,
              zipCode: data.cep ? formatCep(data.cep) : prev.address.zipCode,
              street: street || prev.address.street,
              neighborhood: neighborhood || prev.address.neighborhood,
              city: city || prev.address.city,
              state: state || prev.address.state
            }
          }));
          toast.success("Dados preenchidos via CNPJ e Correios! Preencha o número manualmente.");
          return;
        }
      } catch(e) {}
    } else if (raw.length === 11 && !isValidCPF(raw)) {
      toast.error('CPF inválido.');
    }
  };

  const fetchCepData = async (cepStr: string) => {
    const raw = cepStr.replace(/\D/g, "");
    if (raw.length === 8) {
      try {
        const res = await fetch(`https://viacep.com.br/ws/${raw}/json/`);
        if (res.ok) {
          const data = await res.json();
          if (!data.erro) {
            setFormData(prev => ({
              ...prev,
              address: {
                ...prev.address,
                street: data.logradouro || prev.address.street,
                neighborhood: data.bairro || prev.address.neighborhood,
                city: data.localidade || prev.address.city,
                state: data.uf || prev.address.state
              }
            }));
            toast.success("Endereço atualizado via CEP!");
          }
        }
      } catch(e) {}
    }
  };

  const handleCheckboxChange = (type: string, checked: boolean) => {
    if (checked) {
      setFormData({ ...formData, cheeseTypes: [...formData.cheeseTypes, type] });
    } else {
      const newPrices = { ...formData.cheesePrices };
      delete newPrices[type];
      setFormData({ 
        ...formData, 
        cheeseTypes: formData.cheeseTypes.filter((t: string) => t !== type),
        cheesePrices: newPrices 
      });
    }
  };

  const handlePriceChange = (type: string, value: string) => {
    setFormData({
      ...formData,
      cheesePrices: {
        ...formData.cheesePrices,
        [type]: value
      }
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, targetType: string = 'general') => {
    if (!e.target.files?.length) return;
    const filesArray = Array.from(e.target.files);

    if (targetType === 'general') {
        if (images.length + filesArray.length > 3) {
            toast.error('Você pode enviar no máximo 3 imagens para o comércio.');
            return;
        }
    } else {
        const currentTypeImages = cheeseImages[targetType] || [];
        if (currentTypeImages.length + filesArray.length > 3) {
            toast.error(`Você pode enviar no máximo 3 imagens para o queijo ${targetType}.`);
            return;
        }
    }

    setUploading(true);
    setUploadProgress(0);
    const storage = getStorage();
    const newUrls: string[] = [];

    try {
      for (let i = 0; i < filesArray.length; i++) {
        const file = filesArray[i];
        const imageRef = storageRef(storage, `profiles/${profile.id}/${Date.now()}_${file.name}`);
        const uploadTask = uploadBytesResumable(imageRef, file);
        
        await new Promise((resolve, reject) => {
          uploadTask.on('state_changed', 
            (snapshot) => {
              const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
              setUploadProgress(((i * 100) + progress) / filesArray.length);
            }, 
            (error) => {
              reject(error);
            }, 
            async () => {
              const url = await getDownloadURL(uploadTask.snapshot.ref);
              newUrls.push(url);
              resolve(null);
            }
          );
        });
      }
      
      if (targetType === 'general') {
          setImages([...images, ...newUrls]);
      } else {
          setCheeseImages(prev => ({
              ...prev,
              [targetType]: [...(prev[targetType] || []), ...newUrls]
          }));
      }

      toast.success('Imagens enviadas com sucesso!');
    } catch (error) {
      console.error(error);
      toast.error('Erro ao enviar imagens.');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleRemoveImage = (index: number) => {
    const newImages = [...images];
    newImages.splice(index, 1);
    setImages(newImages);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const isProdutor = profile.role === 'PRODUTOR';
    const isAtacadista = profile.role === 'ATACADISTA';

    // Verify required fields
    if (!formData.name.trim()) return toast.error('O Nome/Empresa é obrigatório.');
    if (!formData.cpfCnpj.trim()) return toast.error('O CPF/CNPJ é obrigatório.');
    if (!formData.phone.trim()) return toast.error('O Telefone/WhatsApp é obrigatório.');
    if (!formData.address.zipCode.trim()) return toast.error('O CEP é obrigatório.');
    if (!formData.address.street.trim()) return toast.error('A Rua/Logradouro é obrigatória.');
    if (!formData.address.number.trim()) return toast.error('O Número do endereço é obrigatório.');
    if (!formData.address.neighborhood.trim()) return toast.error('O Bairro é obrigatório.');
    if (!formData.address.city.trim()) return toast.error('A Cidade é obrigatória.');
    if (!formData.address.state.trim()) return toast.error('O Estado (UF) é obrigatório.');

    if (formData.cheeseTypes.length === 0) {
      toast.error('Selecione pelo menos um tipo de queijo.');
      return;
    }
    if (images.length === 0) {
      toast.error(`Pelo menos uma foto ${isProdutor ? 'do seu queijo/comércio' : 'do seu comércio'} é obrigatória.`);
      return;
    }

    if (isProdutor) {
      if (!formData.weeklyVolume) return toast.error('A Produção Semanal é obrigatória.');
      if (!formData.packaging) return toast.error('O Tipo de Embalagem é obrigatório.');
    }

    if (isAtacadista) {
      if (!formData.weeklyVolume) return toast.error('O Volume Semanal é obrigatório.');
      if (!formData.packaging) return toast.error('A Embalagem requerida é obrigatória.');
    }
    
    // Auto-validate logic Check if done
    const rawCnpjCpf = formData.cpfCnpj.replace(/\D/g, "");
    if (rawCnpjCpf.length === 11 && !isValidCPF(rawCnpjCpf)) {
        toast.error("CPF inválido.");
        return;
    }
    if (rawCnpjCpf.length === 14 && !isValidCNPJ(rawCnpjCpf)) {
        toast.error("CNPJ inválido.");
        return;
    }
    if (rawCnpjCpf.length !== 11 && rawCnpjCpf.length !== 14) {
        toast.error("CPF ou CNPJ inválido.");
        return;
    }

    if (isProdutor) {
      for (const cheese of formData.cheeseTypes) {
        const rawValue = formData.cheesePrices[cheese] ? formData.cheesePrices[cheese].toString().replace(/\./g, "").replace(",", ".") : '0';
        if (!formData.cheesePrices[cheese] || Number(rawValue) <= 0) {
          toast.error(`Por favor, informe o preço válido para o queijo ${cheese}.`);
          return;
        }
      }
    }

    setLoading(true);
    try {
      const parsedCheesePrices: Record<string, number> = {};
      for (const cheese of Object.keys(formData.cheesePrices)) {
        parsedCheesePrices[cheese] = Number(formData.cheesePrices[cheese].toString().replace(/\./g, "").replace(",", "."));
      }

      const updates: any = {
        name: formData.name,
        phone: formData.phone,
        cpfCnpj: formData.cpfCnpj,
        city: formData.address.city || 'A definir',
        state: formData.address.state || 'NA',
        weeklyVolume: Number(formData.weeklyVolume),
        packaging: formData.packaging,
        chargesFreight: formData.chargesFreight === 'SIM',
        freightType: formData.freightType,
        freightValue: formData.chargesFreight === 'SIM' ? Number(formData.freightValue) : 0,
        cheeseTypes: formData.cheeseTypes,
        cheesePrices: parsedCheesePrices,
        address: formData.address,
        images: images,
        cheeseImages: cheeseImages,
        kycStatus: 'VALIDADO' // Automatically validated since we now require all info
      };
      
      if (profile.isPublic === undefined) {
        updates.isPublic = true;
      }

      await updateDoc(doc(db, 'users', profile.id), updates);
      toast.success('Perfil atualizado e ativado com sucesso!');
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
            Mantenha seu perfil atualizado para que {isProdutor ? 'os Atacadistas' : 'os Produtores'} conheçam você. Preencha todos os dados e CPF/CNPJ para aprovação automática na vitrine.
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
              
              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-white font-semibold">Nome / Razão Social</Label>
                  <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="bg-black/20 border-white/20 text-white placeholder:text-white/40 focus:ring-amber-500 rounded-xl px-4" />
                </div>
                <div className="space-y-2">
                  <Label className="text-white font-semibold">Telefone/WhatsApp</Label>
                  <Input value={formData.phone} onChange={e => setFormData({...formData, phone: formatPhone(e.target.value)})} placeholder="(00) 00000-0000" className="bg-black/20 border-white/20 text-white placeholder:text-white/40 focus:ring-amber-500 rounded-xl px-4" />
                </div>
                <div className="space-y-2">
                  <Label className="text-white font-semibold flex items-center gap-2">CPF/CNPJ <span className="text-[10px] text-white/50">(Autopreenchimento)</span></Label>
                  <Input value={formData.cpfCnpj} onChange={e => handleCpfCnpjChange(e.target.value)} onBlur={(e) => fetchCnpjData(e.target.value)} placeholder="000.000.000-00 ou 00.000.000/0000-00" className="bg-black/20 border-white/20 text-white placeholder:text-white/40 focus:ring-amber-500 rounded-xl px-4" />
                </div>
              </div>

              <div className="space-y-4">
                <Label className="text-white font-semibold">
                  {isProdutor ? 'Tipos de Queijo Produzidos e Preço (R$/kg)' : 'Tipos de Queijo que Compra'}
                </Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {['Coalho', 'Mussarela', 'Prato', 'Provolone', 'Parmesão', 'Colonial', 'Requeijão'].map((type) => (
                    <div key={type} className="flex flex-col space-y-2 p-3 bg-black/20 border border-white/10 rounded-xl">
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id={`edit-${type}`}
                          checked={formData.cheeseTypes.includes(type)}
                          onCheckedChange={(checked) => handleCheckboxChange(type, checked as boolean)}
                          className="border-white/30 data-[state=checked]:bg-app-accent data-[state=checked]:text-app-bgDark rounded mt-0.5"
                        />
                        <Label htmlFor={`edit-${type}`} className="text-sm font-bold text-white/90">{type}</Label>
                      </div>
                      {formData.cheeseTypes.includes(type) && isProdutor && (
                         <div className="pt-1">
                           <Input
                             type="text"
                             placeholder="Preço R$/kg"
                             value={formData.cheesePrices[type] || ''}
                             onChange={(e) => handlePriceChange(type, formatCurrency(e.target.value))}
                             className="bg-black/40 border-white/20 text-white placeholder:text-white/40 focus:ring-amber-500 rounded-md h-9 text-sm px-3"
                           />
                         </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="weeklyVolume" className="text-white font-semibold">
                    {isProdutor ? 'Volume Semanal de Produção (kg)' : 'Volume Semanal de Compra (kg)'}
                  </Label>
                  <Input 
                    id="weeklyVolume" 
                    type="number"
                    value={formData.weeklyVolume}
                    onChange={(e) => setFormData({ ...formData, weeklyVolume: e.target.value })}
                    className="bg-black/20 border-white/20 text-white placeholder:text-white/40 focus:ring-amber-500 rounded-xl px-4"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="packaging" className="text-white font-semibold">
                    {isProdutor ? 'Embalagem dos Produtos' : 'Tipo de Queijo que Compra (Embalagem)'}
                  </Label>
                  <Select value={formData.packaging} onValueChange={(v) => setFormData({ ...formData, packaging: v })}>
                    <SelectTrigger id="packaging" className="flex h-10 w-full bg-black/20 border border-white/20 text-white focus:ring-amber-500 rounded-xl px-4 py-2 outline-none cursor-pointer">
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent className="bg-[#b85200] border border-white/20 text-white rounded-[10px] shadow-xl relative z-50">
                      <SelectItem value="Com Rótulo" className="focus:bg-[#d36101] focus:text-white cursor-pointer rounded-[8px]">Com Rótulo</SelectItem>
                      <SelectItem value="Sem Rótulo" className="focus:bg-[#d36101] focus:text-white cursor-pointer rounded-[8px]">Sem Rótulo</SelectItem>
                      <SelectItem value="Ambos" className="focus:bg-[#d36101] focus:text-white cursor-pointer rounded-[8px]">Ambos (Com/Sem Rótulo)</SelectItem>
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
                    <Input value={formData.address.zipCode} onChange={e => setFormData({...formData, address: {...formData.address, zipCode: formatCep(e.target.value)}})} onBlur={(e) => fetchCepData(e.target.value)} placeholder="00000-000" className="bg-black/20 border-white/20 text-white placeholder:text-white/40 focus:ring-amber-500 rounded-xl px-4" />
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
                <div>
                  <Label className="text-white text-lg font-semibold flex items-center gap-2">
                    <ImageIcon className="w-5 h-5 text-[#f4d763]" />
                    {isProdutor ? 'Fotos dos Seus Queijos' : 'Fotos do Seu Comércio'}
                  </Label>
                  <p className="text-white/70 text-sm mt-1">
                    {isProdutor ? 'Adicione fotos correspondentes aos queijos que você produz. (Até 3 por tipo)' : 'Adicione até 3 fotos do seu comércio (ex: faixada, áreas internas). Pelo menos 1 foto é obrigatória.'}
                  </p>
                </div>

                {!isProdutor && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {images.map((img, index) => (
                      <div key={index} className="relative aspect-square rounded-[20px] overflow-hidden bg-black/20 border border-white/20">
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
                    {images.length < 3 && (
                      <button
                        type="button"
                        onClick={() => {
                          fileInputRef.current!.dataset.type = 'general';
                          fileInputRef.current?.click();
                        }}
                        disabled={uploading}
                        className="relative aspect-square rounded-[20px] border-2 border-dashed border-white/30 flex flex-col items-center justify-center text-white/70 hover:text-white hover:border-white/50 hover:bg-white/5 transition-colors disabled:opacity-80 overflow-hidden"
                      >
                        {uploading ? (
                          <div className="flex flex-col items-center justify-center z-10 w-full px-4">
                            <span className="text-sm font-bold text-app-accent mb-2">{Math.round(uploadProgress)}%</span>
                            <div className="w-full h-2 bg-black/40 rounded-full overflow-hidden">
                              <div className="h-full bg-app-accent transition-all duration-300 rounded-full" style={{ width: `${uploadProgress}%` }} />
                            </div>
                            <span className="text-xs text-white/90 mt-2 font-medium">Enviando...</span>
                          </div>
                        ) : (
                          <>
                            <Upload className="w-6 h-6 mb-2 relative z-10" />
                            <span className="text-sm font-medium relative z-10 text-center px-2">Adicionar Foto</span>
                          </>
                        )}
                        {uploading && (
                           <div className="absolute inset-0 bg-black/50 z-0" />
                        )}
                      </button>
                    )}
                  </div>
                )}

                {isProdutor && formData.cheeseTypes.map(cheese => {
                  const currentImages = cheeseImages[cheese] || [];
                  return (
                    <div key={cheese} className="mt-4 p-4 border border-white/10 rounded-[20px] bg-black/10">
                      <Label className="text-white font-semibold flex items-center gap-2 mb-3">
                        <span className="capitalize">{cheese}</span>
                        <span className="text-xs text-white/50 font-normal">({currentImages.length}/3 fotos)</span>
                      </Label>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {currentImages.map((img, index) => (
                          <div key={index} className="relative aspect-square rounded-[20px] overflow-hidden bg-black/20 border border-white/20">
                            <img src={img} alt={`Upload ${cheese} ${index + 1}`} className="w-full h-full object-cover" />
                            <button
                              type="button"
                              onClick={() => {
                                const newMap = { ...cheeseImages };
                                newMap[cheese].splice(index, 1);
                                setCheeseImages(newMap);
                              }}
                              className="absolute top-2 right-2 p-1 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                        {currentImages.length < 3 && (
                          <button
                            type="button"
                            onClick={() => {
                              fileInputRef.current!.dataset.type = cheese;
                              fileInputRef.current?.click();
                            }}
                            disabled={uploading}
                            className="relative aspect-square rounded-[20px] border-2 border-dashed border-white/30 flex flex-col items-center justify-center text-white/70 hover:text-white hover:border-white/50 hover:bg-white/5 transition-colors disabled:opacity-80 overflow-hidden"
                          >
                            {uploading && fileInputRef.current?.dataset.type === cheese ? (
                              <div className="flex flex-col items-center justify-center z-10 w-full px-4">
                                <span className="text-sm font-bold text-app-accent mb-2">{Math.round(uploadProgress)}%</span>
                                <div className="w-full h-2 bg-black/40 rounded-full overflow-hidden">
                                  <div className="h-full bg-app-accent transition-all duration-300 rounded-full" style={{ width: `${uploadProgress}%` }} />
                                </div>
                                <span className="text-xs text-white/90 mt-2 font-medium">Enviando...</span>
                              </div>
                            ) : (
                              <>
                                <Upload className="w-6 h-6 mb-2 relative z-10" />
                                <span className="text-sm font-medium relative z-10 text-center px-2">Adicionar Foto</span>
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}

                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  ref={fileInputRef}
                  onChange={(e) => handleImageUpload(e, fileInputRef.current?.dataset.type || 'general')}
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
                <p className="text-white/70">{profile.cpfCnpj}</p>
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
                <Package className="w-4 h-4 text-app-accent" /> Seção de Comercialização
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
