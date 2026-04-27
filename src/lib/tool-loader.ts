'use client';

import React from 'react';

const moduleMap: Record<string, { module: string; export: string }> = {
  'pdf-merge':          { module: 'pdf-organize', export: 'PdfMerge' },
  'pdf-split':          { module: 'pdf-organize', export: 'PdfSplit' },
  'pdf-remove-pages':   { module: 'pdf-organize', export: 'PdfRemovePages' },
  'pdf-extract-pages':  { module: 'pdf-organize', export: 'PdfExtractPages' },
  'pdf-organize':       { module: 'pdf-organize', export: 'PdfOrganize' },
  'pdf-scan':           { module: 'pdf-organize', export: 'PdfScan' },
  'pdf-compress':       { module: 'pdf-optimize', export: 'PdfCompress' },
  'pdf-repair':         { module: 'pdf-optimize', export: 'PdfRepair' },
  'pdf-ocr':            { module: 'pdf-optimize', export: 'PdfOcr' },
  'jpg-to-pdf':         { module: 'pdf-convert', export: 'JpgToPdf' },
  'word-to-pdf':        { module: 'pdf-convert', export: 'WordToPdf' },
  'ppt-to-pdf':         { module: 'pdf-convert', export: 'PptToPdf' },
  'excel-to-pdf':       { module: 'pdf-convert', export: 'ExcelToPdf' },
  'html-to-pdf':        { module: 'pdf-convert', export: 'HtmlToPdf' },
  'pdf-to-jpg':         { module: 'pdf-convert', export: 'PdfToJpg' },
  'pdf-to-word':        { module: 'pdf-convert', export: 'PdfToWord' },
  'pdf-to-ppt':         { module: 'pdf-convert', export: 'PdfToPpt' },
  'pdf-to-excel':       { module: 'pdf-convert', export: 'PdfToExcel' },
  'pdf-to-pdfa':        { module: 'pdf-convert', export: 'PdfToPdfA' },
  'pdf-rotate':         { module: 'pdf-edit', export: 'PdfRotate' },
  'pdf-page-numbers':   { module: 'pdf-edit', export: 'PdfPageNumbers' },
  'pdf-watermark':      { module: 'pdf-edit', export: 'PdfWatermark' },
  'pdf-crop':           { module: 'pdf-edit', export: 'PdfCrop' },
  'pdf-edit-text':      { module: 'pdf-edit', export: 'PdfEditText' },
  'pdf-unlock':         { module: 'pdf-security', export: 'PdfUnlock' },
  'pdf-protect':        { module: 'pdf-security', export: 'PdfProtect' },
  'pdf-sign':           { module: 'pdf-security', export: 'PdfSign' },
  'pdf-redact':         { module: 'pdf-security', export: 'PdfRedact' },
  'pdf-compare':        { module: 'pdf-security', export: 'PdfCompare' },
  'pdf-summarize':      { module: 'pdf-intelligence', export: 'PdfSummarize' },
  'pdf-translate':      { module: 'pdf-intelligence', export: 'PdfTranslate' },
  'qr-generator':       { module: 'business-tools', export: 'QrGenerator' },
  'barcode-generator':  { module: 'business-tools', export: 'BarcodeGenerator' },
  'invoice-generator':  { module: 'business-tools', export: 'InvoiceGenerator' },
  'currency-converter': { module: 'business-tools', export: 'CurrencyConverter' },
  'unit-converter':     { module: 'business-tools', export: 'UnitConverter' },
  'password-generator': { module: 'text-tools', export: 'PasswordGenerator' },
  'json-formatter':     { module: 'text-tools', export: 'JsonFormatter' },
  'base64-encoder':     { module: 'text-tools', export: 'Base64Encoder' },
  'text-diff':          { module: 'text-tools', export: 'TextDiff' },
  'word-counter':       { module: 'text-tools', export: 'WordCounter' },
  'morse-translator':   { module: 'text-tools', export: 'MorseCodeTranslator' },
  'color-picker':       { module: 'utility-tools', export: 'ColorPicker' },
  'timezone-converter': { module: 'utility-tools', export: 'TimezoneConverter' },
  'age-calculator':     { module: 'utility-tools', export: 'AgeCalculator' },
  'random-generator':   { module: 'utility-tools', export: 'RandomGenerator' },
  'regex-tester':       { module: 'developer-tools', export: 'RegexTester' },
  'url-encoder':        { module: 'developer-tools', export: 'UrlEncoder' },
  'html-entities':      { module: 'developer-tools', export: 'HtmlEntities' },
  'css-gradient':       { module: 'developer-tools', export: 'CssGradient' },
  'lorem-ipsum':        { module: 'developer-tools', export: 'LoremIpsum' },
  'uuid-generator':     { module: 'developer-tools', export: 'UuidGenerator' },
  'hash-generator':     { module: 'developer-tools', export: 'HashGenerator' },
  'cron-builder':       { module: 'developer-tools', export: 'CronBuilder' },
  'jwt-decoder':        { module: 'developer-tools', export: 'JwtDecoder' },
  'markdown-preview':   { module: 'developer-tools', export: 'MarkdownPreview' },
  'binary-converter':   { module: 'developer-tools', export: 'BinaryConverter' },
  'image-resizer':      { module: 'image-tools', export: 'ImageResizer' },
  'image-compressor':   { module: 'image-tools', export: 'ImageCompressor' },
  'image-cropper':      { module: 'image-tools', export: 'ImageCropper' },
  'image-converter':    { module: 'image-tools', export: 'ImageConverter' },
  'image-to-base64':    { module: 'image-tools', export: 'ImageToBase64' },
  'base64-to-image':    { module: 'image-tools', export: 'Base64ToImage' },
  'gif-maker':          { module: 'image-tools', export: 'GifMaker' },
  'image-editor':       { module: 'image-tools', export: 'ImageEditor' },
  'calculator':         { module: 'math-tools', export: 'Calculator' },
  'percentage-calc':    { module: 'math-tools', export: 'PercentageCalc' },
  'tip-calculator':     { module: 'math-tools', export: 'TipCalculator' },
  'loan-calculator':    { module: 'math-tools', export: 'LoanCalculator' },
  'bmi-calculator':     { module: 'math-tools', export: 'BmiCalculator' },
  'compound-interest':  { module: 'math-tools', export: 'CompoundInterest' },
  'discount-calculator':{ module: 'math-tools', export: 'DiscountCalculator' },
  'area-calculator':    { module: 'math-tools', export: 'AreaCalculator' },
  'char-counter':       { module: 'social-tools', export: 'CharCounter' },
  'hashtag-generator':  { module: 'social-tools', export: 'HashtagGenerator' },
  'emoji-picker':       { module: 'social-tools', export: 'EmojiPicker' },
  'meta-tag-gen':       { module: 'social-tools', export: 'MetaTagGen' },
  'social-image':       { module: 'social-tools', export: 'SocialImage' },
  'calorie-calculator': { module: 'health-tools', export: 'CalorieCalculator' },
  'water-intake':       { module: 'health-tools', export: 'WaterIntake' },
  'heart-rate-zones':   { module: 'health-tools', export: 'HeartRateZones' },
  'sleep-calculator':   { module: 'health-tools', export: 'SleepCalculator' },
  'body-fat-calc':      { module: 'health-tools', export: 'BodyFatCalc' },
  'budget-planner':     { module: 'finance-tools', export: 'BudgetPlanner' },
  'savings-goal':       { module: 'finance-tools', export: 'SavingsGoal' },
  'tax-calculator':     { module: 'finance-tools', export: 'TaxCalculator' },
  'roi-calculator':     { module: 'finance-tools', export: 'RoiCalculator' },
  'currency-formatter': { module: 'finance-tools', export: 'CurrencyFormatter' },
  'case-converter':     { module: 'writing-tools', export: 'CaseConverter' },
  'slug-generator':     { module: 'writing-tools', export: 'SlugGenerator' },
  'text-repeater':      { module: 'writing-tools', export: 'TextRepeater' },
  'remove-duplicates':  { module: 'writing-tools', export: 'RemoveDuplicates' },
  'find-replace':       { module: 'writing-tools', export: 'FindReplace' },
  'text-to-handwriting':{ module: 'writing-tools', export: 'TextToHandwriting' },
  'stopwatch':          { module: 'timer-tools', export: 'Stopwatch' },
  'countdown-timer':    { module: 'timer-tools', export: 'CountdownTimer' },
  'pomodoro-timer':     { module: 'timer-tools', export: 'PomodoroTimer' },
  'decision-maker':     { module: 'timer-tools', export: 'DecisionMaker' },
  'habit-tracker':      { module: 'timer-tools', export: 'HabitTracker' },
  'world-clock':        { module: 'timer-tools', export: 'WorldClock' },
};

// Cache for loaded components
const componentCache = new Map<string, React.ComponentType>();

export async function loadToolComponent(toolId: string): Promise<React.ComponentType> {
  if (componentCache.has(toolId)) {
    return componentCache.get(toolId)!;
  }
  
  const mapping = moduleMap[toolId];
  if (!mapping) {
    return () => React.createElement('div', { className: 'p-8 text-center text-muted-foreground' }, 'Tool not found');
  }
  
  const mod = await import(`@/components/tools/${mapping.module}`);
  const Component = mod[mapping.export];
  if (!Component) {
    return () => React.createElement('div', { className: 'p-8 text-center text-destructive' }, `Export "${mapping.export}" not found in ${mapping.module}`);
  }
  
  componentCache.set(toolId, Component);
  return Component;
}
