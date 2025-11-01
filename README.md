# Listen Up! Podcast Converter

> Transform web articles into engaging podcast scripts with AI-powered narration

A Chrome extension that uses **Chrome's built-in Summarizer API** (Gemini Nano on-device), Firebase AI Logic (Gemini 2.5 Flash), and Google Cloud Text-to-Speech to automatically convert web content into natural-sounding podcast audio.

## 🏆 Chrome Built-in AI Challenge

This extension leverages **Chrome's built-in AI APIs** to provide intelligent content summarization:

- ✅ **Chrome Summarizer API** - Uses on-device Gemini Nano for fast, privacy-preserving content summarization
- ✅ **Hybrid AI Architecture** - Combines Chrome's built-in AI with cloud AI for optimal quality
- ✅ **Intelligent Fallback** - Gracefully falls back to Firebase AI Logic if built-in AI is unavailable

## ✨ Features

- 🤖 **Chrome Built-in Summarizer API** - On-device Gemini Nano for content summarization (privacy-preserving)
- 🎙️ **Neural2 Text-to-Speech** - 13 high-quality voices (US, UK, AU English)
- 📝 **SSML Processing** - Natural pauses, emphasis, and intonation
- 🎚️ **Customizable Output** - Adjust difficulty level and length
- 📚 **Conversion History** - Track and replay previous conversions
- ⚡ **Fast Processing** - Complete pipeline in 7-15 seconds
- 🔒 **Privacy-First** - On-device summarization with Chrome's built-in AI (when available)

## 🎬 Demo

1. Navigate to any article or blog post
2. Click the extension icon
3. Click "Convert This Page"
4. Listen to AI-generated podcast narration

## 📦 Installation

### For End Users (Coming Soon)
Extension will be available on Chrome Web Store

### For Developers

**Prerequisites:**
- Chrome 127+ (for Chrome built-in AI APIs)
- Or Chrome Canary/Dev channel (for experimental AI features)

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Lun75/Listen-Up-Web-to-Podcast-Convertor-V1.git
   cd Listen-Up-Web-to-Podcast-Convertor-V1
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

4. **Enable Chrome Built-in AI (Required for Summarizer API):**
   - Navigate to `chrome://flags/#optimization-guide-on-device-model`
   - Set to "Enabled BypassPerfRequirement"
   - Navigate to `chrome://flags/#summarization-api-for-gemini-nano`
   - Set to "Enabled"
   - Restart Chrome
   - Chrome will download Gemini Nano model (~1.7GB) in background

5. **Load in Chrome:**
   - Open `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the project directory

### Verifying Chrome Built-in AI Setup

Open browser console (F12) and check:
```javascript
await window.ai.summarizer.capabilities()
// Should return: { available: 'readily' } or { available: 'after-download' }
```

If `available: 'no'`, the built-in AI is not available. Extension will automatically fallback to Firebase AI Logic.

## ⚙️ Configuration

### Demo API Keys (Included)

The extension includes demo Firebase and Google Cloud API keys for testing:
- **Firebase API Key**: For Gemini AI (included)
- **Google Cloud TTS API Key**: For Neural2 voices (included)

⚠️ **Important Notes:**
- Demo keys have **limited quota** (free trial)
- Keys are restricted to specific APIs only
- **For production use**, create your own Firebase project (see Setup Guide below)

### Setup Your Own Firebase Project (Optional)

If you want unlimited usage or the demo keys stop working:

1. **Create Firebase Project:**
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Create new project: "My Podcast Converter"
   - Add a web app

2. **Enable Required Services:**
   - Firebase AI Logic (Gemini)
   - Set enforcement to "Unenforced" (for development)

3. **Enable Google Cloud TTS:**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Enable "Cloud Text-to-Speech API"
   - Create API key
   - Restrict to "Cloud Text-to-Speech API"

4. **Update Configuration:**
   - Edit `src/offscreen-firebase.js`
   - Replace `firebaseConfig` with your config
   - Replace `TTS_API_KEY` with your TTS key
   - Rebuild bundle (step 3 above)

See [IMPLEMENTATION_GUIDE.md](IMPLEMENTATION_GUIDE.md) for detailed setup instructions.

## 🚀 Usage

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

## 🏗️ Architecture

```
Web Content → Content Extraction
  → Chrome Summarizer API (Gemini Nano on-device)
  → Firebase AI Logic (Gemini 2.5 Flash - conversational rewriting)
  → SSML Conversion → Google Cloud TTS → Audio Playback
