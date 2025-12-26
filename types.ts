
export interface SystemParams {
  m1: number;       // Primary system mass
  f1: number;       // Primary system natural frequency (Hz)
  zeta1: number;    // Primary system damping ratio
  m2: number;       // TMD mass
}

export interface OptimizationResult {
  f_opt: number;          // Optimized frequency ratio (f_tmd / f_primary)
  zeta2_opt: number;      // Optimized TMD damping ratio
  minPeakAmp: number;     // Minimized peak dimensionless amplitude
  mu: number;             // Mass ratio
}

export interface FrequencyDataPoint {
  g: number;              // Frequency ratio (w / w1)
  originalAmp: number;    // Primary system amplitude without TMD
  optimizedAmp: number;   // Primary system amplitude with optimized TMD
  // Damping Sensitivity (ζ2 variations)
  z50?: number;
  z80?: number;
  z120?: number;
  z150?: number;
  // Frequency Sensitivity (f variations)
  f98?: number;
  f99?: number;
  f101?: number;
  f102?: number;
}

export interface MassRatioDataPoint {
  mu: number;
  peakAmp: number;
  f_opt: number;
  zeta2_opt: number;
}
