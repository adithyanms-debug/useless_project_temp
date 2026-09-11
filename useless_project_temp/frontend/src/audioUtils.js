/**
 * Mandi Streaming Audio Engine
 * - Jitter-buffered, click-free, gapless 24kHz PCM streaming playback
 * - Micro-fade envelope at chunk boundaries to eliminate clicks and pops
 * - Instant barge-in / user interruption handling
 * - Robust error isolation against invalid/corrupt audio packets
 * - Web Audio API AnalyserNode integration for 60fps audio reactivity
 */

/**
 * Downsamples Float32Array audio to 16kHz 16-bit signed Linear PCM (Little Endian).
 * @param {Float32Array} buffer 
 * @param {number} inputSampleRate 
 * @returns {ArrayBuffer}
 */
export function downsampleTo16kHz(buffer, inputSampleRate = 44100) {
  if (!buffer || buffer.length === 0) return new ArrayBuffer(0);

  if (inputSampleRate === 16000) {
    const pcm16 = new Int16Array(buffer.length);
    for (let i = 0; i < buffer.length; i++) {
      const s = Math.max(-1, Math.min(1, buffer[i]));
      pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
    }
    return pcm16.buffer;
  }

  const sampleRateRatio = inputSampleRate / 16000;
  const newLength = Math.round(buffer.length / sampleRateRatio);
  const result = new Int16Array(newLength);

  for (let i = 0; i < newLength; i++) {
    const originIndex = i * sampleRateRatio;
    const index = Math.floor(originIndex);
    const decimal = originIndex - index;

    const s1 = buffer[index] || 0;
    const s2 = buffer[index + 1] || s1;
    const interpolated = s1 + (s2 - s1) * decimal;

    const clamped = Math.max(-1, Math.min(1, interpolated));
    result[i] = clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff;
  }

  return result.buffer;
}

/**
 * Decodes base64 24kHz 16-bit PCM data into an AudioBuffer with click-free micro-fades.
 * @param {AudioContext} audioCtx 
 * @param {string} base64Data 
 * @returns {AudioBuffer|null}
 */
