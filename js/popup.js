/**
 * Popup UI Controller
 * Manages the extension popup interface and AI pipeline integration
 */

// DOM Elements
const aiStatusIndicator = document.getElementById('ai-indicator');
const aiStatusText = document.getElementById('ai-status-text');
const convertPageBtn = document.getElementById('convert-page-btn');
const convertUrlBtn = document.getElementById('convert-url-btn');
const podcastUrlInput = document.getElementById('podcast-url');
const difficultySelect = document.getElementById('difficulty-select');
const lengthSelect = document.getElementById('length-select');
const statusMessage = document.getElementById('status-message');
const progressBar = document.getElementById('progress-bar');
const progressFill = progressBar.querySelector('.progress-fill');
const resultSection = document.getElementById('result-section');
const scriptStats = document.getElementById('script-stats');
const scriptPreview = document.getElementById('script-preview');
const historyList = document.getElementById('history-list');
const downloadMdBtn = document.getElementById('download-md-btn');
const downloadTxtBtn = document.getElementById('download-txt-btn');
const downloadHtmlBtn = document.getElementById('download-html-btn');
const copyBtn = document.getElementById('copy-btn');
const tabBtns = document.querySelectorAll('.tab-btn');

// State (use var to avoid redeclaration errors in popup context)
var aiService;
var contentExtractor;
var transcriptHandler;
var pipelineOrchestrator;
var currentResult = null;
var isInitialized = false;

/**
 * Initialize the popup
 */
async function initialize() {
  // Prevent double initialization
  if (isInitialized) {
    console.log('Already initialized, skipping...');
    return;
  }

  try {
    console.log('Initializing popup...');
    isInitialized = true;

    // Load scripts in the page context if needed
    await loadServices();

    // Check AI availability
    await checkAIStatus();

    // Setup event listeners
    setupEventListeners();

    // Load and display history
    await displayHistory();

    // Load saved settings
    await loadSettings();
  } catch (error) {
    console.error('Initialization error:', error);
    showStatus('Failed to initialize extension: ' + error.message, 'error');
  }
}

/**
 * Load AI services
 */
async function loadServices() {
  // Services are loaded via script tags in popup.html
  // We just need to access the global instances
  if (typeof window.hybridAIService !== 'undefined') {
    aiService = window.hybridAIService;
    contentExtractor = window.contentExtractor;
    transcriptHandler = window.transcriptHandler;
    pipelineOrchestrator = window.pipelineOrchestrator;

    // Initialize orchestrator with services
    pipelineOrchestrator.initialize(aiService, contentExtractor, transcriptHandler);
  } else {
    console.error('AI services not loaded');
    showAIStatus('error', 'Failed to load AI services');
  }
}

/**
 * Check AI availability status
 */
async function checkAIStatus() {
  try {
    showAIStatus('checking', 'Checking AI availability...');

    console.log('Starting AI availability check...');

    // Initialize hybrid AI service
    const aiStatus = await aiService.initialize();
    console.log('AI initialization completed:', aiStatus);

    if (aiStatus.onDevice || aiStatus.cloud) {
      const source = aiStatus.onDevice ? 'On-device (Gemini Nano)' : 'Cloud (Gemini 2.5 Flash)';
      showAIStatus('ready', `AI ready: ${source}`);
    } else {
      showAIStatus('error', 'No AI service available');
      console.warn('AI not available. Details:', aiStatus);

      // Show helpful message to user
      showStatus(
        'Chrome AI features not available. See console for details.',
        'error'
      );
    }
  } catch (error) {
    console.error('Error checking AI status:', error);
    showAIStatus('error', 'AI check failed - See console');

    // Show detailed error info
    if (error.message === 'AI check timeout') {
      console.error('AI availability check timed out after 5 seconds');
      console.error('This usually means:');
      console.error('1. Chrome version is too old (need 127+)');
      console.error('2. AI flags are not enabled in chrome://flags');
      console.error('3. AI APIs are not supported on this device');
    }

    showStatus('AI features unavailable - Check browser console', 'error');
  }
}

