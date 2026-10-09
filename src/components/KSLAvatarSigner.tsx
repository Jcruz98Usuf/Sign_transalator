/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  AlertCircle,
  BookOpen,
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
  Search,
  Send,
  Sparkles,
  Volume2,
  Zap,
} from 'lucide-react';
import { KSLSignDefinition, KSLKeyframe } from '../types/ksl';
import { KSL_LEXICON, interpolateKeyframe, generateFingerspellSign } from '../services/kslAnimations';
import { audioCommService } from '../services/ttsService';
import { VRMAvatarReplayScene } from './VRMAvatarReplayScene';
import { MVP_SIGNS, SIGN_VOCABULARY } from '../signs';
import { SignRecording } from '../types/vrmSign';

function mapGlossToVrmSign(gloss: string): SignRecording {
  const g = gloss.toUpperCase();
  if (g.includes('PAIN') || g.includes('MAUMIVU')) return MVP_SIGNS.pain;
  if (g.includes('HELP') || g.includes('MSAADA')) return MVP_SIGNS.help;
  if (g.includes('DOCTOR') || g.includes('DAKTARI')) return MVP_SIGNS.doctor;
  if (g.includes('WATER') || g.includes('MAJI')) return MVP_SIGNS.water;
  if (g.includes('MEDICINE') || g.includes('DAWA')) return MVP_SIGNS.medicine;
  if (g.includes('FEVER') || g.includes('HOMA')) return MVP_SIGNS.fever;
  if (g.includes('HOSPITAL') || g.includes('HOSPITALI')) return MVP_SIGNS.hospital;
  if (g.includes('EMERGENCY') || g.includes('DHARURA')) return MVP_SIGNS.emergency;
  if (g.includes('INJECTION') || g.includes('SINDANO')) return MVP_SIGNS.injection;
  if (g.includes('BLOOD') || g.includes('DAMU')) return MVP_SIGNS.blood;
  if (g.includes('STOMACH') || g.includes('TUMBO')) return MVP_SIGNS.stomach;
  if (g.includes('BREATH') || g.includes('KUPUMUA')) return MVP_SIGNS.breathing;
  if (g.includes('EXAMINE') || g.includes('CHUNGUZA')) return MVP_SIGNS.examine;
  if (g.includes('FOOD') || g.includes('CHAKULA')) return MVP_SIGNS.food;
  if (g.includes('SLEEP') || g.includes('USINGIZI')) return MVP_SIGNS.sleep;
  if (g.includes('WHERE') || g.includes('WAPI')) return MVP_SIGNS.where;
  if (g.includes('HEADACHE') || g.includes('KICHWA')) return MVP_SIGNS.headache;
  if (g.includes('YES') || g.includes('NDIYO')) return MVP_SIGNS.yes;
  if (g.includes('NO') || g.includes('HAPANA')) return MVP_SIGNS.no;
  if (g.includes('THANK') || g.includes('ASANTE')) return MVP_SIGNS.thank_you;
  return MVP_SIGNS.hello;
}

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

  const [wordSearch, setWordSearch] = useState<string>('');
  const [wordFilter, setWordFilter] = useState<'all' | 'phrases' | 'vocabulary'>('all');

  // Combined translatable items list
  const translatableItems = useMemo(() => {
    const phrases = [
      { id: 'p1', type: 'phrase' as const, sw: 'Unasikia maumivu wapi?', en: 'Where do you feel pain?', gloss: 'WEWE MAUMIVU WAPI' },
      { id: 'p2', type: 'phrase' as const, sw: 'Daktari anakuja sasa kutoa msaada', en: 'Doctor is coming now to help', gloss: 'DAKTARI KUJA MSAADA' },
      { id: 'p3', type: 'phrase' as const, sw: 'Kunywa maji na dawa hii', en: 'Drink water with this medicine', gloss: 'KUNYWA MAJI DAWA' },
      { id: 'p4', type: 'phrase' as const, sw: 'Je, una homa au joto jingi?', en: 'Do you have a fever or high temp?', gloss: 'WEWE HOMA JOTO JINGI' },
      { id: 'p5', type: 'phrase' as const, sw: 'Tunafanya sindano ya haraka hospitali', en: 'Giving an urgent injection', gloss: 'SINDANO HARAKA HOSPITALI' },
      { id: 'p6', type: 'phrase' as const, sw: 'Kuna maumivu kifuani au tumbo?', en: 'Pain in chest or stomach?', gloss: 'MAUMIVU KIFUA TUMBO' },
    ];

    const vocabWords = SIGN_VOCABULARY.map((v) => ({
      id: v.id,
      type: 'vocabulary' as const,
      sw: v.swahili,
      en: v.english,
      gloss: v.kslGloss || v.label,
    }));

    const combined = [...phrases, ...vocabWords];

    return combined.filter((item) => {
      const matchesFilter =
        wordFilter === 'all' ||
        (wordFilter === 'phrases' && item.type === 'phrase') ||
        (wordFilter === 'vocabulary' && item.type === 'vocabulary');

      const matchesSearch =
        wordSearch.trim() === '' ||
        item.sw.toLowerCase().includes(wordSearch.toLowerCase()) ||
        item.en.toLowerCase().includes(wordSearch.toLowerCase()) ||
        item.gloss.toLowerCase().includes(wordSearch.toLowerCase());

      return matchesFilter && matchesSearch;
    });
  }, [wordFilter, wordSearch]);

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

  // Sync when initialSpeech prop changes (e.g. from Sign Guide or Message Stream)
  useEffect(() => {
    if (initialSpeech && initialSpeech.trim()) {
      setSpeechInput(initialSpeech);
      handleTranslateVoiceToKSL(initialSpeech);
    }
  }, [initialSpeech]);

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

  // Resolve VRM recording for active sign
  const activeVrmRecording: SignRecording = useMemo(() => {
    return mapGlossToVrmSign(currentSign.gloss);
  }, [currentSign.gloss]);

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

  return (
    <div className="space-y-6">
      {/* KSL Header Banner */}
      <div className="bg-gradient-to-r from-teal-950/60 via-slate-900 to-cyan-950/60 border border-teal-500/30 rounded-2xl p-5 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30">
                Voice to Sign (KSL)
              </span>
              <span className="text-xs text-slate-400">
                Lugha ya Ishara ya Kenya (Kenyan Sign Language)
              </span>
            </div>
            <h2 className="text-xl font-extrabold text-slate-100 flex items-center gap-2">
              <span>Interactive KSL Medical Signer</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Kenya
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
        {/* Left 7 Cols: The Animated KSL VRM Avatar */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col">
          {/* Avatar Top Bar */}
          <div className="px-4 py-3 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-teal-400 animate-pulse" />
              <span className="text-xs font-bold text-slate-200 font-mono">
                KSL SIGN: <strong className="text-teal-400">{currentSign.gloss}</strong> ({currentSignIndex + 1}/{kslSequence.length})
              </span>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* VRM Engine Badge */}
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-teal-950/70 border border-teal-800/60 text-teal-300 text-[10px] font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-400"></span>
                <span>VRM 1.0 Avatar Signer</span>
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
          </div>

          {/* Avatar Rendering Viewport: Pure VRM Engine */}
          <div className="relative w-full h-[460px] bg-slate-950">
            <VRMAvatarReplayScene
              currentRecording={activeVrmRecording}
              playbackTimeMs={currentProgress * (activeVrmRecording.durationMs || 1500)}
              isPlaying={isPlaying}
            />

            {/* Movement Action Subtitle Floating Pill */}
            <div className="absolute bottom-4 inset-x-6 z-10 flex justify-center pointer-events-none">
              <div className="bg-slate-950/90 border border-teal-500/40 text-teal-200 text-xs px-3.5 py-1.5 rounded-full shadow-xl backdrop-blur-md flex items-center gap-2 font-medium">
                <Zap className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                <span>{currentSign.swahili} — {currentSign.english}</span>
              </div>
            </div>
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
                <span>Clinician Speech Input</span>
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

            {/* Clean Compact List of Words and Phrases That Can Be Translated */}
            <div className="pt-3 border-t border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-teal-400" />
                  <span>Translatable Words & Phrases ({translatableItems.length}):</span>
                </span>
                <div className="flex items-center gap-1 text-[10px]">
                  {(['all', 'phrases', 'vocabulary'] as const).map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setWordFilter(filter)}
                      className={`px-2 py-0.5 rounded capitalize font-medium transition-colors ${
                        wordFilter === filter
                          ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {filter}
                    </button>
                  ))}
                </div>
              </div>

              {/* Search box for words */}
              <div className="relative">
                <Search className="w-3 h-3 text-slate-500 absolute left-2.5 top-2" />
                <input
                  type="text"
                  value={wordSearch}
                  onChange={(e) => setWordSearch(e.target.value)}
                  placeholder="Filter translatable words or phrases..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-7 pr-2.5 py-1 text-[11px] text-slate-200 placeholder-slate-500 focus:outline-none focus:border-teal-500"
                />
              </div>

              {/* Compact List */}
              <div className="space-y-1 max-h-52 overflow-y-auto pr-1">
                {translatableItems.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => {
                      setSpeechInput(item.sw);
                      handleTranslateVoiceToKSL(item.sw);
                    }}
                    className="p-2 rounded-lg bg-slate-950/60 border border-slate-800/80 hover:border-teal-500/40 hover:bg-slate-800/60 cursor-pointer text-xs transition-all flex items-center justify-between gap-2 group"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-teal-300 text-xs truncate">
                          {item.sw}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono shrink-0">
                          [{item.gloss}]
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 truncate block">
                        {item.en}
                      </span>
                    </div>

                    <button
                      type="button"
                      className="text-[10px] font-medium text-slate-400 group-hover:text-teal-300 bg-slate-900 group-hover:bg-slate-800 px-2 py-0.5 rounded border border-slate-800 shrink-0 transition-colors"
                    >
                      Translate &rarr;
                    </button>
                  </div>
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
