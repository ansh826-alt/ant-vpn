# 🚀 Configuración de Mi VPN con ProtonVPN

## ✅ Paso 1: Estructura de Carpetas

Asegúrate de tener esta estructura:

```
mi-vpn-app/
├── main.js                    ✅ (actualizado)
├── preload.js                 ✅ (actualizado)
├── renderer.js                ✅ (actualizado)
├── index.html                 ✅ (ya lo tienes)
├── styles.css                 ✅ (ya lo tienes)
├── package.json               ✅ (actualizado)
├── vpn-configs/               👈 CREAR
│   ├── ca-1.ovpn             📄 Renombrar ca-free-8.protonvpn.udp.ovpn
│   ├── jp-1.ovpn             📄 Renombrar jp-free-26.protonvpn.udp.ovpn
│   ├── nl-1.ovpn             📄 Renombrar nl-free-209.protonvpn.udp.ovpn
│   ├── no-1.ovpn             📄 Renombrar no-free-7.protonvpn.udp.ovpn
│   └── us-1.ovpn             📄 Renombrar us-free-97.protonvpn.udp.ovpn
├── vpn-credentials/           👈 CREAR
│   └── auth.txt              📄 Tus credenciales ProtonVPN
└── logs/                      👈 CREAR (vacía)
```

---

## 📝 Paso 2: Renombrar Archivos .ovpn

### Windows (PowerShell):
```powershell
# Crear carpetas
New-Item -ItemType Directory -Force -Path vpn-configs, vpn-credentials, logs

# Renombrar archivos (ajusta las rutas según donde estén tus archivos)
Copy-Item "ca-free-8.protonvpn.udp.ovpn" "vpn-configs\ca-1.ovpn"
Copy-Item "jp-free-26.protonvpn.udp.ovpn" "vpn-configs\jp-1.ovpn"
Copy-Item "nl-free-209.protonvpn.udp.ovpn" "vpn-configs\nl-1.ovpn"
Copy-Item "no-free-7.protonvpn.udp.ovpn" "vpn-configs\no-1.ovpn"
Copy-Item "us-free-97.protonvpn.udp.ovpn" "vpn-configs\us-1.ovpn"
```

### Linux/macOS (Terminal):
```bash
# Crear carpetas
mkdir -p vpn-configs vpn-credentials logs

# Renombrar archivos
cp ca-free-8.protonvpn.udp.ovpn vpn-configs/ca-1.ovpn
cp jp-free-26.protonvpn.udp.ovpn vpn-configs/jp-1.ovpn
cp nl-free-209.protonvpn.udp.ovpn vpn-configs/nl-1.ovpn
cp no-free-7.protonvpn.udp.ovpn vpn-configs/no-1.ovpn
cp us-free-97.protonvpn.udp.ovpn vpn-configs/us-1.ovpn
```

### Manualmente (cualquier SO):
1. Crea la carpeta `vpn-configs/`
2. Copia tus 5 archivos .ovpn allí
3. Renómbralos:
   - `ca-free-8.protonvpn.udp.ovpn` → `ca-1.ovpn`
   - `jp-free-26.protonvpn.udp.ovpn` → `jp-1.ovpn`
   - `nl-free-209.protonvpn.udp.ovpn` → `nl-1.ovpn`
   - `no-free-7.protonvpn.udp.ovpn` → `no-1.ovpn`
   - `us-free-97.protonvpn.udp.ovpn` → `us-1.ovpn`

---

## 🔑 Paso 3: Crear Archivo de Credenciales

Crea el archivo `vpn-credentials/auth.txt` con este contenido:

```
tu_email@protonmail.com
tu_contraseña_protonvpn
```

**⚠️ IMPORTANTE:**
- Línea 1: Tu email de ProtonVPN
- Línea 2: Tu contraseña de ProtonVPN
- NO dejes espacios antes o después
- NO uses comillas ni caracteres especiales adicionales

**Ejemplo real:**
```
juan.perez@protonmail.com
MiContraseñaSegura123!
```

---

## 🔧 Paso 4: Verificar OpenVPN

### Windows:
```bash
"C:\Program Files\OpenVPN\bin\openvpn.exe" --version
```

Si no está instalado:
```bash
# Con Chocolatey
choco install openvpn

# O descarga manualmente de:
# https://openvpn.net/community-downloads/
```

### macOS:
```bash
openvpn --version
```

Si no está instalado:
```bash
brew install openvpn
```

### Linux (Ubuntu/Debian):
```bash
openvpn --version
```

Si no está instalado:
```bash
sudo apt-get update
sudo apt-get install openvpn
```

---

## 🚀 Paso 5: Instalar Dependencias del Proyecto

```bash
npm install
```

Esto instalará:
- electron
- electron-builder
- sudo-prompt (para permisos de administrador)

---

## ✨ Paso 6: Ejecutar la Aplicación

```bash
npm start
```

**Lo que sucederá:**

1. Se abrirá la ventana de la aplicación
2. Verás 5 servidores disponibles:
   - 🇨🇦 Canadá - Montreal
   - 🇯🇵 Japón - Tokio
   - 🇳🇱 Países Bajos - Ámsterdam
   - 🇳🇴 Noruega - Oslo
   - 🇺🇸 Estados Unidos - Nueva York

3. Haz clic en "Seleccionar servidor"
4. Elige un servidor
5. Haz clic en el botón grande "Conectar"
6. **Se te pedirá contraseña de administrador** (esto es normal y necesario)
7. Espera 5-10 segundos
8. ¡Conectado! 🎉

