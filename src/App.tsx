import React, { useState, useEffect } from 'react';
import { Search, Plane, MapPin, Clock, Info, ShieldAlert, Key, ArrowRight, PlaneTakeoff, PlaneLanding, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { FlightData, AviationStackResponse } from './types';

export default function App() {
  const [apiKey, setApiKey] = useState<string>(() => localStorage.getItem('aviation_stack_key') || '');
  const [flightNumber, setFlightNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [flightData, setFlightData] = useState<FlightData | null>(null);
  const [showKeyForm, setShowKeyForm] = useState(!apiKey);
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    const saved = localStorage.getItem('recent_flights');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('recent_flights', JSON.stringify(recentSearches));
  }, [recentSearches]);

  const saveRecentSearch = (num: string) => {
    setRecentSearches(prev => {
      const filtered = prev.filter(s => s !== num);
      return [num, ...filtered].slice(0, 5);
    });
  };

  const saveApiKey = (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const key = (form.elements.namedItem('apiKey') as HTMLInputElement).value;
    if (key.trim()) {
      setApiKey(key);
      localStorage.setItem('aviation_stack_key', key);
      setShowKeyForm(false);
    }
  };

  const fetchFlightInfo = async (e: React.FormEvent | string) => {
    if (typeof e !== 'string') e.preventDefault();
    
    const searchNumber = typeof e === 'string' ? e : flightNumber.trim();
    if (!apiKey) {
      setShowKeyForm(true);
      return;
    }
    if (!searchNumber) return;

    if (typeof e === 'string') setFlightNumber(e);

    setLoading(true);
    setError(null);
    setFlightData(null);

    try {
      // Aviation Stack API
      const response = await fetch(`https://api.aviationstack.com/v1/flights?access_key=${apiKey}&flight_iata=${searchNumber}`);
      
      const result: AviationStackResponse = await response.json();

      if (result.data && result.data.length > 0) {
        setFlightData(result.data[0]);
        saveRecentSearch(searchNumber);
      } else {
        setError('No flight found. Please check the flight number.');
      }
    } catch (err) {
      setError('Connection failed. Please check your API key.');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (isoString: string) => {
    if (!isoString) return 'N/A';
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (isoString: string) => {
    if (!isoString) return 'N/A';
    const date = new Date(isoString);
    return date.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const formatDelay = (minutes: number | null) => {
    if (!minutes || minutes === 0) return null;
    return (
      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-tight ${minutes > 0 ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}`}>
        {minutes > 0 ? `+${minutes}m delay` : `${minutes}m early`}
      </span>
    );
  };

  const calculateProgress = (dep: string, arr: string) => {
    const start = new Date(dep).getTime();
    const end = new Date(arr).getTime();
    const now = new Date().getTime();
    if (now < start) return 0;
    if (now > end) return 100;
    return Math.round(((now - start) / (end - start)) * 100);
  };

  const SkeletonLoader = () => (
    <div className="animate-pulse space-y-8">
      <div className="bg-white rounded-3xl h-64 w-full"></div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white rounded-3xl h-80"></div>
        <div className="bg-white rounded-3xl h-80"></div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F5F5F5] text-[#1A1A1A] font-sans selection:bg-emerald-100">
      {/* Header */}
      <header className="bg-white border-b border-black/5 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center text-white">
              <Plane className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-semibold tracking-tight">SkyTrack</h1>
          </div>
          
          <button 
            onClick={() => setShowKeyForm(true)}
            className="text-xs font-medium uppercase tracking-wider text-gray-500 hover:text-emerald-600 transition-colors flex items-center gap-2"
          >
            <Key className="w-3.5 h-3.5" />
            {apiKey ? 'Update API Key' : 'Set API Key'}
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-12">
        {/* Search Section */}
        <section className="max-w-2xl mx-auto mb-16 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-4xl font-light mb-4 tracking-tight">Track your flight in real-time</h2>
            <p className="text-gray-500 mb-8">Enter a flight number (e.g., AA123 or DL456) to get detailed departure and arrival information.</p>
            
            <form onSubmit={fetchFlightInfo} className="relative group mb-6">
              <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
                <Search className="w-5 h-5 text-gray-400 group-focus-within:text-emerald-600 transition-colors" />
              </div>
              <input
                type="text"
                placeholder="Ex: LH400, AF1234..."
                value={flightNumber}
                onChange={(e) => setFlightNumber(e.target.value.toUpperCase())}
                className="w-full bg-white border border-black/10 rounded-2xl py-5 pl-14 pr-32 text-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-sm"
              />
              <button
                type="submit"
                disabled={loading}
                className="absolute right-3 inset-y-3 px-6 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Track'}
              </button>
            </form>

            <AnimatePresence>
              {recentSearches.length > 0 && !loading && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-wrap justify-center items-center gap-2"
                >
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mr-2">Recent Searches</span>
                  {recentSearches.map(num => (
                    <button
                      key={num}
                      onClick={() => fetchFlightInfo(num)}
                      className="px-3 py-1 bg-white border border-black/5 rounded-full text-xs font-semibold hover:border-emerald-500 hover:text-emerald-600 transition-all shadow-sm"
                    >
                      {num}
                    </button>
                  ))}
                  <button
                    onClick={() => setRecentSearches([])}
                    className="ml-2 text-[10px] font-bold text-gray-400 hover:text-red-500 uppercase tracking-widest transition-colors"
                  >
                    Clear
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </section>

        {/* Results Section */}
        <AnimatePresence mode="wait">
          {loading && <SkeletonLoader />}
          
          {error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="max-w-2xl mx-auto bg-red-50 border border-red-100 rounded-2xl p-6 flex items-start gap-4 text-red-700"
            >
              <ShieldAlert className="w-6 h-6 shrink-0" />
              <div>
                <h3 className="font-semibold mb-1">Search Error</h3>
                <p className="text-sm opacity-90">{error}</p>
              </div>
            </motion.div>
          )}

          {flightData && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              {/* Main Flight Header */}
              <div className="bg-white rounded-3xl p-8 shadow-sm border border-black/5 overflow-hidden relative">
                <div className="absolute top-0 right-0 p-8 opacity-5">
                  <Plane className="w-32 h-32 rotate-45" />
                </div>
                
                <div className="relative z-10">
                  <div className="flex flex-wrap items-end justify-between gap-6 mb-12">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center border border-black/5 text-2xl font-black text-gray-300">
                        {flightData.airline.name.charAt(0)}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-emerald-600 uppercase tracking-widest mb-1">
                          {flightData.airline.name}
                        </div>
                        <div className="text-5xl font-bold tracking-tighter">
                          {flightData.flight.iata || flightData.flight.icao}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-400 uppercase tracking-widest mb-1">Live Status</div>
                      <div className={`px-4 py-1 rounded-full text-sm font-bold uppercase tracking-tight ${
                        flightData.flight_status === 'active' ? 'bg-emerald-100 text-emerald-600' : 
                        flightData.flight_status === 'scheduled' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {flightData.flight_status}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-8 relative pb-4">
                    <div className="text-center md:text-left">
                      <div className="text-4xl font-bold mb-1 tracking-tighter">{flightData.departure.iata}</div>
                      <div className="text-sm text-gray-500 font-medium line-clamp-1">{flightData.departure.airport}</div>
                    </div>
                    
                    <div className="flex flex-col items-center">
                      <div className="w-full relative h-6 mb-4 flex items-center">
                        <div className="absolute inset-0 bg-gray-100 rounded-full h-1.5 self-center"></div>
                        {flightData.flight_status === 'active' && (
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${calculateProgress(flightData.departure.scheduled, flightData.arrival.scheduled)}%` }}
                            className="absolute inset-0 bg-emerald-500 rounded-full h-1.5 self-center"
                          />
                        )}
                        <motion.div 
                          animate={{ 
                            left: flightData.flight_status === 'active' 
                              ? `${calculateProgress(flightData.departure.scheduled, flightData.arrival.scheduled)}%` 
                              : '50%' 
                          }}
                          className="absolute z-10 -translate-x-1/2 p-2 bg-white rounded-full shadow-lg border border-black/5"
                        >
                          <Plane className={`w-4 h-4 text-emerald-600 ${flightData.flight_status === 'active' ? 'rotate-90' : 'rotate-45'}`} />
                        </motion.div>
                      </div>
                      <div className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
                        {flightData.flight_status === 'active' ? 'In Flight' : 'Non-Stop'}
                      </div>
                    </div>

                    <div className="text-center md:text-right">
                      <div className="text-4xl font-bold mb-1 tracking-tighter">{flightData.arrival.iata}</div>
                      <div className="text-sm text-gray-500 font-medium line-clamp-1">{flightData.arrival.airport}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Detailed Info Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Departure Card */}
                <div className="bg-white rounded-3xl p-8 shadow-sm border border-black/5">
                  <div className="flex items-center gap-3 mb-8">
                    <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                      <PlaneTakeoff className="w-5 h-5" />
                    </div>
                    <h3 className="text-xl font-semibold">Departure</h3>
                  </div>

                  <div className="space-y-6">
                    <div className="border-b border-gray-50 pb-4">
                      <div className="text-gray-500 text-sm flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2"><Clock className="w-4 h-4" /> Schedule</div>
                        {formatDelay(flightData.departure.delay)}
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Scheduled</div>
                          <div className="text-lg font-bold">{formatTime(flightData.departure.scheduled)}</div>
                        </div>
                        <div>
                          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Estimated</div>
                          <div className="text-lg font-bold text-blue-600">{formatTime(flightData.departure.estimated)}</div>
                        </div>
                        <div>
                          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Actual</div>
                          <div className="text-lg font-bold text-emerald-600">{formatTime(flightData.departure.actual || '')}</div>
                        </div>
                      </div>
                      <div className="text-[10px] text-gray-400 mt-2 font-medium">{formatDate(flightData.departure.scheduled)}</div>
                    </div>

                    <div className="flex justify-between items-start border-b border-gray-50 pb-4">
                      <div className="text-gray-500 text-sm flex items-center gap-2">
                        <MapPin className="w-4 h-4" /> Terminal / Gate
                      </div>
                      <div className="text-right font-semibold">
                        {flightData.departure.terminal || '—'} / {flightData.departure.gate || '—'}
                      </div>
                    </div>

                    <div className="flex justify-between items-start border-b border-gray-50 pb-4">
                      <div className="text-gray-500 text-sm flex items-center gap-2">
                        <Info className="w-4 h-4" /> Timezone
                      </div>
                      <div className="text-right font-medium text-sm">
                        {flightData.departure.timezone}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Arrival Card */}
                <div className="bg-white rounded-3xl p-8 shadow-sm border border-black/5">
                  <div className="flex items-center gap-3 mb-8">
                    <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                      <PlaneLanding className="w-5 h-5" />
                    </div>
                    <h3 className="text-xl font-semibold">Arrival</h3>
                  </div>

                  <div className="space-y-6">
                    <div className="border-b border-gray-50 pb-4">
                      <div className="text-gray-500 text-sm flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2"><Clock className="w-4 h-4" /> Schedule</div>
                        {formatDelay(flightData.arrival.delay)}
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Scheduled</div>
                          <div className="text-lg font-bold">{formatTime(flightData.arrival.scheduled)}</div>
                        </div>
                        <div>
                          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Estimated</div>
                          <div className="text-lg font-bold text-blue-600">{formatTime(flightData.arrival.estimated)}</div>
                        </div>
                        <div>
                          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Actual</div>
                          <div className="text-lg font-bold text-emerald-600">{formatTime(flightData.arrival.actual || '')}</div>
                        </div>
                      </div>
                      <div className="text-[10px] text-gray-400 mt-2 font-medium">{formatDate(flightData.arrival.scheduled)}</div>
                    </div>

                    <div className="flex justify-between items-start border-b border-gray-50 pb-4">
                      <div className="text-gray-500 text-sm flex items-center gap-2">
                        <MapPin className="w-4 h-4" /> Terminal / Gate
                      </div>
                      <div className="text-right font-semibold">
                        {flightData.arrival.terminal || '—'} / {flightData.arrival.gate || '—'}
                      </div>
                    </div>

                    <div className="flex justify-between items-start border-b border-gray-50 pb-4">
                      <div className="text-gray-500 text-sm flex items-center gap-2">
                        <Info className="w-4 h-4" /> Timezone
                      </div>
                      <div className="text-right font-medium text-sm">
                        {flightData.arrival.timezone}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Empty State / Welcome */}
        {!flightData && !loading && !error && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
            {[
              { title: 'Real-time Updates', desc: 'Get the latest status of any commercial flight worldwide.', icon: Clock },
              { title: 'Gate & Terminal', desc: 'Know exactly where to go before you even reach the airport.', icon: MapPin },
              { title: 'Global Coverage', desc: 'Access data from over 10,000 airports and 3,000 airlines.', icon: Plane },
            ].map((feature, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.1 }}
                className="bg-white/50 border border-black/5 rounded-2xl p-6"
              >
                <feature.icon className="w-6 h-6 text-emerald-600 mb-4" />
                <h4 className="font-semibold mb-2">{feature.title}</h4>
                <p className="text-sm text-gray-500 leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        )}
      </main>

      {/* API Key Modal */}
      <AnimatePresence>
        {showKeyForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => apiKey && setShowKeyForm(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
                  <Key className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">Aviation Stack API</h3>
                  <p className="text-sm text-gray-500">Configure your access key</p>
                </div>
              </div>

              <p className="text-sm text-gray-600 mb-6 leading-relaxed">
                To use this app, you need an API key from <a href="https://aviationstack.com/" target="_blank" rel="noopener noreferrer" className="text-emerald-600 font-medium hover:underline">aviationstack.com</a>. The key is stored locally in your browser.
              </p>

              <form onSubmit={saveApiKey}>
                <div className="mb-6">
                  <label htmlFor="apiKey" className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
                    Access Key
                  </label>
                  <input
                    id="apiKey"
                    name="apiKey"
                    type="password"
                    defaultValue={apiKey}
                    required
                    placeholder="Enter your API key..."
                    className="w-full bg-gray-50 border border-black/5 rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                  />
                </div>

                <div className="flex gap-3">
                  {apiKey && (
                    <button
                      type="button"
                      onClick={() => setShowKeyForm(false)}
                      className="flex-1 py-3 px-4 rounded-xl font-medium text-gray-500 hover:bg-gray-100 transition-all"
                    >
                      Cancel
                    </button>
                  )}
                  <button
                    type="submit"
                    className="flex-[2] py-3 px-4 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20"
                  >
                    Save Configuration
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="max-w-5xl mx-auto px-6 py-12 border-t border-black/5 text-center">
        <p className="text-xs text-gray-400 font-medium uppercase tracking-widest">
          Data provided by Aviation Stack API
        </p>
      </footer>
    </div>
  );
}