```

**Key Components:**
- **Chrome Summarizer API**: On-device Gemini Nano for initial content summarization (privacy-preserving, fast)
- **Firebase AI Logic SDK**: Gemini 2.5 Flash for conversational rewriting and fallback summarization
- **Google Cloud TTS**: Neural2 voices for high-quality audio
- **SSML Processing**: Removes formatting, adds natural pauses
- **Chrome Extension MV3**: Modern extension architecture

**Hybrid AI Approach:**
1. **Step 1**: Chrome's built-in Summarizer API condenses article (on-device, private)
2. **Step 2**: Firebase AI Logic rewrites summary in conversational podcast style (cloud, high-quality)
3. **Fallback**: If Chrome API unavailable, Firebase handles both steps

See [AI_PIPELINE.md](AI_PIPELINE.md) for detailed architecture documentation.

## 🛠️ Development

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

## 📊 Performance

- **Content Extraction**: < 100ms
- **AI Summarization**: 2-4 seconds
- **AI Rewriting**: 3-6 seconds
- **TTS Synthesis**: 1-3 seconds
- **Total Pipeline**: 7-15 seconds

**Bundle Size:**
- Offscreen bundle: 152KB
- Total extension: ~500KB

## 🔐 Privacy & Security

- **Local Processing**: Content extraction happens in browser
- **Cloud Processing**: AI and TTS via Google Cloud APIs
- **No Data Storage**: Scripts stored locally only
- **No Tracking**: No analytics or user tracking
- **API Keys**: Restricted to specific services only

All content sent to Google Cloud for AI processing is temporary and not stored.

## 🐛 Troubleshooting

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

## 📚 Documentation

- **[AI_PIPELINE.md](AI_PIPELINE.md)** - Complete architecture documentation
- **[DEBUGGING.md](DEBUGGING.md)** - Troubleshooting guide
- **[IMPLEMENTATION_GUIDE.md](IMPLEMENTATION_GUIDE.md)** - Developer guide
- **[CLAUDE.md](CLAUDE.md)** - Development guidelines

## 🤝 Contributing

Contributions welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Test thoroughly (see DEBUGGING.md)
5. Commit (`git commit -m 'Add amazing feature'`)
6. Push (`git push origin feature/amazing-feature`)
7. Open a Pull Request

### Development Guidelines

- Follow existing code style (ES6+, async/await)
- Add comments for complex logic
- Test with multiple websites
- Update documentation if needed
- Rebuild bundle after Firebase changes

## 🗺️ Roadmap

### Planned Features
- [ ] Backend proxy via Firebase Cloud Functions (secure API keys)
- [ ] Multi-speaker support (different voices for dialogue)
- [ ] Background music (intro/outro)
- [ ] Batch conversion (multiple articles)
- [ ] Export MP3 with metadata
- [ ] Integration with podcast platforms

### Ideas
- Offline mode with cached scripts
- Custom voice training
- Multi-language support
- RSS feed generation
- Chrome Web Store publication

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Firebase AI Logic SDK** - Gemini 2.5 Flash integration
- **Google Cloud Text-to-Speech** - Neural2 voices
- **Chrome Extensions Team** - Manifest V3 platform

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/Lun75/listen-up-podcast-converter/issues)
- **Documentation**: See docs/ folder
- **Email**: dialina1125@gmail.com

## 📈 Version History

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
