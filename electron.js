const { app, BrowserWindow, protocol } = require('electron');
const path = require('path');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 850,
    minWidth: 500,
    minHeight: 850, // Updated to match App constraint and prevent initial resize conflicts
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webSecurity: false // Optional: helpful if you have CORS issues with local files
    },
    icon: path.join(__dirname, 'public/favicon.ico') // Ensure you have an icon if possible
  });

  // Remove the menu bar (optional, makes it look more like an app)
  mainWindow.setMenuBarVisibility(false);
  
  // Explicitly set minimum size again to ensure it applies correctly on all platforms
  mainWindow.setMinimumSize(500, 850);

  // In development, load from localhost. 
  // In production (bundled), load the index.html from the build folder.
  const startUrl = process.env.ELECTRON_START_URL || `file://${path.join(__dirname, 'dist/index.html')}`;

  mainWindow.loadURL(startUrl);

  mainWindow.on('closed', function () {
    mainWindow = null;
  });
}

app.on('ready', () => {
  createWindow();
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', function () {
  if (mainWindow === null) {
    createWindow();
  }
});