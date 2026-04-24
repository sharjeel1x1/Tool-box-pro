export interface ToolDef {
  id: string;
  name: string;
  description: string;
  category: string;
  categoryLabel: string;
  icon: string;
  color: string;
}

export const categories = [
  { id: 'organize', label: 'Organize PDF', icon: '📁', color: 'emerald' },
  { id: 'optimize', label: 'Optimize PDF', icon: '⚡', color: 'amber' },
  { id: 'convert-to', label: 'Convert to PDF', icon: '📥', color: 'blue' },
  { id: 'convert-from', label: 'Convert from PDF', icon: '📤', color: 'purple' },
  { id: 'edit', label: 'Edit PDF', icon: '✏️', color: 'rose' },
  { id: 'security', label: 'PDF Security', icon: '🔒', color: 'red' },
  { id: 'intelligence', label: 'PDF Intelligence', icon: '🤖', color: 'violet' },
  { id: 'business', label: 'Business Tools', icon: '💼', color: 'teal' },
  { id: 'utility', label: 'Utility Tools', icon: '🔧', color: 'cyan' },
  { id: 'math', label: 'Math & Calculation', icon: '🔢', color: 'indigo' },
  { id: 'social', label: 'Social Media Tools', icon: '📱', color: 'fuchsia' },
  { id: 'health', label: 'Health & Fitness', icon: '❤️', color: 'rose' },
  { id: 'finance', label: 'Finance Tools', icon: '💰', color: 'yellow' },
  { id: 'writing', label: 'Writing Tools', icon: '✍️', color: 'lime' },
  { id: 'timer', label: 'Timer & Productivity', icon: '⏱️', color: 'sky' },
];

