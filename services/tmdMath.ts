
/**
 * Calculates the dimensionless amplitude of the primary system with a TMD.
 * Based on the transfer function of a damped primary system under harmonic excitation.
 */
export const getAmplitude = (
  g: number,       // Frequency ratio (w / w1)
  f: number,       // Tuning ratio (w2 / w1)
  zeta2: number,   // TMD damping ratio
  mu: number,      // Mass ratio (m2 / m1)
  zeta1: number    // Primary damping ratio
): number => {
  const g2 = g * g;
  const f2 = f * f;
  
  // Terms for the transfer function magnitude formula
  const term1 = f2 - g2;
  const term2 = 2 * zeta2 * f * g;
  
  const num = Math.sqrt(term1 * term1 + term2 * term2);
  
  const denPart1 = (1 - g2) * term1 - mu * f2 * g2 - 4 * zeta1 * zeta2 * f * g2;
  const denPart2 = 2 * zeta2 * f * g * (1 - g2 - mu * g2) + 2 * zeta1 * g * term1;
  
  const den = Math.sqrt(denPart1 * denPart1 + denPart2 * denPart2);
  
  return den === 0 ? 100 : num / den;
};

/**
 * Amplitude of a standard single degree of freedom system (Primary system only)
 */
export const getOriginalAmplitude = (g: number, zeta1: number): number => {
  const g2 = g * g;
  const den = Math.sqrt(Math.pow(1 - g2, 2) + Math.pow(2 * zeta1 * g, 2));
  return den === 0 ? 100 : 1 / den;
};

/**
 * Finds the maximum amplitude across a range of frequency ratios (g: 0.5 to 2.0)
 */
export const findPeakAmplitude = (
  f: number,
  zeta2: number,
  mu: number,
  zeta1: number
): number => {
  let maxAmp = 0;
  // Sample g between 0.5 and 2.0 to find the peak
  for (let g = 0.5; g <= 2.0; g += 0.005) {
    const amp = getAmplitude(g, f, zeta2, mu, zeta1);
    if (amp > maxAmp) maxAmp = amp;
  }
  return maxAmp;
};

/**
 * Numerical optimization of f and zeta2 using coordinate descent and golden section search.
 */
export const optimizeTMD = (mu: number, zeta1: number) => {
  // Initial guesses based on Den Hartog (as starting point)
  let f = 1 / (1 + mu);
  let zeta2 = Math.sqrt((3 * mu) / (8 * (1 + mu)));

  const tolerance = 1e-4;
  let prevVal = Infinity;
  let currentVal = findPeakAmplitude(f, zeta2, mu, zeta1);

  // Simple coordinate descent loop
  for (let iteration = 0; iteration < 20; iteration++) {
    // Optimize f using a simple golden section search or similar 1D search
    f = goldenSectionSearch(
      (testF) => findPeakAmplitude(testF, zeta2, mu, zeta1),
      0.5,
      1.5,
      tolerance
    );

    // Optimize zeta2
    zeta2 = goldenSectionSearch(
      (testZ2) => findPeakAmplitude(f, testZ2, mu, zeta1),
      0.01,
      0.5,
      tolerance
    );

    currentVal = findPeakAmplitude(f, zeta2, mu, zeta1);
    if (Math.abs(prevVal - currentVal) < tolerance) break;
    prevVal = currentVal;
  }

  return { f_opt: f, zeta2_opt: zeta2, minPeakAmp: currentVal };
};

/**
 * Simple 1D Golden Section Search
 */
function goldenSectionSearch(
  f: (x: number) => number,
  lower: number,
  upper: number,
  tol: number
): number {
  const phi = (Math.sqrt(5) - 1) / 2;
  let a = lower;
  let b = upper;
  
  let x1 = b - phi * (b - a);
  let x2 = a + phi * (b - a);
  let f1 = f(x1);
  let f2 = f(x2);

  while (Math.abs(b - a) > tol) {
    if (f1 < f2) {
      b = x2;
      x2 = x1;
      f2 = f1;
      x1 = b - phi * (b - a);
      f1 = f(x1);
    } else {
      a = x1;
      x1 = x2;
      f1 = f2;
      x2 = a + phi * (b - a);
      f2 = f(x2);
    }
  }

  return (a + b) / 2;
}