---

## 🔍 Verificar que Funciona

### Método 1: Comprobar IP

**Antes de conectar:**
1. Abre tu navegador
2. Ve a: https://www.whatismyip.com/
3. Anota tu IP real

**Después de conectar:**
1. Actualiza la página
2. Tu IP debería ser diferente (la del servidor VPN)

### Método 2: Comando Terminal

**Antes de conectar:**
```bash
curl ifconfig.me
# Tu IP real: 203.0.113.45 (ejemplo)
```

**Después de conectar:**
```bash
curl ifconfig.me
# IP del servidor VPN: 149.102.242.89 (si conectaste a US-1)
```

---

## 🐛 Solución de Problemas Comunes

### Error: "Archivo de credenciales no encontrado"

**Solución:**
```bash
# Verificar que existe
ls vpn-credentials/auth.txt    # Linux/macOS
dir vpn-credentials\auth.txt   # Windows

# Si no existe, créalo:
echo "tu_email@protonmail.com" > vpn-credentials/auth.txt
echo "tu_contraseña" >> vpn-credentials/auth.txt
```

---

### Error: "AUTH_FAILED"

**Causas comunes:**
1. ❌ Credenciales incorrectas
2. ❌ Espacios en el archivo auth.txt
3. ❌ Cuenta ProtonVPN no activa

**Solución:**
1. Verifica tus credenciales en https://account.protonvpn.com/
2. Prueba iniciar sesión en el sitio web de ProtonVPN
3. Recrea el archivo auth.txt sin espacios:
   ```
   email@ejemplo.com
   contraseña
   ```
4. Si usas cuenta gratuita, verifica que no hayas excedido los dispositivos permitidos

---

### Error: "OpenVPN no está instalado"

**Windows:**
```bash
choco install openvpn
```

**macOS:**
```bash
brew install openvpn
```

**Linux:**
```bash
sudo apt-get install openvpn
```

---

### Conexión se queda en "Conectando..."

**Solución:**
1. Revisa el log:
   ```bash
   tail -f logs/vpn.log
   ```

2. Busca errores específicos:
   ```bash
   grep -i error logs/vpn.log
   ```

3. Causas comunes:
   - Firewall bloqueando conexión → Desactiva temporalmente
   - Puerto bloqueado → ProtonVPN usa múltiples puertos, debería funcionar
   - Servidor caído → Prueba otro servidor

---

### Error: "Se requieren permisos de administrador"

**Esto es NORMAL y NECESARIO**

**Windows:**
- Acepta el diálogo UAC cuando aparezca
- La app necesita permisos para modificar rutas de red

**macOS:**
- Introduce tu contraseña de usuario cuando se solicite
- Esto es necesario para ejecutar OpenVPN

**Linux:**
- Introduce tu contraseña de sudo
- O instala PolicyKit: `sudo apt-get install policykit-1`

---

## 📊 Ver Logs en Tiempo Real

```bash
# Ver últimas líneas
tail -n 50 logs/vpn.log

# Ver en tiempo real
tail -f logs/vpn.log

# Buscar "Initialization Sequence Completed" (señal de éxito)
grep "Initialization Sequence Completed" logs/vpn.log
```

---

## 🎯 Próximos Pasos

Una vez que funcione:

### 1. Añadir más servidores ProtonVPN
- Descarga más archivos .ovpn desde tu cuenta
- Renómbralos al formato correcto: `[código-país]-[número].ovpn`
- Cópialos a `vpn-configs/`

### 2. Compilar la aplicación
```bash
# Crear ejecutable para tu sistema
npm run build

# Los archivos estarán en la carpeta dist/
```

### 3. Mejoras opcionales
- Kill switch (bloquear tráfico si VPN se desconecta)
- Reconexión automática
- Selección de servidor más rápido automáticamente
- Notificaciones del sistema

---

## 📞 ¿Necesitas Ayuda?

Si algo no funciona:

1. **Revisa el log:**
   ```bash
   cat logs/vpn.log
   ```

2. **Prueba conexión manual:**
   ```bash
   # Linux/macOS
   sudo openvpn --config vpn-configs/us-1.ovpn --auth-user-pass vpn-credentials/auth.txt
   
   # Windows (como Admin)
   "C:\Program Files\OpenVPN\bin\openvpn.exe" --config vpn-configs\us-1.ovpn --auth-user-pass vpn-credentials\auth.txt
   ```

3. **Verifica archivos:**
   ```bash
   # ¿Existen los archivos?
   ls vpn-configs/
   ls vpn-credentials/
   
   # ¿Tienen el contenido correcto?
   cat vpn-configs/us-1.ovpn | head -n 5
   cat vpn-credentials/auth.txt
   ```

---

## ✅ Checklist Final

Antes de ejecutar `npm start`, verifica:

- [ ] OpenVPN instalado (`openvpn --version`)
- [ ] Carpeta `vpn-configs/` existe
- [ ] 5 archivos .ovpn renombrados correctamente
- [ ] Carpeta `vpn-credentials/` existe
- [ ] Archivo `auth.txt` con credenciales correctas
- [ ] Carpeta `logs/` existe (se crea automáticamente)
- [ ] Dependencias instaladas (`npm install`)
- [ ] Archivos main.js, preload.js, renderer.js actualizados

---

## 🎉 ¡Listo para Usar!

Si todo está configurado correctamente:

```bash
npm start
```

Y disfruta de tu VPN de escritorio con ProtonVPN 🔐✨

---

**Tiempo estimado de setup: 10-15 minutos**