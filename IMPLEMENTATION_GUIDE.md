# Listen Up! Implementation Guide

## Overview

This guide provides a complete overview of how Listen Up! Podcast Converter is implemented, including the Firebase AI Logic integration, Google Cloud Text-to-Speech, and SSML processing.

---

## Project Structure

```
listen-up-podcast-converter/
├── manifest.json                     # Extension manifest (Manifest V3)
├── popup.html                        # Main UI
├── offscreen.html                    # Firebase offscreen document
├── offscreen-bundle-v2.js            # Bundled Firebase SDK (152KB)
│
├── css/
│   └── popup.css                    # UI styling
│
├── js/
│   ├── popup.js                     # UI controller & event handlers
│   ├── background.js                # Service worker (message forwarding)
│   ├── content.js                   # Content script (minimal)
│   ├── contentExtractor.js          # Page content extraction
│   ├── pipelineOrchestrator.js      # AI pipeline coordinator
│   ├── aiServiceHybrid.js           # AI service wrapper
│   ├── transcriptHandler.js         # Script formatting & history
│   ├── googleCloudTTS.js            # Google Cloud TTS client
│   ├── ttsService.js                # Browser TTS (legacy)
│   └── firebase-config.js           # Firebase configuration
│
├── src/
│   └── offscreen-firebase.js        # Firebase SDK source (before bundling)
│
├── icons/
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
│
└── docs/
    ├── AI_PIPELINE.md               # Architecture documentation
    ├── DEBUGGING.md                 # Troubleshooting guide
    ├── IMPLEMENTATION_GUIDE.md      # This file
    ├── CLAUDE.md                    # Development guidelines
    └── README.md                    # User documentation
```

---

## Core Components

### 1. Extension Manifest (`manifest.json`)

**Manifest V3** configuration with required permissions:

```json
{
  "manifest_version": 3,
  "name": "Listen Up! Podcast Converter",
  "version": "0.1.0",
  "permissions": [
    "storage",           // Store settings & history
    "downloads",         // Download generated scripts
    "activeTab",         // Access current tab content
    "scripting"          // Inject content extractors
  ],
  "host_permissions": [
    "http://*/*",        // Access HTTP pages
    "https://*/*"        // Access HTTPS pages
  ],
  "background": {
    "service_worker": "js/background.js"
  },
  "action": {
    "default_popup": "popup.html"
  }
}
```

### 2. Firebase Offscreen Document (`src/offscreen-firebase.js`)

**Purpose**: Isolated document for Firebase SDK initialization and AI processing.

**Why Offscreen?**
- Firebase SDK requires `<script>` tags (not allowed in service workers)
- Avoids Content Security Policy (CSP) violations
- Provides isolated context for API calls

**Key Features**:
```javascript
// Firebase initialization
const firebaseConfig = {
  apiKey: "AIzaSyAlWiCOhkKqnAe7capXZ4MXQxt0yrq6cOU",
  projectId: "web-to-podcast-chromeextension",
  // ...
};

const app = initializeApp(firebaseConfig);
const ai = getAI(app, { backend: new GoogleAIBackend() });
const model = getGenerativeModel(ai, { model: "gemini-2.5-flash" });
```

**Message Handlers**:
- `ping` - Health check
- `summarizeContent` - Calls Gemini for summarization
- `rewriteConversational` - Calls Gemini for script generation
- `synthesizeSpeech` - Calls Google Cloud TTS API

**Bundle Process**:
```bash
# src/offscreen-firebase.js → offscreen-bundle-v2.js
npx esbuild src/offscreen-firebase.js \
  --bundle \
  --outfile=offscreen-bundle-v2.js \
  --format=esm
```

### 3. AI Service Hybrid (`js/aiServiceHybrid.js`)

**Purpose**: Wrapper for Firebase AI Logic SDK calls.

**Architecture**:
```
aiServiceHybrid.js
    ↓ chrome.runtime.sendMessage
background.js (service worker)
    ↓ forwards to offscreen
offscreen-firebase.js
    ↓ calls Firebase AI
Gemini 2.5 Flash API
```

**Key Methods**:

#### Initialize
```javascript
async initialize() {
  const response = await chrome.runtime.sendMessage({ action: 'ping' });
  return {
    onDevice: false,  // Using cloud
    cloud: response.aiInitialized
  };
}
```

#### Summarize
```javascript
async summarizeContent(text, options = {}) {
  const response = await chrome.runtime.sendMessage({
    action: 'summarizeContent',
    text: text,
    length: options.length || 'short',
    format: options.format || 'key-points'
  });

  return {
    summary: response.summary,
    source: 'cloud (Gemini 2.5 Flash)'
  };
}
```

