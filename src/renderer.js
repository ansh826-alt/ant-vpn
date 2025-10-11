let isConnected = false;
let isConnecting = false;
let selectedServer = null;
let connectionStartTime = null;
let durationInterval = null;
let speedInterval = null;

// Elements
const connectButton = document.getElementById('connectButton');
const statusIndicator = document.getElementById('statusIndicator');
const statusTitle = document.getElementById('statusTitle');
const statusSubtitle = document.getElementById('statusSubtitle');
const serverButton = document.getElementById('serverButton');
const selectedServerSpan = document.getElementById('selectedServer');
const serverList = document.getElementById('serverList');
const closeServerListButton = document.getElementById('closeServerList');
const serverItems = document.getElementById('serverItems');
const downloadSpeed = document.getElementById('downloadSpeed');
const uploadSpeed = document.getElementById('uploadSpeed');
const durationElement = document.getElementById('duration');

// Initialize
async function init() {
  await checkOpenVPNInstallation();
  await loadServers();
  updateUI();
  setupEventListeners();

  // Registrar listeners para eventos del servidor
  window.vpnAPI.onVPNStatusChanged(data => {
    isConnected = data.connected;
    if (data.connected && data.server) {
      selectedServer = data.server;
      connectionStartTime = Date.now();
      startDurationTimer();
      startSpeedSimulation();
    } else {
      stopDurationTimer();
      stopSpeedSimulation();
    }
    isConnecting = false;
    updateUI();
  });

  window.vpnAPI.onVPNError(data => {
    alert(`Error de VPN: ${data.message}`);
    isConnecting = false;
    isConnected = false;
    updateUI();
  });
}

// Check OpenVPN
async function checkOpenVPNInstallation() {
  try {
    const result = await window.vpnAPI.checkOpenVPN();
    if (!result.installed) {
      alert(
        '⚠️ OpenVPN no está instalado\n\nPor favor instala OpenVPN:\n\nWindows: https://openvpn.net/community-downloads/\nmacOS: brew install openvpn\nLinux: sudo apt-get install openvpn'
      );
    }
  } catch (error) {
    console.error('Error checking OpenVPN:', error);
  }
}

// Event listeners
function setupEventListeners() {
  connectButton.addEventListener('click', handleConnectClick);
  serverButton.addEventListener('click', showServerList);
  closeServerListButton.addEventListener('click', hideServerList);
}

// Load servers
async function loadServers() {
  try {
    const servers = await window.vpnAPI.getServers();
    renderServers(servers);

    // Auto-seleccionar el primer servidor disponible
    const availableServer = servers.find(s => s.status === 'available');
    if (availableServer && !selectedServer) {
      selectedServer = availableServer;
      selectedServerSpan.textContent = `${availableServer.flag} ${availableServer.name}`;
    } else if (servers.length > 0 && !selectedServer) {
      // Si no hay servidores disponibles, mostrar el primero como sugerencia
      selectedServer = servers[0];
      selectedServerSpan.textContent = `${servers[0].flag} ${servers[0].name} (falta archivo)`;
    }
  } catch (error) {
    console.error('Error loading servers:', error);
  }
}

// Render servers
function renderServers(servers) {
  serverItems.innerHTML = '';

  if (servers.length === 0) {
    serverItems.innerHTML = `
      <div style="padding: 40px 20px; text-align: center; opacity: 0.7;">
        <p>No se encontraron archivos .ovpn</p>
        <p style="font-size: 12px; margin-top: 10px;">
          Coloca archivos .ovpn en la carpeta vpn-configs/
        </p>
      </div>
    `;
    return;
  }

  servers.forEach(server => {
    const serverElement = document.createElement('div');
    serverElement.className = 'server-item';

    const statusBadge =
      server.status === 'missing'
        ? '<span style="font-size: 10px; background: rgba(239, 68, 68, 0.3); padding: 2px 6px; border-radius: 4px; margin-left: 8px;">Falta archivo</span>'
        : '';

    serverElement.innerHTML = `
      <div class="server-info">
        <div class="server-flag">${server.flag}</div>
        <div class="server-details">
          <div class="server-name">${server.name} ${statusBadge}</div>
          <div class="server-load">Carga: ${server.load}%</div>
        </div>
      </div>
      <div class="load-bar">
        <div class="load-fill" style="width: ${server.load}%"></div>
      </div>
    `;

    serverElement.addEventListener('click', () => {
      if (server.status !== 'missing') {
        selectServer(server);
      } else {
        alert(
          `⚠️ Archivo faltante\n\nPara usar este servidor, necesitas:\n1. Renombrar tu archivo .ovpn a: ${server.id}.ovpn\n2. Colocarlo en la carpeta: vpn-configs/`
        );
      }
    });

    serverItems.appendChild(serverElement);
  });
}

