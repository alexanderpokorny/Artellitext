/**
 * Transformers.js Web Worker
 * 
 * Runs AI inference in a separate thread to avoid blocking the main UI.
 * Supports Whisper for speech-to-text and future model integrations.
 */

// @ts-nocheck - Transformers.js types are complex, using runtime checks
import { pipeline, env } from '@huggingface/transformers';

// Configure Transformers.js for browser environment
env.allowLocalModels = false;
env.useBrowserCache = true;

// Worker state
let whisperPipeline: any = null;
let isModelLoading = false;

// Message types
interface WorkerMessage {
  type: 'load-model' | 'transcribe' | 'unload-model' | 'check-status';
  payload?: any;
  id: string;
}

interface WorkerResponse {
  type: 'progress' | 'result' | 'error' | 'status';
  id: string;
  payload: any;
}

// Post message helper with type safety
function respond(response: WorkerResponse) {
  self.postMessage(response);
}

// Progress callback for model loading
function createProgressCallback(messageId: string) {
  return (progress: any) => {
    respond({
      type: 'progress',
      id: messageId,
      payload: {
        status: progress.status,
        file: progress.file,
        progress: progress.progress,
        loaded: progress.loaded,
        total: progress.total
      }
    });
  };
}

/**
 * Load Whisper model for speech recognition
 */
async function loadWhisperModel(messageId: string, modelName: string = 'Xenova/whisper-small') {
  if (whisperPipeline) {
    respond({
      type: 'result',
      id: messageId,
      payload: { success: true, message: 'Model already loaded' }
    });
    return;
  }

  if (isModelLoading) {
    respond({
      type: 'error',
      id: messageId,
      payload: { message: 'Model is already loading' }
    });
    return;
  }

  isModelLoading = true;

  try {
    respond({
      type: 'progress',
      id: messageId,
      payload: { status: 'initiating', file: modelName, progress: 0 }
    });

    // Check for WebGPU support
    let device: 'webgpu' | 'wasm' = 'wasm';
    if (typeof navigator !== 'undefined' && 'gpu' in navigator) {
      try {
        const adapter = await (navigator as any).gpu?.requestAdapter();
        if (adapter) {
          device = 'webgpu';
          console.log('[TransformersWorker] Using WebGPU acceleration');
        }
      } catch (e) {
        console.log('[TransformersWorker] WebGPU not available, using WASM');
      }
    }

    whisperPipeline = await pipeline(
      'automatic-speech-recognition',
      modelName,
      {
        progress_callback: createProgressCallback(messageId),
        device: device,
        dtype: device === 'webgpu' ? 'fp16' : 'q8'
      }
    );

    respond({
      type: 'result',
      id: messageId,
      payload: { 
        success: true, 
        message: `Whisper model loaded successfully`,
        device: device
      }
    });
  } catch (error: any) {
    respond({
      type: 'error',
      id: messageId,
      payload: { message: error.message || 'Failed to load model' }
    });
  } finally {
    isModelLoading = false;
  }
}

/**
 * Transcribe audio data
 */
async function transcribeAudio(
  messageId: string, 
  audioData: Float32Array, 
  language: string = 'de'
) {
  if (!whisperPipeline) {
    respond({
      type: 'error',
      id: messageId,
      payload: { message: 'Whisper model not loaded. Call load-model first.' }
    });
    return;
  }

  try {
    const result = await whisperPipeline(audioData, {
      language: language,
      task: 'transcribe',
      return_timestamps: true,
      chunk_length_s: 30,
      stride_length_s: 5
    });

    // Handle both single and array results
    const output = Array.isArray(result) ? result[0] : result;

    respond({
      type: 'result',
      id: messageId,
      payload: {
        text: output.text,
        chunks: (output as any).chunks || []
      }
    });
  } catch (error: any) {
    respond({
      type: 'error',
      id: messageId,
      payload: { message: error.message || 'Transcription failed' }
    });
  }
}

/**
 * Unload model to free memory
 */
function unloadModel(messageId: string) {
  whisperPipeline = null;
  respond({
    type: 'result',
    id: messageId,
    payload: { success: true, message: 'Model unloaded' }
  });
}

/**
 * Check worker status
 */
function checkStatus(messageId: string) {
  respond({
    type: 'status',
    id: messageId,
    payload: {
      modelLoaded: whisperPipeline !== null,
      isLoading: isModelLoading,
      supportsWebGPU: typeof navigator !== 'undefined' && 'gpu' in navigator
    }
  });
}

// Message handler
self.onmessage = async (event: MessageEvent<WorkerMessage>) => {
  const { type, payload, id } = event.data;

  switch (type) {
    case 'load-model':
      await loadWhisperModel(id, payload?.modelName);
      break;
    case 'transcribe':
      await transcribeAudio(id, payload.audioData, payload.language);
      break;
    case 'unload-model':
      unloadModel(id);
      break;
    case 'check-status':
      checkStatus(id);
      break;
    default:
      respond({
        type: 'error',
        id,
        payload: { message: `Unknown message type: ${type}` }
      });
  }
};

// Signal worker is ready
self.postMessage({ type: 'ready' });
