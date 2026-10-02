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
import { LandmarkPoint, UnifiedMessage } from './types/sign';
import { signClassifier } from './services/signClassifier';
import { mediaPipeService } from './services/mediapipeService';
import confetti from 'canvas-confetti';

export default function App() {
  const [activeTab, setActiveTab] = useState<'stream' | 'ksl' | 'studio' | 'guide' | 'architecture'>('stream');
  const [targetLanguage, setTargetLanguage] = useState<string>('English (US)');
  const [tokenBuffer, setTokenBuffer] = useState<string[]>([]);
  const [datasetCount, setDatasetCount] = useState<number>(() => signClassifier.getDataset().length);
  const [isSynthesizing, setIsSynthesizing] = useState<boolean>(false);
  const [mediaPipeReady, setMediaPipeReady] = useState<boolean>(false);
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [kslInitialSpeech, setKslInitialSpeech] = useState<string>('Unasikia maumivu wapi?');

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
    // Already tracked in token buffer or custom handling
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

    // For voice or text in simple cases
    if (modality !== 'sign' && targetLanguage === 'English (US)') {
      const newMsg: UnifiedMessage = {
        id: newMsgId,
        sender,
        modality,
        rawContent,
        synthesizedText: rawContent,
        translatedText: rawContent,
        targetLanguage,
        timestamp,
        urgency: /emergency|severe|chest pain|help/i.test(rawContent) ? 'EMERGENCY' : 'ROUTINE',
      };
      setMessages((prev) => [...prev, newMsg]);
      return;
    }

    // Call server Gemini API for clinical synthesis & multi-language translation
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
        synthesizedText: data.synthesizedText || rawContent,
        translatedText: data.translatedText || rawContent,
        targetLanguage,
        timestamp,
        urgency: data.urgency || 'ROUTINE',
        actionRecommendation: data.actionRecommendation,
      };

      setMessages((prev) => [...prev, newMsg]);
    } catch (err) {
      console.warn('Fallback synthesis:', err);
      // Offline fallback
      const fallbackMsg: UnifiedMessage = {
        id: newMsgId,
        sender,
        modality,
        rawContent,
        synthesizedText: modality === 'sign' ? `Patient signs: "${rawContent}"` : rawContent,
        translatedText: rawContent,
        targetLanguage,
        timestamp,
        urgency: /emergency|pain|help/i.test(rawContent) ? 'URGENT' : 'ROUTINE',
        actionRecommendation: 'Consult patient chart for notes.',
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
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
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

        {/* Tab 2: Dataset Studio & Classifier (Step 2 & 3) */}
        {activeTab === 'studio' && (
          <DatasetStudio
            onDatasetUpdated={handleDatasetUpdated}
            onRequestRecordFromCamera={(label) => {
              setActiveTab('stream');
            }}
            datasetCount={datasetCount}
          />
        )}

        {/* Tab 3: Medical Sign Guide */}
        {activeTab === 'guide' && (
          <SignGuideModal
            onSelectForPractice={(sign) => {
              setActiveTab('stream');
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
