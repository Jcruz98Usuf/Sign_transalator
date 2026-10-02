/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { LandmarkPoint, PredictionResult, TrainingSample } from '../types/sign';
import { CORE_SIGNS } from './signConstants';

export interface ExtractedFeatures {
  normalizedLandmarks: number[]; // 21 * 3 = 63 floats
  fingerExtensions: {
    thumb: boolean;
    index: boolean;
    middle: boolean;
    ring: boolean;
    pinky: boolean;
  };
  metrics: {
    wristPosition: { x: number; y: number };
    pinchDistance: number;
    spreadDistance: number;
    handAngle: number;
    palmFacing: 'camera' | 'away' | 'side';
  };
}

export class SignClassifierService {
  private trainingSamples: TrainingSample[] = [];
  private readonly STORAGE_KEY = 'language_doctor_landmarks_dataset_v1';
  private recentPredictions: string[] = [];
  private readonly WINDOW_SIZE = 5;

  constructor() {
    this.loadDataset();
    if (this.trainingSamples.length === 0) {
      this.seedBaselineDataset();
    }
  }

  /**
   * Normalize 21 3D landmarks relative to wrist and scale invariant to hand distance
   */
  public extractFeatures(landmarks: LandmarkPoint[]): ExtractedFeatures | null {
    if (!landmarks || landmarks.length < 21) return null;

    const wrist = landmarks[0];
    const middleMcp = landmarks[9];
    const indexMcp = landmarks[5];
    const pinkyMcp = landmarks[17];

    // Reference scale: distance between wrist and middle MCP
    const refDist = Math.hypot(
      middleMcp.x - wrist.x,
      middleMcp.y - wrist.y,
      (middleMcp.z ?? 0) - (wrist.z ?? 0)
    ) || 0.1;

    // 63 normalized coordinates
    const normalizedLandmarks: number[] = [];
    for (const lm of landmarks) {
      normalizedLandmarks.push(
        (lm.x - wrist.x) / refDist,
        (lm.y - wrist.y) / refDist,
        ((lm.z ?? 0) - (wrist.z ?? 0)) / refDist
      );
    }

    // Measure distance from landmark to wrist
    const distToWrist = (idx: number) => {
      const p = landmarks[idx];
      return Math.hypot(p.x - wrist.x, p.y - wrist.y);
    };

    // Extension heuristics
    // Finger is extended if tip is significantly further from wrist than PIP joint
    const indexExtended = distToWrist(8) > distToWrist(6) * 1.15;
    const middleExtended = distToWrist(12) > distToWrist(10) * 1.15;
    const ringExtended = distToWrist(16) > distToWrist(14) * 1.15;
    const pinkyExtended = distToWrist(20) > distToWrist(18) * 1.15;

    // Thumb: distance from thumb tip (4) to pinky MCP (17) compared to thumb IP (3) to pinky MCP
    const distThumbTipToPinky = Math.hypot(landmarks[4].x - pinkyMcp.x, landmarks[4].y - pinkyMcp.y);
    const distThumbIpToPinky = Math.hypot(landmarks[3].x - pinkyMcp.x, landmarks[3].y - pinkyMcp.y);
    const thumbExtended = distThumbTipToPinky > distThumbIpToPinky * 1.1;

    // Pinch distance (thumb tip 4 to index tip 8)
    const pinchDistance = Math.hypot(landmarks[4].x - landmarks[8].x, landmarks[4].y - landmarks[8].y) / refDist;

    // Spread distance between index tip 8 and middle tip 12
    const spreadDistance = Math.hypot(landmarks[8].x - landmarks[12].x, landmarks[8].y - landmarks[12].y) / refDist;

    // Hand orientation angle (wrist to middle MCP vector)
    const handAngle = Math.atan2(middleMcp.y - wrist.y, middleMcp.x - wrist.x);

    // Palm facing check: cross product of (indexMcp - wrist) and (pinkyMcp - wrist)
    const v1 = { x: indexMcp.x - wrist.x, y: indexMcp.y - wrist.y };
    const v2 = { x: pinkyMcp.x - wrist.x, y: pinkyMcp.y - wrist.y };
    const crossZ = v1.x * v2.y - v1.y * v2.x;
    const palmFacing = Math.abs(crossZ) < 0.005 ? 'side' : crossZ > 0 ? 'camera' : 'away';

    return {
      normalizedLandmarks,
      fingerExtensions: {
        thumb: thumbExtended,
        index: indexExtended,
        middle: middleExtended,
        ring: ringExtended,
        pinky: pinkyExtended,
      },
      metrics: {
        wristPosition: { x: wrist.x, y: wrist.y },
        pinchDistance,
        spreadDistance,
        handAngle,
        palmFacing,
      },
    };
  }

