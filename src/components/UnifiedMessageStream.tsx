/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Activity,
  AlertCircle,
  Check,
  ChevronRight,
  FileText,
  Globe,
  Layers,
  Mic,
  MicOff,
  Play,
  RotateCcw,
  Send,
  Sparkles,
  Stethoscope,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { UnifiedMessage } from '../types/sign';
import { QUICK_MEDICAL_PHRASES, SUPPORTED_LANGUAGES } from '../services/signConstants';
import { audioCommService } from '../services/ttsService';

interface UnifiedMessageStreamProps {
  messages: UnifiedMessage[];
  tokenBuffer: string[];
  setTokenBuffer: React.Dispatch<React.SetStateAction<string[]>>;
  onSendMessage: (
    sender: 'patient' | 'doctor',
    modality: 'sign' | 'voice' | 'text',
    rawContent: string
  ) => void;
  targetLanguage: string;
  setTargetLanguage: (lang: string) => void;
  isSynthesizing: boolean;
  onAnimateInKSL?: (text: string) => void;
}

export const UnifiedMessageStream: React.FC<UnifiedMessageStreamProps> = ({
  messages,
  tokenBuffer,
  setTokenBuffer,
  onSendMessage,
  targetLanguage,
  setTargetLanguage,
  isSynthesizing,
  onAnimateInKSL,
}) => {
  const [textInput, setTextInput] = useState('');
  const [activeSender, setActiveSender] = useState<'patient' | 'doctor'>('patient');
  const [isListeningVoice, setIsListeningVoice] = useState(false);
  const [voiceInterim, setVoiceInterim] = useState('');
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);

  const speechRecognizerRef = useRef<any>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll on new message
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isSynthesizing]);

  // Handle Voice Recording
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
            onSendMessage(activeSender, 'voice', transcript);
            setVoiceInterim('');
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
          console.warn('Could not start recognition:', e);
        }
      } else {
        alert('Voice dictation is not supported by your browser engine. You can type or use sign language.');
      }
    }
  };

  // Convert Sign Token Buffer into Message
  const handleSynthesizeSignBuffer = () => {
    if (tokenBuffer.length === 0) return;
    const rawTokens = tokenBuffer.join(' ');
    onSendMessage('patient', 'sign', rawTokens);
    setTokenBuffer([]);
  };

  // Direct Text Send
  const handleSendText = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!textInput.trim()) return;
    onSendMessage(activeSender, 'text', textInput.trim());
    setTextInput('');
  };

  // Play audio TTS in specific language (Swahili or English or Target Language)
  const handlePlayTTS = (msg: UnifiedMessage, langType: 'sw' | 'en' = 'en') => {
    let textToSpeak = '';
    let speechCode = 'en-US';

    if (langType === 'sw') {
      textToSpeak = msg.swahiliText || msg.synthesizedText || msg.rawContent;
      speechCode = 'sw-KE';
    } else {
      textToSpeak = msg.englishText || msg.synthesizedText || msg.rawContent;
      speechCode = 'en-US';
    }

    setSpeakingMessageId(`${msg.id}_${langType}`);
    audioCommService.speak(textToSpeak, speechCode, () => {
      setSpeakingMessageId(null);
    });
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl flex flex-col h-full min-h-[600px]">
      {/* Stream Header */}
      <div className="px-4 py-3 border-b border-slate-800 bg-slate-900/90 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <Globe className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
              <span>Step 5: Unified Clinical Message Stream</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-800 text-teal-300 font-mono">
                Voice · Text · Sign
              </span>
            </h2>
            <p className="text-[11px] text-slate-400">
              Instant medical synthesis, multi-language translation & Pocket TTS
            </p>
          </div>
        </div>

        {/* Target Translation Language Selector */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-slate-400 hidden sm:inline">Translate to:</span>
          <select
            value={targetLanguage}
            onChange={(e) => setTargetLanguage(e.target.value)}
            className="text-xs bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-slate-200 focus:outline-none focus:border-teal-500"
          >
            {SUPPORTED_LANGUAGES.map((lang) => (
              <option key={lang.code} value={lang.name}>
                {lang.flag} {lang.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Active Sign Tokens Staging Area (When Signs are Recognized) */}
      <div className="bg-slate-950/80 border-b border-slate-800/80 px-4 py-2.5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap flex-1">
            <span className="text-xs font-semibold text-teal-300 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-teal-400" />
              <span>Sign Tokens Buffer:</span>
            </span>
            {tokenBuffer.length === 0 ? (
              <span className="text-xs text-slate-500 italic">
                Perform signs in camera or click gestures to accumulate tokens...
              </span>
            ) : (
              tokenBuffer.map((token, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 rounded-md bg-teal-500/20 text-teal-200 border border-teal-500/40 text-xs font-bold font-mono uppercase tracking-wide flex items-center gap-1 shadow-sm"
                >
                  {token}
                </span>
              ))
            )}
          </div>

          {tokenBuffer.length > 0 && (
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setTokenBuffer([])}
                className="p-1 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded transition-colors text-xs"
                title="Clear buffer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleSynthesizeSignBuffer}
                disabled={isSynthesizing}
                className="px-3 py-1 rounded-lg bg-gradient-to-r from-teal-500 to-cyan-500 text-slate-950 font-bold text-xs flex items-center gap-1 shadow hover:opacity-95 transition-opacity disabled:opacity-50"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Send & Synthesize</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Dialogue Stream List */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3.5">
        {messages.length === 0 ? (
          <div className="h-full min-h-[240px] flex flex-col items-center justify-center text-center p-6 text-slate-500">
            <div className="w-12 h-12 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center text-teal-400 mb-2">
              <Stethoscope className="w-6 h-6" />
            </div>
            <p className="text-xs font-medium text-slate-400">No medical dialogue recorded yet.</p>
            <p className="text-[11px] text-slate-500 max-w-xs mt-1">
              Perform a sign, speak into your microphone, or choose a clinical phrase below to begin.
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isPatient = msg.sender === 'patient';
            const isSpeakingThis = speakingMessageId === msg.id;

            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isPatient ? 'items-start' : 'items-end'}`}
              >
                <div
                  className={`max-w-[92%] sm:max-w-[85%] rounded-2xl p-4 shadow-lg border ${
                    isPatient
                      ? 'bg-slate-950/90 border-teal-500/30 rounded-tl-sm'
                      : 'bg-slate-900 border-cyan-500/30 rounded-tr-sm'
                  }`}
                >
                  {/* Message Meta Info */}
                  <div className="flex items-center justify-between gap-3 mb-2 border-b border-slate-800/80 pb-1.5">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                          isPatient
                            ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30'
                            : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                        }`}
                      >
                        {isPatient ? 'Patient' : 'Attending Clinician'}
                      </span>
                      <span className="text-[10px] text-slate-400 flex items-center gap-1 font-medium">
                        {msg.modality === 'sign' && 'Sign Language'}
                        {msg.modality === 'voice' && 'Voice Input'}
                        {msg.modality === 'text' && 'Text Input'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {msg.urgency && (
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                            msg.urgency === 'EMERGENCY'
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse'
                              : msg.urgency === 'URGENT'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                              : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          }`}
                        >
                          {msg.urgency}
                        </span>
                      )}
                      <span className="text-[10px] text-slate-500 font-mono">
                        {msg.timestamp}
                      </span>
                    </div>
                  </div>

                  {/* KSL Sign Gloss Pill */}
                  {(msg.kslGloss || msg.modality === 'sign') && (
                    <div className="text-xs font-mono bg-slate-950/80 px-3 py-1.5 rounded-xl border border-teal-500/30 mb-2 flex items-center justify-between">
                      <span className="text-slate-400 font-sans text-[11px]">KSL Sign Gloss:</span>
                      <span className="text-teal-300 font-bold">{msg.kslGloss || msg.rawContent}</span>
                    </div>
                  )}

                  {/* Trilingual Communication Block: Kiswahili + English */}
                  <div className="space-y-2 mb-2">
                    {/* Swahili Translation */}
                    <div className="bg-slate-900/90 border border-emerald-500/30 rounded-xl p-3">
                      <div className="flex items-center justify-between text-[11px] font-bold text-emerald-400 mb-1">
                        <span className="flex items-center gap-1.5">
                          <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            SW
                          </span>
                          <span>Kiswahili:</span>
                        </span>
                        <button
                          onClick={() => handlePlayTTS(msg, 'sw')}
                          className="hover:text-emerald-300 text-[10px] flex items-center gap-1 bg-emerald-950/40 px-2 py-0.5 rounded-md border border-emerald-800/40"
                        >
                          <Volume2 className="w-3 h-3" />
                          <span>Sikiliza</span>
                        </button>
                      </div>
                      <p className="text-sm font-medium text-slate-100 leading-relaxed">
                        {msg.swahiliText || msg.synthesizedText || msg.rawContent}
                      </p>
                    </div>

                    {/* English Clinical Translation */}
                    <div className="bg-slate-900/90 border border-cyan-500/30 rounded-xl p-3">
                      <div className="flex items-center justify-between text-[11px] font-bold text-cyan-400 mb-1">
                        <span className="flex items-center gap-1.5">
                          <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                            EN
                          </span>
                          <span>English Clinical:</span>
                        </span>
                        <button
                          onClick={() => handlePlayTTS(msg, 'en')}
                          className="hover:text-cyan-300 text-[10px] flex items-center gap-1 bg-cyan-950/40 px-2 py-0.5 rounded-md border border-cyan-800/40"
                        >
                          <Volume2 className="w-3 h-3" />
                          <span>Listen</span>
                        </button>
                      </div>
                      <p className="text-sm font-medium text-slate-200 leading-relaxed">
                        {msg.englishText || msg.synthesizedText || msg.rawContent}
                      </p>
                    </div>
                  </div>

                  {/* Fallback Clarification Notice (if not directly translatable) */}
                  {msg.isFallback && (
                    <div className="my-2 p-3 bg-amber-950/40 border border-amber-500/50 rounded-xl space-y-2">
                      <div className="flex items-center gap-2 text-amber-300 font-bold text-xs">
                        <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                        <span>Ishara Inahitaji Ufafanuzi / Clarification Needed</span>
                      </div>
                      <p className="text-xs text-amber-200/90">
                        {msg.fallbackExplanation || 'Ishara haikutambulika moja kwa moja. Tafadhali chagua dalili iliyo karibu au taja sehemu ya maumivu:'}
                      </p>
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {[
                          { label: 'Maumivu (Pain)', text: 'MAUMIVU' },
                          { label: 'Dawa (Medicine)', text: 'DAWA' },
                          { label: 'Daktari (Doctor)', text: 'DAKTARI' },
                          { label: 'Msaada (Help)', text: 'MSAADA' },
                          { label: 'Tumbo (Stomach)', text: 'TUMBO' },
                          { label: 'Kupumua (Breathing)', text: 'KUPUMUA' },
                          { label: 'Dharura (Emergency)', text: 'DHARURA' },
                        ].map((chip) => (
                          <button
                            key={chip.text}
                            onClick={() => onSendMessage('patient', 'sign', chip.text)}
                            className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-[11px] font-semibold transition-colors"
                          >
                            + {chip.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Additional Foreign Target Language (if selected and not EN/SW) */}
                  {msg.translatedText &&
                    msg.targetLanguage !== 'English (US)' &&
                    msg.targetLanguage !== 'Kiswahili (Kenya)' && (
                      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 my-2">
                        <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                          <span className="flex items-center gap-1 font-semibold">
                            <Globe className="w-3 h-3 text-cyan-400" />
                            <span>Additional Translation ({msg.targetLanguage}):</span>
                          </span>
                        </div>
                        <p className="text-xs text-cyan-100 font-medium leading-relaxed">
                          {msg.translatedText}
                        </p>
                      </div>
                    )}

                  {/* Clinical Recommendation Badge (from Gemini) */}
                  {msg.actionRecommendation && (
                    <div className="mt-2 text-xs text-amber-300/90 bg-amber-950/30 border border-amber-800/40 rounded-xl px-3 py-2 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
                      <span>{msg.actionRecommendation}</span>
                    </div>
                  )}

                  {/* Action Bar: VRM Signer Trigger */}
                  <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      {onAnimateInKSL && (
                        <button
                          onClick={() => onAnimateInKSL(msg.swahiliText || msg.englishText || msg.rawContent)}
                          className="text-xs px-3 py-1.5 rounded-xl flex items-center gap-1.5 bg-teal-500/15 hover:bg-teal-500/25 text-teal-300 border border-teal-500/40 font-medium transition-colors"
                          title="Animate this message on 3D VRM Sign Avatar"
                        >
                          <Layers className="w-3.5 h-3.5 text-teal-400" />
                          <span>View on 3D Avatar</span>
                        </button>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono">
                      Swahili · English · KSL
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}

        {/* Synthesizing Indicator */}
        {isSynthesizing && (
          <div className="flex items-center gap-2 text-xs text-teal-400 bg-teal-950/30 border border-teal-800/40 p-3 rounded-xl animate-pulse">
            <Activity className="w-4 h-4 animate-spin text-teal-300" />
            <span>Processing and translating clinical dialogue...</span>
          </div>
        )}

        {/* Interim Voice Dictation Display */}
        {isListeningVoice && voiceInterim && (
          <div className="text-xs italic text-cyan-300 bg-cyan-950/30 border border-cyan-800/40 p-2.5 rounded-xl flex items-center gap-2">
            <Mic className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span>Transcribing voice: "{voiceInterim}..."</span>
          </div>
        )}
      </div>

      {/* Quick Medical Phrase Chips */}
      <div className="px-4 py-2 border-t border-slate-800/80 bg-slate-950/60 overflow-x-auto">
        <div className="flex items-center gap-1.5 text-xs whitespace-nowrap">
          <span className="text-[11px] text-slate-400 font-semibold mr-1">Quick Clinical:</span>
          {QUICK_MEDICAL_PHRASES.map((item, idx) => (
            <button
              key={idx}
              onClick={() => onSendMessage(item.sender, 'text', item.text)}
              className="text-[11px] px-2.5 py-1 rounded-full bg-slate-800/80 hover:bg-slate-700 border border-slate-700/80 text-slate-300 hover:text-teal-200 transition-colors"
            >
              {item.text}
            </button>
          ))}
        </div>
      </div>

      {/* Input Composer (Voice & Text) */}
      <div className="p-3 border-t border-slate-800 bg-slate-900">
        <form onSubmit={handleSendText} className="flex items-center gap-2">
          {/* Sender Role Toggle */}
          <button
            type="button"
            onClick={() => setActiveSender(activeSender === 'patient' ? 'doctor' : 'patient')}
            className={`text-xs px-2.5 py-2 rounded-xl font-bold uppercase transition-all border shrink-0 ${
              activeSender === 'patient'
                ? 'bg-teal-500/20 border-teal-500/40 text-teal-300'
                : 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300'
            }`}
            title="Click to switch sender role"
          >
            {activeSender === 'patient' ? 'Patient' : 'Doctor'}
          </button>

          {/* Voice Mic Button */}
          <button
            type="button"
            onClick={toggleVoiceRecording}
            className={`p-2.5 rounded-xl transition-all shrink-0 border ${
              isListeningVoice
                ? 'bg-rose-500 text-white border-rose-400 shadow-lg shadow-rose-500/30 animate-pulse'
                : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300'
            }`}
            title={isListeningVoice ? 'Stop recording voice' : 'Dictate with Voice'}
          >
            {isListeningVoice ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>

          {/* Text Input Field */}
          <input
            type="text"
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            placeholder={`Type ${activeSender} message...`}
            className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-teal-500"
          />

          {/* Send Button */}
          <button
            type="submit"
            disabled={!textInput.trim()}
            className="p-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 text-slate-950 font-bold shrink-0 disabled:opacity-40 transition-opacity shadow"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
