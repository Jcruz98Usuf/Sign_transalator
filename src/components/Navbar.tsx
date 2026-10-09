/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Activity, BookOpen, Layers, Mic, Stethoscope } from 'lucide-react';

interface NavbarProps {
  activeTab: 'vrm' | 'stream' | 'ksl' | 'studio' | 'guide' | 'architecture';
  setActiveTab: (tab: 'vrm' | 'stream' | 'ksl' | 'studio' | 'guide' | 'architecture') => void;
  mediaPipeReady: boolean;
  cameraActive: boolean;
  datasetCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
}) => {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-800 bg-slate-950/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400 shadow-sm select-none">
              <Stethoscope className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-base tracking-tight text-white">
                  Language Doctor
                </span>
                <span className="text-[11px] font-medium text-teal-400/90 hidden sm:inline">
                  Kenyan Sign Language
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden md:block">
                Clinical Healthcare Translation & Motion Modeling
              </p>
            </div>
          </div>

          {/* Navigation Tabs - Clean, Uncluttered, Professional */}
          <nav className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={() => setActiveTab('vrm')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all ${
                activeTab === 'vrm'
                  ? 'bg-teal-500/15 text-teal-300 border border-teal-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent'
              }`}
            >
              <Layers className="w-4 h-4 text-teal-400" />
              <span>Training Model</span>
            </button>

            <button
              onClick={() => setActiveTab('stream')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all ${
                activeTab === 'stream'
                  ? 'bg-teal-500/15 text-teal-300 border border-teal-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent'
              }`}
            >
              <Activity className="w-4 h-4 text-cyan-400" />
              <span>Sign to Voice</span>
            </button>

            <button
              onClick={() => setActiveTab('ksl')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all ${
                activeTab === 'ksl'
                  ? 'bg-teal-500/15 text-teal-300 border border-teal-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent'
              }`}
            >
              <Mic className="w-4 h-4 text-emerald-400" />
              <span>Voice to Sign</span>
            </button>

            <button
              onClick={() => setActiveTab('guide')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all ${
                activeTab === 'guide'
                  ? 'bg-teal-500/15 text-teal-300 border border-teal-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent'
              }`}
            >
              <BookOpen className="w-4 h-4 text-amber-400" />
              <span>Sign Guide</span>
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
};
