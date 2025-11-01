/**
 * Text-to-Speech Service
 * Uses Web Speech API for browser-based TTS
 */

class TTSService {
  constructor() {
    this.synthesis = window.speechSynthesis;
    this.utterance = null;
    this.voices = [];
    this.selectedVoice = null;
    this.isPlaying = false;
    this.isPaused = false;
    this.onProgressCallback = null;

    // Load voices when available
    this.loadVoices();

    // Voices load asynchronously, so listen for changes
    if (this.synthesis.onvoiceschanged !== undefined) {
      this.synthesis.onvoiceschanged = () => this.loadVoices();
    }
  }

  /**
   * Load available voices
   */
  loadVoices() {
    this.voices = this.synthesis.getVoices();
    console.log(`Loaded ${this.voices.length} TTS voices`);

    // Auto-select a good default voice
    if (!this.selectedVoice && this.voices.length > 0) {
      // Prefer English voices
      this.selectedVoice = this.voices.find(v => v.lang.startsWith('en-')) || this.voices[0];
      console.log('Selected default voice:', this.selectedVoice.name);
    }
  }

  /**
   * Check if TTS is available
   */
  isAvailable() {
    return 'speechSynthesis' in window;
  }

  /**
   * Get available voices
   */
  getVoices() {
    return this.voices;
  }

  /**
   * Get voices grouped by language
   */
  getVoicesByLanguage() {
    const grouped = {};

    this.voices.forEach(voice => {
      const lang = voice.lang.split('-')[0]; // Get base language (e.g., 'en' from 'en-US')
      if (!grouped[lang]) {
        grouped[lang] = [];
      }
      grouped[lang].push(voice);
    });

    return grouped;
  }

  /**
   * Set voice by name
   */
  setVoice(voiceName) {
    const voice = this.voices.find(v => v.name === voiceName);
    if (voice) {
      this.selectedVoice = voice;
      console.log('Voice changed to:', voiceName);
      return true;
    }
    return false;
  }

  /**
   * Speak text
   * @param {string} text - Text to speak
   * @param {Object} options - Speech options
   */
  speak(text, options = {}) {
    if (!this.isAvailable()) {
      throw new Error('Text-to-Speech not available in this browser');
    }

    // Stop any current speech
    this.stop();

    // Create utterance
    this.utterance = new SpeechSynthesisUtterance(text);

    // Set options
    this.utterance.voice = this.selectedVoice;
    this.utterance.rate = options.rate || 1.0;        // 0.1 to 10
    this.utterance.pitch = options.pitch || 1.0;      // 0 to 2
    this.utterance.volume = options.volume || 1.0;    // 0 to 1

    // Set up event listeners
    this.utterance.onstart = () => {
      this.isPlaying = true;
      this.isPaused = false;
      console.log('TTS started');
      if (this.onProgressCallback) {
        this.onProgressCallback({ status: 'playing', progress: 0 });
      }
    };

    this.utterance.onend = () => {
      this.isPlaying = false;
      this.isPaused = false;
      console.log('TTS ended');
      if (this.onProgressCallback) {
        this.onProgressCallback({ status: 'ended', progress: 100 });
      }
    };

    this.utterance.onerror = (event) => {
      console.error('TTS error:', event.error);
      this.isPlaying = false;
      this.isPaused = false;
      if (this.onProgressCallback) {
        this.onProgressCallback({ status: 'error', error: event.error });
      }
    };

    this.utterance.onpause = () => {
      this.isPaused = true;
      console.log('TTS paused');
      if (this.onProgressCallback) {
        this.onProgressCallback({ status: 'paused' });
      }
    };

    this.utterance.onresume = () => {
      this.isPaused = false;
      console.log('TTS resumed');
      if (this.onProgressCallback) {
        this.onProgressCallback({ status: 'playing' });
      }
    };

    // Boundary events (word boundaries)
    this.utterance.onboundary = (event) => {
      // Calculate approximate progress
      const progress = (event.charIndex / text.length) * 100;
      if (this.onProgressCallback) {
        this.onProgressCallback({
          status: 'playing',
          progress: progress,
          charIndex: event.charIndex
        });
      }
    };

    // Start speaking
    this.synthesis.speak(this.utterance);
  }

  /**
   * Pause speech
   */
  pause() {
    if (this.isPlaying && !this.isPaused) {
      this.synthesis.pause();
    }
  }

