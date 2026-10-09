/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Activity,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Database,
  FileJson,
  FileText,
  Info,
  Layers,
  Pause,
  Play,
  RotateCcw,
  Search,
  Upload,
  Volume2,
} from 'lucide-react';
import { MVP_SIGNS, SIGN_VOCABULARY, SignVocabularyItem } from '../signs';
import { SignRecording } from '../types/vrmSign';
import { InterpolatedSignPose } from '../services/vrmBoneMapper';
import { VRMAvatarReplayScene } from './VRMAvatarReplayScene';
import { audioCommService } from '../services/ttsService';
import { DatasetStudio } from './DatasetStudio';
import { signClassifier } from '../services/signClassifier';

interface VRMSignPlayerProps {
  initialSignId?: string;
}

export const VRMSignPlayer: React.FC<VRMSignPlayerProps> = ({ initialSignId }) => {
  // Sub-tabs in Training Model UI: 3D Motion Player vs KSL Dataset Datasheet
  const [trainingSubTab, setTrainingSubTab] = useState<'simulator' | 'dataset'>('simulator');

  // Currently active sign recording
  const [activeSignId, setActiveSignId] = useState<string>(initialSignId || 'hello');
  const [currentRecording, setCurrentRecording] = useState<SignRecording>(() => {
    return (initialSignId && MVP_SIGNS[initialSignId]) || MVP_SIGNS.hello;
  });
  const [customLibrary, setCustomLibrary] = useState<Record<string, SignRecording>>({});
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'medical' | 'essential' | 'greeting' | 'response'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedHowId, setExpandedHowId] = useState<string | null>(null);

  // Playback engine state
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [playbackTimeMs, setPlaybackTimeMs] = useState<number>(0);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [isLooping, setIsLooping] = useState<boolean>(true);
  const [speakingLanguage, setSpeakingLanguage] = useState<'sw' | 'en' | null>(null);

  // Inspector & Telemetry state
  const [showInspector, setShowInspector] = useState<boolean>(false);
  const [livePose, setLivePose] = useState<InterpolatedSignPose | null>(null);
  const [vrmLoadedName, setVrmLoadedName] = useState<string>('Standard VRM 1.0 Humanoid');
  const [jsonViewerSign, setJsonViewerSign] = useState<SignRecording | null>(null);
  const [datasetCount, setDatasetCount] = useState<number>(() => signClassifier.getDataset().length);

  const lastWallTimeRef = useRef<number | null>(null);

  // Sync when initialSignId prop changes from parent
  useEffect(() => {
    if (initialSignId && MVP_SIGNS[initialSignId]) {
      setActiveSignId(initialSignId);
      setCurrentRecording(MVP_SIGNS[initialSignId]);
      setPlaybackTimeMs(0);
      setIsPlaying(true);
      lastWallTimeRef.current = performance.now();
    }
  }, [initialSignId]);

  const activeVocabItem = useMemo(() => {
    return SIGN_VOCABULARY.find((item) => item.id === activeSignId) || {
      id: activeSignId,
      word: currentRecording.word,
      label: currentRecording.word.toUpperCase(),
      kslGloss: currentRecording.word.toUpperCase(),
      category: 'essential' as const,
      swahili: currentRecording.description || '',
      english: currentRecording.description || '',
      description: currentRecording.description || '',
      data: currentRecording,
    };
  }, [activeSignId, currentRecording]);

  const filteredVocabulary = useMemo(() => {
    return SIGN_VOCABULARY.filter((item) => {
      const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
      const matchesSearch =
        searchQuery.trim() === '' ||
        item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.swahili.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.english.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [categoryFilter, searchQuery]);

  // Sign Selection Handler (Click sign in list -> Avatar performs sign)
  const handleSelectSign = (signId: string, recordingData?: SignRecording) => {
    setActiveSignId(signId);
    const data = recordingData || customLibrary[signId] || MVP_SIGNS[signId];
    if (data) {
      setCurrentRecording(data);
      setPlaybackTimeMs(0);
      setIsPlaying(true);
      lastWallTimeRef.current = performance.now();
    }
  };

  // Master Clock & Playback Loop
  useEffect(() => {
    let handle: number;

    const tick = (now: number) => {
      if (lastWallTimeRef.current === null) {
        lastWallTimeRef.current = now;
      }
      const wallDeltaMs = now - lastWallTimeRef.current;
      lastWallTimeRef.current = now;

      if (isPlaying) {
        const effectiveDuration = currentRecording.durationMs || 1500;
        setPlaybackTimeMs((prev) => {
          const next = prev + wallDeltaMs * playbackSpeed;
          if (next >= effectiveDuration) {
            if (isLooping) {
              return 0;
            } else {
              setIsPlaying(false);
              return effectiveDuration;
            }
          }
          return next;
        });
      }

      handle = requestAnimationFrame(tick);
    };

    handle = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(handle);
  }, [isPlaying, playbackSpeed, isLooping, currentRecording.durationMs]);

  // Scrub slider change
  const handleScrub = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setPlaybackTimeMs(val);
    lastWallTimeRef.current = performance.now();
  };

  // Speech TTS trigger
  const handleSpeakSign = (lang: 'sw' | 'en') => {
    setSpeakingLanguage(lang);
    const textToSpeak = lang === 'sw' ? activeVocabItem.swahili : activeVocabItem.english;
    const langCode = lang === 'sw' ? 'sw-KE' : 'en-US';
    audioCommService.speak(textToSpeak, langCode, () => {
      setSpeakingLanguage(null);
    });
  };

  // Custom Sign JSON Upload
  const handleImportSignJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.frames && Array.isArray(parsed.frames)) {
          const word = parsed.word || file.name.replace('.json', '');
          const id = `custom_${Date.now()}`;
          const newRecording: SignRecording = {
            word,
            durationMs: parsed.durationMs || 1500,
            frames: parsed.frames,
            description: parsed.description || `Custom sign sequence for ${word}`,
          };
          setCustomLibrary((prev) => ({ ...prev, [id]: newRecording }));
          handleSelectSign(id, newRecording);
        }
      } catch (err) {
        alert('Invalid Sign JSON format.');
      }
    };
    reader.readAsText(file);
  };

  const duration = currentRecording.durationMs || 1500;
  const progressRatio = Math.min(1, Math.max(0, playbackTimeMs / duration));

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-950 text-slate-100 flex flex-col py-6 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-7xl mx-auto space-y-6">
        {/* Main Header & Sub-Tab Switcher */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-teal-500/15 text-teal-300 border border-teal-500/30">
                Training Model
              </span>
              <span className="text-xs text-slate-400">
                3D Humanoid Kinematics & Kenyan Sign Language Corpus
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              Training Model: 3D Sign Avatar & Kinematics
            </h1>
            <p className="text-xs text-slate-400 max-w-2xl mt-1 leading-relaxed">
              3D humanoid kinematic engine mapping 21 hand and 33 pose landmark coordinates to an articulated VRM avatar, combined with the full Kenyan Sign Language (KSL) datasheet.
            </p>
          </div>

          {/* Sub-Tabs: Motion Simulator vs KSL Dataset Datasheet */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-950 rounded-xl border border-slate-800 self-start md:self-center shrink-0">
            <button
              onClick={() => setTrainingSubTab('simulator')}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
                trainingSubTab === 'simulator'
                  ? 'bg-teal-500 text-slate-950 font-bold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>3D Sign Avatar</span>
            </button>

            <button
              onClick={() => setTrainingSubTab('dataset')}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
                trainingSubTab === 'dataset'
                  ? 'bg-teal-500 text-slate-950 font-bold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Database className="w-3.5 h-3.5" />
              <span>KSL Datasheet</span>
            </button>
          </div>
        </div>

        {/* VIEW 1: 3D Motion Simulator with Clean Structured List */}
        {trainingSubTab === 'simulator' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left 5 Cols: Clean Searchable Sign List View */}
            <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div>
                  <h3 className="font-bold text-sm text-white flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-teal-400" />
                    <span>Vocabulary List</span>
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Select a sign to play or toggle written execution details
                  </p>
                </div>

                <label className="cursor-pointer bg-slate-950 hover:bg-slate-800 text-slate-300 text-[11px] px-2.5 py-1.5 rounded-lg border border-slate-800 flex items-center gap-1 transition-colors">
                  <Upload className="w-3 h-3 text-teal-400" />
                  <span>Import</span>
                  <input type="file" accept=".json" onChange={handleImportSignJSON} className="hidden" />
                </label>
              </div>

              {/* Filter & Search Bar */}
              <div className="space-y-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search sign by name or Swahili..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-teal-500"
                  />
                </div>

                {/* Category Pills */}
                <div className="flex items-center gap-1 overflow-x-auto pb-1 text-[11px]">
                  {[
                    { id: 'all', label: 'All' },
                    { id: 'medical', label: 'Medical' },
                    { id: 'essential', label: 'Essential' },
                    { id: 'greeting', label: 'Greetings' },
                    { id: 'response', label: 'Responses' },
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setCategoryFilter(cat.id as any)}
                      className={`px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition-colors ${
                        categoryFilter === cat.id
                          ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40'
                          : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Structured Scrollable List */}
              <div className="space-y-1.5 max-h-[500px] overflow-y-auto pr-1">
                {filteredVocabulary.map((item) => {
                  const isSelected = activeSignId === item.id;
                  const isHowOpen = expandedHowId === item.id;

                  return (
                    <div
                      key={item.id}
                      className={`rounded-xl border transition-all ${
                        isSelected
                          ? 'bg-teal-500/10 border-teal-500/50 shadow-sm'
                          : 'bg-slate-950/60 border-slate-800/80 hover:bg-slate-800/50'
                      }`}
                    >
                      <div
                        onClick={() => handleSelectSign(item.id)}
                        className="p-3 cursor-pointer flex items-center justify-between gap-3"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-white font-mono">
                              {item.label}
                            </span>
                            <span className="text-[10px] text-teal-300 font-medium">
                              ({item.swahili})
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-400 truncate block mt-0.5">
                            {item.english}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[10px] font-mono text-slate-500 px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800">
                            {(item.data.durationMs / 1000).toFixed(1)}s
                          </span>

                          {/* How to Perform Button */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setExpandedHowId(isHowOpen ? null : item.id);
                            }}
                            className={`text-[10px] px-2 py-1 rounded-lg border font-semibold flex items-center gap-1 transition-colors ${
                              isHowOpen
                                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                                : 'bg-slate-900 text-slate-300 hover:text-white border-slate-800'
                            }`}
                            title="Read how to physically perform this sign"
                          >
                            <FileText className="w-3 h-3 text-amber-400" />
                            <span>How</span>
                          </button>
                        </div>
                      </div>

                      {/* Expandable "How to Perform" Written Directions */}
                      {isHowOpen && (
                        <div className="px-3 pb-3 pt-1 border-t border-slate-800/60 text-xs bg-slate-950/40 rounded-b-xl space-y-1.5 animate-in fade-in">
                          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-amber-300">
                            <Info className="w-3 h-3" />
                            <span>Physical Execution Instructions:</span>
                          </div>
                          <p className="text-[11px] text-slate-300 leading-relaxed">
                            {item.description}
                          </p>
                          <div className="pt-1 flex items-center justify-between text-[10px] text-slate-500">
                            <span>KSL Standard: {item.category}</span>
                            <span className="text-teal-400 font-semibold cursor-pointer" onClick={() => handleSelectSign(item.id)}>
                              Load animation &rarr;
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right 7 Cols: Spacious 3D Avatar Viewport & Controls */}
            <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col">
              {/* Header Bar */}
              <div className="px-5 py-3.5 border-b border-slate-800 bg-slate-950/70 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-black text-base text-white font-mono">
                      {activeVocabItem.label}
                    </span>
                    <span className="text-xs font-semibold text-teal-400 bg-teal-950/60 border border-teal-800/40 px-2 py-0.5 rounded-full">
                      Swahili: {activeVocabItem.swahili}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">{activeVocabItem.english}</p>
                </div>

                {/* Pronounce Buttons */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleSpeakSign('sw')}
                    className={`text-xs px-2.5 py-1.5 rounded-xl flex items-center gap-1.5 font-medium transition-colors ${
                      speakingLanguage === 'sw'
                        ? 'bg-teal-500 text-slate-950 font-bold'
                        : 'bg-slate-800 hover:bg-slate-700 text-teal-300 border border-teal-500/30'
                    }`}
                    title="Pronounce Swahili"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                    <span>Swahili</span>
                  </button>

                  <button
                    onClick={() => handleSpeakSign('en')}
                    className={`text-xs px-2.5 py-1.5 rounded-xl flex items-center gap-1.5 font-medium transition-colors ${
                      speakingLanguage === 'en'
                        ? 'bg-cyan-500 text-slate-950 font-bold'
                        : 'bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/30'
                    }`}
                    title="Pronounce English"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                    <span>English</span>
                  </button>

                  <button
                    onClick={() => setShowInspector(!showInspector)}
                    className={`text-xs px-2.5 py-1.5 rounded-xl border flex items-center gap-1 transition-colors ${
                      showInspector
                        ? 'bg-teal-500/15 text-teal-300 border-teal-500/40'
                        : 'bg-slate-900 text-slate-400 hover:text-slate-200 border-slate-800'
                    }`}
                    title="Toggle Technical Bone Telemetry"
                  >
                    <Activity className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Telemetry</span>
                  </button>
                </div>
              </div>

              {/* 3D WebGL Viewport */}
              <div className="relative w-full h-[460px] sm:h-[500px] bg-slate-950">
                <VRMAvatarReplayScene
                  currentRecording={currentRecording}
                  playbackTimeMs={playbackTimeMs}
                  isPlaying={isPlaying}
                  onPoseUpdate={(pose) => setLivePose(pose)}
                  onVRMLoaded={(status) => {
                    if (status.name) setVrmLoadedName(status.name);
                  }}
                />

                {/* Subtitle Pill */}
                <div className="absolute bottom-4 inset-x-4 z-10 flex justify-center pointer-events-none">
                  <div className="bg-slate-950/90 border border-teal-500/30 text-slate-200 text-xs px-4 py-2 rounded-full shadow-xl backdrop-blur-md flex items-center gap-2.5 font-medium">
                    <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
                    <span className="text-teal-300 font-bold font-mono">
                      KSL: {activeVocabItem.kslGloss || activeVocabItem.label}
                    </span>
                    <span className="text-slate-500">|</span>
                    <span>{activeVocabItem.swahili}</span>
                    <span className="text-slate-500">|</span>
                    <span className="text-slate-400">{activeVocabItem.english}</span>
                  </div>
                </div>
              </div>

              {/* Player Controls */}
              <div className="p-4 bg-slate-950 border-t border-slate-800/80 space-y-3">
                {/* Scrubber bar */}
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="0"
                    max={duration}
                    step="10"
                    value={playbackTimeMs}
                    onChange={handleScrub}
                    className="flex-1 h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-teal-400"
                  />
                  <span className="text-xs font-mono text-slate-400 shrink-0 w-16 text-right">
                    {(playbackTimeMs / 1000).toFixed(1)}s / {(duration / 1000).toFixed(1)}s
                  </span>
                </div>

                {/* Transport Buttons */}
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setIsPlaying(!isPlaying)}
                      className="px-4 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs sm:text-sm flex items-center gap-1.5 transition-all shadow-md shadow-teal-500/20"
                    >
                      {isPlaying ? (
                        <>
                          <Pause className="w-4 h-4 fill-current" />
                          <span>Pause</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4 fill-current" />
                          <span>Play</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => {
                        setPlaybackTimeMs(0);
                        setIsPlaying(true);
                      }}
                      className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-colors"
                      title="Restart animation"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => setIsLooping(!isLooping)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors ${
                        isLooping
                          ? 'bg-teal-500/15 border-teal-500/30 text-teal-300'
                          : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      {isLooping ? 'Loop: On' : 'Loop: Off'}
                    </button>
                  </div>

                  {/* Speed Buttons */}
                  <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
                    <span className="text-[11px] text-slate-500 px-2">Speed:</span>
                    {[0.5, 0.75, 1.0, 1.25].map((spd) => (
                      <button
                        key={spd}
                        onClick={() => setPlaybackSpeed(spd)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                          playbackSpeed === spd
                            ? 'bg-teal-500 text-slate-950 font-bold'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {spd}x
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Collapsible Telemetry */}
              {showInspector && (
                <div className="p-4 bg-slate-950 border-t border-slate-800 space-y-3 animate-in fade-in text-xs">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <span className="font-semibold text-slate-300">Live Bone Angles & Curl Values</span>
                    <button
                      onClick={() => setJsonViewerSign(currentRecording)}
                      className="bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs px-2.5 py-1 rounded-lg border border-slate-800 flex items-center gap-1"
                    >
                      <FileJson className="w-3.5 h-3.5 text-amber-400" />
                      <span>View Keyframes</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <span className="text-[11px] text-teal-400 font-bold">Right Hand Finger Curl</span>
                      {['Thumb', 'Index', 'Middle', 'Ring', 'Pinky'].map((f, i) => (
                        <div key={f} className="flex justify-between text-[11px] text-slate-400">
                          <span>{f}:</span>
                          <span className="font-mono text-teal-300">
                            {Math.round((livePose?.rightCurls[i] || 0) * 100)}%
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="space-y-1">
                      <span className="text-[11px] text-cyan-400 font-bold">Left Hand Finger Curl</span>
                      {['Thumb', 'Index', 'Middle', 'Ring', 'Pinky'].map((f, i) => (
                        <div key={f} className="flex justify-between text-[11px] text-slate-400">
                          <span>{f}:</span>
                          <span className="font-mono text-cyan-300">
                            {Math.round((livePose?.leftCurls[i] || 0) * 100)}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* VIEW 2: Embedded KSL Dataset & Calibration Datasheet */}
        {trainingSubTab === 'dataset' && (
          <div className="space-y-6">
            <DatasetStudio
              onDatasetUpdated={() => setDatasetCount(signClassifier.getDataset().length)}
              datasetCount={datasetCount}
            />
          </div>
        )}

        {/* JSON Viewer Modal */}
        {jsonViewerSign && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full max-h-[80vh] flex flex-col shadow-2xl">
              <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                <span className="text-sm font-bold text-white font-mono">
                  {jsonViewerSign.word.toUpperCase()} Recording JSON
                </span>
                <button
                  onClick={() => setJsonViewerSign(null)}
                  className="text-xs text-slate-400 hover:text-white px-2 py-1 rounded bg-slate-800"
                >
                  Close
                </button>
              </div>
              <pre className="p-4 text-xs font-mono text-slate-300 overflow-y-auto flex-1 bg-slate-950">
                {JSON.stringify(jsonViewerSign, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
