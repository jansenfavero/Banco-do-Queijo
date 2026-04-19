import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { TrendingUp, Activity, DollarSign, Calendar } from 'lucide-react';

const MOCK_METRICS = {
  'Coalho': {
    avgPrice: 45.50,
    history: [
      { date: '12/04', high: 46.00, low: 44.00, avg: 45.00, volume: 1200 },
      { date: '13/04', high: 46.50, low: 45.00, avg: 45.50, volume: 1500 },
      { date: '14/04', high: 45.50, low: 43.50, avg: 44.50, volume: 1100 },
      { date: '15/04', high: 46.00, low: 44.50, avg: 45.20, volume: 1300 },
      { date: '16/04', high: 47.00, low: 45.50, avg: 46.00, volume: 1600 },
      { date: '17/04', high: 47.50, low: 46.00, avg: 46.80, volume: 1700 },
      { date: '18/04', high: 48.00, low: 46.50, avg: 47.20, volume: 1900 },
    ],
    monthHistory: Array.from({length: 30}, (_, i) => ({
      date: `${i+1}/04`, high: 44 + Math.random()*5, low: 42 + Math.random()*3, avg: 43 + Math.random()*4, volume: 1000 + Math.random()*1000
    }))
  },
  'Mussarela': {
    avgPrice: 38.20,
    history: [
      { date: '12/04', high: 39.00, low: 37.00, avg: 38.00, volume: 2200 },
      { date: '13/04', high: 38.50, low: 36.50, avg: 37.50, volume: 2500 },
      { date: '14/04', high: 39.50, low: 37.50, avg: 38.50, volume: 2100 },
      { date: '15/04', high: 39.00, low: 38.00, avg: 38.20, volume: 2300 },
      { date: '16/04', high: 40.00, low: 38.50, avg: 39.00, volume: 2600 },
      { date: '17/04', high: 39.50, low: 38.00, avg: 38.80, volume: 2700 },
      { date: '18/04', high: 40.50, low: 39.00, avg: 39.50, volume: 2900 },
    ],
    monthHistory: Array.from({length: 30}, (_, i) => ({
      date: `${i+1}/04`, high: 37 + Math.random()*5, low: 35 + Math.random()*3, avg: 36 + Math.random()*4, volume: 2000 + Math.random()*1000
    }))
  }
};

const CHEESE_TYPES = ['Coalho', 'Mussarela', 'Prato', 'Provolone', 'Parmesão', 'Colonial', 'Requeijão'];

export function CatalogMetrics() {
  const [globalCheeseType, setGlobalCheeseType] = useState('Coalho');
  const [card3CheeseType, setCard3CheeseType] = useState('Coalho');
  const [timeRange, setTimeRange] = useState<'Semana' | 'Mês'>('Semana');

  // Safely get data or default to Coalho data if not present just for mock
  const globalData = MOCK_METRICS[globalCheeseType as keyof typeof MOCK_METRICS] || MOCK_METRICS['Coalho'];
  const card3Data = MOCK_METRICS[card3CheeseType as keyof typeof MOCK_METRICS] || MOCK_METRICS['Coalho'];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#4a2000] border border-app-accent/20 p-3 rounded-lg shadow-xl">
          <p className="text-white font-bold mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={`item-${index}`} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.name === 'Volume (kg)' ? entry.value.toFixed(0) : `R$ ${entry.value.toFixed(2)}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6 mb-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#703200] p-4 rounded-[24px] border border-white/10 shadow-lg">
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
        
        {/* Card 1: Valor Médio Negociado */}
        <Card className="p-0 gap-0 shadow-2xl border-none bg-[#703200] text-white overflow-hidden rounded-[24px]">
          <CardHeader className="rounded-t-[24px] flex flex-row items-center justify-between space-y-0 px-6 py-5 bg-[#d36101] border-b border-white/10">
            <CardTitle className="text-sm font-medium">Preço Médio do Dia ({globalCheeseType})</CardTitle>
            <DollarSign className="h-4 w-4 text-app-accent" />
          </CardHeader>
          <CardContent className="p-6 flex flex-col justify-center items-center h-[250px]">
            <div className="text-5xl font-bold text-white mb-2">
              R$ {globalData.avgPrice.toFixed(2)}
            </div>
            <p className="text-sm text-white/70">por kg negociado hoje</p>
            <div className="mt-6 flex gap-4 text-sm font-medium bg-[#4a2000] px-4 py-2 rounded-full border border-white/5">
              <span className="text-green-400 flex items-center"><TrendingUp className="w-4 h-4 mr-1"/>  +1.2%</span>
              <span className="text-white/50">vs dia anterior</span>
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Gráfico de Linha (Altos e Baixos) */}
        <Card className="p-0 gap-0 shadow-2xl border-none bg-[#703200] text-white overflow-hidden rounded-[24px]">
          <CardHeader className="rounded-t-[24px] flex flex-row items-center justify-between space-y-0 px-6 py-5 bg-[#d36101] border-b border-white/10">
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
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={timeRange === 'Semana' ? globalData.history : globalData.monthHistory} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" vertical={false} />
                <XAxis dataKey="date" stroke="#ffffff50" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#ffffff50" fontSize={12} tickLine={false} axisLine={false} domain={['dataMin - 1', 'dataMax + 1']} />
                <RechartsTooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="high" name="Máxima" stroke="#f4d763" strokeWidth={3} dot={{ r: 4, fill: '#f4d763' }} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="low" name="Mínima" stroke="#fb923c" strokeWidth={3} dot={{ r: 4, fill: '#fb923c' }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Card 3: Valores negociados e quantidadade em kg */}
        <Card className="p-0 gap-0 shadow-2xl border-none bg-[#703200] text-white overflow-hidden rounded-[24px]">
          <CardHeader className="rounded-t-[24px] flex flex-col space-y-2 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 px-6 py-4 bg-[#d36101] border-b border-white/10">
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
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={card3Data.history} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorVolume" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f4d763" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#f4d763" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" vertical={false} />
                <XAxis dataKey="date" stroke="#ffffff50" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#ffffff50" fontSize={12} tickLine={false} axisLine={false} />
                <RechartsTooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="volume" name="Volume (kg)" stroke="#f4d763" strokeWidth={3} fillOpacity={1} fill="url(#colorVolume)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
