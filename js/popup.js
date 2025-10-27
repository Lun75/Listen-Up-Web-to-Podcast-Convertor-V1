// DOM Elements
const podcastUrlInput = document.getElementById('podcast-url');
const convertBtn = document.getElementById('convert-btn');
const statusMessage = document.getElementById('status-message');
const progressBar = document.getElementById('progress-bar');
const progressFill = progressBar.querySelector('.progress-fill');
const historyList = document.getElementById('history-list');
const formatBtns = document.querySelectorAll('.format-btn');
const settingsBtn = document.getElementById('settings-btn');

// State
let selectedFormat = 'mp3';

// Format selection
formatBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    formatBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    selectedFormat = btn.dataset.format;
  });
});

// Convert button handler
convertBtn.addEventListener('click', async () => {
  const url = podcastUrlInput.value.trim();

  if (!url) {
    showStatus('Please enter a podcast URL', 'error');
    return;
  }

  if (!isValidUrl(url)) {
    showStatus('Please enter a valid URL', 'error');
    return;
  }

  await convertPodcast(url, selectedFormat);
});

// Convert podcast function
async function convertPodcast(url, format) {
  convertBtn.disabled = true;
  showStatus('Converting podcast...', 'info');
  showProgress(true);

  try {
    // Send message to background script
    const response = await chrome.runtime.sendMessage({
      action: 'convertPodcast',
      url: url,
      format: format
    });

    if (response.success) {
      showStatus('Conversion complete!', 'success');
      addToHistory(url, format);
      podcastUrlInput.value = '';
    } else {
      showStatus(response.error || 'Conversion failed', 'error');
    }
  } catch (error) {
    showStatus('Error: ' + error.message, 'error');
  } finally {
    convertBtn.disabled = false;
    showProgress(false);
  }
}

// Show status message
function showStatus(message, type) {
  statusMessage.textContent = message;
  statusMessage.className = `status-message ${type}`;

  if (type === 'success') {
    setTimeout(() => {
      statusMessage.className = 'status-message';
    }, 3000);
  }
}

// Show/hide progress bar
function showProgress(show) {
  if (show) {
    progressBar.style.display = 'block';
    progressFill.style.width = '0%';

    // Simulate progress
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 15;
      if (progress > 90) progress = 90;
      progressFill.style.width = progress + '%';
    }, 500);

    progressBar.dataset.interval = interval;
  } else {
    progressFill.style.width = '100%';
    const interval = progressBar.dataset.interval;
    if (interval) clearInterval(interval);

    setTimeout(() => {
      progressBar.style.display = 'none';
    }, 500);
  }
}

// Add to history
async function addToHistory(url, format) {
  const history = await getHistory();
  const item = {
    url: url,
    format: format,
    timestamp: Date.now()
  };

  history.unshift(item);
  if (history.length > 10) history.pop();

  await chrome.storage.local.set({ history: history });
  displayHistory();
}

// Get history from storage
async function getHistory() {
  const result = await chrome.storage.local.get('history');
  return result.history || [];
}

// Display history
async function displayHistory() {
  const history = await getHistory();

  if (history.length === 0) {
    historyList.innerHTML = '<p class="empty-state">No conversions yet</p>';
    return;
  }

  historyList.innerHTML = history.map(item => {
    const date = new Date(item.timestamp);
    const shortUrl = item.url.length > 40 ? item.url.substring(0, 40) + '...' : item.url;

    return `
      <div class="history-item">
        <div><strong>${shortUrl}</strong></div>
        <div style="color: #666; margin-top: 4px;">
          ${item.format.toUpperCase()} • ${date.toLocaleDateString()}
        </div>
      </div>
    `;
  }).join('');
}

// Validate URL
function isValidUrl(string) {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
}

// Settings button
settingsBtn.addEventListener('click', () => {
  showStatus('Settings coming soon!', 'info');
});

// Initialize
displayHistory();
