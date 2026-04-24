'use client'

import React, { useState, useMemo, useCallback, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Slider } from '@/components/ui/slider'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import {
  Key, Braces, Binary, GitCompare, Type,
  Copy, RefreshCw, Upload, Check, X, AlertTriangle,
  FileText, Hash, ArrowRightLeft, Radio, Volume2
} from 'lucide-react'

// ==================== PasswordGenerator ====================
function calculateStrength(length: number, charset: number): { label: string; score: number; color: string } {
  const entropy = length * Math.log2(Math.max(charset, 1))
  if (entropy < 28) return { label: 'Weak', score: 1, color: 'bg-red-500' }
  if (entropy < 36) return { label: 'Fair', score: 2, color: 'bg-orange-500' }
  if (entropy < 60) return { label: 'Medium', score: 3, color: 'bg-yellow-500' }
  if (entropy < 80) return { label: 'Strong', score: 4, color: 'bg-green-500' }
  return { label: 'Very Strong', score: 5, color: 'bg-emerald-500' }
}

export function PasswordGenerator() {
  const [length, setLength] = useState(16)
  const [uppercase, setUppercase] = useState(true)
  const [lowercase, setLowercase] = useState(true)
  const [numbers, setNumbers] = useState(true)
  const [symbols, setSymbols] = useState(true)
  const [password, setPassword] = useState('')
  const [history, setHistory] = useState<string[]>([])

  const generate = useCallback(() => {
    let chars = ''
    if (uppercase) chars += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    if (lowercase) chars += 'abcdefghijklmnopqrstuvwxyz'
    if (numbers) chars += '0123456789'
    if (symbols) chars += '!@#$%^&*()_+-=[]{}|;:,.<>?'
    if (!chars) {
      toast.error('Select at least one character type')
      return
    }
    let result = ''
    const arr = new Uint32Array(length)
    crypto.getRandomValues(arr)
    for (let i = 0; i < length; i++) {
      result += chars[arr[i] % chars.length]
    }
    setPassword(result)
    setHistory(prev => [result, ...prev].slice(0, 5))
  }, [length, uppercase, lowercase, numbers, symbols])

  const charsetSize = (uppercase ? 26 : 0) + (lowercase ? 26 : 0) + (numbers ? 10 : 0) + (symbols ? 27 : 0)
  const strength = calculateStrength(length, charsetSize)

  const copyPassword = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('Password copied')
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Key className="h-5 w-5" /> Password Generator
        </CardTitle>
        <CardDescription>Generate secure passwords with customizable options</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {password && (
          <div className="bg-muted p-3 rounded-lg font-mono text-sm break-all flex items-start justify-between gap-2">
            <span>{password}</span>
            <Button variant="ghost" size="icon" className="shrink-0 h-8 w-8" onClick={() => copyPassword(password)}>
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        )}
        {password && (
          <div className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span>Strength:</span>
              <Badge variant={strength.score >= 4 ? 'default' : 'secondary'}>{strength.label}</Badge>
            </div>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className={`h-2 flex-1 rounded-full ${i <= strength.score ? strength.color : 'bg-muted'}`} />
              ))}
            </div>
          </div>
        )}
        <div className="space-y-2">
          <Label>Length: {length}</Label>
          <Slider value={[length]} onValueChange={v => setLength(v[0])} min={4} max={128} step={1} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center space-x-2">
            <Switch id="pw-upper" checked={uppercase} onCheckedChange={setUppercase} />
            <Label htmlFor="pw-upper" className="cursor-pointer">Uppercase (A-Z)</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Switch id="pw-lower" checked={lowercase} onCheckedChange={setLowercase} />
            <Label htmlFor="pw-lower" className="cursor-pointer">Lowercase (a-z)</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Switch id="pw-numbers" checked={numbers} onCheckedChange={setNumbers} />
            <Label htmlFor="pw-numbers" className="cursor-pointer">Numbers (0-9)</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Switch id="pw-symbols" checked={symbols} onCheckedChange={setSymbols} />
            <Label htmlFor="pw-symbols" className="cursor-pointer">Symbols (!@#$)</Label>
          </div>
        </div>
        <Button onClick={generate} className="w-full">
          <RefreshCw className="h-4 w-4 mr-2" /> Generate Password
        </Button>
        {history.length > 0 && (
          <div className="space-y-2">
            <Label className="text-muted-foreground">Recent Passwords</Label>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {history.map((pw, i) => (
                <div key={i} className="flex items-center gap-2 text-xs font-mono bg-muted/50 px-2 py-1 rounded">
                  <span className="truncate flex-1">{pw}</span>
                  <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => copyPassword(pw)}>
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ==================== JsonFormatter ====================
export function JsonFormatter() {
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [error, setError] = useState('')
  const [stats, setStats] = useState({ chars: 0, keys: 0, depth: 0 })

  const countKeys = (obj: unknown): number => {
    if (typeof obj !== 'object' || obj === null) return 0
    let count = 0
    if (Array.isArray(obj)) {
      obj.forEach(item => { count += countKeys(item) })
    } else {
      const entries = Object.entries(obj as Record<string, unknown>)
      count = entries.length
      entries.forEach(([, v]) => { count += countKeys(v) })
    }
    return count
  }

  const getDepth = (obj: unknown): number => {
    if (typeof obj !== 'object' || obj === null) return 0
    if (Array.isArray(obj)) {
      return obj.length === 0 ? 1 : 1 + Math.max(...obj.map(getDepth))
    }
    const vals = Object.values(obj as Record<string, unknown>)
    return vals.length === 0 ? 1 : 1 + Math.max(...vals.map(getDepth))
  }

  const updateStats = (parsed: unknown) => {
    setStats({
      chars: input.length,
      keys: countKeys(parsed),
      depth: getDepth(parsed),
    })
  }

  const format = () => {
    try {
      const parsed = JSON.parse(input)
      setOutput(JSON.stringify(parsed, null, 2))
      setError('')
      updateStats(parsed)
    } catch (e) {
      setError((e as Error).message)
      setOutput('')
    }
  }

  const minify = () => {
    try {
      const parsed = JSON.parse(input)
      setOutput(JSON.stringify(parsed))
      setError('')
      updateStats(parsed)
    } catch (e) {
      setError((e as Error).message)
      setOutput('')
    }
  }

  const validate = () => {
    try {
      const parsed = JSON.parse(input)
      setError('')
      updateStats(parsed)
      toast.success('Valid JSON ✓')
    } catch (e) {
      const msg = (e as Error).message
      setError(msg)
      toast.error('Invalid JSON')
    }
  }

  const copyOutput = () => {
    navigator.clipboard.writeText(output)
    toast.success('Copied to clipboard')
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Braces className="h-5 w-5" /> JSON Formatter
        </CardTitle>
        <CardDescription>Format, minify, and validate JSON data</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="json-input">JSON Input</Label>
          <Textarea id="json-input" value={input} onChange={e => setInput(e.target.value)} placeholder='{"key": "value"}' rows={6} className="font-mono text-sm" />
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button onClick={format} size="sm"><Hash className="h-4 w-4 mr-1" /> Format</Button>
          <Button onClick={minify} variant="outline" size="sm"><ArrowRightLeft className="h-4 w-4 mr-1" /> Minify</Button>
          <Button onClick={validate} variant="outline" size="sm"><Check className="h-4 w-4 mr-1" /> Validate</Button>
        </div>
        {error && (
          <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-lg flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
            <span className="break-all">{error}</span>
          </div>
        )}
        {output && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Output</Label>
              <Button variant="ghost" size="sm" onClick={copyOutput}>
                <Copy className="h-4 w-4 mr-1" /> Copy
              </Button>
            </div>
            <pre className="bg-muted p-3 rounded-lg text-sm font-mono overflow-auto max-h-64 whitespace-pre-wrap">{output}</pre>
          </div>
        )}
        {input && (
          <div className="flex gap-4 text-sm text-muted-foreground">
            <span>Chars: {input.length}</span>
            <span>Keys: {stats.keys}</span>
            <span>Depth: {stats.depth}</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ==================== Base64Encoder ====================
export function Base64Encoder() {
  const [tab, setTab] = useState('encode')
  const [encodeInput, setEncodeInput] = useState('')
  const [encodeOutput, setEncodeOutput] = useState('')
  const [decodeInput, setDecodeInput] = useState('')
  const [decodeOutput, setDecodeOutput] = useState('')
  const [decodeError, setDecodeError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleEncode = () => {
    try {
      const result = btoa(unescape(encodeURIComponent(encodeInput)))
      setEncodeOutput(result)
    } catch {
      toast.error('Failed to encode')
    }
  }

  const handleDecode = () => {
    try {
      const result = decodeURIComponent(escape(atob(decodeInput.trim())))
      setDecodeOutput(result)
      setDecodeError('')
    } catch {
      setDecodeError('Invalid Base64 input')
      setDecodeOutput('')
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      const base64 = result.split(',')[1] || result
      setEncodeOutput(base64)
      setEncodeInput(`[File: ${file.name}]`)
      toast.success('File encoded to Base64')
    }
    reader.readAsDataURL(file)
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('Copied to clipboard')
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Binary className="h-5 w-5" /> Base64 Encoder/Decoder
        </CardTitle>
        <CardDescription>Encode and decode Base64 strings and files</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="w-full">
            <TabsTrigger value="encode" className="flex-1">Encode</TabsTrigger>
            <TabsTrigger value="decode" className="flex-1">Decode</TabsTrigger>
          </TabsList>
          <TabsContent value="encode" className="space-y-4">
            <div className="space-y-2">
              <Label>Text to Encode</Label>
              <Textarea value={encodeInput} onChange={e => setEncodeInput(e.target.value)} placeholder="Enter text to encode..." rows={4} />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleEncode} className="flex-1">Encode</Button>
              <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                <Upload className="h-4 w-4 mr-2" /> Upload File
              </Button>
              <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} />
            </div>
            {encodeOutput && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Encoded Result</Label>
                  <Button variant="ghost" size="sm" onClick={() => copyToClipboard(encodeOutput)}>
                    <Copy className="h-4 w-4 mr-1" /> Copy
                  </Button>
                </div>
                <pre className="bg-muted p-3 rounded-lg text-sm font-mono overflow-auto max-h-48 whitespace-pre-wrap break-all">{encodeOutput}</pre>
              </div>
            )}
          </TabsContent>
          <TabsContent value="decode" className="space-y-4">
            <div className="space-y-2">
              <Label>Base64 to Decode</Label>
              <Textarea value={decodeInput} onChange={e => { setDecodeInput(e.target.value); setDecodeError('') }} placeholder="Enter Base64 string to decode..." rows={4} />
            </div>
            <Button onClick={handleDecode} className="w-full">Decode</Button>
            {decodeError && (
              <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-lg flex items-center gap-2">
                <X className="h-4 w-4 shrink-0" /> {decodeError}
              </div>
            )}
            {decodeOutput && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Decoded Result</Label>
                  <Button variant="ghost" size="sm" onClick={() => copyToClipboard(decodeOutput)}>
                    <Copy className="h-4 w-4 mr-1" /> Copy
                  </Button>
                </div>
                <pre className="bg-muted p-3 rounded-lg text-sm font-mono overflow-auto max-h-48 whitespace-pre-wrap break-all">{decodeOutput}</pre>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

// ==================== TextDiff ====================
interface DiffLine {
  type: 'added' | 'removed' | 'unchanged'
  content: string
  lineNumLeft?: number
  lineNumRight?: number
}

function computeDiff(text1: string, text2: string): DiffLine[] {
  const lines1 = text1.split('\n')
  const lines2 = text2.split('\n')
  const result: DiffLine[] = []
  let i = 0
  let j = 0
  let lineNum1 = 1
  let lineNum2 = 1

  while (i < lines1.length || j < lines2.length) {
    if (i < lines1.length && j < lines2.length && lines1[i] === lines2[j]) {
      result.push({ type: 'unchanged', content: lines1[i], lineNumLeft: lineNum1++, lineNumRight: lineNum2++ })
      i++; j++
    } else {
      // Look ahead for matches
      let foundInRight = -1
      for (let k = j; k < lines2.length; k++) {
        if (i < lines1.length && lines1[i] === lines2[k]) { foundInRight = k; break }
      }
      let foundInLeft = -1
      for (let k = i; k < lines1.length; k++) {
        if (j < lines2.length && lines1[k] === lines2[j]) { foundInLeft = k; break }
      }

      if (foundInRight !== -1 && (foundInLeft === -1 || foundInRight - j <= foundInLeft - i)) {
        while (j < foundInRight) {
          result.push({ type: 'added', content: lines2[j], lineNumRight: lineNum2++ })
          j++
        }
      } else if (foundInLeft !== -1) {
        while (i < foundInLeft) {
          result.push({ type: 'removed', content: lines1[i], lineNumLeft: lineNum1++ })
          i++
        }
      } else {
        if (i < lines1.length) {
          result.push({ type: 'removed', content: lines1[i], lineNumLeft: lineNum1++ })
          i++
        }
        if (j < lines2.length) {
          result.push({ type: 'added', content: lines2[j], lineNumRight: lineNum2++ })
          j++
        }
      }
    }
  }
  return result
}

export function TextDiff() {
  const [text1, setText1] = useState('')
  const [text2, setText2] = useState('')
  const [diff, setDiff] = useState<DiffLine[]>([])

  const compare = () => {
    const result = computeDiff(text1, text2)
    setDiff(result)
    const added = result.filter(l => l.type === 'added').length
    const removed = result.filter(l => l.type === 'removed').length
    toast.success(`Comparison complete: ${added} added, ${removed} removed`)
  }

  const added = diff.filter(l => l.type === 'added').length
  const removed = diff.filter(l => l.type === 'removed').length

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <GitCompare className="h-5 w-5" /> Text Diff
        </CardTitle>
        <CardDescription>Compare two texts and find differences</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Original Text</Label>
            <Textarea value={text1} onChange={e => setText1(e.target.value)} placeholder="Paste original text here..." rows={8} className="font-mono text-sm" />
          </div>
          <div className="space-y-2">
            <Label>Modified Text</Label>
            <Textarea value={text2} onChange={e => setText2(e.target.value)} placeholder="Paste modified text here..." rows={8} className="font-mono text-sm" />
          </div>
        </div>
        <Button onClick={compare} className="w-full">
          <GitCompare className="h-4 w-4 mr-2" /> Compare
        </Button>
        {diff.length > 0 && (
          <div className="space-y-2">
            <div className="flex gap-3 text-sm">
              <Badge variant="default" className="bg-green-600">+{added} added</Badge>
              <Badge variant="default" className="bg-red-600">-{removed} removed</Badge>
            </div>
            <div className="border rounded-lg overflow-auto max-h-96">
              {diff.map((line, idx) => (
                <div
                  key={idx}
                  className={`flex text-sm font-mono ${
                    line.type === 'added' ? 'bg-green-500/10 text-green-700 dark:text-green-400' :
                    line.type === 'removed' ? 'bg-red-500/10 text-red-700 dark:text-red-400' :
                    'bg-background'
                  }`}
                >
                  <span className="w-10 text-right pr-2 text-muted-foreground border-r shrink-0 select-none">
                    {line.type === 'added' ? line.lineNumRight : line.lineNumLeft || ''}
                  </span>
                  <span className="w-6 text-center shrink-0 select-none">
                    {line.type === 'added' ? '+' : line.type === 'removed' ? '-' : ' '}
                  </span>
                  <span className="px-2 whitespace-pre-wrap">{line.content}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ==================== WordCounter ====================
const STOP_WORDS = new Set([
  'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
  'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should',
  'may', 'might', 'can', 'shall', 'to', 'of', 'in', 'for', 'on', 'with', 'at',
  'by', 'from', 'as', 'into', 'about', 'but', 'or', 'and', 'not', 'no', 'so',
  'if', 'it', 'its', 'this', 'that', 'these', 'those', 'i', 'me', 'my', 'we',
  'our', 'you', 'your', 'he', 'him', 'his', 'she', 'her', 'they', 'them', 'their',
  'what', 'which', 'who', 'whom', 'how', 'when', 'where', 'why', 'all', 'each',
  'every', 'both', 'few', 'more', 'most', 'other', 'some', 'such', 'than', 'too',
  'very', 'just', 'also', 'now', 'then', 'here', 'there', 'up', 'out', 'only',
])

export function WordCounter() {
  const [text, setText] = useState('')

  const stats = useMemo(() => {
    const chars = text.length
    const charsNoSpaces = text.replace(/\s/g, '').length
    const words = text.trim() ? text.trim().split(/\s+/).length : 0
    const sentences = text.trim() ? (text.match(/[.!?]+/g) || []).length || (text.trim() ? 1 : 0) : 0
    const paragraphs = text.trim() ? text.split(/\n\s*\n/).filter(p => p.trim()).length || 1 : 0
    const readingTime = Math.max(1, Math.ceil(words / 200))

    // Keyword density
    const wordFreq: Record<string, number> = {}
    const lowerWords = text.toLowerCase().match(/\b[a-z']+\b/g) || []
    let totalContentWords = 0
    lowerWords.forEach(w => {
      if (!STOP_WORDS.has(w) && w.length > 1) {
        wordFreq[w] = (wordFreq[w] || 0) + 1
        totalContentWords++
      }
    })
    const topKeywords = Object.entries(wordFreq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([word, count]) => ({
        word,
        count,
        percentage: totalContentWords > 0 ? ((count / totalContentWords) * 100).toFixed(1) : '0.0',
      }))

    return { chars, charsNoSpaces, words, sentences, paragraphs, readingTime, topKeywords }
  }, [text])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Type className="h-5 w-5" /> Word Counter
        </CardTitle>
        <CardDescription>Analyze text with word count, keyword density, and more</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="wc-text">Enter Text</Label>
          <Textarea id="wc-text" value={text} onChange={e => setText(e.target.value)} placeholder="Type or paste your text here..." rows={6} />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[
            { label: 'Words', value: stats.words },
            { label: 'Characters', value: stats.chars },
            { label: 'No Spaces', value: stats.charsNoSpaces },
            { label: 'Sentences', value: stats.sentences },
            { label: 'Paragraphs', value: stats.paragraphs },
            { label: 'Reading Time', value: `${stats.readingTime} min` },
          ].map(stat => (
            <div key={stat.label} className="bg-muted p-3 rounded-lg text-center">
              <div className="text-2xl font-bold">{stat.value}</div>
              <div className="text-xs text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>
        {stats.topKeywords.length > 0 && (
          <div className="space-y-2">
            <Label className="flex items-center gap-1"><FileText className="h-4 w-4" /> Top Keywords</Label>
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted">
                    <th className="text-left p-2">Keyword</th>
                    <th className="text-right p-2">Count</th>
                    <th className="text-right p-2">Density</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.topKeywords.map(({ word, count, percentage }) => (
                    <tr key={word} className="border-t">
                      <td className="p-2">{word}</td>
                      <td className="text-right p-2">{count}</td>
                      <td className="text-right p-2">{percentage}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ==================== MorseCodeTranslator ====================
const MORSE_MAP: Record<string, string> = {
  'A': '.-', 'B': '-...', 'C': '-.-.', 'D': '-..', 'E': '.', 'F': '..-.',
  'G': '--.', 'H': '....', 'I': '..', 'J': '.---', 'K': '-.-', 'L': '.-..',
  'M': '--', 'N': '-.', 'O': '---', 'P': '.--.', 'Q': '--.-', 'R': '.-.',
  'S': '...', 'T': '-', 'U': '..-', 'V': '...-', 'W': '.--', 'X': '-..-',
  'Y': '-.--', 'Z': '--..', '0': '-----', '1': '.----', '2': '..---',
  '3': '...--', '4': '....-', '5': '.....', '6': '-....', '7': '--...',
  '8': '---..', '9': '----.', '.': '.-.-.-', ',': '--..--', '?': '..--..',
  "'": '.----.', '!': '-.-.--', '/': '-..-.', '(': '-.--.', ')': '-.--.-',
  '&': '.-...', ':': '---...', ';': '-.-.-.', '=': '-...-', '+': '.-.-.',
  '-': '-....-', '_': '..--.-', '"': '.-..-.', '$': '...-..-', '@': '.--.-.',
}

const REVERSE_MORSE: Record<string, string> = Object.fromEntries(
  Object.entries(MORSE_MAP).map(([k, v]) => [v, k])
)

export function MorseCodeTranslator() {
  const [tab, setTab] = useState('text-to-morse')
  const [textInput, setTextInput] = useState('')
  const [morseInput, setMorseInput] = useState('')
  const [output, setOutput] = useState('')
  const [error, setError] = useState('')
  const [isPlaying, setIsPlaying] = useState(false)

  const textToMorse = () => {
    const upper = textInput.toUpperCase()
    const result = upper.split('').map(ch => {
      if (ch === ' ') return '/'
      return MORSE_MAP[ch] || ''
    }).filter(Boolean).join(' ')
    setOutput(result)
    setError('')
    if (!result) setError('No valid characters to convert')
  }

  const morseToText = () => {
    try {
      const parts = morseInput.trim().split(/\s+/)
      const result = parts.map(part => {
        if (part === '/') return ' '
        const ch = REVERSE_MORSE[part]
        if (!ch && part !== '') {
          throw new Error(`Unknown morse code: "${part}"`)
        }
        return ch || ''
      }).join('')
      setOutput(result)
      setError('')
    } catch (e) {
      setError((e as Error).message)
      setOutput('')
    }
  }

  const playMorse = async () => {
    const morse = tab === 'text-to-morse' ? output : morseInput
    if (!morse) {
      toast.error('No morse code to play')
      return
    }

    setIsPlaying(true)
    const audioCtx = new AudioContext()
    const dotDuration = 0.08

    const playTone = (duration: number, startTime: number) => {
      const osc = audioCtx.createOscillator()
      const gain = audioCtx.createGain()
      osc.connect(gain)
      gain.connect(audioCtx.destination)
      osc.frequency.value = 700
      gain.gain.value = 0.3
      osc.start(startTime)
      osc.stop(startTime + duration)
    }

    let time = audioCtx.currentTime + 0.05
    const parts = morse.split(/\s+/)

    for (const part of parts) {
      if (part === '/') {
        time += dotDuration * 7
        continue
      }
      for (const ch of part) {
        if (ch === '.') {
          playTone(dotDuration, time)
          time += dotDuration * 2
        } else if (ch === '-') {
          playTone(dotDuration * 3, time)
          time += dotDuration * 4
        }
      }
      time += dotDuration * 3
    }

    setTimeout(() => {
      setIsPlaying(false)
      audioCtx.close()
    }, (time - audioCtx.currentTime) * 1000 + 200)
  }

  const copyOutput = () => {
    navigator.clipboard.writeText(output)
    toast.success('Copied to clipboard')
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Radio className="h-5 w-5" /> Morse Code Translator
        </CardTitle>
        <CardDescription>Translate text to Morse code and back, with audio playback</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="w-full">
            <TabsTrigger value="text-to-morse" className="flex-1">Text → Morse</TabsTrigger>
            <TabsTrigger value="morse-to-text" className="flex-1">Morse → Text</TabsTrigger>
          </TabsList>
          <TabsContent value="text-to-morse" className="space-y-4">
            <div className="space-y-2">
              <Label>Text Input</Label>
              <Textarea value={textInput} onChange={e => setTextInput(e.target.value)} placeholder="Type text to convert to Morse code..." rows={4} />
            </div>
            <Button onClick={textToMorse} className="w-full">
              <ArrowRightLeft className="h-4 w-4 mr-2" /> Convert to Morse
            </Button>
          </TabsContent>
          <TabsContent value="morse-to-text" className="space-y-4">
            <div className="space-y-2">
              <Label>Morse Code Input</Label>
              <Textarea value={morseInput} onChange={e => setMorseInput(e.target.value)} placeholder="Enter morse code (use . and -, spaces between letters, / for word breaks)..." rows={4} className="font-mono" />
            </div>
            <Button onClick={morseToText} className="w-full">
              <ArrowRightLeft className="h-4 w-4 mr-2" /> Convert to Text
            </Button>
          </TabsContent>
        </Tabs>
        {error && (
          <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-lg flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}
        {output && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Result</Label>
              <div className="flex gap-1">
                <Button variant="ghost" size="sm" onClick={playMorse} disabled={isPlaying}>
                  <Volume2 className="h-4 w-4 mr-1" /> {isPlaying ? 'Playing...' : 'Play Audio'}
                </Button>
                <Button variant="ghost" size="sm" onClick={copyOutput}>
                  <Copy className="h-4 w-4 mr-1" /> Copy
                </Button>
              </div>
            </div>
            <pre className="bg-muted p-3 rounded-lg text-sm font-mono overflow-auto max-h-48 whitespace-pre-wrap break-all">{output}</pre>
          </div>
        )}
        <div className="border rounded-lg p-3 bg-muted/30">
          <Label className="mb-2 block text-xs font-semibold uppercase tracking-wide">Morse Code Reference</Label>
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-9 gap-1 text-xs">
            {Object.entries(MORSE_MAP).slice(0, 36).map(([ch, code]) => (
              <div key={ch} className="bg-background rounded px-1.5 py-1 text-center">
                <span className="font-bold">{ch}</span>
                <span className="text-muted-foreground ml-1">{code}</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
