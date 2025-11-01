/**
 * Offscreen Document for Firebase App Check
 * This file will be bundled with esbuild to include all Firebase dependencies
 */

import { initializeApp } from 'firebase/app';
import { initializeAppCheck, CustomProvider } from 'firebase/app-check';
import { getAI, getGenerativeModel, GoogleAIBackend } from 'firebase/ai';

console.log('📄 Offscreen document loaded (bundled)');

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAlWiCOhkKqnAe7capXZ4MXQxt0yrq6cOU",
  authDomain: "web-to-podcast-chromeextension.firebaseapp.com",
  projectId: "web-to-podcast-chromeextension",
  storageBucket: "web-to-podcast-chromeextension.firebasestorage.app",
  messagingSenderId: "582025661331",
  appId: "1:582025661331:web:742d54611bd628a2f3b666",
  measurementId: "G-FGQ5FEHWW7"
};

// App Check Debug Token from Firebase Console
// This token allows development/testing without reCAPTCHA
const APP_CHECK_DEBUG_TOKEN = '07AADCFB-ED1C-4057-9CCB-37DCC59DF14F';

let app = null;
let appCheck = null;
let ai = null;
let model = null;

/**
 * Convert script to SSML (Speech Synthesis Markup Language) for natural TTS
 * Uses Google Cloud TTS SSML format to remove unreadable content
 */
function convertScriptToSSML(text) {
  let ssml = text;

  console.log('🎙️ Converting script to SSML for context-aware TTS...');
  console.log('📏 Original length:', text.length);

  // STEP 1: Remove ALL parenthetical content (music, sound effects, stage directions)
  // These are instructions for production, not speech
  ssml = ssml.replace(/\([^)]*\)/g, ' ');

  // STEP 2: Remove ALL square bracket content (placeholders, names, instructions)
  ssml = ssml.replace(/\[[^\]]*\]/g, ' ');

  // STEP 3: Convert markdown formatting to SSML with emotion context
  // **bold** -> emphasis with slight pitch increase (excitement/importance)
  ssml = ssml.replace(/\*\*([^*]+)\*\*/g, function(_match, content) {
    // Only emphasize short phrases (< 50 chars), otherwise just remove asterisks
    if (content.length < 50) {
      return '<emphasis level="strong"><prosody pitch="+2st">' + content + '</prosody></emphasis>';
    } else {
      return content;
    }
  });

  // *italic* -> moderate emphasis with slight rate change
  ssml = ssml.replace(/\*([^*]+)\*/g, '<emphasis level="moderate">$1</emphasis>');

  // Remove any leftover asterisks
  ssml = ssml.replace(/\*/g, '');

  // STEP 3.5: Add emotional prosody based on punctuation context
  // Exclamation marks -> increase pitch and rate slightly (excitement)
  ssml = ssml.replace(/([^.!?]+!)/g, '<prosody pitch="+1st" rate="105%">$1</prosody>');

  // Question marks -> increase pitch at end (inquisitive tone)
  ssml = ssml.replace(/([^.!?]+\?)/g, '<prosody pitch="+2st">$1</prosody>');

  // STEP 4: Remove speaker labels at start of lines
  ssml = ssml.replace(/^[Hh]ost:\s*/gm, '');
  ssml = ssml.replace(/^[Nn]arrator:\s*/gm, '');
  ssml = ssml.replace(/^[Ss]peaker:\s*/gm, '');

  // STEP 5: Convert separator lines to pauses
  ssml = ssml.replace(/^[-=_]{3,}$/gm, '<break time="800ms"/>');

  // STEP 6: Handle paragraph breaks with proper SSML structure
  // Split into paragraphs and wrap each
  let paragraphs = ssml.split(/\n\s*\n+/);
  paragraphs = paragraphs
    .map(p => p.trim())
    .filter(p => p.length > 0)
    .map(p => '<p>' + p + '</p>');

  // Join paragraphs with breaks between them
  ssml = paragraphs.join('\n<break time="600ms"/>\n');

  // STEP 7: Wrap in SSML speak tags
  ssml = '<speak>\n' + ssml + '\n</speak>';

  // STEP 8: Clean up extra whitespace
  ssml = ssml.replace(/\s+/g, ' ');  // Multiple spaces to single space
  ssml = ssml.replace(/\s*<break/g, '<break');  // Remove space before breaks
  ssml = ssml.replace(/\/>\s*/g, '/> ');  // Single space after breaks

  console.log('✅ Script converted to SSML');
  console.log('📏 SSML length:', ssml.length);
  console.log('📝 First 300 chars:', ssml.substring(0, 300));

  return ssml;
}

