'use client'

import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Slider } from '@/components/ui/slider'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import {
  CaseSensitive, Link2, Repeat, ListFilter, Search, PenTool,
  Copy, Download, Type, ArrowRight, Check,
  AlertTriangle, Replace
} from 'lucide-react'

// ==================== CaseConverter ====================
function toUpperCase(text: string) { return text.toUpperCase() }
function toLowerCase(text: string) { return text.toLowerCase() }
function toTitleCase(text: string) {
  return text.replace(/\w\S*/g, (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
}
function toSentenceCase(text: string) {
  return text.toLowerCase().replace(/(^\s*|[.!?]\s+)([a-z])/g, (_m, p1, p2) => p1 + p2.toUpperCase())
}
function toCamelCase(text: string) {
  return text.toLowerCase()
    .replace(/[^a-zA-Z0-9]+(.)/g, (_m, chr: string) => chr.toUpperCase())
    .replace(/^[A-Z]/, (chr) => chr.toLowerCase())
}
function toPascalCase(text: string) {
  const camel = toCamelCase(text)
  return camel.charAt(0).toUpperCase() + camel.slice(1)
}
function toSnakeCase(text: string) {
  return text.toLowerCase().replace(/[^a-zA-Z0-9]+/g, '_').replace(/^_|_$/g, '')
}
function toKebabCase(text: string) {
  return text.toLowerCase().replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '')
}
function toConstantCase(text: string) {
  return text.toUpperCase().replace(/[^a-zA-Z0-9]+/g, '_').replace(/^_|_$/g, '')
}

const CASE_OPTIONS = [
  { label: 'UPPERCASE', fn: toUpperCase, icon: Type },
  { label: 'lowercase', fn: toLowerCase, icon: Type },
  { label: 'Title Case', fn: toTitleCase, icon: Type },
  { label: 'Sentence case', fn: toSentenceCase, icon: Type },
  { label: 'camelCase', fn: toCamelCase, icon: Type },
  { label: 'PascalCase', fn: toPascalCase, icon: Type },
  { label: 'snake_case', fn: toSnakeCase, icon: Type },
  { label: 'kebab-case', fn: toKebabCase, icon: Type },
  { label: 'CONSTANT_CASE', fn: toConstantCase, icon: Type },
] as const

export function CaseConverter() {
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')

  const charCount = input.length
  const wordCount = input.trim() ? input.trim().split(/\s+/).length : 0

  const applyCase = (fn: (text: string) => string) => {
    if (!input.trim()) {
      toast.error('Please enter some text first')
      return
    }
    setOutput(fn(input))
  }

  const copyOutput = () => {
    navigator.clipboard.writeText(output)
    toast.success('Copied to clipboard')
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CaseSensitive className="h-5 w-5" /> Case Converter
        </CardTitle>
        <CardDescription>Convert text between uppercase, lowercase, title case, and more</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="cc-input">Input Text</Label>
          <Textarea
            id="cc-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type or paste your text here..."
            rows={4}
            className="resize-y"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {CASE_OPTIONS.map((opt) => (
            <Button key={opt.label} variant="outline" size="sm" onClick={() => applyCase(opt.fn)}>
              {opt.label}
            </Button>
          ))}
        </div>
        {output && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Result</Label>
              <Button variant="ghost" size="sm" onClick={copyOutput}>
                <Copy className="h-4 w-4 mr-1" /> Copy
              </Button>
            </div>
            <div className="bg-muted p-3 rounded-lg text-sm whitespace-pre-wrap break-all max-h-48 overflow-y-auto">
              {output}
            </div>
          </div>
        )}
        <div className="flex gap-4 text-sm text-muted-foreground">
          <span>Characters: {charCount}</span>
          <span>Words: {wordCount}</span>
        </div>
      </CardContent>
    </Card>
  )
}

// ==================== SlugGenerator ====================
const ACCENT_MAP: Record<string, string> = {
  'à': 'a', 'á': 'a', 'â': 'a', 'ã': 'a', 'ä': 'a', 'å': 'a',
  'è': 'e', 'é': 'e', 'ê': 'e', 'ë': 'e',
  'ì': 'i', 'í': 'i', 'î': 'i', 'ï': 'i',
  'ò': 'o', 'ó': 'o', 'ô': 'o', 'õ': 'o', 'ö': 'o',
  'ù': 'u', 'ú': 'u', 'û': 'u', 'ü': 'u',
  'ñ': 'n', 'ç': 'c', 'ß': 'ss', 'æ': 'ae', 'œ': 'oe',
  'ý': 'y', 'ÿ': 'y', 'đ': 'd', 'ł': 'l',
}

