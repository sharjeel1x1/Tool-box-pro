'use client';

import React, { useState, useRef, useCallback } from 'react';
import { PDFDocument } from 'pdf-lib';
import JSZip from 'jszip';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  Trash2,
  ArrowUp,
  ArrowDown,
  Camera,
  X,
  Plus,
  Merge,
  Scissors,
  FileMinus,
  FileOutput,
  Move,
  Scan,
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
  const blob = new Blob([bytes], { type: 'application/pdf' });
  downloadBlob(blob, filename);
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/** Drag-and-drop styled file upload area */
function FileDropZone({
  accept,
  multiple,
  onFiles,
  label,
  id,
}: {
  accept: string;
  multiple: boolean;
  onFiles: (files: File[]) => void;
  label: string;
  id: string;
}) {
  const [dragOver, setDragOver] = useState(false);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const files = Array.from(e.dataTransfer.files).filter((f) =>
        f.name.toLowerCase().endsWith(accept.replace('/*', '').replace('.', ''))
      );
      if (accept.includes('pdf') && accept.includes('image')) {
        const filtered = Array.from(e.dataTransfer.files);
        if (filtered.length) onFiles(filtered);
      } else if (files.length) {
        onFiles(files);
      }
    },
    [accept, onFiles]
  );

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
        dragOver
          ? 'border-primary bg-primary/5'
          : 'border-muted-foreground/25 hover:border-muted-foreground/50'
      }`}
      onClick={() => document.getElementById(id)?.click()}
    >
      <Upload className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
      <p className="text-sm text-muted-foreground">
        Drag & drop {label} here, or <span className="text-primary underline">browse</span>
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

/* ──────────────────────────────────────────────────────────────── */
/* 1. PdfMerge                                                     */
/* ──────────────────────────────────────────────────────────────── */

export function PdfMerge() {
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultBytes, setResultBytes] = useState<Uint8Array | null>(null);
  const idRef = useRef('merge-input');

  const handleFiles = useCallback((newFiles: File[]) => {
    setFiles((prev) => [...prev, ...newFiles]);
    setError(null);
    setResultBytes(null);
  }, []);

  const removeFile = useCallback((index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const mergePdfs = async () => {
    if (files.length < 2) {
      setError('Please add at least 2 PDF files to merge.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const mergedPdf = await PDFDocument.create();
      for (const file of files) {
        const bytes = await file.arrayBuffer();
        const pdf = await PDFDocument.load(bytes);
        const pages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
        pages.forEach((page) => mergedPdf.addPage(page));
      }
      const result = await mergedPdf.save();
      setResultBytes(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to merge PDFs');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Merge className="h-5 w-5" /> Merge PDFs
        </CardTitle>
        <CardDescription>Combine multiple PDF files into one document</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <FileDropZone
          accept=".pdf"
          multiple
          onFiles={handleFiles}
          label="PDF files"
          id={idRef.current}
        />

        {files.length > 0 && (
          <div className="space-y-2">
            <Label>Files to merge ({files.length})</Label>
            <div className="max-h-48 overflow-y-auto space-y-1">
              {files.map((file, i) => (
                <div
                  key={`${file.name}-${i}`}
                  className="flex items-center justify-between rounded-md border bg-muted/50 px-3 py-2"
                >
                  <div className="flex items-center gap-2 text-sm">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="truncate max-w-[200px]">{file.name}</span>
                    <span className="text-xs text-muted-foreground">
                      ({formatBytes(file.size)})
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => removeFile(i)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {error && (
          <p className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">
            {error}
          </p>
        )}

        <div className="flex gap-2">
          <Button onClick={mergePdfs} disabled={loading || files.length < 2}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Merging...
              </>
            ) : (
              <>
                <Merge className="h-4 w-4" /> Merge
              </>
            )}
          </Button>
          {files.length > 0 && (
            <Button variant="outline" onClick={() => { setFiles([]); setResultBytes(null); setError(null); }}>
              Clear
            </Button>
          )}
        </div>

        {resultBytes && (
          <div className="rounded-md border bg-emerald-500/10 p-4 space-y-2">
            <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
              Merge complete! ({formatBytes(resultBytes.length)})
            </p>
            <Button
              onClick={() => downloadPdfBytes(resultBytes, 'merged.pdf')}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              <Download className="h-4 w-4" /> Download Merged PDF
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* ──────────────────────────────────────────────────────────────── */
/* 2. PdfSplit                                                     */
/* ──────────────────────────────────────────────────────────────── */

function parsePageRanges(rangeStr: string, maxPage: number): number[][] {
  const ranges: number[][] = [];
  const parts = rangeStr.split(',').map((s) => s.trim()).filter(Boolean);
  for (const part of parts) {
    if (part.includes('-')) {
      const [a, b] = part.split('-').map(Number);
      if (isNaN(a) || isNaN(b) || a < 1 || b > maxPage || a > b) {
        throw new Error(`Invalid range: ${part}`);
      }
      const pages: number[] = [];
      for (let i = a; i <= b; i++) pages.push(i);
      ranges.push(pages);
    } else {
      const n = Number(part);
      if (isNaN(n) || n < 1 || n > maxPage) {
        throw new Error(`Invalid page number: ${part}`);
      }
      ranges.push([n]);
    }
  }
  return ranges;
}

export function PdfSplit() {
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState<number>(0);
  const [rangeStr, setRangeStr] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<{ name: string; bytes: Uint8Array }[]>([]);
  const idRef = useRef('split-input');

  const handleFile = useCallback(async (files: File[]) => {
    if (!files.length) return;
    const f = files[0];
    setFile(f);
    setError(null);
    setResults([]);
    try {
      const bytes = await f.arrayBuffer();
      const pdf = await PDFDocument.load(bytes);
      setPageCount(pdf.getPageCount());
    } catch {
      setError('Invalid or corrupted PDF file.');
      setPageCount(0);
    }
  }, []);

  const splitPdf = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    try {
      const bytes = await file.arrayBuffer();
      const srcPdf = await PDFDocument.load(bytes);
      const ranges = parsePageRanges(rangeStr, pageCount);
      const outputs: { name: string; bytes: Uint8Array }[] = [];

      for (let i = 0; i < ranges.length; i++) {
        const newPdf = await PDFDocument.create();
        const indices = ranges[i].map((p) => p - 1);
        const pages = await newPdf.copyPages(srcPdf, indices);
        pages.forEach((page) => newPdf.addPage(page));
        const result = await newPdf.save();
        const rangeLabel =
          ranges[i].length === 1
            ? `page-${ranges[i][0]}`
            : `pages-${ranges[i][0]}-${ranges[i][ranges[i].length - 1]}`;
        outputs.push({ name: `${rangeLabel}.pdf`, bytes: result });
      }
      setResults(outputs);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to split PDF');
    } finally {
      setLoading(false);
    }
  };

  const downloadAllAsZip = async () => {
    const zip = new JSZip();
    for (const r of results) {
      zip.file(r.name, r.bytes);
    }
    const blob = await zip.generateAsync({ type: 'blob' });
    downloadBlob(blob, 'split-pdfs.zip');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Scissors className="h-5 w-5" /> Split PDF
        </CardTitle>
        <CardDescription>Split a PDF into separate files by page ranges</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <FileDropZone
          accept=".pdf"
          multiple={false}
          onFiles={handleFile}
          label="a PDF file"
          id={idRef.current}
        />

        {file && (
          <div className="rounded-md border bg-muted/50 px-3 py-2 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="truncate max-w-[200px]">{file.name}</span>
            </div>
            <span className="text-xs text-muted-foreground">{pageCount} pages</span>
          </div>
        )}

        {pageCount > 0 && (
          <div className="space-y-2">
            <Label htmlFor="split-range">Page ranges (e.g. 1-3, 5, 7-10)</Label>
            <Input
              id="split-range"
              placeholder={`1-${Math.min(3, pageCount)}, ${Math.min(5, pageCount)}`}
              value={rangeStr}
              onChange={(e) => setRangeStr(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Total pages: {pageCount}. Separate ranges with commas.
            </p>
          </div>
        )}

        {error && (
          <p className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">
            {error}
          </p>
        )}

        <div className="flex gap-2">
          <Button onClick={splitPdf} disabled={loading || !file || !rangeStr.trim()}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Splitting...
              </>
            ) : (
              <>
                <Scissors className="h-4 w-4" /> Split
              </>
            )}
          </Button>
          {file && (
            <Button
              variant="outline"
              onClick={() => {
                setFile(null);
                setPageCount(0);
                setRangeStr('');
                setResults([]);
                setError(null);
              }}
            >
              Clear
            </Button>
          )}
        </div>

        {results.length > 0 && (
          <div className="rounded-md border bg-emerald-500/10 p-4 space-y-3">
            <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
              Split into {results.length} file{results.length > 1 ? 's' : ''}!
            </p>
            <div className="max-h-48 overflow-y-auto space-y-1">
              {results.map((r, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between rounded-md border bg-background px-3 py-2"
                >
                  <div className="flex items-center gap-2 text-sm">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span>{r.name}</span>
                    <span className="text-xs text-muted-foreground">
                      ({formatBytes(r.bytes.length)})
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => downloadPdfBytes(r.bytes, r.name)}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
            {results.length > 1 && (
              <Button
                onClick={downloadAllAsZip}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                <Download className="h-4 w-4" /> Download All as ZIP
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* ──────────────────────────────────────────────────────────────── */
/* 3. PdfRemovePages                                               */
/* ──────────────────────────────────────────────────────────────── */

export function PdfRemovePages() {
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState<number>(0);
  const [pagesToRemove, setPagesToRemove] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultBytes, setResultBytes] = useState<Uint8Array | null>(null);
  const idRef = useRef('remove-input');

  const handleFile = useCallback(async (files: File[]) => {
    if (!files.length) return;
    const f = files[0];
    setFile(f);
    setError(null);
    setResultBytes(null);
    try {
      const bytes = await f.arrayBuffer();
      const pdf = await PDFDocument.load(bytes);
      setPageCount(pdf.getPageCount());
    } catch {
      setError('Invalid or corrupted PDF file.');
      setPageCount(0);
    }
  }, []);

  const removePages = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    try {
      const bytes = await file.arrayBuffer();
      const srcPdf = await PDFDocument.load(bytes);

      const removeSet = new Set<number>();
      const parts = pagesToRemove.split(',').map((s) => s.trim()).filter(Boolean);
      for (const part of parts) {
        if (part.includes('-')) {
          const [a, b] = part.split('-').map(Number);
          if (isNaN(a) || isNaN(b) || a < 1 || b > pageCount || a > b)
            throw new Error(`Invalid range: ${part}`);
          for (let i = a; i <= b; i++) removeSet.add(i);
        } else {
          const n = Number(part);
          if (isNaN(n) || n < 1 || n > pageCount)
            throw new Error(`Invalid page number: ${part}`);
          removeSet.add(n);
        }
      }

      const newPdf = await PDFDocument.create();
      const keepIndices: number[] = [];
      for (let i = 0; i < pageCount; i++) {
        if (!removeSet.has(i + 1)) keepIndices.push(i);
      }

      if (keepIndices.length === 0) {
        throw new Error('Cannot remove all pages from the PDF.');
      }

      const pages = await newPdf.copyPages(srcPdf, keepIndices);
      pages.forEach((page) => newPdf.addPage(page));
      const result = await newPdf.save();
      setResultBytes(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove pages');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileMinus className="h-5 w-5" /> Remove Pages
        </CardTitle>
        <CardDescription>Remove specific pages from a PDF document</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <FileDropZone
          accept=".pdf"
          multiple={false}
          onFiles={handleFile}
          label="a PDF file"
          id={idRef.current}
        />

        {file && (
          <div className="rounded-md border bg-muted/50 px-3 py-2 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="truncate max-w-[200px]">{file.name}</span>
            </div>
            <span className="text-xs text-muted-foreground">{pageCount} pages</span>
          </div>
        )}

        {pageCount > 0 && (
          <div className="space-y-2">
            <Label htmlFor="remove-pages">Pages to remove (e.g. 1, 3-5, 8)</Label>
            <Input
              id="remove-pages"
              placeholder="1, 3-5"
              value={pagesToRemove}
              onChange={(e) => setPagesToRemove(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Total pages: {pageCount}. Pages will be removed from the output.
            </p>
          </div>
        )}

        {error && (
          <p className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">
            {error}
          </p>
        )}

        <div className="flex gap-2">
          <Button
            onClick={removePages}
            disabled={loading || !file || !pagesToRemove.trim()}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Removing...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4" /> Remove Pages
              </>
            )}
          </Button>
          {file && (
            <Button
              variant="outline"
              onClick={() => {
                setFile(null);
                setPageCount(0);
                setPagesToRemove('');
                setResultBytes(null);
                setError(null);
              }}
            >
              Clear
            </Button>
          )}
        </div>

        {resultBytes && (
          <div className="rounded-md border bg-emerald-500/10 p-4 space-y-2">
            <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
              Pages removed! New PDF ({formatBytes(resultBytes.length)})
            </p>
            <Button
              onClick={() => downloadPdfBytes(resultBytes, 'pages-removed.pdf')}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              <Download className="h-4 w-4" /> Download PDF
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* ──────────────────────────────────────────────────────────────── */
/* 4. PdfExtractPages                                              */
/* ──────────────────────────────────────────────────────────────── */

export function PdfExtractPages() {
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState<number>(0);
  const [pagesToExtract, setPagesToExtract] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultBytes, setResultBytes] = useState<Uint8Array | null>(null);
  const idRef = useRef('extract-input');

  const handleFile = useCallback(async (files: File[]) => {
    if (!files.length) return;
    const f = files[0];
    setFile(f);
    setError(null);
    setResultBytes(null);
    try {
      const bytes = await f.arrayBuffer();
      const pdf = await PDFDocument.load(bytes);
      setPageCount(pdf.getPageCount());
    } catch {
      setError('Invalid or corrupted PDF file.');
      setPageCount(0);
    }
  }, []);

  const extractPages = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    try {
      const bytes = await file.arrayBuffer();
      const srcPdf = await PDFDocument.load(bytes);

      const indices: number[] = [];
      const parts = pagesToExtract.split(',').map((s) => s.trim()).filter(Boolean);
      for (const part of parts) {
        if (part.includes('-')) {
          const [a, b] = part.split('-').map(Number);
          if (isNaN(a) || isNaN(b) || a < 1 || b > pageCount || a > b)
            throw new Error(`Invalid range: ${part}`);
          for (let i = a; i <= b; i++) indices.push(i - 1);
        } else {
          const n = Number(part);
          if (isNaN(n) || n < 1 || n > pageCount)
            throw new Error(`Invalid page number: ${part}`);
          indices.push(n - 1);
        }
      }

      if (indices.length === 0) throw new Error('No pages specified.');

      const newPdf = await PDFDocument.create();
      const pages = await newPdf.copyPages(srcPdf, indices);
      pages.forEach((page) => newPdf.addPage(page));
      const result = await newPdf.save();
      setResultBytes(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to extract pages');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileOutput className="h-5 w-5" /> Extract Pages
        </CardTitle>
        <CardDescription>Extract specific pages from a PDF into a new document</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <FileDropZone
          accept=".pdf"
          multiple={false}
          onFiles={handleFile}
          label="a PDF file"
          id={idRef.current}
        />

        {file && (
          <div className="rounded-md border bg-muted/50 px-3 py-2 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="truncate max-w-[200px]">{file.name}</span>
            </div>
            <span className="text-xs text-muted-foreground">{pageCount} pages</span>
          </div>
        )}

        {pageCount > 0 && (
          <div className="space-y-2">
            <Label htmlFor="extract-pages">Pages to extract (e.g. 1, 3-5, 8)</Label>
            <Input
              id="extract-pages"
              placeholder="1-3, 5"
              value={pagesToExtract}
              onChange={(e) => setPagesToExtract(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Total pages: {pageCount}. Only these pages will be in the output.
            </p>
          </div>
        )}

        {error && (
          <p className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">
            {error}
          </p>
        )}

        <div className="flex gap-2">
          <Button
            onClick={extractPages}
            disabled={loading || !file || !pagesToExtract.trim()}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Extracting...
              </>
            ) : (
              <>
                <FileOutput className="h-4 w-4" /> Extract Pages
              </>
            )}
          </Button>
          {file && (
            <Button
              variant="outline"
              onClick={() => {
                setFile(null);
                setPageCount(0);
                setPagesToExtract('');
                setResultBytes(null);
                setError(null);
              }}
            >
              Clear
            </Button>
          )}
        </div>

        {resultBytes && (
          <div className="rounded-md border bg-emerald-500/10 p-4 space-y-2">
            <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
              Pages extracted! ({formatBytes(resultBytes.length)})
            </p>
            <Button
              onClick={() => downloadPdfBytes(resultBytes, 'extracted-pages.pdf')}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              <Download className="h-4 w-4" /> Download PDF
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* ──────────────────────────────────────────────────────────────── */
/* 5. PdfOrganize (reorder pages)                                  */
/* ──────────────────────────────────────────────────────────────── */

export function PdfOrganize() {
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState<number>(0);
  const [pageOrder, setPageOrder] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultBytes, setResultBytes] = useState<Uint8Array | null>(null);
  const idRef = useRef('organize-input');

  const handleFile = useCallback(async (files: File[]) => {
    if (!files.length) return;
    const f = files[0];
    setFile(f);
    setError(null);
    setResultBytes(null);
    try {
      const bytes = await f.arrayBuffer();
      const pdf = await PDFDocument.load(bytes);
      const count = pdf.getPageCount();
      setPageCount(count);
      setPageOrder(Array.from({ length: count }, (_, i) => i));
    } catch {
      setError('Invalid or corrupted PDF file.');
      setPageCount(0);
      setPageOrder([]);
    }
  }, []);

  const movePage = useCallback((index: number, direction: 'up' | 'down') => {
    setPageOrder((prev) => {
      const next = [...prev];
      const target = direction === 'up' ? index - 1 : index + 1;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }, []);

  const organizePdf = async () => {
    if (!file || pageOrder.length === 0) return;
    setLoading(true);
    setError(null);
    try {
      const bytes = await file.arrayBuffer();
      const srcPdf = await PDFDocument.load(bytes);
      const newPdf = await PDFDocument.create();
      const pages = await newPdf.copyPages(srcPdf, pageOrder);
      pages.forEach((page) => newPdf.addPage(page));
      const result = await newPdf.save();
      setResultBytes(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to organize PDF');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Move className="h-5 w-5" /> Organize Pages
        </CardTitle>
        <CardDescription>Reorder pages in a PDF using up/down arrows</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <FileDropZone
          accept=".pdf"
          multiple={false}
          onFiles={handleFile}
          label="a PDF file"
          id={idRef.current}
        />

        {file && (
          <div className="rounded-md border bg-muted/50 px-3 py-2 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="truncate max-w-[200px]">{file.name}</span>
            </div>
            <span className="text-xs text-muted-foreground">{pageCount} pages</span>
          </div>
        )}

        {pageOrder.length > 0 && (
          <div className="space-y-2">
            <Label>Page order (drag to reorder)</Label>
            <div className="max-h-80 overflow-y-auto space-y-1 pr-1">
              {pageOrder.map((pageIndex, currentPos) => (
                <div
                  key={pageIndex}
                  className="flex items-center gap-2 rounded-md border bg-muted/50 px-3 py-2"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded bg-primary/10 text-sm font-semibold text-primary">
                    {pageIndex + 1}
                  </div>
                  <span className="text-sm text-muted-foreground flex-1">
                    Page {pageIndex + 1} → Position {currentPos + 1}
                  </span>
                  <div className="flex gap-1">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-7 w-7"
                      disabled={currentPos === 0}
                      onClick={() => movePage(currentPos, 'up')}
                    >
                      <ArrowUp className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-7 w-7"
                      disabled={currentPos === pageOrder.length - 1}
                      onClick={() => movePage(currentPos, 'down')}
                    >
                      <ArrowDown className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {error && (
          <p className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">
            {error}
          </p>
        )}

        <div className="flex gap-2">
          <Button onClick={organizePdf} disabled={loading || pageOrder.length === 0}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Organizing...
              </>
            ) : (
              <>
                <Move className="h-4 w-4" /> Reorder & Save
              </>
            )}
          </Button>
          {file && (
            <Button
              variant="outline"
              onClick={() => {
                setFile(null);
                setPageCount(0);
                setPageOrder([]);
                setResultBytes(null);
                setError(null);
              }}
            >
              Clear
            </Button>
          )}
        </div>

        {resultBytes && (
          <div className="rounded-md border bg-emerald-500/10 p-4 space-y-2">
            <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
              Pages reordered! ({formatBytes(resultBytes.length)})
            </p>
            <Button
              onClick={() => downloadPdfBytes(resultBytes, 'reordered.pdf')}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              <Download className="h-4 w-4" /> Download Reordered PDF
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* ──────────────────────────────────────────────────────────────── */
/* 6. PdfScan (camera → PDF)                                       */
/* ──────────────────────────────────────────────────────────────── */

export function PdfScan() {
  const [streaming, setStreaming] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultBytes, setResultBytes] = useState<Uint8Array | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startCamera = async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setStreaming(true);
    } catch (err) {
      setError(
        'Could not access camera. Please ensure camera permissions are granted.'
      );
    }
  };

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setStreaming(false);
  }, []);

  const captureFrame = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL('image/png');
    setCapturedImage(dataUrl);
    stopCamera();
  };

  const retake = () => {
    setCapturedImage(null);
    setResultBytes(null);
    setError(null);
    startCamera();
  };

  const convertToPdf = async () => {
    if (!capturedImage) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(capturedImage);
      const blob = await response.blob();
      const arrayBuffer = await blob.arrayBuffer();
      const imageBytes = new Uint8Array(arrayBuffer);

      const pdfDoc = await PDFDocument.create();

      let image;
      if (capturedImage.includes('image/png')) {
        image = await pdfDoc.embedPng(imageBytes);
      } else {
        image = await pdfDoc.embedJpg(imageBytes);
      }

      const page = pdfDoc.addPage([image.width, image.height]);
      page.drawImage(image, {
        x: 0,
        y: 0,
        width: image.width,
        height: image.height,
      });

      const result = await pdfDoc.save();
      setResultBytes(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create PDF');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Scan className="h-5 w-5" /> Scan to PDF
        </CardTitle>
        <CardDescription>Capture from camera and save as a PDF document</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Hidden canvas for capture */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Camera preview */}
        {streaming && !capturedImage && (
          <div className="relative overflow-hidden rounded-lg border bg-black">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-auto"
            />
          </div>
        )}

        {/* Captured image preview */}
        {capturedImage && (
          <div className="relative overflow-hidden rounded-lg border bg-muted">
            <img
              src={capturedImage}
              alt="Captured frame"
              className="w-full h-auto"
            />
          </div>
        )}

        {error && (
          <p className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">
            {error}
          </p>
        )}

        <div className="flex flex-wrap gap-2">
          {!streaming && !capturedImage && (
            <Button onClick={startCamera}>
              <Camera className="h-4 w-4" /> Start Camera
            </Button>
          )}

          {streaming && !capturedImage && (
            <>
              <Button onClick={captureFrame}>
                <Camera className="h-4 w-4" /> Capture
              </Button>
              <Button variant="outline" onClick={stopCamera}>
                Cancel
              </Button>
            </>
          )}

          {capturedImage && !resultBytes && (
            <>
              <Button onClick={convertToPdf} disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Converting...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" /> Create PDF
                  </>
                )}
              </Button>
              <Button variant="outline" onClick={retake}>
                Retake
              </Button>
            </>
          )}

          {resultBytes && (
            <>
              <Button
                onClick={() => downloadPdfBytes(resultBytes, 'scan.pdf')}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                <Download className="h-4 w-4" /> Download PDF
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setResultBytes(null);
                  setCapturedImage(null);
                  setError(null);
                }}
              >
                New Scan
              </Button>
            </>
          )}
        </div>

        {resultBytes && (
          <p className="text-sm text-emerald-700 dark:text-emerald-400">
            PDF created! ({formatBytes(resultBytes.length)})
          </p>
        )}
      </CardContent>
    </Card>
  );
}
