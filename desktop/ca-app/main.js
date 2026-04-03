const { app, BrowserWindow, Menu, ipcMain, shell } = require('electron');
const path = require('path');

let mainWindow;
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
}

const configuredWebBaseUrl = process.env.REKONO_WEB_URL || 'http://localhost:3001';
const caStartPath = '/command-center';
const fallbackPath = path.join(__dirname, 'renderer', 'index.html');
let activeWebBaseUrl = configuredWebBaseUrl;

function getCandidateWebBaseUrls() {
  const candidates = [
    configuredWebBaseUrl,
    'http://localhost:3001',
    'http://127.0.0.1:3001',
    'http://localhost:3000',
    'http://127.0.0.1:3000',
  ];

  return [...new Set(candidates.map((x) => x.replace(/\/$/, '')))];
}

function isAllowedDesktopUrl(url) {
  if (url.startsWith('file://')) return true;
  return getCandidateWebBaseUrls().some((baseUrl) => url.startsWith(baseUrl));
}

function attachNavigationGuards() {
  if (!mainWindow) return;

  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (isAllowedDesktopUrl(url)) {
      return;
    }

    event.preventDefault();
    void shell.openExternal(url);
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (isAllowedDesktopUrl(url)) {
      return { action: 'allow' };
    }

    void shell.openExternal(url);
    return { action: 'deny' };
  });
}

async function isWebAvailable(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 3000);
  try {
    const response = await fetch(url, { method: 'GET', signal: controller.signal });
    return response.ok || response.status < 500;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

async function loadCaSurface() {
  if (!mainWindow) return;
  let caStartUrl = `${configuredWebBaseUrl}${caStartPath}`;
  let available = false;

  for (const baseUrl of getCandidateWebBaseUrls()) {
    caStartUrl = `${baseUrl}${caStartPath}`;
    available = await isWebAvailable(caStartUrl);
    if (available) {
      activeWebBaseUrl = baseUrl;
      break;
    }
  }

  if (available) {
    await mainWindow.loadURL(caStartUrl);
    return;
  }

  await mainWindow.loadFile(fallbackPath, {
    query: {
      targetUrl: caStartUrl,
      surface: 'CA',
    },
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1160,
    minHeight: 740,
    backgroundColor: '#f5f8fc',
    title: 'Rekono CA Desktop',
    autoHideMenuBar: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  attachNavigationGuards();

  mainWindow.webContents.session.setPermissionRequestHandler((_wc, _permission, callback) => {
    callback(false);
  });

  void loadCaSurface();

  mainWindow.webContents.on('did-fail-load', async () => {
    await mainWindow.loadFile(fallbackPath, {
      query: {
        targetUrl: `${activeWebBaseUrl}${caStartPath}`,
        surface: 'CA',
      },
    });
  });

  mainWindow.webContents.on('render-process-gone', () => {
    void loadCaSurface();
  });

  mainWindow.on('unresponsive', () => {
    void loadCaSurface();
  });
}

function setupMenu() {
  const template = [
    {
      label: 'File',
      submenu: [
        { role: 'reload', label: 'Reload' },
        { type: 'separator' },
        { role: 'quit', label: 'Quit' },
      ],
    },
    {
      label: 'View',
      submenu: [
        { role: 'toggleDevTools', label: 'Toggle Developer Tools' },
        { role: 'togglefullscreen', label: 'Toggle Full Screen' },
      ],
    },
    {
      label: 'Go',
      submenu: [
        {
          label: 'Command Center',
          accelerator: 'CmdOrCtrl+1',
          click: () => mainWindow && mainWindow.loadURL(`${activeWebBaseUrl}/command-center`),
        },
        {
          label: 'Clients',
          accelerator: 'CmdOrCtrl+2',
          click: () => mainWindow && mainWindow.loadURL(`${activeWebBaseUrl}/clients`),
        },
        {
          label: 'Knowledge',
          accelerator: 'CmdOrCtrl+3',
          click: () => mainWindow && mainWindow.loadURL(`${activeWebBaseUrl}/knowledge`),
        },
        {
          type: 'separator',
        },
        {
          label: 'Reconnect',
          accelerator: 'CmdOrCtrl+R',
          click: () => {
            void loadCaSurface();
          },
        },
      ],
    },
  ];

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

ipcMain.on('window:minimize', () => {
  if (mainWindow) mainWindow.minimize();
});

ipcMain.on('window:maximize', () => {
  if (!mainWindow) return;
  if (mainWindow.isMaximized()) mainWindow.unmaximize();
  else mainWindow.maximize();
});

ipcMain.on('window:close', () => {
  if (mainWindow) mainWindow.close();
});

ipcMain.handle('app:retry-connection', async () => {
  await loadCaSurface();
  return { ok: true };
});

ipcMain.handle('app:get-runtime-config', async () => {
  return {
    webBaseUrl: activeWebBaseUrl,
    configuredWebBaseUrl,
    startPath: caStartPath,
    surface: 'CA',
  };
});

app.whenReady().then(() => {
  app.on('second-instance', () => {
    if (!mainWindow) return;
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  });

  setupMenu();
  createWindow();
  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});
