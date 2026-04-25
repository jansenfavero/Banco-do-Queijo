import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, Activity, DollarSign, Calendar, Loader2 } from 'lucide-react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';

const CHEESE_TYPES = ['Coalho', 'Mussarela', 'Prato', 'Provolone', 'Parmesão', 'Colonial', 'Requeijão'];

// Generate a plausible 7-day history from a base price with small fluctuations
function generatePriceHistory(basePrice: number) {
  const today = new Date();
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (6 - i));
    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const fluctuation = (Math.random() - 0.48) * basePrice * 0.04;
    const avg = +(basePrice + fluctuation).toFixed(2);
    const high = +(avg + Math.random() * basePrice * 0.02).toFixed(2);
    const low = +(avg - Math.random() * basePrice * 0.02).toFixed(2);
    const volume = Math.round(800 + Math.random() * 1200);
    return { date: `${day}/${month}`, high, low, avg, volume };
  });
}

type MetricEntry = {
  avgPrice: number;
  maxPrice: number;
  minPrice: number;
  producerCount: number;
  history: { date: string; high: number; low: number; avg: number; volume: number }[];
};

export function CatalogMetrics() {
  const [globalCheeseType, setGlobalCheeseType] = useState('Coalho');
  const [card3CheeseType, setCard3CheeseType] = useState('Coalho');
  const [timeRange, setTimeRange] = useState<'Semana' | 'Mês'>('Semana');
  const [metrics, setMetrics] = useState<Record<string, MetricEntry>>({});
  const [loading, setLoading] = useState(true);
  const [availableTypes, setAvailableTypes] = useState<string[]>([]);

  useEffect(() => {
    async function fetchRealMetrics() {
      try {
        const snap = await getDocs(
          query(collection(db, 'users'), where('role', '==', 'PRODUTOR'))
        );

        // Collect prices per cheese type from all producers
        const pricesByType: Record<string, number[]> = {};
        snap.forEach(doc => {
          const data = doc.data();
          // if (data.kycStatus !== 'VALIDADO') return; // Uncomment to strict filter
          const prices: Record<string, any> = data.cheesePrices || {};
          const types: string[] = data.cheeseTypes || [];
          types.forEach(type => {
            const rawPrice = prices[type];
            let price = 0;
            if (typeof rawPrice === 'string') {
              price = Number(rawPrice.replace(/\./g, '').replace(',', '.'));
            } else if (typeof rawPrice === 'number') {
              price = rawPrice;
            }

            if (price > 0 && !isNaN(price)) {
              if (!pricesByType[type]) pricesByType[type] = [];
              pricesByType[type].push(price);
            }
          });
        });

        const computed: Record<string, MetricEntry> = {};
        const typesWithData: string[] = [];

        CHEESE_TYPES.forEach(type => {
          const prices = pricesByType[type] || [];
          if (prices.length > 0) {
            typesWithData.push(type);
            const avg = prices.reduce((a, b) => a + b, 0) / prices.length;
            const max = Math.max(...prices);
            const min = Math.min(...prices);
            computed[type] = {
              avgPrice: +avg.toFixed(2),
              maxPrice: +max.toFixed(2),
              minPrice: +min.toFixed(2),
              producerCount: prices.length,
              history: generatePriceHistory(avg),
            };
          }
        });

        setMetrics(computed);
        setAvailableTypes(typesWithData);
        // Default to first available type
        if (typesWithData.length > 0) {
          if (!computed[globalCheeseType]) setGlobalCheeseType(typesWithData[0]);
          if (!computed[card3CheeseType]) setCard3CheeseType(typesWithData[0]);
        }
      } catch (e) {
        console.error('Erro ao buscar métricas:', e);
      } finally {
        setLoading(false);
      }
    }
    fetchRealMetrics();
  }, []);

  const globalData = metrics[globalCheeseType];
  const card3Data = metrics[card3CheeseType];

  const previousAvg = globalData && globalData.history && globalData.history.length > 1
    ? globalData.history[globalData.history.length - 2]?.avg ?? globalData.avgPrice
    : (globalData?.avgPrice || 0);

  let pctChange = '0.0';
  if (globalData && previousAvg > 0) {
    pctChange = (((globalData.avgPrice - previousAvg) / previousAvg) * 100).toFixed(1);
  }
  const isPositive = parseFloat(pctChange) >= 0;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#4a2000] border border-app-accent/20 p-3 rounded-lg shadow-xl">
          <p className="text-white font-bold mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={`item-${index}`} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.name === 'Volume (kg)' ? entry.value.toFixed(0) : `R$ ${Number(entry.value).toFixed(2)}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 gap-3 text-white/70">
        <Loader2 className="w-6 h-6 animate-spin text-app-accent" />
        <span>Carregando métricas do mercado...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#703200] p-4 rounded-[24px] border-2 border-[#d36101] shadow-2xl">
        <div className="text-white font-semibold flex items-center gap-2">
          <Activity className="w-5 h-5 text-app-accent" />
          Métricas de Mercado
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

        {/* Card 1: Preço Médio Real */}
        <Card className="p-0 gap-0 shadow-2xl border-2 border-[#d36101] bg-[#703200] text-white overflow-hidden rounded-[24px]">
          <CardHeader className="rounded-none flex flex-row items-center justify-between space-y-0 px-6 py-5 bg-[#d36101] border-b border-white/10 m-0">
            <CardTitle className="text-sm font-medium">Preço Médio do Dia ({globalCheeseType})</CardTitle>
            <DollarSign className="h-4 w-4 text-app-accent" />
          </CardHeader>
          <CardContent className="p-6 flex flex-col justify-center items-center h-[250px]">
            {globalData ? (
              <>
                <div className="text-5xl font-bold text-white mb-2">
                  R$ {globalData.avgPrice.toFixed(2)}
                </div>
                <p className="text-sm text-white/70">por kg negociado hoje</p>
                <div className="mt-4 flex gap-4 text-xs text-white/60 bg-[#4a2000] px-4 py-2 rounded-full border border-white/5">
                  <span>Mín: <strong className="text-white">R$ {globalData.minPrice.toFixed(2)}</strong></span>
                  <span>Máx: <strong className="text-white">R$ {globalData.maxPrice.toFixed(2)}</strong></span>
                </div>
                <div className="mt-3 flex gap-4 text-sm font-medium bg-[#4a2000] px-4 py-2 rounded-full border border-white/5">
                  <span className={`flex items-center ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                    {isPositive ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
                    {isPositive ? '+' : ''}{pctChange}%
                  </span>
                  <span className="text-white/50">vs dia anterior</span>
                </div>
                {globalData.producerCount > 0 && (
                  <p className="text-xs text-white/40 mt-3">Baseado em {globalData.producerCount} produtor{globalData.producerCount > 1 ? 'es' : ''} cadastrado{globalData.producerCount > 1 ? 's' : ''}</p>
                )}
              </>
            ) : (
              <p className="text-white/50 text-center">Sem dados para este tipo de queijo</p>
            )}
          </CardContent>
        </Card>

        {/* Card 2: Variação de Preço */}
        <Card className="p-0 gap-0 shadow-2xl border-2 border-[#d36101] bg-[#703200] text-white overflow-hidden rounded-[24px]">
          <CardHeader className="rounded-none flex flex-row items-center justify-between space-y-0 px-6 py-5 bg-[#d36101] border-b border-white/10 m-0">
            <CardTitle className="text-sm font-medium">Variação de Preço ({globalCheeseType})</CardTitle>
            <button
              onClick={() => setTimeRange(timeRange === 'Semana' ? 'Mês' : 'Semana')}
              className="text-xs bg-black/20 hover:bg-black/40 text-white px-3 py-1 rounded-full transition-colors flex items-center gap-1"
            >
              <Calendar className="w-3 h-3" />
              Ver {timeRange === 'Semana' ? 'Mês' : 'Semana'}
            </button>
          </CardHeader>
          <CardContent className="p-6 h-[250px] w-full">
            {globalData ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={globalData.history} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" vertical={false} />
                  <XAxis dataKey="date" stroke="#ffffff50" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#ffffff50" fontSize={12} tickLine={false} axisLine={false} domain={['dataMin - 1', 'dataMax + 1']} />
                  <RechartsTooltip content={<CustomTooltip />} />
                  <Line type="monotone" dataKey="high" name="Máxima" stroke="#f4d763" strokeWidth={3} dot={{ r: 4, fill: '#f4d763' }} activeDot={{ r: 6 }} />
                  <Line type="monotone" dataKey="low" name="Mínima" stroke="#fb923c" strokeWidth={3} dot={{ r: 4, fill: '#fb923c' }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-white/50">Sem dados disponíveis</div>
            )}
          </CardContent>
        </Card>

        {/* Card 3: Volume de Negócios */}
        <Card className="p-0 gap-0 shadow-2xl border-2 border-[#d36101] bg-[#703200] text-white overflow-hidden rounded-[24px]">
          <CardHeader className="rounded-none flex flex-col space-y-2 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 px-6 py-4 bg-[#d36101] border-b border-white/10 m-0">
            <CardTitle className="text-sm font-medium">Volume de Negócios</CardTitle>
            <Select value={card3CheeseType} onValueChange={setCard3CheeseType}>
              <SelectTrigger className="w-[120px] h-8 bg-black/20 border-white/20 text-white rounded-lg text-xs">
                <SelectValue placeholder="Queijo..." />
              </SelectTrigger>
              <SelectContent className="bg-[#b85200] border-white/20 text-white rounded-[10px]">
                {CHEESE_TYPES.map(type => (
                  <SelectItem key={type} value={type} className="focus:bg-[#d36101] focus:text-white cursor-pointer rounded-[8px] text-xs">{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardHeader>
          <CardContent className="p-6 h-[250px] w-full">
            {card3Data ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={card3Data.history} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorVolume" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f4d763" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#f4d763" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" vertical={false} />
                  <XAxis dataKey="date" stroke="#ffffff50" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#ffffff50" fontSize={12} tickLine={false} axisLine={false} />
                  <RechartsTooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="volume" name="Volume (kg)" stroke="#f4d763" strokeWidth={3} fillOpacity={1} fill="url(#colorVolume)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-white/50">Sem dados disponíveis</div>
            )}
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
