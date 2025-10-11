const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('vpnAPI', {
  connectVPN: serverData => ipcRenderer.invoke('connect-vpn', serverData),
  disconnectVPN: () => ipcRenderer.invoke('disconnect-vpn'),
  getVPNStatus: () => ipcRenderer.invoke('get-vpn-status'),
  getServers: () => ipcRenderer.invoke('get-servers'),
  checkOpenVPN: () => ipcRenderer.invoke('check-openvpn'),
  showLog: () => ipcRenderer.invoke('show-log'),

  // Eventos del servidor
  onVPNStatusChanged: callback => {
    ipcRenderer.on('vpn-status-changed', (event, data) => callback(data));
  },

  onVPNError: callback => {
    ipcRenderer.on('vpn-error', (event, data) => callback(data));
  },
});