  /**
   * Real-time hybrid prediction using geometric rules + landmark nearest-neighbor matching
   */
  public predict(landmarks: LandmarkPoint[]): PredictionResult | null {
    const features = this.extractFeatures(landmarks);
    if (!features) return null;

    const { fingerExtensions: f, metrics } = features;

    // Rule-based candidate scoring
    const ruleScores: Record<string, number> = {
      'Help': 0,
      'Doctor': 0,
      'Pain': 0,
      'Water': 0,
      'Medicine': 0,
      'Emergency': 0,
      'Yes': 0,
      'No': 0,
      'Where': 0,
      'Thank You': 0,
    };

    // 1. Water: 'W' shape -> Index, Middle, Ring extended upright; Pinky curled; Thumb holds pinky
    if (f.index && f.middle && f.ring && !f.pinky) {
      ruleScores['Water'] += 0.85;
      if (metrics.spreadDistance > 0.4) ruleScores['Water'] += 0.1;
    }

    // 2. Thank You: Flat open hand (all fingers extended and aligned)
    if (f.thumb && f.index && f.middle && f.ring && f.pinky) {
      ruleScores['Thank You'] += 0.90;
    }

    // 3. Help: Thumb extended upward, other fingers curled into closed fist (Thumbs up / 'A' fist)
    if (f.thumb && !f.index && !f.middle && !f.ring && !f.pinky) {
      // Check if thumb tip is pointing upward
      const thumbTipY = landmarks[4].y;
      const wristY = landmarks[0].y;
      if (thumbTipY < wristY) {
        ruleScores['Help'] += 0.88;
      } else {
        ruleScores['Medicine'] += 0.65;
      }
    }

    // 4. Yes: All fingers curled closed into fist ('S' handshape)
    if (!f.thumb && !f.index && !f.middle && !f.ring && !f.pinky) {
      ruleScores['Yes'] += 0.80;
      ruleScores['Emergency'] += 0.65; // 'E' shape has closed fingers
    }

    // 5. Doctor / Where / Pain: Index extended alone
    if (f.index && !f.middle && !f.ring && !f.pinky) {
      if (metrics.pinchDistance < 0.35) {
        // Thumb touching middle/ring = "D" shape for Doctor
        ruleScores['Doctor'] += 0.88;
      } else {
        // Pointing up: Where or Pain
        ruleScores['Where'] += 0.82;
        ruleScores['Pain'] += 0.78;
      }
    }

    // 6. No: Index and Middle extended together, thumb near tips (pinch)
    if (f.index && f.middle && !f.ring && !f.pinky) {
      if (metrics.pinchDistance < 0.5) {
        ruleScores['No'] += 0.85;
      } else {
        // 'V' peace or pulse tap
        ruleScores['Doctor'] += 0.70;
      }
    }

    // KNN Exemplar distance matching from recorded training samples
    const knnScores = this.matchKNN(features.normalizedLandmarks, 5);

    // Combine rule score and KNN score (60% KNN, 40% rule)
    let bestSign = 'Help';
    let highestConfidence = 0;

    for (const sign of CORE_SIGNS) {
      const label = sign.label;
      const rScore = ruleScores[label] || 0.1;
      const kScore = knnScores[label] || 0.1;
      const combined = Math.min(0.99, rScore * 0.45 + kScore * 0.55);

      if (combined > highestConfidence) {
        highestConfidence = combined;
        bestSign = label;
      }
    }

    // Smoothing window for temporal stability
    this.recentPredictions.push(bestSign);
    if (this.recentPredictions.length > this.WINDOW_SIZE) {
      this.recentPredictions.shift();
    }

    // Find mode of recent predictions
    const frequency: Record<string, number> = {};
    for (const s of this.recentPredictions) {
      frequency[s] = (frequency[s] || 0) + 1;
    }
    const smoothedSign = Object.entries(frequency).sort((a, b) => b[1] - a[1])[0][0];

    return {
      sign: smoothedSign,
      confidence: highestConfidence,
      confidencePercent: Math.round(highestConfidence * 100),
      fingerStates: f,
      metrics: {
        wristPosition: metrics.wristPosition,
        pinchDistance: metrics.pinchDistance,
        spreadDistance: metrics.spreadDistance,
      },
    };
  }

