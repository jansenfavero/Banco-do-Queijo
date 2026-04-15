import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { auth, db } from '../lib/firebase';
import { createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../lib/firebase';
import { getFriendlyErrorMessage } from '../lib/errorMapping';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Checkbox } from '../components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '../components/ui/radio-group';
import { toast } from 'sonner';
import { ShieldCheck, ArrowRight, ArrowLeft, Upload, X, Eye, EyeOff } from 'lucide-react';

const CHEESE_TYPES = [
  'Qualho', 'Mussarela', 'Frescal', 'Canastra', 'Parmesão', 'Prato', 'Provolone', 'Gorgonzola', 'Ricota', 'Meia Cura'
];

const formatCPF = (value: string) => {
  return value.replace(/\D/g, '').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})/, '$1-$2').replace(/(-\d{2})\d+?$/, '$1');
};

const formatCNPJ = (value: string) => {
  return value.replace(/\D/g, '').replace(/(\d{2})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1/$2').replace(/(\d{4})(\d)/, '$1-$2').replace(/(-\d{2})\d+?$/, '$1');
};

const validateCPF = (cpf: string) => {
  cpf = cpf.replace(/[^\d]+/g, '');
  if (cpf.length !== 11 || !!cpf.match(/(\d)\1{10}/)) return false;
  let sum = 0, rest;
  for (let i = 1; i <= 9; i++) sum = sum + parseInt(cpf.substring(i - 1, i)) * (11 - i);
  rest = (sum * 10) % 11;
  if ((rest === 10) || (rest === 11)) rest = 0;
  if (rest !== parseInt(cpf.substring(9, 10))) return false;
  sum = 0;
  for (let i = 1; i <= 10; i++) sum = sum + parseInt(cpf.substring(i - 1, i)) * (12 - i);
  rest = (sum * 10) % 11;
  if ((rest === 10) || (rest === 11)) rest = 0;
  if (rest !== parseInt(cpf.substring(10, 11))) return false;
  return true;
};

const validateCNPJ = (cnpj: string) => {
  cnpj = cnpj.replace(/[^\d]+/g, '');
  if (cnpj.length !== 14 || !!cnpj.match(/(\d)\1{13}/)) return false;
  let size = cnpj.length - 2;
  let numbers = cnpj.substring(0, size);
  let digits = cnpj.substring(size);
  let sum = 0;
  let pos = size - 7;
  for (let i = size; i >= 1; i--) {
    sum += parseInt(numbers.charAt(size - i)) * pos--;
    if (pos < 2) pos = 9;
  }
  let result = sum % 11 < 2 ? 0 : 11 - sum % 11;
  if (result !== parseInt(digits.charAt(0))) return false;
  size = size + 1;
  numbers = cnpj.substring(0, size);
  sum = 0;
  pos = size - 7;
  for (let i = size; i >= 1; i--) {
    sum += parseInt(numbers.charAt(size - i)) * pos--;
    if (pos < 2) pos = 9;
  }
  result = sum % 11 < 2 ? 0 : 11 - sum % 11;
  if (result !== parseInt(digits.charAt(1))) return false;
  return true;
};

export function Register() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const defaultRole = searchParams.get('role') || 'PRODUTOR';

  const [currentStep, setCurrentStep] = useState(1);
  const step2Ref = React.useRef<HTMLDivElement>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: defaultRole,
    cpfCnpj: '',
    phone: '',
    city: '',
    state: '',
    weeklyVolume: 100,
    labelPreference: 'AMBOS',
    cheeseTypes: [] as string[],
    chargesFreight: 'NAO',
    freightType: 'FIXO',
    freightValue: '',
    producerProfile: '', // 'SEM_CNPJ' | 'COM_CNPJ'
    razaoSocial: '',
    nomeFantasia: '',
    titular: '',
    tempoAbertura: '',
    cep: '',
    logradouro: '',
    numero: '',
    complemento: '',
    bairro: ''
  });
  const [images, setImages] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 2) return numbers.replace(/(\d{2})/, '($1');
    if (numbers.length <= 7) return numbers.replace(/(\d{2})(\d{1,5})/, '($1) $2');
    return numbers.replace(/(\d{2})(\d{5})(\d{1,4})/, '($1) $2-$3').slice(0, 15);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.id === 'phone') {
      setFormData({ ...formData, phone: formatPhone(e.target.value) });
    } else {
      setFormData({ ...formData, [e.target.id]: e.target.value });
    }
  };

  const handleRoleChange = (value: string) => {
    setFormData({ ...formData, role: value });
    setCurrentStep(1); // Reset step when changing role
    setImages([]);
  };

  const handleSelectChange = (field: string, value: string) => {
    if (field === 'producerProfile' && formData.producerProfile !== value) {
      // Reset fields when switching between CPF and CNPJ
      setFormData({
        ...formData,
        [field]: value,
        cpfCnpj: '',
        razaoSocial: '',
        nomeFantasia: '',
        titular: '',
        tempoAbertura: '',
        cep: '',
        logradouro: '',
        numero: '',
        complemento: '',
        bairro: '',
        city: '',
        state: ''
      });
    } else {
      setFormData({ ...formData, [field]: value });
    }
  };

  const handleCepChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 8) value = value.slice(0, 8);
    
    let formattedCep = value;
    if (value.length > 5) {
      formattedCep = `${value.slice(0, 5)}-${value.slice(5)}`;
    }
    
    setFormData(prev => ({ ...prev, cep: formattedCep }));

    if (value.length === 8) {
      try {
        const response = await fetch(`https://viacep.com.br/ws/${value}/json/`);
        if (response.ok) {
          const data = await response.json();
          if (!data.erro) {
            setFormData(prev => ({
              ...prev,
              logradouro: data.logradouro || prev.logradouro,
              bairro: data.bairro || prev.bairro,
              city: data.localidade || prev.city,
              state: data.uf || prev.state
            }));
            toast.success('Endereço preenchido pelo CEP!');
          }
        }
      } catch (error) {
        console.error('Erro ao buscar CEP', error);
      }
    }
  };

  const handleCpfCnpjChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    if (formData.role === 'PRODUTOR' && formData.producerProfile === 'SEM_CNPJ') {
      value = formatCPF(value);
    } else {
      value = formatCNPJ(value);
    }
    setFormData({ ...formData, cpfCnpj: value });

    // Auto-fill CNPJ
    if ((formData.role === 'ATACADISTA' || (formData.role === 'PRODUTOR' && formData.producerProfile === 'COM_CNPJ')) && value.replace(/\D/g, '').length === 14) {
      const cleanCNPJ = value.replace(/\D/g, '');
      if (validateCNPJ(cleanCNPJ)) {
        try {
          const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cleanCNPJ}`);
          if (response.ok) {
            const data = await response.json();
            
            // Format date from YYYY-MM-DD to DD/MM/YYYY
            let formattedDate = data.data_inicio_atividade || '';
            if (formattedDate && formattedDate.includes('-')) {
              const [year, month, day] = formattedDate.split('-');
              formattedDate = `${day}/${month}/${year}`;
            }

            // Get titular (usually the first partner/qsa, or razao_social for MEI)
            let titularName = '';
            if (data.qsa && data.qsa.length > 0) {
              titularName = data.qsa[0].nome_socio || '';
            }
            if (!titularName) {
              titularName = data.razao_social || '';
            }

            const cepFormatado = data.cep ? `${data.cep.slice(0, 5)}-${data.cep.slice(5)}` : '';

            setFormData(prev => ({
              ...prev,
              cpfCnpj: value,
              razaoSocial: data.razao_social || '',
              nomeFantasia: data.nome_fantasia || data.razao_social || '',
              titular: titularName,
              cep: cepFormatado,
              logradouro: data.descricao_tipo_de_logradouro ? `${data.descricao_tipo_de_logradouro} ${data.logradouro}` : (data.logradouro || ''),
              numero: data.numero || '',
              complemento: data.complemento || '',
              bairro: data.bairro || '',
              city: data.municipio || '',
              state: data.uf || '',
              tempoAbertura: formattedDate
            }));
            toast.success('Dados do CNPJ preenchidos!');

            // If we have a CEP from CNPJ, try to fetch better address data from ViaCEP
            if (data.cep) {
              try {
                const viaCepResponse = await fetch(`https://viacep.com.br/ws/${data.cep}/json/`);
                if (viaCepResponse.ok) {
                  const viaCepData = await viaCepResponse.json();
                  if (!viaCepData.erro) {
                    setFormData(prev => ({
                      ...prev,
                      logradouro: viaCepData.logradouro || prev.logradouro,
                      bairro: viaCepData.bairro || prev.bairro,
                      city: viaCepData.localidade || prev.city,
                      state: viaCepData.uf || prev.state
                    }));
                  }
                }
              } catch (error) {
                console.error('Erro ao buscar ViaCEP após CNPJ', error);
              }
            }
          }
        } catch (error) {
          console.error('Erro ao buscar CNPJ', error);
        }
      } else {
        toast.error('CNPJ inválido');
      }
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      const maxFiles = formData.role === 'PRODUTOR' ? 5 : 3;
      if (images.length + newFiles.length > maxFiles) {
        toast.warning(`Você pode enviar no máximo ${maxFiles} imagens.`);
        return;
      }
      setImages([...images, ...newFiles]);
    }
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleCheckboxChange = (type: string, checked: boolean) => {
    if (checked) {
      setFormData({ ...formData, cheeseTypes: [...formData.cheeseTypes, type] });
    } else {
      setFormData({ ...formData, cheeseTypes: formData.cheeseTypes.filter(t => t !== type) });
    }
  };

  const nextStep = () => {
    if (!formData.weeklyVolume || formData.weeklyVolume < 100) {
      toast.error('O volume semanal mínimo é de 100 kg.');
      return;
    }
    if (formData.cheeseTypes.length === 0) {
      toast.error('Selecione pelo menos um tipo de queijo.');
      return;
    }
    if (images.length === 0) {
      toast.error('Envie pelo menos uma imagem.');
      return;
    }
    if (formData.role === 'PRODUTOR' && formData.chargesFreight === 'SIM') {
      if (!formData.freightValue || formData.freightValue === '0,00') {
        toast.error('Informe um valor de frete válido.');
        return;
      }
    }
    setCurrentStep(2);
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 100);
  };

  const prevStep = () => {
    setCurrentStep(1);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error('Por favor, insira um e-mail válido.');
      return;
    }

    // Password validation (min 6 chars, alphanumeric/special)
    if (formData.password.length < 6) {
      toast.error('A senha deve ter no mínimo 6 caracteres.');
      return;
    }

    if (!formData.weeklyVolume || formData.weeklyVolume < 100) {
      toast.error('O volume semanal mínimo é de 100 kg.');
      return;
    }
    if (formData.cheeseTypes.length === 0) {
      toast.error('Selecione pelo menos um tipo de queijo.');
      return;
    }
    if (images.length === 0) {
      toast.error('Envie pelo menos uma imagem.');
      return;
    }
    if (formData.role === 'PRODUTOR') {
      if (formData.producerProfile === 'SEM_CNPJ' && !validateCPF(formData.cpfCnpj)) {
        toast.error('CPF inválido.');
        return;
      }
      if (formData.producerProfile === 'COM_CNPJ' && !validateCNPJ(formData.cpfCnpj)) {
        toast.error('CNPJ inválido.');
        return;
      }
    } else {
      if (!validateCNPJ(formData.cpfCnpj) && !validateCPF(formData.cpfCnpj)) {
        toast.error('CPF/CNPJ inválido.');
        return;
      }
    }

    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      
      const uploadedImageUrls = [];
      for (const file of images) {
        const imageRef = ref(storage, `users/${userCredential.user.uid}/images/${file.name}-${Date.now()}`);
        await uploadBytes(imageRef, file);
        const url = await getDownloadURL(imageRef);
        uploadedImageUrls.push(url);
      }

      const profileData: any = {
        name: formData.name,
        email: formData.email,
        role: formData.role,
        cpfCnpj: formData.cpfCnpj,
        phone: formData.phone,
        city: formData.city,
        state: formData.state,
        weeklyVolume: Number(formData.weeklyVolume),
        labelPreference: formData.labelPreference,
        cheeseTypes: formData.cheeseTypes,
        images: uploadedImageUrls,
        kycStatus: 'PENDENTE',
        createdAt: serverTimestamp()
      };

      if (formData.role === 'PRODUTOR') {
        profileData.producerProfile = formData.producerProfile;
        if (formData.producerProfile === 'COM_CNPJ') {
          profileData.razaoSocial = formData.razaoSocial;
          profileData.nomeFantasia = formData.nomeFantasia;
          profileData.titular = formData.titular;
          profileData.tempoAbertura = formData.tempoAbertura;
          profileData.cep = formData.cep;
          profileData.logradouro = formData.logradouro;
          profileData.numero = formData.numero;
          profileData.complemento = formData.complemento;
          profileData.bairro = formData.bairro;
        }
        profileData.chargesFreight = formData.chargesFreight === 'SIM';
        if (profileData.chargesFreight) {
          profileData.freightType = formData.freightType;
          profileData.freightValue = Number(formData.freightValue);
        }
      }

      await setDoc(doc(db, 'users', userCredential.user.uid), profileData);

      toast.success('Conta criada com sucesso!');
      navigate('/dashboard');
    } catch (error: any) {
      console.error(error);
      toast.error(getFriendlyErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleRegister = async () => {
    if (!formData.weeklyVolume || formData.weeklyVolume < 100) {
      toast.error('O volume semanal mínimo é de 100 kg.');
      return;
    }
    if (formData.cheeseTypes.length === 0) {
      toast.error('Selecione pelo menos um tipo de queijo.');
      return;
    }
    if (images.length === 0) {
      toast.error('Envie pelo menos uma imagem.');
      return;
    }

    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      
      const uploadedImageUrls = [];
      for (const file of images) {
        const imageRef = ref(storage, `users/${userCredential.user.uid}/images/${file.name}-${Date.now()}`);
        await uploadBytes(imageRef, file);
        const url = await getDownloadURL(imageRef);
        uploadedImageUrls.push(url);
      }

      const profileData: any = {
        name: userCredential.user.displayName || formData.name || 'Usuário',
        email: userCredential.user.email,
        role: formData.role,
        cpfCnpj: formData.cpfCnpj || '00000000000',
        phone: formData.phone || '00000000000',
        city: formData.city || 'Cidade',
        state: formData.state || 'UF',
        weeklyVolume: Number(formData.weeklyVolume),
        labelPreference: formData.labelPreference,
        cheeseTypes: formData.cheeseTypes,
        images: uploadedImageUrls,
        kycStatus: 'PENDENTE',
        createdAt: serverTimestamp()
      };

      if (formData.role === 'PRODUTOR') {
        profileData.producerProfile = formData.producerProfile;
        if (formData.producerProfile === 'COM_CNPJ') {
          profileData.razaoSocial = formData.razaoSocial;
          profileData.nomeFantasia = formData.nomeFantasia;
          profileData.titular = formData.titular;
          profileData.tempoAbertura = formData.tempoAbertura;
          profileData.cep = formData.cep;
          profileData.logradouro = formData.logradouro;
          profileData.numero = formData.numero;
          profileData.complemento = formData.complemento;
          profileData.bairro = formData.bairro;
        }
        profileData.chargesFreight = formData.chargesFreight === 'SIM';
        if (profileData.chargesFreight) {
          profileData.freightType = formData.freightType;
          profileData.freightValue = Number(formData.freightValue);
        }
      }

      await setDoc(doc(db, 'users', userCredential.user.uid), profileData, { merge: true });

      toast.success('Conta criada com sucesso!');
      navigate('/dashboard');
    } catch (error: any) {
      console.error(error);
      toast.error(getFriendlyErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "bg-[#4a2000] border-none text-white rounded-full px-4 py-6 focus-visible:ring-app-accent focus-visible:ring-offset-0";
  const labelClass = "text-white font-bold ml-2 mb-1 block";

  const renderProductInfo = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
      {formData.role === 'PRODUTOR' && (
        <div className="bg-[#4a2000]/80 border border-app-accent/30 rounded-[25px] p-4 flex items-start gap-3 mb-6">
          <ShieldCheck className="w-6 h-6 text-app-accent shrink-0 mt-0.5" />
          <div>
            <h4 className="text-white font-bold text-sm mb-1">Suas informações estão seguras</h4>
            <p className="text-white/80 text-xs leading-relaxed">
              Estes dados são necessários para que seus queijos fiquem disponíveis na plataforma e sejam encontrados por potenciais compradores. O cadastro é <strong>100% gratuito</strong> para o Produtor.
            </p>
          </div>
        </div>
      )}

      <div className="text-center">
        <h3 className="text-2xl font-bold text-white mb-4">
          {formData.role === 'PRODUTOR' ? 'Informações de Produção' : 'Informações de Compra'}
        </h3>
        <div className="w-full h-px bg-white/20 mb-6" />
      </div>

      <div className="space-y-6">
        <div className="space-y-1">
          <Label htmlFor="weeklyVolume" className={labelClass}>
            {formData.role === 'PRODUTOR' ? 'Quantos Kilos de Queijo produz por semana?' : 'Quantos Kilos de Queijo compra por semana?'} (Mín. 100) <span className="text-app-accent">*</span>
          </Label>
          <Input 
            id="weeklyVolume" 
            type="number" 
            min="100" 
            max="9999"
            value={formData.weeklyVolume} 
            onChange={handleChange} 
            required 
            className={`${inputClass} max-w-[120px] text-center`} 
          />
        </div>

        <div className="space-y-3">
          <Label className={labelClass}>
            {formData.role === 'PRODUTOR' ? 'Como vem a embalagem do seu queijo?' : 'Como prefere a embalagem do queijo que você compra?'} <span className="text-app-accent">*</span>
          </Label>
          <RadioGroup 
            value={formData.labelPreference} 
            onValueChange={(v) => handleSelectChange('labelPreference', v)}
            className="flex flex-col space-y-2 bg-[#4a2000] p-4 rounded-[25px]"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="COM_ROTULO" id="r1" className="border-white/50 text-app-accent" />
              <Label htmlFor="r1" className="text-white cursor-pointer">Com Rótulo</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="SEM_ROTULO" id="r2" className="border-white/50 text-app-accent" />
              <Label htmlFor="r2" className="text-white cursor-pointer">Sem Rótulo</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="AMBOS" id="r3" className="border-white/50 text-app-accent" />
              <Label htmlFor="r3" className="text-white cursor-pointer">Ambos</Label>
            </div>
          </RadioGroup>
        </div>

        <div className="space-y-3">
          <Label className={labelClass}>
            {formData.role === 'PRODUTOR' ? 'Opções de queijo que produz' : 'Opções de queijo que compra'} <span className="text-app-accent">*</span>
          </Label>
          <div className="grid grid-cols-2 gap-4 bg-[#4a2000] p-5 rounded-[25px]">
            {CHEESE_TYPES.map(type => (
              <div key={type} className="flex items-center space-x-2">
                <Checkbox 
                  id={`cheese-${type}`} 
                  checked={formData.cheeseTypes.includes(type)}
                  onCheckedChange={(checked) => handleCheckboxChange(type, checked as boolean)}
                  className="border-white/50 data-[state=checked]:bg-app-accent data-[state=checked]:text-app-bgDark"
                />
                <label htmlFor={`cheese-${type}`} className="text-sm font-medium leading-none text-white cursor-pointer">
                  {type}
                </label>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <Label className={labelClass}>
            {formData.role === 'PRODUTOR' ? 'Fotos dos seus Queijos (Até 5 imagens)' : 'Fotos do seu Comércio (Até 3 imagens: 1 Fachada, 2 Internas)'} <span className="text-app-accent">*</span>
          </Label>
          <div className="bg-[#4a2000] p-4 rounded-[25px]">
            <div className="flex flex-wrap gap-4 mb-4">
              {images.map((file, index) => (
                <div key={index} className="relative w-24 h-24 rounded-xl overflow-hidden border-2 border-app-accent/50">
                  <img src={URL.createObjectURL(file)} alt={`Preview ${index}`} className="w-full h-full object-cover" />
                  <button type="button" onClick={() => removeImage(index)} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
              {images.length < (formData.role === 'PRODUTOR' ? 5 : 3) && (
                <label className="w-24 h-24 rounded-xl border-2 border-dashed border-white/30 flex flex-col items-center justify-center cursor-pointer hover:border-app-accent hover:bg-white/5 transition-colors">
                  <Upload className="w-6 h-6 text-white/50 mb-1" />
                  <span className="text-[10px] text-white/50 text-center px-1">Adicionar Foto</span>
                  <input type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" />
                </label>
              )}
            </div>
            <p className="text-xs text-white/60">
              {formData.role === 'PRODUTOR' ? 'Envie fotos atrativas dos seus queijos para o seu card.' : 'Envie fotos da fachada e do interior do seu comércio.'}
            </p>
          </div>
        </div>

        {formData.role === 'PRODUTOR' && (
          <>
            <div className="space-y-3">
              <Label className={labelClass}>Cobra frete pra entrega? <span className="text-app-accent">*</span></Label>
              <RadioGroup 
                value={formData.chargesFreight} 
                onValueChange={(v) => handleSelectChange('chargesFreight', v)}
                className="flex space-x-4 bg-[#4a2000] p-4 rounded-[25px]"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="SIM" id="f1" className="border-white/50 text-app-accent" />
                  <Label htmlFor="f1" className="text-white cursor-pointer">Sim</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="NAO" id="f2" className="border-white/50 text-app-accent" />
                  <Label htmlFor="f2" className="text-white cursor-pointer">Não</Label>
                </div>
              </RadioGroup>
            </div>

            {formData.chargesFreight === 'SIM' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-[#4a2000]/50 p-4 rounded-[25px] animate-in fade-in zoom-in-95 duration-300">
                <div className="space-y-3">
                  <Label className={labelClass}>Tipo de Cobrança <span className="text-app-accent">*</span></Label>
                  <RadioGroup 
                    value={formData.freightType} 
                    onValueChange={(v) => handleSelectChange('freightType', v)}
                    className="flex flex-col space-y-2"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="FIXO" id="ft1" className="border-white/50 text-app-accent" />
                      <Label htmlFor="ft1" className="text-white cursor-pointer">Valor Fixo</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="POR_KM" id="ft2" className="border-white/50 text-app-accent" />
                      <Label htmlFor="ft2" className="text-white cursor-pointer">Valor por KM</Label>
                    </div>
                  </RadioGroup>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="freightValue" className={labelClass}>Valor (R$) <span className="text-app-accent">*</span></Label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/70 font-bold">R$</span>
                    <Input 
                      id="freightValue" 
                      type="text" 
                      value={formData.freightValue} 
                      onChange={(e) => {
                        let value = e.target.value.replace(/\D/g, '');
                        value = (Number(value) / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
                        if (value === '0,00') value = '';
                        setFormData({ ...formData, freightValue: value });
                      }} 
                      placeholder="0,00"
                      required 
                      className={`${inputClass} pl-12`} 
                    />
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {formData.role === 'PRODUTOR' && (
        <Button type="button" onClick={nextStep} className="w-full mt-8 bg-app-accent text-app-bgDark hover:bg-app-accentHover font-bold rounded-full py-6 text-lg">
          Próxima Etapa <ArrowRight className="ml-2 w-5 h-5" />
        </Button>
      )}
    </div>
  );

  const renderPersonalInfo = () => (
    <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-500" ref={step2Ref}>
      <div className="text-center">
        <h3 className="text-2xl font-bold text-white mb-4">
          {formData.role === 'PRODUTOR' ? 'Informações do Produtor' : 'Informações Pessoais'}
        </h3>
        <div className="w-full h-px bg-white/20 mb-6" />
      </div>

      {formData.role === 'PRODUTOR' && (
        <div className="space-y-3 mb-6">
          <Label className={labelClass}>Informe Seu Perfil de Produtor <span className="text-app-accent">*</span></Label>
          <RadioGroup 
            value={formData.producerProfile} 
            onValueChange={(v) => handleSelectChange('producerProfile', v)}
            className="flex flex-col space-y-2 bg-[#4a2000] p-4 rounded-[25px]"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="SEM_CNPJ" id="p1" className="border-white/50 text-app-accent" />
              <Label htmlFor="p1" className="text-white cursor-pointer">Produção Artesanal Sem CNPJ</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="COM_CNPJ" id="p2" className="border-white/50 text-app-accent" />
              <Label htmlFor="p2" className="text-white cursor-pointer">Produção Artesanal Com CNPJ</Label>
            </div>
          </RadioGroup>
        </div>
      )}

      {/* Fields for Atacadista OR Produtor Sem CNPJ */}
      {(formData.role === 'ATACADISTA' || (formData.role === 'PRODUTOR' && formData.producerProfile === 'SEM_CNPJ')) && (
        <>
          <div className="space-y-1">
            <Label htmlFor="name" className={labelClass}>Nome Completo <span className="text-app-accent">*</span></Label>
            <Input id="name" value={formData.name} onChange={handleChange} required className={inputClass} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="cpfCnpj" className={labelClass}>CPF <span className="text-app-accent">*</span></Label>
            <Input id="cpfCnpj" value={formData.cpfCnpj} onChange={handleCpfCnpjChange} maxLength={14} placeholder="000.000.000-00" required className={inputClass} />
          </div>
        </>
      )}

      {/* Fields for Produtor Com CNPJ */}
      {formData.role === 'PRODUTOR' && formData.producerProfile === 'COM_CNPJ' && (
        <>
          <div className="space-y-1">
            <Label htmlFor="cpfCnpj" className={labelClass}>CNPJ <span className="text-app-accent">*</span></Label>
            <Input id="cpfCnpj" value={formData.cpfCnpj} onChange={handleCpfCnpjChange} maxLength={18} placeholder="00.000.000/0000-00" required className={inputClass} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="razaoSocial" className={labelClass}>Razão Social <span className="text-app-accent">*</span></Label>
            <Input id="razaoSocial" value={formData.razaoSocial} onChange={handleChange} required className={inputClass} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="nomeFantasia" className={labelClass}>Nome Fantasia <span className="text-app-accent">*</span></Label>
            <Input id="nomeFantasia" value={formData.nomeFantasia} onChange={handleChange} required className={inputClass} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="titular" className={labelClass}>Nome do Titular Principal <span className="text-app-accent">*</span></Label>
            <Input id="titular" value={formData.titular} onChange={handleChange} required className={inputClass} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="tempoAbertura" className={labelClass}>Tempo de Abertura <span className="text-app-accent">*</span></Label>
            <Input id="tempoAbertura" value={formData.tempoAbertura} onChange={handleChange} required className={inputClass} />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1 md:col-span-1">
              <Label htmlFor="cep" className={labelClass}>CEP <span className="text-app-accent">*</span></Label>
              <Input id="cep" value={formData.cep} onChange={handleCepChange} maxLength={9} placeholder="00000-000" required className={inputClass} />
            </div>
            <div className="space-y-1 md:col-span-2">
              <Label htmlFor="logradouro" className={labelClass}>Logradouro <span className="text-app-accent">*</span></Label>
              <Input id="logradouro" value={formData.logradouro} onChange={handleChange} required className={inputClass} />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1 md:col-span-1">
              <Label htmlFor="numero" className={labelClass}>Número <span className="text-app-accent">*</span></Label>
              <Input id="numero" value={formData.numero} onChange={handleChange} required className={inputClass} />
            </div>
            <div className="space-y-1 md:col-span-2">
              <Label htmlFor="complemento" className={labelClass}>Complemento</Label>
              <Input id="complemento" value={formData.complemento} onChange={handleChange} className={inputClass} />
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="bairro" className={labelClass}>Bairro <span className="text-app-accent">*</span></Label>
            <Input id="bairro" value={formData.bairro} onChange={handleChange} required className={inputClass} />
          </div>
        </>
      )}

      {/* Common Fields */}
      {((formData.role === 'PRODUTOR' && formData.producerProfile !== '') || formData.role === 'ATACADISTA') && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="city" className={labelClass}>Cidade <span className="text-app-accent">*</span></Label>
              <Input id="city" value={formData.city} onChange={handleChange} required className={inputClass} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="state" className={labelClass}>Estado (UF) <span className="text-app-accent">*</span></Label>
              <Input id="state" value={formData.state} onChange={handleChange} maxLength={2} required className={inputClass} />
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="email" className={labelClass}>E-mail <span className="text-app-accent">*</span></Label>
            <Input id="email" type="email" value={formData.email} onChange={handleChange} required className={inputClass} />
          </div>
          
          <div className="space-y-1">
            <Label htmlFor="phone" className={labelClass}>WhatsApp <span className="text-app-accent">*</span></Label>
            <Input id="phone" value={formData.phone} onChange={handleChange} maxLength={15} placeholder="(00) 00000-0000" required className={inputClass} />
          </div>

          <div className="space-y-1">
            <Label htmlFor="password" className={labelClass}>Senha <span className="text-app-accent">*</span></Label>
            <div className="relative">
              <Input 
                id="password" 
                type={showPassword ? "text" : "password"} 
                value={formData.password} 
                onChange={handleChange} 
                required 
                minLength={6} 
                className={inputClass} 
              />
              <button 
                type="button" 
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </>
      )}

      {formData.role === 'PRODUTOR' ? (
        <div className="flex gap-4 mt-8 items-end justify-between">
          <Button type="button" variant="outline" onClick={prevStep} className="w-1/3 border-none bg-[#4a2000] text-white hover:bg-[#3a1800] hover:text-white rounded-full py-6 font-bold">
            <ArrowLeft className="mr-2 w-5 h-5" /> Voltar
          </Button>
          <Button type="submit" className="w-1/2 bg-app-accent text-app-bgDark hover:bg-app-accentHover font-bold rounded-full py-6 text-lg ml-auto" disabled={loading || !formData.producerProfile}>
            {loading ? 'Cadastrando...' : 'Concluir Cadastro'}
          </Button>
        </div>
      ) : (
        <Button type="submit" className="w-full mt-8 bg-app-accent text-app-bgDark hover:bg-app-accentHover font-bold rounded-full py-6 text-lg" disabled={loading}>
          {loading ? 'Cadastrando...' : 'Abra Sua Conta Grátis'}
        </Button>
      )}
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center relative p-4 py-12 overflow-hidden">
      {/* Video Background */}
      <div className="absolute inset-0 z-0">
        <video 
          src="https://video.wixstatic.com/video/6acedd_b8aa7ae2be2f4d0fb1c8dd81ac1e15bf/720p/mp4/file.mp4" 
          autoPlay 
          loop 
          muted 
          playsInline 
          className="absolute inset-0 w-full h-full object-cover object-center" 
        />
        <div className="absolute inset-0 bg-[#703200]/50"></div>
      </div>

      <Card className="w-full max-w-2xl relative z-10 border-none shadow-2xl bg-[#d36101] backdrop-blur-md rounded-3xl overflow-hidden flex flex-col">
        <div className="flex-1">
          <CardHeader className="space-y-1 text-center pb-2">
            <div className="flex justify-center mb-4">
              <div className="w-20 h-20 flex items-center justify-center">
                <img src="https://i.ibb.co/jvsrNzd3/Banco-do-Queijo-sem-fundo.png" alt="Banco do Queijo" className="w-full h-full object-contain" />
              </div>
            </div>
            <CardTitle className="text-3xl font-bold text-white">Crie sua conta</CardTitle>
            <CardDescription className="text-white/80 text-base">
              Preencha os dados abaixo para se cadastrar na plataforma
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6 pb-8">
            
            {/* Abas de Alternância */}
            <div className="flex justify-center mb-8">
              <div className="flex bg-black/20 p-1.5 rounded-full border border-white/10">
                <button
                  type="button"
                  onClick={() => handleRoleChange('PRODUTOR')}
                  className={`px-6 py-2.5 rounded-full text-sm md:text-base font-bold transition-all duration-300 ${formData.role === 'PRODUTOR' ? 'bg-app-accent text-app-bgDark shadow-lg' : 'text-white/70 hover:text-white hover:bg-white/5'}`}
                >
                  Sou Produtor
                </button>
                <button
                  type="button"
                  onClick={() => handleRoleChange('COMPRADOR')}
                  className={`px-6 py-2.5 rounded-full text-sm md:text-base font-bold transition-all duration-300 ${formData.role === 'COMPRADOR' ? 'bg-app-accent text-app-bgDark shadow-lg' : 'text-white/70 hover:text-white hover:bg-white/5'}`}
                >
                  Sou Atacadista
                </button>
              </div>
            </div>

            <form onSubmit={handleRegister}>
              {formData.role === 'PRODUTOR' ? (
                currentStep === 1 ? renderProductInfo() : renderPersonalInfo()
              ) : (
                <div className="space-y-8">
                  {renderPersonalInfo()}
                  <div className="border-t border-white/20 pt-8">
                    {renderProductInfo()}
                  </div>
                </div>
              )}
            </form>

            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-white/20" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-[#d36101] px-2 text-white/70">Ou continue com</span>
              </div>
            </div>

            <Button variant="outline" type="button" className="w-full border-none bg-[#4a2000] text-white hover:bg-[#3a1800] hover:text-white rounded-full py-6" onClick={handleGoogleRegister} disabled={loading}>
              Google (Preencha os dados acima primeiro)
            </Button>
          </CardContent>
        </div>
        <CardFooter className="bg-[#4a2000] py-6 flex justify-center rounded-b-3xl mt-auto">
          <div className="text-center text-white/80 text-lg">
            Já tem uma conta?{' '}
            <Link to="/login" className="text-app-accent font-bold hover:underline">
              Faça login
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
