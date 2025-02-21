const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const Store = require('electron-store');

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
      enableRemoteModule: true,
      additionalArguments: ['--enable-features=HardwareMediaKeyHandling'],
      webSecurity: true
    }
  });

  // Set window properties
  win.setBackgroundColor('#00ffffff');
  win.loadFile('index.html');

  // Activer les permissions système
  win.webContents.session.setPermissionRequestHandler((webContents, permission, callback) => {
    const systemPermissions = ['systemInfo', 'hardware', 'battery'];
    if (systemPermissions.includes(permission)) {
      callback(true);
    } else {
      callback(false);
    }
  });

  // Open DevTools in development
  if (process.env.NODE_ENV === 'development') {
    win.webContents.openDevTools();
  }

  // IPC handlers for window controls
  ipcMain.on('window-minimize', () => win.minimize());
  ipcMain.on('window-toggle-maximize', () => {
    win.isMaximized() ? win.unmaximize() : win.maximize();
  });
  ipcMain.on('window-close', () => win.close());

  // Mettre à jour les icônes lors du redimensionnement
  win.on('maximize', () => win.webContents.send('window-maximized'));
  win.on('unmaximize', () => win.webContents.send('window-unmaximized'));

  win.webContents.on('did-finish-load', () => {
    win.webContents.send('load-settings');
  });
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

Store.initRenderer(); 