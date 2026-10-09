/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  BookOpen,
  ChevronDown,
  ChevronUp,
  FileText,
  HelpCircle,
  Layers,
  Mic,
  Search,
} from 'lucide-react';
import { CORE_SIGNS } from '../services/signConstants';
import { SIGN_VOCABULARY } from '../signs';

interface SignGuideModalProps {
  onSelectSignForVRM?: (signId: string) => void;
  onSelectSignForVoiceToSign?: (signText: string) => void;
}

export const SignGuideModal: React.FC<SignGuideModalProps> = ({
  onSelectSignForVRM,
  onSelectSignForVoiceToSign,
}) => {
  const [filter, setFilter] = useState<'all' | 'medical' | 'essential' | 'question'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedHowId, setExpandedHowId] = useState<string | null>(null);

  // Map CORE_SIGNS with Swahili translations from SIGN_VOCABULARY
  const enrichedSigns = CORE_SIGNS.map((core) => {
    const vocab = SIGN_VOCABULARY.find(
      (v) => v.id === core.id || v.word.toLowerCase() === core.label.toLowerCase()
    );
    return {
      ...core,
      swahili: vocab?.swahili || core.label,
      english: vocab?.english || core.description,
      kslGloss: vocab?.kslGloss || core.label.toUpperCase(),
    };
  });

  const filteredSigns = enrichedSigns.filter((s) => {
    const matchesCategory = filter === 'all' || s.category === filter;
    const matchesSearch =
      searchQuery.trim() === '' ||
      s.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.swahili.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.english.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const toggleHow = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedHowId(expandedHowId === id ? null : id);
  };

  return (
    <div className="space-y-5 max-w-5xl mx-auto">
      {/* Header Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-teal-500/15 text-teal-300 border border-teal-500/30">
                Curriculum Reference
              </span>
              <span className="text-xs text-slate-400">
                Kenya National Association of the Deaf (KNAD) Healthcare Standards
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
              Kenyan Sign Language (KSL) Medical Sign Guide
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
              Click any sign to open in Voice to Sign, press <strong className="text-amber-400">How</strong> to read written step-by-step instructions, or press <strong className="text-teal-400">Help</strong> to jump to the 3D Training Model avatar.
            </p>
          </div>

          {/* Quick Search Input */}
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search sign, English or Swahili..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-teal-500"
            />
          </div>
        </div>

        {/* Filter Navigation */}
        <div className="flex items-center gap-1.5 mt-4 pt-3 border-t border-slate-800/80 overflow-x-auto text-xs">
          {[
            { id: 'all', label: 'All Signs' },
            { id: 'medical', label: 'Medical & Clinical' },
            { id: 'essential', label: 'Essential Daily' },
            { id: 'question', label: 'Questions' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setFilter(cat.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                filter === cat.id
                  ? 'bg-teal-500 text-slate-950 font-bold shadow-sm'
                  : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {cat.label}
            </button>
          ))}
          <span className="ml-auto text-[11px] text-slate-500 font-mono hidden sm:inline">
            {filteredSigns.length} signs listed
          </span>
        </div>
      </div>

      {/* Clean Structured List View */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl divide-y divide-slate-800/70">
        {filteredSigns.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-xs">
            No signs matched your search criteria.
          </div>
        ) : (
          filteredSigns.map((sign) => {
            const isHowOpen = expandedHowId === sign.id;

            return (
              <div
                key={sign.id}
                className="hover:bg-slate-850/50 transition-colors"
              >
                {/* List Row */}
                <div
                  onClick={() => {
                    if (onSelectSignForVoiceToSign) {
                      onSelectSignForVoiceToSign(sign.label);
                    }
                  }}
                  className="p-3.5 sm:p-4 cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  {/* Left Column: Sign Name, Swahili, English, Context */}
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-center text-teal-400 shrink-0 mt-0.5">
                      <BookOpen className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm text-white font-mono">
                          {sign.label}
                        </span>
                        <span className="text-xs font-semibold text-teal-400 bg-teal-950/60 border border-teal-800/40 px-2 py-0.5 rounded-md">
                          {sign.swahili}
                        </span>
                        <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-800 text-slate-400 border border-slate-700">
                          {sign.category}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 mt-1 leading-snug">
                        {sign.english}
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        <span className="text-slate-400 font-medium">Context:</span> {sign.clinicalContext}
                      </p>
                    </div>
                  </div>

                  {/* Right Column: Actions (How, Help, Voice to Sign) */}
                  <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
                    {/* HOW Button (Toggle Written Instructions) */}
                    <button
                      type="button"
                      onClick={(e) => toggleHow(sign.id, e)}
                      className={`text-xs px-2.5 py-1.5 rounded-xl border flex items-center gap-1 font-semibold transition-colors ${
                        isHowOpen
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                          : 'bg-slate-950 text-slate-300 hover:text-white border-slate-800 hover:border-slate-700'
                      }`}
                      title="Read written instructions on how to physically perform this sign"
                    >
                      <FileText className="w-3.5 h-3.5 text-amber-400" />
                      <span>How</span>
                      {isHowOpen ? (
                        <ChevronUp className="w-3 h-3 ml-0.5" />
                      ) : (
                        <ChevronDown className="w-3 h-3 ml-0.5" />
                      )}
                    </button>

                    {/* HELP Button (Jumps to 3D VRM to show how to do it) */}
                    {onSelectSignForVRM && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectSignForVRM(sign.id);
                        }}
                        className="text-xs px-3 py-1.5 rounded-xl bg-teal-500/15 hover:bg-teal-500/25 text-teal-300 border border-teal-500/40 font-semibold flex items-center gap-1.5 transition-colors"
                        title="Jump to 3D Training Model to show how to do it"
                      >
                        <HelpCircle className="w-3.5 h-3.5 text-teal-400" />
                        <span>Help</span>
                      </button>
                    )}

                    {/* Voice to Sign Button */}
                    {onSelectSignForVoiceToSign && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectSignForVoiceToSign(sign.label);
                        }}
                        className="text-xs px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5 font-medium transition-colors"
                        title="Translate in Voice to Sign"
                      >
                        <Mic className="w-3.5 h-3.5 text-cyan-400" />
                        <span className="hidden sm:inline">Voice to Sign</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Inline "How to Perform" Written Step-by-Step Instructions */}
                {isHowOpen && (
                  <div className="px-4 pb-4 pt-1 bg-slate-950/80 border-t border-amber-500/20 text-xs space-y-2.5 animate-in fade-in">
                    <div className="flex items-center gap-2 text-amber-300 font-bold pt-1">
                      <FileText className="w-3.5 h-3.5 text-amber-400" />
                      <span>Written Execution Steps for "{sign.label}" ({sign.swahili}):</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-slate-300">
                      <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800 space-y-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-teal-400 block">
                          Handshape & Physical Movement
                        </span>
                        <p className="leading-relaxed text-slate-200">{sign.instruction}</p>
                        <p className="text-[11px] text-slate-400 pt-1">{sign.description}</p>
                      </div>

                      <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800 space-y-1.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 block">
                          Finger Geometry Configuration
                        </span>
                        <div className="flex items-center gap-2 font-mono text-[11px] flex-wrap">
                          <span className="bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                            Thumb: <strong className="text-teal-300">{sign.fingerStateHint.thumb}</strong>
                          </span>
                          <span className="bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                            Index: <strong className="text-teal-300">{sign.fingerStateHint.index}</strong>
                          </span>
                          <span className="bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                            Middle: <strong className="text-teal-300">{sign.fingerStateHint.middle}</strong>
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 pt-0.5">
                          <span>Clinical Usage: {sign.clinicalContext}</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-1 flex items-center justify-between text-[11px] text-slate-400">
                      <span>KNAD Medical Triage Curriculum · Validated Kinematic Configuration</span>
                      {onSelectSignForVRM && (
                        <button
                          type="button"
                          onClick={() => onSelectSignForVRM(sign.id)}
                          className="text-teal-400 hover:text-teal-300 font-bold underline flex items-center gap-1"
                        >
                          <Layers className="w-3.5 h-3.5" />
                          <span>Show on 3D avatar &rarr;</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
