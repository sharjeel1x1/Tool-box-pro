'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef, Suspense, lazy, type ComponentType } from 'react';
import { categories, tools, ToolDef } from '@/lib/tools-registry';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';

/* ─── Dynamic Tool Imports ─── */
type ToolComponent = ComponentType;

const lazyTools: Record<string, React.LazyExoticComponent<ToolComponent>> = {
  // Organize PDF
  'pdf-merge': lazy(() => import('@/components/tools/pdf-organize').then(m => ({ default: m.PdfMerge as ToolComponent }))),
  'pdf-split': lazy(() => import('@/components/tools/pdf-organize').then(m => ({ default: m.PdfSplit as ToolComponent }))),
  'pdf-remove-pages': lazy(() => import('@/components/tools/pdf-organize').then(m => ({ default: m.PdfRemovePages as ToolComponent }))),
  'pdf-extract-pages': lazy(() => import('@/components/tools/pdf-organize').then(m => ({ default: m.PdfExtractPages as ToolComponent }))),
  'pdf-organize': lazy(() => import('@/components/tools/pdf-organize').then(m => ({ default: m.PdfOrganize as ToolComponent }))),
  'pdf-scan': lazy(() => import('@/components/tools/pdf-organize').then(m => ({ default: m.PdfScan as ToolComponent }))),
  // Optimize PDF
  'pdf-compress': lazy(() => import('@/components/tools/pdf-optimize').then(m => ({ default: m.PdfCompress as ToolComponent }))),
  'pdf-repair': lazy(() => import('@/components/tools/pdf-optimize').then(m => ({ default: m.PdfRepair as ToolComponent }))),
  'pdf-ocr': lazy(() => import('@/components/tools/pdf-optimize').then(m => ({ default: m.PdfOcr as ToolComponent }))),
  // Convert to PDF
  'jpg-to-pdf': lazy(() => import('@/components/tools/pdf-convert').then(m => ({ default: m.JpgToPdf as ToolComponent }))),
  'word-to-pdf': lazy(() => import('@/components/tools/pdf-convert').then(m => ({ default: m.WordToPdf as ToolComponent }))),
  'ppt-to-pdf': lazy(() => import('@/components/tools/pdf-convert').then(m => ({ default: m.PptToPdf as ToolComponent }))),
  'excel-to-pdf': lazy(() => import('@/components/tools/pdf-convert').then(m => ({ default: m.ExcelToPdf as ToolComponent }))),
  'html-to-pdf': lazy(() => import('@/components/tools/pdf-convert').then(m => ({ default: m.HtmlToPdf as ToolComponent }))),
  // Convert from PDF
  'pdf-to-jpg': lazy(() => import('@/components/tools/pdf-convert').then(m => ({ default: m.PdfToJpg as ToolComponent }))),
  'pdf-to-word': lazy(() => import('@/components/tools/pdf-convert').then(m => ({ default: m.PdfToWord as ToolComponent }))),
  'pdf-to-ppt': lazy(() => import('@/components/tools/pdf-convert').then(m => ({ default: m.PdfToPpt as ToolComponent }))),
  'pdf-to-excel': lazy(() => import('@/components/tools/pdf-convert').then(m => ({ default: m.PdfToExcel as ToolComponent }))),
  'pdf-to-pdfa': lazy(() => import('@/components/tools/pdf-convert').then(m => ({ default: m.PdfToPdfA as ToolComponent }))),
  // Edit PDF
  'pdf-rotate': lazy(() => import('@/components/tools/pdf-edit').then(m => ({ default: m.PdfRotate as ToolComponent }))),
  'pdf-page-numbers': lazy(() => import('@/components/tools/pdf-edit').then(m => ({ default: m.PdfPageNumbers as ToolComponent }))),
  'pdf-watermark': lazy(() => import('@/components/tools/pdf-edit').then(m => ({ default: m.PdfWatermark as ToolComponent }))),
  'pdf-crop': lazy(() => import('@/components/tools/pdf-edit').then(m => ({ default: m.PdfCrop as ToolComponent }))),
  'pdf-edit-text': lazy(() => import('@/components/tools/pdf-edit').then(m => ({ default: m.PdfEditText as ToolComponent }))),
  // PDF Security
  'pdf-unlock': lazy(() => import('@/components/tools/pdf-security').then(m => ({ default: m.PdfUnlock as ToolComponent }))),
  'pdf-protect': lazy(() => import('@/components/tools/pdf-security').then(m => ({ default: m.PdfProtect as ToolComponent }))),
  'pdf-sign': lazy(() => import('@/components/tools/pdf-security').then(m => ({ default: m.PdfSign as ToolComponent }))),
  'pdf-redact': lazy(() => import('@/components/tools/pdf-security').then(m => ({ default: m.PdfRedact as ToolComponent }))),
  'pdf-compare': lazy(() => import('@/components/tools/pdf-security').then(m => ({ default: m.PdfCompare as ToolComponent }))),
  // PDF Intelligence
  'pdf-summarize': lazy(() => import('@/components/tools/pdf-intelligence').then(m => ({ default: m.PdfSummarize as ToolComponent }))),
  'pdf-translate': lazy(() => import('@/components/tools/pdf-intelligence').then(m => ({ default: m.PdfTranslate as ToolComponent }))),
  // Business Tools
  'qr-generator': lazy(() => import('@/components/tools/business-tools').then(m => ({ default: m.QrGenerator as ToolComponent }))),
  'barcode-generator': lazy(() => import('@/components/tools/business-tools').then(m => ({ default: m.BarcodeGenerator as ToolComponent }))),
  'invoice-generator': lazy(() => import('@/components/tools/business-tools').then(m => ({ default: m.InvoiceGenerator as ToolComponent }))),
  'currency-converter': lazy(() => import('@/components/tools/business-tools').then(m => ({ default: m.CurrencyConverter as ToolComponent }))),
  'unit-converter': lazy(() => import('@/components/tools/business-tools').then(m => ({ default: m.UnitConverter as ToolComponent }))),
  // Utility Tools
  'color-picker': lazy(() => import('@/components/tools/utility-tools').then(m => ({ default: m.ColorPicker as ToolComponent }))),
  'timezone-converter': lazy(() => import('@/components/tools/utility-tools').then(m => ({ default: m.TimezoneConverter as ToolComponent }))),
  'age-calculator': lazy(() => import('@/components/tools/utility-tools').then(m => ({ default: m.AgeCalculator as ToolComponent }))),
  'random-generator': lazy(() => import('@/components/tools/utility-tools').then(m => ({ default: m.RandomGenerator as ToolComponent }))),
  // Math & Calculation
  'calculator': lazy(() => import('@/components/tools/math-tools').then(m => ({ default: m.Calculator as ToolComponent }))),
  'percentage-calc': lazy(() => import('@/components/tools/math-tools').then(m => ({ default: m.PercentageCalc as ToolComponent }))),
  'tip-calculator': lazy(() => import('@/components/tools/math-tools').then(m => ({ default: m.TipCalculator as ToolComponent }))),
  'loan-calculator': lazy(() => import('@/components/tools/math-tools').then(m => ({ default: m.LoanCalculator as ToolComponent }))),
  'bmi-calculator': lazy(() => import('@/components/tools/math-tools').then(m => ({ default: m.BmiCalculator as ToolComponent }))),
  'compound-interest': lazy(() => import('@/components/tools/math-tools').then(m => ({ default: m.CompoundInterest as ToolComponent }))),
  'discount-calculator': lazy(() => import('@/components/tools/math-tools').then(m => ({ default: m.DiscountCalculator as ToolComponent }))),
  'area-calculator': lazy(() => import('@/components/tools/math-tools').then(m => ({ default: m.AreaCalculator as ToolComponent }))),
  // Social Media Tools
  'char-counter': lazy(() => import('@/components/tools/social-tools').then(m => ({ default: m.CharCounter as ToolComponent }))),
  'hashtag-generator': lazy(() => import('@/components/tools/social-tools').then(m => ({ default: m.HashtagGenerator as ToolComponent }))),
  'emoji-picker': lazy(() => import('@/components/tools/social-tools').then(m => ({ default: m.EmojiPicker as ToolComponent }))),
  'meta-tag-gen': lazy(() => import('@/components/tools/social-tools').then(m => ({ default: m.MetaTagGen as ToolComponent }))),
  'social-image': lazy(() => import('@/components/tools/social-tools').then(m => ({ default: m.SocialImage as ToolComponent }))),
  // Health & Fitness
  'calorie-calculator': lazy(() => import('@/components/tools/health-tools').then(m => ({ default: m.CalorieCalculator as ToolComponent }))),
  'water-intake': lazy(() => import('@/components/tools/health-tools').then(m => ({ default: m.WaterIntake as ToolComponent }))),
  'heart-rate-zones': lazy(() => import('@/components/tools/health-tools').then(m => ({ default: m.HeartRateZones as ToolComponent }))),
  'sleep-calculator': lazy(() => import('@/components/tools/health-tools').then(m => ({ default: m.SleepCalculator as ToolComponent }))),
  'body-fat-calc': lazy(() => import('@/components/tools/health-tools').then(m => ({ default: m.BodyFatCalc as ToolComponent }))),
  // Finance Tools
  'budget-planner': lazy(() => import('@/components/tools/finance-tools').then(m => ({ default: m.BudgetPlanner as ToolComponent }))),
  'savings-goal': lazy(() => import('@/components/tools/finance-tools').then(m => ({ default: m.SavingsGoal as ToolComponent }))),
  'tax-calculator': lazy(() => import('@/components/tools/finance-tools').then(m => ({ default: m.TaxCalculator as ToolComponent }))),
  'roi-calculator': lazy(() => import('@/components/tools/finance-tools').then(m => ({ default: m.RoiCalculator as ToolComponent }))),
  'currency-formatter': lazy(() => import('@/components/tools/finance-tools').then(m => ({ default: m.CurrencyFormatter as ToolComponent }))),
  // Writing Tools
  'case-converter': lazy(() => import('@/components/tools/writing-tools').then(m => ({ default: m.CaseConverter as ToolComponent }))),
  'slug-generator': lazy(() => import('@/components/tools/writing-tools').then(m => ({ default: m.SlugGenerator as ToolComponent }))),
  'text-repeater': lazy(() => import('@/components/tools/writing-tools').then(m => ({ default: m.TextRepeater as ToolComponent }))),
  'remove-duplicates': lazy(() => import('@/components/tools/writing-tools').then(m => ({ default: m.RemoveDuplicates as ToolComponent }))),
  'find-replace': lazy(() => import('@/components/tools/writing-tools').then(m => ({ default: m.FindReplace as ToolComponent }))),
  'text-to-handwriting': lazy(() => import('@/components/tools/writing-tools').then(m => ({ default: m.TextToHandwriting as ToolComponent }))),
  // Timer & Productivity
  'stopwatch': lazy(() => import('@/components/tools/timer-tools').then(m => ({ default: m.Stopwatch as ToolComponent }))),
  'countdown-timer': lazy(() => import('@/components/tools/timer-tools').then(m => ({ default: m.CountdownTimer as ToolComponent }))),
  'pomodoro-timer': lazy(() => import('@/components/tools/timer-tools').then(m => ({ default: m.PomodoroTimer as ToolComponent }))),
  'decision-maker': lazy(() => import('@/components/tools/timer-tools').then(m => ({ default: m.DecisionMaker as ToolComponent }))),
  'habit-tracker': lazy(() => import('@/components/tools/timer-tools').then(m => ({ default: m.HabitTracker as ToolComponent }))),
  'world-clock': lazy(() => import('@/components/tools/timer-tools').then(m => ({ default: m.WorldClock as ToolComponent }))),
};

