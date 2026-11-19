# Intermediario de Google Drive (Apps Script)

Los audios y vídeos se guardan en el Google Drive de la cuenta de Gmail de la escuela. La app no tiene acceso directo a Drive: se lo pide a este script, que comprueba que quien sube o borra es el admin logueado en la app.

Es gratis y no hace falta tarjeta. Capacidad: los 15 GB de la cuenta de Google.

## Despliegue (una sola vez)

Haz todos los pasos con la **cuenta de Gmail de la escuela**.

1. **Carpeta en Drive.** Crea una carpeta, por ejemplo `Sestaoko Musika Eskola - media`. Ábrela y copia su ID de la URL: es lo que va después de `/folders/`.
2. **Crear el script.** Entra en [script.google.com](https://script.google.com) y pulsa **Nuevo proyecto**. Ponle un nombre.
3. **Manifiesto.** En ⚙️ *Configuración del proyecto*, marca **Mostrar el archivo de manifiesto "appsscript.json"**. Vuelve al editor y reemplaza el contenido de `appsscript.json` por el de [appsscript.json](appsscript.json).
4. **Código.** Reemplaza el contenido de `Código.gs` por el de [Code.gs](Code.gs). Rellena las tres constantes del principio:
   - `FIREBASE_API_KEY`: el mismo valor que `VITE_FIREBASE_API_KEY`.
   - `ADMIN_EMAIL`: el mismo valor que `VITE_ADMIN_EMAIL`.
   - `FOLDER_ID`: el ID de la carpeta del paso 1.
5. **Activar la API de Drive.** En el menú izquierdo, pulsa **+** junto a *Servicios*, elige **Drive API** (v3) y pulsa **Añadir**. Sin esto, la subida falla con *"Google Drive API has not been used in project … or it is disabled"*. Si aun así sale ese error, abre el enlace que aparece en el mensaje y pulsa **Habilitar**; tarda un par de minutos en aplicarse.
6. **Autorizar.** En el editor, elige la función `doGet` y pulsa **Ejecutar**. Google pedirá permisos para Drive y para conectarse a servicios externos. Acéptalos; si aparece "Google no ha verificado esta aplicación", pulsa *Configuración avanzada → Ir a … (no seguro)*. Es tu propio script.
7. **Publicar.** Pulsa **Implementar → Nueva implementación**, tipo **Aplicación web**:
   - *Ejecutar como*: **Yo**
   - *Quién tiene acceso*: **Cualquier usuario**

   Copia la URL que termina en `/exec`.
8. **Conectar la app.** Pon esa URL en `VITE_DRIVE_SCRIPT_URL`:
   - En `.env.local` para desarrollo.
   - Como Repository Secret `DRIVE_SCRIPT_URL` en GitHub para el despliegue.

Para comprobarlo, abre la URL `/exec` en el navegador. Debe responder `{"ok":true}`.

## Si cambias el código

Pega el nuevo código y ve a **Implementar → Gestionar implementaciones → ✏️ → Versión: Nueva versión → Implementar**. Así la URL no cambia. Si creas una implementación nueva, la URL cambia y hay que actualizar la variable.

## Notas

- "Cualquier usuario" significa que cualquiera puede *llamar* al script. Aun así, el script rechaza toda petición que no traiga un login válido del admin, y solo borra archivos que estén en la carpeta configurada.
- Si en Google Cloud restringes la API key de Firebase por *referente HTTP*, la comprobación del login desde el script fallará. En ese caso deja la key sin esa restricción (la restricción por APIs sí se puede mantener).
- Después de subir un vídeo, Drive tarda unos minutos en procesarlo. Mientras tanto el reproductor puede mostrar "Se está procesando el vídeo".
- Los archivos borrados van a la papelera de Drive y se eliminan solos a los 30 días.
