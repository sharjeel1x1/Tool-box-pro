'use client'

import React, { useState, useRef, useCallback, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import {
  Upload, Download, Copy, RotateCcw,
  ArrowUp, ArrowDown, Plus, Trash2,
  Crop, RefreshCw, Check, Image as ImageIcon,
  Maximize2, Minimize2, FlipHorizontal, Palette,
  ZoomIn
} from 'lucide-react'

// ==================== Shared Helpers ====================

function loadImageFromFile(file: File): Promise<{ img: HTMLImageElement; url: string }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => resolve({ img, url })
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Failed to load image')) }
    img.src = url
  })
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
}

function getFileFormat(file: File): string {
  const ext = file.name.split('.').pop()?.toLowerCase() || ''
  if (ext === 'jpg' || ext === 'jpeg') return 'JPEG'
  if (ext === 'png') return 'PNG'
  if (ext === 'webp') return 'WebP'
  if (ext === 'bmp') return 'BMP'
  if (ext === 'gif') return 'GIF'
  return file.type.split('/')[1]?.toUpperCase() || 'Unknown'
}

// ==================== GIF Encoder ====================

function generate332Palette(): number[][] {
  const palette: number[][] = []
  for (let i = 0; i < 256; i++) {
    const r = Math.round(((i >> 5) & 7) * 255 / 7)
    const g = Math.round(((i >> 2) & 7) * 255 / 7)
    const b = Math.round((i & 3) * 255 / 3)
    palette.push([r, g, b])
  }
  return palette
}

function mapPixelTo332(r: number, g: number, b: number, a: number): number {
  if (a < 128) return 0
  const ri = Math.min(7, Math.round(r * 7 / 255))
  const gi = Math.min(7, Math.round(g * 7 / 255))
  const bi = Math.min(3, Math.round(b * 3 / 255))
  return (ri << 5) | (gi << 2) | bi
}

function lzwEncode(indexedPixels: number[], minCodeSize: number): number[] {
  const clearCode = 1 << minCodeSize
  const eoiCode = clearCode + 1

  const output: number[] = []
  let bitBuf = 0
  let bitCnt = 0
  let codeSize = minCodeSize + 1
  let nextCode = eoiCode + 1

  let table: Map<number, number>[] = []

  function writeBits(code: number) {
    bitBuf |= code << bitCnt
    bitCnt += codeSize
    while (bitCnt >= 8) {
      output.push(bitBuf & 0xFF)
      bitBuf >>= 8
      bitCnt -= 8
    }
  }

  function resetTable() {
    table = []
    codeSize = minCodeSize + 1
    nextCode = eoiCode + 1
  }

  resetTable()
  writeBits(clearCode)

  if (indexedPixels.length === 0) {
    writeBits(eoiCode)
    if (bitCnt > 0) output.push(bitBuf & 0xFF)
    return output
  }

  let currentCode = indexedPixels[0]

  for (let i = 1; i < indexedPixels.length; i++) {
    const pixel = indexedPixels[i]

    if (table[currentCode]?.has(pixel)) {
      currentCode = table[currentCode].get(pixel)!
    } else {
      writeBits(currentCode)

      if (nextCode < 4096) {
        if (!table[currentCode]) table[currentCode] = new Map()
        table[currentCode].set(pixel, nextCode)
        nextCode++
        if (nextCode > (1 << codeSize) && codeSize < 12) {
          codeSize++
        }
      } else {
        writeBits(clearCode)
        resetTable()
      }

      currentCode = pixel
    }
  }

  writeBits(currentCode)
  writeBits(eoiCode)
  if (bitCnt > 0) output.push(bitBuf & 0xFF)

  return output
}

function writeSubBlocks(data: number[]): number[] {
  const result: number[] = []
  let offset = 0
  while (offset < data.length) {
    const blockSize = Math.min(255, data.length - offset)
    result.push(blockSize)
    for (let i = 0; i < blockSize; i++) {
      result.push(data[offset + i])
    }
    offset += blockSize
  }
  result.push(0)
  return result
}

function encodeGif(
  frames: { indexedPixels: number[]; delay: number }[],
  width: number,
  height: number
): Uint8Array {
  const palette = generate332Palette()
  const bytes: number[] = []

  const write16 = (val: number) => {
    bytes.push(val & 0xFF, (val >> 8) & 0xFF)
  }

  // Header
  bytes.push(0x47, 0x49, 0x46, 0x38, 0x39, 0x61) // GIF89a

  // Logical Screen Descriptor
  write16(width)
  write16(height)
  bytes.push(0xF7) // GCT flag=1, color res=7, sort=0, GCT size=7 (256 entries)
  bytes.push(0)    // Background color index
  bytes.push(0)    // Pixel aspect ratio

  // Global Color Table
  for (const [r, g, b] of palette) {
    bytes.push(r, g, b)
  }

  // Netscape Application Extension (loop)
  bytes.push(0x21, 0xFF)
  bytes.push(11)
  bytes.push(0x4E, 0x45, 0x54, 0x53, 0x43, 0x41, 0x50, 0x45)
  bytes.push(0x32, 0x2E, 0x30) // NETSCAPE2.0
  bytes.push(3)
  bytes.push(1)
  write16(0) // Infinite loop
  bytes.push(0)

  // Frames
  for (const frame of frames) {
    // Graphic Control Extension
    bytes.push(0x21, 0xF9)
    bytes.push(4)
    bytes.push(0x04) // Disposal method: do not dispose
    write16(Math.max(2, Math.round(frame.delay / 10))) // Delay in 1/100 sec
    bytes.push(0) // Transparent color index
    bytes.push(0) // Block terminator

    // Image Descriptor
    bytes.push(0x2C)
    write16(0) // Left
    write16(0) // Top
    write16(width)
    write16(height)
    bytes.push(0) // No local color table, no interlace

    // Image Data
    const minCodeSize = 8
    bytes.push(minCodeSize)
    const lzwData = lzwEncode(frame.indexedPixels, minCodeSize)
    bytes.push(...writeSubBlocks(lzwData))
  }

  // Trailer
  bytes.push(0x3B)

  return new Uint8Array(bytes)
}

