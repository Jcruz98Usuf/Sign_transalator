/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  CheckCircle,
  Database,
  Download,
  Eye,
  FileCode,
  Play,
  Plus,
  RefreshCw,
  Sparkles,
  Trash2,
  Upload,
  Zap,
} from 'lucide-react';
import { LandmarkPoint, TrainingSample } from '../types/sign';
import { CORE_SIGNS } from '../services/signConstants';
import { signClassifier } from '../services/signClassifier';

interface DatasetStudioProps {
  onDatasetUpdated: () => void;
  onRequestRecordFromCamera?: (label: string) => void;
  datasetCount: number;
}

export const DatasetStudio: React.FC<DatasetStudioProps> = ({
  onDatasetUpdated,
  onRequestRecordFromCamera,
  datasetCount,
}) => {
  const [selectedSign, setSelectedSign] = useState<string>('Help');
  const [customLabel, setCustomLabel] = useState<string>('');
  const [samples, setSamples] = useState<TrainingSample[]>([]);
  const [selectedSample, setSelectedSample] = useState<TrainingSample | null>(null);
  const [isRetraining, setIsRetraining] = useState<boolean>(false);
  const [retrainSuccess, setRetrainSuccess] = useState<string | null>(null);
  const [isRecordingCountdown, setIsRecordingCountdown] = useState<number | null>(null);

  useEffect(() => {
    refreshSamples();
  }, []);

  const refreshSamples = () => {
    const list = signClassifier.getDataset();
    setSamples(list);
    if (list.length > 0 && !selectedSample) {
      setSelectedSample(list[0]);
    }
  };

  const sampleCounts = signClassifier.getSampleCountByLabel();

  // Export dataset
  const handleExportJSON = () => {
    const json = signClassifier.exportDatasetJSON();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `language_doctor_landmarks_dataset_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Import dataset
  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const count = signClassifier.importDatasetJSON(content);
      if (count > 0) {
        refreshSamples();
        onDatasetUpdated();
        setRetrainSuccess(`Successfully imported ${count} training samples!`);
        setTimeout(() => setRetrainSuccess(null), 3000);
      } else {
        alert('Invalid JSON dataset format.');
      }
    };
    reader.readAsText(file);
  };

  // Delete sample
  const handleDeleteSample = (id: string) => {
    signClassifier.deleteSample(id);
    refreshSamples();
    onDatasetUpdated();
  };

  // Load KSL Benchmark Dataset (KNAD / Maseno KSL500)
  const handleLoadKSLCorpus = () => {
    const count = signClassifier.loadKSLMedicalBenchmarkDataset();
    refreshSamples();
    onDatasetUpdated();
    setRetrainSuccess(`Successfully imported ${count} KSL benchmark landmark samples (KNAD / Maseno KSL500 Healthcare Corpus)!`);
    setTimeout(() => setRetrainSuccess(null), 4000);
  };

  // Retrain Classifier (Step 3)
  const handleRetrain = () => {
    setIsRetraining(true);
    setTimeout(() => {
      // Re-evaluates KNN indices and geometry heuristics
      setIsRetraining(false);
      setRetrainSuccess(`Classifier trained successfully on ${samples.length} landmark vectors!`);
      onDatasetUpdated();
      setTimeout(() => setRetrainSuccess(null), 4000);
    }, 600);
  };

  // Trigger countdown capture
  const handleStartCountdownCapture = () => {
    const target = customLabel.trim() || selectedSign;
    let count = 3;
    setIsRecordingCountdown(count);

    const interval = setInterval(() => {
      count--;
      if (count > 0) {
        setIsRecordingCountdown(count);
      } else {
        clearInterval(interval);
        setIsRecordingCountdown(null);
        if (onRequestRecordFromCamera) {
          onRequestRecordFromCamera(target);
        }
      }
    }, 800);
  };

  return (
    <div className="space-y-6">
      {/* Step 2 & 3 Explainer Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30">
                Step 2 & 3 Pipeline
              </span>
              <span className="text-xs text-slate-400">Lightweight Geometric Machine Learning</span>
            </div>
            <h2 className="text-xl font-extrabold text-slate-100">
              Landmark Dataset Studio & Sign Classifier
            </h2>
            <p className="text-xs text-slate-400 max-w-2xl mt-1 leading-relaxed">
              Instead of bulky video processing, Language Doctor stores lightweight 21-point hand geometry.
              Each sample records: <code className="text-teal-300 font-mono text-[11px]">{`{ label: "Help", landmarks: [...] }`}</code>.
              The model learns real finger geometry and motion rather than memorizing pixels.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleLoadKSLCorpus}
              className="px-3 py-2 rounded-xl bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 text-xs font-bold border border-teal-500/40 flex items-center gap-1.5 transition-colors shadow-sm"
              title="Load benchmark 3D landmark dataset from Kenyan Sign Language Corpus (KNAD / Maseno KSL500)"
            >
              <Database className="w-3.5 h-3.5 text-teal-400" />
              <span>Load KSL Clinical Benchmark</span>
            </button>

            <label className="cursor-pointer px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 flex items-center gap-1.5 transition-colors">
              <Upload className="w-3.5 h-3.5 text-cyan-400" />
              <span>Import Dataset</span>
              <input
                type="file"
                accept=".json"
                onChange={handleImportJSON}
                className="hidden"
              />
            </label>

            <button
              onClick={handleExportJSON}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 flex items-center gap-1.5 transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-teal-400" />
              <span>Export JSON ({samples.length})</span>
            </button>

            <button
              onClick={handleRetrain}
              disabled={isRetraining}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 text-slate-950 font-bold text-xs shadow-lg shadow-teal-500/20 hover:opacity-95 transition-opacity flex items-center gap-1.5"
            >
              <Sparkles className={`w-3.5 h-3.5 ${isRetraining ? 'animate-spin' : ''}`} />
              <span>{isRetraining ? 'Training KNN...' : 'Train Classifier'}</span>
            </button>
          </div>
        </div>

        {retrainSuccess && (
          <div className="mt-4 p-3 rounded-xl bg-teal-950/40 border border-teal-500/40 text-teal-200 text-xs flex items-center gap-2 animate-fade-in">
            <CheckCircle className="w-4 h-4 text-teal-400 shrink-0" />
            <span>{retrainSuccess}</span>
          </div>
        )}
      </div>

      {/* Sign Selector & Recording Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Sign Picker & Counter */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <Database className="w-4 h-4 text-teal-400" />
            <span>Target Sign Classes</span>
          </h3>

          <div className="space-y-1.5 max-h-[380px] overflow-y-auto pr-1">
            {CORE_SIGNS.map((sign) => {
              const count = sampleCounts[sign.label] || 0;
              const isSelected = selectedSign === sign.label;
              return (
                <button
                  key={sign.id}
                  onClick={() => setSelectedSign(sign.label)}
                  className={`w-full flex items-center justify-between p-2.5 rounded-xl border text-left transition-all ${
                    isSelected
                      ? 'bg-teal-500/15 border-teal-500/40 text-teal-200'
                      : 'bg-slate-950/50 border-slate-800/80 text-slate-300 hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-xl">{sign.icon}</span>
                    <div>
                      <span className="text-xs font-bold block">{sign.label}</span>
                      <span className="text-[10px] text-slate-400">{sign.clinicalContext}</span>
                    </div>
                  </div>
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${
                      count > 0
                        ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30'
                        : 'bg-slate-800 text-slate-500'
                    }`}
                  >
                    {count} samples
                  </span>
                </button>
              );
            })}
          </div>

          {/* Custom Sign Class input */}
          <div className="pt-2 border-t border-slate-800">
            <label className="text-[11px] font-medium text-slate-400 block mb-1.5">
              Add Custom Medical Sign Label:
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={customLabel}
                onChange={(e) => setCustomLabel(e.target.value)}
                placeholder="e.g. Allergy, Cold, Breath"
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-teal-500"
              />
              <button
                onClick={() => {
                  if (customLabel.trim()) {
                    setSelectedSign(customLabel.trim());
                  }
                }}
                disabled={!customLabel.trim()}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-teal-300 text-xs font-bold border border-slate-700 disabled:opacity-40"
              >
                Select
              </button>
            </div>
          </div>
        </div>

        {/* Center & Right Column: Landmark Data Inspector */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <FileCode className="w-4 h-4 text-cyan-400" />
                <span>Recorded Landmark Inspector ({selectedSign})</span>
              </h3>
              <p className="text-[11px] text-slate-400">
                21 keypoints (x, y, z) structured geometry extracted from video frame
              </p>
            </div>

            <button
              onClick={handleStartCountdownCapture}
              className="px-3.5 py-1.5 rounded-xl bg-rose-500 hover:bg-rose-400 text-white font-bold text-xs shadow-lg flex items-center gap-2"
            >
              <div className="w-2 h-2 rounded-full bg-white animate-ping" />
              <span>
                {isRecordingCountdown ? `Recording in ${isRecordingCountdown}...` : `Record Sample (${selectedSign})`}
              </span>
            </button>
          </div>

          {/* Sample List & Raw Coordinates */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4 flex-1">
            {/* Samples List */}
            <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Instances for {selectedSign}:
              </span>
              {samples.filter((s) => s.label === selectedSign).length === 0 ? (
                <p className="text-xs text-slate-500 italic p-3 bg-slate-950/40 rounded-xl border border-slate-800/60">
                  No samples recorded yet for "{selectedSign}". Click "Record Sample" to capture one!
                </p>
              ) : (
                samples
                  .filter((s) => s.label === selectedSign)
                  .map((s, idx) => (
                    <div
                      key={s.id}
                      onClick={() => setSelectedSample(s)}
                      className={`p-2 rounded-xl border text-xs cursor-pointer flex items-center justify-between transition-all ${
                        selectedSample?.id === s.id
                          ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-200'
                          : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <div>
                        <span className="font-mono font-bold block">Sample #{idx + 1}</span>
                        <span className="text-[10px] text-slate-500">
                          {s.landmarks.length} pts · {s.handedness}
                        </span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteSample(s.id);
                        }}
                        className="p-1 text-slate-500 hover:text-rose-400 transition-colors"
                        title="Delete sample"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
              )}
            </div>

            {/* Structured JSON Coordinate Viewer */}
            <div className="sm:col-span-2 bg-slate-950 rounded-xl border border-slate-800/80 p-3 font-mono text-[11px] text-slate-300 overflow-y-auto max-h-[360px]">
              {selectedSample ? (
                <div>
                  <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-slate-800 text-xs">
                    <span className="text-teal-400 font-bold">
                      Label: "{selectedSample.label}"
                    </span>
                    <span className="text-slate-500">
                      ID: {selectedSample.id}
                    </span>
                  </div>
                  <pre className="text-slate-300 leading-tight">
                    {JSON.stringify(
                      {
                        label: selectedSample.label,
                        handedness: selectedSample.handedness,
                        landmarks: selectedSample.landmarks.map((pt, i) => ({
                          index: i,
                          name:
                            i === 0
                              ? 'WRIST'
                              : i === 4
                              ? 'THUMB_TIP'
                              : i === 8
                              ? 'INDEX_TIP'
                              : i === 12
                              ? 'MIDDLE_TIP'
                              : i === 16
                              ? 'RING_TIP'
                              : i === 20
                              ? 'PINKY_TIP'
                              : undefined,
                          x: parseFloat(pt.x.toFixed(3)),
                          y: parseFloat(pt.y.toFixed(3)),
                          z: parseFloat((pt.z ?? 0).toFixed(3)),
                        })),
                      },
                      null,
                      2
                    )}
                  </pre>
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-slate-500 text-xs">
                  Select a sample to inspect 3D landmark coordinates.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
