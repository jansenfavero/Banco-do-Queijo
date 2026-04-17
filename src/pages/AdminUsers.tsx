import React, { useEffect, useState } from 'react';
import { collection, query, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Shield, ShieldAlert, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';

export function AdminUsers() {
  const { profile } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile?.role !== 'ADMIN') return;

    const q = query(collection(db, 'users'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const usersData: any[] = [];
      snapshot.forEach((doc) => {
        usersData.push({ id: doc.id, ...doc.data() });
      });
      // Sort admins first, then by name
      usersData.sort((a, b) => {
        if (a.role === 'ADMIN' && b.role !== 'ADMIN') return -1;
        if (a.role !== 'ADMIN' && b.role === 'ADMIN') return 1;
        return a.name.localeCompare(b.name);
      });
      setUsers(usersData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [profile]);

  const updateUserRole = async (userId: string, newRole: string) => {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, { role: newRole });
      toast.success(`Nível de acesso alterado para ${newRole} com sucesso!`);
    } catch (error: any) {
      console.error(error);
      toast.error('Erro ao atualizar nível de acesso. Verifique as permissões.');
    }
  };

  const updateUserStatus = async (userId: string, newStatus: string) => {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, { kycStatus: newStatus });
      toast.success(`Status da conta alterado para ${newStatus} com sucesso!`);
    } catch (error: any) {
      console.error(error);
      toast.error('Erro ao atualizar status.');
    }
  };

  if (profile?.role !== 'ADMIN') {
    return <div className="p-8 text-center text-red-500">Acesso negado. Apenas administradores.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 mb-8">
        <div className="p-3 bg-card rounded-2xl border border-border/50 shadow-sm shrink-0">
          <Shield className="h-8 w-8 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary mb-1">
            Configurações e Permissões
          </h1>
          <p className="text-muted-foreground text-sm md:text-base">
            Gerencie o nível de acesso e o status de todos os usuários da plataforma.
          </p>
        </div>
      </div>

      <div className="grid gap-6">
        {loading ? (
          <div className="flex justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          users.map((user) => (
            <Card key={user.id} className={`transition-all hover:shadow-md bg-card ${user.role === 'ADMIN' ? 'border-primary shadow-[0_0_15px_rgba(244,215,99,0.15)]' : 'border-border/50'}`}>
              <CardHeader className="pb-3 border-b border-border/40">
                <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-full ${user.role === 'ADMIN' ? 'bg-primary/20 text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}>
                      {user.role === 'ADMIN' ? <ShieldCheck className="h-6 w-6" /> : <Shield className="h-6 w-6" />}
                    </div>
                    <div>
                      <CardTitle className="text-xl font-bold text-foreground">
                        {user.name}
                      </CardTitle>
                      <CardDescription className="text-muted-foreground mt-1 text-sm">{user.email}</CardDescription>
                    </div>
                  </div>
                  {user.role !== 'ADMIN' && (
                    <div className="text-left md:text-right">
                      <p className="text-sm font-medium text-foreground">CNPJ/CPF: <span className="font-mono text-muted-foreground">{user.cpfCnpj}</span></p>
                      <p className="text-sm text-muted-foreground">{user.city} - {user.state}</p>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="flex flex-col md:flex-row gap-8">
                  <div className="flex-1 space-y-4">
                    <label className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Perfil de Acesso:</label>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant={user.role === 'ADMIN' ? 'default' : 'outline'}
                        className={user.role === 'ADMIN' ? 'bg-primary hover:bg-primary/90 text-primary-foreground' : 'hover:bg-primary/10 border-border/50 hover:border-primary/50 hover:text-primary'}
                        onClick={() => updateUserRole(user.id, 'ADMIN')}
                        size="sm"
                      >
                        Administrador
                      </Button>
                      <Button
                        variant={user.role === 'PRODUTOR' ? 'default' : 'outline'}
                        className={user.role === 'PRODUTOR' ? 'bg-primary hover:bg-primary/90 text-primary-foreground' : 'hover:bg-primary/10 border-border/50 hover:border-primary/50 hover:text-primary'}
                        onClick={() => updateUserRole(user.id, 'PRODUTOR')}
                        size="sm"
                      >
                        Produtor
                      </Button>
                      <Button
                        variant={user.role === 'ATACADISTA' ? 'default' : 'outline'}
                        className={user.role === 'ATACADISTA' ? 'bg-primary hover:bg-primary/90 text-primary-foreground' : 'hover:bg-primary/10 border-border/50 hover:border-primary/50 hover:text-primary'}
                        onClick={() => updateUserRole(user.id, 'ATACADISTA')}
                        size="sm"
                      >
                        Atacadista/Comprador
                      </Button>
                    </div>
                  </div>
                  
                  <div className="flex-1 space-y-4">
                    <label className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Status da Conta (Verificação):</label>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant={user.kycStatus === 'VALIDADO' ? 'default' : 'outline'}
                        className={user.kycStatus === 'VALIDADO' ? 'bg-green-600 hover:bg-green-700 text-white border-transparent' : 'hover:bg-green-500/20 border-border/50 hover:text-green-400 hover:border-green-500/50'}
                        onClick={() => updateUserStatus(user.id, 'VALIDADO')}
                        size="sm"
                      >
                        Validado (Liberado)
                      </Button>
                      <Button
                        variant={user.kycStatus === 'PENDENTE' ? 'default' : 'outline'}
                        className={user.kycStatus === 'PENDENTE' ? 'bg-yellow-500 hover:bg-yellow-600 text-white border-transparent' : 'hover:bg-yellow-500/20 border-border/50 hover:text-yellow-400 hover:border-yellow-500/50'}
                        onClick={() => updateUserStatus(user.id, 'PENDENTE')}
                        size="sm"
                      >
                        Pendente
                      </Button>
                      <Button
                        variant={user.kycStatus === 'BLOQUEADO' ? 'default' : 'outline'}
                        className={user.kycStatus === 'BLOQUEADO' ? 'bg-red-600 hover:bg-red-700 text-white border-transparent' : 'hover:bg-red-500/20 border-border/50 hover:text-red-400 hover:border-red-500/50'}
                        onClick={() => updateUserStatus(user.id, 'BLOQUEADO')}
                        size="sm"
                      >
                        <ShieldAlert className="h-4 w-4 mr-2" /> Bloqueado
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
