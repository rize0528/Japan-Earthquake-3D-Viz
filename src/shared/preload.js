const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  // Send messages to main process
  send: (channel, data) => {
    const validChannels = [
      'filter-changed',
      'update-data',
      'refresh-view',
      'sphere-scale',
      'sphere-alpha',
      'language-changed',
      'toggle-auto-update',
      'get-regions',
      'get-terrain-data',
      'delete-earthquake',
      'clear-cache',
      'fetch-historical-data'
    ];
    if (validChannels.includes(channel)) {
      ipcRenderer.send(channel, data);
    }
  },

  // Receive messages from main process
  receive: (channel, func) => {
    const validChannels = [
      'filtered-data',
      'daily-counts',
      'sphere-scale',
      'sphere-alpha',
      'language-changed',
      'error',
      'update-complete',
      'regions-list',
      'terrain-data',
      'terrain-error',
      'progress-update',
      'delete-complete',
      'delete-error',
      'cache-cleared',
      'cache-clear-error',
      'historical-data-complete',
      'historical-data-error'
    ];
    if (validChannels.includes(channel)) {
      ipcRenderer.on(channel, (event, ...args) => func(...args));
    }
  },

  // Remove listeners
  removeAllListeners: (channel) => {
    ipcRenderer.removeAllListeners(channel);
  }
});