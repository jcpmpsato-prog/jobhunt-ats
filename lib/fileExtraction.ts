import { readPdfPage } from './pdfReadingOrder'

export function formatFileSize(bytes: number) {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
}

export async function extractText(file: File, onUnreadablePages?: (pages: number[]) => void): Promise<string> {
  const ext = file.name.toLowerCase().split('.').pop()
  if (ext === 'pdf') return extractPdfText(file, onUnreadablePages)
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

async function extractPdfText(file: File, onUnreadablePages?: (pages: number[]) => void): Promise<string> {
  const pdfjsLib = await getPdfjs()
  const arrayBuffer = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
  const pages: string[] = []
  const unreadablePages: number[] = []
  try {
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i)
      const { items } = await page.getTextContent()
      const text = readPdfPage(items, page.getViewport({ scale: 1 }).width)
      if (text) pages.push(text)
      else unreadablePages.push(i)
    }
  } finally {
    await pdf.destroy()
  }
  if (!pages.length) throw new Error('PDF sem texto extraível (pode ser scan).')
  if (unreadablePages.length) onUnreadablePages?.(unreadablePages)
  return pages.join('\n\n')
}

async function extractDocxText(file: File): Promise<string> {
  const mammoth: any = (await import('mammoth')).default
  const arrayBuffer = await file.arrayBuffer()
  const result = await mammoth.extractRawText({ arrayBuffer })
  if (result.value && result.value.trim().length >= 50) return result.value.trim()
  throw new Error('Documento sem texto extraível.')
}
