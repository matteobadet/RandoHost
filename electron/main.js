const { app, BrowserWindow, shell, Menu } = require('electron')
const http = require('http')
const path = require('path')

const APP_URL = 'http://localhost'
const POLL_INTERVAL = 500   // ms entre chaque tentative
const POLL_TIMEOUT  = 30000 // 30s max avant abandon

let mainWindow = null

// ── Attend que le serveur Docker soit prêt ──────────────────────────────────
function waitForServer(timeout) {
  return new Promise((resolve, reject) => {
    const deadline = Date.now() + timeout
    const attempt = () => {
      http.get(APP_URL, res => {
        res.resume()
        resolve()
      }).on('error', () => {
        if (Date.now() >= deadline) {
          reject(new Error(`Le serveur n'a pas répondu après ${timeout / 1000}s`))
        } else {
          setTimeout(attempt, POLL_INTERVAL)
        }
      })
    }
    attempt()
  })
}

// ── Fenêtre principale ──────────────────────────────────────────────────────
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    title: 'RandoHost',
    icon: path.join(__dirname, 'assets', 'icon.png'),
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
    },
    show: false,
    backgroundColor: '#0f0f0f',
  })

  // Ouvre les liens externes dans le navigateur système, pas dans Electron
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  mainWindow.once('ready-to-show', () => mainWindow.show())
  mainWindow.loadURL(APP_URL)
}

// ── Menu minimal ─────────────────────────────────────────────────────────────
function buildMenu() {
  const template = [
    {
      label: 'RandoHost',
      submenu: [
        { label: 'Recharger', accelerator: 'CmdOrCtrl+R', click: () => mainWindow?.webContents.reload() },
        { type: 'separator' },
        { label: 'Quitter', accelerator: 'CmdOrCtrl+Q', click: () => app.quit() },
      ],
    },
    {
      label: 'Affichage',
      submenu: [
        { label: 'Zoom +', accelerator: 'CmdOrCtrl+Plus', click: () => { const z = mainWindow?.webContents.getZoomFactor() ?? 1; mainWindow?.webContents.setZoomFactor(z + 0.1) } },
        { label: 'Zoom −', accelerator: 'CmdOrCtrl+-',    click: () => { const z = mainWindow?.webContents.getZoomFactor() ?? 1; mainWindow?.webContents.setZoomFactor(Math.max(0.5, z - 0.1)) } },
        { label: 'Réinitialiser le zoom', accelerator: 'CmdOrCtrl+0', click: () => mainWindow?.webContents.setZoomFactor(1) },
        { type: 'separator' },
        { label: 'Plein écran', accelerator: 'F11', click: () => mainWindow?.setFullScreen(!mainWindow.isFullScreen()) },
        { label: 'Outils de développement', accelerator: 'F12', click: () => mainWindow?.webContents.toggleDevTools() },
      ],
    },
  ]

  Menu.setApplicationMenu(Menu.buildFromTemplate(template))
}

// ── Cycle de vie ─────────────────────────────────────────────────────────────
app.whenReady().then(async () => {
  buildMenu()

  // Affiche une fenêtre de chargement le temps que Docker démarre
  mainWindow = new BrowserWindow({
    width: 420,
    height: 260,
    resizable: false,
    frame: false,
    center: true,
    backgroundColor: '#0f0f0f',
    show: true,
  })
  mainWindow.loadURL(`data:text/html,
    <style>
      body { margin:0; background:#0f0f0f; display:flex; flex-direction:column;
             align-items:center; justify-content:center; height:100vh;
             font-family:system-ui,sans-serif; color:#fff; gap:16px; }
      .spinner { width:32px; height:32px; border:3px solid #333;
                 border-top-color:#3b82f6; border-radius:50%;
                 animation:spin .8s linear infinite; }
      @keyframes spin { to { transform:rotate(360deg) } }
      p { font-size:14px; color:#888; margin:0; }
    </style>
    <div class="spinner"></div>
    <p>Démarrage de RandoHost…</p>
  `)

  try {
    await waitForServer(POLL_TIMEOUT)
  } catch {
    mainWindow.loadURL(`data:text/html,
      <style>
        body { margin:0; background:#0f0f0f; display:flex; flex-direction:column;
               align-items:center; justify-content:center; height:100vh;
               font-family:system-ui,sans-serif; color:#fff; gap:16px; }
        h2 { color:#ef4444; margin:0; }
        p  { font-size:13px; color:#888; margin:0; text-align:center; }
        button { margin-top:8px; padding:8px 20px; background:#3b82f6; color:#fff;
                 border:none; border-radius:6px; cursor:pointer; font-size:14px; }
      </style>
      <h2>Serveur inaccessible</h2>
      <p>Assurez-vous que Docker est lancé<br>et que les conteneurs RandoHost sont démarrés.</p>
      <button onclick="location.reload()">Réessayer</button>
    `)
    return
  }

  // Serveur prêt — ouvre la vraie fenêtre
  mainWindow.close()
  createWindow()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})
