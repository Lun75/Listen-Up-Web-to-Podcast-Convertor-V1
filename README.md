# Listen Up! Web to Podcast Converter V1

> Transform web articles into engaging podcast scripts with AI-powered narration

A Chrome extension that uses **Chrome's built-in Summarizer API** (Gemini Nano on-device), Firebase AI Logic (Gemini 2.5 Flash), and Google Cloud Text-to-Speech to automatically convert web content into natural-sounding podcast audio.

## Chrome Built-in AI Challenge

This extension leverages **Chrome's built-in AI APIs** to provide intelligent content summarization:

- **Chrome Summarizer API** - Uses on-device Gemini Nano for fast, privacy-preserving content summarization
- **Chrome Prompt API** - Alternative on-device AI for text generation and summarization
- **Hybrid AI Architecture** - Combines Chrome's built-in AI with cloud AI for optimal quality
- **Intelligent Fallback** - falls back to Firebase AI Logic for maintaining robust functionality

## Features

- **Chrome Built-in AI** - On-device Gemini Nano for privacy-preserving summarization
- **AI-Powered Script Generation** - Gemini 2.5 Flash creates engaging podcast scripts
- **Neural2 Text-to-Speech** - 13 high-quality voices (US, UK, AU English)
- **SSML Processing** - Natural pauses, emphasis, and intonation
- **Customizable Output** - Adjust difficulty level and length
- **Conversion History** - Track and replay previous conversions
- **Fast Processing** - Complete pipeline in 7-15 seconds

## Instruction

1. Navigate to any article or blog post
2. Click the extension icon
3. Click "Convert This Page"
4. A narrative script shows up
5. Click Play Audio
6. Listen to the generated podcast based on the article or blog post

## Installation

### For End Users (Coming Soon)
Extension will be available on Chrome Web Store

### For Developers

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Lun75/listen-up-podcast-converter.git
   cd listen-up-podcast-converter
   ```
2. **Install dependencies:**
   ```bash
   npm install
   ```
3. **Build the offscreen bundle:**
   ```bash
   npx esbuild src/offscreen-firebase.js \
     --bundle \
     --outfile=offscreen-bundle-v2.js \
     --format=esm
   ```
4. **Load in Chrome:**
   - Open `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the project directory

## Configuration

### Demo API Keys (Included)

The extension includes demo Firebase and Google Cloud API keys for testing:
- **Firebase API Key**: For Gemini AI (included)
- **Google Cloud TTS API Key**: For Neural2 voices (included)

**Important Notes:**
- Demo keys have **limited quota** 
- Keys are restricted to specific APIs only
- **For production use**, create your own Firebase project (see Setup Guide below)

### Setup Your Own Firebase Project (Optional)

See [IMPLEMENTATION_GUIDE.md](IMPLEMENTATION_GUIDE.md) for detailed setup instructions.

### Basic Conversion

1. **Navigate to an article** (blog post, news article, documentation)
2. **Click extension icon** in Chrome toolbar
3. **Click "Convert This Page"** button
4. **Wait 10-15 seconds** for AI processing
5. **Click "Play Audio"** to listen

### Settings

- **Difficulty Level:**
  - Easy: Simple language, beginner-friendly
  - Medium: Balanced complexity
  - Hard: Technical language, advanced

- **Script Length:**
  - Short: 2-4 minute podcast
  - Medium: 5-8 minute podcast
  - Long: 10-15 minute podcast

- **Voice Selection:**
  - 13 Neural2 voices available
  - US, UK, and Australian English
  - Male and female options

### Download & Copy

- **Download Script**: Save as Markdown or TXT
- **Copy to Clipboard**: Quick copy for editing
- **View History**: Access previous conversions

## Architecture

```
Web Content → Content Extraction → Gemini AI (Summarize + Rewrite)
  → SSML Conversion → Google Cloud TTS → Audio Playback
```

**Key Components:**
- **Firebase AI Logic SDK**: Gemini 2.5 Flash for script generation
- **Google Cloud TTS**: Neural2 voices for high-quality audio
- **SSML Processing**: Removes formatting, adds natural pauses
- **Chrome Extension MV3**: Modern extension architecture

See [AI_PIPELINE.md](AI_PIPELINE.md) for detailed architecture documentation.

## Development

### Project Structure

