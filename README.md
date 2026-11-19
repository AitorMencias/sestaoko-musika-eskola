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
| Archivos (audio/vídeo) | Firebase Storage + compresión en navegador con [Mediabunny](https://mediabunny.dev) |
| Hosting | GitHub Pages |
| CI/CD | GitHub Actions |

La app no tiene backend propio. Firestore y Auth funcionan en el plan gratuito Spark. **Firebase Storage requiere el plan Blaze** (pago por uso) para buckets `*.firebasestorage.app`, pero incluye 5 GB de almacenamiento y 100 GB/mes de descarga gratis; con el volumen de un coro el coste es 0 €. Recomendado: crear una alerta de presupuesto de 1 € en Google Cloud.

### Compresión de archivos

Al subir un archivo, el navegador del admin lo recomprime antes de enviarlo (`src/services/media.js`):

- **Audio** → MP3 a 96 kbps
- **Vídeo** → MP4 (H.264 + AAC), lado corto máx. 720 px, ~1,2 Mbps

Si el navegador no puede comprimir o el resultado no ahorra al menos un 10 %, se sube el original. Límite por archivo: 60 MB (ver `storage.rules`).

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

El despliegue a GitHub Pages se dispara automáticamente al hacer push a `main` mediante GitHub Actions. Requiere configurar los **Repository Secrets** del repositorio con los valores de Firebase (ver `.github/workflows/deploy.yml`).

## Seguridad

Las reglas de Firestore (`firestore.rules`) y Storage (`storage.rules`) permiten lectura pública y escritura solo a usuarios autenticados. Las reglas de Storage además limitan a audio/vídeo y 60 MB por archivo. Hay que publicarlas desde la consola de Firebase (Storage → Reglas) o con `firebase deploy --only storage`. La clave de administración es gestionada por Firebase Authentication y nunca se almacena en el código fuente.