#### Rewrite
```javascript
async rewriteConversational(text, options = {}) {
  const response = await chrome.runtime.sendMessage({
    action: 'rewriteConversational',
    text: text,
    difficulty: options.difficulty || 'medium',
    style: options.style || 'conversational'
  });

  return {
    text: response.text,
    source: 'cloud (Gemini 2.5 Flash)'
  };
}
```

### 4. Google Cloud TTS (`js/googleCloudTTS.js`)

**Purpose**: High-quality text-to-speech using Neural2 voices.

**API**: Google Cloud Text-to-Speech REST API

**Key Features**:
```javascript
class GoogleCloudTTS {
  constructor() {
    this.voices = {
      'en-US-Neural2-F': { name: 'Female 3 (US)', language: 'en-US' },
      // ... 12 more Neural2 voices
    };
  }

  async synthesizeSpeech(text, options = {}) {
    // Send to offscreen document
    const response = await chrome.runtime.sendMessage({
      action: 'synthesizeSpeech',
      text: text,
      voiceName: options.voiceId,
      languageCode: voice.language
    });

    return response.audioContent; // Base64 MP3
  }

  async speak(text, options = {}) {
    const audioContent = await this.synthesizeSpeech(text, options);
    const audioBlob = this.base64ToBlob(audioContent, 'audio/mp3');
    const audioUrl = URL.createObjectURL(audioBlob);

    this.audio = new Audio(audioUrl);
    await this.audio.play();
  }
}
```

### 5. SSML Conversion (`src/offscreen-firebase.js`)

**Purpose**: Convert formatted scripts to clean speech-ready text.

**Process**:
```javascript
function convertScriptToSSML(text) {
  let ssml = text;

  // Remove ALL parenthetical content (music cues, sound effects)
  ssml = ssml.replace(/\([^)]*\)/g, ' ');

  // Remove ALL square bracket content (placeholders)
  ssml = ssml.replace(/\[[^\]]*\]/g, ' ');

  // Convert **bold** to <emphasis> with prosody
  ssml = ssml.replace(/\*\*([^*]+)\*\*/g,
    '<emphasis level="strong"><prosody pitch="+2st">$1</prosody></emphasis>');

  // Remove asterisks
  ssml = ssml.replace(/\*/g, '');

  // Remove speaker labels
  ssml = ssml.replace(/^[Hh]ost:\s*/gm, '');

  // Add emotional prosody based on punctuation
  ssml = ssml.replace(/([^.!?]+!)/g,
    '<prosody pitch="+1st" rate="105%">$1</prosody>');
  ssml = ssml.replace(/([^.!?]+\?)/g,
    '<prosody pitch="+2st">$1</prosody>');

  // Structure with paragraphs and breaks
  let paragraphs = ssml.split(/\n\s*\n+/)
    .map(p => '<p>' + p.trim() + '</p>');

  ssml = paragraphs.join('\n<break time="600ms"/>\n');

  return '<speak>\n' + ssml + '\n</speak>';
}
```

**Example**:
```
Input:
**(Intro Music fades in)**
**Host:** Welcome to the show! Today we're discussing **AI**.

Output:
<speak>
<p>Welcome to the show<prosody pitch="+1st" rate="105%">!</prosody> Today we're discussing <emphasis level="strong"><prosody pitch="+2st">AI</prosody></emphasis>.</p>
</speak>
```

### 6. Pipeline Orchestrator (`js/pipelineOrchestrator.js`)

**Purpose**: Coordinate the entire conversion pipeline.

**Pipeline Steps**:
```javascript
async generatePodcastScript(options, onProgress) {
  // Step 1: Extract content
  const content = await this.extractFromCurrentPage();

  // Step 2: Initialize AI
  const aiStatus = await this.aiService.initialize();

  // Step 3: Summarize
  const summary = await this.aiService.summarizeContent(
    content.text,
    { length: options.length }
  );

  // Step 4: Rewrite conversationally
  const script = await this.aiService.rewriteConversational(
    summary,
    { difficulty: options.difficulty }
  );

  // Step 5: Format & save
  const transcript = this.transcriptHandler.formatTranscript(script, metadata);
  await this.transcriptHandler.saveToHistory(script, metadata);

  return { success: true, script, transcript, metadata };
}
```

**Progress Tracking**:
```javascript
this.updateProgress(onProgress, {
  step: 3,
  total: 5,
  status: 'summarizing',
  message: 'Analyzing and summarizing content...'
});
```

### 7. Content Extractor (`js/contentExtractor.js`)

