/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { VRM, VRMLoaderPlugin } from '@pixiv/three-vrm';

type ProgressCallback = (percentage: number) => void;

class VRMPreloadManager {
  private bufferPromise: Promise<ArrayBuffer> | null = null;
  private cachedBuffer: ArrayBuffer | null = null;
  private vrmPromise: Promise<VRM> | null = null;
  private cachedVRM: VRM | null = null;
  private progressListeners: Set<ProgressCallback> = new Set();
  private currentProgress: number = 0;
  private isLoaded: boolean = false;

  constructor() {
    // Automatically begin preloading in background on app start
    if (typeof window !== 'undefined') {
      setTimeout(() => {
        this.getVRM().catch((err) => {
          console.warn('VRM background preload error:', err);
        });
      }, 50);
    }
  }

  public getProgress(): number {
    return this.currentProgress;
  }

  public getIsLoaded(): boolean {
    return this.isLoaded && this.cachedVRM !== null;
  }

  public getCachedVRM(): VRM | null {
    return this.cachedVRM;
  }

  public onProgress(listener: ProgressCallback): () => void {
    this.progressListeners.add(listener);
    listener(this.currentProgress);
    return () => this.progressListeners.delete(listener);
  }

  public async getVRMBuffer(): Promise<ArrayBuffer> {
    if (this.cachedBuffer) {
      return this.cachedBuffer;
    }
    if (!this.bufferPromise) {
      this.bufferPromise = this.fetchBuffer();
    }
    return this.bufferPromise;
  }

  private async fetchBuffer(): Promise<ArrayBuffer> {
    try {
      this.notifyProgress(15);
      const response = await fetch('/avatar.vrm');
      if (!response.ok) {
        throw new Error(`Failed to fetch VRM: HTTP ${response.status}`);
      }
      this.notifyProgress(50);
      const buffer = await response.arrayBuffer();
      this.cachedBuffer = buffer;
      this.notifyProgress(80);
      return buffer;
    } catch (err) {
      console.warn('VRM fetchBuffer error:', err);
      throw err;
    }
  }

  public async getVRM(): Promise<VRM> {
    if (this.cachedVRM) {
      return this.cachedVRM;
    }

    if (this.vrmPromise) {
      return this.vrmPromise;
    }

    this.vrmPromise = (async () => {
      const buffer = await this.getVRMBuffer();
      this.notifyProgress(90);

      const loader = new GLTFLoader();
      loader.register((parser) => new VRMLoaderPlugin(parser));

      const vrm = await new Promise<VRM>((resolve, reject) => {
        loader.parse(
          buffer,
          '',
          (gltf) => {
            const parsedVRM = gltf.userData.vrm as VRM;
            if (parsedVRM) {
              resolve(parsedVRM);
            } else {
              reject(new Error('GLTF does not contain VRM metadata.'));
            }
          },
          (error) => reject(error)
        );
      });

      this.cachedVRM = vrm;
      this.isLoaded = true;
      this.notifyProgress(100);
      return vrm;
    })();

    return this.vrmPromise;
  }

  private notifyProgress(pct: number) {
    this.currentProgress = pct;
    this.progressListeners.forEach((fn) => {
      try {
        fn(pct);
      } catch (e) {
        // ignore callback error
      }
    });
  }
}

export const vrmPreloader = new VRMPreloadManager();