  /**
   * Resume speech
   */
  resume() {
    if (this.isPlaying && this.isPaused) {
      this.synthesis.resume();
    }
  }

  /**
   * Stop speech
   */
  stop() {
    if (this.synthesis.speaking || this.isPaused) {
      this.synthesis.cancel();
      this.isPlaying = false;
      this.isPaused = false;
    }
  }

  /**
   * Toggle play/pause
   */
  togglePlayPause() {
    if (this.isPlaying) {
      if (this.isPaused) {
        this.resume();
      } else {
        this.pause();
      }
    }
  }

  /**
   * Set progress callback
   */
  onProgress(callback) {
    this.onProgressCallback = callback;
  }

  /**
   * Get current status
   */
  getStatus() {
    return {
      isPlaying: this.isPlaying,
      isPaused: this.isPaused,
      isSpeaking: this.synthesis.speaking,
      voice: this.selectedVoice?.name || 'None'
    };
  }

  /**
   * Split long text into chunks for better TTS handling
   * Web Speech API has length limits
   */
  splitTextForTTS(text, maxLength = 200) {
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
    const chunks = [];
    let currentChunk = '';

    for (const sentence of sentences) {
      if (currentChunk.length + sentence.length > maxLength) {
        if (currentChunk) {
          chunks.push(currentChunk.trim());
        }
        currentChunk = sentence;
      } else {
        currentChunk += ' ' + sentence;
      }
    }

    if (currentChunk) {
      chunks.push(currentChunk.trim());
    }

    return chunks;
  }

  /**
   * Speak long text by splitting into chunks
   */
  async speakLongText(text, options = {}) {
    const chunks = this.splitTextForTTS(text, 200);
    console.log(`Speaking ${chunks.length} chunks`);

    // Stop any current speech
    this.stop();
    this.isPlaying = true;

    for (let i = 0; i < chunks.length; i++) {
      console.log(`Speaking chunk ${i + 1}/${chunks.length}`);

      // Create utterance for this chunk
      const utterance = new SpeechSynthesisUtterance(chunks[i]);
      utterance.voice = this.selectedVoice;
      utterance.rate = options.rate || 1.0;
      utterance.pitch = options.pitch || 1.0;
      utterance.volume = options.volume || 1.0;

      // Wait for this chunk to finish
      await new Promise((resolve, reject) => {
        utterance.onstart = () => {
          console.log(`TTS chunk ${i + 1} started`);
        };

        utterance.onend = () => {
          console.log(`TTS chunk ${i + 1} ended`);

          // Calculate overall progress
          const progress = ((i + 1) / chunks.length) * 100;

          if (this.onProgressCallback) {
            this.onProgressCallback({
              status: 'playing',
              progress: progress,
              chunk: i + 1,
              totalChunks: chunks.length
            });
          }

          resolve();
        };

        utterance.onerror = (event) => {
          console.error(`TTS chunk ${i + 1} error:`, event.error);
          // Don't reject on error, just continue to next chunk
          resolve();
        };

        this.synthesis.speak(utterance);
      });

      // Small pause between chunks
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    this.isPlaying = false;
    console.log('Finished speaking all chunks');

    if (this.onProgressCallback) {
      this.onProgressCallback({ status: 'ended', progress: 100 });
    }
  }

  /**
   * Get voice recommendations for podcast narration
   */
  getRecommendedVoices() {
    const englishVoices = this.voices.filter(v => v.lang.startsWith('en-'));

    // Prefer these voice names (common high-quality voices)
    const preferredNames = [
      'Samantha',      // macOS
      'Alex',          // macOS
      'Karen',         // macOS
      'Daniel',        // macOS
      'Google US English', // Chrome
      'Microsoft David',   // Windows
      'Microsoft Zira'     // Windows
    ];

    const recommended = englishVoices.filter(v =>
      preferredNames.some(name => v.name.includes(name))
    );

    return recommended.length > 0 ? recommended : englishVoices;
  }

  /**
   * Test voice by speaking a sample
   */
  testVoice(voiceName) {
    this.setVoice(voiceName);
    this.speak('Hello! This is a test of the text-to-speech voice.', {
      rate: 1.0,
      pitch: 1.0,
      volume: 1.0
    });
  }
}

// Export singleton instance (use window to avoid redeclaration)
if (typeof window !== 'undefined') {
  window.ttsService = window.ttsService || new TTSService();
  console.log('✅ TTS Service loaded');
}