**Purpose**: Extract clean, readable content from web pages.

**Features**:
- Removes ads, navigation, scripts
- Preserves article structure
- Extracts metadata (title, author, date)
- Validates content quality

```javascript
class ContentExtractor {
  extract() {
    const article = this.findMainArticle();
    const cleanText = this.cleanHTML(article);

    return {
      text: cleanText,
      title: document.title,
      url: window.location.href,
      wordCount: cleanText.split(/\s+/).length,
      validation: this.validate(cleanText)
    };
  }
}
```

---

## Data Flow

### Complete Message Flow

```
1. User clicks "Convert This Page"
   popup.js → pipelineOrchestrator.generatePodcastScript()

2. Extract content from page
   pipelineOrchestrator → chrome.scripting.executeScript()
   → contentExtractor.extract() (runs in page context)
   → returns content object

3. Summarize content
   pipelineOrchestrator → aiServiceHybrid.summarizeContent()
   → chrome.runtime.sendMessage({ action: 'summarizeContent' })
   → background.js forwards to offscreen
   → offscreen-firebase.js calls Gemini API
   → returns summary

4. Rewrite as podcast script
   aiServiceHybrid.rewriteConversational()
   → chrome.runtime.sendMessage({ action: 'rewriteConversational' })
   → background.js forwards to offscreen
   → offscreen-firebase.js calls Gemini API with system prompt
   → returns podcast script

5. Display script
   pipelineOrchestrator → transcriptHandler.formatTranscript()
   → popup.js displays in UI

6. User clicks "Play Audio"
   popup.js → googleCloudTTS.speak(script)
   → chrome.runtime.sendMessage({ action: 'synthesizeSpeech' })
   → background.js forwards to offscreen
   → offscreen-firebase.js:
      • Converts script to SSML (removes formatting)
      • Calls Google Cloud TTS REST API
      • Returns base64 MP3
   → googleCloudTTS converts to Audio element
   → Plays in browser
```

---

## Key Technologies

### Chrome Extension APIs
- **Manifest V3**: Modern extension architecture
- **Service Worker**: background.js (message router)
- **Content Scripts**: contentExtractor.js (page injection)
- **Offscreen Documents**: offscreen.html (Firebase isolation)
- **chrome.storage**: Settings and history persistence
- **chrome.scripting**: Dynamic content injection

### Firebase Services
- **Firebase SDK**: App initialization
- **Firebase App Check**: Security (debug mode)
- **Firebase AI Logic**: Gemini 2.5 Flash integration
- **Cloud Functions**: (planned for TTS proxy)

### Google Cloud APIs
- **Gemini 2.5 Flash**: AI summarization & rewriting
- **Text-to-Speech**: Neural2 voices (MP3 generation)

### Build Tools
- **esbuild**: Bundle Firebase SDK for offscreen document
- **npm**: Dependency management

---

## Development Workflow

### Setup

```bash
# Install dependencies
npm install

# Build offscreen bundle
npx esbuild src/offscreen-firebase.js \
  --bundle \
  --outfile=offscreen-bundle-v2.js \
  --format=esm

# Load extension in Chrome
# 1. Go to chrome://extensions/
# 2. Enable "Developer mode"
# 3. Click "Load unpacked"
# 4. Select project directory
```

### Making Changes

**If editing `src/offscreen-firebase.js`:**
```bash
# Rebuild bundle
npx esbuild src/offscreen-firebase.js \
  --bundle \
  --outfile=offscreen-bundle-v2.js \
  --format=esm

# Reload extension
# chrome://extensions/ → Click reload icon
```

**If editing other JS files:**
```bash
# Just reload extension
# chrome://extensions/ → Click reload icon
```

**If editing HTML/CSS:**
```bash
# Reload extension
# Close and reopen popup
```

### Testing

**Test Content Extraction:**
```javascript
// In popup console
const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
const result = await chrome.scripting.executeScript({
  target: { tabId: tab.id },
  function: () => window.contentExtractor.extract()
});
console.log(result[0].result);
```

**Test AI Summarization:**
```javascript
// In popup console
const response = await chrome.runtime.sendMessage({
  action: 'summarizeContent',
  text: 'Your test text here',
  length: 'short'
});
console.log(response);
```

**Test TTS:**
```javascript
// In popup console
await window.googleCloudTTS.speak('Hello, this is a test.');
```

### Debugging

**Three Consoles:**
1. **Popup**: Right-click popup → Inspect
2. **Service Worker**: chrome://extensions/ → "service worker"
3. **Offscreen**: chrome://extensions/ → "offscreen.html"