  /**
   * K-Nearest Neighbors on normalized 63-dimensional landmark vector
   */
  private matchKNN(featureVector: number[], k = 5): Record<string, number> {
    if (this.trainingSamples.length === 0) return {};

    const distances: { label: string; dist: number }[] = [];

    for (const sample of this.trainingSamples) {
      const sampleFeatures = this.extractFeatures(sample.landmarks);
      if (!sampleFeatures) continue;

      let sumSq = 0;
      const sVec = sampleFeatures.normalizedLandmarks;
      const len = Math.min(featureVector.length, sVec.length);
      for (let i = 0; i < len; i++) {
        const diff = featureVector[i] - sVec[i];
        sumSq += diff * diff;
      }
      const dist = Math.sqrt(sumSq);
      distances.push({ label: sample.label, dist });
    }

    distances.sort((a, b) => a.dist - b.dist);
    const topK = distances.slice(0, Math.min(k, distances.length));

    const scores: Record<string, number> = {};
    let totalWeight = 0;

    for (const item of topK) {
      // Invert distance: closer items get exponentially higher weight
      const weight = 1 / (1 + item.dist);
      scores[item.label] = (scores[item.label] || 0) + weight;
      totalWeight += weight;
    }

    if (totalWeight > 0) {
      for (const label in scores) {
        scores[label] = scores[label] / totalWeight;
      }
    }

    return scores;
  }