export function decodePcm24kToAudioBuffer(audioCtx, base64Data) {
  if (!base64Data || typeof base64Data !== 'string') return null;

  try {
    const binaryString = atob(base64Data);
    const len = binaryString.length;
    if (len < 4) return null;

    // Ensure even byte length for 16-bit PCM
    const validLen = len - (len % 2);
    const bytes = new Uint8Array(validLen);
    for (let i = 0; i < validLen; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    const int16Array = new Int16Array(bytes.buffer);
    const sampleCount = int16Array.length;
    if (sampleCount === 0) return null;

    const audioBuffer = audioCtx.createBuffer(1, sampleCount, 24000);
    const channelData = audioBuffer.getChannelData(0);

    // Convert Int16 to Float32 [-1.0, 1.0]
    for (let i = 0; i < sampleCount; i++) {
      channelData[i] = int16Array[i] / 32768.0;
    }

    // Apply micro-fades (16 samples ~ 0.6ms) at edges to eliminate clicks at chunk boundaries
    const fadeLength = Math.min(16, Math.floor(sampleCount / 4));
    for (let i = 0; i < fadeLength; i++) {
      const factor = i / fadeLength;
      channelData[i] *= factor; // Fade in
      channelData[sampleCount - 1 - i] *= factor; // Fade out
    }

    return audioBuffer;
  } catch (err) {
    console.warn("Invalid PCM audio chunk skipped:", err.message);
    return null;
  }
}

/**
 * Continuous, low-latency, click-free Streaming PCM Audio Player.
 * Manages consecutive timeline scheduling, pre-buffering, and instant barge-in.
 */
export class StreamAudioPlayer {
  constructor(onPlaybackStart, onPlaybackEnd) {
    this.onPlaybackStart = onPlaybackStart;
    this.onPlaybackEnd = onPlaybackEnd;
    this.audioCtx = null;
    this.analyser = null;
    this.dataArray = null;
    this.nextStartTime = 0;
    this.isPlaying = false;
    this.activeSources = [];
    this.pendingQueue = [];
    this.leadTime = 0.04; // 40ms lead buffer to prevent underruns
    this.minPrebufferChunks = 2; // Start playing immediately after 2 chunks
  }

  /**
   * Initializes AudioContext safely on user gesture or first packet.
   */
  init() {
    if (!this.audioCtx || this.audioCtx.state === 'closed') {
      const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
      this.audioCtx = new AudioCtxClass({ sampleRate: 24000 });
    }

    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {});
    }

    if (!this.analyser && this.audioCtx) {
      this.analyser = this.audioCtx.createAnalyser();
      this.analyser.fftSize = 256;
      this.analyser.smoothingTimeConstant = 0.8;
      this.analyser.connect(this.audioCtx.destination);
      this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
    }
  }

  /**
   * Enqueues an incoming base64 PCM chunk and schedules it sequentially.
   * @param {string} base64Data 
   */
  playChunk(base64Data) {
    this.init();
    if (!this.audioCtx || !this.analyser) return;

    const audioBuffer = decodePcm24kToAudioBuffer(this.audioCtx, base64Data);
    if (!audioBuffer) return;

    this.pendingQueue.push(audioBuffer);

    // If not currently playing and queue has reached low-latency prebuffer threshold, drain
    if (!this.isPlaying && this.pendingQueue.length >= this.minPrebufferChunks) {
      this.flushPendingQueue();
    } else if (this.isPlaying) {
      this.scheduleBuffer(audioBuffer);
    }
  }

  /**
   * Flushes all queued chunks onto the audio context timeline.
   */
  flushPendingQueue() {
    if (this.pendingQueue.length === 0) return;
    
    // Begin playback start
    if (!this.isPlaying) {
      this.isPlaying = true;
      if (this.onPlaybackStart) this.onPlaybackStart();
    }

    while (this.pendingQueue.length > 0) {
      const buf = this.pendingQueue.shift();
      this.scheduleBuffer(buf);
    }
  }

  /**
   * Schedules a single AudioBuffer sequentially onto the AudioContext timeline.
   * @param {AudioBuffer} audioBuffer 
   */
  scheduleBuffer(audioBuffer) {
    if (!this.audioCtx || !this.analyser) return;

    try {
      const source = this.audioCtx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(this.analyser);

      const now = this.audioCtx.currentTime;
      // Schedule consecutively: if timeline fell behind due to jitter, reset smoothly with lead time
      const startTime = Math.max(now + this.leadTime, this.nextStartTime);
      source.start(startTime);
      this.nextStartTime = startTime + audioBuffer.duration;

      this.activeSources.push(source);

      source.onended = () => {
        const idx = this.activeSources.indexOf(source);
        if (idx !== -1) this.activeSources.splice(idx, 1);

        // Check if stream finished completely
        if (this.activeSources.length === 0 && this.pendingQueue.length === 0) {
          if (this.audioCtx && this.audioCtx.currentTime >= this.nextStartTime - 0.05) {
            this.isPlaying = false;
            if (this.onPlaybackEnd) this.onPlaybackEnd();
          }
        }
      };
    } catch (err) {
      console.error("Error scheduling buffer:", err);
    }
  }

  /**
   * Called when server signals end of turn; flushes any remaining prebuffered chunks.
   */
  endTurn() {
    if (this.pendingQueue.length > 0) {
      this.flushPendingQueue();
    }
  }

  /**
   * Instant interruption / barge-in.
   * Immediately silences audio, clears queue, and resets timeline.
   */
  interrupt() {
    this.pendingQueue = [];
    for (const src of this.activeSources) {
      try {
        src.stop(0);
        src.disconnect();
      } catch {}
    }
    this.activeSources = [];
    this.nextStartTime = 0;
    this.isPlaying = false;
    if (this.onPlaybackEnd) this.onPlaybackEnd();
  }

  /**
   * Real-time audio energy level [0.0 - 1.0] for orb visualization.
   * @returns {number}
   */
  getAudioEnergy() {
    if (!this.analyser || !this.isPlaying || !this.dataArray) return 0;
    this.analyser.getByteFrequencyData(this.dataArray);

    let sum = 0;
    const len = this.dataArray.length;
    for (let i = 0; i < len; i++) {
      sum += this.dataArray[i];
    }
    const avg = sum / len;
    return Math.min(1.0, avg / 128.0);
  }

  /**
   * Clean disposal of Web Audio resources.
   */
  close() {
    this.interrupt();
    if (this.audioCtx && this.audioCtx.state !== 'closed') {
      try {
        this.audioCtx.close();
      } catch {}
    }
    this.audioCtx = null;
    this.analyser = null;
  }
}
