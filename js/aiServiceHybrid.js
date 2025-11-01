/**
 * Hybrid AI Service
 * Automatically uses Chrome's on-device AI (Gemini Nano) when available,
 * falls back to Firebase AI Logic SDK (Gemini 2.5 Flash cloud) when needed
 */

class HybridAIService {
  constructor() {
    this.onDeviceAvailable = false;
    this.cloudAvailable = false;
    this.summarizer = null;
    this.languageModel = null;
    this.initialized = false;
  }

  /**
   * Initialize both on-device and cloud AI
   */
  async initialize() {
    console.log('🔄 Initializing Hybrid AI Service...');

    // Check on-device AI availability
    await this.checkOnDeviceAvailability();

    // Check cloud AI availability (via offscreen document)
    await this.checkCloudAvailability();

    this.initialized = true;
    console.log(`✅ Hybrid AI initialized - On-device: ${this.onDeviceAvailable}, Cloud: ${this.cloudAvailable}`);

    return {
      onDevice: this.onDeviceAvailable,
      cloud: this.cloudAvailable
    };
  }

  /**
   * Check if Chrome's on-device AI is available
   */
  async checkOnDeviceAvailability() {
    try {
      // Check for Chrome 138+ API
      if ('Summarizer' in self) {
        const availability = await self.Summarizer.availability();
        this.onDeviceAvailable = (availability === 'readily');
        console.log(`📱 On-device Summarizer: ${availability}`);
      }

      if ('LanguageModel' in self) {
        const availability = await self.LanguageModel.availability();
        console.log(`📱 On-device LanguageModel: ${availability}`);
      }
    } catch (error) {
      console.log('⚠️ On-device AI not available:', error.message);
      this.onDeviceAvailable = false;
    }
  }

  /**
   * Check if Firebase cloud AI is available
   */
  async checkCloudAvailability() {
    try {
      const response = await chrome.runtime.sendMessage({
        action: 'ping'
      });

      this.cloudAvailable = response && response.success && response.modelInitialized;
      console.log(`☁️ Cloud AI available: ${this.cloudAvailable}`);
    } catch (error) {
      console.log('⚠️ Cloud AI not available:', error.message);
      this.cloudAvailable = false;
    }
  }

  /**
   * Summarize content - tries on-device first, falls back to cloud
   */
  async summarizeContent(text, options = {}) {
    const { length = 'medium', format = 'plain-text' } = options;

    console.log(`🔄 Summarizing content (length: ${length}, format: ${format})...`);

    // Try on-device first
    if (this.onDeviceAvailable) {
      try {
        console.log('📱 Using on-device summarization...');
        const summary = await this.summarizeOnDevice(text, length, format);
        console.log('✅ On-device summarization successful');
        return {
          summary,
          source: 'on-device'
        };
      } catch (error) {
        console.log('⚠️ On-device summarization failed, falling back to cloud:', error.message);
      }
    }

    // Fall back to cloud
    if (this.cloudAvailable) {
      try {
        console.log('☁️ Using cloud summarization...');
        const summary = await this.summarizeCloud(text, length, format);
        console.log('✅ Cloud summarization successful');
        return {
          summary,
          source: 'cloud'
        };
      } catch (error) {
        console.error('❌ Cloud summarization failed:', error);
        throw new Error('Both on-device and cloud summarization failed');
      }
    }

    throw new Error('No AI service available');
  }

  /**
   * On-device summarization using Chrome's Gemini Nano
   */
  async summarizeOnDevice(text, length, format) {
    const summarizer = await self.Summarizer.create({
      type: format === 'key-points' ? 'key-points' : 'tl;dr',
      format: 'plain-text',
      length: length,
      outputLanguage: 'en'
    });

    const summary = await summarizer.summarize(text);
    summarizer.destroy();
    return summary;
  }

  /**
   * Cloud summarization using Firebase AI Logic SDK
   */
  async summarizeCloud(text, length, format) {
    const response = await chrome.runtime.sendMessage({
      action: 'summarizeContent',
      text: text,
      length: length,
      format: format
    });

    if (!response.success) {
      throw new Error(response.error);
    }

    return response.summary;
  }

  /**
   * Rewrite content in conversational style - tries on-device first, falls back to cloud
   */
  async rewriteConversational(text, options = {}) {
    const { difficulty = 'medium', style = 'conversational' } = options;

    console.log(`🔄 Rewriting content (difficulty: ${difficulty}, style: ${style})...`);

    // Try on-device first (if LanguageModel is available)
    if (this.onDeviceAvailable && 'LanguageModel' in self) {
      try {
        console.log('📱 Using on-device language model...');
        const rewritten = await this.rewriteOnDevice(text, difficulty, style);
        console.log('✅ On-device rewrite successful');
        return {
          text: rewritten,
          source: 'on-device'
        };
      } catch (error) {
        console.log('⚠️ On-device rewrite failed, falling back to cloud:', error.message);
      }
    }

    // Fall back to cloud
    if (this.cloudAvailable) {
      try {
        console.log('☁️ Using cloud rewrite...');
        const rewritten = await this.rewriteCloud(text, difficulty, style);
        console.log('✅ Cloud rewrite successful');
        return {
          text: rewritten,
          source: 'cloud'
        };
      } catch (error) {
        console.error('❌ Cloud rewrite failed:', error);
        throw new Error('Both on-device and cloud rewrite failed');
      }
    }

    throw new Error('No AI service available');
  }

  /**
   * On-device conversational rewrite using Chrome's Language Model
   */
  async rewriteOnDevice(text, difficulty, style) {
    const languageModel = await self.LanguageModel.create({
      temperature: 0.7,
      topK: 3
    });

    let prompt = `Rewrite the following content as an engaging podcast script. `;

    if (difficulty === 'easy') {
      prompt += 'Use simple language suitable for beginners. Explain technical terms. ';
    } else if (difficulty === 'medium') {
      prompt += 'Use moderate complexity. Balance accessibility with depth. ';
    } else if (difficulty === 'hard') {
      prompt += 'Use advanced language. Assume expert audience. ';
    }

    if (style === 'narrative') {
      prompt += 'Use a storytelling narrative style. ';
    } else if (style === 'educational') {
      prompt += 'Use an educational teaching style. ';
    } else if (style === 'conversational') {
      prompt += 'Use a casual conversational style. ';
    }

    prompt += `Make it sound natural for audio listening.\n\nContent:\n${text}`;

    const rewritten = await languageModel.prompt(prompt);
    languageModel.destroy();
    return rewritten;
  }

  /**
   * Cloud conversational rewrite using Firebase AI Logic SDK
   */
  async rewriteCloud(text, difficulty, style) {
    const response = await chrome.runtime.sendMessage({
      action: 'rewriteConversational',
      text: text,
      difficulty: difficulty,
      style: style
    });

    if (!response.success) {
      throw new Error(response.error);
    }

    return response.text;
  }

  /**
   * Get AI availability status
   */
  getStatus() {
    return {
      initialized: this.initialized,
      onDevice: this.onDeviceAvailable,
      cloud: this.cloudAvailable,
      preferredSource: this.onDeviceAvailable ? 'on-device' : 'cloud'
    };
  }
}

// Create singleton instance
window.hybridAIService = window.hybridAIService || new HybridAIService();
