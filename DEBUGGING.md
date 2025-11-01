# Debugging Guide - Listen Up! Podcast Converter

## Overview

This guide helps troubleshoot common issues with the Listen Up! Podcast Converter extension, which uses Firebase AI Logic (Gemini 2.5 Flash) and Google Cloud Text-to-Speech.

---

## Quick Diagnostics

### Check Extension Status

1. **Open extension popup**
2. **Right-click** → "Inspect" to open DevTools
3. **Check console** for errors or warnings
4. Look for initialization messages:
   ```
   ✅ Firebase app initialized
   ✅ Gemini 2.5 Flash model initialized
   ```

### Verify API Services

Open the popup console and run:

```javascript
// Check Firebase initialization
chrome.runtime.sendMessage({ action: 'ping' })
  .then(result => console.log('Firebase status:', result))
  .catch(err => console.error('Firebase error:', err));
```

Expected response:
```javascript
{
  success: true,
  message: "Offscreen document is alive",
  firebaseInitialized: true,
  appCheckInitialized: true,
  aiInitialized: true
}
```

---

## Common Issues

### 1. "No AI service available"

**Symptoms:**
- Error message when trying to convert
- AI initialization fails

**Causes & Solutions:**

#### A. Firebase AI Logic Enforcement Issue
**Check:** Firebase Console → AI Logic → Enforcement Mode

**Solution:**
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select project: `web-to-podcast-chromeextension`
3. Navigate to **Build → AI Logic**
4. Change enforcement to **"Unenforced"**
5. Reload extension and try again

#### B. Firebase App Check Token Invalid
**Check console for:** `Firebase App Check token is invalid`

**Solution:**
1. Debug token might be expired or incorrect
2. Check `src/offscreen-firebase.js` for current debug token
3. Generate new debug token in Firebase Console if needed

#### C. Network/Connectivity Issues
**Check console for:** Network errors, CORS errors

**Solution:**
1. Check internet connection
2. Verify firewall isn't blocking Google APIs
3. Try disabling VPN temporarily

---

### 2. "TTS API not enabled" or "403 Forbidden"

**Symptoms:**
- Script generates but audio fails
- `Cloud Text-to-Speech API has not been used` error

**Solution:**

1. **Enable the API:**
   - Go to: https://console.developers.google.com/apis/api/texttospeech.googleapis.com/overview?project=582025661331
   - Click **"Enable"**
   - Wait 2-3 minutes for propagation

