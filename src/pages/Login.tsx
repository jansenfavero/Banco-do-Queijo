import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { auth, db } from '../lib/firebase';
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { getFriendlyErrorMessage } from '../lib/errorMapping';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { toast } from 'sonner';
import { Eye, EyeOff } from 'lucide-react';

const ADMIN_EMAILS = ['contato@jansenfavero.com', 'casadoqueijo@gmail.com'];

export function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const checkAndCreateAdmin = async (user: any) => {
    const docRef = doc(db, 'users', user.uid);
    const docSnap = await getDoc(docRef);

    if (ADMIN_EMAILS.includes(user.email || '')) {
      if (!docSnap.exists()) {
        try {
          await setDoc(docRef, {
            name: user.displayName || 'Super Admin',
            email: user.email,
            role: 'ADMIN',
            kycStatus: 'VALIDADO',
            cpfCnpj: '00000000000',
            phone: '00000000000',
            city: 'Admin City',
            state: 'AD',
            createdAt: serverTimestamp()
          });
        } catch (e: any) {
             console.error("Firestore Error in creating admin", e);
             throw e;
        }
      } else if (docSnap.data().role !== 'ADMIN') {
        await setDoc(docRef, { role: 'ADMIN', kycStatus: 'VALIDADO' }, { merge: true });
      }
      navigate('/dashboard');
      return true;
    }

    if (docSnap.exists()) {
      navigate('/dashboard');
      return true;
    } else {
      return false;
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      const isHandled = await checkAndCreateAdmin(userCredential.user);
      if (!isHandled) {
        toast.error('Perfil não encontrado. Por favor, complete seu cadastro.');
        navigate('/register');
      }
    } catch (error: any) {
      console.error(error);
      toast.error(getFriendlyErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      
      const isHandled = await checkAndCreateAdmin(userCredential.user);
      if (!isHandled) {
        navigate('/register');
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

      <Card className="w-full max-w-md relative z-10 border-none shadow-2xl bg-[#d36101] backdrop-blur-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="w-20 h-20 flex items-center justify-center">
              <img src="https://i.ibb.co/jvsrNzd3/Banco-do-Queijo-sem-fundo.png" alt="Banco do Queijo" className="w-full h-full object-contain" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-white">Bem-vindo de volta</CardTitle>
          <CardDescription className="text-white/70">
            Entre na sua conta para acessar a plataforma
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-white">E-mail</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="seu@email.com" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-[#703200] border-none text-white placeholder:text-white/50"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-white">Senha</Label>
                <Link to="#" className="text-sm text-white/80 hover:text-white hover:underline">Esqueceu a senha?</Link>
              </div>
              <div className="relative">
                <Input 
                  id="password" 
                  type={showPassword ? "text" : "password"} 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="bg-[#703200] border-none text-white pr-10"
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
            <Button type="submit" className="w-full bg-app-accent text-app-bgDark hover:bg-app-accentHover font-bold" disabled={loading}>
              {loading ? 'Entrando...' : 'Entrar'}
            </Button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-[#d36101] px-2 text-white/70">Ou continue com</span>
            </div>
          </div>

          <Button variant="outline" type="button" className="w-full border-none bg-[#703200] text-white hover:bg-[#5a2800] hover:text-white" onClick={handleGoogleLogin} disabled={loading}>
            <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Google
          </Button>
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-sm text-white/80">
            Não tem uma conta?{' '}
            <Link to="/register" className="text-white hover:underline font-bold">
              Abra Sua Conta Grátis
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
