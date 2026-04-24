'use client';

import React, { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Upload,
  Download,
  FileText,
  Loader2,
  Brain,
  Globe,
  CheckCircle2,
  Clock,
  Hash,
  BookOpen,
  Copy,
  Sparkles,
  AlertCircle,
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
      const files = Array.from(e.dataTransfer.files);
      if (files.length) onFiles(files);
    },
    [onFiles]
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

/* ──────────────────────── Text extraction via pdf.js ──────────────────────── */

async function extractTextFromPdfWithProgress(
  bytes: ArrayBuffer,
  onProgress?: (page: number, total: number, text: string) => void
): Promise<{ text: string; pageCount: number }> {
  const pdfjsLib = await import('pdfjs-dist');
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url
  ).toString();

  const loadingTask = pdfjsLib.getDocument({ data: bytes });
  const pdf = await loadingTask.promise;
  const total = pdf.numPages;
  const pageTexts: string[] = [];

  for (let i = 1; i <= total; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items
      .map((item: any) => item.str)
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();
    pageTexts.push(pageText);
    onProgress?.(i, total, pageTexts.join('\n\n'));
  }

  return { text: pageTexts.join('\n\n'), pageCount: total };
}

/* ──────────────────────── AI API call ──────────────────────── */

async function callAI(action: 'summarize' | 'translate', text: string, targetLang?: string) {
  const body: Record<string, string> = { action, text };
  if (targetLang) body.targetLang = targetLang;

  const res = await fetch('/api/ai', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(data.error || `Request failed with status ${res.status}`);
  }

  return res.json();
}

/* ──────────────────────── Chunked summarization ──────────────────────── */

const CHUNK_SIZE = 8000;

function splitIntoChunks(text: string, maxSize: number): string[] {
  const chunks: string[] = [];
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
  let current = '';

  for (const sentence of sentences) {
    if ((current + sentence).length > maxSize && current.length > 0) {
      chunks.push(current.trim());
      current = sentence;
    } else {
      current += sentence;
    }
  }
  if (current.trim()) chunks.push(current.trim());
  return chunks.length > 0 ? chunks : [text];
}

/* ──────────────────────── Text wrapping helper ──────────────────────── */

function wrapText(
  text: string,
  font: { widthOfTextAtSize: (t: string, s: number) => number },
  fontSize: number,
  maxWidth: number
): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = '';

  for (const word of words) {
    const test = current ? current + ' ' + word : word;
    if (font.widthOfTextAtSize(test, fontSize) > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);
  return lines;
}

/* ══════════════════════════════════════════════════════════════════════════ */
/* 1. PdfSummarize — AI-Powered                                         */
/* ══════════════════════════════════════════════════════════════════════════ */

