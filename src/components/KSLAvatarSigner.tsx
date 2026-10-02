/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  FastForward,
  Info,
  Mic,
  MicOff,
  Pause,
  Play,
  RotateCcw,
  Send,
  Sparkles,
  Volume2,
  Zap,
} from 'lucide-react';
import { KSLSignDefinition, KSLKeyframe, ArmPose, HandPose } from '../types/ksl';
import { KSL_LEXICON, interpolateKeyframe, generateFingerspellSign } from '../services/kslAnimations';
import { audioCommService } from '../services/ttsService';

interface KSLAvatarSignerProps {
  initialSpeech?: string;
  onSignComplete?: () => void;
}

export const KSLAvatarSigner: React.FC<KSLAvatarSignerProps> = ({ initialSpeech }) => {
  const [speechInput, setSpeechInput] = useState<string>(
    initialSpeech || 'Unasikia maumivu wapi?'
  );
  const [isTranslating, setIsTranslating] = useState<boolean>(false);
  const [isListeningVoice, setIsListeningVoice] = useState<boolean>(false);
  const [voiceInterim, setVoiceInterim] = useState<string>('');

  // KSL Sequence state
  const [kslSequence, setKslSequence] = useState<KSLSignDefinition[]>([
    KSL_LEXICON.find((s) => s.id === 'wewe') || KSL_LEXICON[0],
    KSL_LEXICON.find((s) => s.id === 'maumivu') || KSL_LEXICON[2],
    KSL_LEXICON.find((s) => s.id === 'wapi') || KSL_LEXICON[8],
  ]);
  const [currentSignIndex, setCurrentSignIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [isLooping, setIsLooping] = useState<boolean>(true);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [currentProgress, setCurrentProgress] = useState<number>(0); // 0 to 1 for current sign
  const [swahiliText, setSwahiliText] = useState<string>('Unasikia maumivu wapi?');
  const [englishText, setEnglishText] = useState<string>('Where do you feel pain?');
  const [clinicalIntent, setClinicalIntent] = useState<string>(
    'Inquiring about exact anatomical location of acute distress'
  );

  const animFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const speechRecognizerRef = useRef<any>(null);

  const currentSign = kslSequence[currentSignIndex] || KSL_LEXICON[0];

  // Voice-to-KSL translation API trigger
  const handleTranslateVoiceToKSL = async (textToTranslate: string) => {
    if (!textToTranslate.trim()) return;
    setIsTranslating(true);
    try {
      const res = await fetch('/api/voice-to-ksl', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ speechText: textToTranslate }),
      });

      if (!res.ok) throw new Error('API server returned error');
      const data = await res.json();

      setSwahiliText(data.swahiliText || textToTranslate);
      setEnglishText(data.englishText || textToTranslate);
      setClinicalIntent(data.clinicalIntent || 'KSL Sign Animation');

      // Resolve gloss tokens to KSL animation objects
      const newSequence: KSLSignDefinition[] = [];
      const glossList: string[] = data.kslGloss || [];

      for (const gloss of glossList) {
        if (gloss.startsWith('SPELL:')) {
          const word = gloss.replace('SPELL:', '');
          newSequence.push(generateFingerspellSign(word));
        } else {
          const found = KSL_LEXICON.find(
            (s) => s.gloss.toUpperCase() === gloss.toUpperCase() || s.id === gloss.toLowerCase()
          );
          if (found) {
            newSequence.push(found);
          } else {
            newSequence.push(generateFingerspellSign(gloss));
          }
        }
      }

      if (newSequence.length > 0) {
        setKslSequence(newSequence);
        setCurrentSignIndex(0);
        setCurrentProgress(0);
        startTimeRef.current = null;
        setIsPlaying(true);
      }
    } catch (err) {
      console.warn('Fallback KSL translator:', err);
      // Fallback: match words to available KSL signs
      const words = textToTranslate.toUpperCase().split(/\s+/);
      const matched: KSLSignDefinition[] = [];
      for (const w of words) {
        const found = KSL_LEXICON.find(
          (s) => s.gloss === w || s.swahili.toUpperCase() === w || s.english.toUpperCase().includes(w)
        );
        if (found) matched.push(found);
      }
      if (matched.length > 0) {
        setKslSequence(matched);
      } else {
        setKslSequence([generateFingerspellSign(words[0] || 'HELLO')]);
      }
      setCurrentSignIndex(0);
      setCurrentProgress(0);
      startTimeRef.current = null;
      setIsPlaying(true);
    } finally {
      setIsTranslating(false);
    }
  };

  // Main 60FPS Animation Loop
  useEffect(() => {
    let lastTime = performance.now();

    const animate = (now: number) => {
      if (isPlaying && currentSign) {
        if (!startTimeRef.current) startTimeRef.current = now;

        const duration = (currentSign.durationMs || 1400) / playbackSpeed;
        const elapsed = now - startTimeRef.current;
        const prog = Math.min(1.0, elapsed / duration);

        setCurrentProgress(prog);

        if (prog >= 1.0) {
          // Transition to next sign in sequence
          if (currentSignIndex < kslSequence.length - 1) {
            setCurrentSignIndex((prev) => prev + 1);
            setCurrentProgress(0);
            startTimeRef.current = now;
          } else if (isLooping) {
            setCurrentSignIndex(0);
            setCurrentProgress(0);
            startTimeRef.current = now;
          } else {
            setIsPlaying(false);
          }
        }
      }

      animFrameRef.current = requestAnimationFrame(animate);
    };

    animFrameRef.current = requestAnimationFrame(animate);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isPlaying, currentSignIndex, kslSequence, currentSign, playbackSpeed, isLooping]);

  // Compute interpolated keyframe pose
  const activeFrame: KSLKeyframe = useMemo(() => {
    if (!currentSign || !currentSign.keyframes) {
      return interpolateKeyframe(KSL_LEXICON[0].keyframes, 0);
    }
    return interpolateKeyframe(currentSign.keyframes, currentProgress);
  }, [currentSign, currentProgress]);

  // Handle Voice Dictation for Doctor
  const toggleVoiceRecording = () => {
    if (isListeningVoice) {
      if (speechRecognizerRef.current) {
        speechRecognizerRef.current.stop();
      }
      setIsListeningVoice(false);
      setVoiceInterim('');
    } else {
      const recognizer = audioCommService.createSpeechRecognizer(
        (transcript, isFinal) => {
          if (isFinal) {
            setSpeechInput(transcript);
            setVoiceInterim('');
            handleTranslateVoiceToKSL(transcript);
          } else {
            setVoiceInterim(transcript);
          }
        },
        (err) => {
          console.warn('Speech recognition error:', err);
          setIsListeningVoice(false);
        }
      );

      if (recognizer) {
        speechRecognizerRef.current = recognizer;
        try {
          recognizer.start();
          setIsListeningVoice(true);
        } catch (e) {
          console.warn('Speech error:', e);
        }
      } else {
        alert('Voice dictation is not supported in this browser. Please type text below.');
      }
    }
  };

  // Helper to render hand fingers
  const renderHandFingers = (arm: ArmPose, isRight: boolean) => {
    const wx = arm.wrist.x;
    const wy = arm.wrist.y;
    const ex = arm.elbow.x;
    const ey = arm.elbow.y;

    // Angle of forearm
    const armAngle = Math.atan2(wy - ey, wx - ex);
    const hand = arm.hand;

    // 5 fingers: Thumb (0), Index (1), Middle (2), Ring (3), Pinky (4)
    const fingerOffsets = isRight
      ? [
          { angleOffset: -0.6, length: 18 * hand.thumb, color: '#38bdf8' },
          { angleOffset: -0.2, length: 24 * hand.index, color: '#14b8a6' },
          { angleOffset: 0.0, length: 26 * hand.middle, color: '#14b8a6' },
          { angleOffset: 0.2, length: 23 * hand.ring, color: '#14b8a6' },
          { angleOffset: 0.4, length: 19 * hand.pinky, color: '#14b8a6' },
        ]
      : [
          { angleOffset: 0.6, length: 18 * hand.thumb, color: '#38bdf8' },
          { angleOffset: 0.2, length: 24 * hand.index, color: '#14b8a6' },
          { angleOffset: 0.0, length: 26 * hand.middle, color: '#14b8a6' },
          { angleOffset: -0.2, length: 23 * hand.ring, color: '#14b8a6' },
          { angleOffset: -0.4, length: 19 * hand.pinky, color: '#14b8a6' },
        ];

    return (
      <g>
        {/* Palm circle */}
        <circle
          cx={wx}
          cy={wy}
          r={9}
          fill="#f8fafc"
          stroke="#0f766e"
          strokeWidth="2"
          className="shadow-sm"
        />

        {/* Fingers */}
        {fingerOffsets.map((f, i) => {
          const totalAngle = armAngle + f.angleOffset * (1 + hand.spread * 0.5);
          const fx = wx + Math.cos(totalAngle) * Math.max(8, f.length);
          const fy = wy + Math.sin(totalAngle) * Math.max(8, f.length);

          return (
            <g key={i}>
              <line
                x1={wx}
                y1={wy}
                x2={fx}
                y2={fy}
                stroke="#0d9488"
                strokeWidth="4"
                strokeLinecap="round"
              />
              <circle
                cx={fx}
                cy={fy}
                r={3}
                fill={f.color}
                stroke="#ffffff"
                strokeWidth="1"
              />
            </g>
          );
        })}
      </g>
    );
  };

  return (
    <div className="space-y-6">
      {/* KSL Header Banner */}
      <div className="bg-gradient-to-r from-teal-950/60 via-slate-900 to-cyan-950/60 border border-teal-500/30 rounded-2xl p-5 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30">
                Voice ➡️ KSL Sign Animation
              </span>
              <span className="text-xs text-slate-400">
                Lugha ya Ishara ya Kenya (Kenyan Sign Language)
              </span>
            </div>
            <h2 className="text-xl font-extrabold text-slate-100 flex items-center gap-2">
              <span>Interactive KSL Medical Signer Avatar</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                KENYA 🇰🇪
              </span>
            </h2>
            <p className="text-xs text-slate-400 max-w-2xl mt-1 leading-relaxed">
              Enables healthcare workers to speak or type in English / Kiswahili and have medical instructions converted directly into natural, grammatically structured Kenyan Sign Language (KSL) animations for Deaf and Hard-of-Hearing patients.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="text-xs text-slate-400">Tokens:</span>
            <div className="flex items-center gap-1 font-mono text-xs font-bold">
              {kslSequence.map((s, idx) => (
                <span
                  key={idx}
                  onClick={() => {
                    setCurrentSignIndex(idx);
                    setCurrentProgress(0);
                    startTimeRef.current = null;
                  }}
                  className={`px-2 py-1 rounded-lg cursor-pointer transition-all ${
                    idx === currentSignIndex
                      ? 'bg-teal-500 text-slate-950 font-black scale-105 shadow-md shadow-teal-500/20'
                      : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {s.gloss}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Avatar & Timeline Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left 7 Cols: The Animated KSL Mannequin / Avatar */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col">
          {/* Avatar Top Bar */}
          <div className="px-4 py-3 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-teal-400 animate-pulse" />
              <span className="text-xs font-bold text-slate-200 font-mono">
                KSL SIGN: <strong className="text-teal-400">{currentSign.gloss}</strong> ({currentSignIndex + 1}/{kslSequence.length})
              </span>
            </div>

            {/* Playback Speed Switcher */}
            <div className="flex items-center gap-1">
              {[0.5, 0.75, 1.0, 1.25].map((spd) => (
                <button
                  key={spd}
                  onClick={() => setPlaybackSpeed(spd)}
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-md transition-colors ${
                    playbackSpeed === spd
                      ? 'bg-teal-500 text-slate-950 font-black'
                      : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {spd}x
                </button>
              ))}
            </div>
          </div>

          {/* 3D / Kinematic Vector Avatar Canvas */}
          <div className="relative aspect-[4/3] bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4 overflow-hidden">
            {/* Background Medical Cross Pattern */}
            <div className="absolute inset-0 opacity-5 pointer-events-none flex items-center justify-center">
              <div className="w-64 h-64 border-4 border-teal-400 rounded-full flex items-center justify-center" />
            </div>

            {/* Interactive Kinematic Human SVG */}
            <svg
              viewBox="0 0 400 480"
              className="w-full h-full max-h-[460px] drop-shadow-2xl select-none"
            >
              <defs>
                <linearGradient id="scrubsGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#0f766e" />
                  <stop offset="100%" stopColor="#115e59" />
                </linearGradient>
                <linearGradient id="skinGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#f8fafc" />
                  <stop offset="100%" stopColor="#e2e8f0" />
                </linearGradient>
              </defs>

              {/* Torso & Shoulders (Doctor Scrubs) */}
              <path
                d="M 130 210 Q 200 230 270 210 L 290 440 L 110 440 Z"
                fill="url(#scrubsGrad)"
                stroke="#14b8a6"
                strokeWidth="2"
              />

              {/* Stethoscope around neck */}
              <path
                d="M 170 200 C 170 260 230 260 230 200"
                fill="none"
                stroke="#38bdf8"
                strokeWidth="4"
                strokeLinecap="round"
              />
              <circle cx="200" cy="270" r="8" fill="#0284c7" stroke="#38bdf8" strokeWidth="2" />

              {/* Neck */}
              <rect x="185" y="150" width="30" height="45" rx="6" fill="url(#skinGrad)" />

              {/* Head */}
              <g transform={`rotate(${activeFrame.head.tilt * 50} 200 110)`}>
                {/* Hair */}
                <path
                  d="M 155 100 C 155 45 245 45 245 100 C 245 70 155 70 155 100 Z"
                  fill="#1e293b"
                />

                {/* Face Base */}
                <ellipse
                  cx="200"
                  cy="110"
                  rx="45"
                  ry="55"
                  fill="url(#skinGrad)"
                  stroke="#cbd5e1"
                  strokeWidth="2"
                />

                {/* Eyebrows (Dynamic for Question/Pain/Neutral) */}
                {activeFrame.head.brows === 'raised' ? (
                  <>
                    <path d="M 175 82 Q 185 75 193 83" fill="none" stroke="#0f172a" strokeWidth="3" strokeLinecap="round" />
                    <path d="M 207 83 Q 215 75 225 82" fill="none" stroke="#0f172a" strokeWidth="3" strokeLinecap="round" />
                  </>
                ) : activeFrame.head.brows === 'furrowed' ? (
                  <>
                    <path d="M 175 87 Q 185 92 195 89" fill="none" stroke="#0f172a" strokeWidth="3.5" strokeLinecap="round" />
                    <path d="M 205 89 Q 215 92 225 87" fill="none" stroke="#0f172a" strokeWidth="3.5" strokeLinecap="round" />
                  </>
                ) : (
                  <>
                    <path d="M 175 85 Q 185 82 193 85" fill="none" stroke="#0f172a" strokeWidth="2.5" strokeLinecap="round" />
                    <path d="M 207 85 Q 215 82 225 85" fill="none" stroke="#0f172a" strokeWidth="2.5" strokeLinecap="round" />
                  </>
                )}

                {/* Eyes */}
                <ellipse cx="184" cy="98" rx="4.5" ry="5.5" fill="#0f172a" />
                <ellipse cx="216" cy="98" rx="4.5" ry="5.5" fill="#0f172a" />
                <circle cx="185.5" cy="96" r="1.5" fill="#ffffff" />
                <circle cx="217.5" cy="96" r="1.5" fill="#ffffff" />

                {/* Nose */}
                <path d="M 200 102 L 198 116 L 204 116" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" />

                {/* Mouth (Dynamic Expression) */}
                {activeFrame.head.mouth === 'grimace' ? (
                  <path d="M 186 135 Q 200 128 214 135" fill="none" stroke="#e11d48" strokeWidth="3" strokeLinecap="round" />
                ) : activeFrame.head.mouth === 'smile' ? (
                  <path d="M 186 130 Q 200 142 214 130" fill="none" stroke="#0d9488" strokeWidth="3" strokeLinecap="round" />
                ) : activeFrame.head.mouth === 'open' ? (
                  <ellipse cx="200" cy="133" rx="8" ry="6" fill="#475569" stroke="#0f172a" strokeWidth="2" />
                ) : (
                  <path d="M 188 132 L 212 132" fill="none" stroke="#64748b" strokeWidth="2.5" strokeLinecap="round" />
                )}
              </g>

              {/* Left Arm (Upper Arm, Forearm, Hand) */}
              <g>
                {/* Upper arm */}
                <line
                  x1={activeFrame.leftArm.shoulder.x}
                  y1={activeFrame.leftArm.shoulder.y}
                  x2={activeFrame.leftArm.elbow.x}
                  y2={activeFrame.leftArm.elbow.y}
                  stroke="#14b8a6"
                  strokeWidth="14"
                  strokeLinecap="round"
                />
                {/* Forearm */}
                <line
                  x1={activeFrame.leftArm.elbow.x}
                  y1={activeFrame.leftArm.elbow.y}
                  x2={activeFrame.leftArm.wrist.x}
                  y2={activeFrame.leftArm.wrist.y}
                  stroke="#2dd4bf"
                  strokeWidth="10"
                  strokeLinecap="round"
                />
                {/* Elbow joint */}
                <circle
                  cx={activeFrame.leftArm.elbow.x}
                  cy={activeFrame.leftArm.elbow.y}
                  r="7"
                  fill="#0f766e"
                  stroke="#5eead4"
                  strokeWidth="2"
                />
                {/* Hand and Fingers */}
                {renderHandFingers(activeFrame.leftArm, false)}
              </g>

              {/* Right Arm (Dominant Arm) */}
              <g>
                {/* Upper arm */}
                <line
                  x1={activeFrame.rightArm.shoulder.x}
                  y1={activeFrame.rightArm.shoulder.y}
                  x2={activeFrame.rightArm.elbow.x}
                  y2={activeFrame.rightArm.elbow.y}
                  stroke="#0284c7"
                  strokeWidth="14"
                  strokeLinecap="round"
                />
                {/* Forearm */}
                <line
                  x1={activeFrame.rightArm.elbow.x}
                  y1={activeFrame.rightArm.elbow.y}
                  x2={activeFrame.rightArm.wrist.x}
                  y2={activeFrame.rightArm.wrist.y}
                  stroke="#38bdf8"
                  strokeWidth="10"
                  strokeLinecap="round"
                />
                {/* Elbow joint */}
                <circle
                  cx={activeFrame.rightArm.elbow.x}
                  cy={activeFrame.rightArm.elbow.y}
                  r="7"
                  fill="#0369a1"
                  stroke="#7dd3fc"
                  strokeWidth="2"
                />
                {/* Hand and Fingers */}
                {renderHandFingers(activeFrame.rightArm, true)}
              </g>
            </svg>

            {/* Movement Action Subtitle Floating Pill */}
            {activeFrame.caption && (
              <div className="absolute bottom-4 inset-x-6 z-10 flex justify-center">
                <div className="bg-slate-950/90 border border-teal-500/40 text-teal-200 text-xs px-3.5 py-1.5 rounded-full shadow-xl backdrop-blur-md flex items-center gap-2 animate-fade-in font-medium">
                  <Zap className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                  <span>{activeFrame.caption}</span>
                </div>
              </div>
            )}
          </div>

          {/* Timeline & Scrubber Bar */}
          <div className="p-4 bg-slate-950 border-t border-slate-800 space-y-3">
            {/* Progress bar across sequence */}
            <div>
              <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                <span>Sign Progress: {Math.round(currentProgress * 100)}%</span>
                <span className="font-mono text-teal-400">
                  {currentSign.swahili} ({currentSign.english})
                </span>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden flex">
                {kslSequence.map((_, idx) => (
                  <div
                    key={idx}
                    className="flex-1 border-r border-slate-900 relative"
                  >
                    <div
                      className={`h-full transition-all ${
                        idx < currentSignIndex
                          ? 'bg-teal-400 w-full'
                          : idx === currentSignIndex
                          ? 'bg-cyan-400'
                          : 'bg-transparent'
                      }`}
                      style={{
                        width:
                          idx === currentSignIndex
                            ? `${currentProgress * 100}%`
                            : undefined,
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Controls Bar */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const prev = Math.max(0, currentSignIndex - 1);
                    setCurrentSignIndex(prev);
                    setCurrentProgress(0);
                    startTimeRef.current = null;
                  }}
                  disabled={currentSignIndex === 0}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-40 transition-colors"
                  title="Previous sign"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="p-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 text-slate-950 font-bold shadow-lg shadow-teal-500/20 hover:opacity-95 transition-opacity"
                  title={isPlaying ? 'Pause' : 'Play'}
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </button>

                <button
                  onClick={() => {
                    const next = Math.min(kslSequence.length - 1, currentSignIndex + 1);
                    setCurrentSignIndex(next);
                    setCurrentProgress(0);
                    startTimeRef.current = null;
                  }}
                  disabled={currentSignIndex === kslSequence.length - 1}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-40 transition-colors"
                  title="Next sign"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>

                <button
                  onClick={() => {
                    setCurrentSignIndex(0);
                    setCurrentProgress(0);
                    startTimeRef.current = null;
                    setIsPlaying(true);
                  }}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors"
                  title="Restart from beginning"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>

              {/* Loop toggle */}
              <button
                onClick={() => setIsLooping(!isLooping)}
                className={`text-xs px-3 py-1.5 rounded-xl border transition-colors flex items-center gap-1.5 ${
                  isLooping
                    ? 'bg-teal-500/20 border-teal-500/40 text-teal-300'
                    : 'bg-slate-800 border-slate-700 text-slate-400'
                }`}
              >
                <span>Loop Animation</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right 5 Cols: Voice Dictation & KSL Translation Controls */}
        <div className="lg:col-span-5 space-y-4">
          {/* Spoken Input Box */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <Mic className="w-4 h-4 text-cyan-400" />
                <span>Clinician Speech Input (Voice 🎤)</span>
              </h3>
              <span className="text-[10px] font-mono text-slate-400">English / Swahili</span>
            </div>

            {/* Input form */}
            <div className="space-y-2">
              <div className="relative">
                <textarea
                  value={speechInput}
                  onChange={(e) => setSpeechInput(e.target.value)}
                  placeholder="Speak or type medical phrase in English or Kiswahili (e.g. 'Unasikia maumivu wapi?' or 'Where is the pain?')..."
                  rows={3}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-teal-500 resize-none"
                />

                <button
                  type="button"
                  onClick={toggleVoiceRecording}
                  className={`absolute bottom-2.5 right-2.5 p-2 rounded-lg transition-all ${
                    isListeningVoice
                      ? 'bg-rose-500 text-white animate-pulse shadow-lg shadow-rose-500/30'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                  }`}
                  title={isListeningVoice ? 'Stop voice recording' : 'Dictate with microphone'}
                >
                  {isListeningVoice ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </button>
              </div>

              {isListeningVoice && voiceInterim && (
                <p className="text-xs text-cyan-300 italic bg-cyan-950/30 p-2 rounded-lg border border-cyan-800/40">
                  Transcribing: "{voiceInterim}..."
                </p>
              )}

              <button
                onClick={() => handleTranslateVoiceToKSL(speechInput)}
                disabled={isTranslating || !speechInput.trim()}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 text-slate-950 font-bold text-xs sm:text-sm shadow-lg shadow-teal-500/20 hover:opacity-95 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Sparkles className={`w-4 h-4 ${isTranslating ? 'animate-spin' : ''}`} />
                <span>{isTranslating ? 'Synthesizing KSL...' : 'Animate in KSL Signer'}</span>
              </button>
            </div>

            {/* Quick Clinical Presets (Kiswahili & English) */}
            <div className="pt-2 border-t border-slate-800">
              <span className="text-[11px] font-semibold text-slate-400 block mb-2">
                Quick Medical Phrases (KSL Ready):
              </span>
              <div className="space-y-1.5">
                {[
                  { sw: 'Unasikia maumivu wapi?', en: 'Where do you feel pain?' },
                  { sw: 'Daktari anakuja sasa kutoa msaada', en: 'Doctor is coming now to help' },
                  { sw: 'Kunywa maji na dawa hii', en: 'Drink water with this medicine' },
                  { sw: 'Je, una homa au joto jingi?', en: 'Do you have a fever or high temperature?' },
                  { sw: 'Tunafanya sindano ya haraka hospitali', en: 'We are giving an emergency injection' },
                ].map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setSpeechInput(item.sw);
                      handleTranslateVoiceToKSL(item.sw);
                    }}
                    className="w-full text-left p-2 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-teal-500/40 hover:bg-slate-800/60 text-xs transition-all flex items-start justify-between group"
                  >
                    <div>
                      <span className="font-semibold text-teal-300 block">{item.sw}</span>
                      <span className="text-[10px] text-slate-400">{item.en}</span>
                    </div>
                    <span className="text-[10px] text-slate-500 group-hover:text-teal-400 transition-colors">
                      Translate ➡️
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Current KSL Linguistic & Clinical Explanation */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-teal-400" />
              <span>Current KSL Sign Details</span>
            </h4>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-lg font-black text-teal-300 font-mono">
                  {currentSign.gloss}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-teal-500/20 text-teal-300 border border-teal-500/30">
                  {currentSign.category}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-slate-500 text-[10px] block">Kiswahili:</span>
                  <span className="font-semibold text-slate-200">{currentSign.swahili}</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] block">English:</span>
                  <span className="font-semibold text-slate-200">{currentSign.english}</span>
                </div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed pt-1 border-t border-slate-800/80">
                {currentSign.description}
              </p>

              {currentSign.culturalNote && (
                <div className="mt-2 text-[11px] text-cyan-300/90 bg-cyan-950/20 border border-cyan-800/30 rounded-lg p-2 flex items-start gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                  <span>{currentSign.culturalNote}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
