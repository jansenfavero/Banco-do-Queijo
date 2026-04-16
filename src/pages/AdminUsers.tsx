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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Shield className="h-8 w-8 text-orange-600" />
            Configurações e Permissões
          </h1>
          <p className="text-muted-foreground mt-2">
            Gerencie o nível de acesso e o status de todos os usuários da plataforma.
          </p>
        </div>
      </div>

      <div className="grid gap-6">
        {loading ? (
          <p>Carregando usuários...</p>
        ) : (
          users.map((user) => (
            <Card key={user.id} className={user.role === 'ADMIN' ? 'border-orange-500 border-2' : ''}>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl flex items-center gap-2">
                      {user.name}
                      {user.role === 'ADMIN' && <ShieldCheck className="h-5 w-5 text-orange-600" />}
                    </CardTitle>
                    <CardDescription>{user.email}</CardDescription>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">CNPJ/CPF: {user.cpfCnpj}</p>
                    <p className="text-sm text-muted-foreground">{user.city} - {user.state}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col md:flex-row gap-6 mt-4 pt-4 border-t">
                  <div className="flex-1 space-y-3">
                    <label className="text-sm font-medium">Perfil de Acesso (Role):</label>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant={user.role === 'ADMIN' ? 'default' : 'outline'}
                        className={user.role === 'ADMIN' ? 'bg-orange-600 hover:bg-orange-700' : ''}
                        onClick={() => updateUserRole(user.id, 'ADMIN')}
                        size="sm"
                      >
                        Administrador
                      </Button>
                      <Button
                        variant={user.role === 'PRODUTOR' ? 'default' : 'outline'}
                        onClick={() => updateUserRole(user.id, 'PRODUTOR')}
                        size="sm"
                      >
                        Produtor
                      </Button>
                      <Button
                        variant={user.role === 'ATACADISTA' ? 'default' : 'outline'}
                        onClick={() => updateUserRole(user.id, 'ATACADISTA')}
                        size="sm"
                      >
                        Atacadista/Comprador
                      </Button>
                    </div>
                  </div>
                  
                  <div className="flex-1 space-y-3">
                    <label className="text-sm font-medium">Status da Conta (Verificação):</label>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant={user.kycStatus === 'VALIDADO' ? 'default' : 'outline'}
                        className={user.kycStatus === 'VALIDADO' ? 'bg-green-600 hover:bg-green-700' : ''}
                        onClick={() => updateUserStatus(user.id, 'VALIDADO')}
                        size="sm"
                      >
                        Validado (Liberado)
                      </Button>
                      <Button
                        variant={user.kycStatus === 'PENDENTE' ? 'default' : 'outline'}
                        className={user.kycStatus === 'PENDENTE' ? 'bg-yellow-600 hover:bg-yellow-700 text-white' : ''}
                        onClick={() => updateUserStatus(user.id, 'PENDENTE')}
                        size="sm"
                      >
                        Pendente
                      </Button>
                      <Button
                        variant={user.kycStatus === 'BLOQUEADO' ? 'default' : 'outline'}
                        className={user.kycStatus === 'BLOQUEADO' ? 'bg-red-600 hover:bg-red-700 text-white' : ''}
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
