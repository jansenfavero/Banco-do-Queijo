import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { auth, db } from '../lib/firebase';
import { createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, updateProfile } from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { getFriendlyErrorMessage } from '../lib/errorMapping';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { RadioGroup, RadioGroupItem } from '../components/ui/radio-group';
import { toast } from 'sonner';
import { Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

const formatPhone = (value: string) => {
  const numbers = value.replace(/\D/g, '');
  if (numbers.length <= 2) return numbers.replace(/(\d{2})/, '($1');
  if (numbers.length <= 7) return numbers.replace(/(\d{2})(\d{1,5})/, '($1) $2');
  return numbers.replace(/(\d{2})(\d{5})(\d{1,4})/, '($1) $2-$3').slice(0, 15);
};

export function Register() {
  const navigate = useNavigate();
  const { user: authUser } = useAuth();
  const [searchParams] = useSearchParams();
  const defaultRole = searchParams.get('role') || 'PRODUTOR';

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    role: defaultRole,
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [googleUser, setGoogleUser] = useState<any>(null);

  useEffect(() => {
    const checkState = async () => {
      const currentUser = auth.currentUser;
      if (currentUser) {
        const docRef = doc(db, 'users', currentUser.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          navigate('/painel');
        } else {
          setGoogleUser(currentUser);
          setFormData(prev => ({
            ...prev,
            email: currentUser.email || prev.email,
            name: currentUser.displayName || prev.name
          }));
        }
      }
    };
    checkState();
  }, [navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.id === 'phone') {
      setFormData({ ...formData, phone: formatPhone(e.target.value) });
    } else {
      setFormData({ ...formData, [e.target.id]: e.target.value });
    }
  };

  const createProfileDoc = async (uid: string) => {
    await setDoc(doc(db, 'users', uid), {
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      role: formData.role,
      kycStatus: 'PENDENTE',
      createdAt: serverTimestamp()
    });
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.phone.length < 14) {
      toast.error('Informe um número de WhatsApp válido.');
      return;
    }

    setLoading(true);
    try {
      if (googleUser) {
        // Complete Google registration
        await createProfileDoc(googleUser.uid);
        toast.success('Cadastro concluído com sucesso!');
        navigate('/painel');
      } else {
        // Standard Email/Password Registration
        const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
        await updateProfile(userCredential.user, { displayName: formData.name });
        await createProfileDoc(userCredential.user.uid);
        toast.success('Cadastro concluído com sucesso!');
        navigate('/painel');
      }
    } catch (error: any) {
      console.error(error);
      toast.error(getFriendlyErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleRegister = async () => {
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      
      const docRef = doc(db, 'users', userCredential.user.uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        toast.success('Login realizado com sucesso!');
        navigate('/painel');
      } else {
        setGoogleUser(userCredential.user);
        setFormData(prev => ({
          ...prev,
          email: userCredential.user.email || prev.email,
          name: userCredential.user.displayName || prev.name
        }));
        toast.info('Para continuar, precisamos do seu WhatsApp e do seu perfil de uso.');
      }
    } catch (error: any) {
      console.error(error);
      toast.error(getFriendlyErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative p-4 overflow-hidden">
      <div className="absolute inset-0 z-0">
        <video 
          src="https://video.wixstatic.com/video/6acedd_b8aa7ae2be2f4d0fb1c8dd81ac1e15bf/720p/mp4/file.mp4" 
          autoPlay 
          loop 
          muted 
          playsInline 
          className="absolute inset-0 w-full h-full object-cover object-center" 
        />
        <div className="absolute inset-0 bg-[#4a2000]/70"></div>
      </div>

      <Card className="w-full max-w-md relative z-10 border-none shadow-2xl bg-[#a64b00] backdrop-blur-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="w-20 h-20 flex items-center justify-center">
              <img src="https://i.ibb.co/jvsrNzd3/Banco-do-Queijo-sem-fundo.png" alt="Banco do Queijo" className="w-full h-full object-contain" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-white">
            {googleUser ? 'Finalizar Cadastro' : 'Crie sua conta'}
          </CardTitle>
          <CardDescription className="text-white/70">
            {googleUser ? 'Falta pouco! Complete as informações abaixo.' : 'Junte-se à maior rede de queijos artesanais do Brasil'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleRegister} className="space-y-4">
            
            <div className="space-y-3">
              <Label className="text-white">Qual será o seu perfil? *</Label>
              <RadioGroup 
                value={formData.role} 
                onValueChange={(val) => setFormData({...formData, role: val})} 
                className="grid grid-cols-2 gap-4"
              >
                <div>
                  <RadioGroupItem value="PRODUTOR" id="role-produtor" className="peer sr-only" />
                  <Label htmlFor="role-produtor" className="flex flex-col items-center justify-between rounded-xl border-2 border-white/20 bg-white/5 p-4 hover:bg-white/10 peer-data-[state=checked]:border-app-accent peer-data-[state=checked]:bg-app-accent/20 cursor-pointer transition-all">
                    <span className="font-semibold text-white">Produtor</span>
                    <span className="text-xs text-center mt-1 text-white/70">Quero vender</span>
                  </Label>
                </div>
                <div>
                  <RadioGroupItem value="ATACADISTA" id="role-atacadista" className="peer sr-only" />
                  <Label htmlFor="role-atacadista" className="flex flex-col items-center justify-between rounded-xl border-2 border-white/20 bg-white/5 p-4 hover:bg-white/10 peer-data-[state=checked]:border-app-accent peer-data-[state=checked]:bg-app-accent/20 cursor-pointer transition-all">
                    <span className="font-semibold text-white">Atacadista</span>
                    <span className="text-xs text-center mt-1 text-white/70">Quero comprar</span>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name" className="text-white">Nome ou Razão Social *</Label>
              <Input 
                id="name" 
                value={formData.name}
                onChange={handleChange}
                required
                className="bg-[#5a2a00] border-none text-white placeholder:text-white/50 rounded-xl"
              />
            </div>

            {!googleUser && (
              <div className="space-y-2">
                <Label htmlFor="email" className="text-white">E-mail *</Label>
                <Input 
                  id="email" 
                  type="email" 
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="bg-[#5a2a00] border-none text-white placeholder:text-white/50 rounded-xl"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="phone" className="text-white">Nº do WhatsApp *</Label>
              <Input 
                id="phone" 
                placeholder="(00) 00000-0000"
                value={formData.phone}
                onChange={handleChange}
                required
                className="bg-[#5a2a00] border-none text-white placeholder:text-white/50 rounded-xl"
              />
            </div>

            {!googleUser && (
              <div className="space-y-2">
                <Label htmlFor="password" className="text-white">Senha *</Label>
                <div className="relative">
                  <Input 
                    id="password" 
                    type={showPassword ? "text" : "password"} 
                    value={formData.password}
                    onChange={handleChange}
                    required
                    minLength={6}
                    className="bg-[#5a2a00] border-none text-white pr-10 rounded-xl"
                  />
                  <button 
                    type="button" 
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/70 hover:text-white"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            )}

            <Button type="submit" className="w-full bg-app-accent text-[#5a2a00] hover:bg-app-accentHover font-bold rounded-xl" disabled={loading}>
              {loading ? 'Cadastrando...' : 'Criar Conta'}
            </Button>
          </form>

          {!googleUser && (
            <>
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-white/20" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-[#a64b00] px-2 text-white/70">Ou cadastre com</span>
                </div>
              </div>

              <Button variant="outline" type="button" className="w-full border-none bg-[#5a2a00] text-white hover:bg-[#4a2000] hover:text-white rounded-xl" onClick={handleGoogleRegister} disabled={loading}>
                <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                Google
              </Button>
            </>
          )}
        </CardContent>
        <CardFooter className="flex justify-center flex-col gap-2">
          <p className="text-sm text-white/80">
            Já tem uma conta?{' '}
            <Link to="/login" className="text-white hover:underline font-bold">
              Faça login
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