/* ─── Tool Loading Fallback ─── */
function ToolLoadingFallback() {
  return (
    <Card className="w-full">
      <CardContent className="flex flex-col items-center justify-center py-16 gap-4">
        <div className="relative h-10 w-10">
          <div className="absolute inset-0 animate-spin rounded-full border-4 border-muted border-t-primary" style={{ animationDuration: '1s' }} />
        </div>
        <p className="text-sm text-muted-foreground">Loading tool...</p>
      </CardContent>
    </Card>
  );
}

/* ─── Error Boundary for Tool Components ─── */
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ToolErrorBoundary extends React.Component<
  { children: React.ReactNode; toolName: string; onBack: () => void },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode; toolName: string; onBack: () => void }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <Card className="w-full border-destructive/30">
          <CardContent className="flex flex-col items-center justify-center py-16 gap-4 text-center">
            <span className="text-5xl">⚠️</span>
            <h2 className="text-xl font-semibold text-destructive">Something went wrong</h2>
            <p className="text-sm text-muted-foreground max-w-md">
              Failed to load <strong>{this.props.toolName}</strong>. The tool component encountered an error.
            </p>
            {this.state.error && (
              <pre className="text-xs text-muted-foreground/70 bg-muted rounded-lg p-3 max-w-md overflow-x-auto max-h-32 overflow-y-auto">
                {this.state.error.message}
              </pre>
            )}
            <Button variant="outline" onClick={() => { this.setState({ hasError: false, error: null }); this.props.onBack(); }}>
              Back to Tools
            </Button>
          </CardContent>
        </Card>
      );
    }
    return this.props.children;
  }
}

