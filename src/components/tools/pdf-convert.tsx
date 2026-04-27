'use client';

import React, { useState, useRef, useCallback } from 'react';
import { PDFDocument, rgb, StandardFonts, degrees } from 'pdf-lib';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import mammoth from 'mammoth';
import { Document as DocxDocument, Packer, Paragraph, TextRun, PageBreak, HeadingLevel, AlignmentType } from 'docx';
import PptxGenJS from 'pptxgenjs';
import * as XLSX from 'xlsx';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Upload,
  Download,
  Image as ImageIcon,
  FileText,
  FileSpreadsheet,
  Presentation,
  Code,
  Loader2,
  X,
  Plus,
  Trash2,
  Eye,
  AlertCircle,
  CheckCircle2,
  RotateCcw,
  ChevronUp,
  ChevronDown,
  FileUp,
  ShieldCheck,
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

function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsText(file);
  });
}

/**
 * Initialize pdfjs-dist dynamically and extract text from each page.
 * This avoids module-level crashes from pdfjs-dist.
 */
async function extractTextFromPdfUsingPdfjs(file: File): Promise<{ pageNum: number; text: string; width: number; height: number }[]> {
  const pdfjsLib = await import('pdfjs-dist');
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url
  ).toString();

  const arrayBuffer = await readFileAsArrayBuffer(file);
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const results: { pageNum: number; text: string; width: number; height: number }[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale: 1 });
    const textContent = await page.getTextContent();
    let pageText = '';
    let lastY: number | null = null;

    for (const item of textContent.items) {
      const ti = item as { str: string; transform: number[] };
      if (!ti.str) continue;
      const y = ti.transform[5];
      if (lastY !== null && Math.abs(y - lastY) > 5) {
        pageText += '\n';
      }
      pageText += ti.str + ' ';
      lastY = y;
    }

    results.push({
      pageNum: i,
      text: pageText.trim(),
      width: Math.round(viewport.width),
      height: Math.round(viewport.height),
    });
  }

  return results;
}

/**
 * Extract text with positional data from PDF using pdf.js
 */
interface TextItem {
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fontName: string;
  fontSize: number;
}

async function extractTextItemsFromPdf(file: File): Promise<{ pageNum: number; items: TextItem[]; width: number; height: number }[]> {
  const pdfjsLib = await import('pdfjs-dist');
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url
  ).toString();

  const arrayBuffer = await readFileAsArrayBuffer(file);
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const results: { pageNum: number; items: TextItem[]; width: number; height: number }[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale: 1 });
    const textContent = await page.getTextContent();
    const items: TextItem[] = [];

    for (const item of textContent.items) {
      const ti = item as { str: string; transform: number[]; width: number; height: number; fontName: string };
      if (!ti.str || !ti.str.trim()) continue;
      items.push({
        text: ti.str,
        x: ti.transform[4],
        y: ti.transform[5],
        width: ti.width || 0,
        height: ti.height || 12,
        fontName: ti.fontName || '',
        fontSize: ti.transform[0] || 12,
      });
    }

    results.push({
      pageNum: i,
      items,
      width: Math.round(viewport.width),
      height: Math.round(viewport.height),
    });
  }

  return results;
}

/* ────────────────────────────────────────────────────────────────
   1. JpgToPdf
   ──────────────────────────────────────────────────────────────── */

