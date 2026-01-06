const { app, BrowserWindow, protocol } = require('electron');
const path = require('path');
const fs = require('fs');

// 配置数据存储路径
function configureUserDataPath() {
  /**
   * 关键调整：
   * 仅当 process.env.PORTABLE_EXECUTABLE_DIR 存在时，说明是 electron-builder 打包的便携版。
   * 如果是安装版，该环境变量为空，程序将跳过此逻辑，自动使用默认的 Roaming 目录。
   */
  const portableExecutableDir = process.env.PORTABLE_EXECUTABLE_DIR;
  
  if (portableExecutableDir) {
    // --- 便携版逻辑：在 .exe 同级创建 Data 文件夹 ---
    const dataPath = path.join(portableExecutableDir, 'Data');

    try {
      if (!fs.existsSync(dataPath)) {
        fs.mkdirSync(dataPath, { recursive: true });
      }
      
      // 重定向 userData 路径
      app.setPath('userData', dataPath);
      console.log("便携版启动：数据存储在 exe 同级 Data 目录");
    } catch (err) {
      console.error("Failed to set custom data path:", err);
    }
  } else {
    // --- 安装版或开发环境：不做任何操作 ---
    // Electron 会默认存放在 C:\Users\XXXX\AppData\Roaming\[应用名]
    console.log("普通版启动：数据存储在系统默认 Roaming 目录");
  }
}

// 必须在应用 ready 之前尽早调用
configureUserDataPath();

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 850,
    minWidth: 500,
    minHeight: 850,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webSecurity: false 
    },
    icon: path.join(__dirname, 'public/favicon.ico')
  });

  mainWindow.setMenuBarVisibility(false);
  mainWindow.setMinimumSize(500, 850);

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