const categoryColors: Record<string, { bg: string; border: string; text: string; hover: string; gradient: string }> = {
  organize: { bg: 'bg-emerald-50 dark:bg-emerald-950/40', border: 'border-emerald-200 dark:border-emerald-800', text: 'text-emerald-700 dark:text-emerald-300', hover: 'hover:border-emerald-400 dark:hover:border-emerald-600', gradient: 'from-emerald-500 to-teal-500' },
  optimize: { bg: 'bg-amber-50 dark:bg-amber-950/40', border: 'border-amber-200 dark:border-amber-800', text: 'text-amber-700 dark:text-amber-300', hover: 'hover:border-amber-400 dark:hover:border-amber-600', gradient: 'from-amber-500 to-orange-500' },
  'convert-to': { bg: 'bg-sky-50 dark:bg-sky-950/40', border: 'border-sky-200 dark:border-sky-800', text: 'text-sky-700 dark:text-sky-300', hover: 'hover:border-sky-400 dark:hover:border-sky-600', gradient: 'from-sky-500 to-blue-500' },
  'convert-from': { bg: 'bg-purple-50 dark:bg-purple-950/40', border: 'border-purple-200 dark:border-purple-800', text: 'text-purple-700 dark:text-purple-300', hover: 'hover:border-purple-400 dark:hover:border-purple-600', gradient: 'from-purple-500 to-fuchsia-500' },
  edit: { bg: 'bg-rose-50 dark:bg-rose-950/40', border: 'border-rose-200 dark:border-rose-800', text: 'text-rose-700 dark:text-rose-300', hover: 'hover:border-rose-400 dark:hover:border-rose-600', gradient: 'from-rose-500 to-pink-500' },
  security: { bg: 'bg-red-50 dark:bg-red-950/40', border: 'border-red-200 dark:border-red-800', text: 'text-red-700 dark:text-red-300', hover: 'hover:border-red-400 dark:hover:border-red-600', gradient: 'from-red-500 to-rose-500' },
  intelligence: { bg: 'bg-violet-50 dark:bg-violet-950/40', border: 'border-violet-200 dark:border-violet-800', text: 'text-violet-700 dark:text-violet-300', hover: 'hover:border-violet-400 dark:hover:border-violet-600', gradient: 'from-violet-500 to-purple-500' },
  business: { bg: 'bg-teal-50 dark:bg-teal-950/40', border: 'border-teal-200 dark:border-teal-800', text: 'text-teal-700 dark:text-teal-300', hover: 'hover:border-teal-400 dark:hover:border-teal-600', gradient: 'from-teal-500 to-cyan-500' },
  utility: { bg: 'bg-cyan-50 dark:bg-cyan-950/40', border: 'border-cyan-200 dark:border-cyan-800', text: 'text-cyan-700 dark:text-cyan-300', hover: 'hover:border-cyan-400 dark:hover:border-cyan-600', gradient: 'from-cyan-500 to-teal-500' },
  writing: { bg: 'bg-lime-50 dark:bg-lime-950/40', border: 'border-lime-200 dark:border-lime-800', text: 'text-lime-700 dark:text-lime-300', hover: 'hover:border-lime-400 dark:hover:border-lime-600', gradient: 'from-lime-500 to-green-500' },
  timer: { bg: 'bg-sky-50 dark:bg-sky-950/40', border: 'border-sky-200 dark:border-sky-800', text: 'text-sky-700 dark:text-sky-300', hover: 'hover:border-sky-400 dark:hover:border-sky-600', gradient: 'from-sky-500 to-cyan-500' },
  math: { bg: 'bg-indigo-50 dark:bg-indigo-950/40', border: 'border-indigo-200 dark:border-indigo-800', text: 'text-indigo-700 dark:text-indigo-300', hover: 'hover:border-indigo-400 dark:hover:border-indigo-600', gradient: 'from-indigo-500 to-violet-500' },
  social: { bg: 'bg-fuchsia-50 dark:bg-fuchsia-950/40', border: 'border-fuchsia-200 dark:border-fuchsia-800', text: 'text-fuchsia-700 dark:text-fuchsia-300', hover: 'hover:border-fuchsia-400 dark:hover:border-fuchsia-600', gradient: 'from-fuchsia-500 to-purple-500' },
  health: { bg: 'bg-rose-50 dark:bg-rose-950/40', border: 'border-rose-200 dark:border-rose-800', text: 'text-rose-700 dark:text-rose-300', hover: 'hover:border-rose-400 dark:hover:border-rose-600', gradient: 'from-rose-500 to-pink-500' },
  finance: { bg: 'bg-yellow-50 dark:bg-yellow-950/40', border: 'border-yellow-200 dark:border-yellow-800', text: 'text-yellow-700 dark:text-yellow-300', hover: 'hover:border-yellow-400 dark:hover:border-yellow-600', gradient: 'from-yellow-500 to-amber-500' },
};

