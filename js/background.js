// Background service worker for Listen Up! Podcast Converter

// Offscreen document management
let offscreenCreated = false;

/**
 * Create offscreen document for Firebase App Check
 * This is required because service workers can't run reCAPTCHA Enterprise
 */
async function createOffscreenDocument() {
  if (offscreenCreated) {
    return;
  }

  try {
    // Check if offscreen document already exists
    const existingContexts = await chrome.runtime.getContexts({
      contextTypes: ['OFFSCREEN_DOCUMENT'],
      documentUrls: [chrome.runtime.getURL('offscreen.html')]
    });

    if (existingContexts.length > 0) {
      console.log('📄 Offscreen document already exists');
      offscreenCreated = true;
      return;
    }

    // Create offscreen document
    await chrome.offscreen.createDocument({
      url: 'offscreen.html',
      reasons: ['DOM_SCRAPING'], // Closest reason for Firebase/reCAPTCHA
      justification: 'Firebase App Check requires DOM context for reCAPTCHA Enterprise'
    });

    offscreenCreated = true;
    console.log('✅ Offscreen document created');

    // Initialize Firebase in offscreen context
    const result = await sendMessageToOffscreen({
      action: 'initializeFirebase'
    });

    console.log('📊 Firebase initialization in offscreen:', result);
    if (result && result.success) {
      console.log('✅ Firebase ready!');
    } else {
      console.error('❌ Firebase initialization failed:', result ? result.error : 'No response');
    }

  } catch (error) {
    console.error('❌ Failed to create offscreen document:', error);
    console.error('Error details:', error.message, error.stack);
  }
}

/**
 * Send message to offscreen document
 */
async function sendMessageToOffscreen(message) {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(message, (response) => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        resolve(response);
      }
    });
  });
}

// Initialize offscreen document on startup
createOffscreenDocument();

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'convertPodcast') {
    handleConversion(request.url, request.format)
      .then(result => sendResponse(result))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true; // Keep message channel open for async response
  }

  // Forward AI-related messages to offscreen document
  if (request.action === 'ping' ||
      request.action === 'summarizeContent' ||
      request.action === 'rewriteConversational' ||
      request.action === 'generateContent' ||
      request.action === 'synthesizeSpeech') {

    console.log('🔀 Forwarding message to offscreen:', request.action);
    sendMessageToOffscreen(request)
      .then(result => {
        console.log('📥 Response from offscreen:', result);
        sendResponse(result);
      })
      .catch(error => {
        console.error('❌ Error forwarding to offscreen:', error);
        sendResponse({ success: false, error: error.message });
      });
    return true; // Keep message channel open for async response
  }
});

// Handle podcast conversion
async function handleConversion(url, format) {
  console.log(`Converting podcast from ${url} to ${format}`);

  try {
    // Validate URL
    if (!isValidPodcastUrl(url)) {
      throw new Error('Invalid podcast URL');
    }

    // TODO: Implement actual conversion logic
    // For now, simulate a conversion process
    await simulateConversion();

    // Log success
    console.log('Conversion completed successfully');

    return {
      success: true,
      message: 'Podcast converted successfully'
    };
  } catch (error) {
    console.error('Conversion error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Simulate conversion (placeholder)
function simulateConversion() {
  return new Promise((resolve) => {
    setTimeout(resolve, 2000);
  });
}

// Validate podcast URL
function isValidPodcastUrl(url) {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

// Installation handler
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('Listen Up! Podcast Converter installed');

    // Set default settings
    chrome.storage.local.set({
      settings: {
        defaultFormat: 'mp3',
        autoDownload: true
      },
      history: []
    });
  } else if (details.reason === 'update') {
    console.log('Listen Up! Podcast Converter updated');
  }
});

// Extension icon click handler (optional)
chrome.action.onClicked.addListener((tab) => {
  console.log('Extension icon clicked on tab:', tab.id);
});
