/**
 * Google Cloud Text-to-Speech Service
 * Provides high-quality Neural2 voices for podcast narration
 */

class GoogleCloudTTS {
  constructor() {
    this.isPlaying = false;
    this.isPaused = false;
    this.audio = null;
    this.currentText = '';
    this.onProgressCallback = null;

    // Available Google Cloud Neural2 voices
    this.voices = {
      // US English Neural2 voices (best quality)
      'en-US-Neural2-A': { name: 'Male 1 (US)', gender: 'MALE', language: 'en-US' },
      'en-US-Neural2-C': { name: 'Female 1 (US)', gender: 'FEMALE', language: 'en-US' },
      'en-US-Neural2-D': { name: 'Male 2 (US)', gender: 'MALE', language: 'en-US' },
      'en-US-Neural2-E': { name: 'Female 2 (US)', gender: 'FEMALE', language: 'en-US' },
      'en-US-Neural2-F': { name: 'Female 3 (US)', gender: 'FEMALE', language: 'en-US' },
      'en-US-Neural2-G': { name: 'Female 4 (US)', gender: 'FEMALE', language: 'en-US' },
      'en-US-Neural2-H': { name: 'Female 5 (US)', gender: 'FEMALE', language: 'en-US' },
      'en-US-Neural2-I': { name: 'Male 3 (US)', gender: 'MALE', language: 'en-US' },
      'en-US-Neural2-J': { name: 'Male 4 (US)', gender: 'MALE', language: 'en-US' },

      // UK English Neural2 voices
      'en-GB-Neural2-A': { name: 'Female (UK)', gender: 'FEMALE', language: 'en-GB' },
      'en-GB-Neural2-B': { name: 'Male (UK)', gender: 'MALE', language: 'en-GB' },
      'en-GB-Neural2-C': { name: 'Female 2 (UK)', gender: 'FEMALE', language: 'en-GB' },
      'en-GB-Neural2-D': { name: 'Male 2 (UK)', gender: 'MALE', language: 'en-GB' },
      'en-GB-Neural2-F': { name: 'Female 3 (UK)', gender: 'FEMALE', language: 'en-GB' },

      // Australian English Neural2 voices
      'en-AU-Neural2-A': { name: 'Female (AU)', gender: 'FEMALE', language: 'en-AU' },
      'en-AU-Neural2-B': { name: 'Male (AU)', gender: 'MALE', language: 'en-AU' },
      'en-AU-Neural2-C': { name: 'Female 2 (AU)', gender: 'FEMALE', language: 'en-AU' },
      'en-AU-Neural2-D': { name: 'Male 2 (AU)', gender: 'MALE', language: 'en-AU' }
    };

    this.selectedVoice = 'en-US-Neural2-F'; // Default: Female US voice
  }

  /**
   * Get available voices
   */
  getVoices() {
    return Object.entries(this.voices).map(([id, info]) => ({
      id: id,
      name: info.name,
      gender: info.gender,
      language: info.language
    }));
  }

  /**
   * Set voice
   */
  setVoice(voiceId) {
    if (this.voices[voiceId]) {
      this.selectedVoice = voiceId;
      console.log('Google Cloud TTS voice changed to:', voiceId);
      return true;
    }
    return false;
  }

  /**
   * Synthesize speech using Google Cloud TTS
   */
  async synthesizeSpeech(text, options = {}) {
    try {
      console.log('🎤 Synthesizing speech with Google Cloud TTS...');

      const voiceId = options.voiceId || this.selectedVoice;
      const voice = this.voices[voiceId];

      // Send request to offscreen document
      const response = await chrome.runtime.sendMessage({
        action: 'synthesizeSpeech',
        text: text,
        voiceName: voiceId,
        languageCode: voice.language
      });

      if (!response.success) {
        throw new Error(response.error);
      }

      console.log('✅ Speech synthesized successfully');
      return response.audioContent; // Base64 encoded MP3

    } catch (error) {
      console.error('❌ Speech synthesis failed:', error);
      throw error;
    }
  }