```
listen-up-podcast-converter/
├── manifest.json              # Extension manifest
├── popup.html                 # Main UI
├── offscreen.html            # Firebase offscreen document
├── offscreen-bundle-v2.js    # Bundled Firebase SDK (152KB)
├── js/
│   ├── popup.js              # UI controller
│   ├── background.js         # Service worker
│   ├── aiServiceHybrid.js    # AI service wrapper
│   ├── googleCloudTTS.js     # TTS client
│   ├── pipelineOrchestrator.js  # Pipeline coordinator
│   ├── contentExtractor.js   # Content extraction
│   └── transcriptHandler.js  # Script formatting
├── src/
│   └── offscreen-firebase.js # Firebase SDK source
└── docs/
    ├── AI_PIPELINE.md        # Architecture docs
    ├── DEBUGGING.md          # Troubleshooting
    └── IMPLEMENTATION_GUIDE.md  # Developer guide
```

### Making Changes

**Edit main code:**
```bash
# Make changes to JS files
# Reload extension at chrome://extensions/
```

**Edit Firebase offscreen:**
```bash
# Edit src/offscreen-firebase.js
npx esbuild src/offscreen-firebase.js --bundle --outfile=offscreen-bundle-v2.js --format=esm
# Reload extension
```

### Testing

See [DEBUGGING.md](DEBUGGING.md) for comprehensive testing guide.

**Quick test:**
```javascript
// In popup console
await chrome.runtime.sendMessage({ action: 'ping' })
// Should return: {success: true, firebaseInitialized: true}
```

## Performance

- **Content Extraction**: < 100ms
- **AI Summarization**: 2-4 seconds
- **AI Rewriting**: 3-6 seconds
- **TTS Synthesis**: 1-3 seconds
- **Total Pipeline**: 7-15 seconds

**Bundle Size:**
- Offscreen bundle: 152KB
- Total extension: ~500KB

## Privacy & Security

- **Local Processing**: Content extraction happens in browser
- **Cloud Processing**: AI and TTS via Google Cloud APIs
- **No Data Storage**: Scripts stored locally only
- **No Tracking**: No analytics or user tracking
- **API Keys**: Restricted to specific services only

All content sent to Google Cloud for AI processing is temporary and not stored.

## Troubleshooting

### Common Issues

**"No AI service available"**
- Go to Firebase Console → AI Logic → Set to "Unenforced"

**"TTS API not enabled"**
- Enable Cloud Text-to-Speech API in Google Cloud Console
- Wait 2-3 minutes for propagation

**TTS reads asterisks/formatting**
- Reload extension completely
- Clear browser cache
- Check offscreen console for SSML conversion logs

**Slow performance**
- Normal for first request (cold start)
- Check internet connection
- Very long articles take longer

See [DEBUGGING.md](DEBUGGING.md) for detailed troubleshooting guide.

## Documentation

- **[AI_PIPELINE.md](AI_PIPELINE.md)** - Complete architecture documentation
- **[DEBUGGING.md](DEBUGGING.md)** - Troubleshooting guide
- **[IMPLEMENTATION_GUIDE.md](IMPLEMENTATION_GUIDE.md)** - Developer guide
- **[CLAUDE.md](CLAUDE.md)** - Development guidelines

### Development Guidelines

- Follow existing code style (ES6+, async/await)
- Add comments for complex logic
- Test with multiple websites
- Update documentation if needed
- Rebuild bundle after Firebase changes

### Ideas
- Offline mode with cached scripts
- Custom voice training
- Multi-language support
- RSS feed generation
- Chrome Web Store publication

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Acknowledgments

- **Firebase AI Logic SDK** - Gemini 2.5 Flash integration
- **Google Cloud Text-to-Speech** - Neural2 voices
- **Chrome Extensions Team** - Manifest V3 platform

## Support

- **Issues**: [GitHub Issues](https://github.com/Lun75/listen-up-podcast-converter/issues)
- **Documentation**: See docs
- **Email**: lun7543@gmail.com

## Version History
**v0.1.0** (Current)
- Initial release
- Firebase AI Logic integration
- Google Cloud TTS Neural2 voices
- SSML processing for natural speech
- 13 voice options
- Conversion history
- Download/copy functionality

---

**Note**: This extension uses Google Cloud APIs which have usage quotas. Demo API keys are provided for testing but may have limited availability. For production use, please set up your own Firebase project.

Made with ❤️ by Dialina
