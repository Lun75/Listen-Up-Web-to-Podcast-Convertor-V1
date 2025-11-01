/**
 * Firebase Configuration for Listen Up! Podcast Converter
 * Initialize Firebase app for AI Logic SDK
 */

// Import the functions you need from the SDKs you need
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getAnalytics } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-analytics.js';
import { initializeAppCheck, ReCaptchaEnterpriseProvider } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app-check.js';

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "YOUR_FIREBASE_API_KEY_HERE",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.firebasestorage.app",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID",
  measurementId: "YOUR_MEASUREMENT_ID"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Initialize App Check with reCAPTCHA Enterprise
// This protects your Firebase resources from abuse
try {
  const appCheck = initializeAppCheck(app, {
    provider: new ReCaptchaEnterpriseProvider('6Ldx_PorAAAAAJU7zWtNYssCgyb-yFex_SoQWUUH'),
    isTokenAutoRefreshEnabled: true // Enable auto-refresh
  });

  console.log('✅ Firebase App Check initialized');
} catch (error) {
  console.warn('⚠️ App Check initialization failed:', error);
  // App Check is not critical for extension to function
  // It's an additional security layer for Firebase resources
}

// Export the initialized app
export { app, analytics };

console.log('✅ Firebase app initialized');
