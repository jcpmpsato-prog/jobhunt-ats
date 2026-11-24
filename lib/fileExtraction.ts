import { readPdfPage } from './pdfReadingOrder'

export function formatFileSize(bytes: number) {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
}

type PdfNotice = { unreadablePages: number[]; ocrPages: number[] }

export async function extractText(file: File, onPdfNotice?: (notice: PdfNotice) => void): Promise<string> {
  const ext = file.name.toLowerCase().split('.').pop()
  if (ext === 'pdf') return extractPdfText(file, onPdfNotice)
  if (ext === 'docx' || ext === 'doc') return extractDocxText(file)
  if (ext === 'txt') return file.text()
  throw new Error('Formato não suportado')
}

// Module-level singleton so we only configure the worker once
let pdfjsLibPromise: Promise<any> | null = null

async function getPdfjs(): Promise<any> {
  if (pdfjsLibPromise) return pdfjsLibPromise
  pdfjsLibPromise = (async () => {
    const mod: any = await import('pdfjs-dist/build/pdf')
    const lib = mod.default ?? mod
    // Configure the worker via CDN (matches installed version)
    const workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'
    if (lib.GlobalWorkerOptions) {
      lib.GlobalWorkerOptions.workerSrc = workerSrc
    } else if (lib.default && lib.default.GlobalWorkerOptions) {
      lib.default.GlobalWorkerOptions.workerSrc = workerSrc
    }
    return lib
  })()
  return pdfjsLibPromise
}

async function startOcrWorker(): Promise<import('tesseract.js').Worker> {
  const { createWorker, OEM } = await import('tesseract.js')
  // Language download failures can arrive through the callback during startup.
  return new Promise((resolve, reject) => {
    createWorker(['por', 'eng'], OEM.LSTM_ONLY, { errorHandler: reject }).then(resolve, reject)
  })
}

async function extractPdfText(file: File, onPdfNotice?: (notice: PdfNotice) => void): Promise<string> {
  const pdfjsLib = await getPdfjs()
  const arrayBuffer = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
  const pages: string[] = []
  const unreadablePages: number[] = []
  const ocrPages: number[] = []
  let ocrWorker: Promise<import('tesseract.js').Worker> | undefined
  try {
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i)
      const { items } = await page.getTextContent()
      const text = readPdfPage(items, page.getViewport({ scale: 1 }).width)
      if (text) {
        pages.push(text)
        continue
      }

      const canvas = document.createElement('canvas')
      try {
        const original = page.getViewport({ scale: 1 })
        const viewport = page.getViewport({ scale: Math.min(2.5, 2600 / Math.max(original.width, original.height)) })
        canvas.width = Math.ceil(viewport.width)
        canvas.height = Math.ceil(viewport.height)
        const canvasContext = canvas.getContext('2d')
        if (!canvasContext) throw new Error('Canvas unavailable')
        await page.render({ canvasContext, viewport }).promise
        ocrWorker ??= startOcrWorker()
        const worker = await ocrWorker
        const { data } = await worker.recognize(canvas)
        if (data.text.trim()) {
          pages.push(data.text.trim())
          ocrPages.push(i)
        } else {
          unreadablePages.push(i)
        }
      } catch {
        unreadablePages.push(i)
      } finally {
        canvas.width = 0
        canvas.height = 0
      }
    }
  } finally {
    await Promise.allSettled([
      pdf.destroy(),
      ocrWorker?.then(worker => worker.terminate()),
    ])
  }
  onPdfNotice?.({ unreadablePages, ocrPages })
  if (!pages.length) throw new Error('Não foi possível ler este PDF. Cole o texto do currículo ou tente outro arquivo.')
  return pages.join('\n\n')
}

async function extractDocxText(file: File): Promise<string> {
  const mammoth: any = (await import('mammoth')).default
  const arrayBuffer = await file.arrayBuffer()
  const result = await mammoth.extractRawText({ arrayBuffer })
  if (result.value && result.value.trim().length >= 50) return result.value.trim()
  throw new Error('Documento sem texto extraível.')
}
