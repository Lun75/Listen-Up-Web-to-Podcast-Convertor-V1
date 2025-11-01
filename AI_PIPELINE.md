# Listen Up! AI Pipeline Architecture

## Overview

Listen Up! Podcast Converter uses Firebase AI Logic SDK (Gemini 2.5 Flash) for cloud-based AI processing and Google Cloud Text-to-Speech for high-quality voice synthesis. This document details the complete AI-powered pipeline for converting web content into natural-sounding podcast audio.

## Current Architecture

```
Web Content
    ↓
[1] Content Extraction & Validation
    ↓
[2] Firebase AI Logic (Gemini 2.5 Flash)
    ├─→ Summarization
    └─→ Conversational Rewrite
    ↓
[3] Script Formatting & Display
    ↓
[4] SSML Conversion (for TTS)
    ↓
[5] Google Cloud Text-to-Speech (Neural2 Voices)
    ↓
Audio Playback
```

---

## Components

### 1. Content Extraction (`js/contentExtractor.js`)

**Purpose**: Extract clean, readable content from web pages.

**Features**:
- Removes ads, navigation, footers, scripts
- Preserves article structure (headings, paragraphs)
- Extracts metadata (title, author, publish date, URL)
- Validates content quality (minimum word count, readability)

**Implementation**:
```javascript
class ContentExtractor {
  extract() {
    return {
      text: cleanText,
      title: pageTitle,
      author: authorName,
      publishDate: date,
      url: currentURL,
      wordCount: words.length,
      validation: {
        valid: true,
        issues: []
      }
    };
  }
}
```

**Validation Checks**:
- Minimum 100 words
- Contains meaningful paragraphs
- Not a blocked content type (login pages, error pages)

---

### 2. Hybrid AI Service (`js/aiServiceHybrid.js`)

**Purpose**: Orchestrate AI processing with Firebase AI Logic SDK.

**Backend**: Cloud-based (Firebase AI Logic with Gemini 2.5 Flash)

**Key Methods**:

#### 2.1 Summarization
```javascript
async summarizeContent(text, options = {}) {
  const response = await chrome.runtime.sendMessage({
    action: 'summarizeContent',
    text: text,
    length: options.length || 'short',
    format: options.format || 'key-points'
  });

  return response.summary;
}
```

**Length Options**:
- `short`: Concise summary (200-300 words)
- `medium`: Balanced summary (400-600 words)
- `long`: Detailed summary (800-1000 words)

**Format Options**:
- `key-points`: Bullet-style key points
- `paragraph`: Flowing paragraph format
- `tl;dr`: Very brief summary

#### 2.2 Conversational Rewrite
```javascript
async rewriteConversational(text, options = {}) {
  const response = await chrome.runtime.sendMessage({
    action: 'rewriteConversational',
    text: text,
    difficulty: options.difficulty || 'medium',
    style: options.style || 'conversational'
  });

  return response.text;
}
```

**Difficulty Levels**:
- `easy`: Simple language, beginner-friendly
- `medium`: Balanced complexity
- `hard`: Advanced, technical language

**Style Options**:
- `conversational`: Casual, engaging tone
- `narrative`: Storytelling approach
- `educational`: Teaching-focused

---

### 3. Firebase Offscreen Document (`src/offscreen-firebase.js`)

**Purpose**: Isolated context for Firebase SDK and AI processing.

**Why Offscreen?**
- Firebase SDK requires special initialization
- Avoids CSP (Content Security Policy) issues
- Separates AI processing from UI

**Configuration**:
```javascript
const firebaseConfig = {
  apiKey: "AIzaSyAlWiCOhkKqnAe7capXZ4MXQxt0yrq6cOU",
  authDomain: "web-to-podcast-chromeextension.firebaseapp.com",
  projectId: "web-to-podcast-chromeextension",
  // ... other config
};
```

**AI Model**: Gemini 2.5 Flash
- Fast, efficient cloud-based model
- Optimized for conversational generation
- Low latency (typically 2-5 seconds)

**Message Handling**:
```javascript
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'summarizeContent') {
    // Call Gemini API for summarization
  }

  if (message.action === 'rewriteConversational') {
    // Call Gemini API for rewriting
  }

  if (message.action === 'synthesizeSpeech') {
    // Call Google Cloud TTS API
  }
});
```

---

### 4. Google Cloud Text-to-Speech (`js/googleCloudTTS.js`)

**Purpose**: Convert scripts to natural-sounding speech using Neural2 voices.

**API**: Google Cloud Text-to-Speech REST API

**Voice Options** (13 Neural2 voices):

