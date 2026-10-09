/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { SignCameraView } from './components/SignCameraView';
import { UnifiedMessageStream } from './components/UnifiedMessageStream';
import { DatasetStudio } from './components/DatasetStudio';
import { SignGuideModal } from './components/SignGuideModal';
import { ArchitectureModal } from './components/ArchitectureModal';
import { KSLAvatarSigner } from './components/KSLAvatarSigner';
import { VRMSignPlayer } from './components/VRMSignPlayer';
import { LandmarkPoint, UnifiedMessage } from './types/sign';
import { signClassifier } from './services/signClassifier';
import { mediaPipeService } from './services/mediapipeService';
import { vrmPreloader } from './services/vrmPreloader';
import confetti from 'canvas-confetti';

export default function App() {
  const [activeTab, setActiveTab] = useState<'vrm' | 'stream' | 'ksl' | 'studio' | 'guide' | 'architecture'>('vrm');
  const [targetLanguage, setTargetLanguage] = useState<string>('English (US)');
  const [tokenBuffer, setTokenBuffer] = useState<string[]>([]);
  const [datasetCount, setDatasetCount] = useState<number>(() => signClassifier.getDataset().length);
  const [isSynthesizing, setIsSynthesizing] = useState<boolean>(false);
  const [mediaPipeReady, setMediaPipeReady] = useState<boolean>(false);
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [kslInitialSpeech, setKslInitialSpeech] = useState<string>('Unasikia maumivu wapi?');
  const [selectedVrmSignId, setSelectedVrmSignId] = useState<string>('hello');

  // Initial welcome dialogue
  const [messages, setMessages] = useState<UnifiedMessage[]>([
    {
      id: 'init-1',
      sender: 'doctor',
      modality: 'voice',
      rawContent: 'Hello, I am Dr. Chen. How are you feeling right now?',
      synthesizedText: 'Hello, I am Dr. Chen. How are you feeling right now?',
      translatedText: 'Hello, I am Dr. Chen. How are you feeling right now?',
      targetLanguage: 'English (US)',
      timestamp: '10:00 AM',
      urgency: 'ROUTINE',
      actionRecommendation: 'Initial patient intake check.',
    },
    {
      id: 'init-2',
      sender: 'patient',
      modality: 'sign',
      rawContent: 'HELP PAIN MEDICINE',
      synthesizedText: 'Patient signs: "I need help with my pain medication."',
      translatedText: 'I need help with my pain medication.',
      targetLanguage: 'English (US)',
      timestamp: '10:01 AM',
      urgency: 'URGENT',
      actionRecommendation: 'Assess pain level (1-10) and verify analgesia schedule.',
    },
  ]);

  // Preload VRM 3D Avatar in background immediately on app start
  useEffect(() => {
    vrmPreloader.getVRMBuffer().catch(() => {});
  }, []);

  // Check MediaPipe ready status
  useEffect(() => {
    const checkInterval = setInterval(() => {
      const status = mediaPipeService.getStatus();
      setMediaPipeReady(status.isLoaded);
    }, 800);
    return () => clearInterval(checkInterval);
  }, []);

  // Update dataset count
  const handleDatasetUpdated = () => {
    setDatasetCount(signClassifier.getDataset().length);
  };

  // When a sign token is committed from camera or simulation
  const handleCommitSign = (signLabel: string) => {
    setTokenBuffer((prev) => [...prev, signLabel.toUpperCase()]);
  };

  // Record landmark sample into dataset (Step 2)
  const handleRecordLandmarks = (label: string, landmarks: LandmarkPoint[]) => {
    signClassifier.addSample(label, landmarks);
    handleDatasetUpdated();
    confetti({
      particleCount: 25,
      spread: 40,
      origin: { y: 0.7 },
      colors: ['#14b8a6', '#06b6d4', '#3b82f6'],
    });
  };

  // Send message through the Unified Message Layer (Step 5)
  const handleSendMessage = async (
    sender: 'patient' | 'doctor',
    modality: 'sign' | 'voice' | 'text',
    rawContent: string
  ) => {
    const newMsgId = `msg_${Date.now()}`;
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Always route through clinical synthesis to generate Swahili, English, and KSL Sign representations
    setIsSynthesizing(true);
    try {
      const res = await fetch('/api/refine-signs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          signs: rawContent,
          targetLanguage,
          role: sender,
        }),
      });

      if (!res.ok) throw new Error('API server returned error');
      const data = await res.json();

      const newMsg: UnifiedMessage = {
        id: newMsgId,
        sender,
        modality,
        rawContent,
        kslGloss: data.kslGloss || rawContent.toUpperCase(),
        swahiliText: data.swahiliText || rawContent,
        englishText: data.englishText || rawContent,
        isFallback: data.isFallback || !data.isDirectlyTranslatable,
        fallbackExplanation: data.fallbackExplanation || '',
        synthesizedText: data.synthesizedText || data.englishText || rawContent,
        translatedText: data.translatedText || data.swahiliText || rawContent,
        targetLanguage,
        timestamp,
        urgency: data.urgency || 'ROUTINE',
        actionRecommendation: data.actionRecommendation,
      };

      setMessages((prev) => [...prev, newMsg]);
    } catch (err) {
      console.warn('Fallback synthesis:', err);
      // Resilient offline fallback with full Swahili & English
      const fallbackMsg: UnifiedMessage = {
        id: newMsgId,
        sender,
        modality,
        rawContent,
        kslGloss: rawContent.toUpperCase(),
        swahiliText: modality === 'sign' ? `Mgonjwa anaashiria: "${rawContent}"` : rawContent,
        englishText: modality === 'sign' ? `Patient signs: "${rawContent}"` : rawContent,
        isFallback: false,
        fallbackExplanation: '',
        synthesizedText: modality === 'sign' ? `Patient signs: "${rawContent}"` : rawContent,
        translatedText: rawContent,
        targetLanguage,
        timestamp,
        urgency: /emergency|pain|help|dharura|maumivu|msaada/i.test(rawContent) ? 'URGENT' : 'ROUTINE',
        actionRecommendation: 'Tathmini hali ya mgonjwa / Verify patient condition.',
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setIsSynthesizing(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        mediaPipeReady={mediaPipeReady}
        cameraActive={cameraActive}
        datasetCount={datasetCount}
      />

      {/* Main Container */}
      <main className={`flex-1 w-full ${activeTab === 'vrm' ? 'p-0 flex flex-col' : 'max-w-7xl mx-auto p-4 sm:p-6 lg:p-8'}`}>
        {/* Tab 0: Training Model - VRM 3D Kinematics & KSL Dataset */}
        {activeTab === 'vrm' && <VRMSignPlayer initialSignId={selectedVrmSignId} />}

        {/* Tab 1: Live Communication Hub */}
        {activeTab === 'stream' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column: MediaPipe Landmark Camera & Simulator */}
            <div className="lg:col-span-6 space-y-4">
              <SignCameraView
                onCommitSign={handleCommitSign}
                onRecordLandmarks={handleRecordLandmarks}
                targetLanguage={targetLanguage}
              />
            </div>

            {/* Right Column: Unified Clinical Message Stream */}
            <div className="lg:col-span-6">
              <UnifiedMessageStream
                messages={messages}
                tokenBuffer={tokenBuffer}
                setTokenBuffer={setTokenBuffer}
                onSendMessage={handleSendMessage}
                targetLanguage={targetLanguage}
                setTargetLanguage={setTargetLanguage}
                isSynthesizing={isSynthesizing}
                onAnimateInKSL={(text) => {
                  setKslInitialSpeech(text);
                  setActiveTab('ksl');
                }}
              />
            </div>
          </div>
        )}

        {/* Tab: Voice to KSL Animated Avatar Signer */}
        {activeTab === 'ksl' && (
          <KSLAvatarSigner initialSpeech={kslInitialSpeech} />
        )}

        {/* Tab 3: Medical Sign Guide with Jump to 3D VRM and Voice to Sign */}
        {activeTab === 'guide' && (
          <SignGuideModal
            onSelectSignForVRM={(signId) => {
              setSelectedVrmSignId(signId);
              setActiveTab('vrm');
            }}
            onSelectSignForVoiceToSign={(phrase) => {
              setKslInitialSpeech(phrase);
              setActiveTab('ksl');
            }}
          />
        )}

        {/* Tab 4: System Architecture */}
        {activeTab === 'architecture' && <ArchitectureModal />}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-4 px-6 text-center text-xs text-slate-500">
        <p>
          Language Doctor · Local-First MediaPipe Hand & Pose Landmark Tracking · Gemini Multimodal Clinical Engine · Pocket TTS
        </p>
      </footer>
    </div>
  );
}
