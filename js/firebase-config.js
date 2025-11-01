/**
 * Firebase Configuration for Listen Up! Podcast Converter
 * Initialize Firebase app for AI Logic SDK
 */

// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app';
import { getAnalytics } from 'firebase/analytics';

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
// NOTE: API keys removed for security. Contact dialina1125@gmail.com for the working version.
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

// Export the initialized app
export { app, analytics };

console.log('✅ Firebase app initialized');
