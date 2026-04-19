import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { auth, db } from '../lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Switch } from '../components/ui/switch';
import { toast } from 'sonner';
import { Settings as SettingsIcon, Save } from 'lucide-react';
import { getFriendlyErrorMessage } from '../lib/errorMapping';

export function Settings() {
  const { user, profile } = useAuth();
  
  // Profile settings state
  const [name, setName] = useState(profile?.name || '');
  const [isActive, setIsActive] = useState(profile?.active !== false); // default true unless explicitly false
  const [savingProfile, setSavingProfile] = useState(false);

  // Security settings state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingSecurity, setSavingSecurity] = useState(false);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !user) return;
    
    setSavingProfile(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        name,
        active: isActive
      });
      toast.success('Perfil atualizado com sucesso.');
    } catch (error: any) {
      toast.error('Erro ao atualizar perfil.');
      console.error(error);
    } finally {
      setSavingProfile(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !user.email) return;

    if (newPassword !== confirmPassword) {
      toast.error('As novas senhas não coincidem.');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('A nova senha deve ter pelo menos 6 caracteres.');
      return;
    }

    setSavingSecurity(true);
    try {
      // Reauthenticate first
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);

      // Then update password
      await updatePassword(user, newPassword);
      toast.success('Senha atualizada com sucesso.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      toast.error(getFriendlyErrorMessage(error.code));
      console.error('Update password error', error);
    } finally {
      setSavingSecurity(false);
    }
  };

  // Check if provider is password (to show password change form)
  const isPasswordProvider = user?.providerData.some(
    (provider) => provider.providerId === 'password'
  );

  return (
    <div className="space-y-8 bg-app-cardDark min-h-screen p-4 md:p-8">
      <div className="flex items-center gap-4">
        <div className="p-3 bg-app-card rounded-2xl border border-app-accent/20 shadow-sm shrink-0">
          <SettingsIcon className="h-8 w-8 text-app-accent" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-1">
            Configurações da Conta
          </h1>
          <p className="text-white/70 text-sm md:text-base">
            Atualize seus dados pessoais e preferências de segurança.
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="shadow-2xl border-none bg-[#703200] text-white rounded-[24px] h-max">
          <CardHeader className="bg-[#d36101] border-b border-white/10 pb-6 pt-8 px-8 rounded-t-[24px] text-center">
            <CardTitle className="text-xl text-white">Dados do Perfil</CardTitle>
            <CardDescription className="text-white/80">
              Atualize as configurações básicas.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-8">
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-white/90 font-semibold">E-mail de Login</Label>
                <Input 
                  id="email" 
                  value={profile?.email || ''} 
                  disabled 
                  className="bg-black/20 border-white/10 text-white/50"
                />
                <p className="text-xs text-white/50">O e-mail de login não pode ser alterado diretamente.</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="name" className="text-white/90 font-semibold">Nome Completo / Razão Social</Label>
                <Input 
                  id="name" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  required
                  className="bg-black/20 border-white/20 text-white placeholder:text-white/40 focus:ring-amber-500 rounded-xl px-4"
                />
              </div>
              
              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-white/90 font-semibold text-base">Perfil Ativo</Label>
                    <p className="text-sm text-white/70">
                      Quando inativo, seu perfil e produtos/demandas ficarão ocultos na plataforma.
                    </p>
                  </div>
                  <Switch
                    checked={isActive}
                    onCheckedChange={setIsActive}
                    className="data-[state=checked]:bg-app-accent"
                  />
                </div>
              </div>

              <Button type="submit" disabled={savingProfile} className="w-full mt-6 bg-app-accent text-app-bgDark hover:bg-app-accentHover font-bold rounded-xl">
                {savingProfile ? 'Salvando...' : 'Salvar Alterações'}
                {!savingProfile && <Save className="ml-2 h-4 w-4" />}
              </Button>
            </form>
          </CardContent>
        </Card>

        {isPasswordProvider ? (
          <Card className="shadow-2xl border-none bg-[#703200] text-white rounded-[24px] h-max">
            <CardHeader className="bg-[#d36101] border-b border-white/10 pb-6 pt-8 px-8 rounded-t-[24px] text-center">
              <CardTitle className="text-xl text-white">Segurança</CardTitle>
              <CardDescription className="text-white/80">
                Atualize sua senha de acesso.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-8">
              <form onSubmit={handleUpdatePassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword" className="text-white/90 font-semibold">Senha Atual</Label>
                  <Input 
                    id="currentPassword" 
                    type="password"
                    value={currentPassword} 
                    onChange={(e) => setCurrentPassword(e.target.value)} 
                    required
                    className="bg-black/20 border-white/20 text-white placeholder:text-white/40 focus:ring-amber-500 rounded-xl px-4"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newPassword" className="text-white/90 font-semibold">Nova Senha</Label>
                  <Input 
                    id="newPassword" 
                    type="password"
                    value={newPassword} 
                    onChange={(e) => setNewPassword(e.target.value)} 
                    required
                    minLength={6}
                    className="bg-black/20 border-white/20 text-white placeholder:text-white/40 focus:ring-amber-500 rounded-xl px-4"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-white/90 font-semibold">Confirme a Nova Senha</Label>
                  <Input 
                    id="confirmPassword" 
                    type="password"
                    value={confirmPassword} 
                    onChange={(e) => setConfirmPassword(e.target.value)} 
                    required
                    minLength={6}
                    className="bg-black/20 border-white/20 text-white placeholder:text-white/40 focus:ring-amber-500 rounded-xl px-4"
                  />
                </div>
                <Button type="submit" disabled={savingSecurity || !currentPassword || !newPassword} className="w-full mt-6 bg-app-accent text-app-bgDark hover:bg-app-accentHover font-bold rounded-xl">
                  {savingSecurity ? 'Atualizando...' : 'Atualizar Senha'}
                </Button>
              </form>
            </CardContent>
          </Card>
        ) : (
          <Card className="shadow-2xl border-none bg-[#703200] text-white rounded-[24px] h-max">
            <CardHeader className="bg-[#d36101] border-b border-white/10 pb-6 pt-8 px-8 rounded-t-[24px] text-center">
              <CardTitle className="text-xl text-white">Segurança</CardTitle>
              <CardDescription className="text-white/80">
                Sua conta é vinculada ao Google.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-8">
              <p className="text-base text-white/90">
                Você faz login utilizando sua conta do Google. A modificação de senhas deve ser feita diretamente nas configurações do próprio Google.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
