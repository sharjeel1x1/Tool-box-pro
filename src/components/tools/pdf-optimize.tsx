'use client';

import React, { useState, useRef, useCallback } from 'react';
import { PDFDocument } from 'pdf-lib';
import {
  Button,
} from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Upload,
  Download,
  FileText,
  Loader2,
  Minimize2,
  Wrench,
  Eye,
  CheckCircle2,
  AlertTriangle,
  X,
  ScanText,
  Copy,
  Settings2,
} from 'lucide-react';

/* ──────────────────────── Shared helpers ──────────────────────── */

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function downloadPdfBytes(bytes: Uint8Array, filename: string) {
  downloadBlob(new Blob([bytes], { type: 'application/pdf' }), filename);
}

function downloadTextFile(text: string, filename: string) {
  downloadBlob(new Blob([text], { type: 'text/plain;charset=utf-8' }), filename);
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function FileDropZone({
  accept,
  multiple,
  onFiles,
  label,
  id,
  disabled,
}: {
  accept: string;
  multiple: boolean;
  onFiles: (files: File[]) => void;
  label: string;
  id: string;
  disabled?: boolean;
}) {
  const [dragOver, setDragOver] = useState(false);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      if (disabled) return;
      setDragOver(false);
      const files = Array.from(e.dataTransfer.files);
      if (files.length) onFiles(files);
    },
    [onFiles, disabled]
  );

  return (
    <div
      onDragOver={(e) => {
        if (disabled) return;
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
        disabled
          ? 'cursor-not-allowed opacity-50 border-muted-foreground/15'
          : 'cursor-pointer'
      } ${
        dragOver && !disabled
          ? 'border-primary bg-primary/5'
          : !disabled
            ? 'border-muted-foreground/25 hover:border-muted-foreground/50'
            : ''
      }`}
      onClick={() => {
        if (!disabled) document.getElementById(id)?.click();
      }}
    >
      <Upload className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
      <p className="text-sm text-muted-foreground">
        Drag & drop {label} here, or{' '}
        <span className="text-primary underline">browse</span>
      </p>
      <input
        id={id}
        type="file"
        accept={accept}
        multiple={multiple}
        className="hidden"
        onChange={(e) => {
          if (e.target.files) onFiles(Array.from(e.target.files));
        }}
      />
    </div>
  );
}

/**
 * Dynamically loads pdfjs-dist and configures the worker.
 * Must be called at the top of any async function that uses pdf.js.
 */
async function getPdfjs() {
  const pdfjsLib = await import('pdfjs-dist');
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url,
  ).toString();
  return pdfjsLib;
}

/* ──────────────────────────────────────────────────────────────── */
/* 1. PdfCompress – Canvas re-rendering for real compression       */
/* ──────────────────────────────────────────────────────────────── */

const QUALITY_PRESETS = {
  high: { label: 'High Quality', scale: 0.85, jpegQuality: 0.82 },
  medium: { label: 'Balanced', scale: 0.65, jpegQuality: 0.65 },
  low: { label: 'Maximum Compression', scale: 0.45, jpegQuality: 0.45 },
} as const;

type QualityPreset = keyof typeof QUALITY_PRESETS;

export function PdfCompress() {
  const [file, setFile] = useState<File | null>(null);
  const [originalSize, setOriginalSize] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultBytes, setResultBytes] = useState<Uint8Array | null>(null);
  const [compressStats, setCompressStats] = useState<{
    original: number;
    compressed: number;
    reduction: string;
    pageCount: number;
  } | null>(null);
  const [quality, setQuality] = useState<QualityPreset>('medium');
  const [progress, setProgress] = useState(0);
  const [progressLabel, setProgressLabel] = useState('');
  const idRef = useRef('compress-input');

  const handleFile = useCallback((files: File[]) => {
    if (!files.length) return;
    const f = files[0];
    setFile(f);
    setOriginalSize(f.size);
    setError(null);
    setResultBytes(null);
    setCompressStats(null);
    setProgress(0);
    setProgressLabel('');
  }, []);

  const compressPdf = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    setProgress(0);
    setProgressLabel('Loading PDF engine...');

    try {
      const pdfjsLib = await getPdfjs();
      const arrayBuffer = await file.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) });
      const pdfDoc = await loadingTask.promise;
      const pageCount = pdfDoc.numPages;

      setProgressLabel(`Processing ${pageCount} pages...`);

      const newPdf = await PDFDocument.create();
      let failedPages = 0;

      for (let i = 1; i <= pageCount; i++) {
        setProgressLabel(`Rendering page ${i} of ${pageCount}...`);
        setProgress(Math.round(((i - 1) / pageCount) * 90));

        try {
          const page = await pdfDoc.getPage(i);
          const viewport = page.getViewport({ scale: QUALITY_PRESETS[quality].scale });

          // Create offscreen canvas
          const canvas = document.createElement('canvas');
          canvas.width = Math.floor(viewport.width);
          canvas.height = Math.floor(viewport.height);
          const ctx = canvas.getContext('2d');
          if (!ctx) throw new Error('Cannot get canvas 2D context');

          // Render page to canvas
          await page.render({
            canvasContext: ctx,
            viewport,
          }).promise;

          // Convert canvas to JPEG blob
          const jpegQuality = QUALITY_PRESETS[quality].jpegQuality;
          const dataUrl = canvas.toDataURL('image/jpeg', jpegQuality);

          // Strip base64 prefix and embed into new PDF
          const base64 = dataUrl.replace(/^data:image\/jpeg;base64,/, '');
          const jpegBytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
          const jpegImage = await newPdf.embedJpg(jpegBytes);

          // Calculate page size (use original dimensions at scale=1 for better sizing)
          const origViewport = page.getViewport({ scale: 1 });
          const newPage = newPdf.addPage([origViewport.width, origViewport.height]);
          newPage.drawImage(jpegImage, {
            x: 0,
            y: 0,
            width: origViewport.width,
            height: origViewport.height,
          });

          // Clean up
          canvas.width = 0;
          canvas.height = 0;
        } catch (pageErr) {
          console.error(`Failed to compress page ${i}:`, pageErr);
          failedPages++;
        }
      }

      setProgressLabel('Generating compressed PDF...');
      setProgress(95);

      const compressedBytes = await newPdf.save();
      pdfDoc.destroy();

      setProgress(100);
      setProgressLabel('Complete');

      setResultBytes(compressedBytes);
      const reduction =
        originalSize > 0
          ? (((originalSize - compressedBytes.length) / originalSize) * 100).toFixed(1)
          : '0';

      setCompressStats({
        original: originalSize,
        compressed: compressedBytes.length,
        reduction,
        pageCount: pageCount - failedPages,
      });

      if (failedPages > 0) {
        setError(
          `${failedPages} page(s) could not be processed and were skipped.`,
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to compress PDF');
    } finally {
      setLoading(false);
    }
  };

  const currentPreset = QUALITY_PRESETS[quality];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Minimize2 className="h-5 w-5" /> Compress PDF
        </CardTitle>
        <CardDescription>
          Reduce PDF file size by re-rendering pages as compressed JPEG images.
          Typically achieves 50–80% size reduction.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Quality selector */}
        <div className="space-y-2">
          <Label className="flex items-center gap-1.5">
            <Settings2 className="h-4 w-4" /> Compression Quality
          </Label>
          <div className="grid grid-cols-3 gap-2">
            {(Object.entries(QUALITY_PRESETS) as [QualityPreset, (typeof QUALITY_PRESETS)[QualityPreset]][]).map(
              ([key, preset]) => (
                <button
                  key={key}
                  type="button"
                  disabled={loading}
                  onClick={() => setQuality(key)}
                  className={`rounded-md border px-3 py-2 text-left transition-colors ${
                    quality === key
                      ? 'border-primary bg-primary/10 ring-1 ring-primary'
                      : 'border-border hover:border-muted-foreground/50'
                  } ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  <p className="text-sm font-medium">{preset.label}</p>
                  <p className="text-xs text-muted-foreground">
                    {Math.round(preset.scale * 100)}% resolution
                  </p>
                </button>
              ),
            )}
          </div>
        </div>

        <FileDropZone
          accept=".pdf"
          multiple={false}
          onFiles={handleFile}
          label="a PDF file"
          id={idRef.current}
          disabled={loading}
        />

        {file && (
          <div className="rounded-md border bg-muted/50 px-3 py-2 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="truncate max-w-[200px]">{file.name}</span>
            </div>
            <span className="text-xs text-muted-foreground">
              {formatBytes(originalSize)}
            </span>
          </div>
        )}

        {loading && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{progressLabel}</span>
              <span className="text-muted-foreground">{progress}%</span>
            </div>
            <Progress value={progress} />
          </div>
        )}

        {error && (
          <div className="flex items-start gap-2 text-sm text-amber-600 dark:text-amber-400 bg-amber-500/10 rounded-md px-3 py-2">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <div className="flex gap-2">
          <Button onClick={compressPdf} disabled={loading || !file}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Compressing...
              </>
            ) : (
              <>
                <Minimize2 className="h-4 w-4" /> Compress
              </>
            )}
          </Button>
          {file && (
            <Button
              variant="outline"
              onClick={() => {
                setFile(null);
                setOriginalSize(0);
                setResultBytes(null);
                setCompressStats(null);
                setError(null);
                setProgress(0);
                setProgressLabel('');
              }}
            >
              Clear
            </Button>
          )}
        </div>

        {compressStats && resultBytes && (
          <div className="rounded-md border bg-emerald-500/10 p-4 space-y-3">
            <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" /> Compression complete!
            </p>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="rounded-md border bg-background p-3">
                <p className="text-xs text-muted-foreground mb-1">Original</p>
                <p className="text-sm font-semibold">
                  {formatBytes(compressStats.original)}
                </p>
              </div>
              <div className="rounded-md border bg-background p-3">
                <p className="text-xs text-muted-foreground mb-1">Compressed</p>
                <p className="text-sm font-semibold">
                  {formatBytes(compressStats.compressed)}
                </p>
              </div>
              <div className="rounded-md border bg-background p-3">
                <p className="text-xs text-muted-foreground mb-1">Reduction</p>
                <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                  {Number(compressStats.reduction) > 0
                    ? `${compressStats.reduction}%`
                    : 'N/A'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Badge variant="secondary">
                {compressStats.pageCount} pages
              </Badge>
              <span>Quality: {currentPreset.label}</span>
            </div>
            <Button
              onClick={() =>
                downloadPdfBytes(
                  resultBytes,
                  file?.name?.replace('.pdf', '-compressed.pdf') ??
                    'compressed.pdf',
                )
              }
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              <Download className="h-4 w-4" /> Download Compressed PDF
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* ──────────────────────────────────────────────────────────────── */
/* 2. PdfRepair – Page-by-page rebuild to fix corruption          */
/* ──────────────────────────────────────────────────────────────── */

export function PdfRepair() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultBytes, setResultBytes] = useState<Uint8Array | null>(null);
  const [repairStatus, setRepairStatus] = useState<
    'idle' | 'success' | 'repaired' | 'failed'
  >('idle');
  const [repairMessage, setRepairMessage] = useState<string>('');
  const [progress, setProgress] = useState(0);
  const [progressLabel, setProgressLabel] = useState('');
  const [pageDetails, setPageDetails] = useState<{
    total: number;
    copied: number;
    skipped: number;
  } | null>(null);
  const idRef = useRef('repair-input');

  const handleFile = useCallback((files: File[]) => {
    if (!files.length) return;
    setFile(files[0]);
    setError(null);
    setResultBytes(null);
    setRepairStatus('idle');
    setRepairMessage('');
    setProgress(0);
    setProgressLabel('');
    setPageDetails(null);
  }, []);

  const repairPdf = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    setRepairStatus('idle');
    setRepairMessage('');
    setProgress(0);
    setPageDetails(null);

    try {
      const arrayBuffer = await file.arrayBuffer();
      let copiedPages = 0;
      let skippedPages = 0;
      let totalOriginal = 0;

      // ── Strategy 1: Rebuild using pdf.js + pdf-lib (most robust) ──
      setProgressLabel('Loading PDF engine...');
      try {
        const pdfjsLib = await getPdfjs();
        setProgressLabel('Analyzing PDF structure...');

        const loadingTask = pdfjsLib.getDocument({
          data: new Uint8Array(arrayBuffer),
          cMapUrl: 'https://unpkg.com/pdfjs-dist@5.6.205/cmaps/',
          cMapPacked: true,
        });
        const srcPdf = await loadingTask.promise;
        totalOriginal = srcPdf.numPages;

        setProgressLabel(`Rebuilding ${totalOriginal} pages...`);

        // Create a fresh PDF and copy each page as a rasterized image
        const newPdf = await PDFDocument.create();

        for (let i = 1; i <= totalOriginal; i++) {
          setProgressLabel(`Rebuilding page ${i} of ${totalOriginal}...`);
          setProgress(Math.round(((i - 1) / totalOriginal) * 85));

          try {
            const page = await srcPdf.getPage(i);
            const viewport = page.getViewport({ scale: 1.5 });

            const canvas = document.createElement('canvas');
            canvas.width = Math.floor(viewport.width);
            canvas.height = Math.floor(viewport.height);
            const ctx = canvas.getContext('2d');
            if (!ctx) throw new Error('No canvas context');

            await page.render({ canvasContext: ctx, viewport }).promise;

            const dataUrl = canvas.toDataURL('image/png');
            const base64 = dataUrl.replace(/^data:image\/png;base64,/, '');
            const pngBytes = Uint8Array.from(atob(base64), (c) =>
              c.charCodeAt(0),
            );
            const pngImage = await newPdf.embedPng(pngBytes);

            const origViewport = page.getViewport({ scale: 1 });
            const newPage = newPdf.addPage([
              origViewport.width,
              origViewport.height,
            ]);
            newPage.drawImage(pngImage, {
              x: 0,
              y: 0,
              width: origViewport.width,
              height: origViewport.height,
            });

            canvas.width = 0;
            canvas.height = 0;
            copiedPages++;
          } catch (pageErr) {
            console.error(`Page ${i} error:`, pageErr);
            skippedPages++;
          }
        }

        srcPdf.destroy();

        setProgressLabel('Saving repaired PDF...');
        setProgress(90);
        const repairedBytes = await newPdf.save();
        setProgress(100);

        setResultBytes(repairedBytes);
        setPageDetails({
          total: totalOriginal,
          copied: copiedPages,
          skipped: skippedPages,
        });

        if (skippedPages === 0) {
          setRepairStatus('success');
          setRepairMessage(
            `PDF successfully rebuilt with all ${copiedPages} page(s). The file structure has been cleaned and optimized.`,
          );
        } else {
          setRepairStatus('repaired');
          setRepairMessage(
            `PDF rebuilt: ${copiedPages} of ${totalOriginal} pages recovered. ${skippedPages} page(s) were too damaged to process and were skipped.`,
          );
        }
        return; // Success – skip Strategy 2
      } catch (pdfjsErr) {
        console.warn('pdf.js approach failed, trying pdf-lib fallback:', pdfjsErr);
      }

      // ── Strategy 2: Fallback – copy pages with pdf-lib only ──
      setProgressLabel('Attempting structural repair...');
      setProgress(20);

      try {
        const pdfDoc = await PDFDocument.load(arrayBuffer, {
          ignoreEncryption: true,
          updateMetadata: false,
        });
        totalOriginal = pdfDoc.getPageCount();
        setProgressLabel(`Copying ${totalOriginal} pages to new document...`);

        const newPdf = await PDFDocument.create();
        const pageIndices = Array.from({ length: totalOriginal }, (_, i) => i);
        const copied = await newPdf.copyPages(pdfDoc, pageIndices);

        for (let i = 0; i < copied.length; i++) {
          setProgressLabel(`Copying page ${i + 1} of ${totalOriginal}...`);
          setProgress(20 + Math.round((i / totalOriginal) * 60));
          try {
            // Force access to validate page structure
            copied[i].getWidth();
            copied[i].getHeight();
            newPdf.addPage(copied[i]);
            copiedPages++;
          } catch {
            skippedPages++;
          }
        }

        setProgressLabel('Saving repaired PDF...');
        setProgress(90);
        const repairedBytes = await newPdf.save({
          useObjectStreams: true,
          addDefaultPage: false,
        });
        setProgress(100);

        setResultBytes(repairedBytes);
        setPageDetails({
          total: totalOriginal,
          copied: copiedPages,
          skipped: skippedPages,
        });

        if (skippedPages === 0) {
          setRepairStatus('success');
          setRepairMessage(
            `PDF successfully rebuilt with all ${copiedPages} page(s). Structure cleaned and optimized.`,
          );
        } else {
          setRepairStatus('repaired');
          setRepairMessage(
            `Partial repair: ${copiedPages} of ${totalOriginal} pages recovered. ${skippedPages} damaged page(s) skipped.`,
          );
        }
      } catch (libErr) {
        setRepairStatus('failed');
        setRepairMessage(
          libErr instanceof Error
            ? `Repair failed: ${libErr.message}. The PDF may be too severely corrupted.`
            : 'The PDF file is too corrupted to repair.',
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to read file');
    } finally {
      setLoading(false);
    }
  };

  const statusIcon = {
    success: <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />,
    repaired: <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />,
    failed: <X className="h-5 w-5 text-destructive shrink-0 mt-0.5" />,
  };

  const statusColors = {
    success: 'bg-emerald-500/10 border-emerald-500/20',
    repaired: 'bg-amber-500/10 border-amber-500/20',
    failed: 'bg-destructive/10 border-destructive/20',
  };

  const textColors = {
    success: 'text-emerald-700 dark:text-emerald-400',
    repaired: 'text-amber-700 dark:text-amber-400',
    failed: 'text-destructive',
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wrench className="h-5 w-5" /> Repair PDF
        </CardTitle>
        <CardDescription>
          Fix damaged or corrupted PDFs by rebuilding the file structure page
          by page. Handles broken cross-references, invalid objects, and
          encoding issues.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <FileDropZone
          accept=".pdf"
          multiple={false}
          onFiles={handleFile}
          label="a damaged PDF file"
          id={idRef.current}
          disabled={loading}
        />

        {file && (
          <div className="rounded-md border bg-muted/50 px-3 py-2 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="truncate max-w-[200px]">{file.name}</span>
            </div>
            <span className="text-xs text-muted-foreground">
              {formatBytes(file.size)}
            </span>
          </div>
        )}

        {loading && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{progressLabel}</span>
              <span className="text-muted-foreground">{progress}%</span>
            </div>
            <Progress value={progress} />
          </div>
        )}

        {error && (
          <p className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">
            {error}
          </p>
        )}

        <div className="flex gap-2">
          <Button onClick={repairPdf} disabled={loading || !file}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Repairing...
              </>
            ) : (
              <>
                <Wrench className="h-4 w-4" /> Repair
              </>
            )}
          </Button>
          {file && (
            <Button
              variant="outline"
              onClick={() => {
                setFile(null);
                setResultBytes(null);
                setRepairStatus('idle');
                setRepairMessage('');
                setError(null);
                setProgress(0);
                setProgressLabel('');
                setPageDetails(null);
              }}
            >
              Clear
            </Button>
          )}
        </div>

        {repairStatus !== 'idle' && repairMessage && (
          <div
            className={`rounded-md border p-4 space-y-3 ${
              statusColors[repairStatus]
            }`}
          >
            <div className="flex items-start gap-2">
              {statusIcon[repairStatus]}
              <p className={`text-sm ${textColors[repairStatus]}`}>
                {repairMessage}
              </p>
            </div>

            {pageDetails && (
              <div className="flex items-center gap-3 text-xs">
                <Badge variant="secondary">{pageDetails.total} total pages</Badge>
                <Badge variant="outline">{pageDetails.copied} recovered</Badge>
                {pageDetails.skipped > 0 && (
                  <Badge variant="destructive">
                    {pageDetails.skipped} skipped
                  </Badge>
                )}
              </div>
            )}

            {resultBytes && (repairStatus === 'success' || repairStatus === 'repaired') && (
              <Button
                onClick={() =>
                  downloadPdfBytes(
                    resultBytes,
                    file?.name?.replace('.pdf', '-repaired.pdf') ??
                      'repaired.pdf',
                  )
                }
                className={
                  repairStatus === 'success'
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-amber-600 hover:bg-amber-700'
                }
              >
                <Download className="h-4 w-4" /> Download Repaired PDF
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* ──────────────────────────────────────────────────────────────── */
/* 3. PdfOcr – PDF → canvas → Tesseract.js → text                 */
/* ──────────────────────────────────────────────────────────────── */

export function PdfOcr() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressLabel, setProgressLabel] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [extractedText, setExtractedText] = useState<string>('');
  const [pageCount, setPageCount] = useState<number>(0);
  const [ocrLang, setOcrLang] = useState<string>('eng');
  const idRef = useRef('ocr-input');

  const handleFile = useCallback((files: File[]) => {
    if (!files.length) return;
    const f = files[0];
    if (f.type !== 'application/pdf') {
      setError('Please upload a PDF file.');
      return;
    }
    setFile(f);
    setError(null);
    setExtractedText('');
    setProgress(0);
    setProgressLabel('');
    setPageCount(0);
  }, []);

  const runOcr = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    setExtractedText('');
    setProgress(0);

    try {
      // Step 1: Load PDF with pdf.js
      setProgressLabel('Loading PDF engine...');
      const pdfjsLib = await getPdfjs();

      const arrayBuffer = await file.arrayBuffer();
      setProgressLabel('Opening PDF...');
      const loadingTask = pdfjsLib.getDocument({
        data: new Uint8Array(arrayBuffer),
        cMapUrl: 'https://unpkg.com/pdfjs-dist@5.6.205/cmaps/',
        cMapPacked: true,
      });
      const pdfDoc = await loadingTask.promise;
      const numPages = pdfDoc.numPages;
      setPageCount(numPages);

      // Step 2: Process each page
      const allText: string[] = [];
      const totalSteps = numPages + 1; // +1 for initialization

      for (let i = 1; i <= numPages; i++) {
        setProgressLabel(
          `OCR page ${i} of ${numPages} – loading...`,
        );
        setProgress(Math.round(((i - 0.5) / totalSteps) * 100));

        try {
          const page = await pdfDoc.getPage(i);
          const viewport = page.getViewport({ scale: 2.0 }); // Higher scale for better OCR

          // Render to canvas
          const canvas = document.createElement('canvas');
          canvas.width = Math.floor(viewport.width);
          canvas.height = Math.floor(viewport.height);
          const ctx = canvas.getContext('2d');
          if (!ctx) throw new Error('Cannot get canvas 2D context');

          await page.render({ canvasContext: ctx, viewport }).promise;

          setProgressLabel(
            `OCR page ${i} of ${numPages} – recognizing text...`,
          );

          // Step 3: Run Tesseract on the canvas
          const Tesseract = (await import('tesseract.js')).default;
          const result = await Tesseract.recognize(canvas, ocrLang, {
            logger: (m: { status: string; progress: number }) => {
              if (m.status === 'recognizing text') {
                const pageProgress = m.progress || 0;
                const overallProgress =
                  ((i - 1 + pageProgress) / totalSteps) * 100;
                setProgress(Math.round(overallProgress));
                setProgressLabel(
                  `OCR page ${i} of ${numPages} – ${Math.round(pageProgress * 100)}%`,
                );
              }
            },
          });

          const pageText = result.data.text.trim();
          if (pageText) {
            allText.push(`--- Page ${i} ---\n${pageText}`);
          }

          // Clean up
          canvas.width = 0;
          canvas.height = 0;
        } catch (pageErr) {
          console.error(`OCR failed for page ${i}:`, pageErr);
          allText.push(`--- Page ${i} ---\n[Error: Could not process this page]`);
        }
      }

      pdfDoc.destroy();
      setProgress(100);
      setProgressLabel('Complete');
      setExtractedText(allText.join('\n\n'));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'OCR processing failed');
    } finally {
      setLoading(false);
    }
  };

  const baseFileName = file?.name?.replace(/\.pdf$/i, '') ?? 'ocr-result';

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ScanText className="h-5 w-5" /> OCR – Extract Text from PDF
        </CardTitle>
        <CardDescription>
          Extract text from scanned PDFs or image-based documents using OCR.
          Each page is rendered and processed with Tesseract.js.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Language selector */}
        <div className="space-y-2">
          <Label className="flex items-center gap-1.5">
            <Eye className="h-4 w-4" /> OCR Language
          </Label>
          <div className="flex gap-2">
            {[
              { code: 'eng', label: 'English' },
              { code: 'chi_sim', label: 'Chinese (Simplified)' },
              { code: 'chi_tra', label: 'Chinese (Traditional)' },
              { code: 'jpn', label: 'Japanese' },
              { code: 'kor', label: 'Korean' },
            ].map((lang) => (
              <button
                key={lang.code}
                type="button"
                disabled={loading}
                onClick={() => setOcrLang(lang.code)}
                className={`rounded-md border px-3 py-1.5 text-xs transition-colors ${
                  ocrLang === lang.code
                    ? 'border-primary bg-primary/10 ring-1 ring-primary font-medium'
                    : 'border-border hover:border-muted-foreground/50'
                } ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                {lang.label}
              </button>
            ))}
          </div>
        </div>

        <FileDropZone
          accept=".pdf"
          multiple={false}
          onFiles={handleFile}
          label="a PDF file"
          id={idRef.current}
          disabled={loading}
        />

        {file && (
          <div className="rounded-md border bg-muted/50 px-3 py-2 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="truncate max-w-[200px]">{file.name}</span>
            </div>
            <span className="text-xs text-muted-foreground">
              {formatBytes(file.size)}
            </span>
          </div>
        )}

        {loading && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{progressLabel}</span>
              <span className="text-muted-foreground">{progress}%</span>
            </div>
            <Progress value={progress} />
          </div>
        )}

        {error && (
          <p className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">
            {error}
          </p>
        )}

        <div className="flex flex-wrap gap-2">
          <Button onClick={runOcr} disabled={loading || !file}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Processing...
              </>
            ) : (
              <>
                <ScanText className="h-4 w-4" /> Run OCR
              </>
            )}
          </Button>
          {file && (
            <Button
              variant="outline"
              onClick={() => {
                setFile(null);
                setExtractedText('');
                setProgress(0);
                setProgressLabel('');
                setError(null);
                setPageCount(0);
              }}
            >
              Clear
            </Button>
          )}
        </div>

        {extractedText && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                Extracted Text
                <Badge variant="secondary">{pageCount} pages</Badge>
              </Label>
            </div>
            <Textarea
              value={extractedText}
              readOnly
              rows={10}
              className="font-mono text-sm resize-y max-h-96"
            />
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  navigator.clipboard.writeText(extractedText);
                }}
              >
                <Copy className="h-4 w-4" /> Copy Text
              </Button>
              <Button
                onClick={() =>
                  downloadTextFile(extractedText, `${baseFileName}.txt`)
                }
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                <Download className="h-4 w-4" /> Download as .txt
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