export const tools: ToolDef[] = [
  // ==================== PDF TOOLS ====================
  // Organize PDF (6)
  { id: 'pdf-merge', name: 'Merge PDF', description: 'Combine multiple PDF files into one document', category: 'organize', categoryLabel: 'Organize PDF', icon: '📑', color: 'emerald' },
  { id: 'pdf-split', name: 'Split PDF', description: 'Separate a PDF into individual pages or custom ranges', category: 'organize', categoryLabel: 'Organize PDF', icon: '✂️', color: 'emerald' },
  { id: 'pdf-remove-pages', name: 'Remove Pages', description: 'Delete specific pages from a PDF document', category: 'organize', categoryLabel: 'Organize PDF', icon: '🗑️', color: 'emerald' },
  { id: 'pdf-extract-pages', name: 'Extract Pages', description: 'Extract specific pages from a PDF into a new file', category: 'organize', categoryLabel: 'Organize PDF', icon: '📤', color: 'emerald' },
  { id: 'pdf-organize', name: 'Organize PDF', description: 'Reorder, rotate, and rearrange pages in your PDF', category: 'organize', categoryLabel: 'Organize PDF', icon: '📋', color: 'emerald' },
  { id: 'pdf-scan', name: 'Scan to PDF', description: 'Use your camera to scan documents and create PDFs', category: 'organize', categoryLabel: 'Organize PDF', icon: '📷', color: 'emerald' },

  // Optimize PDF (3)
  { id: 'pdf-compress', name: 'Compress PDF', description: 'Reduce PDF file size while maintaining quality', category: 'optimize', categoryLabel: 'Optimize PDF', icon: '🗜️', color: 'amber' },
  { id: 'pdf-repair', name: 'Repair PDF', description: 'Fix corrupted or damaged PDF files', category: 'optimize', categoryLabel: 'Optimize PDF', icon: '🔧', color: 'amber' },
  { id: 'pdf-ocr', name: 'OCR PDF', description: 'Extract text from scanned PDFs using optical character recognition', category: 'optimize', categoryLabel: 'Optimize PDF', icon: '👁️', color: 'amber' },

  // Convert to PDF (5)
  { id: 'jpg-to-pdf', name: 'JPG to PDF', description: 'Convert JPG images to PDF documents', category: 'convert-to', categoryLabel: 'Convert to PDF', icon: '🖼️', color: 'blue' },
  { id: 'word-to-pdf', name: 'WORD to PDF', description: 'Convert Word documents to PDF format', category: 'convert-to', categoryLabel: 'Convert to PDF', icon: '📄', color: 'blue' },
  { id: 'ppt-to-pdf', name: 'POWERPOINT to PDF', description: 'Convert PowerPoint presentations to PDF', category: 'convert-to', categoryLabel: 'Convert to PDF', icon: '📊', color: 'blue' },
  { id: 'excel-to-pdf', name: 'EXCEL to PDF', description: 'Convert Excel spreadsheets to PDF', category: 'convert-to', categoryLabel: 'Convert to PDF', icon: '📈', color: 'blue' },
  { id: 'html-to-pdf', name: 'HTML to PDF', description: 'Convert HTML content to PDF documents', category: 'convert-to', categoryLabel: 'Convert to PDF', icon: '🌐', color: 'blue' },

  // Convert from PDF (5)
  { id: 'pdf-to-jpg', name: 'PDF to JPG', description: 'Convert PDF pages to JPG images', category: 'convert-from', categoryLabel: 'Convert from PDF', icon: '🖼️', color: 'purple' },
  { id: 'pdf-to-word', name: 'PDF to WORD', description: 'Convert PDF documents to editable Word files', category: 'convert-from', categoryLabel: 'Convert from PDF', icon: '📄', color: 'purple' },
  { id: 'pdf-to-ppt', name: 'PDF to POWERPOINT', description: 'Convert PDF to PowerPoint presentations', category: 'convert-from', categoryLabel: 'Convert from PDF', icon: '📊', color: 'purple' },
  { id: 'pdf-to-excel', name: 'PDF to EXCEL', description: 'Extract tables from PDF into Excel spreadsheets', category: 'convert-from', categoryLabel: 'Convert from PDF', icon: '📈', color: 'purple' },
  { id: 'pdf-to-pdfa', name: 'PDF to PDF/A', description: 'Convert PDF to archival-standard PDF/A format', category: 'convert-from', categoryLabel: 'Convert from PDF', icon: '📜', color: 'purple' },

  // Edit PDF (5)
  { id: 'pdf-rotate', name: 'Rotate PDF', description: 'Rotate PDF pages to any orientation', category: 'edit', categoryLabel: 'Edit PDF', icon: '🔄', color: 'rose' },
  { id: 'pdf-page-numbers', name: 'Add Page Numbers', description: 'Add page numbers to your PDF document', category: 'edit', categoryLabel: 'Edit PDF', icon: '🔢', color: 'rose' },
  { id: 'pdf-watermark', name: 'Add Watermark', description: 'Add text or image watermarks to PDF pages', category: 'edit', categoryLabel: 'Edit PDF', icon: '💧', color: 'rose' },
  { id: 'pdf-crop', name: 'Crop PDF', description: 'Trim and crop PDF page margins', category: 'edit', categoryLabel: 'Edit PDF', icon: '✂️', color: 'rose' },
  { id: 'pdf-edit-text', name: 'Edit PDF', description: 'Edit text content directly in your PDF', category: 'edit', categoryLabel: 'Edit PDF', icon: '✏️', color: 'rose' },

  // PDF Security (5)
  { id: 'pdf-unlock', name: 'Unlock PDF', description: 'Remove password protection from PDF files', category: 'security', categoryLabel: 'PDF Security', icon: '🔓', color: 'red' },
  { id: 'pdf-protect', name: 'Protect PDF', description: 'Add password protection to your PDF', category: 'security', categoryLabel: 'PDF Security', icon: '🔐', color: 'red' },
  { id: 'pdf-sign', name: 'Sign PDF', description: 'Add digital signatures to PDF documents', category: 'security', categoryLabel: 'PDF Security', icon: '✍️', color: 'red' },
  { id: 'pdf-redact', name: 'Redact PDF', description: 'Permanently black out sensitive information', category: 'security', categoryLabel: 'PDF Security', icon: '█', color: 'red' },
  { id: 'pdf-compare', name: 'Compare PDF', description: 'Compare two PDFs and highlight differences', category: 'security', categoryLabel: 'PDF Security', icon: '🔍', color: 'red' },

  // PDF Intelligence (2)
  { id: 'pdf-summarize', name: 'AI Summarizer', description: 'Get an AI-powered summary of your PDF content', category: 'intelligence', categoryLabel: 'PDF Intelligence', icon: '🧠', color: 'violet' },
  { id: 'pdf-translate', name: 'Translate PDF', description: 'Translate PDF content to different languages', category: 'intelligence', categoryLabel: 'PDF Intelligence', icon: '🌍', color: 'violet' },

  // ==================== BUSINESS TOOLS (5) ====================
  { id: 'qr-generator', name: 'QR Code Generator', description: 'Generate QR codes with customizable options and download', category: 'business', categoryLabel: 'Business Tools', icon: '📱', color: 'teal' },
  { id: 'barcode-generator', name: 'Barcode Generator', description: 'Generate Code 128 and EAN barcodes', category: 'business', categoryLabel: 'Business Tools', icon: '📊', color: 'teal' },
  { id: 'invoice-generator', name: 'Invoice Generator', description: 'Create professional invoices and download as PDF', category: 'business', categoryLabel: 'Business Tools', icon: '🧾', color: 'teal' },
  { id: 'currency-converter', name: 'Currency Converter', description: 'Convert between currencies with live exchange rates', category: 'business', categoryLabel: 'Business Tools', icon: '💱', color: 'teal' },
  { id: 'unit-converter', name: 'Unit Converter', description: 'Convert between length, weight, volume, and temperature', category: 'business', categoryLabel: 'Business Tools', icon: '📏', color: 'teal' },

  // ==================== UTILITY TOOLS (4) ====================
  { id: 'color-picker', name: 'Color Picker', description: 'Pick and convert colors between HEX, RGB, and HSL', category: 'utility', categoryLabel: 'Utility Tools', icon: '🎨', color: 'cyan' },
  { id: 'timezone-converter', name: 'Time Zone Converter', description: 'Convert time between different time zones', category: 'utility', categoryLabel: 'Utility Tools', icon: '🕐', color: 'cyan' },
  { id: 'age-calculator', name: 'Age Calculator', description: 'Calculate exact age from date of birth', category: 'utility', categoryLabel: 'Utility Tools', icon: '🎂', color: 'cyan' },
  { id: 'random-generator', name: 'Random Generator', description: 'Generate random numbers or names', category: 'utility', categoryLabel: 'Utility Tools', icon: '🎲', color: 'cyan' },

  // ==================== MATH & CALCULATION (8) ====================
  { id: 'calculator', name: 'Scientific Calculator', description: 'Full-featured calculator with scientific functions', category: 'math', categoryLabel: 'Math & Calculation', icon: '🧮', color: 'indigo' },
  { id: 'percentage-calc', name: 'Percentage Calculator', description: 'Calculate percentages, increases, decreases, and ratios', category: 'math', categoryLabel: 'Math & Calculation', icon: '%', color: 'indigo' },
  { id: 'tip-calculator', name: 'Tip Calculator', description: 'Calculate tips and split bills among friends', category: 'math', categoryLabel: 'Math & Calculation', icon: '💵', color: 'indigo' },
  { id: 'loan-calculator', name: 'Loan Calculator', description: 'Calculate monthly payments and total interest for loans', category: 'math', categoryLabel: 'Math & Calculation', icon: '🏦', color: 'indigo' },
  { id: 'bmi-calculator', name: 'BMI Calculator', description: 'Calculate Body Mass Index and health category', category: 'math', categoryLabel: 'Math & Calculation', icon: '⚖️', color: 'indigo' },
  { id: 'compound-interest', name: 'Compound Interest', description: 'Calculate compound interest with regular contributions', category: 'math', categoryLabel: 'Math & Calculation', icon: '📈', color: 'indigo' },
  { id: 'discount-calculator', name: 'Discount Calculator', description: 'Calculate sale prices and savings from discounts', category: 'math', categoryLabel: 'Math & Calculation', icon: '🏷️', color: 'indigo' },
  { id: 'area-calculator', name: 'Area Calculator', description: 'Calculate area and perimeter for common shapes', category: 'math', categoryLabel: 'Math & Calculation', icon: '📐', color: 'indigo' },

  // ==================== SOCIAL MEDIA TOOLS (5) ====================
  { id: 'char-counter', name: 'Character Counter', description: 'Count characters for Twitter, Instagram, and other platforms', category: 'social', categoryLabel: 'Social Media Tools', icon: '📝', color: 'fuchsia' },
  { id: 'hashtag-generator', name: 'Hashtag Generator', description: 'Generate relevant hashtags from your content', category: 'social', categoryLabel: 'Social Media Tools', icon: '#️⃣', color: 'fuchsia' },
  { id: 'emoji-picker', name: 'Emoji Picker', description: 'Browse and copy emojis organized by category', category: 'social', categoryLabel: 'Social Media Tools', icon: '😊', color: 'fuchsia' },
  { id: 'meta-tag-gen', name: 'Meta Tag Generator', description: 'Generate SEO meta tags for your web pages', category: 'social', categoryLabel: 'Social Media Tools', icon: '🏷️', color: 'fuchsia' },
  { id: 'social-image', name: 'Social Image Resizer', description: 'Resize images for social media platform requirements', category: 'social', categoryLabel: 'Social Media Tools', icon: '🖼️', color: 'fuchsia' },

  // ==================== HEALTH & FITNESS (5) ====================
  { id: 'calorie-calculator', name: 'Calorie Calculator', description: 'Calculate daily calorie needs based on activity level', category: 'health', categoryLabel: 'Health & Fitness', icon: '🍎', color: 'rose' },
  { id: 'water-intake', name: 'Water Intake Calculator', description: 'Calculate recommended daily water consumption', category: 'health', categoryLabel: 'Health & Fitness', icon: '💧', color: 'rose' },
  { id: 'heart-rate-zones', name: 'Heart Rate Zones', description: 'Calculate heart rate training zones for exercise', category: 'health', categoryLabel: 'Health & Fitness', icon: '❤️', color: 'rose' },
  { id: 'sleep-calculator', name: 'Sleep Calculator', description: 'Find optimal wake-up times based on sleep cycles', category: 'health', categoryLabel: 'Health & Fitness', icon: '😴', color: 'rose' },
  { id: 'body-fat-calc', name: 'Body Fat Calculator', description: 'Estimate body fat percentage using measurements', category: 'health', categoryLabel: 'Health & Fitness', icon: '📏', color: 'rose' },

  // ==================== FINANCE TOOLS (5) ====================
  { id: 'budget-planner', name: 'Budget Planner', description: 'Plan and track your monthly income and expenses', category: 'finance', categoryLabel: 'Finance Tools', icon: '📊', color: 'yellow' },
  { id: 'savings-goal', name: 'Savings Goal Calculator', description: 'Calculate how long to reach your savings target', category: 'finance', categoryLabel: 'Finance Tools', icon: '🎯', color: 'yellow' },
  { id: 'tax-calculator', name: 'Tax Calculator', description: 'Estimate income tax based on brackets', category: 'finance', categoryLabel: 'Finance Tools', icon: '📋', color: 'yellow' },
  { id: 'roi-calculator', name: 'ROI Calculator', description: 'Calculate return on investment percentage', category: 'finance', categoryLabel: 'Finance Tools', icon: '💹', color: 'yellow' },
  { id: 'currency-formatter', name: 'Currency Formatter', description: 'Format numbers as currency for different countries', category: 'finance', categoryLabel: 'Finance Tools', icon: '💲', color: 'yellow' },

  // ==================== WRITING TOOLS (5) ====================
  { id: 'case-converter', name: 'Case Converter', description: 'Convert text between uppercase, lowercase, title case, and more', category: 'writing', categoryLabel: 'Writing Tools', icon: 'Aa', color: 'lime' },
  { id: 'slug-generator', name: 'Slug Generator', description: 'Generate URL-friendly slugs from any text', category: 'writing', categoryLabel: 'Writing Tools', icon: '🔗', color: 'lime' },
  { id: 'text-repeater', name: 'Text Repeater', description: 'Repeat text multiple times with custom separators', category: 'writing', categoryLabel: 'Writing Tools', icon: '🔁', color: 'lime' },
  { id: 'remove-duplicates', name: 'Remove Duplicates', description: 'Remove duplicate lines from text instantly', category: 'writing', categoryLabel: 'Writing Tools', icon: '🧹', color: 'lime' },
  { id: 'find-replace', name: 'Find & Replace', description: 'Find and replace text with regex support', category: 'writing', categoryLabel: 'Writing Tools', icon: '🔎', color: 'lime' },

  // ==================== TIMER & PRODUCTIVITY (5) ====================
  { id: 'stopwatch', name: 'Stopwatch', description: 'Precise stopwatch with lap tracking', category: 'timer', categoryLabel: 'Timer & Productivity', icon: '⏱️', color: 'sky' },
  { id: 'countdown-timer', name: 'Countdown Timer', description: 'Set countdown timers with alerts', category: 'timer', categoryLabel: 'Timer & Productivity', icon: '⏳', color: 'sky' },
  { id: 'pomodoro-timer', name: 'Pomodoro Timer', description: 'Focus timer with work and break intervals', category: 'timer', categoryLabel: 'Timer & Productivity', icon: '🍅', color: 'sky' },
  { id: 'decision-maker', name: 'Decision Maker', description: 'Let the wheel decide! Enter options and spin', category: 'timer', categoryLabel: 'Timer & Productivity', icon: '🎯', color: 'sky' },
  { id: 'habit-tracker', name: 'Habit Tracker', description: 'Track daily habits with a visual streak calendar', category: 'timer', categoryLabel: 'Timer & Productivity', icon: '✅', color: 'sky' },
  { id: 'world-clock', name: 'World Clock', description: 'View current time across multiple cities worldwide', category: 'timer', categoryLabel: 'Timer & Productivity', icon: '🌍', color: 'sky' },
  { id: 'text-to-handwriting', name: 'Text to Handwriting', description: 'Convert typed text to realistic handwriting style', category: 'writing', categoryLabel: 'Writing Tools', icon: '✒️', color: 'lime' },
];

export function getToolById(id: string): ToolDef | undefined {
  return tools.find(t => t.id === id);
}

export function getToolsByCategory(categoryId: string): ToolDef[] {
  return tools.filter(t => t.category === categoryId);
}

export function generateJsonLd(tool: ToolDef) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: tool.name,
    description: tool.description,
    applicationCategory: 'UtilityApplication',
    operatingSystem: 'Any',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
  };
}

export function generateBreadcrumbJsonLd(tool: ToolDef) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: '/' },
      { '@type': 'ListItem', position: 2, name: tool.categoryLabel, item: `/#category=${tool.category}` },
      { '@type': 'ListItem', position: 3, name: tool.name, item: `/#tool=${tool.id}` },
    ],
  };
}
