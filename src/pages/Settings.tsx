import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { auth, db } from '../lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { toast } from 'sonner';
import { Settings as SettingsIcon, Save } from 'lucide-react';
import { getFriendlyErrorMessage } from '../lib/errorMapping';

export function Settings() {
  const { user, profile } = useAuth();
  
  // Profile settings state
  const [name, setName] = useState(profile?.name || '');
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
        name
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
    <div className="space-y-6">
      <div className="flex items-center gap-4 mb-8">
        <div className="p-3 bg-card rounded-2xl border border-border/50 shadow-sm shrink-0">
          <SettingsIcon className="h-8 w-8 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary mb-1">
            Configurações da Conta
          </h1>
          <p className="text-muted-foreground text-sm md:text-base">
            Atualize seus dados pessoais e preferências de segurança.
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="bg-card shadow-sm border-border/50 h-max">
          <CardHeader>
            <CardTitle className="text-foreground">Dados do Perfil</CardTitle>
            <CardDescription className="text-muted-foreground">
              Atualize como você aparece na plataforma.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-foreground">E-mail de Login</Label>
                <Input 
                  id="email" 
                  value={profile?.email || ''} 
                  disabled 
                  className="bg-secondary text-secondary-foreground"
                />
                <p className="text-xs text-muted-foreground">O e-mail de login não pode ser alterado diretamente.</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="name" className="text-foreground">Nome Completo / Razão Social</Label>
                <Input 
                  id="name" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  required
                  className="bg-transparent text-foreground"
                />
              </div>
              
              <div className="space-y-2">
                <Label className="text-foreground">Perfil Ativo</Label>
                <Input value={profile?.role} disabled className="bg-secondary text-secondary-foreground uppercase font-bold" />
              </div>

              <Button type="submit" disabled={savingProfile} className="w-full mt-4">
                {savingProfile ? 'Salvando...' : 'Salvar Alterações'}
                {!savingProfile && <Save className="ml-2 h-4 w-4" />}
              </Button>
            </form>
          </CardContent>
        </Card>

        {isPasswordProvider ? (
          <Card className="bg-card shadow-sm border-border/50 h-max">
            <CardHeader>
              <CardTitle className="text-foreground">Segurança</CardTitle>
              <CardDescription className="text-muted-foreground">
                Atualize sua senha de acesso.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdatePassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword" className="text-foreground">Senha Atual</Label>
                  <Input 
                    id="currentPassword" 
                    type="password"
                    value={currentPassword} 
                    onChange={(e) => setCurrentPassword(e.target.value)} 
                    required
                    className="bg-transparent text-foreground"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newPassword" className="text-foreground">Nova Senha</Label>
                  <Input 
                    id="newPassword" 
                    type="password"
                    value={newPassword} 
                    onChange={(e) => setNewPassword(e.target.value)} 
                    required
                    minLength={6}
                    className="bg-transparent text-foreground"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-foreground">Confirme a Nova Senha</Label>
                  <Input 
                    id="confirmPassword" 
                    type="password"
                    value={confirmPassword} 
                    onChange={(e) => setConfirmPassword(e.target.value)} 
                    required
                    minLength={6}
                    className="bg-transparent text-foreground"
                  />
                </div>
                <Button type="submit" disabled={savingSecurity || !currentPassword || !newPassword} className="w-full mt-4">
                  {savingSecurity ? 'Atualizando...' : 'Atualizar Senha'}
                </Button>
              </form>
            </CardContent>
          </Card>
        ) : (
          <Card className="bg-card shadow-sm border-border/50 h-max">
            <CardHeader>
              <CardTitle className="text-foreground">Segurança</CardTitle>
              <CardDescription className="text-muted-foreground">
                Sua conta é vinculada ao Google.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-foreground">
                Você faz login utilizando sua conta do Google. A modificação de senhas deve ser feita diretamente nas configurações do próprio Google.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