// ==================== DropZone Component ====================

interface DropZoneProps {
  onFiles: (files: File[]) => void
  accept: string
  multiple?: boolean
  label?: string
}

function DropZone({ onFiles, accept, multiple, label }: DropZoneProps) {
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) onFiles(files)
  }, [onFiles])

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        className="hidden"
        onChange={e => {
          const files = Array.from(e.target.files || [])
          if (files.length > 0) onFiles(files)
          e.target.value = ''
        }}
      />
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
          dragging
            ? 'border-primary bg-primary/5'
            : 'border-muted-foreground/25 hover:border-primary/50'
        }`}
        onClick={() => inputRef.current?.click()}
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
      >
        <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground">
          {label || 'Drop image here or click to upload'}
        </p>
      </div>
    </div>
  )
}

// ==================== 1. ImageResizer ====================

export function ImageResizer() {
  const [image, setImage] = useState<HTMLImageElement | null>(null)
  const [srcUrl, setSrcUrl] = useState<string | null>(null)
  const [fileName, setFileName] = useState('')
  const [originalW, setOriginalW] = useState(0)
  const [originalH, setOriginalH] = useState(0)
  const [width, setWidth] = useState('')
  const [height, setHeight] = useState('')
  const [maintainAspect, setMaintainAspect] = useState(true)
  const [outputFormat, setOutputFormat] = useState('png')
  const [processing, setProcessing] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  const handleFiles = useCallback(async (files: File[]) => {
    const file = files[0]
    if (!file) return
    try {
      const { img, url } = await loadImageFromFile(file)
      if (srcUrl) URL.revokeObjectURL(srcUrl)
      setImage(img)
      setSrcUrl(url)
      setFileName(file.name)
      setOriginalW(img.width)
      setOriginalH(img.height)
      setWidth(String(img.width))
      setHeight(String(img.height))
      if (previewUrl) URL.revokeObjectURL(previewUrl)
      setPreviewUrl(null)
    } catch {
      toast.error('Failed to load image')
    }
  }, [srcUrl, previewUrl])

  const handleWidthChange = useCallback((val: string) => {
    setWidth(val)
    if (maintainAspect && originalW > 0) {
      const w = parseInt(val)
      if (!isNaN(w) && w > 0) {
        setHeight(String(Math.round((w / originalW) * originalH)))
      }
    }
  }, [maintainAspect, originalW, originalH])

  const handleHeightChange = useCallback((val: string) => {
    setHeight(val)
    if (maintainAspect && originalH > 0) {
      const h = parseInt(val)
      if (!isNaN(h) && h > 0) {
        setWidth(String(Math.round((h / originalH) * originalW)))
      }
    }
  }, [maintainAspect, originalW, originalH])

  const handleResize = useCallback(() => {
    if (!image) return
    const w = parseInt(width)
    const h = parseInt(height)
    if (isNaN(w) || isNaN(h) || w <= 0 || h <= 0) {
      toast.error('Please enter valid dimensions')
      return
    }
    if (w > 10000 || h > 10000) {
      toast.error('Maximum dimension is 10000px')
      return
    }

    setProcessing(true)
    try {
      const canvas = document.createElement('canvas')
      canvas.width = w
      canvas.height = h
      const ctx = canvas.getContext('2d')!
      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = 'high'
      ctx.drawImage(image, 0, 0, w, h)

      const mimeTypes: Record<string, string> = { png: 'image/png', jpg: 'image/jpeg', webp: 'image/webp' }
      const mime = mimeTypes[outputFormat] || 'image/png'

      canvas.toBlob(blob => {
        if (blob) {
          if (previewUrl) URL.revokeObjectURL(previewUrl)
          const url = URL.createObjectURL(blob)
          setPreviewUrl(url)
          toast.success(`Resized to ${w}×${h}`)
        }
        setProcessing(false)
      }, mime, 0.92)
    } catch {
      toast.error('Resize failed')
      setProcessing(false)
    }
  }, [image, width, height, outputFormat, previewUrl])

  const handleDownload = useCallback(() => {
    if (!previewUrl) return
    const a = document.createElement('a')
    a.href = previewUrl
    a.download = `resized-${width}x${height}.${outputFormat}`
    a.click()
  }, [previewUrl, width, height, outputFormat])

  const presets = [
    { label: '50%', w: 0.5, h: 0.5 },
    { label: '75%', w: 0.75, h: 0.75 },
    { label: '150%', w: 1.5, h: 1.5 },
    { label: '200%', w: 2, h: 2 },
    { label: 'HD 720p', w: 1280, h: 720 },
    { label: 'Full HD', w: 1920, h: 1080 },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Maximize2 className="h-5 w-5" /> Image Resizer
        </CardTitle>
        <CardDescription>Resize images to any dimension while maintaining quality</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!image ? (
          <DropZone onFiles={handleFiles} accept="image/png,image/jpeg,image/webp" />
        ) : (
          <>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{originalW}×{originalH}</Badge>
                <span className="text-sm text-muted-foreground">{fileName}</span>
              </div>
              <Button variant="ghost" size="sm" onClick={() => { setImage(null); if (srcUrl) URL.revokeObjectURL(srcUrl); setSrcUrl(null); if (previewUrl) URL.revokeObjectURL(previewUrl); setPreviewUrl(null) }}>
                <RotateCcw className="h-4 w-4 mr-1" /> Reset
              </Button>
            </div>

            <div className="bg-muted/50 rounded-lg p-2 max-h-48 overflow-hidden flex items-center justify-center">
              <img src={srcUrl!} alt="Preview" className="max-h-44 max-w-full object-contain rounded" />
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Quick Presets</Label>
              <div className="flex flex-wrap gap-2">
                {presets.map(p => (
                  <Button
                    key={p.label}
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (typeof p.w === 'number' && p.w < 10) {
                        setWidth(String(Math.round(originalW * p.w)))
                        setHeight(String(Math.round(originalH * p.h)))
                      } else {
                        const scaleW = (p.w as number) / originalW
                        const scaleH = (p.h as number) / originalH
                        const scale = Math.min(scaleW, scaleH)
                        setWidth(String(Math.round(originalW * scale)))
                        setHeight(String(Math.round(originalH * scale)))
                      }
                    }}
                  >
                    {p.label}
                  </Button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Width (px)</Label>
                <Input type="number" value={width} onChange={e => handleWidthChange(e.target.value)} min={1} max={10000} />
              </div>
              <div className="space-y-2">
                <Label>Height (px)</Label>
                <Input type="number" value={height} onChange={e => handleHeightChange(e.target.value)} min={1} max={10000} />
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center space-x-2">
                <Switch id="aspect-lock" checked={maintainAspect} onCheckedChange={setMaintainAspect} />
                <Label htmlFor="aspect-lock" className="cursor-pointer text-sm">Lock aspect ratio</Label>
              </div>
              <div className="flex items-center gap-2 ml-auto">
                <Label className="text-sm">Format:</Label>
                <Select value={outputFormat} onValueChange={setOutputFormat}>
                  <SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="png">PNG</SelectItem>
                    <SelectItem value="jpg">JPG</SelectItem>
                    <SelectItem value="webp">WebP</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button onClick={handleResize} className="w-full" disabled={processing}>
              {processing ? (
                <><RefreshCw className="h-4 w-4 mr-2 animate-spin" /> Processing...</>
              ) : (
                <><Maximize2 className="h-4 w-4 mr-2" /> Resize Image</>
              )}
            </Button>

            {previewUrl && (
              <div className="space-y-3">
                <div className="bg-muted/50 rounded-lg p-2 max-h-48 overflow-hidden flex items-center justify-center">
                  <img src={previewUrl} alt="Resized" className="max-h-44 max-w-full object-contain rounded" />
                </div>
                <div className="flex items-center justify-between">
                  <Badge variant="secondary">{width}×{height}</Badge>
                  <Button onClick={handleDownload}>
                    <Download className="h-4 w-4 mr-2" /> Download
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}

// ==================== 2. ImageCompressor ====================

export function ImageCompressor() {
  const [image, setImage] = useState<HTMLImageElement | null>(null)
  const [srcUrl, setSrcUrl] = useState<string | null>(null)
  const [fileName, setFileName] = useState('')
  const [originalSize, setOriginalSize] = useState(0)
  const [quality, setQuality] = useState(80)
  const [compressedBlob, setCompressedBlob] = useState<Blob | null>(null)
  const [compressedSize, setCompressedSize] = useState(0)
  const [processing, setProcessing] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  const handleFiles = useCallback(async (files: File[]) => {
    const file = files[0]
    if (!file) return
    try {
      const { img, url } = await loadImageFromFile(file)
      if (srcUrl) URL.revokeObjectURL(srcUrl)
      setImage(img)
      setSrcUrl(url)
      setFileName(file.name)
      setOriginalSize(file.size)
      setCompressedBlob(null)
      setCompressedSize(0)
      if (previewUrl) URL.revokeObjectURL(previewUrl)
      setPreviewUrl(null)
    } catch {
      toast.error('Failed to load image')
    }
  }, [srcUrl, previewUrl])

  const handleCompress = useCallback(() => {
    if (!image) return
    setProcessing(true)

    const canvas = document.createElement('canvas')
    canvas.width = image.width
    canvas.height = image.height
    const ctx = canvas.getContext('2d')!
    ctx.drawImage(image, 0, 0)

    canvas.toBlob(blob => {
      if (blob) {
        setCompressedBlob(blob)
        setCompressedSize(blob.size)
        if (previewUrl) URL.revokeObjectURL(previewUrl)
        setPreviewUrl(URL.createObjectURL(blob))
        const savings = ((1 - blob.size / originalSize) * 100).toFixed(1)
        toast.success(`Compressed! ${savings}% smaller`)
      }
      setProcessing(false)
    }, 'image/jpeg', quality / 100)
  }, [image, quality, originalSize, previewUrl])

  const handleDownload = useCallback(() => {
    if (!compressedBlob) return
    downloadBlob(compressedBlob, `compressed-${fileName}`)
  }, [compressedBlob, fileName])

  const savings = originalSize > 0 ? ((1 - compressedSize / originalSize) * 100).toFixed(1) : '0'

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Minimize2 className="h-5 w-5" /> Image Compressor
        </CardTitle>
        <CardDescription>Compress images to reduce file size without losing quality</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!image ? (
          <DropZone onFiles={handleFiles} accept="image/png,image/jpeg,image/webp" />
        ) : (
          <>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{image.width}×{image.height}</Badge>
                <span className="text-sm text-muted-foreground">{fileName}</span>
              </div>
              <Button variant="ghost" size="sm" onClick={() => { setImage(null); if (srcUrl) URL.revokeObjectURL(srcUrl); setSrcUrl(null); setCompressedBlob(null); if (previewUrl) URL.revokeObjectURL(previewUrl); setPreviewUrl(null) }}>
                <RotateCcw className="h-4 w-4 mr-1" /> Reset
              </Button>
            </div>

            <div className="bg-muted/50 rounded-lg p-2 max-h-48 overflow-hidden flex items-center justify-center">
              <img src={srcUrl!} alt="Preview" className="max-h-44 max-w-full object-contain rounded" />
            </div>

            <div className="bg-muted p-3 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Original Size</span>
                <span className="font-medium">{formatFileSize(originalSize)}</span>
              </div>
              {compressedSize > 0 && (
                <>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-sm text-muted-foreground">Compressed Size</span>
                    <span className="font-medium">{formatFileSize(compressedSize)}</span>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-sm text-muted-foreground">Savings</span>
                    <Badge variant={Number(savings) > 0 ? 'default' : 'destructive'}>
                      {Number(savings) > 0 ? savings + '%' : 'Larger'}
                    </Badge>
                  </div>
                </>
              )}
            </div>

            <div className="space-y-2">
              <Label>Quality: {quality}%</Label>
              <Slider value={[quality]} onValueChange={v => setQuality(v[0])} min={1} max={100} step={1} />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Smallest file</span>
                <span>Best quality</span>
              </div>
            </div>

            <Button onClick={handleCompress} className="w-full" disabled={processing}>
              {processing ? (
                <><RefreshCw className="h-4 w-4 mr-2 animate-spin" /> Compressing...</>
              ) : (
                <><Minimize2 className="h-4 w-4 mr-2" /> Compress Image</>
              )}
            </Button>

            {compressedBlob && (
              <Button onClick={handleDownload} className="w-full" variant="outline">
                <Download className="h-4 w-4 mr-2" /> Download Compressed Image
              </Button>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}

// ==================== 3. ImageCropper ====================

interface CropRect {
  x: number
  y: number
  w: number
  h: number
}

export function ImageCropper() {
  const [image, setImage] = useState<HTMLImageElement | null>(null)
  const [fileName, setFileName] = useState('')
  const [cropRect, setCropRect] = useState<CropRect | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas || !image) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = image.width
    canvas.height = image.height
    ctx.drawImage(image, 0, 0)

    if (cropRect && cropRect.w > 0 && cropRect.h > 0) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      ctx.save()
      ctx.beginPath()
      ctx.rect(cropRect.x, cropRect.y, cropRect.w, cropRect.h)
      ctx.clip()
      ctx.drawImage(image, 0, 0)
      ctx.restore()

      ctx.strokeStyle = '#ffffff'
      ctx.lineWidth = Math.max(1, Math.round(image.width / 500))
      ctx.setLineDash([8, 4])
      ctx.strokeRect(cropRect.x, cropRect.y, cropRect.w, cropRect.h)
      ctx.setLineDash([])
    }
  }, [image, cropRect])

  useEffect(() => { drawCanvas() }, [drawCanvas])

  const getImageCoords = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current!
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    return {
      x: Math.round((e.clientX - rect.left) * scaleX),
      y: Math.round((e.clientY - rect.top) * scaleY)
    }
  }, [])

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const coords = getImageCoords(e)
    setIsDragging(true)
    setDragStart(coords)
    setCropRect(null)
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setPreviewUrl(null)
  }, [getImageCoords, previewUrl])

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging || !dragStart) return
    const coords = getImageCoords(e)
    setCropRect({
      x: Math.min(dragStart.x, coords.x),
      y: Math.min(dragStart.y, coords.y),
      w: Math.abs(coords.x - dragStart.x),
      h: Math.abs(coords.y - dragStart.y)
    })
  }, [isDragging, dragStart, getImageCoords])

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
    setDragStart(null)
  }, [])

  const handleCrop = useCallback(() => {
    if (!image || !cropRect || cropRect.w <= 0 || cropRect.h <= 0) {
      toast.error('Please draw a crop area on the image')
      return
    }

    const canvas = document.createElement('canvas')
    canvas.width = cropRect.w
    canvas.height = cropRect.h
    const ctx = canvas.getContext('2d')!
    ctx.drawImage(image, cropRect.x, cropRect.y, cropRect.w, cropRect.h, 0, 0, cropRect.w, cropRect.h)

    canvas.toBlob(blob => {
      if (blob) {
        if (previewUrl) URL.revokeObjectURL(previewUrl)
        setPreviewUrl(URL.createObjectURL(blob))
        toast.success('Image cropped!')
      }
    }, 'image/png')
  }, [image, cropRect, previewUrl])

  const handleDownload = useCallback(() => {
    if (!previewUrl) return
    const a = document.createElement('a')
    a.href = previewUrl
    a.download = `cropped-${fileName}`
    a.click()
  }, [previewUrl, fileName])

  const handleFiles = useCallback(async (files: File[]) => {
    const file = files[0]
    if (!file) return
    try {
      const { img } = await loadImageFromFile(file)
      setImage(img)
      setFileName(file.name)
      setCropRect(null)
      if (previewUrl) URL.revokeObjectURL(previewUrl)
      setPreviewUrl(null)
    } catch {
      toast.error('Failed to load image')
    }
  }, [previewUrl])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Crop className="h-5 w-5" /> Image Cropper
        </CardTitle>
        <CardDescription>Crop images by drawing a selection area</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!image ? (
          <DropZone onFiles={handleFiles} accept="image/png,image/jpeg,image/webp" />
        ) : (
          <>
            <div className="flex items-center justify-between">
              <Badge variant="secondary">{image.width}×{image.height}</Badge>
              <Button variant="ghost" size="sm" onClick={() => { setImage(null); setCropRect(null); if (previewUrl) URL.revokeObjectURL(previewUrl); setPreviewUrl(null) }}>
                <RotateCcw className="h-4 w-4 mr-1" /> Reset
              </Button>
            </div>

            <div className="bg-muted/30 rounded-lg overflow-hidden border">
              <canvas
                ref={canvasRef}
                className="w-full h-auto cursor-crosshair"
                style={{ imageRendering: 'auto' }}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
              />
            </div>

            <p className="text-xs text-muted-foreground text-center">
              Click and drag on the image to select the crop area
            </p>

            {cropRect && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Badge variant="outline">Selection: {cropRect.w}×{cropRect.h}px</Badge>
                <Badge variant="outline">Position: ({cropRect.x}, {cropRect.y})</Badge>
              </div>
            )}

            <div className="flex gap-2">
              <Button onClick={handleCrop} className="flex-1" disabled={!cropRect || cropRect.w <= 0 || cropRect.h <= 0}>
                <Crop className="h-4 w-4 mr-2" /> Crop Image
              </Button>
              {cropRect && (
                <Button variant="outline" onClick={() => { setCropRect(null); if (previewUrl) URL.revokeObjectURL(previewUrl); setPreviewUrl(null) }}>
                  Clear Selection
                </Button>
              )}
            </div>

            {previewUrl && (
              <div className="space-y-3">
                <Label className="text-sm font-medium">Crop Preview</Label>
                <div className="bg-muted/50 rounded-lg p-2 max-h-48 overflow-hidden flex items-center justify-center">
                  <img src={previewUrl} alt="Cropped" className="max-h-44 max-w-full object-contain rounded" />
                </div>
                <Button onClick={handleDownload} className="w-full">
                  <Download className="h-4 w-4 mr-2" /> Download Cropped Image
                </Button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}

// ==================== 4. ImageConverter ====================

export function ImageConverter() {
  const [image, setImage] = useState<HTMLImageElement | null>(null)
  const [fileName, setFileName] = useState('')
  const [originalFormat, setOriginalFormat] = useState('')
  const [originalSize, setOriginalSize] = useState(0)
  const [outputFormat, setOutputFormat] = useState('png')
  const [convertedBlob, setConvertedBlob] = useState<Blob | null>(null)
  const [convertedSize, setConvertedSize] = useState(0)
  const [processing, setProcessing] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  const handleFiles = useCallback(async (files: File[]) => {
    const file = files[0]
    if (!file) return
    try {
      const { img } = await loadImageFromFile(file)
      setImage(img)
      setFileName(file.name)
      setOriginalFormat(getFileFormat(file))
      setOriginalSize(file.size)
      setConvertedBlob(null)
      setConvertedSize(0)
      if (previewUrl) URL.revokeObjectURL(previewUrl)
      setPreviewUrl(null)
    } catch {
      toast.error('Failed to load image')
    }
  }, [previewUrl])

  const handleConvert = useCallback(() => {
    if (!image) return
    setProcessing(true)

    const canvas = document.createElement('canvas')
    canvas.width = image.width
    canvas.height = image.height
    const ctx = canvas.getContext('2d')!

    if (outputFormat === 'jpg') {
      ctx.fillStyle = '#FFFFFF'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
    }

    ctx.drawImage(image, 0, 0)

    const mimeTypes: Record<string, string> = {
      png: 'image/png',
      jpg: 'image/jpeg',
      webp: 'image/webp'
    }
    const mime = mimeTypes[outputFormat] || 'image/png'

    canvas.toBlob(blob => {
      if (blob) {
        setConvertedBlob(blob)
        setConvertedSize(blob.size)
        if (previewUrl) URL.revokeObjectURL(previewUrl)
        setPreviewUrl(URL.createObjectURL(blob))
        toast.success(`Converted to ${outputFormat.toUpperCase()}`)
      }
      setProcessing(false)
    }, mime, 0.92)
  }, [image, outputFormat, previewUrl])

  const handleDownload = useCallback(() => {
    if (!convertedBlob) return
    const ext = outputFormat === 'jpg' ? 'jpg' : outputFormat
    const baseName = fileName.replace(/\.[^.]+$/, '')
    downloadBlob(convertedBlob, `${baseName}.${ext}`)
  }, [convertedBlob, fileName, outputFormat])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FlipHorizontal className="h-5 w-5" /> Image Converter
        </CardTitle>
        <CardDescription>Convert images between PNG, JPG, WebP, and BMP formats</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!image ? (
          <DropZone onFiles={handleFiles} accept="image/png,image/jpeg,image/webp,image/bmp" />
        ) : (
          <>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{image.width}×{image.height}</Badge>
                <Badge variant="outline">{originalFormat}</Badge>
                <span className="text-sm text-muted-foreground">{fileName}</span>
              </div>
              <Button variant="ghost" size="sm" onClick={() => { setImage(null); setConvertedBlob(null); if (previewUrl) URL.revokeObjectURL(previewUrl); setPreviewUrl(null) }}>
                <RotateCcw className="h-4 w-4 mr-1" /> Reset
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-muted p-3 rounded-lg text-center">
                <div className="text-xs text-muted-foreground mb-1">Before</div>
                <div className="font-medium">{originalFormat}</div>
                <div className="text-sm text-muted-foreground">{formatFileSize(originalSize)}</div>
              </div>
              {convertedBlob && (
                <div className="bg-primary/10 p-3 rounded-lg text-center">
                  <div className="text-xs text-muted-foreground mb-1">After</div>
                  <div className="font-medium">{outputFormat.toUpperCase()}</div>
                  <div className="text-sm text-muted-foreground">{formatFileSize(convertedSize)}</div>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>Output Format</Label>
              <Select value={outputFormat} onValueChange={v => { setOutputFormat(v); setConvertedBlob(null); setConvertedSize(0) }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="png">PNG</SelectItem>
                  <SelectItem value="jpg">JPG (JPEG)</SelectItem>
                  <SelectItem value="webp">WebP</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button onClick={handleConvert} className="w-full" disabled={processing}>
              {processing ? (
                <><RefreshCw className="h-4 w-4 mr-2 animate-spin" /> Converting...</>
              ) : (
                <><FlipHorizontal className="h-4 w-4 mr-2" /> Convert to {outputFormat.toUpperCase()}</>
              )}
            </Button>

            {convertedBlob && (
              <div className="space-y-3">
                <div className="bg-muted/50 rounded-lg p-2 max-h-48 overflow-hidden flex items-center justify-center">
                  <img src={previewUrl!} alt="Converted" className="max-h-44 max-w-full object-contain rounded" />
                </div>
                <div className="flex items-center justify-between">
                  <Badge variant={convertedSize < originalSize ? 'default' : 'destructive'}>
                    {convertedSize < originalSize
                      ? `${((1 - convertedSize / originalSize) * 100).toFixed(1)}% smaller`
                      : `${((convertedSize / originalSize - 1) * 100).toFixed(1)}% larger`
                    }
                  </Badge>
                  <Button onClick={handleDownload}>
                    <Download className="h-4 w-4 mr-2" /> Download
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}

// ==================== 5. ImageToBase64 ====================

export function ImageToBase64() {
  const [image, setImage] = useState<HTMLImageElement | null>(null)
  const [fileName, setFileName] = useState('')
  const [base64String, setBase64String] = useState('')
  const [dataUri, setDataUri] = useState('')
  const [showDataUri, setShowDataUri] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleFiles = useCallback((files: File[]) => {
    const file = files[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File too large. Maximum 5MB for Base64 conversion.')
      return
    }

    setProcessing(true)
    setFileName(file.name)

    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      setDataUri(result)
      const base64Part = result.split(',')[1] || ''
      setBase64String(base64Part)
      setProcessing(false)

      const img = new Image()
      img.onload = () => setImage(img)
      img.src = result
    }
    reader.onerror = () => {
      toast.error('Failed to read file')
      setProcessing(false)
    }
    reader.readAsDataURL(file)
  }, [])

  const handleCopy = useCallback(async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      toast.success(`${label} copied to clipboard`)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('Failed to copy')
    }
  }, [])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ZoomIn className="h-5 w-5" /> Image to Base64
        </CardTitle>
        <CardDescription>Convert images to Base64 encoded strings</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!base64String ? (
          <DropZone onFiles={handleFiles} accept="image/png,image/jpeg,image/webp,image/bmp,image/gif" label="Drop image here or click to upload (max 5MB)" />
        ) : (
          <>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {image && <Badge variant="secondary">{image.width}×{image.height}</Badge>}
                <span className="text-sm text-muted-foreground">{fileName}</span>
              </div>
              <Button variant="ghost" size="sm" onClick={() => { setBase64String(''); setDataUri(''); setImage(null) }}>
                <RotateCcw className="h-4 w-4 mr-1" /> Reset
              </Button>
            </div>

            {image && (
              <div className="bg-muted/50 rounded-lg p-2 max-h-32 overflow-hidden flex items-center justify-center">
                <img src={dataUri} alt="Preview" className="max-h-28 max-w-full object-contain rounded" />
              </div>
            )}

            {processing ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="data-uri-toggle"
                    checked={showDataUri}
                    onCheckedChange={setShowDataUri}
                  />
                  <Label htmlFor="data-uri-toggle" className="cursor-pointer text-sm">
                    Show as Data URI (with prefix)
                  </Label>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">
                      {showDataUri ? 'Data URI' : 'Base64 String'}
                    </Label>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {(showDataUri ? dataUri : base64String).length.toLocaleString()} chars
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {formatFileSize((showDataUri ? dataUri : base64String).length)}
                      </Badge>
                    </div>
                  </div>
                  <Textarea
                    value={showDataUri ? dataUri : base64String}
                    readOnly
                    className="font-mono text-xs min-h-32 max-h-64"
                  />
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => handleCopy(showDataUri ? dataUri : base64String, showDataUri ? 'Data URI' : 'Base64')}
                  >
                    {copied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                    {copied ? 'Copied!' : 'Copy to Clipboard'}
                  </Button>
                </div>
              </>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}

// ==================== 6. Base64ToImage ====================

export function Base64ToImage() {
  const [inputString, setInputString] = useState('')
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [imageDims, setImageDims] = useState<{ w: number; h: number } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [detectedFormat, setDetectedFormat] = useState('')

  const processBase64 = useCallback((input: string) => {
    setError(null)
    if (imageUrl) URL.revokeObjectURL(imageUrl)
    setImageUrl(null)
    setImageDims(null)
    setDetectedFormat('')

    const trimmed = input.trim()
    if (!trimmed) return

    let dataUri = trimmed

    if (trimmed.startsWith('data:')) {
      setDetectedFormat(trimmed.match(/data:image\/(\w+)/)?.[1]?.toUpperCase() || 'Unknown')
    } else {
      // Try to detect format from base64 header
      if (trimmed.startsWith('iVBOR')) {
        setDetectedFormat('PNG')
        dataUri = 'data:image/png;base64,' + trimmed
      } else if (trimmed.startsWith('/9j/')) {
        setDetectedFormat('JPEG')
        dataUri = 'data:image/jpeg;base64,' + trimmed
      } else if (trimmed.startsWith('UklGR')) {
        setDetectedFormat('WebP')
        dataUri = 'data:image/webp;base64,' + trimmed
      } else if (trimmed.startsWith('Qk')) {
        setDetectedFormat('BMP')
        dataUri = 'data:image/bmp;base64,' + trimmed
      } else {
        // Try as PNG by default
        setDetectedFormat('Auto-detected')
        dataUri = 'data:image/png;base64,' + trimmed
      }
    }

    const img = new Image()
    img.onload = () => {
      setImageDims({ w: img.width, h: img.height })
      setImageUrl(dataUri)
    }
    img.onerror = () => {
      setError('Invalid Base64 image data. Please check the input.')
    }
    img.src = dataUri
  }, [imageUrl])

  useEffect(() => {
    const timer = setTimeout(() => {
      if (inputString.trim()) processBase64(inputString)
    }, 500)
    return () => clearTimeout(timer)
  }, [inputString, processBase64])

  const handleDownload = useCallback(() => {
    if (!imageUrl || !imageDims) return
    const ext = detectedFormat.toLowerCase() === 'jpeg' ? 'jpg' : detectedFormat.toLowerCase() || 'png'
    const a = document.createElement('a')
    a.href = imageUrl
    a.download = `decoded-image.${ext}`
    a.click()
  }, [imageUrl, imageDims, detectedFormat])

  const handlePaste = useCallback(async () => {
    try {
      const text = await navigator.clipboard.readText()
      setInputString(text)
    } catch {
      toast.error('Failed to read clipboard')
    }
  }, [])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ImageIcon className="h-5 w-5" /> Base64 to Image
        </CardTitle>
        <CardDescription>Convert Base64 strings back to viewable images</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Base64 String</Label>
            <Button variant="ghost" size="sm" onClick={handlePaste}>
              <Copy className="h-4 w-4 mr-1" /> Paste from clipboard
            </Button>
          </div>
          <Textarea
            value={inputString}
            onChange={e => setInputString(e.target.value)}
            placeholder="Paste your Base64 string here (with or without data URI prefix)..."
            className="font-mono text-xs min-h-32 max-h-48"
          />
        </div>

        {error && (
          <div className="bg-destructive/10 text-destructive p-3 rounded-lg text-sm">{error}</div>
        )}

        {imageUrl && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              {detectedFormat && <Badge variant="outline">{detectedFormat}</Badge>}
              {imageDims && <Badge variant="secondary">{imageDims.w}×{imageDims.h}</Badge>}
            </div>
            <div className="bg-muted/50 rounded-lg p-2 max-h-48 overflow-hidden flex items-center justify-center border">
              <img src={imageUrl} alt="Decoded" className="max-h-44 max-w-full object-contain rounded" />
            </div>
            <Button onClick={handleDownload} className="w-full">
              <Download className="h-4 w-4 mr-2" /> Download Image
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ==================== 7. GifMaker ====================

interface FrameEntry {
  id: number
  file: File
  previewUrl: string
}

export function GifMaker() {
  const [frames, setFrames] = useState<FrameEntry[]>([])
  const [frameDelay, setFrameDelay] = useState(200)
  const [processing, setProcessing] = useState(false)
  const [gifUrl, setGifUrl] = useState<string | null>(null)
  const [gifSize, setGifSize] = useState(0)
  const nextIdRef = useRef(0)

  const handleFiles = useCallback(async (files: File[]) => {
    const validFiles = files.filter(f => f.type.startsWith('image/'))
    if (validFiles.length === 0) {
      toast.error('Please select image files')
      return
    }
    if (frames.length + validFiles.length > 20) {
      toast.error('Maximum 20 frames allowed')
      return
    }

    const newFrames: FrameEntry[] = validFiles.map(f => ({
      id: nextIdRef.current++,
      file: f,
      previewUrl: URL.createObjectURL(f)
    }))

    setFrames(prev => [...prev, ...newFrames])
    if (gifUrl) { URL.revokeObjectURL(gifUrl); setGifUrl(null) }
  }, [frames.length, gifUrl])

  const removeFrame = useCallback((id: number) => {
    setFrames(prev => {
      const frame = prev.find(f => f.id === id)
      if (frame) URL.revokeObjectURL(frame.previewUrl)
      return prev.filter(f => f.id !== id)
    })
    if (gifUrl) { URL.revokeObjectURL(gifUrl); setGifUrl(null) }
  }, [gifUrl])

  const moveFrame = useCallback((id: number, direction: 'up' | 'down') => {
    setFrames(prev => {
      const idx = prev.findIndex(f => f.id === id)
      if (idx < 0) return prev
      const newIdx = direction === 'up' ? idx - 1 : idx + 1
      if (newIdx < 0 || newIdx >= prev.length) return prev
      const newFrames = [...prev]
      const temp = newFrames[idx]
      newFrames[idx] = newFrames[newIdx]
      newFrames[newIdx] = temp
      return newFrames
    })
    if (gifUrl) { URL.revokeObjectURL(gifUrl); setGifUrl(null) }
  }, [gifUrl])

  const handleCreateGif = useCallback(async () => {
    if (frames.length < 2) {
      toast.error('Please add at least 2 frames')
      return
    }

    setProcessing(true)

    try {
      // Load all images
      const images: HTMLImageElement[] = []
      for (const frame of frames) {
        const { img } = await loadImageFromFile(frame.file)
        images.push(img)
      }

      // Determine canvas size (use the first image dimensions, max 800px)
      const maxDim = 800
      let width = images[0].width
      let height = images[0].height
      if (width > maxDim || height > maxDim) {
        const scale = maxDim / Math.max(width, height)
        width = Math.round(width * scale)
        height = Math.round(height * scale)
      }
      width = Math.max(1, width)
      height = Math.max(1, height)

      // Quantize each frame
      const quantizedFrames: { indexedPixels: number[]; delay: number }[] = []
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')!

      for (const img of images) {
        ctx.clearRect(0, 0, width, height)
        ctx.drawImage(img, 0, 0, width, height)
        const imageData = ctx.getImageData(0, 0, width, height)
        const pixels = imageData.data
        const indexed: number[] = []
        for (let i = 0; i < pixels.length; i += 4) {
          indexed.push(mapPixelTo332(pixels[i], pixels[i + 1], pixels[i + 2], pixels[i + 3]))
        }
        quantizedFrames.push({ indexedPixels: indexed, delay: frameDelay })
      }

      // Encode GIF
      const gifData = encodeGif(quantizedFrames, width, height)
      const blob = new Blob([gifData], { type: 'image/gif' })

      if (gifUrl) URL.revokeObjectURL(gifUrl)
      const url = URL.createObjectURL(blob)
      setGifUrl(url)
      setGifSize(blob.size)
      toast.success(`GIF created! ${formatFileSize(blob.size)}`)
    } catch (err) {
      toast.error('Failed to create GIF: ' + (err instanceof Error ? err.message : 'Unknown error'))
    } finally {
      setProcessing(false)
    }
  }, [frames, frameDelay, gifUrl])

  const handleDownload = useCallback(() => {
    if (!gifUrl) return
    const a = document.createElement('a')
    a.href = gifUrl
    a.download = 'animation.gif'
    a.click()
  }, [gifUrl])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ZoomIn className="h-5 w-5" /> GIF Maker
        </CardTitle>
        <CardDescription>Create animated GIFs from multiple images</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <DropZone
          onFiles={handleFiles}
          accept="image/*"
          multiple
          label="Drop images here or click to add frames (2-20)"
        />

        {frames.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Frames ({frames.length}/20)</Label>
              <Button variant="ghost" size="sm" onClick={() => { frames.forEach(f => URL.revokeObjectURL(f.previewUrl)); setFrames([]); if (gifUrl) URL.revokeObjectURL(gifUrl); setGifUrl(null) }}>
                <Trash2 className="h-4 w-4 mr-1" /> Clear All
              </Button>
            </div>
            <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
              {frames.map((frame, idx) => (
                <div key={frame.id} className="flex items-center gap-3 bg-muted/50 rounded-lg p-2">
                  <span className="text-xs text-muted-foreground w-6 text-center shrink-0">{idx + 1}</span>
                  <img src={frame.previewUrl} alt={`Frame ${idx + 1}`} className="h-12 w-12 object-cover rounded border shrink-0" />
                  <span className="text-sm truncate flex-1">{frame.file.name}</span>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      disabled={idx === 0}
                      onClick={() => moveFrame(frame.id, 'up')}
                    >
                      <ArrowUp className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      disabled={idx === frames.length - 1}
                      onClick={() => moveFrame(frame.id, 'down')}
                    >
                      <ArrowDown className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive"
                      onClick={() => removeFrame(frame.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-2">
          <Label>Frame Delay: {frameDelay}ms ({(1000 / frameDelay).toFixed(1)} FPS)</Label>
          <Slider
            value={[frameDelay]}
            onValueChange={v => setFrameDelay(v[0])}
            min={50}
            max={2000}
            step={50}
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>50ms (20 FPS)</span>
            <span>2000ms (0.5 FPS)</span>
          </div>
        </div>

        <Button onClick={handleCreateGif} className="w-full" disabled={processing || frames.length < 2}>
          {processing ? (
            <><RefreshCw className="h-4 w-4 mr-2 animate-spin" /> Creating GIF...</>
          ) : (
            <><ZoomIn className="h-4 w-4 mr-2" /> Create Animated GIF ({frames.length} frames)</>
          )}
        </Button>

        {gifUrl && (
          <div className="space-y-3">
            <Label className="text-sm font-medium">Preview</Label>
            <div className="bg-muted/50 rounded-lg p-2 flex items-center justify-center border">
              <img src={gifUrl} alt="GIF Preview" className="max-h-64 max-w-full object-contain rounded" />
            </div>
            <div className="flex items-center justify-between">
              <Badge variant="secondary">{formatFileSize(gifSize)}</Badge>
              <Button onClick={handleDownload}>
                <Download className="h-4 w-4 mr-2" /> Download GIF
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ==================== 8. ImageEditor ====================

export function ImageEditor() {
  const [image, setImage] = useState<HTMLImageElement | null>(null)
  const [fileName, setFileName] = useState('')
  const [brightness, setBrightness] = useState(100)
  const [contrast, setContrast] = useState(100)
  const [saturation, setSaturation] = useState(100)
  const [blur, setBlur] = useState(0)
  const [grayscale, setGrayscale] = useState(false)
  const [sepia, setSepia] = useState(false)
  const [processing, setProcessing] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [originalFile, setOriginalFile] = useState<File | null>(null)

  const handleFiles = useCallback(async (files: File[]) => {
    const file = files[0]
    if (!file) return
    try {
      const { img } = await loadImageFromFile(file)
      setImage(img)
      setFileName(file.name)
      setOriginalFile(file)
      setBrightness(100)
      setContrast(100)
      setSaturation(100)
      setBlur(0)
      setGrayscale(false)
      setSepia(false)
    } catch {
      toast.error('Failed to load image')
    }
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !image) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = image.width
    canvas.height = image.height

    const filterParts: string[] = []
    filterParts.push(`brightness(${brightness}%)`)
    filterParts.push(`contrast(${contrast}%)`)
    filterParts.push(`saturate(${saturation}%)`)
    if (blur > 0) filterParts.push(`blur(${blur}px)`)
    if (grayscale) filterParts.push('grayscale(100%)')
    if (sepia) filterParts.push('sepia(100%)')

    ctx.filter = filterParts.join(' ')
    ctx.drawImage(image, 0, 0)
    ctx.filter = 'none'
  }, [image, brightness, contrast, saturation, blur, grayscale, sepia])

  const handleReset = useCallback(() => {
    setBrightness(100)
    setContrast(100)
    setSaturation(100)
    setBlur(0)
    setGrayscale(false)
    setSepia(false)
  }, [])

  const handleDownload = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    setProcessing(true)

    canvas.toBlob(blob => {
      if (blob) {
        downloadBlob(blob, `edited-${fileName}`)
        toast.success('Image downloaded!')
      }
      setProcessing(false)
    }, 'image/png')
  }, [fileName])

  const hasChanges = brightness !== 100 || contrast !== 100 || saturation !== 100 || blur !== 0 || grayscale || sepia

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Palette className="h-5 w-5" /> Image Editor
        </CardTitle>
        <CardDescription>Adjust brightness, contrast, saturation, and apply filters</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!image ? (
          <DropZone onFiles={handleFiles} accept="image/png,image/jpeg,image/webp,image/bmp" />
        ) : (
          <>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{image.width}×{image.height}</Badge>
                <span className="text-sm text-muted-foreground">{fileName}</span>
              </div>
              <Button variant="ghost" size="sm" onClick={() => { setImage(null); setOriginalFile(null) }}>
                <RotateCcw className="h-4 w-4 mr-1" /> Reset
              </Button>
            </div>

            <div className="bg-muted/30 rounded-lg overflow-hidden border">
              <canvas
                ref={canvasRef}
                className="w-full h-auto"
                style={{ imageRendering: 'auto' }}
              />
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Brightness</Label>
                  <span className="text-sm text-muted-foreground">{brightness}%</span>
                </div>
                <Slider value={[brightness]} onValueChange={v => setBrightness(v[0])} min={0} max={200} step={1} />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Contrast</Label>
                  <span className="text-sm text-muted-foreground">{contrast}%</span>
                </div>
                <Slider value={[contrast]} onValueChange={v => setContrast(v[0])} min={0} max={200} step={1} />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Saturation</Label>
                  <span className="text-sm text-muted-foreground">{saturation}%</span>
                </div>
                <Slider value={[saturation]} onValueChange={v => setSaturation(v[0])} min={0} max={200} step={1} />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Blur</Label>
                  <span className="text-sm text-muted-foreground">{blur}px</span>
                </div>
                <Slider value={[blur]} onValueChange={v => setBlur(v[0])} min={0} max={10} step={0.5} />
              </div>

              <div className="flex items-center gap-3">
                <Button
                  variant={grayscale ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => { setGrayscale(!grayscale); if (!grayscale) setSepia(false) }}
                >
                  Grayscale
                </Button>
                <Button
                  variant={sepia ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => { setSepia(!sepia); if (!sepia) setGrayscale(false) }}
                >
                  Sepia
                </Button>
                {hasChanges && (
                  <Button variant="ghost" size="sm" onClick={handleReset} className="ml-auto">
                    <RotateCcw className="h-4 w-4 mr-1" /> Reset Filters
                  </Button>
                )}
              </div>
            </div>

            <Button onClick={handleDownload} className="w-full" disabled={processing}>
              {processing ? (
                <><RefreshCw className="h-4 w-4 mr-2 animate-spin" /> Processing...</>
              ) : (
                <><Download className="h-4 w-4 mr-2" /> Download Edited Image</>
              )}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  )
}
