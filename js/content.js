// Content script for Listen Up! Podcast Converter
// Runs on web pages to detect and interact with podcast content

(function() {
  'use strict';

  console.log('Listen Up! Podcast Converter content script loaded');

  // Detect podcast audio elements on the page
  function detectPodcastAudio() {
    const audioElements = document.querySelectorAll('audio');
    const audioSources = [];

    audioElements.forEach(audio => {
      const src = audio.src || audio.currentSrc;
      if (src && isPodcastAudio(src)) {
        audioSources.push({
          url: src,
          title: getAudioTitle(audio)
        });
      }
    });

    return audioSources;
  }

  // Check if URL looks like podcast audio
  function isPodcastAudio(url) {
    const podcastPatterns = [
      /\.mp3$/i,
      /\.m4a$/i,
      /\.ogg$/i,
      /podcast/i,
      /audio/i
    ];

    return podcastPatterns.some(pattern => pattern.test(url));
  }

  // Get audio title from nearby elements
  function getAudioTitle(audioElement) {
    // Try to find title in parent elements
    let parent = audioElement.parentElement;
    let depth = 0;

    while (parent && depth < 5) {
      const title = parent.querySelector('h1, h2, h3, h4, .title, .podcast-title');
      if (title) {
        return title.textContent.trim();
      }
      parent = parent.parentElement;
      depth++;
    }

    return 'Unknown Podcast';
  }

  // Listen for messages from popup or background
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'detectPodcasts') {
      const podcasts = detectPodcastAudio();
      sendResponse({ podcasts: podcasts });
    }
  });

  // Detect podcasts on page load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      const podcasts = detectPodcastAudio();
      if (podcasts.length > 0) {
        console.log('Detected podcasts:', podcasts);
      }
    });
  } else {
    const podcasts = detectPodcastAudio();
    if (podcasts.length > 0) {
      console.log('Detected podcasts:', podcasts);
    }
  }

})();
