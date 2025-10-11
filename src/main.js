const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const { spawn, exec } = require('child_process');
const fs = require('fs');
const os = require('os');
const util = require('util');
const execPromise = util.promisify(exec);

let mainWindow;
let vpnProcess = null;
let isConnected = false;
let currentServer = null;
let logCheckInterval = null;

const OPENVPN_PATH = getOpenVPNPath();
const CONFIG_DIR = path.join(__dirname, 'vpn-configs');
const CREDENTIALS_FILE = path.join(__dirname, 'vpn-credentials', 'auth.txt');
const LOG_FILE = path.join(__dirname, 'logs', 'vpn.log');

function getOpenVPNPath() {
  const platform = os.platform();

  if (platform === 'win32') {
    const possiblePaths = [
      'C:\\Program Files\\OpenVPN\\bin\\openvpn.exe',
      'C:\\Program Files (x86)\\OpenVPN\\bin\\openvpn.exe',
    ];

    for (const p of possiblePaths) {
      if (fs.existsSync(p)) return p;
    }
    return 'openvpn';
  } else if (platform === 'darwin') {
    const possiblePaths = [
      '/usr/local/bin/openvpn',
      '/opt/homebrew/bin/openvpn',
      '/usr/local/opt/openvpn/sbin/openvpn',
    ];

    for (const p of possiblePaths) {
      if (fs.existsSync(p)) return p;
    }
    return 'openvpn';
  } else {
    return '/usr/sbin/openvpn';
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    resizable: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
    frame: true,
    icon: path.join(__dirname, 'assets/icons/icon.png'),
  });

  mainWindow.loadFile(path.join(__dirname, 'index.html'));
}

app.whenReady().then(() => {
  ensureDirectories();
  cleanupOnStartup();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  cleanup();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  cleanup();
});

function cleanup() {
  if (logCheckInterval) {
    clearInterval(logCheckInterval);
    logCheckInterval = null;
  }
  if (vpnProcess) {
    killVPNProcess();
  }
}

function ensureDirectories() {
  const dirs = [
    path.join(__dirname, 'vpn-configs'),
    path.join(__dirname, 'vpn-credentials'),
    path.join(__dirname, 'logs'),
  ];

  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
}

// Limpiar procesos OpenVPN huérfanos al iniciar
async function cleanupOnStartup() {
  if (os.platform() === 'win32') {
    try {
      await execPromise('taskkill /IM openvpn.exe /F /T 2>nul');
      console.log('Cleaned up orphaned OpenVPN processes');
    } catch (err) {
      // No hay procesos OpenVPN, está bien
    }
  }
}

function checkOpenVPNInstalled() {
  return new Promise(resolve => {
    exec(`"${OPENVPN_PATH}" --version`, error => {
      resolve(!error);
    });
  });
}

