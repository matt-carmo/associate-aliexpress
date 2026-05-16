// lib/weightsStorage.ts
// LocalStorage-backed scoring weights config

export type ScoringWeights = {
  salesVolume: number;
  rating: number;
  discount: number;
  brandRecognition: number;
  visualAppeal: number;
  lowPriceImpulse: number;
  socialProof: number;
  bundleDeal: number;
  topSellingIndicators: number;
};

const WEIGHTS_KEY = 'telegram_scoring_weights_v1';

const DEFAULT_WEIGHTS: ScoringWeights = {
  salesVolume: 1.8,
  rating: 1.5,
  discount: 1.0,
  brandRecognition: 1.1,
  visualAppeal: 1.4,
  lowPriceImpulse: 1.1,
  socialProof: 1.4,
  bundleDeal: 0.9,
  topSellingIndicators: 1.8,
};

export function getWeights(): ScoringWeights {
  if (typeof window === 'undefined') return DEFAULT_WEIGHTS;
  try {
    const raw = localStorage.getItem(WEIGHTS_KEY);
    return raw ? JSON.parse(raw) : DEFAULT_WEIGHTS;
  } catch {
    return DEFAULT_WEIGHTS;
  }
}

export function setWeights(weights: ScoringWeights) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(WEIGHTS_KEY, JSON.stringify(weights));
}

export function resetWeights() {
  setWeights(DEFAULT_WEIGHTS);
}
