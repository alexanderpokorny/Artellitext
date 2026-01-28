/**
 * AI Service - Client-Side AI Orchestration
 * 
 * Provides a unified interface for AI features:
 * - Whisper speech-to-text
 * - Future: Text embeddings, summarization, etc.
 * 
 * All inference runs locally via Transformers.js in a Web Worker.
 */

// Types
export interface TranscriptionResult {
  text: string;
  chunks: Array<{
    text: string;
    timestamp: [number, number];
  }>;
}

export interface ModelProgress {
  status: 'initiating' | 'downloading' | 'loading' | 'ready';
  file?: string;
  progress?: number;
  loaded?: number;
  total?: number;
}

export interface AIStatus {
  modelLoaded: boolean;
  isLoading: boolean;
  supportsWebGPU: boolean;
}

type MessageHandler = (data: any) => void;

/**
 * AI Service singleton
 */
class AIService {
  private worker: Worker | null = null;
  private messageHandlers: Map<string, MessageHandler> = new Map();
  private progressCallbacks: Map<string, (progress: ModelProgress) => void> = new Map();
  private isInitialized = false;
  private initPromise: Promise<void> | null = null;
  private messageIdCounter = 0;

  /**
   * Initialize the AI service and Web Worker
   */
  async init(): Promise<void> {
    if (this.isInitialized) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = new Promise((resolve, reject) => {
      try {
        // Create worker with Vite's worker import
        this.worker = new Worker(
          new URL('./transformers.worker.ts', import.meta.url),
          { type: 'module' }
        );

        // Handle messages from worker
        this.worker.onmessage = (event) => {
          const { type, id, payload } = event.data;

          // Handle ready signal
          if (type === 'ready') {
            this.isInitialized = true;
            resolve();
            return;
          }

          // Handle progress updates
          if (type === 'progress') {
            const progressCallback = this.progressCallbacks.get(id);
            if (progressCallback) {
              progressCallback(payload);
            }
            return;
          }

          // Handle results and errors
          const handler = this.messageHandlers.get(id);
          if (handler) {
            handler({ type, payload });
            this.messageHandlers.delete(id);
            this.progressCallbacks.delete(id);
          }
        };

        this.worker.onerror = (error) => {
          console.error('[AIService] Worker error:', error);
          reject(error);
        };

        // Timeout after 10 seconds
        setTimeout(() => {
          if (!this.isInitialized) {
            reject(new Error('Worker initialization timeout'));
          }
        }, 10000);

      } catch (error) {
        reject(error);
      }
    });

    return this.initPromise;
  }

  /**
   * Generate unique message ID
   */
  private generateId(): string {
    return `msg_${++this.messageIdCounter}_${Date.now()}`;
  }

  /**
   * Send message to worker and wait for response
   */
  private sendMessage<T>(
    type: string, 
    payload?: any,
    onProgress?: (progress: ModelProgress) => void
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      if (!this.worker) {
        reject(new Error('Worker not initialized. Call init() first.'));
        return;
      }

      const id = this.generateId();

      // Register progress callback if provided
      if (onProgress) {
        this.progressCallbacks.set(id, onProgress);
      }

      // Register result handler
      this.messageHandlers.set(id, ({ type, payload }) => {
        if (type === 'error') {
          reject(new Error(payload.message));
        } else {
          resolve(payload as T);
        }
      });

      // Send message to worker
      this.worker.postMessage({ type, payload, id });
    });
  }

  /**
   * Load Whisper model for speech recognition
   */
  async loadWhisperModel(
    modelName: string = 'Xenova/whisper-small',
    onProgress?: (progress: ModelProgress) => void
  ): Promise<{ success: boolean; message: string; device: string }> {
    await this.init();
    return this.sendMessage('load-model', { modelName }, onProgress);
  }

  /**
   * Transcribe audio data to text
   */
  async transcribe(
    audioData: Float32Array,
    language: string = 'de'
  ): Promise<TranscriptionResult> {
    await this.init();
    return this.sendMessage('transcribe', { audioData, language });
  }

  /**
   * Unload model to free memory
   */
  async unloadModel(): Promise<{ success: boolean; message: string }> {
    if (!this.isInitialized) {
      return { success: true, message: 'No model loaded' };
    }
    return this.sendMessage('unload-model');
  }

  /**
   * Get current AI service status
   */
  async getStatus(): Promise<AIStatus> {
    await this.init();
    return this.sendMessage('check-status');
  }

  /**
   * Check if WebGPU is supported
   */
  async supportsWebGPU(): Promise<boolean> {
    if (typeof navigator === 'undefined' || !('gpu' in navigator)) {
      return false;
    }
    try {
      const adapter = await (navigator as any).gpu?.requestAdapter();
      return adapter !== null;
    } catch {
      return false;
    }
  }

  /**
   * Terminate worker and cleanup
   */
  destroy(): void {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
    this.messageHandlers.clear();
    this.progressCallbacks.clear();
    this.isInitialized = false;
    this.initPromise = null;
  }
}

// Export singleton instance
export const aiService = new AIService();

// Export class for testing
export { AIService };
