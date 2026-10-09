/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Activity,
  Camera,
  CameraOff,
  CheckCircle,
  HelpCircle,
  Play,
  Plus,
  RefreshCw,
  Sliders,
  Sparkles,
  Trash2,
  Video,
  Volume2,
  Zap,
} from 'lucide-react';
import { LandmarkPoint, PredictionResult } from '../types/sign';
import { mediaPipeService } from '../services/mediapipeService';
import { signClassifier } from '../services/signClassifier';
import { audioCommService } from '../services/ttsService';
import { CORE_SIGNS } from '../services/signConstants';

interface SignCameraViewProps {
  onCommitSign: (signLabel: string) => void;
  onRecordLandmarks?: (label: string, landmarks: LandmarkPoint[]) => void;
  targetLanguage: string;
  isRecordingMode?: boolean;
  selectedRecordLabel?: string;
}

export const SignCameraView: React.FC<SignCameraViewProps> = ({
  onCommitSign,
  onRecordLandmarks,
  targetLanguage,
  isRecordingMode = false,
  selectedRecordLabel = 'Help',
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameIdRef = useRef<number | null>(null);

  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isMediaPipeReady, setIsMediaPipeReady] = useState<boolean>(false);
  const [loadingModel, setLoadingModel] = useState<boolean>(true);

  // Recognition state
  const [currentPrediction, setCurrentPrediction] = useState<PredictionResult | null>(null);
  const [holdProgress, setHoldProgress] = useState<number>(0);
  const [tokenBuffer, setTokenBuffer] = useState<string[]>([]);
  const [autoCommitEnabled, setAutoCommitEnabled] = useState<boolean>(true);
  const [simulationActive, setSimulationActive] = useState<boolean>(false);
  const [fps, setFps] = useState<number>(0);

  // Hold-to-confirm tracker
  const candidateRef = useRef<{ sign: string; startTime: number } | null>(null);
  const lastCommittedRef = useRef<string | null>(null);
  const lastCommittedTimeRef = useRef<number>(0);
  const currentLandmarksRef = useRef<LandmarkPoint[] | null>(null);

  // Initialize MediaPipe
  useEffect(() => {
    let mounted = true;
    async function init() {
      setLoadingModel(true);
      const ok = await mediaPipeService.initialize();
      if (mounted) {
        setIsMediaPipeReady(ok);
        setLoadingModel(false);
      }
    }
    init();
    return () => {
      mounted = false;
    };
  }, []);

  // Start Camera
  const startCamera = async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user',
        },
        audio: false,
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play();
          setIsCameraActive(true);
          setSimulationActive(false);
        };
      }
    } catch (err: any) {
      console.warn('Camera access denied or unavailable:', err);
      setCameraError('Camera access unavailable. You can use Interactive Simulation Mode to test all signs.');
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  // Main Detection Loop
  useEffect(() => {
    let lastTime = performance.now();
    let frameCount = 0;
    let fpsTimer = performance.now();

    const loop = (time: number) => {
      frameCount++;
      if (time - fpsTimer > 1000) {
        setFps(Math.round((frameCount * 1000) / (time - fpsTimer)));
        frameCount = 0;
        fpsTimer = time;
      }

      if (isCameraActive && videoRef.current && canvasRef.current && isMediaPipeReady) {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        if (video.readyState >= 2 && ctx) {
          if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
            canvas.width = video.videoWidth || 640;
            canvas.height = video.videoHeight || 480;
          }

          const results = mediaPipeService.detectForVideo(video, time);

          if (results && results.landmarks && results.landmarks.length > 0) {
            const rawLandmarks = results.landmarks[0] as LandmarkPoint[];
            currentLandmarksRef.current = rawLandmarks;

            // Run sign classifier
            const prediction = signClassifier.predict(rawLandmarks);
            setCurrentPrediction(prediction);

            // Draw skeleton overlay
            mediaPipeService.drawLandmarks(
              ctx,
              results.landmarks as LandmarkPoint[][],
              canvas.width,
              canvas.height,
              prediction?.sign
            );

            // Handle Hold-to-commit logic
            if (prediction && prediction.confidencePercent >= 70) {
              const sign = prediction.sign;
              const now = performance.now();

              if (!candidateRef.current || candidateRef.current.sign !== sign) {
                candidateRef.current = { sign, startTime: now };
                setHoldProgress(0);
              } else {
                const elapsed = now - candidateRef.current.startTime;
                const requiredHold = 600; // ms
                const progress = Math.min(100, Math.round((elapsed / requiredHold) * 100));
                setHoldProgress(progress);

                if (elapsed >= requiredHold) {
                  // Only emit if not committed very recently (debouncing 1.5s for same sign)
                  const cooldown = 1500;
                  const isSameRecent =
                    lastCommittedRef.current === sign && now - lastCommittedTimeRef.current < cooldown;

                  if (!isSameRecent && autoCommitEnabled) {
                    commitSign(sign);
                    lastCommittedRef.current = sign;
                    lastCommittedTimeRef.current = now;
                    candidateRef.current = null;
                    setHoldProgress(0);
                  }
                }
              }
            } else {
              candidateRef.current = null;
              setHoldProgress(0);
            }
          } else {
            // No hands detected
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            setCurrentPrediction(null);
            candidateRef.current = null;
            setHoldProgress(0);
          }
        }
      }

      animFrameIdRef.current = requestAnimationFrame(loop);
    };

    animFrameIdRef.current = requestAnimationFrame(loop);
    return () => {
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
    };
  }, [isCameraActive, isMediaPipeReady, autoCommitEnabled]);

  // Commit Sign Token
  const commitSign = (sign: string) => {
    audioCommService.playRecognitionChime(sign === 'Emergency' || sign === 'Pain');
    setTokenBuffer((prev) => [...prev, sign]);
    onCommitSign(sign);
  };

  // Simulated Landmark Injection (allows full testing even without webcam)
  const simulateSign = (signLabel: string) => {
    setSimulationActive(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 640;
    canvas.height = 480;

    // Retrieve baseline training sample for this sign
    const dataset = signClassifier.getDataset();
    const sample = dataset.find((s) => s.label === signLabel) || dataset[0];

    if (sample) {
      currentLandmarksRef.current = sample.landmarks;
      const prediction = signClassifier.predict(sample.landmarks);
      setCurrentPrediction(prediction);

      // Draw skeleton
      mediaPipeService.drawLandmarks(
        ctx,
        [sample.landmarks],
        canvas.width,
        canvas.height,
        signLabel
      );

      commitSign(signLabel);
    }
  };

  const handleCaptureCurrentFrame = () => {
    if (currentLandmarksRef.current && onRecordLandmarks) {
      onRecordLandmarks(selectedRecordLabel, currentLandmarksRef.current);
      audioCommService.playRecognitionChime(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl flex flex-col">
      {/* Top Header Bar */}
      <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-teal-500/10 text-teal-400 border border-teal-500/20">
            <Video className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
              <span>Step 1: MediaPipe Landmark Tracking</span>
              {fps > 0 && isCameraActive && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-teal-300 font-mono">
                  {fps} FPS
                </span>
              )}
            </h2>
            <p className="text-[11px] text-slate-400">
              Extracts 21 hand landmarks directly on-device with WebAssembly
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Auto-commit switch */}
          <button
            onClick={() => setAutoCommitEnabled(!autoCommitEnabled)}
            className={`text-xs px-2.5 py-1 rounded-lg border transition-colors flex items-center gap-1.5 ${
              autoCommitEnabled
                ? 'bg-teal-500/20 border-teal-500/40 text-teal-300'
                : 'bg-slate-800 border-slate-700 text-slate-400'
            }`}
            title="Auto-commit detected signs to message buffer"
          >
            <Zap className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Auto-Commit</span>
          </button>

          {/* Camera toggle */}
          {isCameraActive ? (
            <button
              onClick={stopCamera}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-rose-500/20 border border-rose-500/30 text-rose-300 hover:bg-rose-500/30 transition-colors"
            >
              <CameraOff className="w-3.5 h-3.5" />
              <span>Stop Camera</span>
            </button>
          ) : (
            <button
              onClick={startCamera}
              disabled={loadingModel}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-gradient-to-r from-teal-500 to-cyan-500 text-slate-950 font-semibold shadow hover:opacity-95 transition-opacity disabled:opacity-50"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Start Camera</span>
            </button>
          )}
        </div>
      </div>

      {/* Video & Canvas Viewport */}
      <div className="relative aspect-[4/3] sm:aspect-[16/10] bg-slate-950 flex items-center justify-center overflow-hidden">
        {/* Underlying Video */}
        <video
          ref={videoRef}
          playsInline
          muted
          className={`absolute inset-0 w-full h-full object-cover transform -scale-x-100 ${
            isCameraActive ? 'opacity-70' : 'opacity-0 pointer-events-none'
          }`}
        />

        {/* MediaPipe Neon Landmark Canvas */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full object-cover pointer-events-none z-10"
        />

        {/* Standby / Fallback Placeholder when Camera is off */}
        {!isCameraActive && !simulationActive && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-0 bg-slate-950/90">
            <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-teal-400 mb-4 shadow-inner">
              <Video className="w-8 h-8" />
            </div>
            <h3 className="text-base font-semibold text-slate-200 mb-1">
              Hand Tracking Standby
            </h3>
            <p className="text-xs text-slate-400 max-w-sm mb-4">
              Click <strong className="text-teal-400">Start Camera</strong> to track your real hand in real time, or test with quick simulation below.
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              <button
                onClick={startCamera}
                className="px-4 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-bold transition-all shadow-lg shadow-teal-500/20 flex items-center gap-1.5"
              >
                <Camera className="w-4 h-4" />
                Enable Webcam
              </button>
            </div>
            {cameraError && (
              <p className="mt-3 text-xs text-amber-400/90 max-w-md bg-amber-950/30 border border-amber-800/40 p-2 rounded-lg">
                {cameraError}
              </p>
            )}
          </div>
        )}

        {/* Live Detected Sign Banner (Floating HUD) */}
        {currentPrediction && (
          <div className="absolute top-4 left-4 z-20 bg-slate-950/90 border border-teal-500/40 rounded-xl p-3 shadow-2xl backdrop-blur-md flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500/20 border border-teal-500/30 flex items-center justify-center text-teal-400">
              <CheckCircle className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-black text-white tracking-wide uppercase">
                  {currentPrediction.sign}
                </span>
                <span className="text-xs font-mono px-1.5 py-0.5 rounded bg-teal-500/20 text-teal-300 font-semibold">
                  {currentPrediction.confidencePercent}%
                </span>
              </div>
              <div className="w-28 bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1">
                <div
                  className="bg-gradient-to-r from-teal-400 to-cyan-400 h-full transition-all duration-150"
                  style={{ width: `${currentPrediction.confidencePercent}%` }}
                />
              </div>
              {holdProgress > 0 && (
                <div className="mt-1 flex items-center gap-1 text-[10px] text-teal-300">
                  <span>Confirming:</span>
                  <div className="w-14 bg-slate-800 h-1 rounded-full overflow-hidden">
                    <div
                      className="bg-cyan-400 h-full transition-all duration-75"
                      style={{ width: `${holdProgress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Telemetry Drawer (Bottom Left) */}
        {currentPrediction && (
          <div className="absolute bottom-3 left-3 z-20 bg-slate-950/80 border border-slate-800/80 rounded-lg px-2.5 py-1.5 text-[10px] font-mono backdrop-blur-sm hidden sm:flex items-center gap-3 text-slate-300">
            <span className="text-slate-400">Fingers:</span>
            <div className="flex items-center gap-1">
              <span className={`px-1 rounded ${currentPrediction.fingerStates.thumb ? 'bg-teal-500/30 text-teal-200' : 'bg-slate-800 text-slate-500'}`}>T</span>
              <span className={`px-1 rounded ${currentPrediction.fingerStates.index ? 'bg-teal-500/30 text-teal-200' : 'bg-slate-800 text-slate-500'}`}>I</span>
              <span className={`px-1 rounded ${currentPrediction.fingerStates.middle ? 'bg-teal-500/30 text-teal-200' : 'bg-slate-800 text-slate-500'}`}>M</span>
              <span className={`px-1 rounded ${currentPrediction.fingerStates.ring ? 'bg-teal-500/30 text-teal-200' : 'bg-slate-800 text-slate-500'}`}>R</span>
              <span className={`px-1 rounded ${currentPrediction.fingerStates.pinky ? 'bg-teal-500/30 text-teal-200' : 'bg-slate-800 text-slate-500'}`}>P</span>
            </div>
            <span className="text-slate-400">Pinch: {currentPrediction.metrics?.pinchDistance.toFixed(2)}</span>
          </div>
        )}

        {/* Dataset Quick-Record Trigger */}
        {isRecordingMode && (
          <div className="absolute top-4 right-4 z-20">
            <button
              onClick={handleCaptureCurrentFrame}
              className="px-3 py-1.5 rounded-lg bg-rose-500 hover:bg-rose-400 text-white text-xs font-bold shadow-lg flex items-center gap-1.5 animate-bounce"
            >
              <div className="w-2 h-2 rounded-full bg-white animate-ping" />
              Capture Landmark Sample
            </button>
          </div>
        )}
      </div>

      {/* Simulator / Quick-Test Gesture Chips */}
      <div className="p-3 bg-slate-900/90 border-t border-slate-800">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-teal-400" />
            <span>Interactive Landmark Gestures (Pipeline Simulation)</span>
          </span>
          <span className="text-[11px] text-slate-400 hidden sm:inline">
            Click gesture to test real-time recognition
          </span>
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          {CORE_SIGNS.map((sign) => (
            <button
              key={sign.id}
              onClick={() => simulateSign(sign.label)}
              className="px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-teal-500/50 hover:bg-slate-850 text-slate-300 hover:text-teal-200 transition-all shrink-0 flex items-center gap-1.5 font-medium shadow-sm"
              title={`${sign.label}: ${sign.instruction}`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-teal-400 shrink-0" />
              <span>{sign.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