/**
 * Show AI status
 */
function showAIStatus(status, message) {
  aiStatusIndicator.className = `status-indicator ${status}`;
  aiStatusText.textContent = message;
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
  // Tab switching
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.tab;
      switchTab(tab);
    });
  });

  // Convert buttons
  convertPageBtn.addEventListener('click', () => convertCurrentPage());
  convertUrlBtn.addEventListener('click', () => convertFromURL());

  // Download buttons
  downloadMdBtn.addEventListener('click', () => downloadScript('md'));
  downloadTxtBtn.addEventListener('click', () => downloadScript('txt'));
  downloadHtmlBtn.addEventListener('click', () => downloadScript('html'));
  copyBtn.addEventListener('click', () => copyToClipboard());

  // TTS buttons
  const playTTSBtn = document.getElementById('play-tts-btn');
  const pauseTTSBtn = document.getElementById('pause-tts-btn');
  const stopTTSBtn = document.getElementById('stop-tts-btn');

  if (playTTSBtn) {
    playTTSBtn.addEventListener('click', () => playTTS());
  }
  if (pauseTTSBtn) {
    pauseTTSBtn.addEventListener('click', () => pauseTTS());
  }
  if (stopTTSBtn) {
    stopTTSBtn.addEventListener('click', () => stopTTS());
  }

  // Settings change
  difficultySelect.addEventListener('change', saveSettings);
  lengthSelect.addEventListener('change', saveSettings);
}

/**
 * Switch tabs
 */