/* ─── Floating Orbs ─── */
function FloatingOrbs() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="absolute top-[10%] left-[15%] w-72 h-72 rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-500/10 blur-3xl animate-float" />
      <div className="absolute top-[40%] right-[10%] w-96 h-96 rounded-full bg-gradient-to-br from-cyan-500/15 to-blue-500/10 blur-3xl animate-float-delayed" />
      <div className="absolute bottom-[10%] left-[30%] w-64 h-64 rounded-full bg-gradient-to-br from-emerald-500/15 to-teal-500/10 blur-3xl animate-float" style={{ animationDelay: '2s' }} />
      <div className="absolute top-[60%] left-[5%] w-48 h-48 rounded-full bg-gradient-to-br from-rose-500/10 to-pink-500/10 blur-3xl animate-float-delayed" style={{ animationDelay: '1s' }} />
    </div>
  );
}

/* ─── Icon: Sun ─── */
function SunIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5" />
      <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
    </svg>
  );
}

/* ─── Icon: Moon ─── */
function MoonIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

/* ─── Icon: Menu (Hamburger) ─── */
function MenuIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="4" y1="6" x2="20" y2="6" />
      <line x1="4" y1="12" x2="20" y2="12" />
      <line x1="4" y1="18" x2="20" y2="18" />
    </svg>
  );
}

