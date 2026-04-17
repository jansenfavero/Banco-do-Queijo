import { useAuth } from '../hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Package, Users, DollarSign, TrendingUp, ShoppingBag, LayoutDashboard } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { RadioGroup, RadioGroupItem } from '../components/ui/radio-group';
import { Checkbox } from '../components/ui/checkbox';
import { useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { toast } from 'sonner';

const CHEESE_TYPES = [
  'Qualho', 'Mussarela', 'Frescal', 'Canastra', 'Parmesão', 'Prato', 'Provolone', 'Gorgonzola', 'Ricota', 'Meia Cura'
];

export function Dashboard() {
  const { profile } = useAuth();

  if (!profile) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 mb-8">
        <div className="p-3 bg-card rounded-2xl border border-border/50 shadow-sm shrink-0">
          <LayoutDashboard className="h-8 w-8 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary mb-1">
            Dashboard
          </h1>
          <p className="text-muted-foreground text-sm md:text-base">
            Bem-vindo de volta, {profile.name}. Aqui está o resumo da sua conta.
          </p>
        </div>
      </div>

      {profile.kycStatus === 'PENDENTE' && profile.role !== 'ADMIN' && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                Sua conta está com status <strong>PENDENTE</strong>. Nossa equipe está analisando seus dados (KYC). Você poderá operar na plataforma assim que for validado.
              </p>
            </div>
          </div>
        </div>
      )}

      {profile.role === 'ADMIN' ? <AdminDashboard /> : profile.role === 'PRODUTOR' ? <ProducerDashboard /> : <WholesalerDashboard />}
    </div>
  );
}

function AdminDashboard() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Usuários</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">--</div>
            <p className="text-xs text-muted-foreground">Produtores e Atacadistas</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Transações Totais</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ 0,00</div>
            <p className="text-xs text-muted-foreground">Volume transacionado</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Produtos Cadastrados</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">--</div>
            <p className="text-xs text-muted-foreground">No catálogo geral</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Demandas Ativas</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">--</div>
            <p className="text-xs text-muted-foreground">Aguardando propostas</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-7">
          <CardHeader>
            <CardTitle>Painel Administrativo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-10 text-muted-foreground">
              Você tem acesso total à plataforma. Use o menu lateral para gerenciar o catálogo, demandas e pedidos.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ProducerDashboard() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Faturamento (30 dias)</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ 0,00</div>
            <p className="text-xs text-muted-foreground">+0% em relação ao mês anterior</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pedidos Ativos</CardTitle>
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">0 aguardando envio</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Compradores Ativos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">Clientes que compraram nos últimos 90 dias</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Produtos em Estoque</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0 kg</div>
            <p className="text-xs text-muted-foreground">Total disponível para venda</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Últimos Pedidos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-10 text-muted-foreground">
              Nenhum pedido recente.
            </div>
          </CardContent>
        </Card>
        <Card className="col-span-3">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Meus Queijos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-10 text-muted-foreground flex flex-col items-center gap-4">
              <p>Seu Perfil e Produtos ainda não estão publicados, publique para que fique disponivel aos Atacadistas Compradores.</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-1">
        <ProducerProfileCard />
      </div>
    </div>
  );
}