export function PdfSummarize() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [extractedText, setExtractedText] = useState('');
  const [summary, setSummary] = useState('');
  const [pageCount, setPageCount] = useState(0);
  const [progress, setProgress] = useState(0);
  const [progressLabel, setProgressLabel] = useState('');
  const idRef = useRef('summarize-input');

  const originalWordCount = extractedText.split(/\s+/).filter(Boolean).length;
  const summaryWordCount = summary.split(/\s+/).filter(Boolean).length;

  const handleFile = useCallback(async (files: File[]) => {
    if (!files.length) return;
    const f = files[0];
    setFile(f);
    setError(null);
    setExtractedText('');
    setSummary('');
    setPageCount(0);
    setProgress(0);
    setProgressLabel('');
  }, []);

  const summarizePdf = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    setSummary('');
    setProgress(0);

    try {
      // Step 1: Extract text with progress
      setProgressLabel('Extracting text from PDF...');
      const bytes = await file.arrayBuffer();
      const { text, pageCount: pc } = await extractTextFromPdfWithProgress(
        bytes,
        (current, total) => {
          setProgress(Math.round((current / total) * 40)); // 0-40% for extraction
        }
      );
      setExtractedText(text);
      setPageCount(pc);

      if (!text.trim()) {
        setError('No text could be extracted from this PDF. The document may contain only images or scanned content.');
        setLoading(false);
        return;
      }

      // Step 2: Summarize via AI
      setProgressLabel('Generating AI summary...');
      setProgress(50);

      const chunks = splitIntoChunks(text, CHUNK_SIZE);
      let finalSummary = '';

      if (chunks.length === 1) {
        setProgressLabel('Generating AI summary...');
        const result = await callAI('summarize', chunks[0]);
        finalSummary = result.summary || 'No summary generated.';
        setProgress(90);
      } else {
        // Chunked summarization
        const chunkSummaries: string[] = [];
        for (let i = 0; i < chunks.length; i++) {
          setProgressLabel(`Summarizing part ${i + 1} of ${chunks.length}...`);
          setProgress(50 + Math.round((i / chunks.length) * 40));
          const result = await callAI('summarize', chunks[i]);
          chunkSummaries.push(result.summary || '');
        }

        // Combine chunk summaries
        setProgressLabel('Combining summaries...');
        setProgress(92);
        const combined = chunkSummaries.join('\n\n');
        if (combined.length > CHUNK_SIZE) {
          const finalResult = await callAI('summarize', combined);
          finalSummary = finalResult.summary || combined;
        } else {
          finalSummary = combined;
        }
      }

      setSummary(finalSummary);
      setProgress(100);
      setProgressLabel('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to summarize PDF');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!summary) return;
    navigator.clipboard.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadSummaryTxt = () => {
    if (!summary) return;
    const content = `PDF Summary\n${'='.repeat(50)}\n\nFile: ${file?.name ?? 'Unknown'}\nPages: ${pageCount}\n\n--- AI Summary ---\n\n${summary}\n\n--- Statistics ---\nOriginal words: ${originalWordCount}\nSummary words: ${summaryWordCount}\nCompression: ${originalWordCount > 0 ? Math.round((1 - summaryWordCount / originalWordCount) * 100) : 0}%`;
    const blob = new Blob([content], { type: 'text/plain' });
    downloadBlob(blob, 'pdf-summary.txt');
  };

  const downloadSummaryPdf = async () => {
    if (!summary) return;
    const { PDFDocument, rgb, StandardFonts } = await import('pdf-lib');
    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const page = pdfDoc.addPage([595.28, 841.89]);
    const { width, height } = page.getSize();
    const fontSize = 11;
    const lineHeight = fontSize * 1.5;
    const margin = 50;
    const maxWidth = width - margin * 2;

    page.drawText('PDF Summary', {
      x: margin,
      y: height - margin,
      size: 20,
      font,
      color: rgb(0, 0, 0),
    });

    let y = height - margin - 40;
    const metaText = `File: ${file?.name ?? 'Unknown'} | Pages: ${pageCount} | Original: ${originalWordCount} words | Summary: ${summaryWordCount} words`;
    const metaLines = wrapText(metaText, font, fontSize, maxWidth);
    for (const line of metaLines) {
      page.drawText(line, { x: margin, y, size: 9, font, color: rgb(0.4, 0.4, 0.4) });
      y -= 14;
    }
    y -= 10;

    page.drawText('AI Summary:', {
      x: margin,
      y,
      size: 13,
      font,
      color: rgb(0, 0, 0),
    });
    y -= 22;

    const plainSummary = summary.replace(/[#*_~`]/g, '');
    const summaryLines = wrapText(plainSummary, font, fontSize, maxWidth);
    for (const line of summaryLines) {
      if (y < margin) {
        const newPage = pdfDoc.addPage([595.28, 841.89]);
        const { height: newHeight } = newPage.getSize();
        y = newHeight - margin;
        // Need to draw on the new page
        newPage.drawText(line, { x: margin, y, size: fontSize, font, color: rgb(0.1, 0.1, 0.1) });
        y -= lineHeight;
        continue;
      }
      page.drawText(line, { x: margin, y, size: fontSize, font, color: rgb(0.1, 0.1, 0.1) });
      y -= lineHeight;
    }

    const result = await pdfDoc.save();
    downloadBlob(new Blob([result], { type: 'application/pdf' }), 'summary.pdf');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-violet-600 dark:text-violet-400" /> AI Summarizer
        </CardTitle>
        <CardDescription>
          Get AI-powered summaries of your PDF documents
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-md border bg-violet-500/10 border-violet-500/20 p-3">
          <div className="flex items-start gap-2">
            <Sparkles className="h-4 w-4 text-violet-600 dark:text-violet-400 shrink-0 mt-0.5" />
            <p className="text-xs text-violet-700 dark:text-violet-400">
              Powered by AI. Upload a PDF and get an intelligent summary that captures key insights,
              facts, and conclusions. Handles long documents by summarizing in chunks.
            </p>
          </div>
        </div>

        <FileDropZone
          accept=".pdf"
          multiple={false}
          onFiles={handleFile}
          label="a PDF file to summarize"
          id={idRef.current}
        />

        {file && (
          <div className="rounded-md border bg-muted/50 px-3 py-2 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm min-w-0">
              <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="truncate">{file.name}</span>
              <span className="text-xs text-muted-foreground shrink-0">({formatBytes(file.size)})</span>
            </div>
            {pageCount > 0 && (
              <span className="text-xs text-muted-foreground shrink-0">{pageCount} pages</span>
            )}
          </div>
        )}

        {error && (
          <div className="flex items-start gap-2 text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Progress */}
        {loading && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{progressLabel}</span>
              <span className="text-muted-foreground">{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}

        <div className="flex gap-2">
          <Button onClick={summarizePdf} disabled={loading || !file}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Processing...
              </>
            ) : (
              <>
                <Brain className="h-4 w-4" /> Summarize with AI
              </>
            )}
          </Button>
          {file && (
            <Button
              variant="outline"
              onClick={() => {
                setFile(null);
                setPageCount(0);
                setExtractedText('');
                setSummary('');
                setError(null);
                setProgress(0);
                setProgressLabel('');
              }}
              disabled={loading}
            >
              Clear
            </Button>
          )}
        </div>

        {/* Results */}
        {summary && (
          <div className="space-y-4">
            {/* Statistics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="rounded-md border bg-muted/50 p-3 text-center">
                <FileText className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">Pages</p>
                <p className="text-lg font-semibold">{pageCount}</p>
              </div>
              <div className="rounded-md border bg-muted/50 p-3 text-center">
                <Hash className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">Original</p>
                <p className="text-lg font-semibold">{originalWordCount.toLocaleString()} <span className="text-xs font-normal text-muted-foreground">words</span></p>
              </div>
              <div className="rounded-md border bg-violet-500/10 p-3 text-center">
                <BookOpen className="h-4 w-4 mx-auto mb-1 text-violet-600 dark:text-violet-400" />
                <p className="text-xs text-violet-600 dark:text-violet-400">Summary</p>
                <p className="text-lg font-semibold text-violet-600 dark:text-violet-400">{summaryWordCount.toLocaleString()} <span className="text-xs font-normal">words</span></p>
              </div>
              <div className="rounded-md border bg-muted/50 p-3 text-center">
                <Clock className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">Saved</p>
                <p className="text-lg font-semibold">
                  {originalWordCount > 0 ? Math.round((1 - summaryWordCount / originalWordCount) * 100) : 0}%
                </p>
              </div>
            </div>

            {/* Summary */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-violet-600 dark:text-violet-400" /> AI Summary
              </Label>
              <div className="rounded-md border bg-violet-500/5 p-4 max-h-96 overflow-y-auto">
                <div className="text-sm leading-relaxed whitespace-pre-wrap">{summary}</div>
              </div>
            </div>

            {/* Original Text (collapsed) */}
            <details className="group">
              <summary className="text-sm font-medium cursor-pointer hover:text-foreground transition-colors flex items-center gap-1">
                <FileText className="h-4 w-4" /> Show extracted text
              </summary>
              <Textarea
                value={extractedText}
                readOnly
                rows={8}
                className="mt-2 font-mono text-xs resize-y"
              />
            </details>

            {/* Actions */}
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={handleCopy}>
                {copied ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? 'Copied!' : 'Copy Summary'}
              </Button>
              <Button variant="outline" size="sm" onClick={downloadSummaryTxt}>
                <Download className="h-4 w-4" /> Download TXT
              </Button>
              <Button variant="outline" size="sm" onClick={downloadSummaryPdf}>
                <Download className="h-4 w-4" /> Download PDF
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* ══════════════════════════════════════════════════════════════════════════ */
/* 2. PdfTranslate — AI-Powered                                          */
/* ══════════════════════════════════════════════════════════════════════════ */

type TargetLanguage = 'es' | 'fr' | 'de' | 'zh' | 'ja' | 'ar' | 'pt' | 'ru' | 'ko' | 'it' | 'nl' | 'hi';

const languageOptions: { value: TargetLanguage; label: string; flag: string }[] = [
  { value: 'es', label: 'Spanish', flag: '🇪🇸' },
  { value: 'fr', label: 'French', flag: '🇫🇷' },
  { value: 'de', label: 'German', flag: '🇩🇪' },
  { value: 'zh', label: 'Chinese', flag: '🇨🇳' },
  { value: 'ja', label: 'Japanese', flag: '🇯🇵' },
  { value: 'ko', label: 'Korean', flag: '🇰🇷' },
  { value: 'ar', label: 'Arabic', flag: '🇸🇦' },
  { value: 'pt', label: 'Portuguese', flag: '🇧🇷' },
  { value: 'ru', label: 'Russian', flag: '🇷🇺' },
  { value: 'it', label: 'Italian', flag: '🇮🇹' },
  { value: 'nl', label: 'Dutch', flag: '🇳🇱' },
  { value: 'hi', label: 'Hindi', flag: '🇮🇳' },
];

export function PdfTranslate() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedOriginal, setCopiedOriginal] = useState(false);
  const [copiedTranslation, setCopiedTranslation] = useState(false);
  const [extractedText, setExtractedText] = useState('');
  const [targetLang, setTargetLang] = useState<TargetLanguage>('es');
  const [translatedText, setTranslatedText] = useState('');
  const [pageCount, setPageCount] = useState(0);
  const [progress, setProgress] = useState(0);
  const [progressLabel, setProgressLabel] = useState('');
  const idRef = useRef('translate-input');

  const handleFile = useCallback(async (files: File[]) => {
    if (!files.length) return;
    const f = files[0];
    setFile(f);
    setError(null);
    setExtractedText('');
    setTranslatedText('');
    setPageCount(0);
    setProgress(0);
    setProgressLabel('');
  }, []);

  const handleTranslate = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    setTranslatedText('');
    setProgress(0);

    try {
      // Step 1: Extract text
      setProgressLabel('Extracting text from PDF...');
      const bytes = await file.arrayBuffer();
      const { text, pageCount: pc } = await extractTextFromPdfWithProgress(
        bytes,
        (current, total) => {
          setProgress(Math.round((current / total) * 30)); // 0-30% for extraction
        }
      );
      setExtractedText(text);
      setPageCount(pc);

      if (!text.trim()) {
        setError('No text could be extracted from this PDF. The document may contain only images or scanned content.');
        setLoading(false);
        return;
      }

      // Step 2: Translate via AI (chunked for long documents)
      setProgressLabel('Translating with AI...');
      setProgress(35);

      const chunks = splitIntoChunks(text, 4000); // Smaller chunks for translation
      let finalTranslation = '';

      for (let i = 0; i < chunks.length; i++) {
        setProgressLabel(`Translating part ${i + 1} of ${chunks.length}...`);
        setProgress(35 + Math.round(((i + 1) / chunks.length) * 60));
        const result = await callAI('translate', chunks[i], targetLang);
        finalTranslation += (result.translatedText || '') + '\n\n';
      }

      setTranslatedText(finalTranslation.trim());
      setProgress(100);
      setProgressLabel('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to translate PDF');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyOriginal = () => {
    if (!extractedText) return;
    navigator.clipboard.writeText(extractedText);
    setCopiedOriginal(true);
    setTimeout(() => setCopiedOriginal(false), 2000);
  };

  const handleCopyTranslation = () => {
    if (!translatedText) return;
    navigator.clipboard.writeText(translatedText);
    setCopiedTranslation(true);
    setTimeout(() => setCopiedTranslation(false), 2000);
  };

  const downloadTranslationTxt = () => {
    if (!translatedText) return;
    const langLabel = languageOptions.find((l) => l.value === targetLang)?.label || targetLang;
    const content = `PDF Translation\n${'='.repeat(50)}\n\nFile: ${file?.name ?? 'Unknown'}\nPages: ${pageCount}\nTarget Language: ${langLabel}\n\n--- Original Text ---\n\n${extractedText}\n\n--- Translated Text ---\n\n${translatedText}`;
    const blob = new Blob([content], { type: 'text/plain' });
    downloadBlob(blob, `translation-${targetLang}.txt`);
  };

  const downloadTranslationPdf = async () => {
    if (!translatedText) return;
    const langLabel = languageOptions.find((l) => l.value === targetLang)?.label || targetLang;

    const { PDFDocument, rgb, StandardFonts } = await import('pdf-lib');
    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const pageWidth = 595.28;
    const pageHeight = 841.89;
    const margin = 50;
    const maxWidth = pageWidth - margin * 2;
    const fontSize = 11;
    const lineHeight = fontSize * 1.5;

    let page = pdfDoc.addPage([pageWidth, pageHeight]);
    let y = pageHeight - margin;

    // Title
    page.drawText(`Translation — ${langLabel}`, {
      x: margin,
      y,
      size: 20,
      font,
      color: rgb(0, 0, 0),
    });
    y -= 35;

    // Metadata
    const metaText = `Source: ${file?.name ?? 'Unknown'} | Pages: ${pageCount}`;
    const metaLines = wrapText(metaText, font, 9, maxWidth);
    for (const line of metaLines) {
      page.drawText(line, { x: margin, y, size: 9, font, color: rgb(0.4, 0.4, 0.4) });
      y -= 14;
    }
    y -= 15;

    page.drawText('Translated Text:', {
      x: margin,
      y,
      size: 13,
      font,
      color: rgb(0, 0, 0),
    });
    y -= 22;

    const plainTranslation = translatedText.replace(/[#*_~`]/g, '');
    const lines = wrapText(plainTranslation, font, fontSize, maxWidth);

    for (const line of lines) {
      if (y < margin + lineHeight) {
        page = pdfDoc.addPage([pageWidth, pageHeight]);
        y = pageHeight - margin;
      }
      page.drawText(line, {
        x: margin,
        y,
        size: fontSize,
        font,
        color: rgb(0.1, 0.1, 0.1),
      });
      y -= lineHeight;
    }

    const result = await pdfDoc.save();
    downloadBlob(new Blob([result], { type: 'application/pdf' }), `translation-${targetLang}.pdf`);
  };

  const langLabel = languageOptions.find((l) => l.value === targetLang)?.label || targetLang;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="h-5 w-5 text-emerald-600 dark:text-emerald-400" /> Translate PDF
        </CardTitle>
        <CardDescription>
          AI-powered translation of PDF documents to multiple languages
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-md border bg-emerald-500/10 border-emerald-500/20 p-3">
          <div className="flex items-start gap-2">
            <Sparkles className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <p className="text-xs text-emerald-700 dark:text-emerald-400">
              Powered by AI. Upload a PDF, select a target language, and get a professional translation
              that preserves formatting and context. Supports 12 languages including CJK and RTL scripts.
            </p>
          </div>
        </div>

        <FileDropZone
          accept=".pdf"
          multiple={false}
          onFiles={handleFile}
          label="a PDF file to translate"
          id={idRef.current}
        />

        {file && (
          <div className="rounded-md border bg-muted/50 px-3 py-2 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm min-w-0">
              <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="truncate">{file.name}</span>
              <span className="text-xs text-muted-foreground shrink-0">({formatBytes(file.size)})</span>
            </div>
            {pageCount > 0 && (
              <span className="text-xs text-muted-foreground shrink-0">{pageCount} pages</span>
            )}
          </div>
        )}

        {error && (
          <div className="flex items-start gap-2 text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Progress */}
        {loading && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{progressLabel}</span>
              <span className="text-muted-foreground">{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}

        {/* Language selector */}
        <div className="space-y-2">
          <Label>Target Language</Label>
          <Select
            value={targetLang}
            onValueChange={(v) => {
              setTargetLang(v as TargetLanguage);
              setTranslatedText('');
            }}
            disabled={loading}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select language" />
            </SelectTrigger>
            <SelectContent>
              {languageOptions.map((lang) => (
                <SelectItem key={lang.value} value={lang.value}>
                  {lang.flag} {lang.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-2">
          <Button onClick={handleTranslate} disabled={loading || !file}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Translating...
              </>
            ) : (
              <>
                <Globe className="h-4 w-4" /> Translate to {langLabel}
              </>
            )}
          </Button>
          {file && (
            <Button
              variant="outline"
              onClick={() => {
                setFile(null);
                setExtractedText('');
                setTranslatedText('');
                setPageCount(0);
                setError(null);
                setProgress(0);
                setProgressLabel('');
              }}
              disabled={loading}
            >
              Clear
            </Button>
          )}
        </div>

        {/* Results */}
        {translatedText && (
          <div className="space-y-4">
            {/* Stats bar */}
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-md border bg-muted/50 p-3 text-center">
                <FileText className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">Pages</p>
                <p className="text-lg font-semibold">{pageCount}</p>
              </div>
              <div className="rounded-md border bg-emerald-500/10 p-3 text-center">
                <Globe className="h-4 w-4 mx-auto mb-1 text-emerald-600 dark:text-emerald-400" />
                <p className="text-xs text-emerald-600 dark:text-emerald-400">Language</p>
                <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">{langLabel}</p>
              </div>
              <div className="rounded-md border bg-muted/50 p-3 text-center">
                <Hash className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">Words</p>
                <p className="text-lg font-semibold">{extractedText.split(/\s+/).filter(Boolean).length.toLocaleString()}</p>
              </div>
            </div>

            {/* Original text (collapsed) */}
            <details className="group">
              <summary className="text-sm font-medium cursor-pointer hover:text-foreground transition-colors flex items-center gap-1">
                <FileText className="h-4 w-4" /> Show original text
              </summary>
              <div className="mt-2">
                <Textarea
                  value={extractedText}
                  readOnly
                  rows={6}
                  className="font-mono text-xs resize-y"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-1"
                  onClick={handleCopyOriginal}
                >
                  {copiedOriginal ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  {copiedOriginal ? 'Copied!' : 'Copy original'}
                </Button>
              </div>
            </details>

            {/* Translated text */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-emerald-600 dark:text-emerald-400" /> Translation ({langLabel})
              </Label>
              <div className="rounded-md border bg-emerald-500/5 p-4 max-h-96 overflow-y-auto">
                <div className="text-sm leading-relaxed whitespace-pre-wrap">{translatedText}</div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={handleCopyTranslation}>
                {copiedTranslation ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copiedTranslation ? 'Copied!' : 'Copy Translation'}
              </Button>
              <Button variant="outline" size="sm" onClick={downloadTranslationTxt}>
                <Download className="h-4 w-4" /> Download TXT
              </Button>
              <Button variant="outline" size="sm" onClick={downloadTranslationPdf}>
                <Download className="h-4 w-4" /> Download PDF
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
