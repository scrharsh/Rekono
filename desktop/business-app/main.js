const { app, BrowserWindow, Menu, ipcMain, shell } = require('electron');
const path = require('path');

let mainWindow;
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
}

const configuredWebBaseUrl = process.env.REKONO_WEB_URL || 'http://localhost:3001';
const businessStartPath = '/dashboard';
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

async function loadBusinessSurface() {
  if (!mainWindow) return;
  let businessStartUrl = `${configuredWebBaseUrl}${businessStartPath}`;
  let available = false;

  for (const baseUrl of getCandidateWebBaseUrls()) {
    businessStartUrl = `${baseUrl}${businessStartPath}`;
    available = await isWebAvailable(businessStartUrl);
    if (available) {
      activeWebBaseUrl = baseUrl;
      break;
    }
  }

  if (available) {
    await mainWindow.loadURL(businessStartUrl);
    return;
  }

  await mainWindow.loadFile(fallbackPath, {
    query: {
      targetUrl: businessStartUrl,
      surface: 'Business',
    },
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1366,
    height: 860,
    minWidth: 1100,
    minHeight: 700,
    backgroundColor: '#f5f8fc',
    title: 'Rekono Business Desktop',
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

  void loadBusinessSurface();

  mainWindow.webContents.on('did-fail-load', async () => {
    await mainWindow.loadFile(fallbackPath, {
      query: {
        targetUrl: `${activeWebBaseUrl}${businessStartPath}`,
        surface: 'Business',
      },
    });
  });

  mainWindow.webContents.on('render-process-gone', () => {
    void loadBusinessSurface();
  });

  mainWindow.on('unresponsive', () => {
    void loadBusinessSurface();
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
          label: 'Business Home',
          accelerator: 'CmdOrCtrl+1',
          click: () => mainWindow && mainWindow.loadURL(`${activeWebBaseUrl}/dashboard`),
        },
        {
          label: 'Subscription',
          accelerator: 'CmdOrCtrl+2',
          click: () => mainWindow && mainWindow.loadURL(`${activeWebBaseUrl}/subscribe`),
        },
        {
          label: 'Reports',
          accelerator: 'CmdOrCtrl+3',
          click: () => mainWindow && mainWindow.loadURL(`${activeWebBaseUrl}/reports`),
        },
        {
          type: 'separator',
        },
        {
          label: 'Reconnect',
          accelerator: 'CmdOrCtrl+R',
          click: () => {
            void loadBusinessSurface();
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
  await loadBusinessSurface();
  return { ok: true };
});

ipcMain.handle('app:get-runtime-config', async () => {
  return {
    webBaseUrl: activeWebBaseUrl,
    configuredWebBaseUrl,
    startPath: businessStartPath,
    surface: 'Business',
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
