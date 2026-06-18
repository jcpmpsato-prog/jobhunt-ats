export function formatFileSize(bytes: number) {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
}

export async function extractText(file: File): Promise<string> {
  const ext = file.name.toLowerCase().split('.').pop()
  if (ext === 'pdf') return extractPdfText(file)
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

async function extractPdfText(file: File): Promise<string> {
  const pdfjsLib = await getPdfjs()
  const arrayBuffer = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
  let text = ''
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const tc = await page.getTextContent()
    text += (tc.items as any[]).map((it: any) => it.str).join(' ') + '\n\n'
  }
  if (text.trim().length < 50) throw new Error('PDF sem texto extraível (pode ser scan).')
  return text.trim()
}

async function extractDocxText(file: File): Promise<string> {
  const mammoth: any = (await import('mammoth')).default
  const arrayBuffer = await file.arrayBuffer()
  const result = await mammoth.extractRawText({ arrayBuffer })
  if (result.value && result.value.trim().length >= 50) return result.value.trim()
  throw new Error('Documento sem texto extraível.')
}
