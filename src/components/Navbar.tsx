/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Activity, BookOpen, Database, Eye, Layers, Sparkles, UserCheck, Video, Volume2 } from 'lucide-react';

interface NavbarProps {
  activeTab: 'stream' | 'ksl' | 'studio' | 'guide' | 'architecture';
  setActiveTab: (tab: 'stream' | 'ksl' | 'studio' | 'guide' | 'architecture') => void;
  mediaPipeReady: boolean;
  cameraActive: boolean;
  datasetCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  mediaPipeReady,
  cameraActive,
  datasetCount,
}) => {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-400 to-cyan-600 flex items-center justify-center text-slate-950 shadow-lg shadow-teal-500/20 font-bold text-lg">
              🤟
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-teal-200 via-cyan-100 to-white bg-clip-text text-transparent">
                  Language Doctor
                </span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-400 border border-teal-500/20 tracking-wider">
                  KSL + MEDIAPIPE
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Bidirectional Sign & Voice Medical Communication (Kenyan Sign Language)
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex items-center gap-1 sm:gap-1.5">
            <button
              onClick={() => setActiveTab('stream')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                activeTab === 'stream'
                  ? 'bg-teal-500/15 text-teal-300 border border-teal-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Activity className="w-4 h-4" />
              <span>Sign ➡️ Voice</span>
            </button>

            <button
              onClick={() => setActiveTab('ksl')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                activeTab === 'ksl'
                  ? 'bg-gradient-to-r from-teal-500/20 to-cyan-500/20 text-teal-200 border border-teal-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <UserCheck className="w-4 h-4 text-teal-400" />
              <span>Voice ➡️ KSL Avatar</span>
              <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                KSL
              </span>
            </button>

            <button
              onClick={() => setActiveTab('studio')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                activeTab === 'studio'
                  ? 'bg-teal-500/15 text-teal-300 border border-teal-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Database className="w-4 h-4" />
              <span className="hidden md:inline">Dataset & Classifier</span>
              <span className="md:hidden">Dataset</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-800 text-teal-400 border border-slate-700">
                {datasetCount}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('guide')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                activeTab === 'guide'
                  ? 'bg-teal-500/15 text-teal-300 border border-teal-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Signs</span>
            </button>

            <button
              onClick={() => setActiveTab('architecture')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                activeTab === 'architecture'
                  ? 'bg-teal-500/15 text-teal-300 border border-teal-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span className="hidden xl:inline">Architecture</span>
            </button>
          </nav>

          {/* System Status Indicators */}
          <div className="hidden xl:flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-300">
              <span
                className={`w-2 h-2 rounded-full ${
                  mediaPipeReady ? 'bg-teal-400 animate-pulse' : 'bg-amber-400'
                }`}
              />
              <span>{mediaPipeReady ? 'MediaPipe WASM' : 'Loading Vision'}</span>
            </div>

            <div className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-300">
              <span
                className={`w-2 h-2 rounded-full ${
                  cameraActive ? 'bg-emerald-400' : 'bg-slate-500'
                }`}
              />
              <span>{cameraActive ? 'Camera Active' : 'Camera Standby'}</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
