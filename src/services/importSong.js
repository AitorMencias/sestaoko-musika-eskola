// Extrae título y letra de un Word (.docx) o PDF en el navegador.
// Las librerías se cargan solo al importar, para no engordar la app.

export const IMPORT_ACCEPT =
  '.docx,.pdf,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document'

/**
 * @returns {Promise<{ title: string, lyrics: string, index: number | null }>}
 */
export async function importSongFile(file) {
  const name = file.name.toLowerCase()
  let parsed
  if (name.endsWith('.docx')) parsed = await parseDocx(file)
  else if (name.endsWith('.pdf')) parsed = await parsePdf(file)
  else if (name.endsWith('.doc')) {
    throw new Error('Formato .doc antiguo no soportado. Ábrelo en Word y guárdalo como .docx')
  } else throw new Error('Solo se admiten archivos Word (.docx) o PDF')

  return finalize(parsed, file.name)
}

// ── Word ───────────────────────────────────────────────────

async function parseDocx(file) {
  const mammoth = (await import('mammoth')).default
  const { value: html } = await mammoth.convertToHtml(
    { arrayBuffer: await file.arrayBuffer() },
    { ignoreEmptyParagraphs: false } // los párrafos vacíos separan estrofas
  )
  const docEl = new DOMParser().parseFromString(html, 'text/html')

  // Cada párrafo/encabezado es un bloque; los <br> dentro del párrafo son saltos de línea
  const blocks = [...docEl.body.querySelectorAll('p, h1, h2, h3, h4, h5, h6, li')].map(el => {
    el.querySelectorAll('br').forEach(br => br.replaceWith('\n'))
    return {
      text: el.textContent.replace(/ /g, ' '),
      heading: /^H\d$/.test(el.tagName),
    }
  })

  // Título: primer encabezado; si no hay, el primer párrafo no vacío
  let titleIdx = blocks.findIndex(b => b.heading && b.text.trim())
  if (titleIdx === -1) titleIdx = blocks.findIndex(b => b.text.trim())
  if (titleIdx === -1) return { title: '', lines: [] }

  const title = blocks[titleIdx].text.trim()
  const body = blocks.slice(titleIdx + 1)
  // Si no hay párrafos vacíos separando estrofas pero sí párrafos de varias líneas
  // (Mayús+Intro), cada párrafo es una estrofa
  const hasEmptySeparators = body.some((b, i) => !b.text.trim() && i > 0 && i < body.length - 1)
  const stanzaPerParagraph = !hasEmptySeparators && body.some(b => b.text.trim().includes('\n'))
  const lines = body.flatMap(b => {
    const ls = b.text.split('\n')
    return stanzaPerParagraph && b.text.trim() ? [...ls, ''] : ls
  })
  return { title, lines }
}

// ── PDF ────────────────────────────────────────────────────

async function parsePdf(file) {
  const pdfjs = await import('pdfjs-dist')
  const workerUrl = (await import('pdfjs-dist/build/pdf.worker.min.mjs?url')).default
  pdfjs.GlobalWorkerOptions.workerSrc = workerUrl

  const pdf = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise
  const rows = [] // { text, size, gap }

  for (let p = 1; p <= pdf.numPages; p++) {
    const page = await pdf.getPage(p)
    const { items } = await page.getTextContent()

    // Agrupa los fragmentos de texto en líneas según su posición vertical
    const pageLines = []
    for (const it of items) {
      if (!('str' in it)) continue
      const y = it.transform[5]
      const size = Math.hypot(it.transform[2], it.transform[3]) || it.height
      let line = pageLines.find(l => Math.abs(l.y - y) < Math.max(2, size * 0.4))
      if (!line) pageLines.push(line = { y, size: 0, parts: [] })
      line.parts.push({ x: it.transform[4], str: it.str, w: it.width })
      if (it.str.trim()) line.size = Math.max(line.size, size)
    }
    pageLines.sort((a, b) => b.y - a.y)

    let prevY = null
    for (const l of pageLines) {
      l.parts.sort((a, b) => a.x - b.x)
      // Junta fragmentos; añade espacio si hay hueco entre ellos
      let text = '', end = null
      for (const part of l.parts) {
        if (end !== null && part.x - end > l.size * 0.15 && !text.endsWith(' ') && !part.str.startsWith(' ')) text += ' '
        text += part.str
        end = part.x + part.w
      }
      text = text.replace(/\s+/g, ' ').trim()
      if (!text) continue
      rows.push({ text, size: l.size, gap: prevY === null ? null : prevY - l.y, pageStart: prevY === null })
      prevY = l.y
    }
  }

  if (!rows.length) {
    throw new Error('El PDF no tiene texto seleccionable (¿es una imagen escaneada?)')
  }

  // Título: si la primera línea es claramente más grande que el resto, es el título
  const bodySizes = rows.slice(1).map(r => r.size).sort((a, b) => a - b)
  const medianSize = bodySizes.length ? bodySizes[Math.floor(bodySizes.length / 2)] : rows[0].size
  let titleEnd = 1
  // Títulos largos partidos en dos líneas del mismo tamaño grande
  if (rows[0].size > medianSize * 1.15) {
    while (titleEnd < rows.length && Math.abs(rows[titleEnd].size - rows[0].size) < 0.5) titleEnd++
  }
  const title = rows.slice(0, titleEnd).map(r => r.text).join(' ')

  // Interlineado normal = salto habitual entre líneas de la letra (percentil 25, porque
  // hay más saltos de línea que de estrofa); un salto mucho mayor = nueva estrofa
  const gaps = rows.slice(titleEnd + 1).filter(r => !r.pageStart && r.gap > 0)
    .map(r => r.gap).sort((a, b) => a - b)
  const normalGap = gaps.length ? gaps[Math.floor((gaps.length - 1) / 4)] : 0

  const lines = []
  rows.slice(titleEnd).forEach((r, i) => {
    if (i > 0 && (r.pageStart || (normalGap && r.gap > normalGap * 1.6))) lines.push('')
    lines.push(r.text)
  })
  return { title, lines }
}

// ── Limpieza común ─────────────────────────────────────────

function finalize({ title, lines }, fileName) {
  let index = null
  title = title.replace(/\s+/g, ' ').trim()

  // "12. Título", "12 - Título", "12) Título" → índice 12
  const m = title.match(/^(\d{1,4})\s*[.\-–)]\s*(.+)$/)
  if (m) {
    index = parseInt(m[1], 10)
    title = m[2].trim()
  }
  if (!title) title = fileName.replace(/\.[^.]+$/, '')

  // Un título en MAYÚSCULAS se pasa a formato frase
  if (title.length > 3 && title === title.toUpperCase() && /[A-ZÁÉÍÓÚÑ]/.test(title)) {
    title = title.charAt(0) + title.slice(1).toLowerCase()
  }

  const lyrics = lines
    .map(l => l.replace(/[ \t]+/g, ' ').trim())
    .join('\n')
    .replace(/\n{3,}/g, '\n\n') // como mucho una línea en blanco entre estrofas
    .trim()

  return { title, lyrics, index }
}