**US English**:
- `en-US-Neural2-A` - Male 1
- `en-US-Neural2-C` - Female 1
- `en-US-Neural2-D` - Male 2
- `en-US-Neural2-E` - Female 2
- `en-US-Neural2-F` - Female 3 (default, most natural)
- `en-US-Neural2-G` - Female 4
- `en-US-Neural2-H` - Female 5
- `en-US-Neural2-I` - Male 3
- `en-US-Neural2-J` - Male 4

**UK English**:
- `en-GB-Neural2-A` - Female
- `en-GB-Neural2-B` - Male

**Australian English**:
- `en-AU-Neural2-A` - Female
- `en-AU-Neural2-B` - Male

**Implementation**:
```javascript
class GoogleCloudTTS {
  async synthesizeSpeech(text, options = {}) {
    // Convert script to SSML
    const ssmlText = convertScriptToSSML(text);

    // Call Google Cloud TTS API
    const response = await chrome.runtime.sendMessage({
      action: 'synthesizeSpeech',
      text: text,
      voiceName: options.voiceId,
      languageCode: options.language
    });

    // Returns base64 encoded MP3
    return response.audioContent;
  }
}
```

---

### 5. SSML Conversion (`src/offscreen-firebase.js`)

**Purpose**: Convert formatted scripts to Speech Synthesis Markup Language for natural TTS.

**Why SSML?**
- Removes unreadable formatting (asterisks, music cues, speaker labels)
- Adds natural pauses between sections
- Emphasizes important words
- Improves speech prosody based on punctuation

**Conversion Rules**:

```javascript
function convertScriptToSSML(text) {
  // Remove music cues: (Intro Music) → removed
  // Remove speaker labels: **Host:** → removed
  // Remove placeholders: [Your Name] → removed

  // Convert **bold** → <emphasis level="strong">
  // Convert *italic* → <emphasis level="moderate">

  // Add pauses at paragraph breaks
  // Structure with <speak> and <p> tags

  return ssmlText;
}
```

**Example Conversion**:

**Original Script**:
```
**(Intro Music fades in)**

**Host:** Welcome to Tech Talk! Today we're discussing **Nvidia's** amazing new deal.

---

Let's dive in...
```

**SSML Output**:
```xml
<speak>
  <p>Welcome to Tech Talk! Today we're discussing <emphasis level="strong">Nvidia's</emphasis> amazing new deal.</p>
  <break time="600ms"/>
  <p>Let's dive in...</p>
</speak>
```

**Prosody Enhancements**:
- Exclamations (`!`) → Higher pitch, faster rate (excitement)
- Questions (`?`) → Rising intonation (inquisitive)
- Paragraph breaks → 600ms pauses
- Separator lines (`---`) → 800ms pauses

---

## Complete Pipeline Flow

### Pipeline Orchestrator (`js/pipelineOrchestrator.js`)

```javascript
class PipelineOrchestrator {
  async generatePodcastScript(options, onProgress) {
    // Step 1: Extract content
    onProgress({ step: 1, status: 'extracting', message: 'Extracting content...' });
    const content = await this.extractFromCurrentPage();

    // Validate
    if (!content.validation.valid) {
      throw new Error('Content validation failed');
    }

    // Step 2: Initialize AI
    onProgress({ step: 2, status: 'checking-ai', message: 'Initializing AI...' });
    const aiStatus = await this.aiService.initialize();

    // Step 3: Summarize
    onProgress({ step: 3, status: 'summarizing', message: 'Analyzing content...' });
    const summary = await this.aiService.summarizeContent(content.text, {
      length: options.length
    });

    // Step 4: Rewrite conversationally
    onProgress({ step: 4, status: 'rewriting', message: 'Generating script...' });
    const script = await this.aiService.rewriteConversational(summary, {
      difficulty: options.difficulty,
      style: 'conversational'
    });

    // Step 5: Format & save
    onProgress({ step: 5, status: 'formatting', message: 'Formatting...' });
    const transcript = this.transcriptHandler.formatTranscript(script, metadata);
    await this.transcriptHandler.saveToHistory(script, metadata);

    onProgress({ step: 5, status: 'complete', message: 'Complete!' });

    return { success: true, script, transcript, metadata };
  }
}
```

### Message Flow Architecture

```
popup.js (UI)
    ↓ chrome.runtime.sendMessage
background.js (Service Worker)
    ↓ forwards to offscreen
offscreen-firebase.js (Firebase SDK)
    ↓ calls Gemini API / Google Cloud TTS
    ↓ returns result
background.js
    ↓ forwards response
popup.js (displays/plays)
```

---

## Error Handling

