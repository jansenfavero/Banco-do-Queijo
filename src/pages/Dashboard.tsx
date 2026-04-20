import { useAuth } from '../hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Package, Users, DollarSign, TrendingUp, ShoppingBag, LayoutDashboard, ShieldCheck, ShoppingCart } from 'lucide-react';
import React from 'react';
import { CatalogMetrics } from './CatalogMetrics';

export function Dashboard() {
  const { profile } = useAuth();

  if (!profile) return null;

  return (
    <div className="space-y-8 p-6 md:p-10 max-w-7xl mx-auto">
      <div className="flex items-center gap-4">
        <div className="p-3 bg-app-cardDark rounded-2xl border border-app-accent/20 shadow-sm shrink-0">
          <LayoutDashboard className="h-8 w-8 text-app-accent" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-1">
            Dashboard
          </h1>
          <p className="text-white/70 text-sm md:text-base">
            Bem-vindo de volta, {profile.name}. Aqui está o resumo da sua conta.
          </p>
        </div>
      </div>

      <CatalogMetrics />

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
    <div className="space-y-8">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="p-0 gap-0 shadow-2xl border-none bg-[#703200] text-white overflow-hidden rounded-[24px]">
          <CardHeader className="rounded-t-[24px] flex flex-row items-center justify-between space-y-0 px-6 py-5 bg-[#d36101] border-b border-white/10">
            <CardTitle className="text-sm font-medium">Total de Usuários</CardTitle>
            <Users className="h-4 w-4 text-app-accent" />
          </CardHeader>
          <CardContent className="p-6">
            <div className="text-2xl font-bold">--</div>
            <p className="text-xs text-white/70">Produtores e Atacadistas</p>
          </CardContent>
        </Card>
        <Card className="p-0 gap-0 shadow-2xl border-none bg-[#703200] text-white overflow-hidden rounded-[24px]">
          <CardHeader className="rounded-t-[24px] flex flex-row items-center justify-between space-y-0 px-6 py-5 bg-[#d36101] border-b border-white/10">
            <CardTitle className="text-sm font-medium">Transações Totais</CardTitle>
            <DollarSign className="h-4 w-4 text-app-accent" />
          </CardHeader>
          <CardContent className="p-6">
            <div className="text-2xl font-bold">R$ 0,00</div>
            <p className="text-xs text-white/70">Volume transacionado</p>
          </CardContent>
        </Card>
        <Card className="p-0 gap-0 shadow-2xl border-none bg-[#703200] text-white overflow-hidden rounded-[24px]">
          <CardHeader className="rounded-t-[24px] flex flex-row items-center justify-between space-y-0 px-6 py-5 bg-[#d36101] border-b border-white/10">
            <CardTitle className="text-sm font-medium">Produtos Cadastrados</CardTitle>
            <Package className="h-4 w-4 text-app-accent" />
          </CardHeader>
          <CardContent className="p-6">
            <div className="text-2xl font-bold">--</div>
            <p className="text-xs text-white/70">No catálogo geral</p>
          </CardContent>
        </Card>
        <Card className="p-0 gap-0 shadow-2xl border-none ring-0 bg-[#703200] text-white overflow-hidden rounded-[24px]">
          <CardHeader className="rounded-none flex flex-row items-center justify-between space-y-0 px-6 py-5 bg-[#d36101] border-b border-white/10 m-0">
            <CardTitle className="text-sm font-medium">Demandas Ativas</CardTitle>
            <TrendingUp className="h-4 w-4 text-app-accent" />
          </CardHeader>
          <CardContent className="p-6">
            <div className="text-2xl font-bold">--</div>
            <p className="text-xs text-white/70">Aguardando propostas</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7 pt-4">
        <Card className="col-span-7 p-0 gap-0 shadow-2xl border-none ring-0 bg-[#703200] text-white overflow-hidden rounded-[24px]">
          <CardHeader className="rounded-none bg-[#d36101] border-b border-white/10 px-6 py-5 flex flex-col items-center justify-center m-0">
            <CardTitle className="text-xl flex items-center gap-2">
              <ShieldCheck className="w-5 h-5" />
              Painel Administrativo
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="text-center py-10 text-white/70 bg-[#4a2000] rounded-[20px] shadow-sm border border-white/10">
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
    <div className="space-y-8">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="p-0 gap-0 shadow-2xl border-none ring-0 bg-[#703200] text-white overflow-hidden rounded-[24px]">
          <CardHeader className="rounded-none flex flex-row items-center justify-between space-y-0 px-6 py-5 bg-[#d36101] border-b border-white/10 m-0">
            <CardTitle className="text-sm font-medium">Faturamento (30 dias)</CardTitle>
            <DollarSign className="h-4 w-4 text-app-accent" />
          </CardHeader>
          <CardContent className="p-6">
            <div className="text-2xl font-bold">R$ 0,00</div>
            <p className="text-xs text-white/70">+0% em relação ao mês anterior</p>
          </CardContent>
        </Card>
        <Card className="p-0 gap-0 shadow-2xl border-none ring-0 bg-[#703200] text-white overflow-hidden rounded-[24px]">
          <CardHeader className="rounded-none flex flex-row items-center justify-between space-y-0 px-6 py-5 bg-[#d36101] border-b border-white/10 m-0">
            <CardTitle className="text-sm font-medium">Pedidos Ativos</CardTitle>
            <ShoppingBag className="h-4 w-4 text-app-accent" />
          </CardHeader>
          <CardContent className="p-6">
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-white/70">0 aguardando envio</p>
          </CardContent>
        </Card>
        <Card className="p-0 gap-0 shadow-2xl border-none ring-0 bg-[#703200] text-white overflow-hidden rounded-[24px]">
          <CardHeader className="rounded-none flex flex-row items-center justify-between space-y-0 px-6 py-5 bg-[#d36101] border-b border-white/10 m-0">
            <CardTitle className="text-sm font-medium">Compradores Ativos</CardTitle>
            <Users className="h-4 w-4 text-app-accent" />
          </CardHeader>
          <CardContent className="p-6">
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-white/70">Clientes que compraram nos últimos 90 dias</p>
          </CardContent>
        </Card>
        <Card className="p-0 gap-0 shadow-2xl border-none ring-0 bg-[#703200] text-white overflow-hidden rounded-[24px]">
          <CardHeader className="rounded-none flex flex-row items-center justify-between space-y-0 px-6 py-5 bg-[#d36101] border-b border-white/10 m-0">
            <CardTitle className="text-sm font-medium">Produtos em Estoque</CardTitle>
            <Package className="h-4 w-4 text-app-accent" />
          </CardHeader>
          <CardContent className="p-6">
            <div className="text-2xl font-bold">0 kg</div>
            <p className="text-xs text-white/70">Total disponível para venda</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7 pt-4">
        <Card className="col-span-4 p-0 gap-0 shadow-2xl border-none ring-0 bg-[#703200] text-white overflow-hidden rounded-[24px]">
          <CardHeader className="rounded-none bg-[#d36101] border-b border-white/10 px-6 py-5 text-left m-0">
            <CardTitle className="text-xl flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-white" />
              Últimos Pedidos
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="text-center py-10 text-white/70 bg-[#4a2000] rounded-[20px] shadow-sm border border-white/10">
              Nenhum pedido recente.
            </div>
          </CardContent>
        </Card>
        <Card className="col-span-3 p-0 gap-0 shadow-2xl border-none ring-0 bg-[#703200] text-white overflow-hidden rounded-[24px]">
          <CardHeader className="rounded-none flex flex-row items-center justify-start bg-[#d36101] border-b border-white/10 px-6 py-5 m-0">
            <CardTitle className="text-xl flex items-center gap-2">
              <Package className="w-5 h-5 text-white" />
              Meus Queijos
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="text-center py-10 text-white/70 flex flex-col items-center gap-4 bg-[#4a2000] rounded-[20px] shadow-sm border border-white/10 p-4">
              <p>Seu Perfil e Produtos ainda não estão publicados, publique para que fique disponivel aos Atacadistas Compradores.</p>
            </div>
          </CardContent>
        </Card>
      </div>

    </div>
  );
}

