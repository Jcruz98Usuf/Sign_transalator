/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { VRM, VRMLoaderPlugin, VRMUtils } from '@pixiv/three-vrm';
import { SignRecording } from '../types/vrmSign';
import {
  applyPoseToVRM,
  createInitialSmoothedState,
  InterpolatedSignPose,
  sampleSignSequence,
  SmoothedBoneRotations,
} from '../services/vrmBoneMapper';
import { vrmPreloader } from '../services/vrmPreloader';
import { Camera, Check, Eye, Maximize2, RefreshCw, Sliders, User, Zap } from 'lucide-react';

interface VRMAvatarReplaySceneProps {
  currentRecording: SignRecording;
  playbackTimeMs: number;
  isPlaying: boolean;
  onPoseUpdate?: (pose: InterpolatedSignPose) => void;
  onVRMLoaded?: (status: { loaded: boolean; name?: string; error?: string }) => void;
}

export const VRMAvatarReplayScene: React.FC<VRMAvatarReplaySceneProps> = ({
  currentRecording,
  playbackTimeMs,
  isPlaying,
  onPoseUpdate,
  onVRMLoaded,
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);

  // Three.js instances
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const vrmRef = useRef<VRM | null>(null);
  const smoothedStateRef = useRef<SmoothedBoneRotations>(createInitialSmoothedState());

  // UI & loading state
  const [isLoadingVRM, setIsLoadingVRM] = useState<boolean>(!vrmPreloader.getIsLoaded());
  const [loadProgress, setLoadProgress] = useState<number>(vrmPreloader.getProgress());
  const [loadError, setLoadError] = useState<string | null>(null);
  const [vrmModelName, setVrmModelName] = useState<string>('Standard VRM 1.0 Humanoid');
  const [cameraView, setCameraView] = useState<'chest' | 'hands' | 'threeQuarter'>('chest');
  const [showWireframe, setShowWireframe] = useState<boolean>(false);
  const [contrastTheme, setContrastTheme] = useState<'studio' | 'clinical' | 'dark'>('studio');

  // References to keep requestAnimationFrame updated with latest props without re-binding
  const propsRef = useRef({
    currentRecording,
    playbackTimeMs,
    isPlaying,
    onPoseUpdate,
  });

  useEffect(() => {
    propsRef.current = {
      currentRecording,
      playbackTimeMs,
      isPlaying,
      onPoseUpdate,
    };
  }, [currentRecording, playbackTimeMs, isPlaying, onPoseUpdate]);

  // -------------------------------------------------------------
  // Camera Presets (Optimized for Sign Language Visibility)
  // -------------------------------------------------------------
  const applyCameraPreset = useCallback((preset: 'chest' | 'hands' | 'threeQuarter') => {
    setCameraView(preset);
    const camera = cameraRef.current;
    const controls = controlsRef.current;
    if (!camera || !controls) return;

    if (preset === 'chest') {
      // Optimal chest-up framing: entire upper torso and high-reach signs remain in view
      camera.position.set(0, 1.16, 1.32);
      controls.target.set(0, 1.12, 0.12);
    } else if (preset === 'hands') {
      // Close inspection of finger and wrist articulations
      camera.position.set(0, 1.08, 0.85);
      controls.target.set(0, 1.05, 0.22);
    } else if (preset === 'threeQuarter') {
      // 3/4 perspective to inspect depth and hand planes
      camera.position.set(0.48, 1.18, 1.25);
      controls.target.set(0, 1.12, 0.12);
    }
    controls.update();
  }, []);

  // -------------------------------------------------------------
  // Scene Initialization
  // -------------------------------------------------------------
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 640;
    const height = container.clientHeight || 480;

    // 1. Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Contrast backgrounds
    const bgColors = {
      studio: 0x0f172a, // Deep slate blue
      clinical: 0x1e293b, // Soft hospital navy
      dark: 0x090d16, // High-contrast midnight
    };
    scene.background = new THREE.Color(bgColors[contrastTheme]);

    // 2. Camera (Wide FOV for generous hand & finger framing)
    const camera = new THREE.PerspectiveCamera(36, width / height, 0.1, 20);
    camera.position.set(0, 1.16, 1.32);
    cameraRef.current = camera;

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // 4. Orbit Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.target.set(0, 1.12, 0.12);
    controls.minDistance = 0.5;
    controls.maxDistance = 2.5;
    controls.maxPolarAngle = Math.PI / 1.7; // Keep above floor
    controlsRef.current = controls;

    // 5. Lighting Setup (Designed for Sign Visibility & Contrast)
    // Key Light
    const keyLight = new THREE.DirectionalLight(0xffffff, 1.35);
    keyLight.position.set(1.5, 2.5, 2.0);
    scene.add(keyLight);

    // Fill Light (Soft cool fill for clear finger edge visibility)
    const fillLight = new THREE.DirectionalLight(0xdbeafe, 0.8);
    fillLight.position.set(-1.8, 1.8, 1.5);
    scene.add(fillLight);

    // Rim/Back Light (Separates avatar silhouette from background)
    const rimLight = new THREE.DirectionalLight(0x38bdf8, 0.6);
    rimLight.position.set(0, 2.2, -1.8);
    scene.add(rimLight);

    // Ambient Light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.65);
    scene.add(ambientLight);

    // Subtle floor pedestal for spatial grounding
    const floorGeo = new THREE.CylinderGeometry(0.7, 0.7, 0.04, 32);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.8,
      metalness: 0.1,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.position.set(0, 0.02, 0);
    scene.add(floor);

    // 6. Fast Load VRM Model via preloaded VRM Manager
    let isDisposed = false;
    const cachedVRM = vrmPreloader.getCachedVRM();

    const attachVRM = (vrm: VRM) => {
      if (isDisposed) return;
      vrmRef.current = vrm;
      vrm.scene.removeFromParent();
      scene.add(vrm.scene);
      vrm.scene.position.set(0, 0, 0);

      setIsLoadingVRM(false);
      const metaObj = vrm.meta as any;
      const modelTitle = metaObj?.name || metaObj?.title || 'Standard VRM 1.0 Humanoid';
      setVrmModelName(modelTitle);
      onVRMLoaded?.({ loaded: true, name: modelTitle });
    };

    const unsubscribeProgress = vrmPreloader.onProgress((pct) => {
      setLoadProgress(pct);
    });

    if (cachedVRM) {
      attachVRM(cachedVRM);
    } else {
      setIsLoadingVRM(true);
      setLoadError(null);
      vrmPreloader
        .getVRM()
        .then((vrm) => {
          attachVRM(vrm);
        })
        .catch((error) => {
          if (isDisposed) return;
          console.error('VRM load error:', error);
          setLoadError('Failed to load VRM model asset.');
          setIsLoadingVRM(false);
          onVRMLoaded?.({ loaded: false, error: 'VRM load failed' });
        });
    }

    // 7. Animation & Render Loop
    let animId: number;
    let lastTime = performance.now();

    const animate = (now: number) => {
      animId = requestAnimationFrame(animate);

      const deltaSec = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      controls.update();

      const { currentRecording: rec, playbackTimeMs: timeMs, onPoseUpdate: cb } = propsRef.current;

      // Sample interpolated sign pose at current timeMs
      const sampledPose = sampleSignSequence(rec, timeMs);
      if (cb) cb(sampledPose);

      // Apply to VRM
      if (vrmRef.current) {
        vrmRef.current.scene.visible = true;
        applyPoseToVRM(vrmRef.current, sampledPose, smoothedStateRef.current, deltaSec);
        vrmRef.current.update(deltaSec);
      }

      renderer.render(scene, camera);
    };

    animId = requestAnimationFrame(animate);

    // Resize Observer
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = entry.contentRect.width;
        const h = entry.contentRect.height;
        if (w > 0 && h > 0 && cameraRef.current && rendererRef.current) {
          cameraRef.current.aspect = w / h;
          cameraRef.current.updateProjectionMatrix();
          rendererRef.current.setSize(w, h);
        }
      }
    });
    resizeObserver.observe(container);

    // Cleanup
    return () => {
      isDisposed = true;
      if (vrmRef.current) {
        vrmRef.current.scene.removeFromParent();
      }
      unsubscribeProgress();
      cancelAnimationFrame(animId);
      resizeObserver.disconnect();
      controls.dispose();
      renderer.dispose();
      if (container && renderer.domElement) {
        container.innerHTML = '';
      }
    };
  }, [contrastTheme]);

  // -------------------------------------------------------------
  // User Custom VRM Upload Handler
  // -------------------------------------------------------------
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoadingVRM(true);
    setLoadError(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const buffer = event.target?.result as ArrayBuffer;
      const loader = new GLTFLoader();
      loader.register((parser) => new VRMLoaderPlugin(parser));

      loader.parse(
        buffer,
        '',
        (gltf) => {
          const vrm: VRM = gltf.userData.vrm;
          if (!vrm) {
            setLoadError('Selected file does not have VRM avatar metadata.');
            setIsLoadingVRM(false);
            return;
          }

          if (sceneRef.current && vrmRef.current) {
            sceneRef.current.remove(vrmRef.current.scene);
          }

          vrmRef.current = vrm;
          if (sceneRef.current) {
            sceneRef.current.add(vrm.scene);
            vrm.scene.position.set(0, 0, 0);
          }

          const metaObj = vrm.meta as any;
          const uploadedTitle = metaObj?.name || metaObj?.title || file.name;
          setVrmModelName(uploadedTitle);
          setIsLoadingVRM(false);
          onVRMLoaded?.({ loaded: true, name: uploadedTitle });
        },
        (err) => {
          console.error('Failed to parse uploaded VRM:', err);
          setLoadError('Failed to parse VRM file.');
          setIsLoadingVRM(false);
        }
      );
    };
    reader.readAsArrayBuffer(file);
  };

  return (
    <div className="relative w-full h-full flex flex-col bg-slate-950 overflow-hidden select-none">
      {/* 3D WebGL Canvas Mount */}
      <div ref={mountRef} className="relative w-full h-full flex-1 cursor-grab active:cursor-grabbing" />

      {/* Top Overlay: Camera Framing & Model Badges */}
      <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
        <div className="flex items-center space-x-2 pointer-events-auto">
          <div className="px-2.5 py-1 rounded-md bg-slate-900/90 border border-slate-700/80 backdrop-blur-md flex items-center space-x-2 text-xs shadow-lg">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="font-semibold text-slate-200">
              {vrmModelName}
            </span>
            <span className="text-[10px] text-teal-400 bg-teal-950/70 border border-teal-800/50 px-1.5 py-0.5 rounded font-mono">
              VRM 1.0 Avatar
            </span>
          </div>

          {loadError && (
            <div className="px-2.5 py-1 rounded bg-rose-950/80 border border-rose-700/60 text-rose-300 text-xs flex items-center space-x-1.5">
              <span>{loadError}</span>
            </div>
          )}
        </div>

        {/* Framing Controls */}
        <div className="flex items-center space-x-1.5 pointer-events-auto">
          <div className="bg-slate-900/90 border border-slate-700/80 backdrop-blur-md rounded-md p-0.5 flex space-x-0.5 text-xs shadow-lg">
            <button
              onClick={() => applyCameraPreset('chest')}
              className={`px-2 py-1 rounded font-medium transition-all ${
                cameraView === 'chest'
                  ? 'bg-teal-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
              title="Optimal Chest-Up Sign Framing"
            >
              Chest-Up
            </button>
            <button
              onClick={() => applyCameraPreset('hands')}
              className={`px-2 py-1 rounded font-medium transition-all ${
                cameraView === 'hands'
                  ? 'bg-teal-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
              title="Close-Up on Hands & Finger Articulations"
            >
              Hands Zoom
            </button>
            <button
              onClick={() => applyCameraPreset('threeQuarter')}
              className={`px-2 py-1 rounded font-medium transition-all ${
                cameraView === 'threeQuarter'
                  ? 'bg-teal-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
              title="3/4 Depth View"
            >
              3/4 Angle
            </button>
          </div>
        </div>
      </div>

      {/* Centered Loading Overlay */}
      {isLoadingVRM && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-sm z-20 pointer-events-none">
          <div className="flex flex-col items-center space-y-3 p-5 rounded-2xl bg-slate-900/95 border border-slate-800 shadow-2xl w-60 text-center">
            <div className="relative w-10 h-10 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-2 border-teal-500/20 border-t-teal-400 animate-spin" />
              <User className="w-5 h-5 text-teal-400" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-100">Loading 3D Avatar</p>
              <p className="text-[11px] text-slate-400">Preparing VRM bone kinematics...</p>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-teal-400 h-full rounded-full transition-all duration-150"
                style={{ width: `${Math.max(12, loadProgress)}%` }}
              />
            </div>
            <span className="text-[10px] font-mono text-teal-400 font-bold">{loadProgress}%</span>
          </div>
        </div>
      )}

      {/* Floating Instructions & Sign Watermark */}
      <div className="absolute bottom-3 left-3 pointer-events-none">
        <div className="bg-slate-900/85 backdrop-blur-md border border-slate-800/80 rounded-lg px-3 py-1.5 text-[11px] text-slate-400 flex items-center space-x-3 shadow-xl">
          <div className="flex items-center space-x-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-teal-400"></span>
            <span className="font-semibold text-slate-200">Replaying: {currentRecording.word.toUpperCase()}</span>
          </div>
          <span className="text-slate-600">|</span>
          <span>Framing: Chest-up (Hands inside frame)</span>
          <span className="text-slate-600">|</span>
          <span className="text-slate-500">Drag to orbit · Scroll to zoom</span>
        </div>
      </div>

      {/* Custom VRM Upload Pill (Optional load any .vrm) */}
      <div className="absolute bottom-3 right-3 pointer-events-auto">
        <label className="cursor-pointer bg-slate-900/90 hover:bg-slate-800/90 border border-slate-700/80 text-slate-300 text-xs px-2.5 py-1.5 rounded-lg flex items-center space-x-1.5 shadow-lg backdrop-blur-md transition-colors">
          <Sliders className="w-3.5 h-3.5 text-teal-400" />
          <span>Upload Custom .vrm</span>
          <input type="file" accept=".vrm,.glb" onChange={handleFileUpload} className="hidden" />
        </label>
      </div>
    </div>
  );
};