### AI Service Errors
```javascript
try {
  const result = await aiService.summarizeContent(text);
} catch (error) {
  if (error.message.includes('quota')) {
    // Handle quota exceeded
    showError('API quota exceeded. Please try again later.');
  } else if (error.message.includes('network')) {
    // Handle network errors
    showError('Network error. Please check your connection.');
  } else {
    // Generic error
    showError('AI processing failed: ' + error.message);
  }
}
```

### TTS Errors
```javascript
try {
  await googleCloudTTS.speak(script);
} catch (error) {
  if (error.message.includes('API has not been used')) {
    showError('Google Cloud TTS API not enabled. Please enable it in Google Cloud Console.');
  } else if (error.message.includes('blocked')) {
    showError('API key restrictions blocking TTS. Check Google Cloud Console.');
  }
}
```

---

## Performance Metrics

### Processing Times (typical article, ~1000 words):
- **Content Extraction**: < 100ms
- **Summarization (Gemini)**: 2-4 seconds
- **Conversational Rewrite (Gemini)**: 3-6 seconds
- **SSML Conversion**: < 50ms
- **TTS Synthesis**: 1-3 seconds
- **Total Pipeline**: 7-15 seconds

### Audio Quality:
- **Format**: MP3
- **Voice Type**: Neural2 (Google's highest quality)
- **Sample Rate**: 24kHz
- **Bitrate**: 64kbps

### API Quotas (Free Trial):
- **Firebase/Gemini**: Included in Firebase trial
- **Google Cloud TTS**: $4 per 1 million characters
- **Free Trial Credit**: £224.12 (91 days)

---

## Security & Privacy

### API Keys
- Firebase API Key: Included in code (restricted in Google Cloud Console)
- Google Cloud TTS API Key: Separate key, restricted to TTS only
- Keys are restricted by:
  - Application restrictions (Chrome extensions only)
  - API restrictions (only allowed APIs can be called)

### Data Flow
- Content extracted locally in browser
- Sent to Google Cloud (Firebase/Gemini) for AI processing
- TTS synthesis happens on Google Cloud
- Audio returned to browser for playback
- No data stored on servers
- History stored locally in `chrome.storage.local`

### Content Policy
- Respects page content and copyright
- Clear attribution to source URLs
- No storage of copyrighted content
- Only temporary processing for audio generation

---

## Future Enhancements

### Planned Features
1. **Firebase Cloud Functions** - Proxy TTS API calls for better security
2. **Multi-speaker Support** - Different voices for dialogue/narration
3. **Background Music** - Add intro/outro music to podcasts
4. **Batch Processing** - Convert multiple articles at once
5. **Custom Voices** - Train custom voice models
6. **Export Options** - Download as MP3 with metadata

### Potential Improvements
- Caching frequently converted articles
- Progressive audio streaming
- Offline mode with cached scripts
- Integration with podcast platforms
- RSS feed generation

---

## Testing

### Manual Testing Checklist
- [ ] Content extraction from various sites
- [ ] AI summarization accuracy
- [ ] Script quality and naturalness
- [ ] TTS voice quality
- [ ] SSML conversion correctness
- [ ] Error handling (API failures, network issues)
- [ ] Browser compatibility (Chrome, Edge)

### Test Cases
1. **Short article** (< 500 words)
2. **Long article** (> 2000 words)
3. **Technical content** (code, jargon)
4. **Listicles** (numbered/bulleted lists)
5. **News articles** (time-sensitive content)

---

## Troubleshooting

### Common Issues

**"No AI service available"**
- Solution: Check Firebase Console → AI Logic is set to "Unenforced"

**"TTS API not enabled"**
- Solution: Enable Cloud Text-to-Speech API in Google Cloud Console

**"API key restrictions blocking"**
- Solution: Go to Google Cloud Console → API Credentials → Edit key → Add "Cloud Text-to-Speech API" to allowed APIs

**TTS reads asterisks/formatting**
- Solution: Reload extension to clear cache (SSML conversion should remove formatting)

**Poor voice quality**
- Solution: Try different Neural2 voices or adjust speaking rate

---

## References

### Documentation
- [Firebase AI Logic SDK](https://firebase.google.com/docs/ai)
- [Google Cloud Text-to-Speech](https://cloud.google.com/text-to-speech/docs)
- [SSML Reference](https://cloud.google.com/text-to-speech/docs/ssml)
- [Chrome Extensions Manifest V3](https://developer.chrome.com/docs/extensions/mv3/)

### API Endpoints
- Firebase AI: `https://firebasevertexai.googleapis.com/`
- Google Cloud TTS: `https://texttospeech.googleapis.com/v1/text:synthesize`

---

## Contact & Contribution

For questions or contributions:
- See `README.md` for user documentation
- See `CLAUDE.md` for development guidelines
- Check `DEBUGGING.md` for troubleshooting
