// Background service worker for Listen Up! Podcast Converter

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'convertPodcast') {
    handleConversion(request.url, request.format)
      .then(result => sendResponse(result))
      .catch(error => sendResponse({ success: false, error: error.message }));
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
