/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  ArrowRight,
  CheckCircle2,
  Cpu,
  Database,
  Globe,
  Layers,
  Lock,
  Mic,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Video,
  Volume2,
  Zap,
} from 'lucide-react';

export const ArchitectureModal: React.FC = () => {
  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Overview Hero */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-teal-950/40 border border-teal-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30">
              System Architecture & Methodology
            </span>
            <span className="text-xs text-slate-400">Local-First Edge ML</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight mb-3">
            How Language Doctor Learns Sign Language Using MediaPipe
          </h2>

          <p className="text-sm text-slate-300 max-w-3xl leading-relaxed">
            Language Doctor uses Google MediaPipe as the foundation for sign-language recognition. Rather than trying to interpret raw camera pixel images directly, MediaPipe converts video into a structured geometric representation of the user's hands and joints (21 3D landmarks per hand).
          </p>

          {/* Key Advantages Matrix */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
            <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-start gap-2.5">
              <Zap className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
              <div>
                <span className="text-xs font-bold text-slate-200 block">Edge WASM</span>
                <span className="text-[10px] text-slate-400">Runs 100% on-device</span>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <span className="text-xs font-bold text-slate-200 block">Privacy-First</span>
                <span className="text-[10px] text-slate-400">Zero raw video stored</span>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-start gap-2.5">
              <Cpu className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
              <div>
                <span className="text-xs font-bold text-slate-200 block">Lightweight</span>
                <span className="text-[10px] text-slate-400">21 points, no GPU server</span>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-start gap-2.5">
              <Smartphone className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <span className="text-xs font-bold text-slate-200 block">Universal</span>
                <span className="text-[10px] text-slate-400">Mobile & browser ready</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 5-Step Pipeline Deep Dive */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
          <Layers className="w-5 h-5 text-teal-400" />
          <span>The 5-Step Communication Pipeline</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          {/* Step 1 */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-teal-400 font-mono">
                Step 01
              </span>
              <h4 className="text-sm font-bold text-white mt-1 mb-2">
                Hand & Body Tracking
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                MediaPipe analyzes each video frame at 30+ FPS and extracts 21 landmark points (x, y, z), measuring finger flexion, wrist orientation, and angles.
              </p>
            </div>
            <div className="mt-4 p-2 rounded-lg bg-slate-950 border border-slate-800 text-[11px] font-mono text-teal-300">
              Camera → Landmarks
            </div>
          </div>

          {/* Step 2 */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-cyan-400 font-mono">
                Step 02
              </span>
              <h4 className="text-sm font-bold text-white mt-1 mb-2">
                Build Dataset
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                For each sign (Help, Doctor, Pain, Water), users record varied examples across angles and distances into a JSON vector dataset.
              </p>
            </div>
            <div className="mt-4 p-2 rounded-lg bg-slate-950 border border-slate-800 text-[11px] font-mono text-cyan-300">
              {`{ label, landmarks }`}
            </div>
          </div>

          {/* Step 3 */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-teal-400 font-mono">
                Step 03
              </span>
              <h4 className="text-sm font-bold text-white mt-1 mb-2">
                Sign Classifier
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                A lightweight geometric ML classifier (KNN + heuristic geometry) learns handshapes, finger spreads, and spatial motions.
              </p>
            </div>
            <div className="mt-4 p-2 rounded-lg bg-slate-950 border border-slate-800 text-[11px] font-mono text-teal-300">
              Shape + Motion = Sign
            </div>
          </div>

          {/* Step 4 */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-cyan-400 font-mono">
                Step 04
              </span>
              <h4 className="text-sm font-bold text-white mt-1 mb-2">
                Real-Time Recognition
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Continuously evaluates incoming frames with temporal smoothing windows and hold-to-confirm timers, converting signs into clean text tokens.
              </p>
            </div>
            <div className="mt-4 p-2 rounded-lg bg-slate-950 border border-slate-800 text-[11px] font-mono text-cyan-300">
              🤟 Detected → "HELP"
            </div>
          </div>

          {/* Step 5 */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-400 font-mono">
                Step 05
              </span>
              <h4 className="text-sm font-bold text-white mt-1 mb-2">
                Unified Message Layer
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Signs, voice speech, and typed text merge into a single dialogue format, synthesized by Gemini into clinical sentences and spoken via Pocket TTS.
              </p>
            </div>
            <div className="mt-4 p-2 rounded-lg bg-slate-950 border border-slate-800 text-[11px] font-mono text-emerald-300">
              Sign + Voice + Text
            </div>
          </div>
        </div>
      </div>

      {/* Unified Architecture Diagram */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl">
        <h3 className="text-base font-bold text-slate-100 mb-6 text-center">
          The Unified Healthcare Communication Engine
        </h3>

        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Modalities Column */}
          <div className="w-full md:w-1/4 space-y-3">
            <div className="p-3.5 rounded-xl bg-slate-950 border border-teal-500/40 flex items-center gap-3">
              <span className="text-2xl">🤟</span>
              <div>
                <span className="text-xs font-bold text-slate-200 block">SIGN LANGUAGE</span>
                <span className="text-[10px] text-teal-400">MediaPipe Hand Tracking</span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-cyan-500/40 flex items-center gap-3">
              <span className="text-2xl">🎤</span>
              <div>
                <span className="text-xs font-bold text-slate-200 block">VOICE SPEECH</span>
                <span className="text-[10px] text-cyan-400">Web Speech Dictation</span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-700 flex items-center gap-3">
              <span className="text-2xl">⌨️</span>
              <div>
                <span className="text-xs font-bold text-slate-200 block">TYPED TEXT</span>
                <span className="text-[10px] text-slate-400">Medical Clinical Presets</span>
              </div>
            </div>
          </div>

          {/* Central Arrow */}
          <div className="hidden md:flex flex-col items-center justify-center text-teal-400">
            <ArrowRight className="w-8 h-8" />
          </div>

          {/* Unified Core */}
          <div className="w-full md:w-2/5 p-5 rounded-2xl bg-gradient-to-b from-slate-950 to-slate-900 border border-teal-500/50 shadow-xl text-center space-y-3">
            <div className="w-12 h-12 rounded-xl bg-teal-500/20 border border-teal-500/40 flex items-center justify-center mx-auto text-teal-300">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-extrabold text-white">
                Unified Message Layer
              </h4>
              <p className="text-xs text-slate-400 mt-1">
                Clinical NLP Synthesis & Urgency Classifier (Gemini 3.8 Flash)
              </p>
            </div>
            <div className="text-[10px] bg-slate-950/80 p-2.5 rounded-xl border border-slate-800 font-mono text-teal-300">
              Raw Tokens → Grammatical Clinical Sentence → Triage Urgency
            </div>
          </div>

          {/* Output Arrow */}
          <div className="hidden md:flex flex-col items-center justify-center text-teal-400">
            <ArrowRight className="w-8 h-8" />
          </div>

          {/* Output Modalities */}
          <div className="w-full md:w-1/4 space-y-3">
            <div className="p-3.5 rounded-xl bg-slate-950 border border-teal-500/40 flex items-center gap-3">
              <span className="text-2xl">🤟</span>
              <div>
                <span className="text-xs font-bold text-slate-200 block">KSL SIGN AVATAR</span>
                <span className="text-[10px] text-teal-400">Animated Signing 🇰🇪</span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-emerald-500/40 flex items-center gap-3">
              <span className="text-2xl">🔊</span>
              <div>
                <span className="text-xs font-bold text-slate-200 block">POCKET TTS</span>
                <span className="text-[10px] text-emerald-400">Speech Synthesis Output</span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-amber-500/40 flex items-center gap-3">
              <span className="text-2xl">🚨</span>
              <div>
                <span className="text-xs font-bold text-slate-200 block">TRIAGE ALERT</span>
                <span className="text-[10px] text-amber-400">Emergency & Urgency Tag</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Reverse Pipeline: Voice to KSL Animation */}
      <div className="bg-gradient-to-r from-teal-950/40 via-slate-900 to-cyan-950/40 border border-teal-500/30 rounded-3xl p-6 sm:p-8 shadow-xl">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            Bidirectional Loop
          </span>
          <span className="text-xs text-slate-400">Kenyan Sign Language (KSL) Focus</span>
        </div>
        <h3 className="text-lg font-bold text-white mb-2">
          Reverse Direction: Voice ➡️ KSL Sign Animation
        </h3>
        <p className="text-xs text-slate-300 max-w-3xl leading-relaxed mb-6">
          To achieve complete two-way clinical communication, hearing clinicians can speak in English or Kiswahili, and the system translates the spoken words into structured KSL grammar, driving an animated avatar with articulated joints, fingers, and facial non-manual markers.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-center">
          <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
            <span className="text-xl mb-1 block">🎤</span>
            <span className="text-xs font-bold text-slate-200 block">1. Doctor Voice</span>
            <span className="text-[10px] text-slate-400">English / Kiswahili</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-950 border border-teal-500/30">
            <span className="text-xl mb-1 block">🤖</span>
            <span className="text-xs font-bold text-teal-300 block">2. KSL Gloss Engine</span>
            <span className="text-[10px] text-slate-400">Topic-comment syntax</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-950 border border-cyan-500/30">
            <span className="text-xl mb-1 block">⚡</span>
            <span className="text-xs font-bold text-cyan-300 block">3. Kinematic Lerp</span>
            <span className="text-[10px] text-slate-400">60FPS joint interpolation</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-950 border border-emerald-500/30">
            <span className="text-xl mb-1 block">🤟</span>
            <span className="text-xs font-bold text-emerald-300 block">4. Animated Signer</span>
            <span className="text-[10px] text-slate-400">Deaf patient comprehension</span>
          </div>
        </div>
      </div>
    </div>
  );
};
