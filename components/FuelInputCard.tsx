import React, { useState } from 'react';
import { Euro, Gauge, Droplet, Save, Loader2, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';
import { postFuelLog } from '../services/api';
import { FuelEntry } from '../types';

interface FuelInputCardProps {
  onSuccess: () => void;
}

export const FuelInputCard: React.FC<FuelInputCardProps> = ({ onSuccess }) => {
  const [formData, setFormData] = useState<FuelEntry>({
    prix: 0,
    litres: 0,
    kilometres: 0,
  });
  
  const [displayValues, setDisplayValues] = useState({
    prix: '',
    litres: '',
    kilometres: '',
  });

  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    // Normalisation: on remplace la virgule par un point pour le calcul interne
    // On autorise les chiffres et UN SEUL séparateur (point ou virgule)
    if (value === '' || /^\d*[.,]?\d*$/.test(value)) {
      // On garde la valeur telle quelle pour l'affichage (avec virgule si l'utilisateur le souhaite)
      setDisplayValues(prev => ({ ...prev, [name]: value }));
      
      // Pour les données, on convertit en format standard JS (point)
      const normalizedValue = value.replace(',', '.');
      setFormData(prev => ({
        ...prev,
        [name]: normalizedValue === '' ? 0 : parseFloat(normalizedValue)
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.prix <= 0 || formData.litres <= 0 || formData.kilometres <= 0) {
      setStatus('error');
      setErrorMessage('Données invalides détectées.');
      return;
    }
    setStatus('loading');
    setErrorMessage('');
    try {
      console.log("Envoi des données:", formData); // Log pour debug
      await postFuelLog(formData);
      setStatus('success');
      setFormData({ prix: 0, litres: 0, kilometres: 0 });
      setDisplayValues({ prix: '', litres: '', kilometres: '' });
      onSuccess();
      setTimeout(() => setStatus('idle'), 3000);
    } catch (error) {
      console.error("Erreur submit:", error);
      setStatus('error');
      setErrorMessage("Erreur de synchronisation.");
    }
  };

  return (
    <div className="relative group">
      {/* Glow Effect behind card */}
      <div className="absolute -inset-0.5 bg-gradient-to-b from-cyan-500/20 to-purple-600/20 rounded-3xl blur-lg opacity-75 group-hover:opacity-100 transition duration-500"></div>
      
      <div className="relative bg-gray-900/40 backdrop-blur-2xl border border-white/10 rounded-3xl p-1 overflow-hidden shadow-2xl">
        
        {/* Glass Header */}
        <div className="relative px-6 py-5 border-b border-white/5 bg-white/5 flex justify-between items-center rounded-t-[20px]">
          <div>
            <h3 className="text-lg font-semibold text-white flex items-center gap-2 tracking-wide">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              Nouvelle Entrée
            </h3>
            <p className="text-cyan-200/40 text-xs font-medium tracking-wider mt-1 uppercase">Saisie des données</p>
          </div>
          <div className="h-2 w-2 rounded-full bg-cyan-500 shadow-[0_0_10px_rgba(34,211,238,0.8)] animate-pulse"></div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          
          {/* Price Input */}
          <div className="space-y-2">
            <label htmlFor="prix" className="text-xs font-bold text-cyan-100/60 uppercase tracking-wider ml-1">
              Prix Total
            </label>
            <div className="relative group/input">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Euro className="h-5 w-5 text-slate-400 group-focus-within/input:text-cyan-400 transition-colors duration-300" />
              </div>
              <input
                type="text"
                id="prix"
                name="prix"
                inputMode="decimal"
                value={displayValues.prix}
                onChange={handleChange}
                placeholder="0.00"
                className="block w-full pl-12 pr-4 py-4 bg-black/20 border border-white/5 rounded-2xl text-white placeholder-slate-600 focus:outline-none focus:ring-0 focus:border-cyan-500/50 focus:bg-black/40 transition-all duration-300 shadow-inner"
              />
              <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/5 pointer-events-none group-focus-within/input:ring-cyan-500/30"></div>
            </div>
          </div>

          {/* Liters Input */}
          <div className="space-y-2">
            <label htmlFor="litres" className="text-xs font-bold text-cyan-100/60 uppercase tracking-wider ml-1">
              Volume
            </label>
            <div className="relative group/input">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Droplet className="h-5 w-5 text-slate-400 group-focus-within/input:text-pink-400 transition-colors duration-300" />
              </div>
              <input
                type="text"
                id="litres"
                name="litres"
                inputMode="decimal"
                value={displayValues.litres}
                onChange={handleChange}
                placeholder="0.00"
                className="block w-full pl-12 pr-4 py-4 bg-black/20 border border-white/5 rounded-2xl text-white placeholder-slate-600 focus:outline-none focus:ring-0 focus:border-pink-500/50 focus:bg-black/40 transition-all duration-300 shadow-inner"
              />
              <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/5 pointer-events-none group-focus-within/input:ring-pink-500/30"></div>
            </div>
          </div>

          {/* Kilometers Input */}
          <div className="space-y-2">
            <label htmlFor="kilometres" className="text-xs font-bold text-cyan-100/60 uppercase tracking-wider ml-1">
              Distance
            </label>
            <div className="relative group/input">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Gauge className="h-5 w-5 text-slate-400 group-focus-within/input:text-purple-400 transition-colors duration-300" />
              </div>
              <input
                type="text"
                id="kilometres"
                name="kilometres"
                inputMode="decimal"
                value={displayValues.kilometres}
                onChange={handleChange}
                placeholder="0"
                className="block w-full pl-12 pr-4 py-4 bg-black/20 border border-white/5 rounded-2xl text-white placeholder-slate-600 focus:outline-none focus:ring-0 focus:border-purple-500/50 focus:bg-black/40 transition-all duration-300 shadow-inner"
              />
              <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/5 pointer-events-none group-focus-within/input:ring-purple-500/30"></div>
            </div>
          </div>

          {/* Status Messages */}
          <div className="min-h-[20px]">
            {status === 'error' && (
              <div className="animate-in fade-in slide-in-from-top-2 duration-300 p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-2 text-red-300 text-sm shadow-[0_0_15px_rgba(239,68,68,0.1)]">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {status === 'success' && (
              <div className="animate-in fade-in slide-in-from-top-2 duration-300 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-2 text-emerald-300 text-sm shadow-[0_0_15px_rgba(16,185,129,0.1)]">
                <CheckCircle2 className="w-5 h-5" />
                <span>Enregistré avec succès !</span>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={status === 'loading'}
            className={`relative w-full group overflow-hidden rounded-2xl font-bold text-white shadow-lg transition-all duration-300
              ${status === 'loading' 
                ? 'bg-slate-800 cursor-wait opacity-80' 
                : 'bg-gradient-to-r from-cyan-600 via-blue-600 to-purple-600 hover:shadow-[0_0_25px_rgba(6,182,212,0.4)] active:scale-[0.99]'
              }`}
          >
            <div className={`absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ${status === 'loading' ? 'hidden' : ''}`}></div>
            <div className="relative py-4 px-4 flex items-center justify-center gap-2">
                {status === 'loading' ? (
                <>
                    <Loader2 className="w-5 h-5 animate-spin text-cyan-300" />
                    <span className="text-cyan-100">Transmission...</span>
                </>
                ) : (
                <>
                    <Save className="w-5 h-5 group-hover:rotate-12 transition-transform duration-300" />
                    <span className="tracking-wide">VALIDER LA DATA</span>
                </>
                )}
            </div>
          </button>
        </form>
      </div>
    </div>
  );
};
