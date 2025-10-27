# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Listen Up! Podcast Converter is a browser extension built with Manifest V3 for Chrome, Edge, and Firefox. The extension converts podcast audio files to different formats (MP3, M4A, OGG) and provides a user-friendly interface for managing conversions.

## Architecture

### Extension Components

This is a standard Manifest V3 browser extension with the following key components:

1. **Popup UI** (`popup.html` + `css/popup.css` + `js/popup.js`)
   - Main user interface opened when clicking the extension icon
   - Handles user input for podcast URLs and format selection
   - Displays conversion status and history
   - Communicates with the service worker via `chrome.runtime.sendMessage()`

2. **Service Worker** (`js/background.js`)
   - Background script that handles the core conversion logic
   - Listens for messages from the popup via `chrome.runtime.onMessage`
   - Manages extension lifecycle events (install, update)
   - Currently contains placeholder conversion logic that needs implementation

3. **Content Script** (`js/content.js`)
   - Runs on all web pages (as specified in manifest.json)
   - Detects podcast audio elements on pages
   - Can extract podcast URLs and titles from page content
   - Injects functionality into visited web pages

### Data Flow

```
User Input (popup.html)
    ↓
Popup Script (popup.js) sends message
    ↓
Service Worker (background.js) receives message
    ↓
Conversion Logic (to be implemented)
    ↓
Response back to Popup
    ↓
UI Update + History Storage
```

## Development Commands

### Testing the Extension

**Chrome/Edge:**
```bash
# Navigate to chrome://extensions/
# Enable "Developer mode"
# Click "Load unpacked"
# Select the listen-up-podcast-converter directory
```

**Firefox:**
```bash
# Navigate to about:debugging#/runtime/this-firefox
# Click "Load Temporary Add-on"
# Select manifest.json from the directory
```

### Debugging

- **Popup**: Right-click the extension icon → "Inspect popup"
- **Service Worker**: Go to `chrome://extensions/` → Click "service worker" link under the extension
- **Content Script**: Open DevTools on any web page and check the Console

### File Structure

```
listen-up-podcast-converter/
├── manifest.json          # Extension configuration and permissions
├── popup.html            # Main UI structure
├── css/
│   └── popup.css        # Popup styling
├── js/
│   ├── popup.js         # UI logic and user interactions
│   ├── background.js    # Service worker (background processing)
│   └── content.js       # Page interaction and podcast detection
├── icons/               # Extension icons (16, 48, 128 px)
├── LICENSE              # MIT License
├── README.md            # User documentation
└── CLAUDE.md            # This file
```

## Key Implementation Areas

### 1. Conversion Logic (js/background.js)

The `handleConversion()` function in `background.js` currently simulates conversion. To implement actual conversion:
- Consider using Web Audio API for client-side processing
- Or integrate with an external API service for server-side conversion
- Handle different input formats (MP3, M4A, OGG, AAC)
- Implement proper error handling for network failures and invalid files

### 2. Storage Pattern

The extension uses `chrome.storage.local` for persistence:
- **History**: Array of conversion records (max 10 items)
- **Settings**: User preferences (default format, auto-download)

Access pattern:
```javascript
// Save
await chrome.storage.local.set({ key: value });

// Load
const result = await chrome.storage.local.get('key');
```

### 3. Message Passing

Communication between popup and service worker:
```javascript
// Popup sends
const response = await chrome.runtime.sendMessage({
  action: 'convertPodcast',
  url: url,
  format: format
});

// Background receives
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'convertPodcast') {
    // Handle request
    sendResponse({ success: true });
  }
  return true; // Keep channel open for async
});
```

## Extension Permissions

- `storage`: Store conversion history and user settings
- `downloads`: Initiate file downloads after conversion
- `activeTab`: Access current tab to detect podcast content
- `host_permissions`: Access HTTP/HTTPS URLs for fetching podcast files

## Common Tasks

### Adding a New Feature

1. Update UI in `popup.html` if needed
2. Add styling to `css/popup.css`
3. Implement logic in appropriate script:
   - User interaction → `js/popup.js`
   - Background processing → `js/background.js`
   - Page detection → `js/content.js`
4. Update permissions in `manifest.json` if required

### Testing Changes

1. Make code changes
2. Go to `chrome://extensions/`
3. Click the refresh icon on the extension card
4. Test the updated functionality

### Debugging Issues

- Check service worker logs in `chrome://extensions/`
- Inspect popup with DevTools
- Check content script console in page DevTools
- Verify manifest.json permissions and file paths

## Security Considerations

- Always validate user-provided URLs before processing
- Sanitize any content from external sources
- Follow CSP (Content Security Policy) restrictions
- Don't store sensitive data in local storage

## Future Enhancements

- Implement actual audio conversion using Web Audio API or external service
- Add proper icon assets
- Create settings page for advanced configuration
- Support batch conversion of multiple podcasts
- Add audio quality/bitrate selection
- Integrate with popular podcast platforms (Spotify, Apple Podcasts, etc.)
- Implement download progress tracking
