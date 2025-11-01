/**
 * Pipeline Orchestrator
 * Coordinates the entire AI pipeline for podcast script generation
 */

class PipelineOrchestrator {
  constructor() {
    this.aiService = null;
    this.contentExtractor = null;
    this.transcriptHandler = null;
    this.isProcessing = false;
    this.currentScript = null;
    this.currentMetadata = null;
  }

  /**
   * Initialize with service instances
   */
  initialize(aiService, contentExtractor, transcriptHandler) {
    this.aiService = aiService;
    this.contentExtractor = contentExtractor;
    this.transcriptHandler = transcriptHandler;
  }

  /**
   * Generate podcast script from current page or URL
   * @param {Object} options - Configuration options
   * @param {Function} onProgress - Progress callback
   * @returns {Object} Result with script and metadata
   */
  async generatePodcastScript(options = {}, onProgress = null) {
    if (this.isProcessing) {
      throw new Error('Pipeline is already processing. Please wait.');
    }

    this.isProcessing = true;

    try {
      const {
        source = 'current-page', // 'current-page' or 'url'
        url = null,
        difficulty = 'medium',
        length = 'medium'
      } = options;

      // Step 1: Extract content
      this.updateProgress(onProgress, {
        step: 1,
        total: 5,
        status: 'extracting',
        message: 'Extracting content from page...'
      });

      let content;
      if (source === 'current-page') {
        content = await this.extractFromCurrentPage();
      } else if (source === 'url' && url) {
        content = await this.extractFromURL(url);
      } else {
        throw new Error('Invalid source or missing URL');
      }

      // Validate content
      if (!content.validation.valid) {
        throw new Error(`Content validation failed: ${content.validation.issues.join(', ')}`);
      }

      this.updateProgress(onProgress, {
        step: 1,
        total: 5,
        status: 'extracted',
        message: `Extracted ${content.wordCount} words`,
        data: { wordCount: content.wordCount }
      });

      // Step 2: Initialize AI
      this.updateProgress(onProgress, {
        step: 2,
        total: 5,
        status: 'checking-ai',
        message: 'Initializing AI...'
      });

      const aiStatus = await this.aiService.initialize();

      if (!aiStatus.onDevice && !aiStatus.cloud) {
        throw new Error('No AI service available (neither on-device nor cloud)');
      }

      const aiSource = aiStatus.onDevice ? 'on-device (Gemini Nano)' : 'cloud (Gemini 2.5 Flash)';

      this.updateProgress(onProgress, {
        step: 2,
        total: 5,
        status: 'ai-ready',
        message: `AI ready: ${aiSource}`
      });

      // Step 3: Summarize content
      this.updateProgress(onProgress, {
        step: 3,
        total: 5,
        status: 'summarizing',
        message: 'Analyzing and summarizing content...'
      });

      const summaryResult = await this.summarizeContent(
        content.text,
        { length },
        onProgress
      );

      const summary = summaryResult.summary;
      const summarySource = summaryResult.source;

      // Show user-friendly message based on AI source
      const userMessage =
        summarySource === 'chrome-builtin-summarizer-api' ? 'Summary complete (Chrome Summarizer API - Privacy-preserving)' :
        summarySource === 'chrome-builtin-prompt-api' ? 'Summary complete (Chrome Prompt API - Privacy-preserving)' :
        'Summary complete (Firebase AI)';

      this.updateProgress(onProgress, {
        step: 3,
        total: 5,
        status: 'summarized',
        message: userMessage,
        data: { summaryLength: summary.split(/\s+/).length, source: summarySource }
      });

      // Step 4: Rewrite conversationally
      this.updateProgress(onProgress, {
        step: 4,
        total: 5,
        status: 'rewriting',
        message: 'Transforming into podcast script...'
      });

      const scriptResult = await this.aiService.rewriteConversational(
        summary,
        { difficulty: difficulty, style: 'conversational' }
      );

      const script = scriptResult.text;
      const scriptSource = scriptResult.source;

      this.updateProgress(onProgress, {
        step: 4,
        total: 5,
        status: 'rewritten',
        message: `Script generated (${scriptSource})`,
        data: { scriptLength: script.split(/\s+/).length, source: scriptSource }
      });

      // Step 5: Format and finalize
      this.updateProgress(onProgress, {
        step: 5,
        total: 5,
        status: 'formatting',
        message: 'Formatting transcript...'
      });

      const metadata = {
        title: content.title,
        url: content.url,
        author: content.author,
        publishDate: content.publishDate,
        difficulty: difficulty,
        length: length
      };

      const transcript = this.transcriptHandler.formatTranscript(script, metadata);
      const stats = this.transcriptHandler.getStatistics(script);

      // Save to history
      await this.transcriptHandler.saveToHistory(script, metadata);

      this.updateProgress(onProgress, {
        step: 5,
        total: 5,
        status: 'complete',
        message: 'Complete!',
        data: stats
      });

      // Store current results
      this.currentScript = script;
      this.currentMetadata = metadata;

      return {
        success: true,
        script: script,
        transcript: transcript,
        metadata: metadata,
        stats: stats
      };

    } catch (error) {
      console.error('Pipeline error:', error);

      this.updateProgress(onProgress, {
        status: 'error',
        message: error.message
      });

      return {
        success: false,
        error: error.message
      };

    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Extract content from current page
   * @returns {Object} Extracted content
   */
  async extractFromCurrentPage() {
    // Always extract from the active tab (not the popup)
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    // Inject content extractor if not already present
    try {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['js/contentExtractor.js']
      });
    } catch (e) {
      // Script might already be injected, that's okay
      console.log('Content extractor already injected or error:', e.message);
    }

    // Extract content from the active tab
    const result = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      function: () => {
        if (window.contentExtractor) {
          return window.contentExtractor.extract();
        } else {
          throw new Error('Content extractor not loaded');
        }
      }
    });

    return result[0].result;
  }

  /**
   * Extract content from URL
   * @param {string} url - URL to extract from
   * @returns {Object} Extracted content
   */
  async extractFromURL(url) {
    // Create a new tab, extract content, then close it
    const tab = await chrome.tabs.create({ url: url, active: false });

    // Wait for page to load
    await new Promise((resolve) => {
      chrome.tabs.onUpdated.addListener(function listener(tabId, info) {
        if (tabId === tab.id && info.status === 'complete') {
          chrome.tabs.onUpdated.removeListener(listener);
          resolve();
        }
      });
    });

    // Extract content
    const result = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      function: () => {
        return window.contentExtractor.extract();
      }
    });

    // Close the tab
    await chrome.tabs.remove(tab.id);

    return result[0].result;
  }

  /**
   * Summarize content with chunking support for long text
   * Uses Chrome's built-in Summarizer API first (for hackathon requirement),
   * then falls back to Firebase AI Logic if unavailable
   *
   * @param {string} text - Text to summarize
   * @param {Object} settings - Settings
   * @param {Function} onProgress - Progress callback
   * @returns {Object} Summary result with source
   */
  async summarizeContent(text, settings, onProgress) {
    const MAX_CHUNK_SIZE = 4000;

    // Try Chrome's built-in AI APIs first (Gemini Nano on-device)
    // Supports both Summarizer API and Prompt API for hackathon compatibility
    try {
      // Method 1: Try Summarizer API (preferred)
      if (window.ai && window.ai.summarizer) {
        console.log('🤖 Attempting Chrome built-in Summarizer API (Gemini Nano)...');

        const canSummarize = await window.ai.summarizer.capabilities();

        if (canSummarize && canSummarize.available !== 'no') {
          // Create summarizer with appropriate settings
          const summarizerOptions = {
            type: 'key-points', // or 'tl;dr', 'teaser', 'headline'
            format: 'markdown',
            length: settings.length === 'short' ? 'short' :
                    settings.length === 'long' ? 'long' : 'medium'
          };

          const summarizer = await window.ai.summarizer.create(summarizerOptions);

          // Truncate if text is too long
          const textToSummarize = text.length <= MAX_CHUNK_SIZE ?
            text : text.substring(0, MAX_CHUNK_SIZE);

          console.log('✅ Using Chrome Summarizer API (on-device Gemini Nano)');
          const summary = await summarizer.summarize(textToSummarize);

          // Destroy summarizer to free resources
          summarizer.destroy();

          return {
            summary: summary,
            source: 'chrome-builtin-summarizer-api' // For hackathon requirement
          };
        } else {
          console.log('⚠️ Chrome Summarizer API not ready (status:', canSummarize?.available, ')');
        }
      }

      // Method 2: Try Prompt API (alternative Chrome built-in AI)
      if (window.ai && window.ai.languageModel) {
        console.log('🤖 Attempting Chrome built-in Prompt API (Gemini Nano)...');

        const canPrompt = await window.ai.languageModel.capabilities();

        if (canPrompt && canPrompt.available !== 'no') {
          const session = await window.ai.languageModel.create({
            systemPrompt: 'You are a helpful assistant that summarizes articles into key points.'
          });

          // Truncate if text is too long
          const textToSummarize = text.length <= MAX_CHUNK_SIZE ?
            text : text.substring(0, MAX_CHUNK_SIZE);

          const lengthGuide = settings.length === 'short' ? '3-5 bullet points' :
                             settings.length === 'long' ? '10-15 bullet points' : '6-8 bullet points';

          const prompt = `Summarize the following article into ${lengthGuide} in markdown format:\n\n${textToSummarize}`;

          console.log('✅ Using Chrome Prompt API (on-device Gemini Nano)');
          const summary = await session.prompt(prompt);

          // Destroy session to free resources
          session.destroy();

          return {
            summary: summary,
            source: 'chrome-builtin-prompt-api' // For hackathon requirement
          };
        } else {
          console.log('⚠️ Chrome Prompt API not ready (status:', canPrompt?.available, ')');
        }
      }

      console.log('⚠️ No Chrome built-in AI available, falling back to Firebase AI');

    } catch (error) {
      console.warn('❌ Chrome built-in AI failed, falling back to Firebase:', error.message);
    }

    // Fallback to Firebase AI Logic (existing implementation)
    console.log('🔄 Using Firebase AI Logic for summarization...');

    if (text.length <= MAX_CHUNK_SIZE) {
      return await this.aiService.summarizeContent(
        text,
        { length: settings.length, format: 'key-points' }
      );
    }

    // Handle long content by chunking
    // For now, just truncate to MAX_CHUNK_SIZE
    // TODO: Implement proper chunking and merging
    console.warn('Content too long, truncating to', MAX_CHUNK_SIZE, 'characters');
    const truncated = text.substring(0, MAX_CHUNK_SIZE);

    return await this.aiService.summarizeContent(
      truncated,
      { length: settings.length, format: 'key-points' }
    );
  }

  /**
   * Update progress
   * @param {Function} callback - Progress callback
   * @param {Object} progress - Progress information
   */
  updateProgress(callback, progress) {
    if (callback && typeof callback === 'function') {
      callback(progress);
    }
  }

  /**
   * Download current script
   * @param {string} format - File format ('md', 'txt', 'html')
   */
  async downloadScript(format = 'md') {
    if (!this.currentScript || !this.currentMetadata) {
      throw new Error('No script available to download');
    }

    this.transcriptHandler.downloadTranscript(
      this.currentScript,
      this.currentMetadata,
      format
    );
  }

  /**
   * Copy current script to clipboard
   * @param {string} format - Format ('md', 'txt')
   */
  async copyToClipboard(format = 'md') {
    if (!this.currentScript || !this.currentMetadata) {
      throw new Error('No script available to copy');
    }

    await this.transcriptHandler.copyToClipboard(
      this.currentScript,
      this.currentMetadata,
      format
    );
  }

  /**
   * Get conversion history
   * @returns {Array} History entries
   */
  async getHistory() {
    return await this.transcriptHandler.getHistory();
  }

  /**
   * Load script from history
   * @param {number} entryId - History entry ID
   */
  async loadFromHistory(entryId) {
    const history = await this.getHistory();
    const entry = history.find(e => e.id === entryId);

    if (!entry) {
      throw new Error('History entry not found');
    }

    this.currentScript = entry.script;
    this.currentMetadata = {
      title: entry.title,
      url: entry.url,
      difficulty: entry.difficulty,
      length: entry.length
    };

    return {
      script: entry.script,
      metadata: this.currentMetadata,
      stats: this.transcriptHandler.getStatistics(entry.script)
    };
  }

  /**
   * Cancel current processing
   */
  cancel() {
    if (this.isProcessing) {
      // Cancel any ongoing operations
      this.isProcessing = false;
    }
  }

  /**
   * Reset pipeline state
   */
  reset() {
    this.cancel();
    this.currentScript = null;
    this.currentMetadata = null;
  }
}

// Export singleton instance (use window to avoid redeclaration)
if (typeof window !== 'undefined') {
  window.pipelineOrchestrator = window.pipelineOrchestrator || new PipelineOrchestrator();
}
