/**
 * Speech Recorder - Audio capture for dictation
 * 
 * Captures audio from microphone and processes it for Whisper transcription.
 * Handles audio resampling to 16kHz mono as required by Whisper.
 */

export interface RecorderOptions {
  language?: string;
  onTranscription?: (text: string, isFinal: boolean) => void;
  onStateChange?: (state: RecordingState) => void;
  onError?: (error: Error) => void;
  onAudioLevel?: (level: number) => void;
}

export type RecordingState = 'idle' | 'requesting' | 'recording' | 'processing' | 'error';

/**
 * Convert AudioBuffer to Float32Array resampled to 16kHz
 */
async function audioBufferTo16kHz(audioBuffer: AudioBuffer): Promise<Float32Array> {
  const targetSampleRate = 16000;
  const sourceSampleRate = audioBuffer.sampleRate;
  
  // Get audio data (mix to mono if stereo)
  let audioData: Float32Array;
  if (audioBuffer.numberOfChannels > 1) {
    // Mix stereo to mono
    const left = audioBuffer.getChannelData(0);
    const right = audioBuffer.getChannelData(1);
    audioData = new Float32Array(left.length);
    for (let i = 0; i < left.length; i++) {
      audioData[i] = (left[i] + right[i]) / 2;
    }
  } else {
    audioData = audioBuffer.getChannelData(0);
  }

  // Resample if necessary
  if (sourceSampleRate !== targetSampleRate) {
    const ratio = sourceSampleRate / targetSampleRate;
    const newLength = Math.round(audioData.length / ratio);
    const resampled = new Float32Array(newLength);
    
    for (let i = 0; i < newLength; i++) {
      const sourceIndex = i * ratio;
      const sourceIndexFloor = Math.floor(sourceIndex);
      const sourceIndexCeil = Math.min(sourceIndexFloor + 1, audioData.length - 1);
      const t = sourceIndex - sourceIndexFloor;
      
      // Linear interpolation
      resampled[i] = audioData[sourceIndexFloor] * (1 - t) + audioData[sourceIndexCeil] * t;
    }
    
    return resampled;
  }
  
  return audioData;
}

/**
 * Speech Recorder class
 */