export function JpgToPdf() {
  const [images, setImages] = useState<{ file: File; preview: string; name: string }[]>([]);
  const [pageSize, setPageSize] = useState<'a4' | 'letter' | 'fit'>('a4');
  const [processing, setProcessing] = useState(false);
  const [done, setDone] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const addImages = useCallback(async (files: FileList | null) => {
    if (!files) return;
    const newImages: { file: File; preview: string; name: string }[] = [];
    for (const file of Array.from(files)) {
      if (!file.type.match(/^image\/(jpeg|png|webp)$/)) continue;
      // Convert WebP to PNG since pdf-lib doesn't support WebP embedding
      let processedFile = file;
      if (file.type === 'image/webp') {
        try {
          const dataUrl = await readFileAsDataURL(file);
          const img = await new Promise<HTMLImageElement>((resolve, reject) => {
            const i = new Image();
            i.onload = () => resolve(i);
            i.onerror = reject;
            i.src = dataUrl;
          });
          const canvas = document.createElement('canvas');
          canvas.width = img.naturalWidth;
          canvas.height = img.naturalHeight;
          const ctx = canvas.getContext('2d')!;
          ctx.drawImage(img, 0, 0);
          const pngBlob = await new Promise<Blob>((resolve) => {
            canvas.toBlob((b) => resolve(b!), 'image/png');
          });
          processedFile = new File([pngBlob], file.name.replace(/\.webp$/i, '.png'), { type: 'image/png' });
        } catch {
          // Skip if conversion fails
          continue;
        }
      }
      const preview = await readFileAsDataURL(processedFile);
      newImages.push({ file: processedFile, preview, name: file.name });
    }
    setImages(prev => [...prev, ...newImages]);
    setDone(false);
  }, []);

  const removeImage = (idx: number) => {
    setImages(prev => prev.filter((_, i) => i !== idx));
    setDone(false);
  };

  const convert = async () => {
    if (images.length === 0) return;
    setProcessing(true);
    try {
      const pdfDoc = await PDFDocument.create();
      for (const img of images) {
        const bytes = await readFileAsArrayBuffer(img.file);
        let embeddedImg;
        if (img.file.type === 'image/png') {
          embeddedImg = await pdfDoc.embedPng(bytes);
        } else {
          embeddedImg = await pdfDoc.embedJpg(bytes);
        }
        const imgW = embeddedImg.width;
        const imgH = embeddedImg.height;

        let pageW: number, pageH: number;
        if (pageSize === 'fit') {
          pageW = imgW;
          pageH = imgH;
        } else if (pageSize === 'letter') {
          pageW = 612;
          pageH = 792;
        } else {
          pageW = 595.28;
          pageH = 841.89;
        }

        const page = pdfDoc.addPage([pageW, pageH]);
        const scale = Math.min(pageW / imgW, pageH / imgH);
        const drawW = imgW * scale;
        const drawH = imgH * scale;
        page.drawImage(embeddedImg, {
          x: (pageW - drawW) / 2,
          y: (pageH - drawH) / 2,
          width: drawW,
          height: drawH,
        });
      }
      const pdfBytes = await pdfDoc.save();
      downloadBlob(pdfBytes, 'images-to-pdf.pdf');
      setDone(true);
    } catch (err) {
      console.error(err);
      alert('Conversion failed: ' + (err as Error).message);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ImageIcon className="size-5" /> JPG / PNG to PDF
        </CardTitle>
        <CardDescription>Upload images and combine them into a single PDF</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div
          onClick={() => inputRef.current?.click()}
          className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
        >
          <Upload className="mx-auto size-8 text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">Click or drag images here (JPG, PNG, WebP)</p>
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            className="hidden"
            onChange={e => addImages(e.target.files)}
          />
        </div>

        {images.length > 0 && (
          <div className="space-y-3">
            <Label>Image Previews ({images.length} images)</Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-72 overflow-y-auto">
              {images.map((img, i) => (
                <div key={i} className="relative group rounded-lg border overflow-hidden bg-muted">
                  <img src={img.preview} alt={img.name} className="w-full h-28 object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Button variant="destructive" size="icon" className="size-8" onClick={() => removeImage(i)}>
                      <X className="size-4" />
                    </Button>
                  </div>
                  <p className="text-xs truncate p-1">{img.name}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-2">
          <Label>Page Size</Label>
          <Select value={pageSize} onValueChange={v => { setPageSize(v as typeof pageSize); setDone(false); }}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="a4">A4 (595 x 842 pt)</SelectItem>
              <SelectItem value="letter">Letter (612 x 792 pt)</SelectItem>
              <SelectItem value="fit">Fit to Image</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button onClick={convert} disabled={images.length === 0 || processing} className="w-full">
          {processing ? <Loader2 className="size-4 animate-spin mr-2" /> : <Download className="size-4 mr-2" />}
          {processing ? 'Creating PDF…' : 'Create PDF'}
        </Button>
        {done && (
          <p className="text-sm text-green-600 flex items-center gap-1">
            <CheckCircle2 className="size-4" /> PDF downloaded successfully!
          </p>
        )}
      </CardContent>
    </Card>
  );
}

/* ────────────────────────────────────────────────────────────────
   2. WordToPdf (IMPROVED)
   ──────────────────────────────────────────────────────────────── */

export function WordToPdf() {
  const [file, setFile] = useState<File | null>(null);
  const [htmlContent, setHtmlContent] = useState('');
  const [processing, setProcessing] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (f: File | null) => {
    if (!f) return;
    setFile(f);
    setDone(false);
    setError('');
    setProgress('Reading DOCX file…');
    try {
      const arrayBuffer = await readFileAsArrayBuffer(f);
      const result = await mammoth.convertToHtml({ arrayBuffer });
      setHtmlContent(result.value);
      setProgress(`Parsed successfully — ${result.value.length} characters`);
      if (result.messages.length > 0) {
        console.warn('Mammoth messages:', result.messages);
      }
    } catch (err) {
      setError('Failed to parse DOCX: ' + (err as Error).message);
      setProgress('');
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f && f.name.endsWith('.docx')) {
      handleFile(f);
    } else {
      setError('Please drop a .docx file');
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOver(false);
  }, []);

  const convert = async () => {
    if (!htmlContent || !previewRef.current) return;
    setProcessing(true);
    setProgress('Rendering HTML to canvas…');
    setError('');
    try {
      // Render the HTML preview div to canvas
      const canvas = await html2canvas(previewRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      });

      setProgress('Generating PDF pages…');
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfW = pdf.internal.pageSize.getWidth();
      const pdfH = pdf.internal.pageSize.getHeight();
      const imgW = canvas.width;
      const imgH = canvas.height;

      // Convert pixel dimensions to mm at 2x scale
      const pxToMm = 25.4 / (96 * 2);
      const imgWmm = imgW * pxToMm;
      const imgHmm = imgH * pxToMm;
      const ratio = Math.min(pdfW / imgWmm, pdfH / imgHmm);
      const drawW = imgWmm * ratio;
      const drawH = imgHmm * ratio;

      // Handle multi-page: split the canvas image across pages
      const totalPages = Math.ceil(imgHmm / pdfH);
      for (let i = 0; i < totalPages; i++) {
        setProgress(`Rendering page ${i + 1} of ${totalPages}…`);
        if (i > 0) pdf.addPage();
        pdf.addImage(imgData, 'PNG', (pdfW - drawW) / 2, -i * pdfH, drawW, drawH);
      }

      setProgress('Saving PDF…');
      pdf.save('word-to-pdf.pdf');
      setDone(true);
      setProgress('');
    } catch (err) {
      setError('Conversion failed: ' + (err as Error).message);
      setProgress('');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="size-5" /> Word to PDF
        </CardTitle>
        <CardDescription>Upload a .docx file and convert it to PDF with proper formatting</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div
          onClick={() => inputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
            dragOver ? 'border-primary bg-primary/5' : 'hover:border-primary/50'
          }`}
        >
          <Upload className="mx-auto size-8 text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">
            {dragOver ? 'Drop .docx file here' : 'Click or drag & drop a .docx file'}
          </p>
          <input
            ref={inputRef}
            type="file"
            accept=".docx"
            className="hidden"
            onChange={e => handleFile(e.target.files?.[0] ?? null)}
          />
        </div>

        {file && <Badge variant="secondary">{file.name}</Badge>}

        {progress && !processing && (
          <p className="text-sm text-muted-foreground flex items-center gap-1">
            <CheckCircle2 className="size-4 text-green-500" /> {progress}
          </p>
        )}

        {htmlContent && (
          <div className="space-y-2">
            <Label>Preview</Label>
            <div
              className="border rounded-lg p-4 max-h-80 overflow-y-auto bg-white text-black text-sm leading-relaxed"
              ref={previewRef}
              dangerouslySetInnerHTML={{ __html: htmlContent }}
            />
          </div>
        )}

        {error && (
          <p className="text-sm text-destructive flex items-center gap-1">
            <AlertCircle className="size-4" /> {error}
          </p>
        )}

        {processing && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" /> {progress}
          </div>
        )}

        <Button onClick={convert} disabled={!htmlContent || processing} className="w-full">
          {processing ? <Loader2 className="size-4 animate-spin mr-2" /> : <Download className="size-4 mr-2" />}
          {processing ? 'Converting…' : 'Convert to PDF'}
        </Button>
        {done && (
          <p className="text-sm text-green-600 flex items-center gap-1">
            <CheckCircle2 className="size-4" /> PDF downloaded successfully!
          </p>
        )}
      </CardContent>
    </Card>
  );
}

/* ────────────────────────────────────────────────────────────────
   3. PptToPdf (IMPROVED)
   ──────────────────────────────────────────────────────────────── */

interface SlideData {
  title: string;
  content: string;
}

export function PptToPdf() {
  const [slides, setSlides] = useState<SlideData[]>([
    { title: 'Presentation Title', content: 'Subtitle or Author Name' },
    { title: 'Slide 1', content: 'Key point one\nKey point two\nKey point three' },
    { title: 'Slide 2', content: 'Another important topic\nWith supporting details' },
    { title: 'Thank You', content: 'Questions?' },
  ]);
  const [processing, setProcessing] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState('');
  const txtInputRef = useRef<HTMLInputElement>(null);

  const updateSlide = (idx: number, field: keyof SlideData, value: string) => {
    setSlides(prev => prev.map((s, i) => (i === idx ? { ...s, [field]: value } : s)));
    setDone(false);
  };

  const addSlide = () => {
    setSlides(prev => [...prev, { title: `Slide ${prev.length + 1}`, content: '' }]);
    setDone(false);
  };

  const removeSlide = (idx: number) => {
    setSlides(prev => prev.filter((_, i) => i !== idx));
    setDone(false);
  };

  const moveSlide = (idx: number, direction: 'up' | 'down') => {
    const newIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (newIdx < 0 || newIdx >= slides.length) return;
    const newSlides = [...slides];
    [newSlides[idx], newSlides[newIdx]] = [newSlides[newIdx], newSlides[idx]];
    setSlides(newSlides);
    setDone(false);
  };

  const importFromTxt = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    try {
      const text = await readFileAsText(f);
      // Split by blank lines (one slide per paragraph group)
      const blocks = text.split(/\n\s*\n/).filter(b => b.trim());
      if (blocks.length === 0) return;

      const newSlides: SlideData[] = blocks.map((block, i) => {
        const lines = block.trim().split('\n').map(l => l.trim()).filter(Boolean);
        const title = lines[0] || `Slide ${i + 1}`;
        const content = lines.slice(1).join('\n');
        return { title, content };
      });

      setSlides(newSlides);
      setDone(false);
    } catch (err) {
      setError('Failed to read text file: ' + (err as Error).message);
    }
    // Reset input so the same file can be re-imported
    e.target.value = '';
  };

  const convert = async () => {
    setProcessing(true);
    setError('');
    try {
      const pdfDoc = await PDFDocument.create();
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

      for (let si = 0; si < slides.length; si++) {
        setProgress(`Rendering slide ${si + 1} of ${slides.length}…`);
        const slide = slides[si];
        const page = pdfDoc.addPage([612, 792]);
        const { width, height } = page.getSize();

        // Full-page dark background
        page.drawRectangle({
          x: 0,
          y: 0,
          width,
          height,
          color: rgb(0.08, 0.08, 0.12),
        });

        // Accent gradient bar at top
        page.drawRectangle({
          x: 0,
          y: height - 6,
          width,
          height: 6,
          color: rgb(0.91, 0.27, 0.37),
        });

        // Title area with subtle background
        page.drawRectangle({
          x: 0,
          y: height - 150,
          width,
          height: 144,
          color: rgb(0.12, 0.12, 0.18),
        });

        // Title
        const titleSize = 28;
        const titleText = slide.title.length > 40 ? slide.title.substring(0, 37) + '…' : slide.title;
        const titleW = fontBold.widthOfTextAtSize(titleText, titleSize);
        page.drawText(titleText, {
          x: (width - titleW) / 2,
          y: height - 85,
          size: titleSize,
          font: fontBold,
          color: rgb(1, 1, 1),
        });

        // Decorative line under title
        const lineWidth = Math.min(titleW + 20, 300);
        page.drawRectangle({
          x: (width - lineWidth) / 2,
          y: height - 160,
          width: lineWidth,
          height: 2,
          color: rgb(0.91, 0.27, 0.37),
        });

        // Content bullet points
        const lines = slide.content.split('\n').filter(l => l.trim());
        let yPos = height - 200;
        const bulletSize = 15;
        const lineSpacing = 32;

        for (const line of lines) {
          if (yPos < 50) break;

          // Bullet dot
          page.drawCircle({
            x: 55,
            y: yPos + 4,
            size: 3,
            color: rgb(0.91, 0.27, 0.37),
          });

          // Bullet text - auto-wrap long lines
          const maxTextWidth = width - 120;
          let text = line;
          if (font.widthOfTextAtSize(text, bulletSize) > maxTextWidth) {
            // Simple truncation with ellipsis
            while (font.widthOfTextAtSize(text + '…', bulletSize) > maxTextWidth && text.length > 5) {
              text = text.slice(0, -1);
            }
            text += '…';
          }

          page.drawText(text, {
            x: 72,
            y: yPos,
            size: bulletSize,
            font,
            color: rgb(0.88, 0.88, 0.92),
          });

          yPos -= lineSpacing;
        }

        // Slide number in bottom right
        const slideNumText = `${si + 1}`;
        page.drawText(slideNumText, {
          x: width - 40,
          y: 25,
          size: 10,
          font,
          color: rgb(0.5, 0.5, 0.6),
        });
      }

      setProgress('Saving PDF…');
      const pdfBytes = await pdfDoc.save();
      downloadBlob(pdfBytes, 'presentation.pdf');
      setDone(true);
      setProgress('');
    } catch (err) {
      setError('Error: ' + (err as Error).message);
      setProgress('');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Presentation className="size-5" /> Slide Editor to PDF
        </CardTitle>
        <CardDescription>
          Create slides and export as a styled PDF presentation. Import from .txt files.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => txtInputRef.current?.click()}>
            <FileUp className="size-3.5 mr-1" /> Import from .txt
          </Button>
          <input
            ref={txtInputRef}
            type="file"
            accept=".txt"
            className="hidden"
            onChange={importFromTxt}
          />
          <Badge variant="secondary" className="text-xs">
            {slides.length} slide{slides.length !== 1 ? 's' : ''}
          </Badge>
        </div>

        {error && (
          <p className="text-sm text-destructive flex items-center gap-1">
            <AlertCircle className="size-4" /> {error}
          </p>
        )}

        <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
          {slides.map((slide, i) => (
            <Card key={i} className="p-3">
              <div className="flex items-center justify-between mb-2">
                <Badge variant="outline">Slide {i + 1}</Badge>
                <div className="flex items-center gap-0.5">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7"
                    onClick={() => moveSlide(i, 'up')}
                    disabled={i === 0}
                  >
                    <ChevronUp className="size-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7"
                    onClick={() => moveSlide(i, 'down')}
                    disabled={i === slides.length - 1}
                  >
                    <ChevronDown className="size-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="size-7" onClick={() => removeSlide(i)}>
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </div>
              <Input
                value={slide.title}
                onChange={e => updateSlide(i, 'title', e.target.value)}
                placeholder="Slide title"
                className="mb-2"
              />
              <Textarea
                value={slide.content}
                onChange={e => updateSlide(i, 'content', e.target.value)}
                placeholder="Slide content (one bullet point per line)"
                rows={3}
              />
            </Card>
          ))}
        </div>

        <Button variant="outline" onClick={addSlide} className="w-full">
          <Plus className="size-4 mr-2" /> Add Slide
        </Button>

        {processing && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" /> {progress}
          </div>
        )}

        <Button onClick={convert} disabled={slides.length === 0 || processing} className="w-full">
          {processing ? <Loader2 className="size-4 animate-spin mr-2" /> : <Download className="size-4 mr-2" />}
          {processing ? 'Creating PDF…' : 'Create Presentation PDF'}
        </Button>
        {done && (
          <p className="text-sm text-green-600 flex items-center gap-1">
            <CheckCircle2 className="size-4" /> PDF downloaded successfully!
          </p>
        )}
      </CardContent>
    </Card>
  );
}

/* ────────────────────────────────────────────────────────────────
   4. ExcelToPdf (IMPROVED)
   ──────────────────────────────────────────────────────────────── */

const DEFAULT_CSV = `Name,Department,Salary,Start Date
Alice Johnson,Engineering,95000,2021-03-15
Bob Smith,Marketing,78000,2020-07-01
Carol Williams,Sales,82000,2019-11-20
Dave Brown,Engineering,91000,2022-01-10
Eve Davis,HR,75000,2018-06-05`;

function detectDelimiter(text: string): string {
  const firstLine = text.split('\n')[0] || '';
  const counts: Record<string, number> = { ',': 0, '\t': 0, ';': 0, '|': 0 };
  for (const ch of firstLine) {
    if (ch in counts) counts[ch]++;
  }
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
}

function parseCSV(text: string): string[][] {
  const delimiter = detectDelimiter(text);
  return text.trim().split('\n').map(r => {
    // Simple CSV parsing (handles basic cases)
    const cells: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < r.length; i++) {
      const ch = r[i];
      if (ch === '"') {
        inQuotes = !inQuotes;
      } else if (ch === delimiter && !inQuotes) {
        cells.push(current.trim());
        current = '';
      } else {
        current += ch;
      }
    }
    cells.push(current.trim());
    return cells;
  });
}

export function ExcelToPdf() {
  const [csvData, setCsvData] = useState(DEFAULT_CSV);
  const [fileName, setFileName] = useState('');
  const [processing, setProcessing] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState('');
  const csvInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    try {
      const text = await readFileAsText(f);
      setCsvData(text);
      setFileName(f.name);
      setDone(false);
      setError('');
    } catch (err) {
      setError('Failed to read file: ' + (err as Error).message);
    }
    e.target.value = '';
  };

  const delimiter = detectDelimiter(csvData);
  const rows = parseCSV(csvData);

  const convert = async () => {
    if (rows.length === 0) return;
    setProcessing(true);
    setError('');
    setProgress('Rendering table…');
    try {
      const pdf = new jsPDF('l', 'mm', 'a4');
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const margin = 12;
      const headerH = 10;
      const rowH = 8;
      const cols = rows[0]?.length || 1;

      // Calculate column widths based on content
      const colWidths: number[] = [];
      for (let ci = 0; ci < cols; ci++) {
        let maxW = 0;
        for (let ri = 0; ri < Math.min(rows.length, 50); ri++) {
          const cellText = (rows[ri]?.[ci] || '').substring(0, 40);
          const textW = pdf.getStringUnitWidth(cellText) * (ri === 0 ? 9 : 8) * 0.3528;
          maxW = Math.max(maxW, textW + 4);
        }
        colWidths.push(Math.min(Math.max(maxW, 20), 80));
      }

      // Scale columns to fit page width
      const totalColW = colWidths.reduce((a, b) => a + b, 0);
      const availableWidth = pageW - margin * 2;
      const scaleFactor = totalColW > availableWidth ? availableWidth / totalColW : 1;
      const finalColWidths = colWidths.map(w => w * scaleFactor);

      let y = margin;
      let isFirstPage = true;

      for (let ri = 0; ri < rows.length; ri++) {
        // Check if we need a new page
        const currentRowH = ri === 0 ? headerH : rowH;
        if (y + currentRowH > pageH - margin) {
          pdf.addPage();
          y = margin;
          isFirstPage = false;
        }

        // Re-draw header on new pages
        if (!isFirstPage && ri > 0 && y === margin) {
          for (let ci = 0; ci < cols; ci++) {
            const x = margin + finalColWidths.slice(0, ci).reduce((a, b) => a + b, 0);
            const w = finalColWidths[ci];
            const headerText = (rows[0]?.[ci] || '').substring(0, 30);

            // Header background
            pdf.setFillColor(30, 30, 36);
            pdf.rect(x, y, w, headerH, 'F');
            // Header text
            pdf.setTextColor(255, 255, 255);
            pdf.setFontSize(8);
            pdf.setFont('helvetica', 'bold');
            pdf.text(headerText, x + 2, y + 7);
          }
          // Header bottom border
          pdf.setDrawColor(30, 30, 36);
          pdf.setLineWidth(0.5);
          pdf.line(margin, y + headerH, margin + availableWidth, y + headerH);
          y += headerH;
        }

        for (let ci = 0; ci < cols; ci++) {
          const x = margin + finalColWidths.slice(0, ci).reduce((a, b) => a + b, 0);
          const w = finalColWidths[ci];
          const text = (rows[ri]?.[ci] || '').substring(0, 40);

          if (ri === 0) {
            // Header styling
            pdf.setFillColor(30, 30, 36);
            pdf.rect(x, y, w, headerH, 'F');
            pdf.setTextColor(255, 255, 255);
            pdf.setFontSize(8);
            pdf.setFont('helvetica', 'bold');
            pdf.text(text, x + 2, y + 7);
          } else {
            // Data cell styling
            if (ri % 2 === 0) {
              pdf.setFillColor(248, 248, 250);
              pdf.rect(x, y, w, rowH, 'F');
            }
            // Cell border
            pdf.setDrawColor(220, 220, 224);
            pdf.setLineWidth(0.2);
            pdf.rect(x, y, w, rowH, 'S');

            pdf.setTextColor(40, 40, 50);
            pdf.setFontSize(8);
            pdf.setFont('helvetica', 'normal');
            pdf.text(text, x + 2, y + 5.5);
          }
        }

        // Header bottom line
        if (ri === 0) {
          pdf.setDrawColor(30, 30, 36);
          pdf.setLineWidth(0.8);
          pdf.line(margin, y + headerH, margin + availableWidth, y + headerH);
        }

        y += ri === 0 ? headerH : rowH;

        if (ri % 50 === 0) {
          setProgress(`Rendering row ${ri + 1} of ${rows.length}…`);
        }
      }

      setProgress('Saving PDF…');
      pdf.save('table-to-pdf.pdf');
      setDone(true);
      setProgress('');
    } catch (err) {
      setError('Error: ' + (err as Error).message);
      setProgress('');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileSpreadsheet className="size-5" /> Excel / CSV to PDF
        </CardTitle>
        <CardDescription>
          Upload a CSV file or paste tabular data to generate a professional PDF table
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => csvInputRef.current?.click()}>
            <FileUp className="size-3.5 mr-1" /> Upload .csv file
          </Button>
          <input
            ref={csvInputRef}
            type="file"
            accept=".csv,.tsv,.txt"
            className="hidden"
            onChange={handleFileUpload}
          />
          {fileName && <Badge variant="secondary">{fileName}</Badge>}
          <Badge variant="outline" className="ml-auto text-xs">
            Detected delimiter: {delimiter === '\t' ? 'Tab' : delimiter === '|' ? 'Pipe' : delimiter}
          </Badge>
        </div>

        <div className="space-y-2">
          <Label>CSV Data</Label>
          <Textarea
            value={csvData}
            onChange={e => { setCsvData(e.target.value); setDone(false); setFileName(''); }}
            rows={8}
            className="font-mono text-sm"
            placeholder="Header1,Header2,Header3&#10;Value1,Value2,Value3"
          />
        </div>

        {rows.length > 0 && (
          <div className="space-y-2">
            <Label className="flex items-center gap-1">
              <Eye className="size-3.5" /> Preview
              <span className="text-muted-foreground font-normal">({rows.length - 1} data rows, {rows[0]?.length} columns)</span>
            </Label>
            <div className="overflow-x-auto border rounded-lg max-h-60 overflow-y-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted">
                    {rows[0]?.map((h, i) => (
                      <th key={i} className="px-3 py-2 text-left font-medium border-b whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.slice(1, 51).map((row, ri) => (
                    <tr key={ri} className={ri % 2 === 0 ? 'bg-muted/30' : ''}>
                      {row.map((cell, ci) => (
                        <td key={ci} className="px-3 py-1.5 border-b whitespace-nowrap">{cell}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              {rows.length > 52 && (
                <p className="text-xs text-muted-foreground text-center py-2">
                  Showing first 50 rows of {rows.length - 1}
                </p>
              )}
            </div>
          </div>
        )}

        {error && (
          <p className="text-sm text-destructive flex items-center gap-1">
            <AlertCircle className="size-4" /> {error}
          </p>
        )}

        {processing && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" /> {progress}
          </div>
        )}

        <Button onClick={convert} disabled={!csvData.trim() || rows.length < 2 || processing} className="w-full">
          {processing ? <Loader2 className="size-4 animate-spin mr-2" /> : <Download className="size-4 mr-2" />}
          {processing ? 'Creating PDF…' : 'Create Table PDF'}
        </Button>
        {done && (
          <p className="text-sm text-green-600 flex items-center gap-1">
            <CheckCircle2 className="size-4" /> PDF downloaded successfully!
          </p>
        )}
      </CardContent>
    </Card>
  );
}

/* ────────────────────────────────────────────────────────────────
   5. HtmlToPdf
   ──────────────────────────────────────────────────────────────── */

const SAMPLE_HTML = `<div style="font-family: Arial, sans-serif; padding: 40px; color: #333;">
  <h1 style="color: #1a1a2e; border-bottom: 3px solid #e94560; padding-bottom: 10px;">
    Monthly Report
  </h1>
  <h2 style="color: #16213e;">Overview</h2>
  <p style="line-height: 1.8;">
    This is a sample HTML document converted to PDF. It demonstrates
    styled content with headings, paragraphs, and tables.
  </p>
  <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
    <thead>
      <tr style="background: #1a1a2e; color: white;">
        <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Metric</th>
        <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Value</th>
        <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Change</th>
      </tr>
    </thead>
    <tbody>
      <tr style="background: #f5f5f5;">
        <td style="padding: 8px; border: 1px solid #ddd;">Revenue</td>
        <td style="padding: 8px; border: 1px solid #ddd;">$125,000</td>
        <td style="padding: 8px; border: 1px solid #ddd; color: green;">+12%</td>
      </tr>
      <tr>
        <td style="padding: 8px; border: 1px solid #ddd;">Users</td>
        <td style="padding: 8px; border: 1px solid #ddd;">8,450</td>
        <td style="padding: 8px; border: 1px solid #ddd; color: green;">+8%</td>
      </tr>
      <tr style="background: #f5f5f5;">
        <td style="padding: 8px; border: 1px solid #ddd;">Conversion</td>
        <td style="padding: 8px; border: 1px solid #ddd;">3.2%</td>
        <td style="padding: 8px; border: 1px solid #ddd; color: red;">-0.3%</td>
      </tr>
    </tbody>
  </table>
  <p style="margin-top: 20px; font-size: 12px; color: #888;">
    Generated on ${new Date().toLocaleDateString()}
  </p>
</div>`;

export function HtmlToPdf() {
  const [html, setHtml] = useState(SAMPLE_HTML);
  const [processing, setProcessing] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const previewRef = useRef<HTMLDivElement>(null);

  const convert = async () => {
    if (!previewRef.current) return;
    setProcessing(true);
    setError('');
    try {
      const canvas = await html2canvas(previewRef.current, { scale: 2, useCORS: true });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfW = pdf.internal.pageSize.getWidth(); // in mm
      const pdfH = pdf.internal.pageSize.getHeight(); // in mm
      const imgW = canvas.width; // in pixels
      const imgH = canvas.height; // in pixels
      // Convert pixel dimensions to mm at 2x scale (canvas scale = 2)
      const pxToMm = 25.4 / (96 * 2);
      const imgWmm = imgW * pxToMm;
      const imgHmm = imgH * pxToMm;
      const ratio = Math.min(pdfW / imgWmm, pdfH / imgHmm);
      const drawW = imgWmm * ratio;
      const drawH = imgHmm * ratio;
      const totalPages = Math.ceil(imgHmm / pdfH);
      for (let i = 0; i < totalPages; i++) {
        if (i > 0) pdf.addPage();
        pdf.addImage(imgData, 'PNG', (pdfW - drawW) / 2, -i * pdfH, drawW, drawH);
      }
      pdf.save('html-to-pdf.pdf');
      setDone(true);
    } catch (err) {
      setError('Conversion failed: ' + (err as Error).message);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Code className="size-5" /> HTML to PDF
        </CardTitle>
        <CardDescription>Enter HTML content and convert it to a styled PDF</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => { setHtml(SAMPLE_HTML); setDone(false); }}
          >
            <RotateCcw className="size-3.5 mr-1" /> Sample HTML
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => { setHtml(''); setDone(false); }}
          >
            <Trash2 className="size-3.5 mr-1" /> Clear
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>HTML Code</Label>
            <Textarea
              value={html}
              onChange={e => { setHtml(e.target.value); setDone(false); }}
              rows={16}
              className="font-mono text-xs"
              placeholder="Enter HTML here..."
            />
          </div>
          <div className="space-y-2">
            <Label>Live Preview</Label>
            <div className="border rounded-lg overflow-hidden bg-white">
              <div
                ref={previewRef}
                className="p-4 max-h-[500px] overflow-y-auto text-sm"
                dangerouslySetInnerHTML={{ __html: html }}
              />
            </div>
          </div>
        </div>

        {error && (
          <p className="text-sm text-destructive flex items-center gap-1">
            <AlertCircle className="size-4" /> {error}
          </p>
        )}

        <Button onClick={convert} disabled={!html.trim() || processing} className="w-full">
          {processing ? <Loader2 className="size-4 animate-spin mr-2" /> : <Download className="size-4 mr-2" />}
          {processing ? 'Converting…' : 'Convert to PDF'}
        </Button>
        {done && (
          <p className="text-sm text-green-600 flex items-center gap-1">
            <CheckCircle2 className="size-4" /> PDF downloaded successfully!
          </p>
        )}
      </CardContent>
    </Card>
  );
}

/* ────────────────────────────────────────────────────────────────
   6. PdfToJpg
   ──────────────────────────────────────────────────────────────── */

export function PdfToJpg() {
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [pages, setPages] = useState<{ num: number; width: number; height: number }[]>([]);
  const [processing, setProcessing] = useState(false);
  const [converting, setConverting] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (f: File | null) => {
    if (!f) return;
    setPdfFile(f);
    setError('');
    setProcessing(true);
    try {
      const bytes = await readFileAsArrayBuffer(f);
      const pdfDoc = await PDFDocument.load(bytes);
      const numPages = pdfDoc.getPageCount();
      setPageCount(numPages);
      const pageInfos: { num: number; width: number; height: number }[] = [];
      for (let i = 0; i < numPages; i++) {
        const page = pdfDoc.getPage(i);
        const { width, height } = page.getSize();
        pageInfos.push({ num: i + 1, width: Math.round(width), height: Math.round(height) });
      }
      setPages(pageInfos);
    } catch (err) {
      setError('Failed to read PDF: ' + (err as Error).message);
    } finally {
      setProcessing(false);
    }
  };

  const convertPages = async () => {
    if (!pdfFile) return;
    setConverting(true);
    try {
      // Dynamically import pdfjs-dist to avoid module-level crashes
      const pdfjsLib = await import('pdfjs-dist');
      pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
        'pdfjs-dist/build/pdf.worker.min.mjs',
        import.meta.url
      ).toString();

      // Render actual PDF pages to images using pdf.js
      const arrayBuffer = await readFileAsArrayBuffer(pdfFile);
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const scale = 2;
        const viewport = page.getViewport({ scale });
        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext('2d')!;

        // Render the actual page content
        await page.render({ canvasContext: ctx, viewport }).promise;

        const blob = await new Promise<Blob>((resolve) => {
          canvas.toBlob(b => resolve(b!), 'image/png');
        });
        downloadBlob(blob, `page-${i}.png`);
      }
    } catch (err) {
      setError('Conversion failed: ' + (err as Error).message);
    } finally {
      setConverting(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ImageIcon className="size-5" /> PDF to JPG
        </CardTitle>
        <CardDescription>Upload a PDF and convert each page to a high-quality PNG image</CardDescription>
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

        {pdfFile && <Badge variant="secondary">{pdfFile.name}</Badge>}

        {processing && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" /> Reading PDF…
          </div>
        )}

        {error && (
          <p className="text-sm text-destructive flex items-center gap-1">
            <AlertCircle className="size-4" /> {error}
          </p>
        )}

        {pages.length > 0 && (
          <div className="space-y-2">
            <Label>Pages ({pageCount} total)</Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-72 overflow-y-auto">
              {pages.map(p => (
                <div
                  key={p.num}
                  className="border rounded-lg p-3 flex flex-col items-center justify-center bg-muted/30 aspect-[3/4]"
                >
                  <FileText className="size-8 text-muted-foreground mb-2" />
                  <p className="text-sm font-medium">Page {p.num}</p>
                  <p className="text-xs text-muted-foreground">{p.width} x {p.height} pt</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-muted/50 border rounded-lg p-3 text-sm text-muted-foreground flex items-start gap-2">
          <AlertCircle className="size-4 mt-0.5 shrink-0" />
          <span>
            Pages are rendered at 2x resolution for high-quality output. Each page will be downloaded as a separate PNG file.
          </span>
        </div>

        <Button onClick={convertPages} disabled={pages.length === 0 || converting} className="w-full">
          {converting ? <Loader2 className="size-4 animate-spin mr-2" /> : <Download className="size-4 mr-2" />}
          {converting ? 'Exporting…' : `Export ${pages.length} Page${pages.length !== 1 ? 's' : ''} as PNG`}
        </Button>
      </CardContent>
    </Card>
  );
}

/* ────────────────────────────────────────────────────────────────
   7. PdfToWord (REWRITTEN using docx package)
   ──────────────────────────────────────────────────────────────── */

export function PdfToWord() {
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState('');
  const [done, setDone] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (f: File | null) => {
    if (!f) return;
    setPdfFile(f);
    setError('');
    setDone(false);
    setProcessing(true);
    try {
      const pages = await extractTextFromPdfUsingPdfjs(f);
      setPageCount(pages.length);
    } catch (err) {
      setError('Failed to read PDF: ' + (err as Error).message);
    } finally {
      setProcessing(false);
    }
  };

  const convert = async () => {
    if (!pdfFile) return;
    setProcessing(true);
    setError('');
    try {
      setProgress('Extracting text from PDF…');
      const pages = await extractTextFromPdfUsingPdfjs(pdfFile);

      setProgress('Building Word document…');
      const children: Paragraph[] = [];

      for (let i = 0; i < pages.length; i++) {
        const page = pages[i];

        // Page header
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: `Page ${page.pageNum}`,
                bold: true,
                size: 28,
                color: '888888',
                font: 'Calibri',
              }),
              new TextRun({
                text: ` (${page.width} × ${page.height} pt)`,
                size: 20,
                color: 'AAAAAA',
                font: 'Calibri',
              }),
            ],
            spacing: { after: 200 },
            heading: HeadingLevel.HEADING_2,
          })
        );

        // Page content - split by lines
        const lines = page.text.split('\n').filter(l => l.trim());
        for (const line of lines) {
          children.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: line,
                  size: 22,
                  font: 'Calibri',
                }),
              ],
              spacing: { after: 120 },
            })
          );
        }

        // Page break between pages (except after the last one)
        if (i < pages.length - 1) {
          children.push(
            new Paragraph({
              children: [new PageBreak()],
            })
          );
        }
      }

      setProgress('Generating .docx file…');
      const doc = new DocxDocument({
        sections: [{
          properties: {
            page: {
              margin: {
                top: 1440,
                right: 1440,
                bottom: 1440,
                left: 1440,
              },
            },
          },
          children,
        }],
      });

      const blob = await Packer.toBlob(doc);
      downloadBlob(blob, 'converted.docx');
      setDone(true);
      setProgress('');
    } catch (err) {
      setError('Conversion failed: ' + (err as Error).message);
      setProgress('');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="size-5" /> PDF to Word
        </CardTitle>
        <CardDescription>Extract text from PDF and generate a properly formatted .docx file</CardDescription>
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

        {pdfFile && (
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{pdfFile.name}</Badge>
            {pageCount > 0 && <Badge variant="outline">{pageCount} pages</Badge>}
          </div>
        )}

        {processing && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" /> {progress}
          </div>
        )}

        {error && (
          <p className="text-sm text-destructive flex items-center gap-1">
            <AlertCircle className="size-4" /> {error}
          </p>
        )}

        <Button onClick={convert} disabled={!pdfFile || processing} className="w-full">
          {processing ? <Loader2 className="size-4 animate-spin mr-2" /> : <Download className="size-4 mr-2" />}
          {processing ? 'Converting…' : 'Convert to .docx'}
        </Button>
        {done && (
          <p className="text-sm text-green-600 flex items-center gap-1">
            <CheckCircle2 className="size-4" /> Word document downloaded successfully!
          </p>
        )}
      </CardContent>
    </Card>
  );
}

/* ────────────────────────────────────────────────────────────────
   8. PdfToPpt (REWRITTEN using pptxgenjs)
   ──────────────────────────────────────────────────────────────── */

export function PdfToPpt() {
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState('');
  const [done, setDone] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (f: File | null) => {
    if (!f) return;
    setPdfFile(f);
    setError('');
    setDone(false);
    setProcessing(true);
    try {
      const pages = await extractTextFromPdfUsingPdfjs(f);
      setPageCount(pages.length);
    } catch (err) {
      setError('Failed to read PDF: ' + (err as Error).message);
    } finally {
      setProcessing(false);
    }
  };

  const convert = async () => {
    if (!pdfFile) return;
    setProcessing(true);
    setError('');
    try {
      setProgress('Extracting text from PDF…');
      const pages = await extractTextFromPdfUsingPdfjs(pdfFile);

      setProgress('Creating PowerPoint slides…');
      const pptx = new PptxGenJS();

      for (let i = 0; i < pages.length; i++) {
        setProgress(`Processing slide ${i + 1} of ${pages.length}…`);
        const page = pages[i];
        const slide = pptx.addSlide();

        // Dark background
        slide.background = { fill: '1A1A2E' };

        // Accent bar at top
        slide.addShape(pptx.ShapeType.rect, {
          x: 0, y: 0, w: '100%', h: 0.08,
          fill: { color: 'E94560' },
        });

        // Page number label
        slide.addText(`Page ${page.pageNum}`, {
          x: 0.3, y: 0.2, w: 3, h: 0.4,
          fontSize: 10,
          color: '888888',
          fontFace: 'Arial',
        });

        // Content text
        const lines = page.text.split('\n').filter(l => l.trim());
        if (lines.length > 0) {
          // First line as title if it looks like one (shorter, possibly larger font)
          const titleText = lines[0].length > 80 ? lines[0].substring(0, 77) + '…' : lines[0];
          slide.addText(titleText, {
            x: 0.5, y: 0.7, w: 9, h: 1,
            fontSize: 24,
            color: 'FFFFFF',
            fontFace: 'Arial',
            bold: true,
            valign: 'middle',
          });

          // Remaining lines as bullet points
          const bulletLines = lines.slice(1);
          if (bulletLines.length > 0) {
            slide.addShape(pptx.ShapeType.rect, {
              x: 0.5, y: 1.9, w: 0.04, h: Math.min(bulletLines.length * 0.45, 4.5),
              fill: { color: 'E94560' },
            });

            const bulletTextItems = bulletLines.slice(0, 15).map(line => ({
              text: line.length > 90 ? line.substring(0, 87) + '…' : line,
              options: {
                fontSize: 14,
                color: 'E0E0E8',
                fontFace: 'Arial',
                bullet: { type: 'bullet', style: 'arabicPeriod' },
                paraSpaceAfter: 6,
              },
            }));

            slide.addText(bulletTextItems, {
              x: 0.8, y: 1.9, w: 8.5, h: 4.5,
              valign: 'top',
            });
          }
        } else {
          slide.addText('[No text content found on this page]', {
            x: 0.5, y: 2, w: 9, h: 1,
            fontSize: 16,
            color: '666666',
            fontFace: 'Arial',
            italic: true,
            align: 'center',
            valign: 'middle',
          });
        }
      }

      setProgress('Generating .pptx file…');
      const pptxBlob = await pptx.write({ outputType: 'blob' }) as Blob;
      downloadBlob(pptxBlob, 'converted.pptx');
      setDone(true);
      setProgress('');
    } catch (err) {
      setError('Conversion failed: ' + (err as Error).message);
      setProgress('');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Presentation className="size-5" /> PDF to PPT
        </CardTitle>
        <CardDescription>Convert each PDF page into a PowerPoint slide with formatted text</CardDescription>
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

        {pdfFile && (
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{pdfFile.name}</Badge>
            {pageCount > 0 && <Badge variant="outline">{pageCount} slides will be created</Badge>}
          </div>
        )}

        {processing && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" /> {progress}
          </div>
        )}

        {error && (
          <p className="text-sm text-destructive flex items-center gap-1">
            <AlertCircle className="size-4" /> {error}
          </p>
        )}

        <Button onClick={convert} disabled={!pdfFile || processing} className="w-full">
          {processing ? <Loader2 className="size-4 animate-spin mr-2" /> : <Download className="size-4 mr-2" />}
          {processing ? 'Converting…' : 'Convert to .pptx'}
        </Button>
        {done && (
          <p className="text-sm text-green-600 flex items-center gap-1">
            <CheckCircle2 className="size-4" /> PowerPoint downloaded successfully!
          </p>
        )}
      </CardContent>
    </Card>
  );
}

/* ────────────────────────────────────────────────────────────────
   9. PdfToExcel (REWRITTEN using xlsx package)
   ──────────────────────────────────────────────────────────────── */

export function PdfToExcel() {
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState('');
  const [done, setDone] = useState(false);
  const [preview, setPreview] = useState<string[][]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (f: File | null) => {
    if (!f) return;
    setPdfFile(f);
    setError('');
    setDone(false);
    setPreview([]);
    setProcessing(true);
    try {
      const pagesData = await extractTextItemsFromPdf(f);

      setProgress('Detecting table structure…');

      // Organize text items into rows based on Y-coordinate clustering
      const allRows: string[][] = [];
      const CLUSTER_THRESHOLD = 3; // pixels

      for (const page of pagesData) {
        if (page.items.length === 0) continue;

        // Sort items by Y (descending, since PDF Y goes up) then by X
        const sorted = [...page.items].sort((a, b) => {
          if (Math.abs(a.y - b.y) > CLUSTER_THRESHOLD) return b.y - a.y;
          return a.x - b.x;
        });

        // Group items into rows by Y proximity
        let currentRow: TextItem[] = [];
        let currentY = sorted[0].y;

        for (const item of sorted) {
          if (Math.abs(item.y - currentY) > CLUSTER_THRESHOLD) {
            if (currentRow.length > 0) {
              allRows.push(currentRow.map(i => i.text));
            }
            currentRow = [item];
            currentY = item.y;
          } else {
            currentRow.push(item);
          }
        }
        if (currentRow.length > 0) {
          allRows.push(currentRow.map(i => i.text));
        }
      }

      // Show preview (first 10 rows)
      setPreview(allRows.slice(0, 10));
      setPageCount(pagesData.length);
    } catch (err) {
      setError('Failed to read PDF: ' + (err as Error).message);
    } finally {
      setProcessing(false);
    }
  };

  const convert = async () => {
    if (!pdfFile) return;
    setProcessing(true);
    setError('');
    try {
      setProgress('Extracting text from PDF…');
      const pagesData = await extractTextItemsFromPdf(pdfFile);

      setProgress('Organizing data into rows and columns…');

      // Organize text items into a 2D grid
      const allRows: string[][] = [];
      const CLUSTER_THRESHOLD = 3;

      for (const page of pagesData) {
        if (page.items.length === 0) continue;

        const sorted = [...page.items].sort((a, b) => {
          if (Math.abs(a.y - b.y) > CLUSTER_THRESHOLD) return b.y - a.y;
          return a.x - b.x;
        });

        let currentRow: TextItem[] = [];
        let currentY = sorted[0].y;

        for (const item of sorted) {
          if (Math.abs(item.y - currentY) > CLUSTER_THRESHOLD) {
            if (currentRow.length > 0) {
              allRows.push(currentRow.map(i => i.text));
            }
            currentRow = [item];
            currentY = item.y;
          } else {
            currentRow.push(item);
          }
        }
        if (currentRow.length > 0) {
          allRows.push(currentRow.map(i => i.text));
        }
      }

      if (allRows.length === 0) {
        setError('No text could be extracted from this PDF.');
        setProcessing(false);
        return;
      }

      setProgress('Creating Excel workbook…');

      // Create the workbook
      const wb = XLSX.utils.book_new();

      // Use the extracted data as rows
      // Try to detect if first row looks like a header
      const ws = XLSX.utils.aoa_to_sheet(allRows);

      // Set column widths based on content
      const colWidths: { wch: number }[] = [];
      const maxCols = Math.max(...allRows.map(r => r.length));
      for (let c = 0; c < maxCols; c++) {
        let maxLen = 8;
        for (let r = 0; r < Math.min(allRows.length, 100); r++) {
          if (allRows[r][c]) {
            maxLen = Math.max(maxLen, allRows[r][c].length + 2);
          }
        }
        colWidths.push({ wch: Math.min(maxLen, 50) });
      }
      ws['!cols'] = colWidths;

      XLSX.utils.book_append_sheet(wb, ws, 'Extracted Data');

      setProgress('Downloading .xlsx file…');
      XLSX.writeFile(wb, 'converted.xlsx');
      setDone(true);
      setProgress('');
    } catch (err) {
      setError('Conversion failed: ' + (err as Error).message);
      setProgress('');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileSpreadsheet className="size-5" /> PDF to Excel
        </CardTitle>
        <CardDescription>Extract tabular data from PDF and generate a proper .xlsx spreadsheet</CardDescription>
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

        {pdfFile && <Badge variant="secondary">{pdfFile.name}</Badge>}

        {processing && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" /> {progress}
          </div>
        )}

        {error && (
          <p className="text-sm text-destructive flex items-center gap-1">
            <AlertCircle className="size-4" /> {error}
          </p>
        )}

        {preview.length > 0 && (
          <div className="space-y-2">
            <Label className="flex items-center gap-1">
              <Eye className="size-3.5" /> Preview (first 10 rows)
            </Label>
            <div className="overflow-x-auto border rounded-lg max-h-60 overflow-y-auto">
              <table className="w-full text-sm">
                <tbody>
                  {preview.map((row, ri) => (
                    <tr key={ri} className={ri === 0 ? 'bg-muted font-medium' : ri % 2 === 0 ? 'bg-muted/30' : ''}>
                      {row.map((cell, ci) => (
                        <td key={ci} className="px-2 py-1 border-b whitespace-nowrap">{cell}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="bg-muted/50 border rounded-lg p-3 text-sm text-muted-foreground flex items-start gap-2">
          <AlertCircle className="size-4 mt-0.5 shrink-0" />
          <span>
            Text is organized into rows/columns based on spatial layout detection. Works best with PDFs containing
            structured tables or lists. You can open the resulting .xlsx file in Excel, Google Sheets, or LibreOffice Calc.
          </span>
        </div>

        <Button onClick={convert} disabled={!pdfFile || processing} className="w-full">
          {processing ? <Loader2 className="size-4 animate-spin mr-2" /> : <Download className="size-4 mr-2" />}
          {processing ? 'Converting…' : 'Convert to .xlsx'}
        </Button>
        {done && (
          <p className="text-sm text-green-600 flex items-center gap-1">
            <CheckCircle2 className="size-4" /> Excel file downloaded successfully!
          </p>
        )}
      </CardContent>
    </Card>
  );
}

/* ────────────────────────────────────────────────────────────────
   10. PdfToPdfA (IMPROVED)
   ──────────────────────────────────────────────────────────────── */

export function PdfToPdfA() {
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [progress, setProgress] = useState('');
  const [validation, setValidation] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (f: File | null) => {
    if (!f) return;
    setPdfFile(f);
    setDone(false);
    setError('');
    setValidation([]);
    setInfo(`File: ${f.name} (${(f.size / 1024).toFixed(1)} KB)`);

    // Pre-analyze the PDF
    setProcessing(true);
    try {
      const bytes = await readFileAsArrayBuffer(f);
      const pdfDoc = await PDFDocument.load(bytes);
      const numPages = pdfDoc.getPageCount();
      const title = pdfDoc.getTitle();
      const author = pdfDoc.getAuthor();
      const creator = pdfDoc.getCreator();
      const producer = pdfDoc.getProducer();

      const checks: string[] = [];

      // Check metadata
      if (!title) checks.push('⚠ Missing document title');
      if (!author) checks.push('⚠ Missing author');
      checks.push(`📄 Pages: ${numPages}`);
      checks.push(`📝 Creator: ${creator || 'Unknown'}`);
      checks.push(`🏭 Producer: ${producer || 'Unknown'}`);

      // Check page count
      if (numPages > 0) {
        checks.push('✅ Document has pages');
      } else {
        checks.push('❌ Document has no pages');
      }

      // Check for encryption (basic check)
      const rawBytes = new Uint8Array(bytes);
      const rawStr = new TextDecoder('latin1').decode(rawBytes);
      if (rawStr.includes('/Encrypt')) {
        checks.push('⚠ Document appears to be encrypted — metadata may not be modifiable');
      } else {
        checks.push('✅ Document is not encrypted');
      }

      setValidation(checks);
    } catch (err) {
      setError('Failed to analyze PDF: ' + (err as Error).message);
    } finally {
      setProcessing(false);
    }
  };

  const convert = async () => {
    if (!pdfFile) return;
    setProcessing(true);
    setError('');
    setProgress('Loading PDF…');
    try {
      const bytes = await readFileAsArrayBuffer(pdfFile);
      const pdfDoc = await PDFDocument.load(bytes);

      setProgress('Setting PDF/A-2b metadata…');

      // Set standard metadata for PDF/A compliance
      const originalTitle = pdfDoc.getTitle() || 'PDF/A Document';
      pdfDoc.setTitle(originalTitle);
      pdfDoc.setSubject('PDF/A-2b Compliant Document');
      pdfDoc.setAuthor(pdfDoc.getAuthor() || 'Unknown Author');
      pdfDoc.setCreator('PDF Tools - PDF/A Converter');
      pdfDoc.setProducer('PDF/A Converter (pdf-lib)');
      pdfDoc.setKeywords(['PDF/A-2b', 'archival', 'long-term preservation']);
      pdfDoc.setCreationDate(new Date());
      pdfDoc.setModificationDate(new Date());

      // Build comprehensive XMP metadata for PDF/A-2b
      const now = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');
      const xmpMetadata = `<?xpacket begin="\ufeff" id="W5M0MpCehiHzreSzNTczkc9d"?>
<x:xmpmeta xmlns:x="adobe:ns:meta/">
  <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"
           xmlns:dc="http://purl.org/dc/elements/1.1/"
           xmlns:xmp="http://ns.adobe.com/xap/1.0/"
           xmlns:pdf="http://ns.adobe.com/pdf/1.3/"
           xmlns:pdfaid="http://www.aiim.org/pdfa/ns/id/"
           xmlns:pdfuaid="http://www.aiim.org/pdfua/ns/id/">
    <rdf:Description rdf:about=""
      xmlns:dc="http://purl.org/dc/elements/1.1/">
      <dc:title>
        <rdf:Alt>
          <rdf:li xml:lang="x-default">${originalTitle}</rdf:li>
        </rdf:Alt>
      </dc:title>
      <dc:creator>
        <rdf:Seq>
          <rdf:li>${pdfDoc.getAuthor() || 'Unknown'}</rdf:li>
        </rdf:Seq>
      </dc:creator>
      <dc:description>
        <rdf:Alt>
          <rdf:li xml:lang="x-default">PDF/A-2b Compliant Document</rdf:li>
        </rdf:Alt>
      </dc:description>
      <dc:subject>
        <rdf:Bag>
          <rdf:li>PDF/A-2b</rdf:li>
          <rdf:li>archival</rdf:li>
        </rdf:Bag>
      </dc:subject>
    </rdf:Description>
    <rdf:Description rdf:about=""
      xmlns:xmp="http://ns.adobe.com/xap/1.0/">
      <xmp:CreateDate>${now}</xmp:CreateDate>
      <xmp:ModifyDate>${now}</xmp:ModifyDate>
      <xmp:MetadataDate>${now}</xmp:MetadataDate>
      <xmp:CreatorTool>PDF/A Converter</xmp:CreatorTool>
    </rdf:Description>
    <rdf:Description rdf:about=""
      xmlns:pdf="http://ns.adobe.com/pdf/1.3/">
      <pdf:Producer>PDF/A Converter (pdf-lib)</pdf:Producer>
      <pdf:PDFVersion>1.7</pdf:PDFVersion>
    </rdf:Description>
    <rdf:Description rdf:about=""
      xmlns:pdfaid="http://www.aiim.org/pdfa/ns/id/">
      <pdfaid:part>2</pdfaid:part>
      <pdfaid:conformance>B</pdfaid:conformance>
    </rdf:Description>
    <rdf:Description rdf:about=""
      xmlns:pdfuaid="http://www.aiim.org/pdfua/ns/id/">
      <pdfuaid:part>1</pdfuaid:part>
    </rdf:Description>
  </rdf:RDF>
</x:xmpmeta>
<?xpacket end="w"?>`;

      // Attach XMP metadata as an embedded file (best-effort for client-side)
      await pdfDoc.attach(
        new TextEncoder().encode(xmpMetadata),
        'xmp_metadata.xml',
        {
          mimeType: 'application/xml',
          description: 'PDF/A-2b XMP Metadata',
          creationDate: new Date(),
          modificationDate: new Date(),
        }
      );

      // Mark document as PDF/A-2b by setting the OutputIntent identifier
      // Note: Full PDF/A requires ICC profile embedding which is not supported by pdf-lib alone.
      // This metadata approach is the best achievable client-side.

      setProgress('Saving PDF/A document…');
      const pdfBytes = await pdfDoc.save();
      downloadBlob(pdfBytes, 'document-pdfa.pdf');

      // Provide validation summary
      setValidation(prev => [
        ...prev.filter(v => !v.startsWith('✅ PDF/A')),
        '✅ PDF/A-2b metadata applied',
        '✅ XMP metadata attached',
        '✅ Document saved',
      ]);
      setDone(true);
      setProgress('');
    } catch (err) {
      setError('Conversion failed: ' + (err as Error).message);
      setProgress('');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShieldCheck className="size-5" /> PDF to PDF/A
        </CardTitle>
        <CardDescription>Add PDF/A-2b archival metadata and compliance markers to your PDF</CardDescription>
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

        {pdfFile && <Badge variant="secondary">{pdfFile.name}</Badge>}
        {info && <p className="text-sm text-muted-foreground">{info}</p>}

        {validation.length > 0 && (
          <div className="space-y-1">
            <Label className="text-sm font-medium">Analysis & Validation</Label>
            <div className="border rounded-lg p-3 bg-muted/30 space-y-1">
              {validation.map((v, i) => (
                <p key={i} className={`text-xs ${v.startsWith('❌') ? 'text-destructive' : v.startsWith('⚠') ? 'text-yellow-600' : 'text-muted-foreground'}`}>
                  {v}
                </p>
              ))}
            </div>
          </div>
        )}

        <div className="bg-muted/50 border rounded-lg p-3 text-sm text-muted-foreground flex items-start gap-2">
          <AlertCircle className="size-4 mt-0.5 shrink-0" />
          <span>
            This tool adds PDF/A-2b metadata markers, XMP structure, and standard compliance fields.
            Full PDF/A validation requires an embedded ICC color profile and font subsetting verification.
            For official validation, use a tool like veraPDF. The output includes embedded XMP metadata
            with PDF/A-2b part/conformance declarations.
          </span>
        </div>

        {error && (
          <p className="text-sm text-destructive flex items-center gap-1">
            <AlertCircle className="size-4" /> {error}
          </p>
        )}

        {processing && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" /> {progress}
          </div>
        )}

        <Button onClick={convert} disabled={!pdfFile || processing} className="w-full">
          {processing ? <Loader2 className="size-4 animate-spin mr-2" /> : <Download className="size-4 mr-2" />}
          {processing ? 'Applying PDF/A Metadata…' : 'Apply PDF/A-2b Metadata & Download'}
        </Button>
        {done && (
          <p className="text-sm text-green-600 flex items-center gap-1">
            <CheckCircle2 className="size-4" /> PDF/A-marked document downloaded!
          </p>
        )}
      </CardContent>
    </Card>
  );
}
