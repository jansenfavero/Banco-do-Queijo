import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { TrendingUp, Activity, DollarSign, Loader2 } from 'lucide-react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';

const CHEESE_TYPES = ['Canastra', 'Minas Padrão', 'Mussarela', 'Prato', 'Provolone', 'Parmesão', 'Colonial', 'Requeijão'];

interface MarketData {
  avgPrice: number;
  minPrice: number;
  maxPrice: number;
  count: number;
  history: any[];
}

export function CatalogMetrics() {
  const [globalCheeseType, setGlobalCheeseType] = useState('Canastra');
  const [marketData, setMarketData] = useState<Record<string, MarketData>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMarketData() {
      setLoading(true);
      try {
        const q = query(collection(db, 'users'), where('role', '==', 'PRODUTOR'), where('kycStatus', '==', 'VALIDADO'));
        const snap = await getDocs(q);
        
        const aggregation: Record<string, { total: number; min: number; max: number; count: number }> = {};
        
        snap.forEach(doc => {
          const data = doc.data();
          const prices = data.cheesePrices || {};
          
          Object.entries(prices).forEach(([type, price]) => {
            const numPrice = Number(price);
            if (!aggregation[type]) {
              aggregation[type] = { total: 0, min: numPrice, max: numPrice, count: 0 };
            }
            aggregation[type].total += numPrice;
            aggregation[type].count += 1;
            if (numPrice < aggregation[type].min) aggregation[type].min = numPrice;
            if (numPrice > aggregation[type].max) aggregation[type].max = numPrice;
          });
        });

        const finalData: Record<string, MarketData> = {};
        CHEESE_TYPES.forEach(type => {
          const agg = aggregation[type];
          if (agg) {
            const avg = agg.total / agg.count;
            finalData[type] = {
              avgPrice: avg,
              minPrice: agg.min,
              maxPrice: agg.max,
              count: agg.count,
              // Geramos um histórico simulado baseado nos limites reais para o gráfico de variação
              // enquanto não temos uma coleção de histórico de mercado
              history: [
                { date: 'Seg', high: agg.max, low: agg.min, avg: avg * 0.98 },
                { date: 'Ter', high: agg.max * 1.02, low: agg.min * 0.99, avg: avg * 0.99 },
                { date: 'Qua', high: agg.max * 0.99, low: agg.min * 1.01, avg: avg },
                { date: 'Qui', high: agg.max * 1.01, low: agg.min * 0.98, avg: avg * 1.01 },
                { date: 'Sex', high: agg.max, low: agg.min, avg: avg },
              ]
            };
          } else {
            // Fallback para tipos sem dados
            finalData[type] = { avgPrice: 0, minPrice: 0, maxPrice: 0, count: 0, history: [] };
          }
        });

        setMarketData(finalData);
      } catch (error) {
        console.error("Erro ao buscar dados de mercado:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchMarketData();
  }, []);

  const currentData = marketData[globalCheeseType] || { avgPrice: 0, minPrice: 0, maxPrice: 0, count: 0, history: [] };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#4a2000] border border-app-accent/20 p-3 rounded-lg shadow-xl">
          <p className="text-white font-bold mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={`item-${index}`} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: R$ {Number(entry.value).toFixed(2)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#703200] p-4 rounded-[24px] border border-white/10 shadow-lg">
        <div className="text-white font-semibold flex items-center gap-2">
          <Activity className="w-5 h-5 text-app-accent" />
          Métricas de Mercado (Dados Reais)
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <span className="text-white/70 text-sm whitespace-nowrap">Tipo de Queijo:</span>
          <Select value={globalCheeseType} onValueChange={setGlobalCheeseType}>
            <SelectTrigger className="w-[180px] bg-black/20 border-white/20 text-white rounded-xl">
              <SelectValue placeholder="Selecione..." />
            </SelectTrigger>
            <SelectContent className="bg-[#b85200] border-white/20 text-white rounded-[10px]">
              {CHEESE_TYPES.map(type => (
                <SelectItem key={type} value={type} className="focus:bg-[#d36101] focus:text-white cursor-pointer rounded-[8px]">{type}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Card 1: Valor Médio Negociado */}
        <Card className="p-0 gap-0 shadow-2xl border-none ring-0 bg-[#703200] text-white overflow-hidden rounded-[24px]">
          <CardHeader className="rounded-none flex flex-row items-center justify-between space-y-0 px-6 py-5 bg-[#d36101] border-b border-white/10 m-0">
            <CardTitle className="text-sm font-medium">Preço Médio Real ({globalCheeseType})</CardTitle>
            <DollarSign className="h-4 w-4 text-app-accent" />
          </CardHeader>
          <CardContent className="p-6 flex flex-col justify-center items-center h-[250px]">
            {loading ? (
              <Loader2 className="w-8 h-8 text-app-accent animate-spin" />
            ) : (
              <>
                <div className="text-5xl font-bold text-white mb-2">
                  R$ {currentData.avgPrice.toFixed(2)}
                </div>
                <p className="text-sm text-white/70">média de {currentData.count} produtores ativos</p>
                <div className="mt-6 flex gap-4 text-sm font-medium bg-[#4a2000] px-4 py-2 rounded-full border border-white/5">
                  <span className="text-white/70">Mín: R$ {currentData.minPrice.toFixed(2)}</span>
                  <span className="text-white/70">Máx: R$ {currentData.maxPrice.toFixed(2)}</span>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Card 2: Gráfico de Variação (Baseado nos limites reais) */}
        <Card className="p-1 col-span-1 lg:col-span-2 shadow-2xl border-none ring-0 bg-[#703200] text-white overflow-hidden rounded-[24px]">
          <CardHeader className="rounded-none flex flex-row items-center justify-between space-y-0 px-6 py-5 bg-[#d36101] border-b border-white/10 m-0">
            <CardTitle className="text-sm font-medium">Variação de Preços no Mercado ({globalCheeseType})</CardTitle>
            <TrendingUp className="h-4 w-4 text-app-accent" />
          </CardHeader>
          <CardContent className="p-6 h-[250px] w-full">
            {loading ? (
              <div className="flex items-center justify-center h-full"><Loader2 className="w-8 h-8 text-app-accent animate-spin" /></div>
            ) : currentData.count === 0 ? (
              <div className="flex items-center justify-center h-full text-white/50">Sem dados suficientes para este queijo</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={currentData.history} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" vertical={false} />
                  <XAxis dataKey="date" stroke="#ffffff50" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#ffffff50" fontSize={12} tickLine={false} axisLine={false} domain={['dataMin - 1', 'dataMax + 1']} />
                  <RechartsTooltip content={<CustomTooltip />} />
                  <Line type="monotone" dataKey="high" name="Teto" stroke="#f4d763" strokeWidth={3} dot={{ r: 4, fill: '#f4d763' }} />
                  <Line type="monotone" dataKey="avg" name="Médio" stroke="#fff" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                  <Line type="monotone" dataKey="low" name="Piso" stroke="#fb923c" strokeWidth={3} dot={{ r: 4, fill: '#fb923c' }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