/* ─── Icon: ArrowLeft ─── */
function ArrowLeftIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m15 18-6-6 6-6" />
    </svg>
  );
}

/* ─── Icon: Search ─── */
function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}

/* ─── Icon: X (Close) ─── */
function XIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6 6 18" /><path d="m6 6 12 12" />
    </svg>
  );
}

/* ─── Icon: Grid ─── */
function GridIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="7" height="7" x="3" y="3" rx="1" /><rect width="7" height="7" x="14" y="3" rx="1" />
      <rect width="7" height="7" x="14" y="14" rx="1" /><rect width="7" height="7" x="3" y="14" rx="1" />
    </svg>
  );
}

/* ─── Category Pill (Desktop) ─── */
function CategoryPill({
  cat,
  isActive,
  onClick,
}: {
  cat: { id: string; label: string; icon: string };
  isActive: boolean;
  onClick: () => void;
}) {
  const colors = categoryColors[cat.id];
  return (
    <button
      onClick={onClick}
      className={`
        relative flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium
        transition-all duration-200 whitespace-nowrap shrink-0 select-none
        ${isActive
          ? `${colors?.bg || 'bg-primary/10'} ${colors?.text || 'text-primary'} ${colors?.border || 'border-primary/30'} border shadow-sm`
          : 'text-muted-foreground border border-transparent hover:border-border hover:text-foreground hover:bg-muted/60'
        }
      `}
    >
      <span className="text-sm leading-none">{cat.icon}</span>
      <span className="hidden lg:inline">{cat.label}</span>
      {isActive && (
        <span className={`absolute inset-0 rounded-full bg-gradient-to-r ${colors?.gradient || 'from-primary to-primary'} opacity-5 pointer-events-none`} />
      )}
    </button>
  );
}

