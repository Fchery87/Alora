/**
 * WHO growth percentile math (LMS method).
 *
 * Reference curves from WHO_LMS (WHO Child Growth Standards 2006, via the
 * CDC data files — see ./wholms.ts provenance). This module is pure and
 * offline-capable; it makes no clinical claims — percentiles are presented
 * as reference comparisons only.
 *
 * Formulas (CDC/WHO):
 *   z = (((X/M)^L) − 1) / (L·S)   for L ≠ 0
 *   z = ln(X/M) / S               for L = 0
 *   X = M·(1 + L·S·z)^(1/L)       inverse (L ≠ 0); X = M·e^(S·z) (L = 0)
 *   percentile = Φ(z) (standard normal CDF)
 */
import { WHO_LMS, type BabySex, type GrowthMeasure } from "./wholms";

/** L, M, S interpolated to the baby's exact age in months (0–24, clamped). */
export function lmsAt(measure: GrowthMeasure, sex: BabySex, ageMonths: number): { L: number; M: number; S: number } {
  const table = WHO_LMS[measure][sex];
  const clamped = Math.min(24, Math.max(0, ageMonths));
  const lower = Math.floor(clamped);
  const upper = Math.min(24, lower + 1);
  const t = clamped - lower;
  const [l0, m0, s0] = table[lower];
  const [l1, m1, s1] = table[upper];
  return {
    L: l0 + (l1 - l0) * t,
    M: m0 + (m1 - m0) * t,
    S: s0 + (s1 - s0) * t,
  };
}

/** Standard normal CDF via the Abramowitz & Stegun 7.1.26 erf approximation. */
export function normalCdf(z: number): number {
  const sign = z < 0 ? -1 : 1;
  const x = Math.abs(z) / Math.SQRT2;
  const t = 1 / (1 + 0.3275911 * x);
  const erf =
    1 -
    ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x);
  return 0.5 * (1 + sign * erf);
}

/** Inverse normal CDF (z for a percentile), via the Beasley–Springer–Moro approximation. */
export function zForPercentile(p: number): number {
  const pp = Math.min(0.9999999, Math.max(1e-7, p));
  if (pp === 0.5) return 0;
  if (pp < 0.5) {
    const t = Math.sqrt(-2 * Math.log(pp));
    const ratio =
      (2.515517 + 0.802853 * t + 0.010328 * t * t) / (1 + 1.432788 * t + 0.189269 * t * t + 0.001308 * t * t * t);
    return ratio - t; // negative for p < 0.5 (e.g. −1.881 at the 3rd percentile)
  }
  return -zForPercentile(1 - pp);
}

/** z-score for a measurement. */
export function zScore(measure: GrowthMeasure, sex: BabySex, ageMonths: number, value: number): number {
  const { L, M, S } = lmsAt(measure, sex, ageMonths);
  if (value <= 0 || M <= 0 || S <= 0) return NaN;
  if (Math.abs(L) < 1e-9) return Math.log(value / M) / S;
  return (Math.pow(value / M, L) - 1) / (L * S);
}

/** Percentile (0–100) for a measurement, compared with the WHO reference. */
export function percentile(measure: GrowthMeasure, sex: BabySex, ageMonths: number, value: number): number {
  const z = zScore(measure, sex, ageMonths, value);
  if (Number.isNaN(z)) return NaN;
  return normalCdf(z) * 100;
}

/** The reference value (in the measurement's unit) at a given percentile. */
export function valueAtPercentile(measure: GrowthMeasure, sex: BabySex, ageMonths: number, p: number): number {
  const { L, M, S } = lmsAt(measure, sex, ageMonths);
  const z = zForPercentile(p / 100);
  if (Math.abs(L) < 1e-9) return M * Math.exp(S * z);
  return M * Math.pow(1 + L * S * z, 1 / L);
}
