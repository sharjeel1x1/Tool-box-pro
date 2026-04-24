'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { PDFDocument, rgb, StandardFonts, degrees } from 'pdf-lib';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Progress } from '@/components/ui/progress';
import {
  Upload,
  Download,
  RotateCw,
  Hash,
  Droplets,
  Crop,
  Type,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Plus,
  Trash2,
  FileText,
  Info,
  ChevronLeft,
  ChevronRight,
  MousePointerClick,
  Eye,
  X,
} from 'lucide-react';

/* ─── shared helpers ─── */

function downloadBlob(blobOrBytes: Blob | Uint8Array, filename: string) {
  const blob = blobOrBytes instanceof Blob ? blobOrBytes : new Blob([blobOrBytes.buffer as ArrayBuffer]);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

/* ─── pdf.js dynamic loader (singleton) ─── */

let pdfjsModule: typeof import('pdfjs-dist') | null = null;

async function getPdfjs() {
  if (!pdfjsModule) {
    pdfjsModule = await import('pdfjs-dist');
    pdfjsModule.GlobalWorkerOptions.workerSrc = new URL(
      'pdfjs-dist/build/pdf.worker.min.mjs',
      import.meta.url,
    ).toString();
  }
  return pdfjsModule;
}

/* ────────────────────────────────────────────────────────────────
   1. PdfRotate
   ──────────────────────────────────────────────────────────────── */

export function PdfRotate() {
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [rotation, setRotation] = useState<90 | 180 | 270>(90);
  const [applyTo, setApplyTo] = useState<'all' | 'range'>('all');
  const [pageRange, setPageRange] = useState('');
  const [pageCount, setPageCount] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (f: File | null) => {
    if (!f) return;
    setPdfFile(f);
    setDone(false);
    setError('');
    try {
      const bytes = await readFileAsArrayBuffer(f);
      const pdfDoc = await PDFDocument.load(bytes);
      setPageCount(pdfDoc.getPageCount());
    } catch (err) {
      setError('Failed to read PDF: ' + (err as Error).message);
    }
  };

  const rotate = async () => {
    if (!pdfFile) return;
    setProcessing(true);
    setError('');
    try {
      const bytes = await readFileAsArrayBuffer(pdfFile);
      const pdfDoc = await PDFDocument.load(bytes);
      const total = pdfDoc.getPageCount();

      let pagesToRotate: number[];
      if (applyTo === 'all') {
        pagesToRotate = Array.from({ length: total }, (_, i) => i);
      } else {
        pagesToRotate = [];
        const parts = pageRange.split(',');
        for (const part of parts) {
          const trimmed = part.trim();
          if (trimmed.includes('-')) {
            const [start, end] = trimmed.split('-').map(Number);
            for (let i = start; i <= end; i++) {
              if (i >= 1 && i <= total) pagesToRotate.push(i - 1);
            }
          } else {
            const num = Number(trimmed);
            if (num >= 1 && num <= total) pagesToRotate.push(num - 1);
          }
        }
      }

      for (const idx of pagesToRotate) {
        const page = pdfDoc.getPage(idx);
        const currentRotation = page.getRotation().angle;
        page.setRotation(degrees(currentRotation + rotation));
      }

      const pdfBytes = await pdfDoc.save();
      downloadBlob(pdfBytes, 'rotated.pdf');
      setDone(true);
    } catch (err) {
      setError('Rotation failed: ' + (err as Error).message);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RotateCw className="size-5" /> Rotate PDF
        </CardTitle>
        <CardDescription>Rotate PDF pages by 90°, 180°, or 270°</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div
          onClick={() => inputRef.current?.click()}
          className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
        >
          <Upload className="mx-auto size-8 text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">Click to upload a PDF</p>
          <input
            ref={inputRef}
            type="file"
            accept=".pdf"
            className="hidden"
            onChange={e => handleFile(e.target.files?.[0] ?? null)}
          />
        </div>

        {pdfFile && <Badge variant="secondary">{pdfFile.name} — {pageCount} page{pageCount !== 1 ? 's' : ''}</Badge>}

        {error && (
          <p className="text-sm text-destructive flex items-center gap-1">
            <AlertCircle className="size-4" /> {error}
          </p>
        )}

        <div className="space-y-2">
          <Label>Rotation Angle</Label>
          <div className="flex gap-2">
            {[90, 180, 270].map(deg => (
              <Button
                key={deg}
                variant={rotation === deg ? 'default' : 'outline'}
                size="sm"
                onClick={() => { setRotation(deg as 90 | 180 | 270); setDone(false); }}
              >
                {deg}°
              </Button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label>Apply To</Label>
          <Select value={applyTo} onValueChange={v => { setApplyTo(v as 'all' | 'range'); setDone(false); }}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Pages</SelectItem>
              <SelectItem value="range">Specific Pages</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {applyTo === 'range' && (
          <div className="space-y-2">
            <Label>Page Range (e.g. 1,3,5-8)</Label>
            <Input
              value={pageRange}
              onChange={e => { setPageRange(e.target.value); setDone(false); }}
              placeholder="1,3,5-8"
            />
          </div>
        )}

        <Button onClick={rotate} disabled={!pdfFile || processing} className="w-full">
          {processing ? <Loader2 className="size-4 animate-spin mr-2" /> : <Download className="size-4 mr-2" />}
          {processing ? 'Rotating…' : 'Rotate & Download'}
        </Button>
        {done && (
          <p className="text-sm text-green-600 flex items-center gap-1">
            <CheckCircle2 className="size-4" /> Rotated PDF downloaded!
          </p>
        )}
      </CardContent>
    </Card>
  );
}

/* ────────────────────────────────────────────────────────────────
   2. PdfPageNumbers
   ──────────────────────────────────────────────────────────────── */

export function PdfPageNumbers() {
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [position, setPosition] = useState<'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right'>('bottom-center');
  const [startNumber, setStartNumber] = useState(1);
  const [fontSize, setFontSize] = useState(12);
  const [prefix, setPrefix] = useState('');
  const [suffix, setSuffix] = useState('');
  const [processing, setProcessing] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (f: File | null) => {
    if (!f) return;
    setPdfFile(f);
    setDone(false);
    setError('');
    try {
      const bytes = await readFileAsArrayBuffer(f);
      const pdfDoc = await PDFDocument.load(bytes);
      setPageCount(pdfDoc.getPageCount());
    } catch (err) {
      setError('Failed to read PDF: ' + (err as Error).message);
    }
  };

  const addPageNumbers = async () => {
    if (!pdfFile) return;
    setProcessing(true);
    setError('');
    try {
      const bytes = await readFileAsArrayBuffer(pdfFile);
      const pdfDoc = await PDFDocument.load(bytes);
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const total = pdfDoc.getPageCount();

      for (let i = 0; i < total; i++) {
        const page = pdfDoc.getPage(i);
        const { width, height } = page.getSize();
        const num = startNumber + i;
        const text = `${prefix}${num}${suffix}`;
        const textWidth = font.widthOfTextAtSize(text, fontSize);

        let x: number, y: number;
        const margin = 30;

        const isTop = position.startsWith('top');
        const isBottom = position.startsWith('bottom');
        const isLeft = position.endsWith('left');
        const isCenter = position.endsWith('center');
        const isRight = position.endsWith('right');

        y = isTop ? height - margin : margin;

        if (isLeft) x = margin;
        else if (isCenter) x = (width - textWidth) / 2;
        else x = width - textWidth - margin;

        page.drawText(text, {
          x,
          y,
          size: fontSize,
          font,
          color: rgb(0.3, 0.3, 0.3),
        });
      }

      const pdfBytes = await pdfDoc.save();
      downloadBlob(pdfBytes, 'numbered.pdf');
      setDone(true);
    } catch (err) {
      setError('Failed to add page numbers: ' + (err as Error).message);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Hash className="size-5" /> Add Page Numbers
        </CardTitle>
        <CardDescription>Add page numbers to every page of your PDF</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div
          onClick={() => inputRef.current?.click()}
          className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
        >
          <Upload className="mx-auto size-8 text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">Click to upload a PDF</p>
          <input
            ref={inputRef}
            type="file"
            accept=".pdf"
            className="hidden"
            onChange={e => handleFile(e.target.files?.[0] ?? null)}
          />
        </div>

        {pdfFile && <Badge variant="secondary">{pdfFile.name} — {pageCount} page{pageCount !== 1 ? 's' : ''}</Badge>}

        {error && (
          <p className="text-sm text-destructive flex items-center gap-1">
            <AlertCircle className="size-4" /> {error}
          </p>
        )}

        <div className="space-y-2">
          <Label>Position</Label>
          <div className="grid grid-cols-3 gap-2">
            {(['top-left', 'top-center', 'top-right', 'bottom-left', 'bottom-center', 'bottom-right'] as const).map(pos => (
              <Button
                key={pos}
                variant={position === pos ? 'default' : 'outline'}
                size="sm"
                className="text-xs"
                onClick={() => { setPosition(pos); setDone(false); }}
              >
                {pos.replace('-', ' ')}
              </Button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Start Number</Label>
            <Input
              type="number"
              min={0}
              value={startNumber}
              onChange={e => { setStartNumber(Number(e.target.value)); setDone(false); }}
            />
          </div>
          <div className="space-y-2">
            <Label>Font Size</Label>
            <div className="flex items-center gap-3">
              <Slider
                value={[fontSize]}
                onValueChange={v => { setFontSize(v[0]); setDone(false); }}
                min={8}
                max={24}
                step={1}
                className="flex-1"
              />
              <span className="text-sm w-8 text-right">{fontSize}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Prefix</Label>
            <Input
              value={prefix}
              onChange={e => { setPrefix(e.target.value); setDone(false); }}
              placeholder="e.g. Page "
            />
          </div>
          <div className="space-y-2">
            <Label>Suffix</Label>
            <Input
              value={suffix}
              onChange={e => { setSuffix(e.target.value); setDone(false); }}
              placeholder="e.g.  / {total}"
            />
          </div>
        </div>

        {pdfFile && (
          <div className="text-sm text-muted-foreground">
            Preview: &quot;{prefix}{startNumber}{suffix}&quot; … &quot;{prefix}{startNumber + pageCount - 1}{suffix}&quot;
          </div>
        )}

        <Button onClick={addPageNumbers} disabled={!pdfFile || processing} className="w-full">
          {processing ? <Loader2 className="size-4 animate-spin mr-2" /> : <Download className="size-4 mr-2" />}
          {processing ? 'Adding Numbers…' : 'Add Page Numbers & Download'}
        </Button>
        {done && (
          <p className="text-sm text-green-600 flex items-center gap-1">
            <CheckCircle2 className="size-4" /> Numbered PDF downloaded!
          </p>
        )}
      </CardContent>
    </Card>
  );
}

/* ────────────────────────────────────────────────────────────────
   3. PdfWatermark
   ──────────────────────────────────────────────────────────────── */

export function PdfWatermark() {
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [watermarkText, setWatermarkText] = useState('CONFIDENTIAL');
  const [wmFontSize, setWmFontSize] = useState(48);
  const [opacity, setOpacity] = useState(0.2);
  const [wmRotation, setWmRotation] = useState(-45);
  const [wmColor, setWmColor] = useState<'gray' | 'red' | 'blue' | 'green'>('gray');
  const [processing, setProcessing] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (f: File | null) => {
    if (!f) return;
    setPdfFile(f);
    setDone(false);
    setError('');
    try {
      const bytes = await readFileAsArrayBuffer(f);
      const pdfDoc = await PDFDocument.load(bytes);
      setPageCount(pdfDoc.getPageCount());
    } catch (err) {
      setError('Failed to read PDF: ' + (err as Error).message);
    }
  };

  const addWatermark = async () => {
    if (!pdfFile || !watermarkText.trim()) return;
    setProcessing(true);
    setError('');
    try {
      const bytes = await readFileAsArrayBuffer(pdfFile);
      const pdfDoc = await PDFDocument.load(bytes);
      const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

      const colorMap = {
        gray: rgb(0.5, 0.5, 0.5),
        red: rgb(0.8, 0.2, 0.2),
        blue: rgb(0.2, 0.3, 0.7),
        green: rgb(0.2, 0.6, 0.3),
      };

      const total = pdfDoc.getPageCount();
      for (let i = 0; i < total; i++) {
        const page = pdfDoc.getPage(i);
        const { width, height } = page.getSize();

        const textWidth = font.widthOfTextAtSize(watermarkText, wmFontSize);
        const textHeight = wmFontSize;

        const x = (width - textWidth * Math.cos(Math.abs(wmRotation) * Math.PI / 180)) / 2;
        const y = (height + textHeight * Math.cos(Math.abs(wmRotation) * Math.PI / 180)) / 2;

        page.drawText(watermarkText, {
          x,
          y,
          size: wmFontSize,
          font,
          color: colorMap[wmColor],
          opacity,
          rotate: degrees(wmRotation),
        });
      }

      const pdfBytes = await pdfDoc.save();
      downloadBlob(pdfBytes, 'watermarked.pdf');
      setDone(true);
    } catch (err) {
      setError('Failed to add watermark: ' + (err as Error).message);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Droplets className="size-5" /> Add Watermark
        </CardTitle>
        <CardDescription>Add a diagonal text watermark to all pages</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div
          onClick={() => inputRef.current?.click()}
          className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
        >
          <Upload className="mx-auto size-8 text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">Click to upload a PDF</p>
          <input
            ref={inputRef}
            type="file"
            accept=".pdf"
            className="hidden"
            onChange={e => handleFile(e.target.files?.[0] ?? null)}
          />
        </div>

        {pdfFile && <Badge variant="secondary">{pdfFile.name} — {pageCount} page{pageCount !== 1 ? 's' : ''}</Badge>}

        {error && (
          <p className="text-sm text-destructive flex items-center gap-1">
            <AlertCircle className="size-4" /> {error}
          </p>
        )}

        <div className="space-y-2">
          <Label>Watermark Text</Label>
          <Input
            value={watermarkText}
            onChange={e => { setWatermarkText(e.target.value); setDone(false); }}
            placeholder="e.g. CONFIDENTIAL"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Font Size</Label>
            <div className="flex items-center gap-3">
              <Slider
                value={[wmFontSize]}
                onValueChange={v => { setWmFontSize(v[0]); setDone(false); }}
                min={20}
                max={120}
                step={2}
                className="flex-1"
              />
              <span className="text-sm w-8 text-right">{wmFontSize}</span>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Opacity</Label>
            <div className="flex items-center gap-3">
              <Slider
                value={[opacity * 100]}
                onValueChange={v => { setOpacity(v[0] / 100); setDone(false); }}
                min={10}
                max={50}
                step={5}
                className="flex-1"
              />
              <span className="text-sm w-10 text-right">{(opacity * 100).toFixed(0)}%</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Rotation</Label>
            <div className="flex gap-2">
              {[-45, -30, 0, 30, 45].map(deg => (
                <Button
                  key={deg}
                  variant={wmRotation === deg ? 'default' : 'outline'}
                  size="sm"
                  className="text-xs"
                  onClick={() => { setWmRotation(deg); setDone(false); }}
                >
                  {deg}°
                </Button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label>Color</Label>
            <div className="flex gap-2">
              {(['gray', 'red', 'blue', 'green'] as const).map(c => (
                <Button
                  key={c}
                  variant={wmColor === c ? 'default' : 'outline'}
                  size="sm"
                  className="text-xs capitalize"
                  onClick={() => { setWmColor(c); setDone(false); }}
                >
                  {c}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Watermark preview */}
        <div className="space-y-2">
          <Label>Preview</Label>
          <div className="relative border rounded-lg h-40 flex items-center justify-center bg-muted/30 overflow-hidden">
            <span
              className="text-2xl font-bold select-none"
              style={{
                color: wmColor === 'gray' ? '#888' : wmColor === 'red' ? '#c33' : wmColor === 'blue' ? '#336' : '#363',
                opacity,
                transform: `rotate(${wmRotation}deg)`,
              }}
            >
              {watermarkText || 'WATERMARK'}
            </span>
          </div>
        </div>

        <Button onClick={addWatermark} disabled={!pdfFile || !watermarkText.trim() || processing} className="w-full">
          {processing ? <Loader2 className="size-4 animate-spin mr-2" /> : <Download className="size-4 mr-2" />}
          {processing ? 'Adding Watermark…' : 'Add Watermark & Download'}
        </Button>
        {done && (
          <p className="text-sm text-green-600 flex items-center gap-1">
            <CheckCircle2 className="size-4" /> Watermarked PDF downloaded!
          </p>
        )}
      </CardContent>
    </Card>
  );
}

/* ────────────────────────────────────────────────────────────────
   4. PdfCrop — TRUE cropping via canvas rasterization
   ──────────────────────────────────────────────────────────────── */

export function PdfCrop() {
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [pageInfo, setPageInfo] = useState<{ width: number; height: number } | null>(null);
  const [unit, setUnit] = useState<'mm' | 'in'>('mm');
  const [margins, setMargins] = useState({ top: 0, bottom: 0, left: 0, right: 0 });
  const [previewUrl, setPreviewUrl] = useState('');
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);
  const [originalSize, setOriginalSize] = useState(0);
  const [croppedSize, setCroppedSize] = useState(0);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  /* unit conversion helpers */
  const toPt = useCallback(
    (val: number) => (unit === 'mm' ? val * 2.835 : val * 72),
    [unit],
  );
  const ptToDisplay = useCallback(
    (pt: number) => (unit === 'mm' ? (pt / 2.835).toFixed(1) : (pt / 72).toFixed(2)),
    [unit],
  );

  /* render first page preview */
  const renderPreview = useCallback(async (file: File) => {
    setLoadingPreview(true);
    try {
      const bytes = await readFileAsArrayBuffer(file);
      const pdfjsLib = await getPdfjs();
      const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(bytes) }).promise;
      const page = await pdf.getPage(1);
      const scale = 600 / page.getViewport({ scale: 1 }).width; // fit 600px wide
      const viewport = page.getViewport({ scale });
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      await page.render({ canvasContext: ctx, viewport }).promise;
      setPreviewUrl(canvas.toDataURL('image/png'));
    } catch (err) {
      setError('Failed to render preview: ' + (err as Error).message);
    } finally {
      setLoadingPreview(false);
    }
  }, []);

  const handleFile = async (f: File | null) => {
    if (!f) return;
    setPdfFile(f);
    setDone(false);
    setError('');
    setMargins({ top: 0, bottom: 0, left: 0, right: 0 });
    setCroppedSize(0);
    try {
      const bytes = await readFileAsArrayBuffer(f);
      const pdfDoc = await PDFDocument.load(bytes);
      const total = pdfDoc.getPageCount();
      setPageCount(total);
      const page = pdfDoc.getPage(0);
      const { width, height } = page.getSize();
      setPageInfo({
        width: Math.round(width * 100) / 100,
        height: Math.round(height * 100) / 100,
      });
      setOriginalSize(f.size);
      renderPreview(f);
    } catch (err) {
      setError('Failed to read PDF: ' + (err as Error).message);
    }
  };

  const updateMargin = (side: keyof typeof margins, value: string) => {
    const num = Math.max(0, Number(value) || 0);
    setMargins(prev => ({ ...prev, [side]: num }));
    setDone(false);
  };

  /* true crop: render each page to canvas, cut out margins, rebuild PDF */
  const crop = async () => {
    if (!pdfFile || !pageInfo) return;
    setProcessing(true);
    setProgress(0);
    setError('');
    try {
      const bytes = await readFileAsArrayBuffer(pdfFile);
      const pdfjsLib = await getPdfjs();
      const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(bytes) }).promise;
      const total = pdf.numPages;

      const topPt = toPt(margins.top);
      const bottomPt = toPt(margins.bottom);
      const leftPt = toPt(margins.left);
      const rightPt = toPt(margins.right);

      /* Validate margins don't exceed page */
      if (topPt + bottomPt >= pageInfo.height || leftPt + rightPt >= pageInfo.width) {
        throw new Error('Margins are too large — they would leave no visible area.');
      }

      const newPdfDoc = await PDFDocument.create();
      const RENDER_SCALE = 2; // high quality

      for (let i = 1; i <= total; i++) {
        setProgress(Math.round(((i - 1) / total) * 100));

        const page = await pdf.getPage(i);
        const origViewport = page.getViewport({ scale: 1 });
        const pageW = origViewport.width;
        const pageH = origViewport.height;

        /* Clamp margins to this page */
        const t = Math.min(topPt, pageH / 2);
        const b = Math.min(bottomPt, pageH / 2);
        const l = Math.min(leftPt, pageW / 2);
        const r = Math.min(rightPt, pageW / 2);

        /* Render full page at high scale */
        const scale = RENDER_SCALE;
        const fullViewport = page.getViewport({ scale });
        const fullCanvas = document.createElement('canvas');
        const fullCtx = fullCanvas.getContext('2d')!;
        fullCanvas.width = fullViewport.width;
        fullCanvas.height = fullViewport.height;
        await page.render({ canvasContext: fullCtx, viewport: fullViewport }).promise;

        /* Calculate crop region in canvas pixels */
        const sx = l * scale;
        const sy = b * scale; // bottom in PDF = bottom of canvas (y flipped)
        const sw = (pageW - l - r) * scale;
        const sh = (pageH - t - b) * scale;

        /* Create cropped canvas (note: canvas y=0 is top, PDF y=0 is bottom) */
        const cropCanvas = document.createElement('canvas');
        cropCanvas.width = Math.max(1, Math.round(sw));
        cropCanvas.height = Math.max(1, Math.round(sh));
        const cropCtx = cropCanvas.getContext('2d')!;
        /* Canvas Y: top of PDF page is at the top of the canvas image,
           so we draw from canvas (t * scale) down */
        const dy = t * scale;
        cropCtx.drawImage(
          fullCanvas,
          Math.round(sx), Math.round(dy), Math.round(sw), Math.round(sh),
          0, 0, Math.round(sw), Math.round(sh),
        );

        /* Embed cropped image into new PDF */
        const jpgDataUrl = cropCanvas.toDataURL('image/jpeg', 0.92);
        const jpgImage = await newPdfDoc.embedJpg(jpgDataUrl);
        const newPageW = pageW - l - r;
        const newPageH = pageH - t - b;
        const newPage = newPdfDoc.addPage([newPageW, newPageH]);
        newPage.drawImage(jpgImage, {
          x: 0,
          y: 0,
          width: newPageW,
          height: newPageH,
        });
      }

      setProgress(100);
      const pdfBytes = await newPdfDoc.save();
      setCroppedSize(pdfBytes.byteLength);
      downloadBlob(pdfBytes, 'cropped.pdf');
      setDone(true);
    } catch (err) {
      setError('Cropping failed: ' + (err as Error).message);
    } finally {
      setProcessing(false);
    }
  };

  /* percentage overlays for the preview */
  const topPct = pageInfo ? Math.min(100, (toPt(margins.top) / pageInfo.height) * 100) : 0;
  const bottomPct = pageInfo ? Math.min(100, (toPt(margins.bottom) / pageInfo.height) * 100) : 0;
  const leftPct = pageInfo ? Math.min(100, (toPt(margins.left) / pageInfo.width) * 100) : 0;
  const rightPct = pageInfo ? Math.min(100, (toPt(margins.right) / pageInfo.width) * 100) : 0;

  function formatBytes(bytes: number) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Crop className="size-5" /> Crop PDF
        </CardTitle>
        <CardDescription>True crop — removes margins and reduces file size by re-rendering pages</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Upload */}
        <div
          onClick={() => inputRef.current?.click()}
          className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
        >
          <Upload className="mx-auto size-8 text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">Click to upload a PDF</p>
          <input
            ref={inputRef}
            type="file"
            accept=".pdf"
            className="hidden"
            onChange={e => handleFile(e.target.files?.[0] ?? null)}
          />
        </div>

        {pdfFile && (
          <Badge variant="secondary">
            {pdfFile.name} — {pageCount} page{pageCount !== 1 ? 's' : ''} — {formatBytes(originalSize)}
          </Badge>
        )}

        {error && (
          <p className="text-sm text-destructive flex items-center gap-1">
            <AlertCircle className="size-4" /> {error}
          </p>
        )}

        {pageInfo && (
          <div className="bg-muted/50 border rounded-lg p-3 text-sm space-y-1">
            <p>
              <strong>Page size:</strong> {pageInfo.width.toFixed(0)} × {pageInfo.height.toFixed(0)} pt
              ({ptToDisplay(pageInfo.width)} × {ptToDisplay(pageInfo.height)} {unit})
            </p>
            <p className="text-muted-foreground">Content outside the crop area is permanently removed.</p>
          </div>
        )}

        {/* Unit toggle */}
        <div className="flex items-center justify-between">
          <Label>Unit</Label>
          <div className="flex gap-2">
            <Button variant={unit === 'mm' ? 'default' : 'outline'} size="sm" onClick={() => setUnit('mm')}>
              Millimeters
            </Button>
            <Button variant={unit === 'in' ? 'default' : 'outline'} size="sm" onClick={() => setUnit('in')}>
              Inches
            </Button>
          </div>
        </div>

        {/* Margin inputs */}
        <div className="grid grid-cols-2 gap-4">
          {(['top', 'bottom', 'left', 'right'] as const).map(side => (
            <div key={side} className="space-y-2">
              <Label className="capitalize">{side} margin ({unit})</Label>
              <Input
                type="number"
                min={0}
                step={unit === 'mm' ? 1 : 0.1}
                value={margins[side]}
                onChange={e => updateMargin(side, e.target.value)}
                placeholder="0"
              />
            </div>
          ))}
        </div>

        {/* Resulting size */}
        {pageInfo && (margins.top + margins.bottom + margins.left + margins.right > 0) && (
          <div className="text-sm text-muted-foreground">
            Resulting size: {ptToDisplay(pageInfo.width - toPt(margins.left) - toPt(margins.right))} ×{' '}
            {ptToDisplay(pageInfo.height - toPt(margins.top) - toPt(margins.bottom))} {unit}
          </div>
        )}

        {/* Preview */}
        {loadingPreview && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" /> Rendering preview…
          </div>
        )}

        {previewUrl && (
          <div className="space-y-2">
            <Label className="flex items-center gap-1">
              <Eye className="size-4" /> Preview
            </Label>
            <div className="relative border rounded-lg overflow-hidden bg-muted/30">
              <img src={previewUrl} alt="Page preview" className="w-full block" />
              {/* Darkened margin overlays */}
              {topPct > 0 && (
                <div
                  className="absolute top-0 left-0 right-0 bg-black/40 pointer-events-none"
                  style={{ height: `${topPct}%` }}
                />
              )}
              {bottomPct > 0 && (
                <div
                  className="absolute bottom-0 left-0 right-0 bg-black/40 pointer-events-none"
                  style={{ height: `${bottomPct}%` }}
                />
              )}
              {leftPct > 0 && (
                <div
                  className="absolute left-0 pointer-events-none bg-black/40"
                  style={{ top: `${topPct}%`, bottom: `${bottomPct}%`, width: `${leftPct}%` }}
                />
              )}
              {rightPct > 0 && (
                <div
                  className="absolute right-0 pointer-events-none bg-black/40"
                  style={{ top: `${topPct}%`, bottom: `${bottomPct}%`, width: `${rightPct}%` }}
                />
              )}
              {/* Crop area border */}
              <div
                className="absolute border-2 border-dashed border-red-500 pointer-events-none"
                style={{
                  top: `${topPct}%`,
                  bottom: `${bottomPct}%`,
                  left: `${leftPct}%`,
                  right: `${rightPct}%`,
                }}
              />
            </div>
            <p className="text-xs text-muted-foreground text-center">
              Darkened areas will be removed. Red border shows the remaining content.
            </p>
          </div>
        )}

        {/* Progress */}
        {processing && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Cropping page {Math.round(progress / 100 * pageCount)} of {pageCount}…</span>
              <span>{progress}%</span>
            </div>
            <Progress value={progress} />
          </div>
        )}

        {/* Crop button */}
        <Button onClick={crop} disabled={!pdfFile || processing || (margins.top + margins.bottom + margins.left + margins.right === 0)} className="w-full">
          {processing ? <Loader2 className="size-4 animate-spin mr-2" /> : <Download className="size-4 mr-2" />}
          {processing ? 'Cropping…' : 'Crop & Download'}
        </Button>

        {done && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm space-y-1">
            <p className="text-green-700 flex items-center gap-1 font-medium">
              <CheckCircle2 className="size-4" /> Cropped PDF downloaded!
            </p>
            <p className="text-green-600">
              {formatBytes(originalSize)} → {formatBytes(croppedSize)}{' '}
              (saved {Math.round((1 - croppedSize / originalSize) * 100)}%)
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* ────────────────────────────────────────────────────────────────
   5. PdfEditText — Visual text overlay editing
   ──────────────────────────────────────────────────────────────── */

interface TextAnnotation {
  id: string;
  page: number;
  text: string;
  x: number; // PDF points from left
  y: number; // PDF points from bottom
  fontSize: number;
  color: string;
  bold: boolean;
  italic: boolean;
}

export function PdfEditText() {
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageDims, setPageDims] = useState({ width: 0, height: 0 }); // PDF points
  const [previewUrl, setPreviewUrl] = useState('');
  const [annotations, setAnnotations] = useState<TextAnnotation[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [newText, setNewText] = useState('');
  const [fontSize, setFontSize] = useState(16);
  const [color, setColor] = useState('#000000');
  const [bold, setBold] = useState(false);
  const [italic, setItalic] = useState(false);
  const [placementPos, setPlacementPos] = useState<{ x: number; y: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const pdfBytesRef = useRef<ArrayBuffer | null>(null);

  /* render a single page as preview */
  const renderPagePreview = useCallback(async (bytes: ArrayBuffer, pageNum: number) => {
    setLoading(true);
    try {
      const pdfjsLib = await getPdfjs();
      const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(bytes) }).promise;
      const page = await pdf.getPage(pageNum);
      const viewport = page.getViewport({ scale: 1 });
      setPageDims({ width: viewport.width, height: viewport.height });

      /* Render at scale to fit ~500px width */
      const scale = Math.min(2, 500 / viewport.width);
      const scaledViewport = page.getViewport({ scale });
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      canvas.width = scaledViewport.width;
      canvas.height = scaledViewport.height;
      await page.render({ canvasContext: ctx, viewport: scaledViewport }).promise;
      setPreviewUrl(canvas.toDataURL('image/png'));
    } catch (err) {
      setError('Failed to render page: ' + (err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleFile = async (f: File | null) => {
    if (!f) return;
    setPdfFile(f);
    setDone(false);
    setError('');
    setAnnotations([]);
    setSelectedId(null);
    setPlacementPos(null);
    setNewText('');
    setLoading(true);
    try {
      const bytes = await readFileAsArrayBuffer(f);
      pdfBytesRef.current = bytes;
      const pdfDoc = await PDFDocument.load(bytes);
      const total = pdfDoc.getPageCount();
      setPageCount(total);
      setCurrentPage(1);
      await renderPagePreview(bytes, 1);
    } catch (err) {
      setError('Failed to read PDF: ' + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  /* change page */
  useEffect(() => {
    if (pdfBytesRef.current && currentPage > 0) {
      setSelectedId(null);
      setPlacementPos(null);
      renderPagePreview(pdfBytesRef.current, currentPage);
    }
  }, [currentPage, renderPagePreview]);

  /* click on preview to set placement */
  const handlePreviewClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!previewRef.current) return;
      const container = previewRef.current;
      const rect = container.getBoundingClientRect();
      const img = container.querySelector('img');
      if (!img) return;
      const imgRect = img.getBoundingClientRect();

      const relX = e.clientX - imgRect.left;
      const relY = e.clientY - imgRect.top;

      /* Convert display pixels to PDF points */
      const pdfX = (relX / imgRect.width) * pageDims.width;
      const pdfY = pageDims.height - (relY / imgRect.height) * pageDims.height;

      setPlacementPos({
        x: Math.round(pdfX * 10) / 10,
        y: Math.round(pdfY * 10) / 10,
      });
    },
    [pageDims],
  );

  /* add annotation */
  const addAnnotation = () => {
    if (!newText.trim()) return;
    const pos = placementPos || { x: pageDims.width / 2, y: pageDims.height / 2 };
    const ann: TextAnnotation = {
      id: Date.now().toString(),
      page: currentPage,
      text: newText.trim(),
      x: pos.x,
      y: pos.y,
      fontSize,
      color,
      bold,
      italic,
    };
    setAnnotations(prev => [...prev, ann]);
    setNewText('');
    setPlacementPos(null);
    setDone(false);
  };

  const removeAnnotation = (id: string) => {
    setAnnotations(prev => prev.filter(a => a.id !== id));
    if (selectedId === id) setSelectedId(null);
    setDone(false);
  };

  const updateAnnotation = (id: string, updates: Partial<TextAnnotation>) => {
    setAnnotations(prev => prev.map(a => (a.id === id ? { ...a, ...updates } : a)));
    setDone(false);
  };

  /* flatten annotations into PDF */
  const flattenAndDownload = async () => {
    if (!pdfBytesRef.current || annotations.length === 0) return;
    setProcessing(true);
    setProgress(0);
    setError('');
    try {
      const srcBytes = pdfBytesRef.current;
      const pdfjsLib = await getPdfjs();
      const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(srcBytes) }).promise;
      const total = pdf.numPages;

      /* Group annotations by page */
      const annByPage = new Map<number, TextAnnotation[]>();
      for (const ann of annotations) {
        const list = annByPage.get(ann.page) || [];
        list.push(ann);
        annByPage.set(ann.page, list);
      }

      /* Load source PDF with pdf-lib for copying pages */
      const srcDoc = await PDFDocument.load(srcBytes);
      const newDoc = await PDFDocument.create();

      const RENDER_SCALE = 2;

      for (let i = 1; i <= total; i++) {
        setProgress(Math.round(((i - 1) / total) * 100));
        const pageAnns = annByPage.get(i) || [];

        if (pageAnns.length === 0) {
          /* Copy original page */
          const [copied] = await newDoc.copyPages(srcDoc, [i - 1]);
          newDoc.addPage(copied);
        } else {
          /* Render page + annotations as image */
          const page = await pdf.getPage(i);
          const viewport = page.getViewport({ scale: RENDER_SCALE });
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d')!;
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          await page.render({ canvasContext: ctx, viewport }).promise;

          /* Draw annotations */
          const origViewport = page.getViewport({ scale: 1 });
          for (const ann of pageAnns) {
            const x = ann.x * RENDER_SCALE;
            /* PDF y=0 is bottom, canvas y=0 is top */
            const y = (origViewport.height - ann.y) * RENDER_SCALE;
            const fontStyle = `${ann.italic ? 'italic' : ''} ${ann.bold ? 'bold' : ''}`.trim();
            ctx.font = `${fontStyle} ${ann.fontSize * RENDER_SCALE}px sans-serif`;
            ctx.fillStyle = ann.color;
            ctx.textBaseline = 'alphabetic';
            ctx.fillText(ann.text, x, y);
          }

          /* Embed as image */
          const jpgDataUrl = canvas.toDataURL('image/jpeg', 0.92);
          const jpgImage = await newDoc.embedJpg(jpgDataUrl);
          const newPage = newDoc.addPage([origViewport.width, origViewport.height]);
          newPage.drawImage(jpgImage, {
            x: 0,
            y: 0,
            width: origViewport.width,
            height: origViewport.height,
          });
        }
      }

      setProgress(100);
      const pdfBytes = await newDoc.save();
      downloadBlob(pdfBytes, 'edited.pdf');
      setDone(true);
    } catch (err) {
      setError('Failed to flatten: ' + (err as Error).message);
    } finally {
      setProcessing(false);
    }
  };

  const pageAnnotations = annotations.filter(a => a.page === currentPage);
  const totalAnnotations = annotations.length;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Type className="size-5" /> Edit PDF Text
        </CardTitle>
        <CardDescription>Add text overlays, position them visually, then flatten into the PDF</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Upload */}
        <div
          onClick={() => inputRef.current?.click()}
          className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
        >
          <Upload className="mx-auto size-8 text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">Click to upload a PDF</p>
          <input
            ref={inputRef}
            type="file"
            accept=".pdf"
            className="hidden"
            onChange={e => handleFile(e.target.files?.[0] ?? null)}
          />
        </div>

        {pdfFile && (
          <Badge variant="secondary">
            {pdfFile.name} — {pageCount} page{pageCount !== 1 ? 's' : ''}
            {totalAnnotations > 0 && ` — ${totalAnnotations} annotation${totalAnnotations !== 1 ? 's' : ''}`}
          </Badge>
        )}

        {error && (
          <p className="text-sm text-destructive flex items-center gap-1">
            <AlertCircle className="size-4" /> {error}
          </p>
        )}

        {loading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" /> Rendering page…
          </div>
        )}

        {/* Info banner */}
        {pdfFile && (
          <div className="bg-muted/50 border rounded-lg p-3 text-sm text-muted-foreground flex items-start gap-2">
            <MousePointerClick className="size-4 mt-0.5 shrink-0" />
            <span>
              Click on the page preview to set text position. Pages without annotations are kept at original quality.
              Pages with annotations are flattened to images.
            </span>
          </div>
        )}

        {/* Page preview */}
        {previewUrl && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-1">
                <Eye className="size-4" /> Page Preview
              </Label>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  className="size-7"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage(p => p - 1)}
                >
                  <ChevronLeft className="size-4" />
                </Button>
                <span className="text-sm px-2 min-w-[60px] text-center">
                  {currentPage} / {pageCount}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  className="size-7"
                  disabled={currentPage >= pageCount}
                  onClick={() => setCurrentPage(p => p + 1)}
                >
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            </div>

            <div
              ref={previewRef}
              className="relative border rounded-lg overflow-hidden bg-muted/30 cursor-crosshair select-none"
              onClick={handlePreviewClick}
            >
              <img src={previewUrl} alt={`Page ${currentPage}`} className="w-full block" draggable={false} />

              {/* Annotation overlays */}
              {pageAnnotations.map(ann => {
                const leftPct = (ann.x / pageDims.width) * 100;
                const topPct = ((pageDims.height - ann.y) / pageDims.height) * 100;
                const isSelected = selectedId === ann.id;
                return (
                  <div
                    key={ann.id}
                    className={`absolute whitespace-nowrap cursor-pointer transition-shadow ${
                      isSelected ? 'ring-2 ring-primary ring-offset-1 bg-primary/10 rounded' : 'hover:ring-1 hover:ring-primary/50 rounded'
                    }`}
                    style={{
                      left: `${leftPct}%`,
                      top: `${topPct}%`,
                      transform: 'translateY(-100%)',
                      fontSize: `${Math.max(8, ann.fontSize * 0.7)}px`,
                      color: ann.color,
                      fontWeight: ann.bold ? 'bold' : 'normal',
                      fontStyle: ann.italic ? 'italic' : 'normal',
                      padding: '1px 3px',
                    }}
                    onClick={e => {
                      e.stopPropagation();
                      setSelectedId(ann.id);
                    }}
                  >
                    {ann.text}
                  </div>
                );
              })}

              {/* Placement crosshair */}
              {placementPos && (
                <div
                  className="absolute w-3 h-3 border-2 border-primary rounded-full bg-primary/30 pointer-events-none"
                  style={{
                    left: `${(placementPos.x / pageDims.width) * 100}%`,
                    top: `${((pageDims.height - placementPos.y) / pageDims.height) * 100}%`,
                    transform: 'translate(-50%, -50%)',
                  }}
                />
              )}
            </div>

            {placementPos && (
              <p className="text-xs text-muted-foreground">
                Placement: ({placementPos.x.toFixed(0)}, {placementPos.y.toFixed(0)}) pt —{' '}
                <button
                  className="text-destructive underline"
                  onClick={() => setPlacementPos(null)}
                >
                  clear
                </button>
              </p>
            )}
          </div>
        )}

        {/* Text input form */}
        {pdfFile && !loading && (
          <div className="border rounded-lg p-4 space-y-3">
            <Label className="text-base font-semibold flex items-center gap-1">
              <Plus className="size-4" /> Add Text Overlay
            </Label>

            <div className="space-y-2">
              <Label>Text</Label>
              <Input
                value={newText}
                onChange={e => setNewText(e.target.value)}
                placeholder="Type your text, then click the preview or press Add"
                onKeyDown={e => {
                  if (e.key === 'Enter' && newText.trim()) addAnnotation();
                }}
              />
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="space-y-2">
                <Label>Font Size</Label>
                <Input
                  type="number"
                  min={6}
                  max={72}
                  value={fontSize}
                  onChange={e => setFontSize(Math.max(6, Math.min(72, Number(e.target.value))))}
                />
              </div>
              <div className="space-y-2">
                <Label>Color</Label>
                <div className="flex gap-1 items-center">
                  <input
                    type="color"
                    value={color}
                    onChange={e => setColor(e.target.value)}
                    className="size-9 rounded border cursor-pointer"
                  />
                  <span className="text-xs text-muted-foreground font-mono">{color}</span>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Style</Label>
                <div className="flex gap-1">
                  <Button
                    variant={bold ? 'default' : 'outline'}
                    size="sm"
                    className="text-xs font-bold flex-1"
                    onClick={() => setBold(v => !v)}
                  >
                    B
                  </Button>
                  <Button
                    variant={italic ? 'default' : 'outline'}
                    size="sm"
                    className="text-xs italic flex-1"
                    onClick={() => setItalic(v => !v)}
                  >
                    I
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label>&nbsp;</Label>
                <Button
                  onClick={addAnnotation}
                  disabled={!newText.trim()}
                  variant="outline"
                  className="w-full"
                >
                  Add
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Annotations list */}
        {annotations.length > 0 && (
          <div className="space-y-2">
            <Label>Annotations ({totalAnnotations})</Label>
            <div className="space-y-1.5 max-h-60 overflow-y-auto">
              {annotations.map(ann => (
                <div
                  key={ann.id}
                  className={`flex items-center gap-3 border rounded-lg p-2 text-sm cursor-pointer transition-colors ${
                    selectedId === ann.id ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
                  }`}
                  onClick={() => {
                    setCurrentPage(ann.page);
                    setSelectedId(ann.id);
                  }}
                >
                  <div className="size-4 rounded-full border shrink-0" style={{ backgroundColor: ann.color }} />
                  <div className="flex-1 min-w-0">
                    <p className="truncate font-medium">
                      {ann.bold ? <span className="font-bold">B</span> : ''}
                      {ann.italic ? <span className="italic">I</span> : ''}
                      {' '}{ann.text}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Page {ann.page} · ({ann.x.toFixed(0)}, {ann.y.toFixed(0)}) · {ann.fontSize}pt
                    </p>
                  </div>
                  {selectedId === ann.id && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7 shrink-0 text-muted-foreground hover:text-destructive"
                      onClick={e => {
                        e.stopPropagation();
                        removeAnnotation(ann.id);
                      }}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
            {selectedId && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Selected: click annotation to edit, or</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs text-destructive"
                  onClick={() => removeAnnotation(selectedId)}
                >
                  <Trash2 className="size-3 mr-1" /> Delete
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Progress */}
        {processing && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Flattening page {Math.round(progress / 100 * pageCount)} of {pageCount}…</span>
              <span>{progress}%</span>
            </div>
            <Progress value={progress} />
          </div>
        )}

        {/* Action button */}
        <Button
          onClick={flattenAndDownload}
          disabled={!pdfFile || annotations.length === 0 || processing}
          className="w-full"
        >
          {processing ? (
            <Loader2 className="size-4 animate-spin mr-2" />
          ) : (
            <Download className="size-4 mr-2" />
          )}
          {processing ? 'Flattening…' : 'Flatten & Download'}
        </Button>

        {done && (
          <p className="text-sm text-green-600 flex items-center gap-1">
            <CheckCircle2 className="size-4" /> Edited PDF downloaded! Annotations are now flattened into the pages.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