/* ─── Main App ─── */
export default function Home() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTool, setSelectedTool] = useState<ToolDef | null>(null);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const categoryScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const dark = saved ? saved === 'dark' : prefersDark;
    document.documentElement.classList.toggle('dark', dark);
    requestAnimationFrame(() => {
      setIsDark(dark);
      setMounted(true);
    });
  }, []);

  const toggleDark = useCallback(() => {
    const newDark = !isDark;
    setIsDark(newDark);
    document.documentElement.classList.toggle('dark', newDark);
    localStorage.setItem('theme', newDark ? 'dark' : 'light');
  }, [isDark]);

  const handleCategorySelect = useCallback((catId: string | null) => {
    setActiveCategory(prev => prev === catId ? null : catId);
  }, []);

  const filteredTools = useMemo(() => {
    let result = tools;
    if (activeCategory) {
      result = result.filter(t => t.category === activeCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(t =>
        t.name.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.categoryLabel.toLowerCase().includes(q)
      );
    }
    return result;
  }, [searchQuery, activeCategory]);

  const groupedTools = useMemo(() => {
    const groups: Record<string, ToolDef[]> = {};
    for (const tool of filteredTools) {
      if (!groups[tool.category]) groups[tool.category] = [];
      groups[tool.category].push(tool);
    }
    return groups;
  }, [filteredTools]);

  const activeCatLabel = activeCategory
    ? categories.find(c => c.id === activeCategory)?.label
    : null;

  const clearFilters = useCallback(() => {
    setSearchQuery('');
    setActiveCategory(null);
    setSelectedTool(null);
  }, []);

  /* ─── Tool Detail View ─── */
  if (selectedTool) {
    const colors = categoryColors[selectedTool.category] || categoryColors.utility;
    return (
      <div className="min-h-screen bg-background grid-bg flex flex-col">
        {/* Detail Header */}
        <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b">
          <div className="mx-auto flex h-14 max-w-7xl items-center gap-3 px-4 sm:px-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedTool(null)}
              className="gap-2 shrink-0 group -ml-2"
            >
              <span className="transition-transform group-hover:-translate-x-0.5"><ArrowLeftIcon /></span>
              <span className="text-sm">Back</span>
            </Button>
            <Separator orientation="vertical" className="h-5 mx-1" />
            <div className="flex items-center gap-2.5 min-w-0">
              <span className={`inline-flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br ${colors.gradient} text-white text-sm font-bold shrink-0 shadow-sm`}>
                {selectedTool.icon}
              </span>
              <h1 className="text-base font-semibold truncate">{selectedTool.name}</h1>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <Badge variant="secondary" className="hidden sm:inline-flex text-xs">{selectedTool.categoryLabel}</Badge>
              <Button variant="ghost" size="icon" onClick={toggleDark} className="h-9 w-9 shrink-0 rounded-lg" suppressHydrationWarning>
                {mounted && isDark ? <MoonIcon size={16} /> : <SunIcon size={16} />}
              </Button>
            </div>
          </div>
        </header>
        <main className="flex-1 mx-auto max-w-4xl w-full px-4 sm:px-6 py-8">
          <ToolErrorBoundary toolName={selectedTool.name} onBack={() => setSelectedTool(null)}>
            <Suspense fallback={<ToolLoadingFallback />}>
              {lazyTools[selectedTool.id] ? (
                React.createElement(lazyTools[selectedTool.id])
              ) : (
                <Card className="w-full">
                  <CardContent className="flex flex-col items-center justify-center py-16 gap-4">
                    <span className="text-5xl">🔧</span>
                    <h2 className="text-xl font-semibold">Coming Soon</h2>
                    <p className="text-sm text-muted-foreground text-center max-w-sm">
                      {selectedTool.name} is under development. Check back soon!
                    </p>
                    <Button variant="outline" onClick={() => setSelectedTool(null)}>Back to Tools</Button>
                  </CardContent>
                </Card>
              )}
            </Suspense>
          </ToolErrorBoundary>
        </main>
        <footer className="border-t mt-auto">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6 text-center">
            <p className="text-sm text-muted-foreground">ToolBox Pro — Free online tools. All processing happens in your browser.</p>
          </div>
        </footer>
      </div>
    );
  }

  /* ─── Homepage ─── */
  return (
    <div className="min-h-screen bg-background grid-bg flex flex-col">
      {/* ═══════════════ HEADER ═══════════════ */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b">
        {/* ── Top Bar ── */}
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex h-14 sm:h-16 items-center gap-3 sm:gap-4">
            {/* Logo */}
            <div
              className="flex items-center gap-2.5 shrink-0 cursor-pointer group"
              onClick={clearFilters}
            >
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 text-white text-lg shadow-lg shadow-indigo-500/20 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3 animate-gradient-shift">
                🧰
              </span>
              <div className="hidden sm:flex flex-col">
                <span className="text-lg font-bold leading-tight tracking-tight">ToolBox Pro</span>
                <span className="text-[10px] text-muted-foreground font-medium leading-tight tracking-wide uppercase">Free Online Tools</span>
              </div>
            </div>

            {/* Search Bar (Desktop) */}
            <div className="flex-1 max-w-lg mx-auto hidden md:block">
              <div className="relative group">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary">
                  <SearchIcon />
                </span>
                <Input
                  type="search"
                  placeholder="Search 75 tools..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-9 h-9 bg-muted/50 border-transparent focus:border-primary/40 focus:bg-background transition-all duration-200 rounded-lg text-sm"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <XIcon />
                  </button>
                )}
              </div>
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-1 sm:gap-2 ml-auto shrink-0">
              {/* Mobile Search Toggle — rendered below on small screens */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleDark}
                    className="h-9 w-9 rounded-lg transition-colors"
                    suppressHydrationWarning
                  >
                    {mounted && isDark ? <MoonIcon size={16} /> : <SunIcon size={16} />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs">
                  {mounted && isDark ? 'Light mode' : 'Dark mode'}
                </TooltipContent>
              </Tooltip>

              {/* Mobile Menu */}
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg md:hidden">
                    <MenuIcon />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-80 p-0">
                  <SheetHeader className="p-5 pb-3 border-b">
                    <SheetTitle className="flex items-center gap-2.5">
                      <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 text-white text-lg shadow-md">
                        🧰
                      </span>
                      <div className="flex flex-col items-start">
                        <span className="text-base font-bold leading-tight">ToolBox Pro</span>
                        <span className="text-[10px] text-muted-foreground font-medium leading-tight tracking-wide uppercase">Free Online Tools</span>
                      </div>
                    </SheetTitle>
                  </SheetHeader>

                  {/* Mobile Search */}
                  <div className="p-4 border-b">
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                        <SearchIcon />
                      </span>
                      <Input
                        type="search"
                        placeholder="Search tools..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 h-9 bg-muted/50 border-transparent focus:border-primary/40 rounded-lg text-sm"
                      />
                      {searchQuery && (
                        <button
                          onClick={() => setSearchQuery('')}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          <XIcon />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Mobile Categories */}
                  <div className="flex-1 overflow-y-auto py-3">
                    <p className="px-5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Categories</p>
                    <div className="flex flex-col px-3 gap-0.5">
                      <button
                        onClick={() => { setActiveCategory(null); setMobileMenuOpen(false); }}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${!activeCategory ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'}`}
                      >
                        <span className="text-base"><GridIcon /></span>
                        <span>All Tools</span>
                        <span className="ml-auto text-xs text-muted-foreground">{tools.length}</span>
                      </button>
                      {categories.map(cat => {
                        const toolCount = tools.filter(t => t.category === cat.id).length;
                        const isActive = activeCategory === cat.id;
                        const colors = categoryColors[cat.id];
                        return (
                          <button
                            key={cat.id}
                            onClick={() => { handleCategorySelect(cat.id); setMobileMenuOpen(false); }}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${isActive ? `${colors?.bg || 'bg-primary/10'} ${colors?.text || 'text-primary'} font-medium` : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'}`}
                          >
                            <span className="text-base">{cat.icon}</span>
                            <span>{cat.label}</span>
                            <span className="ml-auto text-xs opacity-60">{toolCount}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>

          {/* Mobile Search Bar (always visible on small screens) */}
          <div className="md:hidden pb-3">
            <div className="relative group">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary">
                <SearchIcon />
              </span>
              <Input
                type="search"
                placeholder="Search 75 tools..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-9 h-9 bg-muted/50 border-transparent focus:border-primary/40 focus:bg-background transition-all duration-200 rounded-lg text-sm"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <XIcon />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ── Category Navigation Bar ── */}
        <div className="border-t bg-muted/30">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <div ref={categoryScrollRef} className="flex items-center gap-1.5 py-2 overflow-x-auto scrollbar-none md:scrollbar-default">
              {/* All Tools pill */}
              <CategoryPill
                cat={{ id: '__all', label: 'All Tools', icon: '✦' }}
                isActive={!activeCategory}
                onClick={() => handleCategorySelect(null)}
              />
              <Separator orientation="vertical" className="h-4 mx-1 shrink-0" />
              {/* Category pills */}
              {categories.map(cat => (
                <CategoryPill
                  key={cat.id}
                  cat={cat}
                  isActive={activeCategory === cat.id}
                  onClick={() => handleCategorySelect(cat.id)}
                />
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* ═══════════════ HERO ═══════════════ */}
      {!searchQuery && !activeCategory && (
        <section className="relative border-b overflow-hidden">
          <FloatingOrbs />
          <div className="hero-3d-scene relative mx-auto max-w-7xl px-4 sm:px-6 py-16 sm:py-20 text-center z-10">
            <div className="perspective-1000 mb-8">
              <div className="inline-block preserve-3d animate-float">
                <div className="text-7xl sm:text-8xl select-none" style={{ filter: 'drop-shadow(0 20px 40px rgba(99,102,241,0.3))' }}>
                  🧰
                </div>
              </div>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight mb-4 animate-slide-up">
              <span className="block">Every Tool You Need,</span>
              <span className="block mt-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent animate-gradient-shift">
                Right in Your Browser
              </span>
            </h1>
            <p className="text-muted-foreground text-lg sm:text-xl max-w-2xl mx-auto animate-slide-up" style={{ animationDelay: '0.2s' }}>
              75 free online tools for PDF, business, math, health, and more. No signup, no server uploads — everything runs locally.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 mt-8 animate-slide-up" style={{ animationDelay: '0.4s' }}>
              {[
                { icon: '🔒', label: 'Privacy First' },
                { icon: '⚡', label: 'No Signup' },
                { icon: '🌐', label: 'Works Offline' },
                { icon: '📱', label: 'Mobile Friendly' },
              ].map((item) => (
                <div key={item.label} className="glass rounded-full px-4 py-2 flex items-center gap-2 text-sm font-medium animate-wave">
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </div>
              ))}
            </div>
            <div className="perspective-1500 mt-12 flex justify-center gap-4 sm:gap-6 animate-slide-up" style={{ animationDelay: '0.6s' }}>
              {[
                { icon: '📄', label: 'PDF Tools', gradient: 'from-rose-500 to-orange-500' },
                { icon: '💼', label: 'Business', gradient: 'from-emerald-500 to-cyan-500' },
                { icon: '🔢', label: 'Calculators', gradient: 'from-indigo-500 to-violet-500' },
              ].map((item, i) => (
                <div
                  key={item.label}
                  className="preserve-3d"
                  style={{ animation: `float ${4 + i}s ease-in-out infinite`, animationDelay: `${i * 0.7}s` }}
                >
                  <div className="glass rounded-2xl px-6 py-4 flex flex-col items-center gap-2 cursor-default hover:scale-105 transition-transform duration-300">
                    <span className="text-3xl">{item.icon}</span>
                    <span className="text-xs font-medium text-muted-foreground">{item.label}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ═══════════════ ACTIVE FILTER BANNER ═══════════════ */}
      {(activeCategory || searchQuery) && !selectedTool && (
        <div className="border-b bg-muted/30">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 py-3 flex items-center gap-3">
            <span className="text-sm text-muted-foreground">
              {filteredTools.length} {filteredTools.length === 1 ? 'tool' : 'tools'} found
            </span>
            {activeCatLabel && (
              <Badge className="text-xs gap-1.5 px-2.5 py-0.5">
                {categories.find(c => c.id === activeCategory)?.icon} {activeCatLabel}
                <button onClick={() => setActiveCategory(null)} className="hover:text-foreground/80 transition-colors ml-0.5"><XIcon size={10} /></button>
              </Badge>
            )}
            {searchQuery && (
              <Badge variant="secondary" className="text-xs gap-1.5 px-2.5 py-0.5">
                &quot;{searchQuery}&quot;
                <button onClick={() => setSearchQuery('')} className="hover:text-foreground/80 transition-colors ml-0.5"><XIcon size={10} /></button>
              </Badge>
            )}
            <button
              onClick={clearFilters}
              className="text-xs text-muted-foreground hover:text-foreground underline-offset-2 hover:underline transition-colors ml-auto"
            >
              Clear all
            </button>
          </div>
        </div>
      )}

      {/* ═══════════════ MAIN CONTENT ═══════════════ */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 py-8 flex-1">
        {searchQuery && filteredTools.length === 0 && (
          <div className="text-center py-16 animate-slide-up">
            <p className="text-4xl mb-4">🔍</p>
            <p className="text-muted-foreground text-lg">No tools found for &quot;{searchQuery}&quot;</p>
            <Button variant="link" onClick={() => { setSearchQuery(''); setActiveCategory(null); }}>Clear search</Button>
          </div>
        )}
        {categories.filter(cat => groupedTools[cat.id]).map((cat, catIdx) => {
          const catTools = groupedTools[cat.id];
          const colors = categoryColors[cat.id] || categoryColors.utility;
          return (
            <section key={cat.id} className="mb-12" style={{ contentVisibility: 'auto', containIntrinsicSize: 'auto 500px' }}>
              <div className="flex items-center gap-3 mb-5 group">
                <span className={`inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${colors.gradient} text-white text-lg shadow-lg transition-transform duration-200 group-hover:scale-105`}>
                  {cat.icon}
                </span>
                <h2 className="text-2xl font-bold">{cat.label}</h2>
                <Badge variant="outline" className="text-xs">{catTools.length} tools</Badge>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {catTools.map((tool) => (
                  <Card
                    key={tool.id}
                    className={`cursor-pointer border ${colors.border} ${colors.hover} hover:shadow-lg hover:-translate-y-1 h-full transition-all duration-200 overflow-hidden group/card`}
                    onClick={() => setSelectedTool(tool)}
                  >
                    <CardContent className="p-5 flex items-start gap-3">
                      <span className={`inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${colors.bg} ${colors.text} text-xl transition-transform duration-200 group-hover/card:scale-105`}>
                        {tool.icon}
                      </span>
                      <div className="min-w-0">
                        <h3 className="font-semibold text-sm leading-tight group-hover/card:text-primary transition-colors">{tool.name}</h3>
                        <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">{tool.description}</p>
                      </div>
                    </CardContent>
                    <div className={`h-1 w-0 bg-gradient-to-r ${colors.gradient} transition-all duration-300 group-hover/card:w-full`} />
                  </Card>
                ))}
              </div>
            </section>
          );
        })}
      </main>

      {/* ═══════════════ FOOTER ═══════════════ */}
      <footer className="border-t mt-auto">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8 text-center">
          <p className="text-sm text-muted-foreground">ToolBox Pro — Free online tools. All processing happens in your browser. No data is sent to any server.</p>
          <div className="flex justify-center gap-2 mt-3">
            <span className="text-xs text-muted-foreground/60">Made with</span>
            <span className="text-xs animate-wave">❤️</span>
            <span className="text-xs text-muted-foreground/60">and 3D magic</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
