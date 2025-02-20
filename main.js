const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 940,
    minHeight: 600,
    frame: false,
    transparent: true,
    backgroundColor: '#00ffffff',
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true
    }
  });

  // Set window properties
  win.setBackgroundColor('#00ffffff');
  win.loadFile('index.html');

  // Open DevTools in development
  if (process.env.NODE_ENV === 'development') {
    win.webContents.openDevTools();
  }
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Handle window controls
app.on('browser-window-created', (_, window) => {
  window.on('maximize', () => {
    window.webContents.send('window-maximized');
  });

  window.on('unmaximize', () => {
    window.webContents.send('window-unmaximized');
  });
}); 