**Check offscreen logs for:**
- Firebase initialization
- Gemini API calls
- SSML conversion
- TTS synthesis

---

## API Configuration

### Firebase Setup

1. **Create Firebase project** at console.firebase.google.com
2. **Add web app** to project
3. **Copy config** to `src/offscreen-firebase.js`
4. **Enable AI Logic** in Firebase Console
5. **Set enforcement** to "Unenforced" for development

### Google Cloud TTS Setup

1. **Enable API** at console.cloud.google.com
2. **Create API key** for Text-to-Speech
3. **Add to code** in `src/offscreen-firebase.js`
4. **Set restrictions**:
   - API: Cloud Text-to-Speech API
   - Application: HTTP referrers (optional)

---

## Build Process

### Production Build Checklist

- [ ] Update version in `manifest.json`
- [ ] Rebuild offscreen bundle: `npx esbuild src/offscreen-firebase.js --bundle --outfile=offscreen-bundle-v2.js --format=esm`
- [ ] Test all features (content extraction, AI generation, TTS)
- [ ] Check console for errors
- [ ] Test on multiple websites
- [ ] Verify SSML conversion (no formatting in audio)
- [ ] Check API quotas and usage

### Deployment

**For Chrome Web Store:**
```bash
# 1. Create zip file
zip -r listen-up-v0.1.0.zip . \
  -x "*.git*" \
  -x "*node_modules*" \
  -x "*lib*" \
  -x "*.DS_Store*" \
  -x "*src*"

# 2. Upload to Chrome Web Store Developer Dashboard
# 3. Fill in store listing
# 4. Submit for review
```

---

## Performance Optimization

### Bundle Size
- Offscreen bundle: ~152KB (Firebase SDK + dependencies)
- Total extension: ~500KB uncompressed

### API Calls
- Summarization: 2-4 seconds
- Rewrite: 3-6 seconds
- TTS synthesis: 1-3 seconds
- **Total: 7-15 seconds** for full pipeline

### Caching
- Scripts stored in `chrome.storage.local` (history)
- No caching of API responses (always fresh)
- TTS audio generated on-demand

---

## Security Considerations

### API Keys
- **Firebase API Key**: Restricted to Firebase services
- **TTS API Key**: Restricted to Text-to-Speech only
- Both keys included in code (acceptable for free tier)
- Production: Move to backend proxy via Cloud Functions

### Content Security Policy
- Offscreen document has permissive CSP for Firebase
- Popup has strict CSP (no inline scripts)
- Service worker has no CSP (isolated context)

### Data Privacy
- Content sent to Google Cloud (Firebase/Gemini) for processing
- No data stored on servers
- History stored locally only
- No tracking or analytics

---

## Troubleshooting

See [DEBUGGING.md](DEBUGGING.md) for detailed troubleshooting guide.

**Quick fixes:**
- **No AI**: Check Firebase Console → AI Logic set to "Unenforced"
- **TTS fails**: Enable Text-to-Speech API in Google Cloud Console
- **Reads formatting**: Reload extension to clear cache
- **Slow**: Normal for first request (cold start)

---

## Future Improvements

### Planned
1. **Backend Proxy**: Firebase Cloud Functions for TTS API calls
2. **Multi-speaker**: Different voices for dialogue
3. **Background Music**: Add intro/outro music
4. **Batch Conversion**: Process multiple articles
5. **Export MP3**: Download audio files with metadata

### Ideas
- Offline mode with cached scripts
- Integration with podcast platforms
- Custom voice training
- Multi-language support
- RSS feed generation

---

## Contributing

### Code Style
- ES6+ JavaScript
- Async/await for asynchronous code
- Clear variable names
- Comments for complex logic

### Commit Messages
```
<type>: <description>

Types:
- feat: New feature
- fix: Bug fix
- docs: Documentation
- style: Formatting
- refactor: Code restructuring
- test: Tests
- chore: Maintenance
```

### Pull Request Process
1. Fork repository
2. Create feature branch
3. Make changes
4. Test thoroughly
5. Submit PR with description

---

## Resources

- [Firebase AI Logic Documentation](https://firebase.google.com/docs/ai)
- [Google Cloud TTS Documentation](https://cloud.google.com/text-to-speech/docs)
- [Chrome Extensions Documentation](https://developer.chrome.com/docs/extensions/mv3/)
- [SSML Reference](https://cloud.google.com/text-to-speech/docs/ssml)

---

## License

MIT License - see LICENSE file

## Contact

For questions or support:
- GitHub Issues
- Email (add your email)
- Documentation: README.md, CLAUDE.md, AI_PIPELINE.md
