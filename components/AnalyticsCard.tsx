import React, { useEffect, useState, useMemo } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area, Legend, ComposedChart
} from 'recharts';
import { TrendingUp, Calendar, Map, Activity, Loader2, AlertTriangle, BarChart3, Terminal } from 'lucide-react';
import { fetchFuelStats } from '../services/api';
import { FuelChartData } from '../types';

interface AnalyticsCardProps {
  refreshTrigger: number;
}

export const AnalyticsCard: React.FC<AnalyticsCardProps> = ({ refreshTrigger }) => {
  const [data, setData] = useState<FuelChartData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // États pour le débogage
  const [debugRawData, setDebugRawData] = useState<any>(null);
  const [showDebug, setShowDebug] = useState<boolean>(false);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      setDebugRawData(null);
      try {
        const rawData = await fetchFuelStats();
        setDebugRawData(rawData);
        
        // DÉTECTION D'ERREUR DE CONFIG N8N
        // Si n8n répond "Workflow was started", c'est que le webhook ne wait pas la fin du script
        if (rawData && rawData.message === "Workflow was started") {
            throw new Error("Configuration N8N : Le Webhook répond trop tôt. Réglez 'Respond' sur 'When Last Node Finishes' dans le nœud Webhook.");
        }

        let itemsToProcess: any[] = [];

        // Logique de déballage universelle pour n8n / API standard
        if (Array.isArray(rawData)) {
          if (rawData.length > 0 && rawData[0].json) {
            // Cas n8n: Structure [{ json: ... }]
            if (Array.isArray(rawData[0].json)) {
              // Cas 1: [{ json: [item1, item2] }] (Bundle unique)
              itemsToProcess = rawData[0].json;
            } else {
              // Cas 2: [{ json: item1 }, { json: item2 }] (Liste standard n8n)
              itemsToProcess = rawData.map((r: any) => r.json);
            }
          } else {
            // Cas Standard: [item1, item2] (JSON pur aplati)
            itemsToProcess = rawData;
          }
        } else if (rawData && typeof rawData === 'object') {
            // Cas objet unique ou erreur enveloppée, ou réponse directe { records: [...] }
             if (rawData.records && Array.isArray(rawData.records)) {
                 itemsToProcess = rawData.records;
             } else {
                 // Peut-être un seul objet ?
                 itemsToProcess = [rawData];
                 console.warn("Format de données objet unique reçu, tentative de traitement.", rawData);
             }
        }

        console.log("Données brutes reçues:", rawData);
        console.log("Items à traiter:", itemsToProcess);

        // Mapping robuste des données
        const normalizedData = itemsToProcess.map((item: any, index: number) => {
          // Support pour structure Airtable "fields" ou structure plate
          const props = item.fields ? item.fields : item;

          // Récupération flexible des valeurs avec tolérance aux formats
          const total = Number(props.total || props.prix || 0);
          const litres = Number(props.litres || 0);
          const kilometres = Number(props.kilometres || 0);
          
          // Calcul ou récupération du prix au litre
          let pricePerLiter = 0;
          const rawPPL = props.prix_par_litre || props.pricePerLiter;
          
          if (rawPPL !== undefined && rawPPL !== null) {
            pricePerLiter = Number(rawPPL);
          } else if (litres > 0) {
            pricePerLiter = total / litres;
          }

          // Calcul de l'efficacité (L/100km)
          const efficiency = kilometres > 0 ? (litres / kilometres) * 100 : 0;

          // Gestion de la date
          let dateObj = new Date();
          if (props.date) dateObj = new Date(props.date);
          else if (props.createdTime) dateObj = new Date(props.createdTime);
          
          // On ne garde que les entrées valides (au moins une donnée chiffrée)
          if (total === 0 && litres === 0 && kilometres === 0) return null;

          return {
            id: item.id || index,
            date: dateObj.toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' }),
            fullDate: dateObj.toISOString(),
            pricePerLiter: parseFloat(pricePerLiter.toFixed(3)),
            totalCost: total,
            distance: kilometres,
            volume: litres,
            efficiency: parseFloat(efficiency.toFixed(1))
          };
        }).filter(item => item !== null) as FuelChartData[]; // Filtrer les nuls

        // Tri par date croissante pour le graphique
        normalizedData.sort((a, b) => new Date(a.fullDate).getTime() - new Date(b.fullDate).getTime());

        setData(normalizedData);
      } catch (err: any) {
        console.error(err);
        // On récupère le message d'erreur spécifique (ex: Config N8N) ou un message générique
        setError(err.message || "Impossible de synchroniser l'historique.");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [refreshTrigger]);

  const stats = useMemo(() => {
    if (data.length === 0) return null;
    const totalDist = data.reduce((acc, curr) => acc + curr.distance, 0);
    const totalCost = data.reduce((acc, curr) => acc + curr.totalCost, 0);
    const totalVol = data.reduce((acc, curr) => acc + curr.volume, 0);
    const avgConsumption = totalDist > 0 ? (totalVol / totalDist) * 100 : 0;
    const avgPricePerL = totalVol > 0 ? totalCost / totalVol : 0;

    return {
      totalDist,
      totalCost,
      avgConsumption: avgConsumption.toFixed(1),
      avgPricePerL: avgPricePerL.toFixed(3)
    };
  }, [data]);

  if (loading) {
    return (
      <div className="h-96 bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 flex flex-col items-center justify-center text-cyan-200/50">
        <div className="relative">
          <div className="absolute inset-0 bg-cyan-500 blur-xl opacity-20 animate-pulse"></div>
          <Loader2 className="w-12 h-12 animate-spin relative z-10 text-cyan-400" />
        </div>
        <p className="mt-4 text-sm font-medium tracking-widest uppercase">Chargement des flux...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[16rem] bg-red-500/5 backdrop-blur-xl rounded-3xl border border-red-500/10 flex flex-col items-center justify-center text-red-300 p-6 text-center">
        <AlertTriangle className="w-12 h-12 mb-4 opacity-80" />
        <p className="font-bold text-lg mb-2">Erreur de Synchronisation</p>
        <p className="font-medium max-w-md text-sm opacity-80 leading-relaxed mb-6">{error}</p>
        
        {/* Bouton de refresh */}
        <button 
            onClick={() => window.location.reload()}
            className="bg-red-500/10 hover:bg-red-500/20 text-red-200 py-2 px-6 rounded-xl transition-all border border-red-500/20 hover:border-red-500/40 text-sm font-semibold"
        >
            Relancer la connexion
        </button>
        
        {/* Mode Debug en cas d'erreur */}
        <div className="mt-8 pt-4 border-t border-red-500/10 w-full max-w-md flex flex-col items-center">
            <button 
                onClick={() => setShowDebug(!showDebug)}
                className="text-xs flex items-center gap-2 px-3 py-1 rounded-lg text-red-400/60 hover:text-red-300 transition-colors"
            >
                <Terminal className="w-3 h-3" />
                {showDebug ? "Masquer détails techniques" : "Voir détails techniques"}
            </button>
            {showDebug && debugRawData && (
                <div className="mt-2 w-full bg-black/40 rounded-lg p-3 border border-red-500/10 text-left">
                     <pre className="text-[10px] text-red-200/70 font-mono overflow-auto max-h-32 whitespace-pre-wrap">
                        {JSON.stringify(debugRawData, null, 2)}
                    </pre>
                </div>
            )}
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
       <div className="min-h-64 bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 flex flex-col items-center justify-center text-slate-500 p-8">
        <Activity className="w-16 h-16 mb-4 opacity-20" />
        <p className="text-lg font-light mb-4">Aucune donnée télémétrique reçue.</p>
        
        <div className="flex flex-col items-center gap-2">
            <button 
                onClick={() => setShowDebug(!showDebug)}
                className="text-xs flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800/50 hover:bg-slate-800 text-slate-400 transition-colors"
            >
                <Terminal className="w-3 h-3" />
                {showDebug ? "Masquer les données brutes" : "Voir les données reçues (Debug)"}
            </button>
            
            {showDebug && (
                <div className="mt-4 w-full max-w-2xl bg-black/50 rounded-xl p-4 border border-white/10 overflow-hidden">
                    <p className="text-xs text-slate-500 mb-2 font-mono uppercase">Raw JSON Response:</p>
                    <pre className="text-[10px] text-green-400 font-mono overflow-auto max-h-64 whitespace-pre-wrap">
                        {JSON.stringify(debugRawData, null, 2)}
                    </pre>
                </div>
            )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      
      {/* Summary Stats Row - Glass Tiles */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: TrendingUp, label: "Coût Total", value: `${stats?.totalCost.toFixed(0)} €`, color: "text-indigo-300", bg: "from-indigo-500/20" },
          { icon: Map, label: "Distance", value: `${stats?.totalDist.toFixed(0)} km`, color: "text-emerald-300", bg: "from-emerald-500/20" },
          { icon: Activity, label: "Conso Moy.", value: stats?.avgConsumption, unit: "L/100km", color: "text-pink-300", bg: "from-pink-500/20" },
          { icon: Calendar, label: "Prix/L Moy.", value: stats?.avgPricePerL, unit: "€", color: "text-cyan-300", bg: "from-cyan-500/20" }
        ].map((item, idx) => (
          <div key={idx} className="relative group overflow-hidden bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 hover:border-white/20 transition-all duration-300">
            <div className={`absolute inset-0 bg-gradient-to-br ${item.bg} to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>
            <div className="p-5 relative z-10">
              <div className="text-slate-400 text-[10px] uppercase font-bold tracking-widest mb-2 flex items-center gap-2">
                <item.icon className={`w-3.5 h-3.5 ${item.color}`} /> {item.label}
              </div>
              <div className={`text-2xl md:text-3xl font-bold ${item.color} drop-shadow-[0_0_10px_rgba(0,0,0,0.5)]`}>
                {item.value} <span className="text-xs text-slate-400 font-normal align-baseline ml-0.5">{item.unit}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Chart - Liquid Glass Style */}
      <div className="bg-gray-900/40 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl overflow-hidden relative">
        {/* Header decoration */}
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent"></div>
        
        <div className="p-6 flex justify-between items-center border-b border-white/5 bg-white/5">
          <div>
             <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-cyan-400" />
                Analyse Télémétrique
             </h3>
          </div>
          {/* Decorative dots */}
          <div className="flex gap-1">
             <div className="w-1.5 h-1.5 rounded-full bg-cyan-500/50"></div>
             <div className="w-1.5 h-1.5 rounded-full bg-pink-500/50"></div>
             <div className="w-1.5 h-1.5 rounded-full bg-purple-500/50"></div>
          </div>
        </div>
        
        <div className="p-6 h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                </linearGradient>
                <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="4" result="coloredBlur" />
                    <feMerge>
                        <feMergeNode in="coloredBlur" />
                        <feMergeNode in="SourceGraphic" />
                    </feMerge>
                </filter>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis 
                dataKey="date" 
                stroke="#64748b" 
                fontSize={12} 
                tickLine={false}
                axisLine={false}
                dy={15}
              />
              <YAxis 
                yAxisId="left" 
                stroke="#64748b" 
                fontSize={12} 
                tickLine={false}
                axisLine={false}
                tickFormatter={(val) => `${val}€`}
              />
              <YAxis 
                yAxisId="right" 
                orientation="right" 
                stroke="#64748b" 
                fontSize={12} 
                tickLine={false}
                axisLine={false}
                tickFormatter={(val) => `${val}L`}
              />
              <Tooltip 
                contentStyle={{ 
                    backgroundColor: 'rgba(15, 23, 42, 0.8)', 
                    backdropFilter: 'blur(10px)',
                    borderColor: 'rgba(255,255,255,0.1)', 
                    borderRadius: '16px', 
                    color: '#f1f5f9',
                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)'
                }}
                itemStyle={{ color: '#e2e8f0' }}
                labelStyle={{ color: '#94a3b8', marginBottom: '8px', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}
              />
              <Legend wrapperStyle={{ paddingTop: '20px' }} iconType="circle" />
              
              <Area 
                yAxisId="left"
                type="monotone" 
                dataKey="totalCost" 
                name="Coût Total (€)" 
                stroke="#8b5cf6" 
                fillOpacity={1} 
                fill="url(#colorPrice)" 
                strokeWidth={3}
                filter="url(#glow)"
              />
              <Line 
                yAxisId="right"
                type="monotone" 
                dataKey="efficiency" 
                name="Conso (L/100km)" 
                stroke="#22d3ee" 
                strokeWidth={3} 
                dot={{ r: 4, fill: '#000', stroke: '#22d3ee', strokeWidth: 2 }}
                filter="url(#glow)"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

       {/* Secondary Chart: Price per liter evolution - Neon Style */}
       <div className="bg-gray-900/40 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl overflow-hidden">
        <div className="p-6 border-b border-white/5 flex justify-between items-center">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Activity className="w-5 h-5 text-pink-400" />
                Évolution Prix Unitaire
            </h3>
        </div>
        <div className="p-4 h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data}>
                    <defs>
                        <filter id="glowPink" x="-20%" y="-20%" width="140%" height="140%">
                            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                            <feMerge>
                                <feMergeNode in="coloredBlur" />
                                <feMergeNode in="SourceGraphic" />
                            </feMerge>
                        </filter>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis dataKey="date" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} dy={10} />
                    <YAxis domain={['dataMin - 0.05', 'dataMax + 0.05']} stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `${val}€`} />
                    <Tooltip 
                         contentStyle={{ 
                            backgroundColor: 'rgba(15, 23, 42, 0.8)', 
                            backdropFilter: 'blur(10px)',
                            borderColor: 'rgba(255,255,255,0.1)', 
                            borderRadius: '16px', 
                            color: '#f1f5f9' 
                        }}
                    />
                    <Line 
                        type="stepAfter" 
                        dataKey="pricePerLiter" 
                        name="Prix/L" 
                        stroke="#f472b6" 
                        strokeWidth={3} 
                        dot={false} 
                        filter="url(#glowPink)"
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
       </div>
    </div>
  );
};