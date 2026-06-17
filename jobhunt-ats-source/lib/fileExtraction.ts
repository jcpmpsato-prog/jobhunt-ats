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

async function extractPdfText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = async (e) => {
      try {
        const pdfjsLib = (await import('pdfjs-dist')).default
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`
        const pdf = await pdfjsLib.getDocument({ data: e.target!.result as ArrayBuffer }).promise
        let text = ''
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i)
          const tc = await page.getTextContent()
          text += (tc.items as any[]).map(it => it.str).join(' ') + '\n\n'
        }
        if (text.trim().length < 50) reject(new Error('PDF sem texto extraível (pode ser scan).'))
        else resolve(text.trim())
      } catch (err) { reject(err) }
    }
    reader.onerror = () => reject(new Error('Falha na leitura'))
    reader.readAsArrayBuffer(file)
  })
}

async function extractDocxText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = async (e) => {
      try {
        const mammoth = (await import('mammoth')).default
        const result = await mammoth.extractRawText({ arrayBuffer: e.target!.result as ArrayBuffer })
        if (result.value && result.value.trim().length >= 50) resolve(result.value.trim())
        else reject(new Error('Documento sem texto extraível.'))
      } catch (err) { reject(err) }
    }
    reader.onerror = () => reject(new Error('Falha na leitura'))
    reader.readAsArrayBuffer(file)
  })
}
