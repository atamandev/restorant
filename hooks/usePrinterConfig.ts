import { useState, useEffect } from 'react'

interface PrinterConfig {
  printer: {
    enabled: boolean
    paperSize: string
    fontSize: number
    fontFamily: string
    margin: number
    header: {
      show: boolean
      title: string
      showLogo: boolean
      logoUrl: string
      showDate: boolean
      showTime: boolean
    }
    footer: {
      show: boolean
      text: string
      showDate: boolean
    }
    items: {
      showNotes: boolean
      showImage: boolean
      columns: string[]
    }
    summary: {
      showSubtotal: boolean
      showTax: boolean
      showServiceCharge: boolean
      showDiscount: boolean
      showTotal: boolean
    }
  }
  laser: {
    enabled: boolean
    paperSize: string
    fontSize: number
    fontFamily: string
    margin: number
    header: {
      show: boolean
      title: string
      showLogo: boolean
      logoUrl: string
      showDate: boolean
      showTime: boolean
    }
    footer: {
      show: boolean
      text: string
      showDate: boolean
    }
    items: {
      showNotes: boolean
      showImage: boolean
      columns: string[]
    }
    summary: {
      showSubtotal: boolean
      showTax: boolean
      showServiceCharge: boolean
      showDiscount: boolean
      showTotal: boolean
    }
  }
  general: {
    autoPrint: boolean
    showPrintDialog: boolean
    copies: number
    orientation: 'portrait' | 'landscape'
  }
}

export function usePrinterConfig() {
  const [config, setConfig] = useState<PrinterConfig | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadConfig()
  }, [])

  const loadConfig = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/printer-config')
      const result = await response.json()
      
      if (result.success) {
        setConfig(result.data)
      }
    } catch (error) {
      console.error('Error loading printer config:', error)
    } finally {
      setLoading(false)
    }
  }

  return { config, loading, reload: loadConfig }
}

