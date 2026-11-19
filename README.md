# Sestaoko Musika Eskola — Kantari 🎵

Aplicación web progresiva (PWA) para gestionar y consultar el repertorio de canciones del coro de **Sestaoko Musika Eskola** (Sestao, Bizkaia).

## ¿Qué hace?

Permite a los integrantes del coro consultar letras de canciones desde el móvil, y a la administración gestionar el repertorio y preparar listas para actuaciones.

### Para los coristas
- Consultar letras con búsqueda y ordenación (por índice o alfabética)
- Ver listas personalizadas preparadas para cada actuación
- Reproducir vídeos de YouTube integrados en la letra
- Escuchar/ver audios y vídeos subidos a cada canción
- Ajustar el tamaño del texto (5 niveles) y modo claro/oscuro
- Instalar como app nativa en el móvil (PWA)

### Para la administración
- Añadir, editar y eliminar canciones con gestión automática de índices
- Subir audios y vídeos a cada canción, comprimidos automáticamente en el navegador
- Crear listas de canciones (*setlists*) con orden personalizado por actuación
- Panel protegido con contraseña maestra (sesión persistente en el dispositivo)
- Actualizaciones en tiempo real visibles para todos los dispositivos sin recargar

## Tecnología

| Capa | Tecnología |
|---|---|
| Frontend | React 18 + Vite 6 |
| Base de datos | Firebase Firestore (tiempo real) |
| Autenticación | Firebase Auth |
| Archivos (audio/vídeo) | Google Drive de la escuela vía Google Apps Script + compresión en navegador con [Mediabunny](https://mediabunny.dev) |
| Hosting | GitHub Pages |
| CI/CD | GitHub Actions |

Todo funciona gratis y sin tarjeta. Firestore y Auth usan el plan gratuito Spark de Firebase. Los audios y vídeos se guardan en el Google Drive de una cuenta de Gmail de la escuela (15 GB). La app los sube a través de un pequeño script de Google Apps Script que comprueba el login del admin, así que no hay ninguna credencial de Drive en el código público. Instrucciones de despliegue en [apps-script/README.md](apps-script/README.md).

### Compresión de archivos

**Desactivada por defecto**: con los 15 GB de Drive se suben los archivos originales. Se puede activar por tipo con `COMPRESS_AUDIO` / `COMPRESS_VIDEO` en `src/services/media.js`. Si un archivo supera el límite de 200 MB, se comprime siempre, aunque la compresión esté desactivada. Activada, el navegador del admin recomprime así antes de enviar:

- **Audio** → MP3 a 96 kbps
- **Vídeo** → MP4 (H.264 + AAC), lado corto máx. 720 px, ~1,2 Mbps

Si el navegador no puede comprimir o el resultado no ahorra al menos un 10 %, se sube el original. Los archivos se envían en trozos de 8 MB. Límite por archivo: 200 MB (`MAX_FILE_BYTES` en `apps-script/Code.gs`).

## Configuración para desarrollo local

### 1. Clonar e instalar

```bash
git clone https://github.com/AitorMencias/sestaoko-musika-eskola.git
cd sestaoko-musika-eskola
npm install
```

### 2. Configurar Firebase

Crea un fichero `.env.local` a partir del ejemplo:

```bash
cp .env.local.example .env.local
# Edita .env.local con los valores de tu proyecto Firebase
```

### 3. Arrancar en local

```bash
npm run dev
```

## Despliegue

El despliegue a GitHub Pages se dispara automáticamente al hacer push a `main` mediante GitHub Actions. Requiere configurar los **Repository Secrets** del repositorio con los valores de Firebase y `DRIVE_SCRIPT_URL` (ver `.github/workflows/deploy.yml`).

## Seguridad

Las reglas de Firestore (`firestore.rules`) permiten lectura pública y escritura solo a usuarios autenticados. El script de Drive (`apps-script/Code.gs`) solo acepta peticiones con un ID token de Firebase válido del admin, solo admite audio/vídeo y solo borra archivos de su carpeta. La clave de administración es gestionada por Firebase Authentication y nunca se almacena en el código fuente.
