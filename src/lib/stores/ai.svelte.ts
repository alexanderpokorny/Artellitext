/**
 * AI Store - Reactive state for AI features
 * 
 * Manages:
 * - Model loading state
 * - Dictation mode
 * - Transcription results
 */

import { aiService, type ModelProgress, type AIStatus } from '$lib/ai/aiService';
import { SpeechRecorder, type RecordingState, isSpeechRecordingSupported } from '$lib/ai/speechRecorder';

// State
let modelState = $state<'idle' | 'loading' | 'ready' | 'error'>('idle');
let modelProgress = $state<ModelProgress | null>(null);
let modelError = $state<string | null>(null);
let modelDevice = $state<'webgpu' | 'wasm' | null>(null);

let recordingState = $state<RecordingState>('idle');
let audioLevel = $state<number>(0);
let currentTranscription = $state<string>('');
let transcriptionHistory = $state<string[]>([]);

let recorder: SpeechRecorder | null = null;

// Callbacks for transcription
let onTranscriptionCallback: ((text: string) => void) | null = null;

/**
 * Load Whisper model
 */
async function loadModel(modelName: string = 'Xenova/whisper-small'): Promise<boolean> {
  if (modelState === 'loading') {
    console.warn('[aiStore] Model is already loading');
    return false;
  }

  if (modelState === 'ready') {
    console.log('[aiStore] Model already loaded');
    return true;
  }

  modelState = 'loading';
  modelError = null;
  modelProgress = { status: 'initiating' };

  try {
    const result = await aiService.loadWhisperModel(
      modelName,
      (progress) => {
        modelProgress = progress;
      }
    );

    modelDevice = result.device as 'webgpu' | 'wasm';
    modelState = 'ready';
    modelProgress = { status: 'ready' };
    console.log(`[aiStore] Model loaded with ${modelDevice}`);
    return true;

  } catch (error: any) {
    modelError = error.message;
    modelState = 'error';
    console.error('[aiStore] Failed to load model:', error);
    return false;
  }
}

/**
 * Unload model to free memory
 */
async function unloadModel(): Promise<void> {
  await aiService.unloadModel();
  modelState = 'idle';
  modelProgress = null;
  modelDevice = null;
}

/**
 * Start dictation
 */
async function startDictation(
  onTranscription?: (text: string) => void,
  language: string = 'de'
): Promise<boolean> {
  if (!isSpeechRecordingSupported()) {
    modelError = 'Sprachaufnahme wird in diesem Browser nicht unterstützt';
    return false;
  }

  // Ensure model is loaded
  if (modelState !== 'ready') {
    const loaded = await loadModel();
    if (!loaded) {
      return false;
    }
  }

  // Store callback
  onTranscriptionCallback = onTranscription || null;

  // Create recorder
  recorder = new SpeechRecorder({
    language,
    onTranscription: (text, isFinal) => {
      currentTranscription = text;
      if (isFinal && text.trim()) {
        transcriptionHistory = [...transcriptionHistory, text];
        onTranscriptionCallback?.(text);
      }
    },
    onStateChange: (state) => {
      recordingState = state;
    },
    onAudioLevel: (level) => {
      audioLevel = level;
    },
    onError: (error) => {
      modelError = error.message;
    }
  });

  try {
    await recorder.start();
    return true;
  } catch (error: any) {
    modelError = error.message;
    return false;
  }
}

/**
 * Stop dictation
 */
async function stopDictation(): Promise<void> {
  if (recorder) {
    await recorder.stop();
    recorder = null;
  }
}

/**
 * Cancel dictation without processing
 */
function cancelDictation(): void {
  if (recorder) {
    recorder.cancel();
    recorder = null;
  }
  recordingState = 'idle';
  audioLevel = 0;
}

/**
 * Clear transcription history
 */
function clearHistory(): void {
  transcriptionHistory = [];
  currentTranscription = '';
}

/**
 * Get AI service status
 */
async function getStatus(): Promise<AIStatus> {
  return aiService.getStatus();
}

/**
 * Check WebGPU support
 */
async function checkWebGPU(): Promise<boolean> {
  return aiService.supportsWebGPU();
}

// Export reactive getters and actions
export const aiStore = {
  // State getters
  get modelState() { return modelState; },
  get modelProgress() { return modelProgress; },
  get modelError() { return modelError; },
  get modelDevice() { return modelDevice; },
  get recordingState() { return recordingState; },
  get audioLevel() { return audioLevel; },
  get currentTranscription() { return currentTranscription; },
  get transcriptionHistory() { return transcriptionHistory; },
  get isRecording() { return recordingState === 'recording'; },
  get isProcessing() { return recordingState === 'processing'; },
  get isModelReady() { return modelState === 'ready'; },
  get isSupported() { return isSpeechRecordingSupported(); },
  
  // Actions
  loadModel,
  unloadModel,
  startDictation,
  stopDictation,
  cancelDictation,
  clearHistory,
  getStatus,
  checkWebGPU
};
