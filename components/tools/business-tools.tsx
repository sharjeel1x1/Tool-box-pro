'use client'

import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import {
  QrCode, Barcode, FileText, ArrowLeftRight, Ruler,
  Download, Copy, RefreshCw, Plus, Trash2, ArrowUpDown,
  Loader2, DollarSign
} from 'lucide-react'
import QRCode from 'qrcode'
import jsPDF from 'jspdf'

// ==================== QrGenerator ====================
export function QrGenerator() {
  const [text, setText] = useState('https://example.com')
  const [fgColor, setFgColor] = useState('#000000')
  const [bgColor, setBgColor] = useState('#ffffff')
  const [size, setSize] = useState(256)
  const [errorLevel, setErrorLevel] = useState<'L' | 'M' | 'Q' | 'H'>('M')
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const generateQR = useCallback(async () => {
    if (!text.trim()) {
      toast.error('Please enter text or URL')
      return
    }
    try {
      if (canvasRef.current) {
        await QRCode.toCanvas(canvasRef.current, text, {
          width: size,
          margin: 2,
          color: { dark: fgColor, light: bgColor },
          errorCorrectionLevel: errorLevel,
        })
      }
    } catch {
      toast.error('Failed to generate QR code')
    }
  }, [text, size, fgColor, bgColor, errorLevel])

  useEffect(() => {
    if (text.trim()) generateQR()
  }, [generateQR, text])

  const downloadPNG = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const link = document.createElement('a')
    link.download = 'qrcode.png'
    link.href = canvas.toDataURL('image/png')
    link.click()
    toast.success('QR code downloaded as PNG')
  }

  const downloadSVG = async () => {
    if (!text.trim()) {
      toast.error('Please enter text or URL')
      return
    }
    try {
      const svgString = await QRCode.toString(text, {
        type: 'svg',
        margin: 2,
        color: { dark: fgColor, light: bgColor },
        errorCorrectionLevel: errorLevel,
      })
      const blob = new Blob([svgString], { type: 'image/svg+xml' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.download = 'qrcode.svg'
      link.href = url
      link.click()
      URL.revokeObjectURL(url)
      toast.success('QR code downloaded as SVG')
    } catch {
      toast.error('Failed to generate SVG')
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <QrCode className="h-5 w-5" /> QR Code Generator
        </CardTitle>
        <CardDescription>Generate QR codes from text or URLs</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="qr-text">Text or URL</Label>
          <Input id="qr-text" value={text} onChange={e => setText(e.target.value)} placeholder="Enter text or URL" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="qr-fg">Foreground Color</Label>
            <div className="flex items-center gap-2">
              <input type="color" id="qr-fg" value={fgColor} onChange={e => setFgColor(e.target.value)} className="h-10 w-12 cursor-pointer rounded border" />
              <Input value={fgColor} onChange={e => setFgColor(e.target.value)} className="flex-1" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="qr-bg">Background Color</Label>
            <div className="flex items-center gap-2">
              <input type="color" id="qr-bg" value={bgColor} onChange={e => setBgColor(e.target.value)} className="h-10 w-12 cursor-pointer rounded border" />
              <Input value={bgColor} onChange={e => setBgColor(e.target.value)} className="flex-1" />
            </div>
          </div>
        </div>
        <div className="space-y-2">
          <Label>Size: {size}px</Label>
          <Slider value={[size]} onValueChange={v => setSize(v[0])} min={128} max={512} step={16} />
        </div>
        <div className="space-y-2">
          <Label>Error Correction Level</Label>
          <Select value={errorLevel} onValueChange={v => setErrorLevel(v as 'L' | 'M' | 'Q' | 'H')}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="L">Low (7%)</SelectItem>
              <SelectItem value="M">Medium (15%)</SelectItem>
              <SelectItem value="Q">Quartile (25%)</SelectItem>
              <SelectItem value="H">High (30%)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex justify-center py-4">
          <canvas ref={canvasRef} className="rounded border" />
        </div>
        <div className="flex gap-2">
          <Button onClick={generateQR} className="flex-1">
            <RefreshCw className="h-4 w-4 mr-2" /> Generate
          </Button>
          <Button onClick={downloadPNG} variant="outline">
            <Download className="h-4 w-4 mr-2" /> PNG
          </Button>
          <Button onClick={downloadSVG} variant="outline">
            <Download className="h-4 w-4 mr-2" /> SVG
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// ==================== BarcodeGenerator ====================
const CODE128_PATTERNS: Record<string, string> = {
  ' ': '11011001100', '!': '11001101100', '"': '11001100110', '#': '10010011000',
  $: '10010001100', '%': '10001001100', '&': '10011001000', "'": '10011000100',
  '(': '10001100100', ')': '11001001000', '*': '11001000100', '+': '11000100100',
  ',': '10110011100', '-': '10011011100', '.': '10011001110', '/': '10111001100',
  '0': '10011101100', '1': '10011100110', '2': '11001110010', '3': '11001011100',
  '4': '11001001110', '5': '11011100100', '6': '11001110100', '7': '11101101110',
  '8': '11101001100', '9': '11100101100', ':': '11100100110', ';': '11101100100',
  '<': '11100110100', '=': '11100110010', '>': '11011011000', '?': '11011000110',
  '@': '11000110110', A: '10100011000', B: '10001011000', C: '10001000110',
  D: '10110001000', E: '10001101000', F: '10001100010', G: '11010001000',
  H: '11000101000', I: '11000100010', J: '10110111000', K: '10110001110',
  L: '10001101110', M: '10111011000', N: '10111000110', O: '10001110110',
  P: '11101110110', Q: '11010001110', R: '11000101110', S: '11011101000',
  T: '11011100010', U: '11011101110', V: '11101011000', W: '11101000110',
  X: '11100010110', Y: '11101101000', Z: '11101100010', '[': '11100011010',
  '\\': '11101111010', ']': '11001000010', '^': '11110001010', _: '10100110000',
  '`': '10100001100', a: '10010110000', b: '10010000110', c: '10000101100',
  d: '10000100110', e: '10110010000', f: '10110000100', g: '10011010000',
  h: '10011000010', i: '10000110100', j: '10000110010', k: '11000010010',
  l: '11001010000', m: '11110111010', n: '11000010100', o: '10001111010',
  p: '10100111100', q: '10010111100', r: '10010011110', s: '10111100100',
  t: '10011110100', u: '10011110010', v: '11110100100', w: '11110010100',
  x: '11110010010', y: '11011011110', z: '11011110110', '{': '11110110110',
  '|': '10101111000', '}': '10100011110', '~': '10001011110',
  START_B: '11010010000',
  STOP: '1100011101011',
}

const CODE128_VALUES: Record<string, number> = {
  ' ': 0, '!': 1, '"': 2, '#': 3, $: 4, '%': 5, '&': 6, "'": 7,
  '(': 8, ')': 9, '*': 10, '+': 11, ',': 12, '-': 13, '.': 14, '/': 15,
  '0': 16, '1': 17, '2': 18, '3': 19, '4': 20, '5': 21, '6': 22, '7': 23,
  '8': 24, '9': 25, ':': 26, ';': 27, '<': 28, '=': 29, '>': 30, '?': 31,
  '@': 32, A: 33, B: 34, C: 35, D: 36, E: 37, F: 38, G: 39,
  H: 40, I: 41, J: 42, K: 43, L: 44, M: 45, N: 46, O: 47,
  P: 48, Q: 49, R: 50, S: 51, T: 52, U: 53, V: 54, W: 55,
  X: 56, Y: 57, Z: 58, '[': 59, '\\': 60, ']': 61, '^': 62, '_': 63,
  '`': 64, a: 65, b: 66, c: 67, d: 68, e: 69, f: 70, g: 71,
  h: 72, i: 73, j: 74, k: 75, l: 76, m: 77, n: 78, o: 79,
  p: 80, q: 81, r: 82, s: 83, t: 84, u: 85, v: 86, w: 87,
  x: 88, y: 89, z: 90, '{': 91, '|': 92, '}': 93, '~': 94,
  FNC3: 96, FNC2: 97, SHIFT: 98, CODE_C: 99, CODE_B: 100, FNC4: 101, FNC1: 102,
  START_A: 103, START_B: 104, START_C: 105, STOP: 106,
}

function encodeCode128(text: string): string | null {
  if (!text) return null
  let encoded = CODE128_PATTERNS.START_B
  let checksum = CODE128_VALUES.START_B
  for (let i = 0; i < text.length; i++) {
    const char = text[i]
    const pattern = CODE128_PATTERNS[char]
    const value = CODE128_VALUES[char]
    if (pattern === undefined || value === undefined) return null
    encoded += pattern
    checksum += value * (i + 1)
  }
  const checkDigit = checksum % 103
  // Find the pattern for the check digit
  const checkEntry = Object.entries(CODE128_VALUES).find(([, v]) => v === checkDigit)
  if (!checkEntry) return null
  encoded += CODE128_PATTERNS[checkEntry[0]] || ''
  encoded += CODE128_PATTERNS.STOP
  return encoded
}

const EAN13_PATTERNS: Record<string, string[]> = {
  '0': ['0001101', '0100111', '1110010'],
  '1': ['0011001', '0110011', '1100110'],
  '2': ['0010011', '0011011', '1101100'],
  '3': ['0111101', '0100001', '1000010'],
  '4': ['0100011', '0011101', '1011100'],
  '5': ['0110001', '0111001', '1001110'],
  '6': ['0101111', '0000101', '1010000'],
  '7': ['0111011', '0010001', '1000100'],
  '8': ['0110111', '0001001', '1001000'],
  '9': ['0001011', '0010111', '1110100'],
}

const EAN13_PARITY: Record<string, string> = {
  '0': 'LLLLLL', '1': 'LLGLGG', '2': 'LLGGLG', '3': 'LLGGGL',
  '4': 'LGLLGG', '5': 'LGGLLG', '6': 'LGGGLL', '7': 'LGLGLG',
  '8': 'LGLGGL', '9': 'LGGLGL',
}

function calculateEAN13CheckDigit(digits: string): number {
  let sum = 0
  for (let i = 0; i < 12; i++) {
    sum += parseInt(digits[i]) * (i % 2 === 0 ? 1 : 3)
  }
  return (10 - (sum % 10)) % 10
}

function encodeEAN13(text: string): string | null {
  let digits = text.replace(/\D/g, '')
  if (digits.length === 12) {
    digits += calculateEAN13CheckDigit(digits).toString()
  }
  if (digits.length !== 13) return null

  const checkDigit = calculateEAN13CheckDigit(digits)
  if (parseInt(digits[12]) !== checkDigit) return null

  const parity = EAN13_PARITY[digits[0]]
  let encoded = '101'
  for (let i = 1; i <= 6; i++) {
    const patternIndex = parity[i - 1] === 'L' ? 0 : 1
    encoded += EAN13_PATTERNS[digits[i]][patternIndex]
  }
  encoded += '01010'
  for (let i = 7; i <= 12; i++) {
    encoded += EAN13_PATTERNS[digits[i]][2]
  }
  encoded += '101'
  return encoded
}

export function BarcodeGenerator() {
  const [content, setContent] = useState('Hello-123')
  const [barcodeType, setBarcodeType] = useState<'code128' | 'ean13'>('code128')
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Compute encoded barcode data (pure computation, no setState)
  const encodedData = useMemo(() => {
    if (!content.trim()) return null
    if (barcodeType === 'code128') {
      return encodeCode128(content)
    } else {
      return encodeEAN13(content)
    }
  }, [content, barcodeType])

  // Derive error from encoded data
  const barcodeError = useMemo(() => {
    if (!content.trim()) return ''
    if (!encodedData) {
      return barcodeType === 'ean13' ? 'Invalid EAN-13: must be 12 or 13 digits' : 'Invalid characters for Code 128'
    }
    return ''
  }, [content, barcodeType, encodedData])

  // Draw barcode on canvas when data changes
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !encodedData) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const barWidth = 2
    const height = 100
    const quietZone = 20
    canvas.width = encodedData.length * barWidth + quietZone * 2
    canvas.height = height + 40

    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    ctx.fillStyle = '#000000'
    for (let i = 0; i < encodedData.length; i++) {
      if (encodedData[i] === '1') {
        ctx.fillRect(quietZone + i * barWidth, 10, barWidth, height)
      }
    }

    // Draw text below
    ctx.fillStyle = '#000000'
    ctx.font = '14px monospace'
    ctx.textAlign = 'center'
    if (barcodeType === 'ean13') {
      const digits = content.replace(/\D/g, '')
      const fullCode = digits.length === 12 ? digits + calculateEAN13CheckDigit(digits) : digits
      ctx.fillText(fullCode, canvas.width / 2, height + 30)
    } else {
      ctx.fillText(content, canvas.width / 2, height + 30)
    }
  }, [encodedData, content, barcodeType])

  const downloadPNG = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const link = document.createElement('a')
    link.download = `barcode-${barcodeType}.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
    toast.success('Barcode downloaded')
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Barcode className="h-5 w-5" /> Barcode Generator
        </CardTitle>
        <CardDescription>Generate Code 128 or EAN-13 barcodes</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="barcode-content">Barcode Content</Label>
          <Input id="barcode-content" value={content} onChange={e => setContent(e.target.value)} placeholder={barcodeType === 'ean13' ? 'Enter 12 or 13 digits' : 'Enter text'} />
        </div>
        <div className="space-y-2">
          <Label>Barcode Type</Label>
          <Select value={barcodeType} onValueChange={v => setBarcodeType(v as 'code128' | 'ean13')}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="code128">Code 128</SelectItem>
              <SelectItem value="ean13">EAN-13</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {barcodeError && <p className="text-sm text-destructive">{barcodeError}</p>}
        <div className="flex justify-center overflow-x-auto py-4">
          <canvas ref={canvasRef} className="rounded border" />
        </div>
        <div className="flex gap-2">
          <Button onClick={() => { /* Regenerate is handled via useMemo on content/barcodeType change */ }} className="flex-1">
            <RefreshCw className="h-4 w-4 mr-2" /> Generate
          </Button>
          <Button onClick={downloadPNG} variant="outline">
            <Download className="h-4 w-4 mr-2" /> PNG
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// ==================== InvoiceGenerator ====================
interface InvoiceItem {
  id: string
  description: string
  quantity: number
  unitPrice: number
}

export function InvoiceGenerator() {
  const [companyName, setCompanyName] = useState('My Company')
  const [companyEmail, setCompanyEmail] = useState('hello@mycompany.com')
  const [companyPhone, setCompanyPhone] = useState('+1 (555) 000-0000')
  const [clientName, setClientName] = useState('Client Name')
  const [clientAddress, setClientAddress] = useState('456 Client Ave, Town, State 67890')
  const [clientEmail, setClientEmail] = useState('client@example.com')
  const [invoiceNumber, setInvoiceNumber] = useState('INV-001')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [dueDate, setDueDate] = useState('')
  const [items, setItems] = useState<InvoiceItem[]>([
    { id: '1', description: 'Web Development', quantity: 1, unitPrice: 1500 },
    { id: '2', description: 'Design Services', quantity: 2, unitPrice: 500 },
    { id: '3', description: 'SEO Optimization', quantity: 1, unitPrice: 300 },
  ])
  const [taxRate, setTaxRate] = useState(10)
  const [discount, setDiscount] = useState(0)
  const [discountType, setDiscountType] = useState<'percent' | 'fixed'>('percent')
  const [currency, setCurrency] = useState('USD')
  const [notes, setNotes] = useState('Payment is due within 30 days. Thank you for your business!')
  const [generating, setGenerating] = useState(false)

  const currencySymbols: Record<string, string> = {
    USD: '$', EUR: '€', GBP: '£', JPY: '¥', CNY: '¥', INR: '₹', AUD: 'A$', CAD: 'C$', CHF: 'CHF ',
  }

  const sym = currencySymbols[currency] || '$'
  const fmt = (n: number) => `${sym}${n.toFixed(2)}`

  const addItem = () => {
    setItems([...items, { id: Date.now().toString(), description: '', quantity: 1, unitPrice: 0 }])
  }

  const removeItem = (id: string) => {
    setItems(items.filter(item => item.id !== id))
  }

  const updateItem = (id: string, field: keyof InvoiceItem, value: string | number) => {
    setItems(items.map(item => item.id === id ? { ...item, [field]: value } : item))
  }

  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0)
  const discountAmount = discountType === 'percent' ? subtotal * (discount / 100) : discount
  const afterDiscount = Math.max(0, subtotal - discountAmount)
  const tax = afterDiscount * (taxRate / 100)
  const total = afterDiscount + tax

  const generatePDF = async () => {
    setGenerating(true)
    try {
      const doc = new jsPDF()
      const pw = doc.internal.pageSize.getWidth()
      const margin = 20

      // ── Color palette ──
      const primary = [30, 58, 95]
      const accent = [224, 122, 95]

      // ── Header bar ──
      doc.setFillColor(...primary)
      doc.rect(0, 0, pw, 50, 'F')
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(28)
      doc.setFont('helvetica', 'bold')
      doc.text('INVOICE', margin, 22)
      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      doc.text(invoiceNumber, pw - margin, 18, { align: 'right' })
      doc.text(`Date: ${date}`, pw - margin, 27, { align: 'right' })
      if (dueDate) doc.text(`Due: ${dueDate}`, pw - margin, 36, { align: 'right' })

      // ── Accent stripe ──
      doc.setFillColor(...accent)
      doc.rect(0, 50, pw, 3, 'F')

      // ── Company & Client info ──
      let y = 65
      doc.setTextColor(40, 40, 40)
      doc.setFontSize(8)
      doc.setTextColor(120, 120, 120)
      doc.text('FROM', margin, y)
      y += 7
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(12)
      doc.setTextColor(30, 58, 95)
      doc.text(companyName, margin, y)
      y += 6
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9)
      doc.setTextColor(80, 80, 80)
      if (companyEmail) { doc.text(companyEmail, margin, y); y += 5 }
      if (companyPhone) { doc.text(companyPhone, margin, y); y += 5 }

      const clientX = pw / 2 + 10
      let cy = 65
      doc.setTextColor(120, 120, 120)
      doc.setFontSize(8)
      doc.text('BILL TO', clientX, cy)
      cy += 7
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(12)
      doc.setTextColor(30, 58, 95)
      doc.text(clientName, clientX, cy)
      cy += 6
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9)
      doc.setTextColor(80, 80, 80)
      const cLines = doc.splitTextToSize(clientAddress, pw / 2 - 20)
      doc.text(cLines, clientX, cy)
      if (clientEmail) {
        cy += cLines.length * 5
        doc.text(clientEmail, clientX, cy)
      }

      // ── Items table ──
      y = 105
      const colDesc = margin
      const colQty = 130
      const colPrice = 152
      const colAmount = pw - margin

      // Table header
      doc.setFillColor(245, 245, 245)
      doc.rect(margin, y - 4, pw - margin * 2, 10, 'F')
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(9)
      doc.setTextColor(100, 100, 100)
      doc.text('DESCRIPTION', colDesc, y + 2)
      doc.text('QTY', colQty, y + 2)
      doc.text('PRICE', colPrice, y + 2)
      doc.text('AMOUNT', colAmount, y + 2, { align: 'right' })

      // Table rows
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(50, 50, 50)
      y += 10
      items.forEach((item, i) => {
        if (y > 265) {
          doc.addPage()
          y = 25
        }
        if (i % 2 === 0) {
          doc.setFillColor(250, 250, 252)
          doc.rect(margin, y - 4, pw - margin * 2, 9, 'F')
        }
        const amount = item.quantity * item.unitPrice
        doc.setFontSize(9)
        doc.text(item.description || '—', colDesc, y + 2)
        doc.text(item.quantity.toString(), colQty, y + 2)
        doc.text(fmt(item.unitPrice), colPrice, y + 2)
        doc.text(fmt(amount), colAmount, y + 2, { align: 'right' })
        y += 9
      })

      // ── Bottom line ──
      y += 5
      doc.setDrawColor(220, 220, 220)
      doc.setLineWidth(0.5)
      doc.line(margin, y, pw - margin, y)
      y += 12

      // ── Totals ──
      doc.setFontSize(10)
      doc.setTextColor(100, 100, 100)
      const totalsX = pw - margin - 70
      doc.text('Subtotal:', totalsX, y)
      doc.setTextColor(50, 50, 50)
      doc.setFont('helvetica', 'bold')
      doc.text(fmt(subtotal), colAmount, y, { align: 'right' })
      y += 8

      if (discount > 0) {
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(100, 100, 100)
        doc.text(`Discount (${discountType === 'percent' ? `${discount}%` : fmt(discount)}):`, totalsX, y)
        doc.setTextColor(224, 122, 95)
        doc.text(`-${fmt(discountAmount)}`, colAmount, y, { align: 'right' })
        y += 8
      }

      doc.setFont('helvetica', 'normal')
      doc.setTextColor(100, 100, 100)
      doc.text(`Tax (${taxRate}%):`, totalsX, y)
      doc.setTextColor(50, 50, 50)
      doc.text(fmt(tax), colAmount, y, { align: 'right' })
      y += 12

      // Total box
      doc.setFillColor(...primary)
      doc.roundedRect(totalsX - 5, y - 8, pw - totalsX - margin + 5, 16, 3, 3, 'F')
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(13)
      doc.setFont('helvetica', 'bold')
      doc.text('TOTAL:', totalsX + 2, y + 1)
      doc.setFontSize(15)
      doc.text(fmt(total), colAmount, y + 1, { align: 'right' })

      // ── Notes ──
      if (notes) {
        y += 25
        doc.setTextColor(120, 120, 120)
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(8)
        doc.text('NOTES', margin, y)
        y += 6
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(9)
        doc.setTextColor(80, 80, 80)
        const noteLines = doc.splitTextToSize(notes, pw - margin * 2)
        doc.text(noteLines, margin, y)
      }

      // ── Footer ──
      const footerY = doc.internal.pageSize.getHeight() - 15
      doc.setFillColor(245, 245, 245)
      doc.rect(0, footerY - 5, pw, 25, 'F')
      doc.setFontSize(8)
      doc.setTextColor(150, 150, 150)
      doc.text('Generated with ToolBox Pro', margin, footerY + 3)
      doc.text(invoiceNumber, pw - margin, footerY + 3, { align: 'right' })

      doc.save(`${invoiceNumber}.pdf`)
      toast.success('Invoice PDF downloaded!')
    } catch {
      toast.error('Failed to generate PDF')
    } finally {
      setGenerating(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" /> Invoice Generator
        </CardTitle>
        <CardDescription>Create professional invoices and download as PDF</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Company Name</Label>
            <Input value={companyName} onChange={e => setCompanyName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Client Name</Label>
            <Input value={clientName} onChange={e => setClientName(e.target.value)} />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Company Email</Label>
            <Input type="email" value={companyEmail} onChange={e => setCompanyEmail(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Company Phone</Label>
            <Input value={companyPhone} onChange={e => setCompanyPhone(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Client Email</Label>
            <Input type="email" value={clientEmail} onChange={e => setClientEmail(e.target.value)} />
          </div>
        </div>
        <div className="space-y-2">
          <Label>Client Address</Label>
          <Textarea value={clientAddress} onChange={e => setClientAddress(e.target.value)} rows={2} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label>Invoice #</Label>
            <Input value={invoiceNumber} onChange={e => setInvoiceNumber(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Date</Label>
            <Input type="date" value={date} onChange={e => setDate(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Due Date</Label>
            <Input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Currency</Label>
            <Select value={currency} onValueChange={setCurrency}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.keys(currencySymbols).map(c => (
                  <SelectItem key={c} value={c}>{c} ({currencySymbols[c]})</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Line Items */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="font-semibold">Line Items</Label>
            <Button variant="outline" size="sm" onClick={addItem}>
              <Plus className="h-4 w-4 mr-1" /> Add Item
            </Button>
          </div>
          {/* Header row */}
          <div className="hidden sm:grid grid-cols-[1fr_80px_100px_80px_36px] gap-2 text-xs text-muted-foreground font-medium px-1">
            <span>Description</span><span>Qty</span><span>Unit Price</span><span className="text-right">Amount</span><span />
          </div>
          <div className="space-y-2 max-h-72 overflow-y-auto">
            {items.map(item => {
              const amt = item.quantity * item.unitPrice
              return (
                <div key={item.id} className="grid grid-cols-1 sm:grid-cols-[1fr_80px_100px_80px_36px] gap-2 items-center bg-muted/40 rounded-lg p-2 sm:p-0 sm:bg-transparent">
                  <Input className="sm:text-sm" placeholder="Description" value={item.description} onChange={e => updateItem(item.id, 'description', e.target.value)} />
                  <Input className="sm:text-sm sm:w-full" type="number" placeholder="Qty" value={item.quantity} onChange={e => updateItem(item.id, 'quantity', Math.max(0, Number(e.target.value)))} min={0} />
                  <Input className="sm:text-sm sm:w-full" type="number" placeholder="Price" value={item.unitPrice} onChange={e => updateItem(item.id, 'unitPrice', Math.max(0, Number(e.target.value)))} min={0} step={0.01} />
                  <span className="text-sm font-medium text-right px-1 hidden sm:block">{fmt(amt)}</span>
                  <Button variant="ghost" size="icon" onClick={() => removeItem(item.id)} className="shrink-0 h-8 w-8">
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              )
            })}
          </div>
        </div>

        {/* Tax, Discount, Notes */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Tax Rate (%)</Label>
            <Input type="number" value={taxRate} onChange={e => setTaxRate(Math.min(100, Math.max(0, Number(e.target.value))))} min={0} max={100} />
          </div>
          <div className="space-y-2">
            <Label>Discount</Label>
            <div className="flex gap-2">
              <Input type="number" value={discount} onChange={e => setDiscount(Math.max(0, Number(e.target.value)))} min={0} />
              <Select value={discountType} onValueChange={v => setDiscountType(v as 'percent' | 'fixed')}>
                <SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="percent">%</SelectItem>
                  <SelectItem value="fixed">{sym}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} />
          </div>
        </div>

        {/* Summary */}
        <div className="bg-muted/60 border rounded-lg p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Subtotal:</span><span className="font-medium">{fmt(subtotal)}</span>
          </div>
          {discount > 0 && (
            <div className="flex justify-between text-sm text-orange-600">
              <span>Discount ({discountType === 'percent' ? `${discount}%` : fmt(discount)}):</span><span>-{fmt(discountAmount)}</span>
            </div>
          )}
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Tax ({taxRate}%):</span><span className="font-medium">{fmt(tax)}</span>
          </div>
          <Separator />
          <div className="flex justify-between font-bold text-lg">
            <span>Total:</span><span className="text-primary">{fmt(total)}</span>
          </div>
        </div>

        <Button onClick={generatePDF} className="w-full" disabled={generating || items.length === 0}>
          {generating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
          Download Invoice PDF
        </Button>
      </CardContent>
    </Card>
  )
}

// ==================== CurrencyConverter ====================
const CURRENCIES = [
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'GBP', name: 'British Pound', symbol: '£' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥' },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
  { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF' },
  { code: 'KRW', name: 'South Korean Won', symbol: '₩' },
]

const FALLBACK_RATES: Record<string, number> = {
  USD: 1, EUR: 0.92, GBP: 0.79, JPY: 149.5, CNY: 7.24,
  INR: 83.12, AUD: 1.53, CAD: 1.36, CHF: 0.88, KRW: 1328.5,
}

export function CurrencyConverter() {
  const [amount, setAmount] = useState(100)
  const [fromCurrency, setFromCurrency] = useState('USD')
  const [toCurrency, setToCurrency] = useState('EUR')
  const [rates, setRates] = useState<Record<string, number>>(FALLBACK_RATES)
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<string>('')

  useEffect(() => {
    const fetchRates = async () => {
      try {
        const res = await fetch('/api/exchange-rate?XTransformPort=3000')
        if (!res.ok) throw new Error('API error')
        const data = await res.json()
        setRates(data.rates)
        setLastUpdated(data.fallback ? 'fallback rates' : (data.date || new Date().toISOString().split('T')[0]))
      } catch {
        setRates(FALLBACK_RATES)
        setLastUpdated('fallback rates')
      } finally {
        setLoading(false)
      }
    }
    fetchRates()
  }, [])

  const convert = () => {
    const fromRate = rates[fromCurrency] || 1
    const toRate = rates[toCurrency] || 1
    return (amount / fromRate) * toRate
  }

  const exchangeRate = rates[toCurrency] && rates[fromCurrency]
    ? (rates[toCurrency] / rates[fromCurrency])
    : 1

  const swapCurrencies = () => {
    setFromCurrency(toCurrency)
    setToCurrency(fromCurrency)
  }

  const result = convert()
  const toCurr = CURRENCIES.find(c => c.code === toCurrency)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" /> Currency Converter
        </CardTitle>
        <CardDescription>Convert between world currencies</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading && <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Loading exchange rates...</div>}
        <div className="space-y-2">
          <Label>Amount</Label>
          <Input type="number" value={amount} onChange={e => setAmount(Number(e.target.value))} min={0} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-[1fr,auto,1fr] gap-2 items-end">
          <div className="space-y-2">
            <Label>From</Label>
            <Select value={fromCurrency} onValueChange={setFromCurrency}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {CURRENCIES.map(c => (
                  <SelectItem key={c.code} value={c.code}>{c.code} - {c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button variant="outline" size="icon" onClick={swapCurrencies} className="shrink-0">
            <ArrowUpDown className="h-4 w-4" />
          </Button>
          <div className="space-y-2">
            <Label>To</Label>
            <Select value={toCurrency} onValueChange={setToCurrency}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {CURRENCIES.map(c => (
                  <SelectItem key={c.code} value={c.code}>{c.code} - {c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="bg-muted p-4 rounded-lg space-y-2">
          <div className="text-2xl font-bold">
            {toCurr?.symbol || ''}{result.toFixed(2)} <span className="text-base font-normal text-muted-foreground">{toCurrency}</span>
          </div>
          <div className="text-sm text-muted-foreground">
            1 {fromCurrency} = {exchangeRate.toFixed(4)} {toCurrency}
          </div>
          {lastUpdated && (
            <div className="text-xs text-muted-foreground">Rates from: {lastUpdated}</div>
          )}
        </div>
        <Button variant="outline" size="sm" onClick={() => { navigator.clipboard.writeText(`${result.toFixed(2)} ${toCurrency}`); toast.success('Copied to clipboard') }}>
          <Copy className="h-4 w-4 mr-2" /> Copy Result
        </Button>
      </CardContent>
    </Card>
  )
}

// ==================== UnitConverter ====================
type UnitCategory = 'length' | 'weight' | 'volume' | 'temperature'

const UNIT_OPTIONS: Record<UnitCategory, { value: string; label: string }[]> = {
  length: [
    { value: 'mm', label: 'Millimeter (mm)' }, { value: 'cm', label: 'Centimeter (cm)' },
    { value: 'm', label: 'Meter (m)' }, { value: 'km', label: 'Kilometer (km)' },
    { value: 'inch', label: 'Inch (in)' }, { value: 'foot', label: 'Foot (ft)' },
    { value: 'yard', label: 'Yard (yd)' }, { value: 'mile', label: 'Mile (mi)' },
  ],
  weight: [
    { value: 'mg', label: 'Milligram (mg)' }, { value: 'g', label: 'Gram (g)' },
    { value: 'kg', label: 'Kilogram (kg)' }, { value: 'lb', label: 'Pound (lb)' },
    { value: 'oz', label: 'Ounce (oz)' }, { value: 'ton', label: 'Ton (t)' },
  ],
  volume: [
    { value: 'ml', label: 'Milliliter (ml)' }, { value: 'l', label: 'Liter (L)' },
    { value: 'gal', label: 'Gallon (gal)' }, { value: 'qt', label: 'Quart (qt)' },
    { value: 'pt', label: 'Pint (pt)' }, { value: 'cup', label: 'Cup' },
    { value: 'floz', label: 'Fluid Ounce (fl oz)' },
  ],
  temperature: [
    { value: 'celsius', label: 'Celsius (°C)' }, { value: 'fahrenheit', label: 'Fahrenheit (°F)' },
    { value: 'kelvin', label: 'Kelvin (K)' },
  ],
}

const BASE_UNITS: Record<string, number> = {
  // Length -> meters
  mm: 0.001, cm: 0.01, m: 1, km: 1000,
  inch: 0.0254, foot: 0.3048, yard: 0.9144, mile: 1609.344,
  // Weight -> kg
  mg: 0.000001, g: 0.001, kg: 1, lb: 0.453592, oz: 0.0283495, ton: 1000,
  // Volume -> liters
  ml: 0.001, l: 1, gal: 3.78541, qt: 0.946353, pt: 0.473176, cup: 0.236588, floz: 0.0295735,
}

function convertTemperature(value: number, from: string, to: string): number {
  let celsius: number
  if (from === 'celsius') celsius = value
  else if (from === 'fahrenheit') celsius = (value - 32) * 5 / 9
  else celsius = value - 273.15

  if (to === 'celsius') return celsius
  if (to === 'fahrenheit') return celsius * 9 / 5 + 32
  return celsius + 273.15
}

function convertUnit(value: number, from: string, to: string, category: UnitCategory): number {
  if (category === 'temperature') return convertTemperature(value, from, to)
  const fromBase = BASE_UNITS[from]
  const toBase = BASE_UNITS[to]
  if (!fromBase || !toBase) return 0
  return value * fromBase / toBase
}

export function UnitConverter() {
  const [category, setCategory] = useState<UnitCategory>('length')
  const [fromUnit, setFromUnit] = useState('m')
  const [toUnit, setToUnit] = useState('km')
  const [value, setValue] = useState(1)

  const result = convertUnit(value, fromUnit, toUnit, category)

  const handleCategoryChange = (newCat: UnitCategory) => {
    setCategory(newCat)
    const opts = UNIT_OPTIONS[newCat]
    setFromUnit(opts[0].value)
    setToUnit(opts[1].value)
  }

  const swap = () => {
    setFromUnit(toUnit)
    setToUnit(fromUnit)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Ruler className="h-5 w-5" /> Unit Converter
        </CardTitle>
        <CardDescription>Convert between different units of measurement</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Category</Label>
          <Select value={category} onValueChange={v => handleCategoryChange(v as UnitCategory)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="length">Length</SelectItem>
              <SelectItem value="weight">Weight</SelectItem>
              <SelectItem value="volume">Volume</SelectItem>
              <SelectItem value="temperature">Temperature</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Value</Label>
          <Input type="number" value={value} onChange={e => setValue(Number(e.target.value))} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-[1fr,auto,1fr] gap-2 items-end">
          <div className="space-y-2">
            <Label>From</Label>
            <Select value={fromUnit} onValueChange={setFromUnit}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {UNIT_OPTIONS[category].map(u => (
                  <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button variant="outline" size="icon" onClick={swap} className="shrink-0">
            <ArrowUpDown className="h-4 w-4" />
          </Button>
          <div className="space-y-2">
            <Label>To</Label>
            <Select value={toUnit} onValueChange={setToUnit}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {UNIT_OPTIONS[category].map(u => (
                  <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="bg-muted p-4 rounded-lg">
          <div className="text-2xl font-bold">
            {Number.isFinite(result) ? result.toLocaleString(undefined, { maximumFractionDigits: 8 }) : '—'}
          </div>
          <div className="text-sm text-muted-foreground">
            {value} {fromUnit} = {Number.isFinite(result) ? result.toLocaleString(undefined, { maximumFractionDigits: 8 }) : '—'} {toUnit}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