function WholesalerDashboard() {
  return (
    <div className="space-y-8">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="p-0 gap-0 shadow-2xl border-none ring-0 bg-[#703200] text-white overflow-hidden rounded-[24px]">
          <CardHeader className="rounded-none flex flex-row items-center justify-between space-y-0 px-6 py-5 bg-[#d36101] border-b border-white/10 m-0">
            <CardTitle className="text-sm font-medium">Volume Comprado</CardTitle>
            <Package className="h-4 w-4 text-app-accent" />
          </CardHeader>
          <CardContent className="p-6">
            <div className="text-2xl font-bold">0 kg</div>
            <p className="text-xs text-white/70">Nos últimos 30 dias</p>
          </CardContent>
        </Card>
        <Card className="p-0 gap-0 shadow-2xl border-none ring-0 bg-[#703200] text-white overflow-hidden rounded-[24px]">
          <CardHeader className="rounded-none flex flex-row items-center justify-between space-y-0 px-6 py-5 bg-[#d36101] border-b border-white/10 m-0">
            <CardTitle className="text-sm font-medium">Valor Pago</CardTitle>
            <DollarSign className="h-4 w-4 text-app-accent" />
          </CardHeader>
          <CardContent className="p-6">
            <div className="text-2xl font-bold">R$ 0,00</div>
            <p className="text-xs text-white/70">Nos últimos 30 dias</p>
          </CardContent>
        </Card>
        <Card className="p-0 gap-0 shadow-2xl border-none ring-0 bg-[#703200] text-white overflow-hidden rounded-[24px]">
          <CardHeader className="rounded-none flex flex-row items-center justify-between space-y-0 px-6 py-5 bg-[#d36101] border-b border-white/10 m-0">
            <CardTitle className="text-sm font-medium">Produtores</CardTitle>
            <Users className="h-4 w-4 text-app-accent" />
          </CardHeader>
          <CardContent className="p-6">
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-white/70">Fornecedores ativos</p>
          </CardContent>
        </Card>
        <Card className="p-0 gap-0 shadow-2xl border-none ring-0 bg-[#703200] text-white overflow-hidden rounded-[24px]">
          <CardHeader className="rounded-none flex flex-row items-center justify-between space-y-0 px-6 py-5 bg-[#d36101] border-b border-white/10 m-0">
            <CardTitle className="text-sm font-medium">Demandas Ativas</CardTitle>
            <TrendingUp className="h-4 w-4 text-app-accent" />
          </CardHeader>
          <CardContent className="p-6">
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-white/70">Aguardando propostas</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7 pt-4">
        <Card className="col-span-4 p-0 gap-0 shadow-2xl border-none ring-0 bg-[#703200] text-white overflow-hidden rounded-[24px]">
          <CardHeader className="rounded-none bg-[#d36101] border-b border-white/10 px-6 py-5 text-left m-0">
            <CardTitle className="text-xl flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-white" />
              Histórico de Pedidos
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="text-center py-10 text-white/70 bg-[#4a2000] rounded-[20px] shadow-sm border border-white/10">
              Nenhum pedido recente.
            </div>
          </CardContent>
        </Card>
        <Card className="col-span-3 p-0 gap-0 shadow-2xl border-none ring-0 bg-[#703200] text-white overflow-hidden rounded-[24px]">
          <CardHeader className="rounded-none bg-[#d36101] border-b border-white/10 px-6 py-5 text-left m-0">
            <CardTitle className="text-xl flex items-center gap-2">
              <Users className="w-5 h-5 text-white" />
              Meus Fornecedores
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="text-center py-10 text-white/70 bg-[#4a2000] rounded-[20px] shadow-sm border border-white/10">
              Nenhum fornecedor ainda.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