function switchTab(tabName) {
  tabBtns.forEach(btn => {
    if (btn.dataset.tab === tabName) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  document.querySelectorAll('.tab-content').forEach(content => {
    if (content.id === `${tabName}-tab`) {
      content.classList.remove('hidden');
    } else {
      content.classList.add('hidden');
    }
  });
}

/**
 * Convert current page to podcast script
 */
async function convertCurrentPage() {
  const settings = {
    source: 'current-page',
    difficulty: difficultySelect.value,
    length: lengthSelect.value
  };

  await runConversion(settings);
}

/**
 * Convert from URL
 */
async function convertFromURL() {
  const url = podcastUrlInput.value.trim();

  if (!url) {
    showStatus('Please enter a URL', 'error');
    return;
  }

  if (!isValidUrl(url)) {
    showStatus('Please enter a valid URL', 'error');
    return;
  }

  const settings = {
    source: 'url',
    url: url,
    difficulty: difficultySelect.value,
    length: lengthSelect.value
  };

  await runConversion(settings);
}

/**
 * Run the conversion pipeline
 */
async function runConversion(settings) {
  try {
    // Disable buttons
    convertPageBtn.disabled = true;
    convertUrlBtn.disabled = true;

    // Hide result section
    resultSection.style.display = 'none';

    // Show progress
    showProgress(true);
    showStatus('Starting conversion...', 'info');

    // Run pipeline
    const result = await pipelineOrchestrator.generatePodcastScript(
      settings,
      (progress) => {
        // Update UI based on progress
        updateProgress(progress);
      }
    );

    if (result.success) {
      currentResult = result;
      showStatus('Conversion complete!', 'success');
      displayResult(result);
      await displayHistory(); // Refresh history
    } else {
      showStatus(result.error || 'Conversion failed', 'error');
    }

  } catch (error) {
    console.error('Conversion error:', error);
    showStatus('Error: ' + error.message, 'error');
  } finally {
    convertPageBtn.disabled = false;
    convertUrlBtn.disabled = false;
    showProgress(false);
  }
}

/**
 * Update progress based on pipeline status
 */
function updateProgress(progress) {
  const progressPercent = ((progress.step || 0) / (progress.total || 5)) * 100;
  progressFill.style.width = progressPercent + '%';

  showStatus(progress.message, 'info');

  // Update AI status if needed
  if (progress.status === 'downloading-model') {
    showAIStatus('downloading', progress.message);
  } else if (progress.status === 'ai-ready') {
    showAIStatus('ready', 'AI ready');
  }
}

/**
 * Display conversion result
 */
function displayResult(result) {
  // Show result section
  resultSection.style.display = 'block';

  // Display stats
  const stats = result.stats;
  scriptStats.innerHTML = `
    <div class="stat-item">
      <span class="stat-label">Word Count:</span>
      <span class="stat-value">${stats.wordCount}</span>
    </div>
    <div class="stat-item">
      <span class="stat-label">Reading Time:</span>
      <span class="stat-value">~${stats.readingTime} min</span>
    </div>
    <div class="stat-item">
      <span class="stat-label">Paragraphs:</span>
      <span class="stat-value">${stats.paragraphCount}</span>
    </div>
    <div class="stat-item">
      <span class="stat-label">Sentences:</span>
      <span class="stat-value">${stats.sentenceCount}</span>
    </div>
  `;

  // Display preview (first 500 characters)
  const preview = result.script.substring(0, 500) + (result.script.length > 500 ? '...' : '');
  scriptPreview.textContent = preview;

  // Scroll to result
  resultSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

/**
 * Download script
 */
async function downloadScript(format) {
  if (!currentResult) {
    showStatus('No script available to download', 'error');
    return;
  }

  try {
    await pipelineOrchestrator.downloadScript(format);
    showStatus(`Downloaded as .${format}`, 'success');
  } catch (error) {
    console.error('Download error:', error);
    showStatus('Download failed: ' + error.message, 'error');
  }
}

/**
 * Copy to clipboard
 */
async function copyToClipboard() {
  if (!currentResult) {
    showStatus('No script available to copy', 'error');
    return;
  }

  try {
    await pipelineOrchestrator.copyToClipboard('md');
    showStatus('Copied to clipboard!', 'success');
  } catch (error) {
    console.error('Copy error:', error);
    showStatus('Copy failed: ' + error.message, 'error');
  }
}

/**
 * Display history
 */
async function displayHistory() {
  try {
    const history = await pipelineOrchestrator.getHistory();

    if (history.length === 0) {
      historyList.innerHTML = '<p class="empty-state">No scripts generated yet</p>';
      return;
    }

    historyList.innerHTML = history.map(item => {
      const date = new Date(item.timestamp);
      const shortTitle = item.title.length > 50 ? item.title.substring(0, 50) + '...' : item.title;

      return `
        <div class="history-item" data-id="${item.id}">
          <div class="history-item-title">${shortTitle}</div>
          <div class="history-item-meta">
            <span>${item.difficulty} • ${item.length}</span>
            <span>${date.toLocaleDateString()}</span>
          </div>
        </div>
      `;
    }).join('');

    // Add click handlers to history items
    document.querySelectorAll('.history-item').forEach(item => {
      item.addEventListener('click', async () => {
        const id = parseInt(item.dataset.id);
        await loadFromHistory(id);
      });
    });

  } catch (error) {
    console.error('Error displaying history:', error);
  }
}

/**
 * Load from history
 */
async function loadFromHistory(id) {
  try {
    showStatus('Loading from history...', 'info');

    const result = await pipelineOrchestrator.loadFromHistory(id);

    currentResult = {
      success: true,
      script: result.script,
      metadata: result.metadata,
      stats: result.stats
    };

    displayResult(currentResult);
    showStatus('Loaded from history', 'success');

  } catch (error) {
    console.error('Error loading from history:', error);
    showStatus('Failed to load from history', 'error');
  }
}

/**
 * Show status message
 */
function showStatus(message, type) {
  statusMessage.textContent = message;
  statusMessage.className = `status-message ${type}`;

  if (type === 'success') {
    setTimeout(() => {
      statusMessage.className = 'status-message';
    }, 3000);
  }
}

/**
 * Show/hide progress bar
 */
function showProgress(show) {
  if (show) {
    progressBar.style.display = 'block';
    progressFill.style.width = '0%';
  } else {
    progressFill.style.width = '100%';
    setTimeout(() => {
      progressBar.style.display = 'none';
    }, 500);
  }
}

/**
 * Validate URL
 */
function isValidUrl(string) {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
}

/**
 * Save settings
 */
async function saveSettings() {
  const settings = {
    difficulty: difficultySelect.value,
    length: lengthSelect.value
  };

  await chrome.storage.local.set({ userSettings: settings });
}

/**
 * Load settings
 */
async function loadSettings() {
  const result = await chrome.storage.local.get('userSettings');
  if (result.userSettings) {
    difficultySelect.value = result.userSettings.difficulty || 'medium';
    lengthSelect.value = result.userSettings.length || 'medium';
  }
}

/**
 * Play TTS
 */
async function playTTS() {
  if (!currentResult || !currentResult.script) {
    showStatus('No script available to play', 'error');
    return;
  }

  try {
    // Get selected voice
    const voiceSelect = document.getElementById('voice-select');
    const selectedVoice = voiceSelect ? voiceSelect.value : 'en-US-Neural2-F';

    // Show TTS controls
    document.getElementById('play-tts-btn').style.display = 'none';
    document.getElementById('pause-tts-btn').style.display = 'inline-block';
    document.getElementById('stop-tts-btn').style.display = 'inline-block';
    document.getElementById('tts-progress').style.display = 'block';

    // Set up progress callback for Google Cloud TTS
    window.googleCloudTTS.setProgressCallback((progress) => {
      const progressFill = document.getElementById('tts-progress-fill');
      const statusText = document.getElementById('tts-status');

      progressFill.style.width = `${progress.progress || 0}%`;

      if (progress.status === 'synthesizing') {
        statusText.textContent = 'Synthesizing speech with Google Cloud...';
      } else if (progress.status === 'playing') {
        statusText.textContent = 'Playing... (Google Cloud TTS)';
        document.getElementById('pause-tts-btn').textContent = '⏸ Pause';
      } else if (progress.status === 'paused') {
        statusText.textContent = 'Paused';
        document.getElementById('pause-tts-btn').textContent = '▶ Resume';
      } else if (progress.status === 'ended') {
        statusText.textContent = 'Finished';
        // Reset controls
        setTimeout(() => resetTTSControls(), 1000);
      } else if (progress.status === 'error') {
        statusText.textContent = `Error: ${progress.error}`;
        showStatus('TTS error: ' + progress.error, 'error');
        resetTTSControls();
      }
    });

    // Set the voice
    window.googleCloudTTS.setVoice(selectedVoice);

    // Play the script with Google Cloud TTS
    await window.googleCloudTTS.speak(currentResult.script, {
      voiceId: selectedVoice
    });

  } catch (error) {
    console.error('TTS error:', error);
    showStatus('TTS failed: ' + error.message, 'error');
    resetTTSControls();
  }
}

/**
 * Pause/Resume TTS
 */
function pauseTTS() {
  const status = window.googleCloudTTS.getStatus();
  if (status.isPaused) {
    window.googleCloudTTS.resume();
  } else {
    window.googleCloudTTS.pause();
  }
}

/**
 * Stop TTS
 */
function stopTTS() {
  window.googleCloudTTS.stop();
  resetTTSControls();
}

/**
 * Reset TTS controls to initial state
 */
function resetTTSControls() {
  document.getElementById('play-tts-btn').style.display = 'inline-block';
  document.getElementById('pause-tts-btn').style.display = 'none';
  document.getElementById('stop-tts-btn').style.display = 'none';
  document.getElementById('tts-progress').style.display = 'none';
  document.getElementById('tts-progress-fill').style.width = '0%';
}

// Initialize when popup loads
document.addEventListener('DOMContentLoaded', initialize);