2. **Check API Key Restrictions:**
   - Go to [Google Cloud Console → API Credentials](https://console.cloud.google.com/apis/credentials?project=582025661331)
   - Find API key: `AIzaSyDFkbh8oCVVD8r3S8vSfBHQgpOAZrnC4Qg`
   - Under "API restrictions" → Select **"Restrict key"**
   - Check **"Cloud Text-to-Speech API"**
   - Click **"Save"**
   - Wait 3-5 minutes

3. **Reload extension** and test again

---

### 3. TTS Reads Asterisks/Formatting

**Symptoms:**
- Voice says "asterisk asterisk Host"
- Music cues are read aloud
- Hears "(Intro Music)" spoken

**Cause:** Browser cache holding old bundle without SSML conversion

**Solution:**

1. **Hard reload extension:**
   ```bash
   # Go to chrome://extensions/
   # Click reload button
   # Close and reopen DevTools
   ```

2. **Verify SSML conversion is working:**
   - Open **offscreen document console** (chrome://extensions/ → "Inspect views: offscreen.html")
   - Click "Play Audio"
   - Look for these logs:
     ```
     ⚠️ STARTING SSML CONVERSION
     🎙️ SSML has asterisks? false
     🎙️ SSML has parentheses? false
     ```

3. **If logs don't appear:**
   - The old bundle is still cached
   - Go to `chrome://extensions/`
   - **Remove the extension** completely
   - **Reload unpacked** again

---

### 4. Content Extraction Fails

**Symptoms:**
- "Content validation failed" error
- Extension extracts from popup instead of webpage

**Solutions:**

#### A. Page Not Suitable
**Check:** Content must have minimum 100 words

**Solution:**
- Try a different article (longer, text-heavy content)
- Avoid image galleries, videos, login pages

#### B. Script Injection Failed
**Check console for:** `Content extractor not loaded`

**Solution:**
1. Ensure page has fully loaded before clicking "Convert"
2. Refresh the page and try again
3. Check if site blocks content scripts (rare)

#### C. Extracting Wrong Page
**Symptoms:** Summarizes extension popup UI instead of article

**Solution:**
- This was a bug, fixed in current version
- If you see this, reload extension to get latest code

---

### 5. Slow Processing / Timeouts

**Symptoms:**
- Takes > 30 seconds to generate
- Process hangs at "Rewriting..."

**Possible Causes:**

#### A. Long Content
**Solution:** Content is chunked automatically, but very long articles (>5000 words) may take time

#### B. API Rate Limiting
**Check console for:** Rate limit errors

**Solution:**
- Wait a few minutes between conversions
- Firebase has built-in rate limits

#### C. Network Issues
**Solution:**
- Check internet speed
- Try again with better connection

---

## Console Debugging

### Enable Verbose Logging

Different consoles show different information:

#### 1. **Popup Console** (popup.html)
Shows:
- UI interactions
- TTS playback status
- User actions

**Access:** Right-click popup → "Inspect"

#### 2. **Service Worker Console** (background.js)
Shows:
- Message forwarding
- Extension lifecycle

**Access:** `chrome://extensions/` → "service worker"

#### 3. **Offscreen Console** (offscreen-firebase.js)
Shows:
- Firebase initialization
- Gemini API calls
- SSML conversion
- TTS synthesis

**Access:** `chrome://extensions/` → "Inspect views: offscreen.html"

### Reading Console Logs

**Successful Pipeline:**
```
Popup:
🔄 Summarizing content...
☁️ Using cloud summarization...
✅ Cloud summarization successful
☁️ Using cloud rewrite...
✅ Cloud rewrite successful
🎤 Synthesizing speech...
✅ Speech synthesized successfully

Service Worker:
🔀 Forwarding message to offscreen: summarizeContent
📥 Response from offscreen: {success: true, summary: "..."}
🔀 Forwarding message to offscreen: rewriteConversational
📥 Response from offscreen: {success: true, text: "..."}
🔀 Forwarding message to offscreen: synthesizeSpeech
📥 Response from offscreen: {success: true, audioContent: "..."}

Offscreen:
📨 Offscreen received message: {action: 'summarizeContent', ...}
✅ Gemini API response received
📨 Offscreen received message: {action: 'rewriteConversational', ...}
✅ Gemini API response received
📨 Offscreen received message: {action: 'synthesizeSpeech', ...}
🎙️ Converting script to SSML...
🎙️ SSML has asterisks? false
🎙️ SSML has parentheses? false
✅ Speech synthesized successfully
```

**Failed Pipeline - Firebase Error:**
```
Offscreen:
❌ Firebase initialization failed: ...
OR
❌ Summarization failed: ...
```

**Failed Pipeline - TTS Error:**
```
Offscreen:
❌ Speech synthesis failed: API has not been used in project...
OR
❌ Speech synthesis failed: Requests to this API are blocked
```

---

## Testing Individual Components

### Test Content Extraction

```javascript
// In popup console
const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

await chrome.scripting.executeScript({
  target: { tabId: tab.id },
  files: ['js/contentExtractor.js']
});

const result = await chrome.scripting.executeScript({
  target: { tabId: tab.id },
  function: () => window.contentExtractor.extract()
});

console.log('Extracted content:', result[0].result);
```

### Test Firebase/Gemini

```javascript
// In popup console
const response = await chrome.runtime.sendMessage({
  action: 'summarizeContent',
  text: 'Test content for summarization',
  length: 'short'
});

console.log('Summary:', response);
```

### Test TTS

```javascript
// In popup console
const response = await chrome.runtime.sendMessage({
  action: 'synthesizeSpeech',
  text: 'Hello, this is a test.',
  voiceName: 'en-US-Neural2-F',
  languageCode: 'en-US'
});

console.log('TTS response:', response);
```

---

## Verifying SSML Conversion

The SSML conversion runs in the offscreen document. To verify:

1. **Open offscreen console:** `chrome://extensions/` → "Inspect views: offscreen.html"
2. **Click "Play Audio"** in popup
3. **Check offscreen console** for:

```javascript
🎙️ Converting script to SSML for context-aware TTS...
📏 Original length: 2543
🎙️ SSML output (first 500 chars): <speak> <p>Welcome to the show...</p>...
🎙️ SSML has asterisks? false  // Should be false!
🎙️ SSML has parentheses? false  // Should be false!
✅ Script converted to SSML
```

**If you don't see these logs:** SSML conversion isn't running (old bundle cached)

---

## API Key Issues

### Firebase API Key
**Location:** `src/offscreen-firebase.js` line 14

**Issues:**
- Key should work out of the box (included in code)
- If 401 errors, check Firebase Console enforcement settings

### Google Cloud TTS API Key
**Location:** `src/offscreen-firebase.js` line 351

**Issues:**
- Ensure TTS API is enabled in Google Cloud Console
- Check API key restrictions allow Text-to-Speech API
- Verify application restrictions (if set) allow Chrome extensions

---

## Performance Issues

### Slow Script Generation

**Normal times:**
- Summarization: 2-4 seconds
- Rewrite: 3-6 seconds
- SSML + TTS: 1-3 seconds
- **Total: 7-15 seconds**

**If longer:**
- Check network speed
- Very long articles take longer
- First request may take extra time (cold start)

### Audio Playback Issues

**Choppy audio:**
- Not an extension issue (audio is pre-rendered MP3)
- Check system audio drivers
- Try different voice

**No audio:**
- Check browser volume settings
- Check system volume
- Look for TTS errors in offscreen console

---

## Extension Reload Procedure

**Proper reload to clear all caches:**

1. **Close all DevTools windows**
2. **Go to** `chrome://extensions/`
3. **Click reload icon** on extension
4. **Wait 5 seconds**
5. **Navigate to a new page**
6. **Open extension popup**
7. **Test again**

**Nuclear option (full reinstall):**

1. **Remove extension** from `chrome://extensions/`
2. **Close Chrome completely**
3. **Reopen Chrome**
4. **Load unpacked** again

---

## Getting Help

### Before Reporting Issues

1. ✅ Check this debugging guide
2. ✅ Check all three consoles (popup, service worker, offscreen)
3. ✅ Try reloading extension
4. ✅ Verify APIs are enabled in Google Cloud Console
5. ✅ Test with a simple article first

### What to Include in Bug Reports

1. **Error messages** from all consoles
2. **Steps to reproduce**
3. **Expected vs actual behavior**
4. **Chrome version**
5. **Article URL** (if content-specific)

---

## Advanced Debugging

### Monitor Network Requests

**Offscreen console → Network tab:**

Watch for:
- `firebasevertexai.googleapis.com` - Gemini API calls
- `texttospeech.googleapis.com` - TTS API calls

**Status codes:**
- `200` - Success
- `401` - Authentication error (API key issue)
- `403` - Permission denied (API not enabled or restricted)
- `429` - Rate limit exceeded

### Inspect Messages

**Service worker console:**

```javascript
// Log all messages
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Message received:', request);
  // ... existing code
});
```

---

## Known Issues

### 1. First Load Delay
**Issue:** First script generation takes longer
**Cause:** Firebase cold start
**Solution:** Normal, subsequent requests are faster

### 2. Cache Persistence
**Issue:** Old bundle persists after rebuild
**Cause:** Chrome caches aggressively
**Solution:** Use versioned filenames (offscreen-bundle-v2.js, etc.)

### 3. SSML Not Applied
**Issue:** TTS still reads formatting
**Cause:** Old bundle running
**Solution:** Full extension reload or reinstall

---

## Troubleshooting Checklist

- [ ] All three consoles show no errors
- [ ] Firebase initializes successfully
- [ ] Google Cloud TTS API enabled
- [ ] API keys have correct restrictions
- [ ] Extension fully reloaded
- [ ] Internet connection stable
- [ ] Using supported article type (text content)
- [ ] SSML conversion logs appear
- [ ] Audio plays in browser

---

## Contact

For persistent issues:
- Check `AI_PIPELINE.md` for architecture details
- Check `README.md` for user documentation
- Review code in GitHub repository
