# Análisis: Sistema de gestión de canciones para coro

## Contexto

Sistema para que una persona mayor (no técnica) pueda distribuir y gestionar un repertorio de canciones entre los participantes de su coro.

**Requisitos clave:**
- Compatible con móvil (prioritario) y PC
- Usuario objetivo: personas mayores, poca familiaridad con tecnología
- Gestión centralizada: un dispositivo actualiza, todos los demás ven los cambios en tiempo real
- Sin hosting de pago (o 100% gratuito y estable a largo plazo)
- Opción viable: carga dinámica de canciones desde Google Drive

---

## Opciones analizadas

### Opción A — PWA + GitHub Pages + Google Drive/Sheets ⭐ (Recomendada)

**Descripción:**
- Aplicación web progresiva (PWA) alojada en **GitHub Pages** (gratuito, sin límite de tiempo, dominio propio posible)
- **Google Sheets** como base de datos: listado de canciones, asignaciones por participante
- **Google Drive** como almacén de archivos (PDFs de letras, audios MP3)
- La admin edita el Google Sheet para gestionar el repertorio → la app lo refleja automáticamente

**Flujo de uso:**
1. Admin (abuela u otra persona) abre Google Sheets en su móvil/PC y edita la lista
2. Los participantes abren la web en su móvil → ven las canciones que les corresponden
3. Pueden reproducir o descargar el audio/PDF directamente desde Drive

**Ventajas:**
- Completamente gratuito y estable (GitHub Pages lleva décadas disponible)
- No requiere instalar ninguna app (funciona como web desde el navegador)
- Se puede instalar como app en el móvil (PWA)
- Google Sheets es familiar para muchos usuarios mayores
- Los archivos viven en Google Drive (15 GB gratuitos, fácil de gestionar)
- Funciona en cualquier dispositivo con navegador

**Desventajas:**
- Requiere que los archivos de Drive sean públicos (o con enlace compartido)
- La admin necesita saber usar Google Sheets (nivel básico)
- Primer setup requiere algo de configuración técnica (única vez)

**Viabilidad técnica:** Alta. Google Sheets expone una API pública con hojas publicadas como CSV sin necesidad de autenticación. Google Drive permite compartir archivos con enlace directo.

> **Nota sobre GitHub Pages:** Solo existe 1 sitio de usuario por cuenta (`usuario.github.io`), pero se pueden crear **sitios de proyecto ilimitados**, uno por repositorio (`usuario.github.io/nombre-proyecto`). Para este proyecto usaríamos un sitio de proyecto, sin ninguna limitación práctica.

#### Variante A2 — PWA + GitHub Pages + Firebase ⭐⭐ (Recomendada si se quiere BBDD real)

En lugar de Google Sheets como base de datos, se puede usar **Firebase** (también de Google):

- **Firestore** (BBDD en tiempo real): guarda canciones, participantes, asignaciones
- **Firebase Storage**: almacena los archivos de audio y PDF (en lugar de Google Drive)
- **Firebase Hosting**: opción adicional de hosting, o se sigue usando GitHub Pages
- **Plan Spark** (gratuito para siempre): 1 GB almacenamiento, 10 GB/mes transferencia, 50.000 lecturas/día → más que suficiente para un coro

**Ventajas frente a Google Sheets:**
- Actualización en tiempo real sin recargar la página (los cambios de la admin aparecen instantáneamente)
- Estructura de datos más robusta (no depende del formato de una hoja de cálculo)
- Puede tener un panel de admin dentro de la propia app (sin necesidad de abrir Sheets por separado)
- Más escalable si el proyecto crece

**Desventajas frente a Google Sheets:**
- Setup inicial algo más técnico (configurar proyecto Firebase)
- La admin pierde la familiaridad de Sheets si se gestiona todo desde la app

#### Variante A3 — PWA + GitHub Pages + Supabase

- **Supabase** es una alternativa open-source a Firebase, basada en PostgreSQL
- Tier gratuito: 500 MB BBDD, 1 GB almacenamiento, 2 GB/mes transferencia
- Tiene panel de admin web propio (parecido a una hoja de cálculo) → podría usarse como interfaz de admin
- Ligeramente más complejo de configurar que Firebase
- Menos integrado con el ecosistema Google (si ya se usa Gmail/Drive, Firebase encaja mejor)

---

### Opción B — Google Sites (sin código)

**Descripción:**
- Crear una página web directamente con **Google Sites** (gratuito, de Google)
- Embeds de Google Drive para mostrar PDFs/audios
- Sin código, todo visual