// Mejorar la detección de procesos OpenVPN existentes
async function killExistingOpenVPN() {
  if (os.platform() === 'win32') {
    try {
      // Intentar matar procesos existentes
      await execPromise('taskkill /IM openvpn.exe /F /T');
      console.log('Killed existing OpenVPN processes');
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (err) {
      // No hay procesos para matar, continuar
      console.log('No existing OpenVPN processes to kill');
    }
  }
}

// Función mejorada para ejecutar OpenVPN en Windows
async function spawnElevatedWindows(command, args) {
  return new Promise((resolve, reject) => {
    const batPath = path.join(__dirname, 'logs', 'run-vpn.bat');

    // Crear archivo batch que ejecuta OpenVPN
    const batContent = `@echo off
start "" /B "${command}" ${args.map(a => `"${a}"`).join(' ')}
exit
`;

    try {
      fs.writeFileSync(batPath, batContent, 'utf8');

      // Ejecutar el batch con permisos elevados usando PowerShell
      const psCommand = `Start-Process -FilePath "${batPath}" -Verb RunAs -WindowStyle Hidden`;

      exec(`powershell -Command "${psCommand}"`, error => {
        // Limpiar el archivo batch
        try {
          setTimeout(() => {
            if (fs.existsSync(batPath)) {
              fs.unlinkSync(batPath);
            }
          }, 5000);
        } catch (err) {
          console.error('Error cleaning up batch file:', err);
        }

        if (error) {
          reject(error);
          return;
        }

        // Esperar a que OpenVPN inicie
        setTimeout(() => {
          findOpenVPNProcess().then(resolve).catch(reject);
        }, 3000);
      });
    } catch (error) {
      reject(error);
    }
  });
}

// Función mejorada para encontrar el proceso de OpenVPN
async function findOpenVPNProcess() {
  return new Promise(resolve => {
    exec('tasklist /FI "IMAGENAME eq openvpn.exe" /FO CSV /NH', (error, stdout) => {
      if (error || !stdout.includes('openvpn.exe')) {
        resolve(null);
        return;
      }

      const lines = stdout.trim().split('\n');
      if (lines.length > 0) {
        const parts = lines[0].split(',');
        if (parts.length >= 2) {
          const pid = parseInt(parts[1].replace(/"/g, ''));

          const pseudoProcess = {
            pid: pid,
            killed: false,
            kill: function () {
              exec(`taskkill /PID ${this.pid} /T /F`, err => {
                if (!err) this.killed = true;
              });
            },
          };

          resolve(pseudoProcess);
          return;
        }
      }
      resolve(null);
    });
  });
}

async function connectVPN(serverData) {
  try {
    // Limpiar intervalos previos
    if (logCheckInterval) {
      clearInterval(logCheckInterval);
      logCheckInterval = null;
    }

    const isInstalled = await checkOpenVPNInstalled();
    if (!isInstalled) {
      return {
        success: false,
        message: 'OpenVPN no está instalado. Por favor instálalo primero.',
      };
    }

    const configPath = path.join(CONFIG_DIR, `${serverData.id}.ovpn`);
    if (!fs.existsSync(configPath)) {
      return {
        success: false,
        message: `Archivo de configuración no encontrado: ${serverData.id}.ovpn\n\nColoca el archivo en:\n${CONFIG_DIR}`,
      };
    }

    if (!fs.existsSync(CREDENTIALS_FILE)) {
      return {
        success: false,
        message: `Archivo de credenciales no encontrado.\n\nCrea el archivo:\n${CREDENTIALS_FILE}\n\nCon el formato:\ntu_email@protonmail.com\ntu_contraseña`,
      };
    }

    // Verificar credenciales
    try {
      const authContent = fs.readFileSync(CREDENTIALS_FILE, 'utf8');
      const lines = authContent.trim().split('\n');
      if (lines.length < 2 || !lines[0].trim() || !lines[1].trim()) {
        return {
          success: false,
          message: 'El archivo de credenciales está incompleto.\n\nDebe tener:\nLínea 1: email\nLínea 2: contraseña',
        };
      }
    } catch (err) {
      return {
        success: false,
        message: `Error leyendo credenciales: ${err.message}`,
      };
    }

    // Matar procesos existentes y esperar
    console.log('Killing existing OpenVPN processes...');
    await killExistingOpenVPN();

    // NO intentar eliminar el log si está bloqueado, solo renombrarlo
    if (fs.existsSync(LOG_FILE)) {
      try {
        const backupLog = LOG_FILE + '.old';
        if (fs.existsSync(backupLog)) {
          fs.unlinkSync(backupLog);
        }
        fs.renameSync(LOG_FILE, backupLog);
      } catch (err) {
        console.log('Could not backup old log (file may be in use):', err.message);
        // Continuar de todos modos
      }
    }

    const args = [
      '--config',
      configPath,
      '--auth-user-pass',
      CREDENTIALS_FILE,
      '--log',
      LOG_FILE,
      '--verb',
      '4',
      '--disable-dco', // Deshabilitar DCO para evitar error TDI en Windows
    ];

    currentServer = serverData;
    isConnected = false;

    if (os.platform() === 'win32') {
      console.log('Starting OpenVPN with elevated privileges...');

      try {
        vpnProcess = await spawnElevatedWindows(OPENVPN_PATH, args);

        if (!vpnProcess) {
          return {
            success: false,
            message:
              'No se pudo iniciar OpenVPN.\n\nAsegúrate de:\n1. Aceptar el diálogo UAC\n2. Tener OpenVPN instalado correctamente\n3. Ejecutar la app como administrador',
          };
        }

        console.log('OpenVPN process started, PID:', vpnProcess.pid);

        // Monitorear el log
        let connectionAttempts = 0;
        const maxAttempts = 30; // 30 segundos

        logCheckInterval = setInterval(() => {
          connectionAttempts++;

          if (!vpnProcess || vpnProcess.killed) {
            clearInterval(logCheckInterval);
            logCheckInterval = null;
            return;
          }

          if (connectionAttempts > maxAttempts) {
            clearInterval(logCheckInterval);
            logCheckInterval = null;
            mainWindow?.webContents.send('vpn-error', {
              message:
                'Tiempo de conexión agotado.\n\nRevisa:\n1. Tus credenciales\n2. Tu conexión a internet\n3. El log en: ' +
                LOG_FILE,
            });
            killVPNProcess();
            return;
          }

          try {
            if (fs.existsSync(LOG_FILE)) {
              const logContent = fs.readFileSync(LOG_FILE, 'utf8');

              // Conexión exitosa
              if (logContent.includes('Initialization Sequence Completed')) {
                isConnected = true;
                clearInterval(logCheckInterval);
                logCheckInterval = null;
                mainWindow?.webContents.send('vpn-status-changed', {
                  connected: true,
                  server: currentServer,
                });
                console.log('VPN connected successfully!');
              }

              // Error de autenticación
              if (logContent.includes('AUTH_FAILED') || logContent.includes('auth-failure')) {
                clearInterval(logCheckInterval);
                logCheckInterval = null;
                mainWindow?.webContents.send('vpn-error', {
                  message:
                    'Error de autenticación.\n\nVerifica tus credenciales ProtonVPN en:\n' +
                    CREDENTIALS_FILE +
                    '\n\nAsegúrate de que sean correctas.',
                });
                killVPNProcess();
              }

              // Error de conexión
              if (
                logContent.includes('Connection refused') ||
                logContent.includes('connect error') ||
                logContent.includes('Connection timed out')
              ) {
                clearInterval(logCheckInterval);
                logCheckInterval = null;
                mainWindow?.webContents.send('vpn-error', {
                  message:
                    'No se pudo conectar al servidor.\n\nPosibles causas:\n1. Firewall bloqueando\n2. Sin conexión a internet\n3. Servidor caído\n\nIntenta otro servidor.',
                });
                killVPNProcess();
              }

              // Error de TUN/TAP
              if (logContent.includes('Cannot open TUN/TAP')) {
                clearInterval(logCheckInterval);
                logCheckInterval = null;
                mainWindow?.webContents.send('vpn-error', {
                  message:
                    'Error con adaptador TAP.\n\nSolución:\n1. Reinstala OpenVPN\n2. Asegúrate de instalar el adaptador TAP',
                });
                killVPNProcess();
              }
            }
          } catch (err) {
            // Log no disponible todavía, continuar
          }
        }, 1000);

        return {
          success: true,
          message: 'Conectando a VPN...\n\nEsto puede tardar 10-20 segundos.\nAsegúrate de aceptar el diálogo UAC.',
          server: serverData,
        };
      } catch (error) {
        console.error('Error starting OpenVPN:', error);
        return {
          success: false,
          message: `Error iniciando OpenVPN:\n\n${error.message}\n\nIntenta:\n1. Cerrar la app\n2. Ejecutar como administrador\n3. Aceptar el diálogo UAC`,
        };
      }
    } else {
      // Unix: usar método existente
      const needsElevation = process.getuid && process.getuid() !== 0;

      if (needsElevation) {
        const platform = os.platform();

        if (platform === 'darwin') {
          const script = `do shell script "${OPENVPN_PATH} ${args.join(' ')}" with administrator privileges`;
          vpnProcess = spawn('osascript', ['-e', script]);
        } else {
          vpnProcess = spawn('pkexec', [OPENVPN_PATH, ...args]);
        }
      } else {
        vpnProcess = spawn(OPENVPN_PATH, args);
      }

      if (vpnProcess.stdout) {
        vpnProcess.stdout.on('data', data => {
          const output = data.toString();
          console.log('OpenVPN:', output);

          if (output.includes('Initialization Sequence Completed')) {
            isConnected = true;
            mainWindow?.webContents.send('vpn-status-changed', {
              connected: true,
              server: currentServer,
            });
          }
        });
      }

      if (vpnProcess.stderr) {
        vpnProcess.stderr.on('data', data => {
          console.error('OpenVPN Error:', data.toString());
        });
      }

      vpnProcess.on('exit', code => {
        console.log(`OpenVPN exited with code ${code}`);
        isConnected = false;
        vpnProcess = null;
        mainWindow?.webContents.send('vpn-status-changed', { connected: false });
      });

      return {
        success: true,
        message: 'Conectando a VPN...',
        server: serverData,
      };
    }
  } catch (error) {
    console.error('Error connecting to VPN:', error);
    return {
      success: false,
      message: `Error: ${error.message}`,
    };
  }
}

async function disconnectVPN() {
  try {
    if (logCheckInterval) {
      clearInterval(logCheckInterval);
      logCheckInterval = null;
    }

    if (!vpnProcess) {
      return { success: true, message: 'No hay conexión activa' };
    }

    killVPNProcess();
    await new Promise(resolve => setTimeout(resolve, 2000));

    vpnProcess = null;
    isConnected = false;
    currentServer = null;

    return {
      success: true,
      message: 'Desconectado exitosamente',
    };
  } catch (error) {
    console.error('Error disconnecting VPN:', error);
    return {
      success: false,
      message: `Error al desconectar: ${error.message}`,
    };
  }
}

function killVPNProcess() {
  if (!vpnProcess) return;

  try {
    if (os.platform() === 'win32') {
      // Windows: matar todos los procesos openvpn
      exec('taskkill /IM openvpn.exe /F /T', err => {
        if (err) {
          console.log('Note: taskkill returned error (may be normal if process already closed)');
        }
      });
      if (vpnProcess) {
        vpnProcess.killed = true;
      }
    } else {
      vpnProcess.kill('SIGTERM');

      setTimeout(() => {
        if (vpnProcess && !vpnProcess.killed) {
          vpnProcess.kill('SIGKILL');
        }
      }, 2000);
    }
  } catch (error) {
    console.error('Error killing VPN process:', error);
  }
}

// IPC Handlers
ipcMain.handle('connect-vpn', async (event, serverData) => {
  return await connectVPN(serverData);
});

ipcMain.handle('disconnect-vpn', async () => {
  return await disconnectVPN();
});

ipcMain.handle('get-vpn-status', async () => {
  return {
    connected: isConnected,
    server: currentServer,
  };
});

ipcMain.handle('get-servers', async () => {
  const serverDatabase = {
    ca: { name: 'Canadá', flag: '🇨🇦', city: 'Montreal' },
    jp: { name: 'Japón', flag: '🇯🇵', city: 'Tokio' },
    nl: { name: 'Países Bajos', flag: '🇳🇱', city: 'Ámsterdam' },
    no: { name: 'Noruega', flag: '🇳🇴', city: 'Oslo' },
    us: { name: 'Estados Unidos', flag: '🇺🇸', city: 'Nueva York' },
  };

  try {
    const files = fs.readdirSync(CONFIG_DIR);
    const ovpnFiles = files.filter(f => f.endsWith('.ovpn'));

    if (ovpnFiles.length === 0) {
      return Object.keys(serverDatabase).map(code => ({
        id: `${code}-1`,
        name: `${serverDatabase[code].name} - ${serverDatabase[code].city}`,
        country: code.toUpperCase(),
        flag: serverDatabase[code].flag,
        load: Math.floor(Math.random() * 60) + 20,
        status: 'missing',
      }));
    }

    return ovpnFiles.map(file => {
      const id = file.replace('.ovpn', '');
      const countryCode = id.split('-')[0];
      const serverInfo = serverDatabase[countryCode] || {
        name: countryCode.toUpperCase(),
        flag: '🌍',
        city: 'Unknown',
      };

      return {
        id,
        name: `${serverInfo.name} - ${serverInfo.city}`,
        country: countryCode.toUpperCase(),
        flag: serverInfo.flag,
        load: Math.floor(Math.random() * 60) + 20,
        status: 'available',
      };
    });
  } catch (error) {
    console.error('Error reading server configs:', error);
    return [];
  }
});

ipcMain.handle('check-openvpn', async () => {
  const installed = await checkOpenVPNInstalled();
  return { installed };
});

ipcMain.handle('show-log', async () => {
  if (fs.existsSync(LOG_FILE)) {
    try {
      const log = fs.readFileSync(LOG_FILE, 'utf8');
      dialog.showMessageBox(mainWindow, {
        type: 'info',
        title: 'Log de VPN',
        message: 'Últimas 50 líneas del log:',
        detail: log.split('\n').slice(-50).join('\n'),
        buttons: ['OK'],
      });
    } catch (err) {
      dialog.showMessageBox(mainWindow, {
        type: 'error',
        title: 'Error',
        message: 'No se pudo leer el log: ' + err.message,
        buttons: ['OK'],
      });
    }
  } else {
    dialog.showMessageBox(mainWindow, {
      type: 'warning',
      title: 'Log no disponible',
      message: 'El archivo de log no existe aún.',
      buttons: ['OK'],
    });
  }
});