function transliterate(text: string): string {
  return text.split('').map((ch) => ACCENT_MAP[ch] || ch).join('')
}

export function SlugGenerator() {
  const [input, setInput] = useState('')
  const [separator, setSeparator] = useState<'-' | '_'>('-')
  const [lowercase, setLowercase] = useState(true)
  const [transliterateOn, setTransliterateOn] = useState(true)
  const [maxLength, setMaxLength] = useState(0)

  const slug = useMemo(() => {
    let result = input
    if (transliterateOn) result = transliterate(result)
    result = result.replace(/[^a-zA-Z0-9\s]/g, '')
    result = result.replace(/\s+/g, separator)
    if (lowercase) result = result.toLowerCase()
    if (maxLength > 0) result = result.slice(0, maxLength)
    // Remove trailing separator
    result = result.replace(new RegExp(`\\${separator}$`), '')
    return result
  }, [input, separator, lowercase, transliterateOn, maxLength])

  const copySlug = () => {
    if (!slug) {
      toast.error('No slug to copy')
      return
    }
    navigator.clipboard.writeText(slug)
    toast.success('Slug copied')
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Link2 className="h-5 w-5" /> Slug Generator
        </CardTitle>
        <CardDescription>Generate URL-friendly slugs from any text</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="slug-input">Text</Label>
          <Input
            id="slug-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Enter text to slugify..."
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Separator</Label>
            <Select value={separator} onValueChange={(v) => setSeparator(v as '-' | '_')}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="-">Hyphen (-)</SelectItem>
                <SelectItem value="_">Underscore (_)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Max Length {maxLength > 0 ? `(${maxLength})` : '(unlimited)'}</Label>
            <Input
              type="number"
              min={0}
              value={maxLength || ''}
              onChange={(e) => setMaxLength(Math.max(0, Number(e.target.value)))}
              placeholder="0 = unlimited"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center space-x-2">
            <Switch id="slug-lower" checked={lowercase} onCheckedChange={setLowercase} />
            <Label htmlFor="slug-lower" className="cursor-pointer">Lowercase</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Switch id="slug-translit" checked={transliterateOn} onCheckedChange={setTransliterateOn} />
            <Label htmlFor="slug-translit" className="cursor-pointer">Transliterate</Label>
          </div>
        </div>
        <div className="space-y-2">
          <Label>Live Preview</Label>
          <div className="bg-muted p-3 rounded-lg flex items-center justify-between gap-2">
            <span className="font-mono text-sm break-all flex-1">
              {slug || <span className="text-muted-foreground italic">Start typing above...</span>}
            </span>
            {slug && (
              <Button variant="ghost" size="icon" className="shrink-0 h-8 w-8" onClick={copySlug}>
                <Copy className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ==================== TextRepeater ====================
export function TextRepeater() {
  const [input, setInput] = useState('')
  const [count, setCount] = useState(3)
  const [separatorType, setSeparatorType] = useState<'newline' | 'space' | 'comma' | 'custom'>('newline')
  const [customSep, setCustomSep] = useState('')

  const result = useMemo(() => {
    if (!input || count < 1) return ''
    const sep = separatorType === 'newline' ? '\n' : separatorType === 'space' ? ' ' : separatorType === 'comma' ? ', ' : customSep
    return Array(count).fill(input).join(sep)
  }, [input, count, separatorType, customSep])

  const charCount = result.length

  const copyResult = () => {
    if (!result) {
      toast.error('Nothing to copy')
      return
    }
    navigator.clipboard.writeText(result)
    toast.success('Copied to clipboard')
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Repeat className="h-5 w-5" /> Text Repeater
        </CardTitle>
        <CardDescription>Repeat text multiple times with custom separators</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="tr-input">Text to Repeat</Label>
          <Input
            id="tr-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Enter text to repeat..."
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Repeat Count: {count}</Label>
            <Slider
              value={[count]}
              onValueChange={(v) => setCount(v[0])}
              min={1}
              max={1000}
              step={1}
            />
          </div>
          <div className="space-y-2">
            <Label>Separator</Label>
            <Select value={separatorType} onValueChange={(v) => setSeparatorType(v as 'newline' | 'space' | 'comma' | 'custom')}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newline">Newline</SelectItem>
                <SelectItem value="space">Space</SelectItem>
                <SelectItem value="comma">Comma</SelectItem>
                <SelectItem value="custom">Custom</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        {separatorType === 'custom' && (
          <div className="space-y-2">
            <Label htmlFor="tr-custom-sep">Custom Separator</Label>
            <Input
              id="tr-custom-sep"
              value={customSep}
              onChange={(e) => setCustomSep(e.target.value)}
              placeholder="Enter custom separator..."
            />
          </div>
        )}
        {result && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Result</Label>
              <Button variant="ghost" size="sm" onClick={copyResult}>
                <Copy className="h-4 w-4 mr-1" /> Copy
              </Button>
            </div>
            <pre className="bg-muted p-3 rounded-lg text-sm whitespace-pre-wrap break-all max-h-48 overflow-y-auto">
              {result}
            </pre>
          </div>
        )}
        <div className="text-sm text-muted-foreground">
          Result character count: {charCount.toLocaleString()}
        </div>
      </CardContent>
    </Card>
  )
}

// ==================== RemoveDuplicates ====================
export function RemoveDuplicates() {
  const [input, setInput] = useState('')
  const [caseSensitive, setCaseSensitive] = useState(true)
  const [trimWhitespace, setTrimWhitespace] = useState(true)
  const [removeEmpty, setRemoveEmpty] = useState(true)

  const result = useMemo(() => {
    let lines = input.split('\n')
    if (trimWhitespace) lines = lines.map((l) => l.trim())
    if (removeEmpty) lines = lines.filter((l) => l.length > 0)

    const seen = new Set<string>()
    const unique: string[] = []
    let dupesRemoved = 0

    for (const line of lines) {
      const key = caseSensitive ? line : line.toLowerCase()
      if (!seen.has(key)) {
        seen.add(key)
        unique.push(trimWhitespace ? line.trim() : line)
      } else {
        dupesRemoved++
      }
    }

    return { text: unique.join('\n'), originalCount: input.split('\n').length, uniqueCount: unique.length, dupesRemoved }
  }, [input, caseSensitive, trimWhitespace, removeEmpty])

  const copyResult = () => {
    if (!result.text) {
      toast.error('Nothing to copy')
      return
    }
    navigator.clipboard.writeText(result.text)
    toast.success('Copied to clipboard')
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ListFilter className="h-5 w-5" /> Remove Duplicates
        </CardTitle>
        <CardDescription>Remove duplicate lines from text instantly</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="rd-input">Input (one item per line)</Label>
          <Textarea
            id="rd-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Enter items, one per line..."
            rows={6}
            className="font-mono text-sm resize-y"
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="flex items-center space-x-2">
            <Switch id="rd-case" checked={caseSensitive} onCheckedChange={setCaseSensitive} />
            <Label htmlFor="rd-case" className="cursor-pointer">Case Sensitive</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Switch id="rd-trim" checked={trimWhitespace} onCheckedChange={setTrimWhitespace} />
            <Label htmlFor="rd-trim" className="cursor-pointer">Trim Whitespace</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Switch id="rd-empty" checked={removeEmpty} onCheckedChange={setRemoveEmpty} />
            <Label htmlFor="rd-empty" className="cursor-pointer">Remove Empty Lines</Label>
          </div>
        </div>
        {input && (
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-muted p-3 rounded-lg text-center">
              <div className="text-2xl font-bold">{result.originalCount}</div>
              <div className="text-xs text-muted-foreground">Original Lines</div>
            </div>
            <div className="bg-muted p-3 rounded-lg text-center">
              <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{result.uniqueCount}</div>
              <div className="text-xs text-muted-foreground">Unique Lines</div>
            </div>
            <div className="bg-muted p-3 rounded-lg text-center">
              <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">{result.dupesRemoved}</div>
              <div className="text-xs text-muted-foreground">Duplicates Removed</div>
            </div>
          </div>
        )}
        {result.text && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Result</Label>
              <Button variant="ghost" size="sm" onClick={copyResult}>
                <Copy className="h-4 w-4 mr-1" /> Copy
              </Button>
            </div>
            <pre className="bg-muted p-3 rounded-lg text-sm font-mono whitespace-pre-wrap break-all max-h-48 overflow-y-auto">
              {result.text}
            </pre>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ==================== FindReplace ====================
export function FindReplace() {
  const [input, setInput] = useState('')
  const [findText, setFindText] = useState('')
  const [replaceText, setReplaceText] = useState('')
  const [caseSensitive, setCaseSensitive] = useState(true)
  const [wholeWord, setWholeWord] = useState(false)
  const [useRegex, setUseRegex] = useState(false)
  const [result, setResult] = useState('')

  // Compute match count and regex error as derived values
  const { matchCount, regexError } = useMemo(() => {
    if (!findText || !input) return { matchCount: 0, regexError: '' }
    try {
      let flags = 'g'
      if (!caseSensitive) flags += 'i'
      let pattern: string
      if (useRegex) {
        pattern = findText
      } else {
        pattern = findText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      }
      if (wholeWord) pattern = `\\b${pattern}\\b`
      const regex = new RegExp(pattern, flags)
      const matches = input.match(regex)
      return { matchCount: matches ? matches.length : 0, regexError: '' }
    } catch (e) {
      return { matchCount: 0, regexError: (e as Error).message }
    }
  }, [input, findText, caseSensitive, wholeWord, useRegex])

  const replaceAll = () => {
    if (!findText || !input) {
      toast.error('Enter text and find pattern first')
      return
    }
    if (regexError) {
      toast.error('Fix regex error before replacing')
      return
    }
    try {
      let flags = 'g'
      if (!caseSensitive) flags += 'i'
      let pattern: string
      if (useRegex) {
        pattern = findText
      } else {
        pattern = findText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      }
      if (wholeWord) pattern = `\\b${pattern}\\b`
      const regex = new RegExp(pattern, flags)
      setResult(input.replace(regex, replaceText))
    } catch (e) {
      toast.error((e as Error).message)
    }
  }

  const copyResult = () => {
    navigator.clipboard.writeText(result)
    toast.success('Copied to clipboard')
  }

  // Highlighted preview
  const highlightedPreview = useMemo(() => {
    if (!findText || !input) return input
    try {
      let flags = 'g'
      if (!caseSensitive) flags += 'i'
      let pattern: string
      if (useRegex) {
        pattern = findText
      } else {
        pattern = findText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      }
      if (wholeWord) pattern = `\\b${pattern}\\b`
      const regex = new RegExp(pattern, flags)
      const parts: { text: string; isMatch: boolean }[] = []
      let lastIndex = 0
      let m: RegExpExecArray | null
      while ((m = regex.exec(input)) !== null) {
        if (m.index > lastIndex) {
          parts.push({ text: input.slice(lastIndex, m.index), isMatch: false })
        }
        parts.push({ text: m[0], isMatch: true })
        lastIndex = m.index + m[0].length
        if (!m[0].length) {
          regex.lastIndex++
        }
      }
      if (lastIndex < input.length) {
        parts.push({ text: input.slice(lastIndex), isMatch: false })
      }
      return parts
    } catch {
      return input
    }
  }, [input, findText, caseSensitive, wholeWord, useRegex])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="h-5 w-5" /> Find &amp; Replace
        </CardTitle>
        <CardDescription>Find and replace text with regex support</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="fr-input">Input Text</Label>
          <Textarea
            id="fr-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Enter your text here..."
            rows={4}
            className="resize-y"
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="fr-find" className="flex items-center gap-1">
              <Search className="h-4 w-4" /> Find
            </Label>
            <Input
              id="fr-find"
              value={findText}
              onChange={(e) => setFindText(e.target.value)}
              placeholder="Search for..."
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="fr-replace" className="flex items-center gap-1">
              <Replace className="h-4 w-4" /> Replace with
            </Label>
            <Input
              id="fr-replace"
              value={replaceText}
              onChange={(e) => setReplaceText(e.target.value)}
              placeholder="Replace with..."
            />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="flex items-center space-x-2">
            <Switch id="fr-case" checked={caseSensitive} onCheckedChange={setCaseSensitive} />
            <Label htmlFor="fr-case" className="cursor-pointer text-sm">Case Sensitive</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Switch id="fr-whole" checked={wholeWord} onCheckedChange={setWholeWord} />
            <Label htmlFor="fr-whole" className="cursor-pointer text-sm">Whole Word</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Switch id="fr-regex" checked={useRegex} onCheckedChange={setUseRegex} />
            <Label htmlFor="fr-regex" className="cursor-pointer text-sm">Use Regex</Label>
          </div>
        </div>
        {regexError && (
          <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-lg flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
            <span className="break-all">{regexError}</span>
          </div>
        )}
        <div className="flex items-center justify-between">
          <Badge variant="secondary">{matchCount} match{matchCount !== 1 ? 'es' : ''}</Badge>
          <Button onClick={replaceAll} disabled={!findText}>
            <ArrowRight className="h-4 w-4 mr-2" /> Replace All
          </Button>
        </div>
        {findText && input && !regexError && typeof highlightedPreview !== 'string' && (
          <div className="space-y-2">
            <Label>Match Preview</Label>
            <div className="bg-muted p-3 rounded-lg text-sm whitespace-pre-wrap break-words max-h-32 overflow-y-auto">
              {(highlightedPreview as { text: string; isMatch: boolean }[]).map((part, i) =>
                part.isMatch ? (
                  <span key={i} className="bg-yellow-300 dark:bg-yellow-600 text-black dark:text-white rounded-sm px-0.5">{part.text}</span>
                ) : (
                  <span key={i}>{part.text}</span>
                )
              )}
            </div>
          </div>
        )}
        {result && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Result</Label>
              <Button variant="ghost" size="sm" onClick={copyResult}>
                <Copy className="h-4 w-4 mr-1" /> Copy
              </Button>
            </div>
            <pre className="bg-muted p-3 rounded-lg text-sm whitespace-pre-wrap break-all max-h-48 overflow-y-auto">
              {result}
            </pre>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ==================== TextToHandwriting ====================
const HANDWRITING_FONTS = [
  { name: 'Caveat', value: 'Caveat' },
  { name: 'Dancing Script', value: 'Dancing Script' },
  { name: 'Satisfy', value: 'Satisfy' },
  { name: 'Indie Flower', value: 'Indie Flower' },
] as const

type PaperStyle = 'lined' | 'blank' | 'grid'
type InkColor = '#000000' | '#1e40af' | '#dc2626' | '#16a34a'

const INK_COLORS: { label: string; value: InkColor }[] = [
  { label: 'Black', value: '#000000' },
  { label: 'Blue', value: '#1e40af' },
  { label: 'Red', value: '#dc2626' },
  { label: 'Green', value: '#16a34a' },
]

export function TextToHandwriting() {
  const [text, setText] = useState('The quick brown fox jumps over the lazy dog.')
  const [fontFamily, setFontFamily] = useState('Caveat')
  const [fontSize, setFontSize] = useState(28)
  const [inkColor, setInkColor] = useState<InkColor>('#1e40af')
  const [paperStyle, setPaperStyle] = useState<PaperStyle>('lined')
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Load Google Fonts
  useEffect(() => {
    const fontLink = document.createElement('link')
    fontLink.rel = 'stylesheet'
    fontLink.href = 'https://fonts.googleapis.com/css2?family=Caveat:wght@400;700&family=Dancing+Script:wght@400;700&family=Satisfy&family=Indie+Flower&display=swap'
    document.head.appendChild(fontLink)
    return () => {
      document.head.removeChild(fontLink)
    }
  }, [])

  // Draw on canvas
  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const padding = 40
    const lineHeight = fontSize * 1.8
    const lines = text.split('\n')
    const canvasWidth = 700

    // Calculate height
    let totalHeight = padding * 2
    for (const line of lines) {
      ctx.font = `${fontSize}px '${fontFamily}', cursive`
      const words = line || ''
      let currentLine = ''
      let linesNeeded = 1
      for (const word of words.split(' ')) {
        const testLine = currentLine ? `${currentLine} ${word}` : word
        const metrics = ctx.measureText(testLine)
        if (metrics.width > canvasWidth - padding * 2 && currentLine) {
          linesNeeded++
          currentLine = word
        } else {
          currentLine = testLine
        }
      }
      totalHeight += linesNeeded * lineHeight
    }
    totalHeight = Math.max(totalHeight, 200)

    canvas.width = canvasWidth
    canvas.height = totalHeight

    // Paper background
    ctx.fillStyle = '#fefce8'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Paper style
    if (paperStyle === 'lined') {
      ctx.strokeStyle = '#d1d5db'
      ctx.lineWidth = 0.5
      for (let y = padding + lineHeight; y < totalHeight - padding; y += lineHeight) {
        ctx.beginPath()
        ctx.moveTo(padding, y)
        ctx.lineTo(canvasWidth - padding, y)
        ctx.stroke()
      }
      // Red margin line
      ctx.strokeStyle = '#fca5a5'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(60, 0)
      ctx.lineTo(60, totalHeight)
      ctx.stroke()
    } else if (paperStyle === 'grid') {
      ctx.strokeStyle = '#e5e7eb'
      ctx.lineWidth = 0.3
      const gridSize = 24
      for (let x = padding; x < canvasWidth - padding; x += gridSize) {
        ctx.beginPath()
        ctx.moveTo(x, padding)
        ctx.lineTo(x, totalHeight - padding)
        ctx.stroke()
      }
      for (let y = padding; y < totalHeight - padding; y += gridSize) {
        ctx.beginPath()
        ctx.moveTo(padding, y)
        ctx.lineTo(canvasWidth - padding, y)
        ctx.stroke()
      }
    }

    // Draw text
    ctx.fillStyle = inkColor
    ctx.font = `${fontSize}px '${fontFamily}', cursive`
    ctx.textBaseline = 'alphabetic'

    let y = padding + fontSize
    for (const line of lines) {
      const words = line.split(' ')
      let currentLine = ''
      for (const word of words) {
        const testLine = currentLine ? `${currentLine} ${word}` : word
        const metrics = ctx.measureText(testLine)
        if (metrics.width > canvasWidth - padding * 2 && currentLine) {
          ctx.fillText(currentLine, padding, y)
          currentLine = word
          y += lineHeight
        } else {
          currentLine = testLine
        }
      }
      ctx.fillText(currentLine, padding, y)
      y += lineHeight
    }
  }, [text, fontFamily, fontSize, inkColor, paperStyle])

  useEffect(() => {
    // Wait for fonts to load
    const timer = setTimeout(() => {
      drawCanvas()
    }, 300)
    return () => clearTimeout(timer)
  }, [drawCanvas])

  const downloadPng = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const link = document.createElement('a')
    link.download = 'handwriting.png'
    link.href = canvas.toDataURL('image/png')
    link.click()
    toast.success('Image downloaded')
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PenTool className="h-5 w-5" /> Text to Handwriting
        </CardTitle>
        <CardDescription>Convert typed text to realistic handwriting style</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="th-input">Input Text</Label>
          <Textarea
            id="th-input"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Enter text to convert to handwriting..."
            rows={4}
            className="resize-y"
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Font Style</Label>
            <Select value={fontFamily} onValueChange={setFontFamily}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {HANDWRITING_FONTS.map((f) => (
                  <SelectItem key={f.value} value={f.value}>{f.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Paper Style</Label>
            <Select value={paperStyle} onValueChange={(v) => setPaperStyle(v as PaperStyle)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="lined">Lined</SelectItem>
                <SelectItem value="blank">Blank</SelectItem>
                <SelectItem value="grid">Grid</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="space-y-2">
          <Label>Font Size: {fontSize}px</Label>
          <Slider
            value={[fontSize]}
            onValueChange={(v) => setFontSize(v[0])}
            min={14}
            max={56}
            step={1}
          />
        </div>
        <div className="space-y-2">
          <Label>Ink Color</Label>
          <div className="flex gap-2">
            {INK_COLORS.map((c) => (
              <button
                key={c.value}
                onClick={() => setInkColor(c.value)}
                className={`w-10 h-10 rounded-full border-2 transition-all flex items-center justify-center ${
                  inkColor === c.value ? 'border-primary scale-110 ring-2 ring-primary/30' : 'border-muted hover:border-muted-foreground'
                }`}
                style={{ backgroundColor: c.value }}
                title={c.label}
              >
                {inkColor === c.value && <Check className="h-4 w-4 text-white drop-shadow-sm" />}
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-2">
          <Label>Preview</Label>
          <div className="border rounded-lg overflow-auto max-h-96 bg-muted/30">
            <canvas ref={canvasRef} className="max-w-full" style={{ height: 'auto' }} />
          </div>
        </div>
        <Button onClick={downloadPng} className="w-full">
          <Download className="h-4 w-4 mr-2" /> Download as PNG
        </Button>
      </CardContent>
    </Card>
  )
}