export class SpeechRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private stream: MediaStream | null = null;
  private audioChunks: Blob[] = [];
  private state: RecordingState = 'idle';
  private options: RecorderOptions;
  private animationFrame: number | null = null;

  constructor(options: RecorderOptions = {}) {
    this.options = {
      language: 'de',
      ...options
    };
  }

  /**
   * Get current recording state
   */
  getState(): RecordingState {
    return this.state;
  }

  /**
   * Update state and notify listeners
   */
  private setState(newState: RecordingState): void {
    this.state = newState;
    this.options.onStateChange?.(newState);
  }

  /**
   * Check microphone permission
   */
  async checkPermission(): Promise<PermissionState> {
    try {
      const permission = await navigator.permissions.query({ name: 'microphone' as PermissionName });
      return permission.state;
    } catch {
      // Firefox doesn't support permission query for microphone
      return 'prompt';
    }
  }

  /**
   * Start recording audio
   */
  async start(): Promise<void> {
    if (this.state === 'recording') {
      return;
    }

    this.setState('requesting');

    try {
      // Request microphone access
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      // Setup audio context for level monitoring
      this.audioContext = new AudioContext();
      const source = this.audioContext.createMediaStreamSource(this.stream);
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 256;
      source.connect(this.analyser);

      // Start level monitoring
      this.monitorAudioLevel();

      // Setup MediaRecorder
      this.audioChunks = [];
      this.mediaRecorder = new MediaRecorder(this.stream, {
        mimeType: this.getSupportedMimeType()
      });

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      this.mediaRecorder.onstop = () => {
        this.processRecording();
      };

      this.mediaRecorder.onerror = (event: any) => {
        this.handleError(new Error(event.error?.message || 'Recording error'));
      };

      // Start recording
      this.mediaRecorder.start(1000); // Collect data every second
      this.setState('recording');

    } catch (error: any) {
      this.handleError(error);
    }
  }

  /**
   * Stop recording and process audio
   */
  async stop(): Promise<void> {
    if (this.state !== 'recording' || !this.mediaRecorder) {
      return;
    }

    this.setState('processing');
    this.stopAudioMonitoring();
    
    // Stop MediaRecorder (triggers onstop event)
    this.mediaRecorder.stop();
    
    // Stop all tracks
    this.stream?.getTracks().forEach(track => track.stop());
  }

  /**
   * Cancel recording without processing
   */
  cancel(): void {
    this.stopAudioMonitoring();
    
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
    }
    
    this.stream?.getTracks().forEach(track => track.stop());
    this.audioChunks = [];
    this.setState('idle');
    this.cleanup();
  }

  /**
   * Process recorded audio
   */
  private async processRecording(): Promise<void> {
    try {
      // Combine audio chunks
      const audioBlob = new Blob(this.audioChunks, { type: this.getSupportedMimeType() });
      
      // Convert to ArrayBuffer
      const arrayBuffer = await audioBlob.arrayBuffer();
      
      // Decode audio
      if (!this.audioContext) {
        this.audioContext = new AudioContext();
      }
      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
      
      // Resample to 16kHz mono Float32Array
      const audioData = await audioBufferTo16kHz(audioBuffer);
      
      // Import AI service and transcribe
      const { aiService } = await import('./aiService');
      const result = await aiService.transcribe(audioData, this.options.language);
      
      // Send transcription result
      this.options.onTranscription?.(result.text, true);
      
      this.setState('idle');
      this.cleanup();
      
    } catch (error: any) {
      this.handleError(error);
    }
  }

  /**
   * Monitor audio input level for visual feedback
   */
  private monitorAudioLevel(): void {
    if (!this.analyser) return;

    const dataArray = new Uint8Array(this.analyser.frequencyBinCount);

    const updateLevel = () => {
      if (this.state !== 'recording' || !this.analyser) return;

      this.analyser.getByteFrequencyData(dataArray);
      
      // Calculate average level
      const sum = dataArray.reduce((a, b) => a + b, 0);
      const average = sum / dataArray.length;
      const normalizedLevel = average / 255;
      
      this.options.onAudioLevel?.(normalizedLevel);
      
      this.animationFrame = requestAnimationFrame(updateLevel);
    };

    updateLevel();
  }

  /**
   * Stop audio level monitoring
   */
  private stopAudioMonitoring(): void {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
    this.options.onAudioLevel?.(0);
  }

  /**
   * Get supported MIME type for recording
   */
  private getSupportedMimeType(): string {
    const types = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/ogg;codecs=opus',
      'audio/ogg',
      'audio/mp4',
      'audio/mpeg'
    ];

    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) {
        return type;
      }
    }

    return 'audio/webm'; // Fallback
  }

  /**
   * Handle errors
   */
  private handleError(error: Error): void {
    console.error('[SpeechRecorder] Error:', error);
    this.setState('error');
    this.options.onError?.(error);
    this.cleanup();
  }

  /**
   * Cleanup resources
   */
  private cleanup(): void {
    this.stopAudioMonitoring();
    
    if (this.audioContext?.state !== 'closed') {
      this.audioContext?.close();
    }
    
    this.audioContext = null;
    this.analyser = null;
    this.mediaRecorder = null;
    this.stream = null;
  }

  /**
   * Destroy recorder instance
   */
  destroy(): void {
    this.cancel();
    this.cleanup();
  }
}

/**
 * Check if speech recognition is available
 */
export function isSpeechRecordingSupported(): boolean {
  return !!(
    typeof navigator !== 'undefined' &&
    navigator.mediaDevices &&
    typeof navigator.mediaDevices.getUserMedia === 'function' &&
    typeof MediaRecorder !== 'undefined' &&
    typeof AudioContext !== 'undefined'
  );
}
