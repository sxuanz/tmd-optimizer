
import React, { useState, useMemo, useEffect } from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Area,
  ComposedChart,
  Legend
} from 'recharts';
import { NumberInput } from './components/NumberInput';
import { 
  getAmplitude, 
  getOriginalAmplitude, 
  optimizeTMD 
} from './services/tmdMath';
import { SystemParams, FrequencyDataPoint, MassRatioDataPoint } from './types';

const App: React.FC = () => {
  const [params, setParams] = useState<SystemParams>({
    m1: 1000,
    f1: 5.0,
    zeta1: 0.05,
    m2: 50,
  });

  const [showDampingSens, setShowDampingSens] = useState(false);
  const [showFreqSens, setShowFreqSens] = useState(false);

  // Derived Optimization Result
  const optimization = useMemo(() => {
    const mu = params.m2 / params.m1;
    return {
      ...optimizeTMD(mu, params.zeta1),
      mu
    };
  }, [params]);

  // Data for Frequency Response Chart
  const frequencyData = useMemo(() => {
    const data: FrequencyDataPoint[] = [];
    const mu = params.m2 / params.m1;
    const { f_opt, zeta2_opt } = optimization;

    for (let g = 0.5; g <= 2.0; g += 0.015) {
      data.push({
        g: parseFloat(g.toFixed(3)),
        originalAmp: getOriginalAmplitude(g, params.zeta1),
        optimizedAmp: getAmplitude(g, f_opt, zeta2_opt, mu, params.zeta1),
        z50: getAmplitude(g, f_opt, zeta2_opt * 0.5, mu, params.zeta1),
        z80: getAmplitude(g, f_opt, zeta2_opt * 0.8, mu, params.zeta1),
        z120: getAmplitude(g, f_opt, zeta2_opt * 1.2, mu, params.zeta1),
        z150: getAmplitude(g, f_opt, zeta2_opt * 1.5, mu, params.zeta1),
        f98: getAmplitude(g, f_opt * 0.98, zeta2_opt, mu, params.zeta1),
        f99: getAmplitude(g, f_opt * 0.99, zeta2_opt, mu, params.zeta1),
        f101: getAmplitude(g, f_opt * 1.01, zeta2_opt, mu, params.zeta1),
        f102: getAmplitude(g, f_opt * 1.02, zeta2_opt, mu, params.zeta1),
      });
    }
    return data;
  }, [params, optimization]);

  // Data for Mass Ratio sensitivity Chart
  const [massRatioData, setMassRatioData] = useState<MassRatioDataPoint[]>([]);

  useEffect(() => {
    const calculateMassRatioCurve = () => {
      const data: MassRatioDataPoint[] = [];
      for (let mu = 0.01; mu <= 1.0; mu += 0.005) {
        const opt = optimizeTMD(mu, params.zeta1);
        data.push({
          mu: parseFloat(mu.toFixed(3)),
          peakAmp: opt.minPeakAmp,
          f_opt: opt.f_opt,
          zeta2_opt: opt.zeta2_opt
        });
      }
      setMassRatioData(data);
    };
    calculateMassRatioCurve();
  }, [params.zeta1]);

  return (
    <div className="min-h-screen p-4 md:p-8 flex flex-col gap-8 max-w-7xl mx-auto">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between border-b pb-6 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">TMD Optimizer Pro</h1>
          <p className="text-gray-500 mt-1 max-w-2xl text-sm md:text-base">
            Advanced Tuned Mass Damper optimization. Visualize primary system response and optimal parameters across mass ratios.
          </p>
        </div>
        <div className="flex items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100 shrink-0">
          <div className="text-right">
            <p className="text-[10px] uppercase font-bold text-gray-400">Mass Ratio (μ)</p>
            <p className="text-xl font-black text-blue-600 mono">{(optimization.mu * 100).toFixed(2)}%</p>
          </div>
          <div className="w-px h-10 bg-gray-200" />
          <div className="text-right">
            <p className="text-[10px] uppercase font-bold text-gray-400">Min-Max Peak</p>
            <p className="text-xl font-black text-green-600 mono">{optimization.minPeakAmp.toFixed(3)}</p>
          </div>
        </div>
      </header>

      <main className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Sidebar Inputs */}
        <div className="lg:col-span-3 flex flex-col gap-6">
          <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-5">
            <h2 className="text-lg font-bold text-gray-800 border-b pb-2">Primary System</h2>
            <NumberInput 
              label="Primary Mass (m1)" 
              value={params.m1} 
              onChange={(m1) => setParams(prev => ({ ...prev, m1 }))}
              unit="kg" min={1}
            />
            <NumberInput 
              label="Natural Freq (f1)" 
              value={params.f1} 
              onChange={(f1) => setParams(prev => ({ ...prev, f1 }))}
              unit="Hz" step={0.1} min={0.1}
            />
            <NumberInput 
              label="Damping Ratio (ζ1)" 
              value={params.zeta1} 
              onChange={(zeta1) => setParams(prev => ({ ...prev, zeta1 }))}
              step={0.001} min={0} max={0.5}
            />
            
            <h2 className="text-lg font-bold text-gray-800 border-b pb-2 mt-2">TMD System</h2>
            <NumberInput 
              label="TMD Mass (m2)" 
              value={params.m2} 
              onChange={(m2) => setParams(prev => ({ ...prev, m2 }))}
              unit="kg" min={0.1}
            />
          </section>

          <section className="bg-slate-900 p-6 rounded-2xl shadow-xl flex flex-col gap-4 text-white">
            <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest">Optimal Design</h2>
            <div className="space-y-3">
              <div className="border-l-2 border-blue-500 pl-3">
                <p className="text-[10px] text-slate-400 font-bold uppercase">Tuning (γ = f2/f1)</p>
                <p className="text-xl font-bold mono text-blue-400">{optimization.f_opt.toFixed(4)}</p>
              </div>
              <div className="border-l-2 border-emerald-500 pl-3">
                <p className="text-[10px] text-slate-400 font-bold uppercase">Damping (ζ2)</p>
                <p className="text-xl font-bold mono text-emerald-400">{optimization.zeta2_opt.toFixed(4)}</p>
              </div>
              <div className="border-l-2 border-purple-500 pl-3">
                <p className="text-[10px] text-slate-400 font-bold uppercase">Freq (f2)</p>
                <p className="text-xl font-bold mono text-purple-400">{(optimization.f_opt * params.f1).toFixed(2)} Hz</p>
              </div>
            </div>
          </section>

          <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-3">
            <h2 className="text-sm font-bold text-gray-800 mb-2">Analysis Toggles</h2>
            <label className="flex items-center gap-3 cursor-pointer group">
              <input 
                type="checkbox" 
                checked={showDampingSens} 
                onChange={(e) => setShowDampingSens(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700 group-hover:text-blue-600 transition-colors">Show Damping Sensitivity</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer group">
              <input 
                type="checkbox" 
                checked={showFreqSens} 
                onChange={(e) => setShowFreqSens(e.target.checked)}
                className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
              />
              <span className="text-sm font-medium text-gray-700 group-hover:text-purple-600 transition-colors">Show Tuning Sensitivity</span>
            </label>
          </section>
        </div>

        {/* Charts Main Area */}
        <div className="lg:col-span-9 flex flex-col gap-8">
          
          {/* Chart 1: Frequency Response */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden">
            <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-gray-800">Frequency Response & Sensitivity</h2>
                <p className="text-xs text-gray-500 italic">Optimized Peak: {optimization.minPeakAmp.toFixed(3)}</p>
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-2 text-[10px] font-bold uppercase">
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-gray-300"></span> Original</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span> Optimal</span>
                {showDampingSens && <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-rose-400"></span> ζ Sensitivity</span>}
                {showFreqSens && <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-purple-400"></span> γ Sensitivity</span>}
              </div>
            </div>
            <div className="h-[400px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={frequencyData} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="g" 
                    label={{ value: 'Excitation Frequency Ratio (g = ω/ω₁)', position: 'insideBottom', offset: -10, style: { fontSize: 12, fill: '#64748b' } }} 
                    domain={[0.5, 2]}
                    type="number"
                  />
                  <YAxis label={{ value: 'Dimensionless Amplitude', angle: -90, position: 'insideLeft', style: { fontSize: 12, fill: '#64748b' } }} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', fontSize: '12px' }}
                    formatter={(val: number) => val.toFixed(3)}
                    labelFormatter={(g) => `Freq Ratio: ${g}`}
                  />
                  <Line type="monotone" dataKey="originalAmp" stroke="#cbd5e1" strokeDasharray="5 5" strokeWidth={1.5} dot={false} name="No TMD" />
                  {showDampingSens && (
                    <>
                      <Line type="monotone" dataKey="z50" stroke="#fda4af" strokeWidth={1} strokeDasharray="2 2" dot={false} name="ζ2 * 50%" />
                      <Line type="monotone" dataKey="z150" stroke="#9f1239" strokeWidth={1} strokeDasharray="2 2" dot={false} name="ζ2 * 150%" />
                    </>
                  )}
                  {showFreqSens && (
                    <>
                      <Line type="monotone" dataKey="f98" stroke="#d8b4fe" strokeWidth={1} strokeDasharray="3 3" dot={false} name="γ * 98%" />
                      <Line type="monotone" dataKey="f102" stroke="#581c87" strokeWidth={1} strokeDasharray="3 3" dot={false} name="γ * 102%" />
                    </>
                  )}
                  <Line type="monotone" dataKey="optimizedAmp" stroke="#2563eb" strokeWidth={3} dot={false} name="Optimal TMD" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 2: Mass Ratio Sensitivity - Multi-Axis */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="text-xl font-bold text-gray-800 mb-2">Optimization Parameters vs. Mass Ratio</h2>
            <p className="text-sm text-gray-500 mb-6 italic">Tracking performance (Amplitude) and required optimal hardware parameters (ζ₂, γ) as mass increases.</p>
            <div className="h-[450px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={massRatioData} margin={{ top: 20, right: 60, left: 20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="mu" 
                    label={{ value: 'Mass Ratio (μ = m₂/m₁)', position: 'insideBottom', offset: -10, style: { fontSize: 12, fill: '#64748b' } }} 
                    domain={[0, 1]}
                    type="number"
                  />
                  
                  {/* Primary Left Axis: Peak Amplitude */}
                  <YAxis 
                    yAxisId="left" 
                    label={{ value: 'Optimal Peak Amp', angle: -90, position: 'insideLeft', style: { fontSize: 11, fill: '#10b981' } }} 
                    stroke="#10b981"
                    tick={{ fontSize: 10 }}
                  />

                  {/* Right Axis 1: Damping Ratio (0 to 0.5) */}
                  <YAxis 
                    yAxisId="zeta" 
                    orientation="right" 
                    domain={[0, 0.5]} 
                    label={{ value: 'Optimal Damping (ζ₂)', angle: 90, position: 'insideRight', offset: 0, style: { fontSize: 11, fill: '#f59e0b' } }} 
                    stroke="#f59e0b"
                    tick={{ fontSize: 10 }}
                  />

                  {/* Right Axis 2: Frequency Ratio (0.08 to 1.0) */}
                  <YAxis 
                    yAxisId="freq" 
                    orientation="right" 
                    domain={[0.08, 1.0]} 
                    label={{ value: 'Optimal Freq Ratio (γ)', angle: 90, position: 'right', offset: 45, style: { fontSize: 11, fill: '#6366f1' } }} 
                    stroke="#6366f1"
                    tick={{ fontSize: 10 }}
                  />

                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', fontSize: '12px' }}
                    formatter={(val: number) => val.toFixed(4)}
                    labelFormatter={(val) => `Mass Ratio: ${val}`}
                  />
                  <Legend verticalAlign="top" height={36} iconType="plainline" wrapperStyle={{ fontSize: '11px', fontWeight: 'bold' }} />
                  
                  {/* Peak Amplitude Curve */}
                  <Area 
                    yAxisId="left"
                    type="monotone" 
                    dataKey="peakAmp" 
                    stroke="#10b981" 
                    fill="#10b981" 
                    fillOpacity={0.05} 
                    strokeWidth={2.5}
                    name="Peak Amplitude"
                  />
                  
                  {/* Optimal Damping Curve */}
                  <Line 
                    yAxisId="zeta"
                    type="monotone" 
                    dataKey="zeta2_opt" 
                    stroke="#f59e0b" 
                    strokeWidth={2} 
                    dot={false}
                    name="Opt. Damping (ζ₂)"
                  />
                  
                  {/* Optimal Frequency Ratio Curve */}
                  <Line 
                    yAxisId="freq"
                    type="monotone" 
                    dataKey="f_opt" 
                    stroke="#6366f1" 
                    strokeWidth={2} 
                    dot={false}
                    name="Opt. Freq Ratio (γ)"
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </main>

      <footer className="mt-auto border-t py-8 flex flex-col items-center gap-2 text-gray-400 text-xs md:text-sm">
        <p>Built for Structural Dynamics Analysis & TMD Optimization</p>
        <p className="font-medium italic">Basis: Multi-Axis Performance Sensitivity Mapping</p>
      </footer>
    </div>
  );
};

export default App;