// Select server
function selectServer(server) {
  selectedServer = server;
  selectedServerSpan.textContent = `${server.flag} ${server.name}`;
  hideServerList();
}

// Show/hide server list
function showServerList() {
  serverList.classList.remove('hidden');
}

function hideServerList() {
  serverList.classList.add('hidden');
}

// Handle connect click
async function handleConnectClick() {
  if (isConnecting) return;

  if (isConnected) {
    await disconnect();
  } else {
    await connect();
  }
}

// Connect
async function connect() {
  if (!selectedServer) {
    alert('⚠️ Por favor selecciona un servidor');
    return;
  }

  if (selectedServer.status === 'missing') {
    alert(
      `⚠️ Archivo de configuración faltante\n\nNecesitas el archivo: ${selectedServer.id}.ovpn\nen la carpeta: vpn-configs/`
    );
    return;
  }

  isConnecting = true;
  updateUI();

  try {
    const result = await window.vpnAPI.connectVPN(selectedServer);

    if (result.success) {
      // El estado se actualizará cuando el servidor confirme la conexión
      console.log('Conexión iniciada...');
    } else {
      alert(`❌ Error de conexión\n\n${result.message}`);
      isConnecting = false;
      updateUI();
    }
  } catch (error) {
    alert(`❌ Error al conectar\n\n${error.message}`);
    isConnecting = false;
    updateUI();
  }
}

// Disconnect
async function disconnect() {
  isConnecting = true;
  updateUI();

  try {
    const result = await window.vpnAPI.disconnectVPN();

    if (result.success) {
      isConnected = false;
      stopDurationTimer();
      stopSpeedSimulation();
    } else {
      alert(`❌ Error al desconectar\n\n${result.message}`);
    }
  } catch (error) {
    alert(`❌ Error al desconectar\n\n${error.message}`);
  } finally {
    isConnecting = false;
    updateUI();
  }
}

// Update UI
function updateUI() {
  if (isConnecting) {
    statusIndicator.className = 'status-indicator connecting';
    statusTitle.textContent = 'Conectando...';
    statusSubtitle.textContent = 'Estableciendo conexión segura';
    connectButton.className = 'connect-button connecting';
    connectButton.innerHTML = `
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
      </svg>
      <span>Conectando...</span>
    `;
  } else if (isConnected) {
    statusIndicator.className = 'status-indicator connected';
    statusTitle.textContent = 'Conectado';
    statusSubtitle.textContent = `${selectedServer.flag} ${selectedServer.name}`;
    connectButton.className = 'connect-button connected';
    connectButton.innerHTML = `
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <rect x="6" y="6" width="12" height="12" stroke="currentColor" stroke-width="2"/>
      </svg>
      <span>Desconectar</span>
    `;
  } else {
    statusIndicator.className = 'status-indicator';
    statusTitle.textContent = 'Desconectado';
    statusSubtitle.textContent = 'No protegido';
    connectButton.className = 'connect-button';
    connectButton.innerHTML = `
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
        <path d="M8 12h8M12 8v8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      </svg>
      <span>Conectar</span>
    `;
  }
}

// Duration timer
function startDurationTimer() {
  if (durationInterval) {
    clearInterval(durationInterval);
  }

  durationInterval = setInterval(() => {
    const elapsed = Date.now() - connectionStartTime;
    const hours = Math.floor(elapsed / 3600000);
    const minutes = Math.floor((elapsed % 3600000) / 60000);
    const seconds = Math.floor((elapsed % 60000) / 1000);

    durationElement.textContent = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }, 1000);
}

function stopDurationTimer() {
  if (durationInterval) {
    clearInterval(durationInterval);
    durationInterval = null;
  }
  durationElement.textContent = '00:00:00';
}

// Speed simulation
function startSpeedSimulation() {
  if (speedInterval) {
    clearInterval(speedInterval);
  }

  speedInterval = setInterval(() => {
    if (isConnected) {
      const download = (Math.random() * 50 + 10).toFixed(1);
      const upload = (Math.random() * 20 + 5).toFixed(1);
      downloadSpeed.textContent = `${download} MB/s`;
      uploadSpeed.textContent = `${upload} MB/s`;
    }
  }, 2000);
}

function stopSpeedSimulation() {
  if (speedInterval) {
    clearInterval(speedInterval);
    speedInterval = null;
  }
  downloadSpeed.textContent = '0 MB/s';
  uploadSpeed.textContent = '0 MB/s';
}

// Start app
init();
