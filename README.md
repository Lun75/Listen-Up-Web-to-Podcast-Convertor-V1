# Listen Up! Podcast Converter

A browser extension for converting and managing podcast audio files with ease.

## Features

- Convert podcast audio to multiple formats (MP3, M4A, OGG)
- Simple and intuitive user interface
- Conversion history tracking
- Auto-detection of podcast content on web pages
- Local storage for preferences and history

## Installation

### Development Installation

1. Clone this repository:
   ```bash
   git clone https://github.com/Lun75/listen-up-podcast-converter.git
   cd listen-up-podcast-converter
   ```

2. Load the extension in Chrome/Edge:
   - Open `chrome://extensions/`
   - Enable "Developer mode" (toggle in top right)
   - Click "Load unpacked"
   - Select the `listen-up-podcast-converter` directory

3. Load the extension in Firefox:
   - Open `about:debugging#/runtime/this-firefox`
   - Click "Load Temporary Add-on"
   - Select the `manifest.json` file

## Usage

1. Click the extension icon in your browser toolbar
2. Enter a podcast URL
3. Select your desired output format
4. Click "Convert"
5. View your conversion history in the popup

## Development

### Project Structure

```
listen-up-podcast-converter/
├── manifest.json           # Extension manifest (V3)
├── popup.html             # Extension popup UI
├── css/
│   └── popup.css         # Popup styles
├── js/
│   ├── popup.js          # Popup logic
│   ├── background.js     # Service worker
│   └── content.js        # Content script
├── icons/                # Extension icons
└── LICENSE               # MIT License
```

### Permissions

- `storage` - Store conversion history and settings
- `downloads` - Download converted files
- `activeTab` - Access current tab for podcast detection
- `host_permissions` - Access podcast URLs for conversion

## TODO

- [ ] Implement actual audio conversion logic
- [ ] Add icon assets (16x16, 48x48, 128x128)
- [ ] Add settings page for user preferences
- [ ] Support for batch conversions
- [ ] Integration with popular podcast platforms
- [ ] Audio quality selection
- [ ] Download progress tracking

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - see [LICENSE](LICENSE) file for details

## Version

Current version: 0.1.0