**Ventajas:**
- Cero conocimientos técnicos para crearlo
- Completamente gratuito
- Actualizable desde cualquier dispositivo

**Desventajas:**
- Muy limitado: no permite lógica (filtrar canciones por participante, asignaciones, etc.)
- Poco apto para móvil (interfaz no optimizada)
- No es realmente "dinámico": cada cambio requiere editar la página manualmente
- Diseño poco adaptable a usuarios mayores (letra pequeña, navegación confusa)

**Viabilidad:** Válido solo si el sistema es muy simple (lista estática de canciones sin asignaciones personalizadas).

---

### Opción C — Netlify + Google Drive/Sheets

**Descripción:**
- Similar a la Opción A pero usando **Netlify** como hosting en lugar de GitHub Pages
- Netlify ofrece tier gratuito con 100 GB de ancho de banda/mes y funciones serverless

**Ventajas:**
- Más potente que GitHub Pages (permite funciones backend ligeras)
- Deploys automáticos desde Git
- Dominio personalizado gratuito (*.netlify.app)

**Desventajas:**
- El tier gratuito tiene límites de uso que podrían cambiar (menos estable a largo plazo que GitHub Pages)
- Añade complejidad sin necesidad real para este proyecto

**Viabilidad:** Válido, pero innecesariamente complejo dado el scope del proyecto.

---

### Opción D — Bot de WhatsApp/Telegram

**Descripción:**
- Un bot en Telegram o WhatsApp que responde a comandos simples
- Los participantes escriben "mis canciones" y reciben sus archivos

**Ventajas:**
- WhatsApp/Telegram ya lo usan los participantes → curva de aprendizaje nula
- Funciona perfectamente en móvil
- Muy intuitivo para personas mayores

**Desventajas:**
- WhatsApp Business API es de pago. El bot de Telegram es gratuito pero menos universal
- Requiere que todos tengan Telegram (no todos los mayores lo tienen)
- No tiene una "vista" visual del repertorio completo
- La admin necesita interactuar con el bot para hacer cambios (menos intuitivo que una hoja)

**Viabilidad:** Complementaria, no como solución principal.

---

## Comparativa

| Criterio                        | A (PWA+GitHub) | B (Google Sites) | C (Netlify) | D (Bot) |
|---------------------------------|:--------------:|:----------------:|:-----------:|:-------:|
| Móvil-first                     | ✅             | ⚠️               | ✅          | ✅      |
| Fácil para usuarios mayores     | ✅             | ⚠️               | ✅          | ✅      |
| Gestión dinámica centralizada   | ✅             | ⚠️               | ✅          | ⚠️      |
| 100% gratuito y estable         | ✅             | ✅               | ⚠️          | ✅      |
| Sin dependencia de hosting      | ✅ (GH Pages)  | ✅               | ⚠️          | ❌      |
| Asignaciones por participante   | ✅             | ❌               | ✅          | ✅      |
| Setup inicial simple            | ⚠️             | ✅               | ⚠️          | ❌      |

---

## Decisiones tomadas

Respuestas del usuario (2026-05-22):

| Pregunta | Decisión |
|---|---|
| Tipo de archivos | Texto plano (más ligero y eficiente que PDF/Word; actualmente usa PDF/Word) |
| Asignaciones | Todas las canciones visibles para todos (sin asignaciones personalizadas) |
| Acceso app móvil | Pública — cualquiera con el enlace |
| Acceso app admin | Clave de verificación, recordada en el dispositivo (una sola vez) |
| Setup técnico | Lo hace el desarrollador; la admin gestiona canciones sola después |
| Nombre del coro | **Sestaoko Musika Eskola** |

---

## Recomendación final — Stack A2 (Firebase)

Dado que:
- Las letras son texto plano → no se necesita almacenamiento de archivos (Firestore es suficiente)
- El setup lo hace un técnico → se puede configurar Firebase correctamente
- Se necesita una interfaz de admin usable por personas mayores → se construye dentro de la misma web
- La app pública no requiere login → sin fricción para los usuarios del coro

**Stack definitivo:**
- **Frontend:** React PWA → GitHub Pages (sitio de proyecto, gratuito e ilimitado)
- **Base de datos:** Firebase Firestore (letras como texto plano, sin archivos)
- **Autenticación admin:** Firebase Auth (email + contraseña, sesión persistente en el dispositivo)
- **Hosting:** GitHub Pages

**Firebase Spark (gratuito permanente):**  
1 GB Firestore · 50.000 lecturas/día · 20.000 escrituras/día → completamente suficiente para un coro.

---

## Arquitectura de la aplicación

### Dos interfaces, una sola web

