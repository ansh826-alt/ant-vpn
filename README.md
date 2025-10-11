# 🔐 Mi VPN - Aplicación de Escritorio con OpenVPN

<div align="center">

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-lightgrey.svg)
![Electron](https://img.shields.io/badge/Electron-27.0.0-47848F.svg)
![OpenVPN](https://img.shields.io/badge/OpenVPN-2.6+-green.svg)

Una aplicación de escritorio moderna y elegante para gestionar conexiones VPN usando OpenVPN, construida con Electron.

[Características](#características) • [Instalación](#instalación) • [Uso](#uso) • [Capturas](#capturas) • [Contribuir](#contribuir)

</div>

---

## ✨ Características

- 🎨 **Interfaz moderna y minimalista** - Diseño limpio inspirado en aplicaciones profesionales
- 🌍 **Multi-servidor** - Soporte para múltiples ubicaciones de servidores VPN
- 🔒 **Seguridad robusta** - Integración completa con OpenVPN y cifrado AES-256-GCM
- 📊 **Estadísticas en tiempo real** - Monitoreo de velocidad de descarga/subida y duración de conexión
- 💻 **Multiplataforma** - Compatible con Windows, macOS y Linux
- 🚀 **Conexión rápida** - Conexión en menos de 20 segundos
- 🔄 **Detección automática** - Detecta y lista automáticamente archivos de configuración .ovpn
- 📝 **Logs detallados** - Sistema completo de logging para diagnóstico
- ⚡ **Gestión de permisos** - Manejo automático de permisos de administrador
- 🎯 **Compatible con ProtonVPN** - Configurado y probado con ProtonVPN Free

---

## 🖼️ Capturas

<div align="center">

### Estado Desconectado
Interfaz limpia mostrando el estado de desconexión y servidores disponibles.

### Estado Conectado
Vista de conexión activa con estadísticas en tiempo real de velocidad y duración.

### Selección de Servidor
Lista completa de servidores VPN con banderas, nombres y carga del servidor.

</div>

---

## 🚀 Inicio Rápido

### Prerrequisitos

- **Node.js** v16 o superior
- **OpenVPN** 2.5 o superior
- Archivos de configuración `.ovpn` de tu proveedor VPN

### Instalación

```bash
# Clonar el repositorio
git clone https://github.com/cmurestudillos/ant-vpn.git
cd mi-vpn-app

# Instalar dependencias
npm install

# Ejecutar en modo desarrollo
npm start
```

### Configuración Rápida

1. **Instalar OpenVPN:**

   **Windows:**
   ```bash
   choco install openvpn
   ```

   **macOS:**
   ```bash
   brew install openvpn
   ```

   **Linux (Ubuntu/Debian):**
   ```bash
   sudo apt-get install openvpn
   ```

2. **Agregar archivos .ovpn:**
   
   Coloca tus archivos de configuración en `vpn-configs/` con el formato:
   ```
   vpn-configs/
   ├── us-1.ovpn     # Estados Unidos
   ├── uk-1.ovpn     # Reino Unido
   ├── de-1.ovpn     # Alemania
   └── ...
   ```

3. **Configurar credenciales:**
   
   Crea `vpn-credentials/auth.txt`:
   ```
   tu_email@ejemplo.com
   tu_contraseña
   ```

4. **¡Listo!** Ejecuta `npm start` y comienza a usar tu VPN.

---

## 📖 Uso

### Conectar a una VPN

1. Inicia la aplicación
2. Haz clic en "Seleccionar servidor"
3. Elige tu ubicación preferida
4. Haz clic en el botón grande "Conectar"
5. Acepta el diálogo de permisos (UAC en Windows)
6. ¡Espera 10-20 segundos y estarás conectado!

### Desconectar

Simplemente haz clic en el botón "Desconectar" cuando la VPN esté activa.

### Ver Estadísticas

La aplicación muestra en tiempo real:
- **Velocidad de descarga** (MB/s)
- **Velocidad de subida** (MB/s)
- **Duración de la conexión** (HH:MM:SS)

---

## 🛠️ Tecnologías

- **[Electron](https://www.electronjs.org/)** - Framework para aplicaciones de escritorio
- **[OpenVPN](https://openvpn.net/)** - Protocolo VPN de código abierto
- **JavaScript (ES6+)** - Lenguaje de programación
- **HTML5 & CSS3** - Interfaz de usuario moderna
- **Node.js** - Runtime de JavaScript

---

## 📁 Estructura del Proyecto

```
ant-vpn/
├── main.js                 # Proceso principal de Electron
├── preload.js              # Script de preload (bridge seguro)
├── renderer.js             # Lógica de interfaz de usuario
├── index.html              # Interfaz HTML
├── styles.css              # Estilos de la aplicación
├── package.json            # Dependencias y configuración
├── vpn-configs/            # Archivos de configuración .ovpn
│   └── *.ovpn
├── vpn-credentials/        # Credenciales de autenticación
│   └── auth.txt
├── logs/                   # Logs de OpenVPN
│   └── vpn.log
└── assets/                 # Recursos (iconos, imágenes)
    └── icon.png
```

---

## 🔧 Compilar la Aplicación

### Compilar para tu plataforma

```bash
npm run build
```

### Compilar para plataforma específica

```bash
# Windows
npm run build:win

# macOS
npm run build:mac

# Linux
npm run build:linux
```

Los ejecutables se generarán en la carpeta `dist/`.

---

## 🐛 Solución de Problemas

### Error: "OpenVPN no está instalado"

**Solución:** Instala OpenVPN para tu sistema operativo. Ver [Instalación](#instalación).

### Error: "AUTH_FAILED"

**Solución:** Verifica que tus credenciales en `vpn-credentials/auth.txt` sean correctas.

### Error: "Archivo de configuración no encontrado"

**Solución:** Asegúrate de que los archivos .ovpn estén en `vpn-configs/` con nombres como `us-1.ovpn`, `uk-1.ovpn`, etc.

### La conexión se queda en "Conectando..."

**Solución:** 
1. Prueba con otro servidor
2. Revisa el log en `logs/vpn.log`
3. Asegúrate de que no haya firewall bloqueando OpenVPN

Para más ayuda, consulta [SOLUCION-WINDOWS.md](SOLUCION-WINDOWS.md) o [SETUP-PROTONVPN.md](SETUP-PROTONVPN.md).

---

## 🤝 Contribuir

¡Las contribuciones son bienvenidas! Si quieres mejorar esta aplicación:

1. Fork el proyecto
2. Crea una rama para tu característica (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

### Ideas para Contribuir

- ✨ Implementar kill switch (bloquear tráfico si VPN se cae)
- 🔄 Reconexión automática
- 🌐 Soporte para WireGuard
- 📱 Notificaciones del sistema
- 🌓 Tema oscuro/claro
- 🚀 Auto-actualización
- 📊 Estadísticas avanzadas de uso

---

## 📝 Roadmap

- [x] Interfaz básica de usuario
- [x] Integración con OpenVPN
- [x] Soporte multi-servidor
- [x] Estadísticas en tiempo real
- [x] Multiplataforma (Windows, macOS, Linux)
- [ ] Kill switch
- [ ] Reconexión automática
- [ ] Soporte para WireGuard
- [ ] Auto-actualización
- [ ] Modo túnel dividido (split tunneling)
- [ ] Tema oscuro

---

## 🔒 Seguridad

Esta aplicación:
- ✅ **No almacena contraseñas en memoria** después de conectar
- ✅ Usa cifrado **AES-256-GCM**
- ✅ Valida certificados SSL/TLS
- ✅ Logs locales (nunca se envían a servidores externos)
- ✅ Código abierto y auditable

**Nota de seguridad:** Mantén tu archivo `vpn-credentials/auth.txt` seguro y con permisos restrictivos.

---

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo [LICENSE](LICENSE) para más detalles.

```
MIT License

Copyright (c) 2025 [Tu Nombre]

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction...
```

---

## 👤 Autor

**Tu Nombre**

- GitHub: [@tu-usuario](https://github.com/cmurestudillos)

---

## 🙏 Agradecimientos

- [Electron](https://www.electronjs.org/) - Por el excelente framework
- [OpenVPN](https://openvpn.net/) - Por el protocolo VPN robusto y seguro
- [ProtonVPN](https://protonvpn.com/) - Por los servidores gratuitos de prueba
- La comunidad de código abierto

---

## ⭐ Dale una Estrella

Si este proyecto te fue útil, ¡no olvides darle una estrella! ⭐

---

## 📮 Contacto

¿Preguntas? ¿Sugerencias? ¿Encontraste un bug?

- 🐛 [Reportar un bug](https://github.com/cmurestudillos/ant-vpn/issues)
- 💡 [Sugerir una característica](https://github.com/cmurestudillos/ant-vpn/issues)

---

<div align="center">

**Hecho con ❤️ usando Electron y OpenVPN**

[⬆ Volver arriba](#-mi-vpn---aplicación-de-escritorio-con-openvpn)

</div>