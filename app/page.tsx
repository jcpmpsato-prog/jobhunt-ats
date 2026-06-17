'use client'
export default function Home() {
  // Dynamic import to avoid SSR issues with browser APIs (PDF.js, mammoth, jsPDF, localStorage)
  const [Loaded, setLoaded] = React.useState<React.ComponentType | null>(null)
  React.useEffect(() => {
    import('../components/ATSApp').then(m => setLoaded(() => m.default))
  }, [])
  if (!Loaded) return (
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'#03060f'}}>
      <div style={{fontFamily:'JetBrains Mono,monospace',color:'#00e5ff',fontSize:13,letterSpacing:'0.1em'}}>INITIALIZING...</div>
    </div>
  )
  return <Loaded />
}

import React from 'react'