  /**
   * Speak text with progress tracking
   */
  async speak(text, options = {}) {
    try {
      // Stop any current playback
      this.stop();

      this.currentText = text;
      this.isPlaying = true;
      this.isPaused = false;

      if (this.onProgressCallback) {
        this.onProgressCallback({ status: 'synthesizing', progress: 0 });
      }

      // Synthesize speech
      const audioContent = await this.synthesizeSpeech(text, options);

      // Convert base64 to blob
      const audioBlob = this.base64ToBlob(audioContent, 'audio/mp3');
      const audioUrl = URL.createObjectURL(audioBlob);

      // Create audio element
      this.audio = new Audio(audioUrl);

      // Set up event listeners
      this.audio.addEventListener('play', () => {
        console.log('Google Cloud TTS started playing');
        if (this.onProgressCallback) {
          this.onProgressCallback({ status: 'playing', progress: 0 });
        }
      });

      this.audio.addEventListener('timeupdate', () => {
        if (this.audio) {
          const progress = (this.audio.currentTime / this.audio.duration) * 100;
          if (this.onProgressCallback) {
            this.onProgressCallback({ status: 'playing', progress: progress });
          }
        }
      });

      this.audio.addEventListener('ended', () => {
        console.log('Google Cloud TTS ended');
        this.isPlaying = false;
        if (this.onProgressCallback) {
          this.onProgressCallback({ status: 'ended', progress: 100 });
        }
        URL.revokeObjectURL(audioUrl);
      });

      this.audio.addEventListener('error', (e) => {
        console.error('Google Cloud TTS error:', e);
        this.isPlaying = false;
        if (this.onProgressCallback) {
          this.onProgressCallback({ status: 'error', error: 'Audio playback error' });
        }
        URL.revokeObjectURL(audioUrl);
      });

      // Play audio
      await this.audio.play();

    } catch (error) {
      console.error('Google Cloud TTS speak error:', error);
      this.isPlaying = false;
      if (this.onProgressCallback) {
        this.onProgressCallback({ status: 'error', error: error.message });
      }
      throw error;
    }
  }

  /**
   * Pause playback
   */
  pause() {
    if (this.audio && this.isPlaying && !this.isPaused) {
      this.audio.pause();
      this.isPaused = true;
      console.log('Google Cloud TTS paused');
      if (this.onProgressCallback) {
        this.onProgressCallback({ status: 'paused' });
      }
    }
  }

  /**
   * Resume playback
   */
  resume() {
    if (this.audio && this.isPaused) {
      this.audio.play();
      this.isPaused = false;
      console.log('Google Cloud TTS resumed');
      if (this.onProgressCallback) {
        this.onProgressCallback({ status: 'playing' });
      }
    }
  }

  /**
   * Stop playback
   */
  stop() {
    if (this.audio) {
      this.audio.pause();
      this.audio.currentTime = 0;
      this.audio = null;
    }
    this.isPlaying = false;
    this.isPaused = false;
    console.log('Google Cloud TTS stopped');
  }

  /**
   * Convert base64 to Blob
   */
  base64ToBlob(base64, mimeType) {
    const byteCharacters = atob(base64);
    const byteArrays = [];

    for (let offset = 0; offset < byteCharacters.length; offset += 512) {
      const slice = byteCharacters.slice(offset, offset + 512);
      const byteNumbers = new Array(slice.length);

      for (let i = 0; i < slice.length; i++) {
        byteNumbers[i] = slice.charCodeAt(i);
      }

      const byteArray = new Uint8Array(byteNumbers);
      byteArrays.push(byteArray);
    }

    return new Blob(byteArrays, { type: mimeType });
  }

  /**
   * Set progress callback
   */
  setProgressCallback(callback) {
    this.onProgressCallback = callback;
  }

  /**
   * Get current status
   */
  getStatus() {
    return {
      isPlaying: this.isPlaying,
      isPaused: this.isPaused,
      selectedVoice: this.selectedVoice
    };
  }
}

// Create singleton instance
window.googleCloudTTS = window.googleCloudTTS || new GoogleCloudTTS();