  /**
   * Step 2 & 3: Add new recorded landmark training sample
   */
  public addSample(label: string, landmarks: LandmarkPoint[], handedness: 'Left' | 'Right' = 'Right'): TrainingSample {
    const sample: TrainingSample = {
      id: `sample_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      label,
      timestamp: Date.now(),
      landmarks: JSON.parse(JSON.stringify(landmarks)),
      handedness,
    };
    this.trainingSamples.push(sample);
    this.saveDataset();
    return sample;
  }

  public getDataset(): TrainingSample[] {
    return [...this.trainingSamples];
  }

  public getSampleCountByLabel(): Record<string, number> {
    const counts: Record<string, number> = {};
    for (const s of this.trainingSamples) {
      counts[s.label] = (counts[s.label] || 0) + 1;
    }
    return counts;
  }

  public deleteSample(id: string): void {
    this.trainingSamples = this.trainingSamples.filter((s) => s.id !== id);
    this.saveDataset();
  }

  public clearDataset(): void {
    this.trainingSamples = [];
    this.saveDataset();
  }

  public exportDatasetJSON(): string {
    return JSON.stringify(this.trainingSamples, null, 2);
  }

  public importDatasetJSON(jsonString: string): number {
    try {
      const parsed = JSON.parse(jsonString);
      if (Array.isArray(parsed)) {
        this.trainingSamples = parsed;
        this.saveDataset();
        return parsed.length;
      }
      return 0;
    } catch (e) {
      console.error('Failed to import dataset:', e);
      return 0;
    }
  }

  private saveDataset(): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.trainingSamples));
    } catch (e) {
      console.warn('LocalStorage limit reached or disabled:', e);
    }
  }

  private loadDataset(): void {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      if (data) {
        this.trainingSamples = JSON.parse(data);
      }
    } catch (e) {
      console.warn('Could not load saved dataset:', e);
    }
  }

  /**
   * Seed baseline calibration samples so the 10 medical signs function immediately
   */
  private seedBaselineDataset(): void {
    const baseline: TrainingSample[] = [];

    // Helper to generate simulated landmarks based on finger configurations
    const generateTemplate = (label: string, fingerExt: [boolean, boolean, boolean, boolean, boolean], variation = 0): LandmarkPoint[] => {
      const points: LandmarkPoint[] = [];
      const [thumbExt, indexExt, middleExt, ringExt, pinkyExt] = fingerExt;
      const vOffset = (variation - 1) * 0.015;

      // Wrist
      points.push({ x: 0.5 + vOffset, y: 0.8, z: 0 });

      // Thumb (1, 2, 3, 4)
      const tSpread = thumbExt ? 0.15 : 0.04;
      const tHeight = thumbExt ? -0.18 : -0.06;
      points.push({ x: 0.44 + vOffset, y: 0.72, z: -0.01 });
      points.push({ x: 0.40 + vOffset, y: 0.65, z: -0.02 });
      points.push({ x: 0.36 + vOffset, y: 0.58, z: -0.03 });
      points.push({ x: 0.33 + vOffset - tSpread, y: 0.52 + tHeight, z: -0.04 });

      // Index (5, 6, 7, 8)
      const iLen = indexExt ? 0.35 : 0.12;
      points.push({ x: 0.44 + vOffset, y: 0.56, z: 0 });
      points.push({ x: 0.43 + vOffset, y: 0.56 - iLen * 0.4, z: 0.01 });
      points.push({ x: 0.42 + vOffset, y: 0.56 - iLen * 0.7, z: 0.02 });
      points.push({ x: 0.41 + vOffset, y: 0.56 - iLen, z: 0.03 });

      // Middle (9, 10, 11, 12)
      const mLen = middleExt ? 0.38 : 0.13;
      points.push({ x: 0.50 + vOffset, y: 0.55, z: 0 });
      points.push({ x: 0.50 + vOffset, y: 0.55 - mLen * 0.4, z: 0.01 });
      points.push({ x: 0.50 + vOffset, y: 0.55 - mLen * 0.7, z: 0.02 });
      points.push({ x: 0.50 + vOffset, y: 0.55 - mLen, z: 0.03 });

      // Ring (13, 14, 15, 16)
      const rLen = ringExt ? 0.34 : 0.12;
      points.push({ x: 0.56 + vOffset, y: 0.57, z: 0 });
      points.push({ x: 0.56 + vOffset, y: 0.57 - rLen * 0.4, z: 0.01 });
      points.push({ x: 0.57 + vOffset, y: 0.57 - rLen * 0.7, z: 0.02 });
      points.push({ x: 0.57 + vOffset, y: 0.57 - rLen, z: 0.03 });

      // Pinky (17, 18, 19, 20)
      const pLen = pinkyExt ? 0.28 : 0.10;
      points.push({ x: 0.62 + vOffset, y: 0.61, z: 0 });
      points.push({ x: 0.63 + vOffset, y: 0.61 - pLen * 0.4, z: 0.01 });
      points.push({ x: 0.64 + vOffset, y: 0.61 - pLen * 0.7, z: 0.02 });
      points.push({ x: 0.65 + vOffset, y: 0.61 - pLen, z: 0.03 });

      return points;
    };

    const definitions: { label: string; ext: [boolean, boolean, boolean, boolean, boolean] }[] = [
      { label: 'Help', ext: [true, false, false, false, false] },
      { label: 'Doctor', ext: [false, true, false, false, false] },
      { label: 'Pain', ext: [false, true, false, false, false] },
      { label: 'Water', ext: [false, true, true, true, false] },
      { label: 'Medicine', ext: [true, false, false, false, false] },
      { label: 'Emergency', ext: [false, false, false, false, false] },
      { label: 'Yes', ext: [false, false, false, false, false] },
      { label: 'No', ext: [true, true, true, false, false] },
      { label: 'Where', ext: [false, true, false, false, false] },
      { label: 'Thank You', ext: [true, true, true, true, true] },
    ];

    // Create 3 varied exemplars per sign
    for (const def of definitions) {
      for (let v = 0; v < 3; v++) {
        baseline.push({
          id: `baseline_${def.label.toLowerCase()}_${v}`,
          label: def.label,
          timestamp: Date.now() - 100000 + v * 1000,
          landmarks: generateTemplate(def.label, def.ext, v),
          handedness: 'Right',
        });
      }
    }

    this.trainingSamples = baseline;
    this.saveDataset();
  }
}

export const signClassifier = new SignClassifierService();
