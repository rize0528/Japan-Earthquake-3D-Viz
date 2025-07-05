// Progress bar component
function createProgressBar() {
  // Check if progress bar already exists
  if (document.getElementById('progressContainer')) {
    return;
  }

  // Create progress container
  const progressContainer = document.createElement('div');
  progressContainer.id = 'progressContainer';
  progressContainer.className = 'progress-container';
  
  progressContainer.innerHTML = `
    <div class="progress-text" id="progressText">Loading...</div>
    <div class="progress-bar">
      <div class="progress-fill" id="progressFill"></div>
    </div>
  `;

  // Add styles if not already present
  if (!document.getElementById('progressStyles')) {
    const style = document.createElement('style');
    style.id = 'progressStyles';
    style.textContent = `
      .progress-container {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        background-color: rgba(255, 255, 255, 0.95);
        border-bottom: 1px solid #ddd;
        padding: 10px 20px;
        display: none;
        z-index: 1000;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      }
      .progress-container.show {
        display: block;
      }
      .progress-text {
        font-size: 14px;
        color: #333;
        margin-bottom: 8px;
        text-align: center;
      }
      .progress-bar {
        width: 100%;
        height: 6px;
        background-color: #e0e0e0;
        border-radius: 3px;
        overflow: hidden;
      }
      .progress-fill {
        height: 100%;
        background: linear-gradient(90deg, #007bff, #0056b3);
        border-radius: 3px;
        transition: width 0.3s ease;
        width: 0%;
      }
    `;
    document.head.appendChild(style);
  }

  // Insert at the beginning of body
  document.body.insertBefore(progressContainer, document.body.firstChild);
}

function updateProgress(message, percentage) {
  const container = document.getElementById('progressContainer');
  const text = document.getElementById('progressText');
  const fill = document.getElementById('progressFill');
  
  if (!container) {
    createProgressBar();
    return updateProgress(message, percentage);
  }
  
  if (message && percentage > 0) {
    container.classList.add('show');
    text.textContent = message;
    fill.style.width = Math.min(100, Math.max(0, percentage)) + '%';
  } else {
    container.classList.remove('show');
  }
}

function hideProgress() {
  const container = document.getElementById('progressContainer');
  if (container) {
    container.classList.remove('show');
  }
}

// Auto-setup progress bar and listener when loaded
if (typeof window !== 'undefined' && window.api) {
  window.addEventListener('DOMContentLoaded', () => {
    createProgressBar();
    
    // Listen for progress updates
    window.api.receive('progress-update', (progressData) => {
      updateProgress(progressData.message, progressData.percentage);
    });
  });
}