function ProducerProfileCard() {
  const { profile } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    weeklyVolume: profile?.weeklyVolume || '',
    chargesFreight: profile?.chargesFreight ? 'SIM' : 'NAO',
    freightType: profile?.freightType || 'FIXO',
    freightValue: profile?.freightValue || '',
    cheeseTypes: profile?.cheeseTypes || []
  });

  if (!profile) return null;

  const handleCheckboxChange = (type: string, checked: boolean) => {
    if (checked) {
      setFormData({ ...formData, cheeseTypes: [...formData.cheeseTypes, type] });
    } else {
      setFormData({ ...formData, cheeseTypes: formData.cheeseTypes.filter((t: string) => t !== type) });
    }
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
        weeklyVolume: Number(formData.weeklyVolume),
        chargesFreight: formData.chargesFreight === 'SIM',
        freightType: formData.freightType,
        freightValue: formData.chargesFreight === 'SIM' ? Number(formData.freightValue) : 0,
        cheeseTypes: formData.cheeseTypes
      });
      toast.success('Dados atualizados com sucesso!');
      setIsDialogOpen(false);
    } catch (error) {
      console.error(error);
      toast.error('Erro ao atualizar dados.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Dados de Cadastro e Comercialização</CardTitle>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">Editar Detalhes</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px] bg-[#d36101] border-none text-white shadow-2xl" overlayClassName="bg-[#4a2000]/80 backdrop-blur-sm">
            <DialogHeader>
              <DialogTitle>Editar Dados do Produtor</DialogTitle>
              <DialogDescription className="text-white/80">
                Atualize as informações de produção e frete.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label className="text-white">Volume Semanal (Kg)</Label>
                <Input type="number" min="0" value={formData.weeklyVolume} onChange={e => setFormData({...formData, weeklyVolume: e.target.value})} className="bg-black/20 border-white/10 text-white placeholder:text-white/40 focus:ring-white/20" required />
              </div>
              <div className="space-y-2">
                <Label className="text-white">Tipos Produzidos</Label>
                <div className="grid grid-cols-2 gap-2 bg-[#4a2000] p-4 rounded-lg">
                  {CHEESE_TYPES.map(type => (
                    <div key={type} className="flex items-center space-x-2">
                      <Checkbox 
                        id={`edit-cheese-${type}`} 
                        checked={formData.cheeseTypes.includes(type)}
                        onCheckedChange={(checked) => handleCheckboxChange(type, checked as boolean)}
                        className="border-white/50 data-[state=checked]:bg-app-accent data-[state=checked]:text-app-bgDark"
                      />
                      <label htmlFor={`edit-cheese-${type}`} className="text-sm font-medium leading-none text-white cursor-pointer">
                        {type}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-white">Cobra frete?</Label>
                <RadioGroup 
                  value={formData.chargesFreight} 
                  onValueChange={(v) => setFormData({...formData, chargesFreight: v})}
                  className="flex space-x-4 bg-[#4a2000] p-4 rounded-lg"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="SIM" id="edit-f1" className="border-white/50 text-app-accent" />
                    <Label htmlFor="edit-f1" className="text-white cursor-pointer">Sim</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="NAO" id="edit-f2" className="border-white/50 text-app-accent" />
                    <Label htmlFor="edit-f2" className="text-white cursor-pointer">Não</Label>
                  </div>
                </RadioGroup>
              </div>

              {formData.chargesFreight === 'SIM' && (
                <div className="grid grid-cols-2 gap-4 bg-[#4a2000]/50 p-4 rounded-lg">
                  <div className="space-y-2">
                    <Label className="text-white">Tipo de Cobrança</Label>
                    <RadioGroup 
                      value={formData.freightType} 
                      onValueChange={(v) => setFormData({...formData, freightType: v})}
                      className="flex flex-col space-y-2"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="FIXO" id="edit-ft1" className="border-white/50 text-app-accent" />
                        <Label htmlFor="edit-ft1" className="text-white cursor-pointer">Fixo</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="POR_KM" id="edit-ft2" className="border-white/50 text-app-accent" />
                        <Label htmlFor="edit-ft2" className="text-white cursor-pointer">Por KM</Label>
                      </div>
                    </RadioGroup>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-white">Valor (R$)</Label>
                    <Input 
                      type="number" 
                      step="0.01"
                      min="0"
                      value={formData.freightValue} 
                      onChange={e => setFormData({...formData, freightValue: e.target.value})} 
                      className="bg-black/20 border-white/10 text-white placeholder:text-white/40 focus:ring-white/20" 
                      required 
                    />
                  </div>
                </div>
              )}
              
              <DialogFooter className="pt-4">
                <Button type="button" variant="outline" className="border-none bg-[#4a2000] text-white hover:bg-[#3a1800] hover:text-white rounded-full font-bold" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                <Button type="submit" className="bg-[#ffcb05] text-[#4a2000] hover:bg-[#ffb000] rounded-full font-bold" disabled={loading}>{loading ? 'Salvando...' : 'Salvar Alterações'}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">Localidade</p>
            <p>{profile.city} - {profile.state}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">Volume Semanal</p>
            <p>{profile.weeklyVolume} kg</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">Frete</p>
            <p>
              {profile.chargesFreight ? `Sim (${profile.freightType === 'FIXO' ? 'Fixo: R$ ' + profile.freightValue : 'Por KM: R$ ' + profile.freightValue})` : 'Não cobrar frete'}
            </p>
          </div>
          <div className="space-y-1 md:col-span-2 lg:col-span-3">
            <p className="text-sm font-medium text-muted-foreground">Tipos Produzidos</p>
            <div className="flex flex-wrap gap-2 mt-2">
              {profile.cheeseTypes?.map((c: string) => (
                <span key={c} className="bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded-full">{c}</span>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function WholesalerDashboard() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Volume Comprado</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0 kg</div>
            <p className="text-xs text-muted-foreground">Nos últimos 30 dias</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Pago</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ 0,00</div>
            <p className="text-xs text-muted-foreground">Nos últimos 30 dias</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Produtores</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">Fornecedores ativos</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Demandas Ativas</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">Aguardando propostas</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Histórico de Pedidos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-10 text-muted-foreground">
              Nenhum pedido recente.
            </div>
          </CardContent>
        </Card>
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Meus Fornecedores</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-10 text-muted-foreground">
              Nenhum fornecedor ainda.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
