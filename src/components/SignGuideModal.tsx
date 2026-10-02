/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { BookOpen, CheckCircle, Info, Sparkles, Target, Zap } from 'lucide-react';
import { CORE_SIGNS } from '../services/signConstants';
import { SignMetadata } from '../types/sign';

interface SignGuideModalProps {
  onSelectForPractice?: (sign: SignMetadata) => void;
}

export const SignGuideModal: React.FC<SignGuideModalProps> = ({ onSelectForPractice }) => {
  const [filter, setFilter] = useState<'all' | 'medical' | 'essential' | 'question'>('all');
  const [selectedSign, setSelectedSign] = useState<SignMetadata>(CORE_SIGNS[0]);

  const filteredSigns = CORE_SIGNS.filter(
    (s) => filter === 'all' || s.category === filter
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30">
                Core Medical Scope
              </span>
              <span className="text-xs text-slate-400">10 Reliable Healthcare Signs</span>
            </div>
            <h2 className="text-xl font-extrabold text-slate-100">
              Medical Sign Language Visual Reference & Guide
            </h2>
            <p className="text-xs text-slate-400 max-w-2xl mt-1">
              For patient safety and maximum recognition accuracy, Language Doctor focuses on 10 high-value signs calibrated for clinical triage and inpatient care.
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-950 rounded-xl border border-slate-800 self-start sm:self-auto">
            {(['all', 'medical', 'essential', 'question'] as const).map((cat) => (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                className={`text-xs px-3 py-1.5 rounded-lg capitalize font-medium transition-all ${
                  filter === cat
                    ? 'bg-teal-500 text-slate-950 font-bold shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid of Sign Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredSigns.map((sign) => {
          const isSelected = selectedSign.id === sign.id;
          return (
            <div
              key={sign.id}
              onClick={() => setSelectedSign(sign)}
              className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                isSelected
                  ? 'bg-slate-900 border-teal-500/60 shadow-xl shadow-teal-500/10 ring-1 ring-teal-500/40'
                  : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
              }`}
            >
              <div>
                {/* Card Top */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2.5">
                    <span className="text-3xl p-2 rounded-xl bg-slate-950 border border-slate-800">
                      {sign.icon}
                    </span>
                    <div>
                      <h3 className="text-base font-bold text-slate-100">{sign.label}</h3>
                      <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                        {sign.category}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Description & Instruction */}
                <p className="text-xs text-slate-300 leading-relaxed mb-2.5">
                  {sign.description}
                </p>

                <div className="bg-slate-950/70 rounded-xl p-2.5 border border-slate-800/80 mb-3 space-y-1.5 text-[11px]">
                  <div className="text-teal-300 font-semibold flex items-center gap-1.5">
                    <Zap className="w-3 h-3 text-teal-400" />
                    <span>How to perform:</span>
                  </div>
                  <p className="text-slate-300 leading-normal">
                    {sign.instruction}
                  </p>
                </div>

                {/* Clinical Context */}
                <div className="text-[11px] text-slate-400 flex items-start gap-1.5 mb-3">
                  <Info className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                  <span><strong>Clinical use:</strong> {sign.clinicalContext}</span>
                </div>
              </div>

              {/* Finger Configurations Pill Deck */}
              <div className="pt-2.5 border-t border-slate-800 flex items-center justify-between text-[10px]">
                <span className="text-slate-400">Finger Geometry:</span>
                <div className="flex items-center gap-1 font-mono">
                  <span
                    className={`px-1.5 py-0.5 rounded ${
                      sign.fingerStateHint.thumb === 'extended'
                        ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30'
                        : 'bg-slate-800 text-slate-500'
                    }`}
                  >
                    T:{sign.fingerStateHint.thumb[0].toUpperCase()}
                  </span>
                  <span
                    className={`px-1.5 py-0.5 rounded ${
                      sign.fingerStateHint.index === 'extended'
                        ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30'
                        : 'bg-slate-800 text-slate-500'
                    }`}
                  >
                    I:{sign.fingerStateHint.index[0].toUpperCase()}
                  </span>
                  <span
                    className={`px-1.5 py-0.5 rounded ${
                      sign.fingerStateHint.middle === 'extended'
                        ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30'
                        : 'bg-slate-800 text-slate-500'
                    }`}
                  >
                    M:{sign.fingerStateHint.middle[0].toUpperCase()}
                  </span>
                  <span
                    className={`px-1.5 py-0.5 rounded ${
                      sign.fingerStateHint.ring === 'extended'
                        ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30'
                        : 'bg-slate-800 text-slate-500'
                    }`}
                  >
                    R:{sign.fingerStateHint.ring[0].toUpperCase()}
                  </span>
                  <span
                    className={`px-1.5 py-0.5 rounded ${
                      sign.fingerStateHint.pinky === 'extended'
                        ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30'
                        : 'bg-slate-800 text-slate-500'
                    }`}
                  >
                    P:{sign.fingerStateHint.pinky[0].toUpperCase()}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