/**
 * Initialize Firebase in offscreen context
 */
async function initializeFirebase() {
  try {
    console.log('🔄 Initializing Firebase in offscreen context...');

    // Initialize Firebase app
    app = initializeApp(firebaseConfig);
    console.log('✅ Firebase app initialized');

    // Skip Analytics - not needed and causes CSP issues
    console.log('⏭️  Firebase Analytics skipped (not needed in extension)');

    // Initialize App Check with debug token (no CSP issues)
    // Create a custom provider that returns the debug token
    const debugTokenProvider = new CustomProvider({
      getToken: () => {
        console.log('🔑 Providing debug token:', APP_CHECK_DEBUG_TOKEN);
        return Promise.resolve({
          token: APP_CHECK_DEBUG_TOKEN,
          expireTimeMillis: Date.now() + 3600000 // 1 hour expiration
        });
      }
    });

    appCheck = initializeAppCheck(app, {
      provider: debugTokenProvider,
      isTokenAutoRefreshEnabled: true
    });
    console.log('✅ Firebase App Check initialized with debug token');
    console.log('🔑 Debug token being used:', APP_CHECK_DEBUG_TOKEN);

    // Initialize Firebase AI Logic SDK
    ai = getAI(app, { backend: new GoogleAIBackend() });
    console.log('✅ Firebase AI Logic initialized');

    // Initialize Gemini model (using Gemini 2.5 Flash for speed)
    model = getGenerativeModel(ai, { model: "gemini-2.5-flash" });
    console.log('✅ Gemini 2.5 Flash model initialized');

    return {
      success: true,
      message: 'Firebase AI Logic SDK initialized successfully with App Check debug token'
    };

  } catch (error) {
    console.error('❌ Firebase initialization failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Handle messages from background script or popup
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('📨 Offscreen received message:', message);
  console.log('📨 Message action:', message.action);
  console.log('📨 Message type:', typeof message.action);

  if (message.action === 'initializeFirebase') {
    // Initialize Firebase
    initializeFirebase().then(result => {
      sendResponse(result);
    }).catch(error => {
      sendResponse({
        success: false,
        error: error.message
      });
    });
    return true; // Keep channel open for async response
  }

  if (message.action === 'ping') {
    // Health check
    sendResponse({
      success: true,
      message: 'Offscreen document is alive',
      firebaseInitialized: app !== null,
      appCheckInitialized: appCheck !== null,
      aiInitialized: ai !== null,
      modelInitialized: model !== null
    });
    return;
  }

  if (message.action === 'summarizeContent') {
    // Summarize content using Gemini
    console.log('🔄 Summarization request received');

    if (!model) {
      console.error('❌ Model not initialized');
      sendResponse({
        success: false,
        error: 'AI model not initialized'
      });
      return;
    }

    const { text, length, format } = message;
    console.log(`📝 Summarizing ${text.length} characters (length: ${length}, format: ${format})`);

    // Build prompt based on parameters
    let prompt = `Please summarize the following text`;
    if (length === 'short') {
      prompt += ' in 2-3 sentences';
    } else if (length === 'medium') {
      prompt += ' in 5-7 sentences';
    } else if (length === 'long') {
      prompt += ' in 10-15 sentences';
    }

    if (format === 'key-points') {
      prompt += ', focusing on the main key points';
    } else if (format === 'tl;dr') {
      prompt += ' as a TL;DR';
    }

    prompt += `:\n\n${text}`;

    console.log('🚀 Calling Gemini API...');

    model.generateContent(prompt)
      .then(result => {
        console.log('✅ Gemini API response received');
        const summary = result.response.text();
        console.log(`📄 Summary length: ${summary.length} characters`);
        sendResponse({
          success: true,
          summary: summary
        });
      })
      .catch(error => {
        console.error('❌ Summarization failed:', error);
        console.error('Error details:', error.message, error.stack);
        sendResponse({
          success: false,
          error: error.message || 'Summarization failed'
        });
      });

    return true;
  }

  if (message.action === 'rewriteConversational') {
    // Rewrite content in conversational podcast style
    if (!model) {
      sendResponse({
        success: false,
        error: 'AI model not initialized'
      });
      return;
    }

    const { text, difficulty, style } = message;

    // Build prompt for conversational rewrite
    let prompt = `Rewrite the following content as an engaging podcast script for text-to-speech narration.

IMPORTANT FORMATTING RULES:
- Do NOT use any asterisks (**), underscores (_), or markdown formatting
- Do NOT include music cues like "(Intro Music)" or "(Outro Music)"
- Do NOT use placeholder text like "[Your Name]" or "[Host Name]"
- Do NOT use separators like "---" or "***"
- Do NOT use "Host:" labels or speaker tags
- Write everything as plain, natural spoken text that can be read aloud directly
- Use actual pauses with periods and commas, not visual separators
- Write complete sentences that flow naturally when spoken
- No stage directions, no formatting, just pure spoken content

`;

    if (difficulty === 'easy') {
      prompt += 'Use simple language suitable for beginners. Explain technical terms. ';
    } else if (difficulty === 'medium') {
      prompt += 'Use moderate complexity. Balance accessibility with depth. ';
    } else if (difficulty === 'hard') {
      prompt += 'Use advanced language. Assume expert audience. ';
    }

    if (style === 'narrative') {
      prompt += 'Use a storytelling narrative style. ';
    } else if (style === 'educational') {
      prompt += 'Use an educational teaching style. ';
    } else if (style === 'conversational') {
      prompt += 'Use a casual conversational style. ';
    }

    prompt += `Make it sound natural and engaging for audio listening, as if a real person is speaking directly to the audience.\n\nContent:\n${text}`;

    model.generateContent(prompt)
      .then(result => {
        const rewritten = result.response.text();

        // Keep original script with formatting for display
        // SSML conversion will happen during TTS synthesis
        sendResponse({
          success: true,
          text: rewritten
        });
      })
      .catch(error => {
        console.error('❌ Rewrite failed:', error);
        sendResponse({
          success: false,
          error: error.message
        });
      });

    return true;
  }

  if (message.action === 'generateContent') {
    // Generic content generation
    if (!model) {
      sendResponse({
        success: false,
        error: 'AI model not initialized'
      });
      return;
    }

    const { prompt } = message;

    model.generateContent(prompt)
      .then(result => {
        const text = result.response.text();
        sendResponse({
          success: true,
          text: text
        });
      })
      .catch(error => {
        console.error('❌ Content generation failed:', error);
        sendResponse({
          success: false,
          error: error.message
        });
      });

    return true;
  }

  if (message.action === 'synthesizeSpeech') {
    // Google Cloud Text-to-Speech
    const { text, voiceName, languageCode } = message;

    console.log('🎤 Synthesizing speech with Google Cloud TTS...');
    console.log('Voice:', voiceName, 'Language:', languageCode);
    console.log('📝 Original text (first 200 chars):', text.substring(0, 200));
    console.warn('⚠️ STARTING SSML CONVERSION - CHECK THIS CONSOLE FOR SSML LOGS!');

    // Convert script to SSML for context-aware speech synthesis
    const ssmlText = convertScriptToSSML(text);

    console.warn('⚠️ SSML CONVERSION COMPLETE!');
    console.log('🎙️ SSML output (first 500 chars):', ssmlText.substring(0, 500));
    console.log('🎙️ SSML has asterisks?', ssmlText.includes('*'));
    console.log('🎙️ SSML has parentheses?', ssmlText.includes('('));

    // Use dedicated TTS API key (separate from Firebase key)
    const TTS_API_KEY = 'AIzaSyDFkbh8oCVVD8r3S8vSfBHQgpOAZrnC4Qg';

    // Call Google Cloud Text-to-Speech REST API
    const apiUrl = `https://texttospeech.googleapis.com/v1/text:synthesize?key=${TTS_API_KEY}`;

    const requestBody = {
      input: { ssml: ssmlText },  // Use SSML instead of plain text
      voice: {
        languageCode: languageCode || 'en-US',
        name: voiceName || 'en-US-Neural2-F'
      },
      audioConfig: {
        audioEncoding: 'MP3',
        pitch: 0,
        speakingRate: 1.0
      }
    };

    fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    })
      .then(response => {
        if (!response.ok) {
          return response.json().then(err => {
            throw new Error(err.error?.message || 'TTS API error');
          });
        }
        return response.json();
      })
      .then(data => {
        console.log('✅ Speech synthesized successfully');
        sendResponse({
          success: true,
          audioContent: data.audioContent // Base64 encoded MP3
        });
      })
      .catch(error => {
        console.error('❌ Speech synthesis failed:', error);
        sendResponse({
          success: false,
          error: error.message
        });
      });

    return true;
  }
});

// Auto-initialize on load
initializeFirebase().then(result => {
  console.log('📊 Firebase initialization result:', result);
});

console.log('✅ Offscreen document ready');