```
https://usuario.github.io/sestaoko-musika-eskola/
├── /          → App pública (móvil-first, letra grande, accesible)
└── /admin     → Panel de administración (requiere login, orientado a escritorio)
```

### App pública (`/`)
- Lista principal de todas las canciones ordenada por índice
- Listas alternativas (setlists): selector visible para cambiar entre la lista principal y cualquier setlist creado por la admin
- Buscador por título o fragmento de letra
- Vista de canción:
  - Letra completa en texto grande y bien formateada
  - Si la canción tiene `youtubeUrl`: reproductor de YouTube embebido debajo de la letra (sin salir de la app)
- Selector de **modo claro/oscuro** (persistido en localStorage)
- Selector de **tamaño de texto** para las letras: 5 niveles (S · M · L · XL · XXL), persistido en localStorage
- Instalable como PWA (icono en pantalla de inicio del móvil)
- Sin login, sin fricción

### App admin (`/admin`)
- Login con **solo clave maestra** (sin campo de usuario), sesión persistente en el dispositivo
- **Gestión de canciones:**
  - Añadir canción: índice (auto max+1, editable) + título + letra (textarea grande) + URL YouTube (opcional)
  - Editar canción existente
  - Eliminar canción (con confirmación)
  - Reordenación manual de índices con resolución de conflictos
- **Gestión de setlists:**
  - Crear nueva lista con título y fecha opcional
  - Añadir/quitar canciones de una lista (selector con búsqueda)
  - Reordenar canciones dentro de la lista
  - Eliminar lista (con confirmación)
- Interfaz simplificada, botones grandes, texto grande

### Modelo de datos (Firestore)

```
songs/
  {songId}                    // ID interno auto-generado por Firestore
    index:      number        // índice visible, único, editable (default: max+1)
    title:      string        // "Agur Jaunak"
    lyrics:     string        // texto completo de la letra
    language:   string        // "eu" | "es" | "other"
    youtubeUrl: string|null   // URL de YouTube (opcional, para futura integración)
    createdAt:  timestamp
    updatedAt:  timestamp

setlists/
  {setlistId}
    title:      string        // "Actuación 25 mayo"
    date:       timestamp|null
    songIds:    string[]      // IDs ordenados de las canciones incluidas
    createdAt:  timestamp
```

**Gestión del índice:**
- Al crear una canción, el campo `index` se pre-rellena con `max(índices existentes) + 1`
- La admin puede cambiarlo manualmente
- Si el índice introducido ya existe → diálogo de confirmación: *"El índice X ya está en uso por '[título]'. ¿Desplazar todas las canciones a partir de ese índice?"*
- En caso de confirmar: se incrementa en +1 el índice de todas las canciones con `index >= nuevo_índice`, luego se asigna el índice a la nueva canción

**Autenticación admin (solo clave maestra):**
- Sin campo de usuario, solo contraseña
- Implementación: Firebase Auth con un email fijo interno (oculto al usuario) + la clave maestra como contraseña
- Esto aprovecha la gestión de sesión de Firebase (persistencia automática en el dispositivo) sin exponer lógica custom
- La clave maestra se puede cambiar desde Firebase Console sin tocar código

---

## Consideraciones de UX para usuarios mayores

- Fuente mínima 18px en UI general, 20px+ para letras en tamaño M (escala desde ahí)
- Alto contraste en modo claro (negro sobre blanco) y modo oscuro (blanco sobre gris muy oscuro, no negro puro)
- Botones grandes, fáciles de pulsar con el dedo (mínimo 44×44px touch target)
- Navegación simple: máximo 2 niveles de profundidad
- Sin modales confusos, sin gestos complicados
- Instrucción clara de cómo "instalar" la app en el móvil (pantalla de bienvenida o banner)
- Selector de tamaño de texto prominente y siempre accesible (no enterrado en ajustes)
- El modo y tamaño de texto se recuerdan entre sesiones (localStorage)

---

## Próximos pasos

- [ ] Confirmar stack y arquitectura con el usuario
- [ ] Crear proyecto Firebase (Firestore + Auth)
- [ ] Crear repositorio GitHub
- [ ] Desarrollar app pública: lista principal, setlists, vista de canción, YouTube embed
- [ ] Desarrollar panel admin: CRUD canciones (con gestión de índices), CRUD setlists
- [ ] Implementar selector modo claro/oscuro y tamaño de texto
- [ ] Configurar PWA (manifest, service worker)
- [ ] Deploy en GitHub Pages
- [ ] Migrar canciones existentes (de PDF/Word a texto plano en Firestore)
