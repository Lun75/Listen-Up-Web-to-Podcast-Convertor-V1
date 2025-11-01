#!/bin/bash
# Cleanup script for public repository

echo "🧹 Cleaning up repository for public release..."

# Remove old/duplicate bundles
echo "Removing old bundle files..."
rm -f offscreen-bundle.js
rm -f js/offscreen-bundle.js

# Remove unused JS files
echo "Removing unused JS files..."
rm -f js/aiService.js
rm -f js/aiServiceChrome138.js
rm -f js/hybridAIService.js
rm -f js/offscreen.js
rm -f js/offscreen-test.js

# Remove system files
echo "Removing system files..."
find . -name ".DS_Store" -delete

echo "✅ Cleanup complete!"
echo ""
echo "📝 Removed:"
echo "  - Old bundle files (offscreen-bundle.js, js/offscreen-bundle.js)"
echo "  - Unused JS files (5 files)"
echo "  - System files (.DS_Store)"
