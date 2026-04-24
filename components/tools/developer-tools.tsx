'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Copy,
  Check,
  Plus,
  Trash2,
  RefreshCw,
  FileText,
  Hash,
  Link,
  Code2,
  Palette,
  Type,
  Fingerprint,
  Shield,
  Clock,
  Binary,
  ChevronDown,
  AlertTriangle,
} from 'lucide-react';

/* ─── Shared copy hook ─── */
function useCopy() {
  const [copied, setCopied] = useState(false);
  const copy = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* noop */
    }
  }, []);
  return { copied, copy };
}

function CopyButton({ text, className }: { text: string; className?: string }) {
  const { copied, copy } = useCopy();
  return (
    <Button
      variant="ghost"
      size="sm"
      className={className}
      onClick={() => copy(text)}
      aria-label="Copy to clipboard"
    >
      {copied ? <Check className="size-3.5 text-green-500" /> : <Copy className="size-3.5" />}
    </Button>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   1. RegexTester
   ═══════════════════════════════════════════════════════════════════════ */
export function RegexTester() {
  const [pattern, setPattern] = useState('');
  const [flags, setFlags] = useState({ g: true, i: false, m: false, s: false });
  const [testString, setTestString] = useState('');

  const flagStr = Object.entries(flags)
    .filter(([, v]) => v)
    .map(([k]) => k)
    .join('');

  const { matches, groups, error, highlighted } = useMemo(() => {
    if (!pattern) return { matches: [], groups: [], error: null, highlighted: testString };
    try {
      const re = new RegExp(pattern, flagStr);
      const allMatches: RegExpExecArray[] = [];
      if (flagStr.includes('g')) {
        let m: RegExpExecArray | null;
        while ((m = re.exec(testString)) !== null) {
          allMatches.push(m);
          if (m[0] === '') re.lastIndex++;
        }
      } else {
        const m = re.exec(testString);
        if (m) allMatches.push(m);
      }

      // Build highlighted HTML
      const parts: { text: string; isMatch: boolean; idx?: number }[] = [];
      if (allMatches.length === 0) {
        parts.push({ text: testString, isMatch: false });
      } else {
        let lastIdx = 0;
        allMatches.forEach((m, idx) => {
          if (m.index > lastIdx) {
            parts.push({ text: testString.slice(lastIdx, m.index), isMatch: false });
          }
          parts.push({ text: m[0], isMatch: true, idx });
          lastIdx = m.index + m[0].length;
        });
        if (lastIdx < testString.length) {
          parts.push({ text: testString.slice(lastIdx), isMatch: false });
        }
      }

      const highlightedHtml = parts
        .map((p) =>
          p.isMatch
            ? `<mark class="bg-yellow-200 dark:bg-yellow-700 rounded px-0.5">${p.text.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</mark>`
            : p.text.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br/>')
        )
        .join('');

      const capturedGroups = allMatches.flatMap((m, mi) =>
        m.slice(1).map((g, gi) => ({ match: mi, group: gi + 1, value: g ?? '' }))
      );

      return { matches: allMatches, groups: capturedGroups, error: null, highlighted: highlightedHtml };
    } catch (e: unknown) {
      return { matches: [], groups: [], error: (e as Error).message, highlighted: testString };
    }
  }, [pattern, flagStr, testString]);

  const toggleFlag = (flag: keyof typeof flags) => setFlags((f) => ({ ...f, [flag]: !f[flag] }));

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Hash className="size-5" /> Regex Tester</CardTitle>
        <CardDescription>Test regular expressions with real-time matching</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Pattern</Label>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground font-mono text-lg">/</span>
            <Input
              value={pattern}
              onChange={(e) => setPattern(e.target.value)}
              placeholder="Enter regex pattern..."
              className="font-mono"
            />
            <span className="text-muted-foreground font-mono text-lg">/{flagStr}</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-4">
          {(['g', 'i', 'm', 's'] as const).map((flag) => (
            <label key={flag} className="flex items-center gap-1.5 cursor-pointer">
              <Checkbox checked={flags[flag]} onCheckedChange={() => toggleFlag(flag)} />
              <span className="text-sm font-mono">{flag}</span>
            </label>
          ))}
        </div>
        <div className="space-y-2">
          <Label>Test String</Label>
          <Textarea
            value={testString}
            onChange={(e) => setTestString(e.target.value)}
            placeholder="Enter test string..."
            rows={4}
            className="font-mono"
          />
        </div>
        {error && (
          <div className="text-destructive text-sm bg-destructive/10 p-2 rounded">{error}</div>
        )}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Matches</Label>
            <Badge variant="secondary">{matches.length} match{matches.length !== 1 ? 'es' : ''}</Badge>
          </div>
          <div
            className="border rounded-md p-3 min-h-[60px] bg-muted/50 font-mono text-sm whitespace-pre-wrap break-all"
            dangerouslySetInnerHTML={{ __html: highlighted || '&nbsp;' }}
          />
        </div>
        {groups.length > 0 && (
          <div className="space-y-2">
            <Label>Capture Groups</Label>
            <div className="max-h-40 overflow-y-auto space-y-1">
              {groups.map((g, i) => (
                <div key={i} className="flex items-center gap-2 text-sm font-mono bg-muted/50 rounded p-1.5">
                  <Badge variant="outline" className="text-xs">Match {g.match + 1}, Group {g.group}</Badge>
                  <span className="truncate">{g.value || '(empty)'}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   2. UrlEncoder
   ═══════════════════════════════════════════════════════════════════════ */
export function UrlEncoder() {
  const [tab, setTab] = useState('encode');
  const [encodeInput, setEncodeInput] = useState('');
  const [decodeInput, setDecodeInput] = useState('');

  const encodeResult = useMemo(() => {
    if (!encodeInput) return { component: '', full: '' };
    return {
      component: encodeURIComponent(encodeInput),
      full: encodeURI(encodeInput),
    };
  }, [encodeInput]);

  const decodeResult = useMemo(() => {
    if (!decodeInput) return { component: '', full: '', error: '' };
    try {
      return {
        component: decodeURIComponent(decodeInput),
        full: decodeURI(decodeInput),
        error: '',
      };
    } catch (e: unknown) {
      return { component: '', full: '', error: (e as Error).message };
    }
  }, [decodeInput]);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Link className="size-5" /> URL Encoder / Decoder</CardTitle>
        <CardDescription>Encode and decode URLs and URI components</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="w-full">
            <TabsTrigger value="encode" className="flex-1">Encode</TabsTrigger>
            <TabsTrigger value="decode" className="flex-1">Decode</TabsTrigger>
          </TabsList>
          <TabsContent value="encode" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Input String</Label>
              <Input value={encodeInput} onChange={(e) => setEncodeInput(e.target.value)} placeholder="Enter URL or string to encode..." />
            </div>
            {encodeInput && (
              <div className="space-y-3">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs text-muted-foreground">encodeURIComponent</Label>
                    <CopyButton text={encodeResult.component} />
                  </div>
                  <div className="bg-muted p-2 rounded text-sm font-mono break-all">{encodeResult.component}</div>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs text-muted-foreground">encodeURI</Label>
                    <CopyButton text={encodeResult.full} />
                  </div>
                  <div className="bg-muted p-2 rounded text-sm font-mono break-all">{encodeResult.full}</div>
                </div>
              </div>
            )}
          </TabsContent>
          <TabsContent value="decode" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Encoded String</Label>
              <Input value={decodeInput} onChange={(e) => setDecodeInput(e.target.value)} placeholder="Enter encoded string to decode..." />
            </div>
            {decodeResult.error && (
              <div className="text-destructive text-sm bg-destructive/10 p-2 rounded">{decodeResult.error}</div>
            )}
            {decodeInput && !decodeResult.error && (
              <div className="space-y-3">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs text-muted-foreground">decodeURIComponent</Label>
                    <CopyButton text={decodeResult.component} />
                  </div>
                  <div className="bg-muted p-2 rounded text-sm font-mono break-all">{decodeResult.component}</div>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs text-muted-foreground">decodeURI</Label>
                    <CopyButton text={decodeResult.full} />
                  </div>
                  <div className="bg-muted p-2 rounded text-sm font-mono break-all">{decodeResult.full}</div>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   3. HtmlEntities
   ═══════════════════════════════════════════════════════════════════════ */
const HTML_ENTITIES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
  '\u00A0': '&nbsp;',
  '\u00A9': '&copy;',
  '\u00AE': '&reg;',
  '\u2122': '&trade;',
  '\u2013': '&ndash;',
  '\u2014': '&mdash;',
  '\u2018': '&lsquo;',
  '\u2019': '&rsquo;',
  '\u201C': '&ldquo;',
  '\u201D': '&rdquo;',
};

function encodeHtmlEntities(text: string): string {
  return text.replace(/[&<>"'\u00A0\u00A9\u00AE\u2122\u2013\u2014\u2018\u2019\u201C\u201D]/g, (ch) => HTML_ENTITIES[ch] ?? ch);
}

function decodeHtmlEntities(text: string): string {
  return text.replace(/&(?:#\d+|#x[\da-fA-F]+|[a-zA-Z]+);/g, (entity) => {
    const namedReverse: Record<string, string> = {};
    for (const [ch, ent] of Object.entries(HTML_ENTITIES)) namedReverse[ent] = ch;
    if (namedReverse[entity]) return namedReverse[entity];
    const numMatch = entity.match(/^&#(\d+);$/);
    if (numMatch) return String.fromCharCode(parseInt(numMatch[1], 10));
    const hexMatch = entity.match(/^&#x([\da-fA-F]+);$/);
    if (hexMatch) return String.fromCharCode(parseInt(hexMatch[1], 16));
    return entity;
  });
}

export function HtmlEntities() {
  const [tab, setTab] = useState('encode');
  const [encodeInput, setEncodeInput] = useState('');
  const [decodeInput, setDecodeInput] = useState('');

  const encoded = useMemo(() => encodeHtmlEntities(encodeInput), [encodeInput]);
  const decoded = useMemo(() => decodeHtmlEntities(decodeInput), [decodeInput]);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Code2 className="size-5" /> HTML Entities</CardTitle>
        <CardDescription>Encode and decode HTML entities</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="w-full">
            <TabsTrigger value="encode" className="flex-1">Encode</TabsTrigger>
            <TabsTrigger value="decode" className="flex-1">Decode</TabsTrigger>
          </TabsList>
          <TabsContent value="encode" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Input Text</Label>
              <Textarea value={encodeInput} onChange={(e) => setEncodeInput(e.target.value)} placeholder="Enter text to encode..." rows={3} />
            </div>
            {encodeInput && (
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-muted-foreground">Encoded Result</Label>
                  <CopyButton text={encoded} />
                </div>
                <div className="bg-muted p-2 rounded text-sm font-mono break-all whitespace-pre-wrap">{encoded}</div>
              </div>
            )}
          </TabsContent>
          <TabsContent value="decode" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Encoded Text</Label>
              <Textarea value={decodeInput} onChange={(e) => setDecodeInput(e.target.value)} placeholder="Enter HTML entities to decode..." rows={3} />
            </div>
            {decodeInput && (
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-muted-foreground">Decoded Result</Label>
                  <CopyButton text={decoded} />
                </div>
                <div className="bg-muted p-2 rounded text-sm font-mono break-all whitespace-pre-wrap">{decoded}</div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   4. CssGradient
   ═══════════════════════════════════════════════════════════════════════ */
interface ColorStop {
  id: number;
  color: string;
  position: number;
}

const GRADIENT_PRESETS: { name: string; type: 'linear' | 'radial' | 'conic'; angle: number; stops: ColorStop[] }[] = [
  { name: 'Sunset', type: 'linear', angle: 135, stops: [{ id: 1, color: '#f97316', position: 0 }, { id: 2, color: '#ec4899', position: 100 }] },
  { name: 'Ocean', type: 'linear', angle: 135, stops: [{ id: 1, color: '#06b6d4', position: 0 }, { id: 2, color: '#3b82f6', position: 100 }] },
  { name: 'Forest', type: 'linear', angle: 135, stops: [{ id: 1, color: '#22c55e', position: 0 }, { id: 2, color: '#14b8a6', position: 100 }] },
  { name: 'Purple Haze', type: 'linear', angle: 135, stops: [{ id: 1, color: '#a855f7', position: 0 }, { id: 2, color: '#6366f1', position: 50 }, { id: 3, color: '#ec4899', position: 100 }] },
  { name: 'Warm Flame', type: 'radial', angle: 0, stops: [{ id: 1, color: '#f97316', position: 0 }, { id: 2, color: '#ef4444', position: 100 }] },
  { name: 'Conic Rainbow', type: 'conic', angle: 0, stops: [{ id: 1, color: '#ef4444', position: 0 }, { id: 2, color: '#f97316', position: 25 }, { id: 3, color: '#22c55e', position: 50 }, { id: 4, color: '#3b82f6', position: 75 }, { id: 5, color: '#ef4444', position: 100 }] },
];

let _stopId = 10;
export function CssGradient() {
  const [type, setType] = useState<'linear' | 'radial' | 'conic'>('linear');
  const [angle, setAngle] = useState(135);
  const [stops, setStops] = useState<ColorStop[]>([
    { id: 1, color: '#f97316', position: 0 },
    { id: 2, color: '#ec4899', position: 100 },
  ]);

  const addStop = () => {
    const lastPos = stops[stops.length - 1]?.position ?? 50;
    setStops([...stops, { id: ++_stopId, color: '#888888', position: Math.min(lastPos + 20, 100) }]);
  };
  const removeStop = (id: number) => {
    if (stops.length <= 2) return;
    setStops(stops.filter((s) => s.id !== id));
  };
  const updateStop = (id: number, field: 'color' | 'position', value: string | number) => {
    setStops(stops.map((s) => (s.id === id ? { ...s, [field]: value } : s)));
  };

  const stopsStr = stops.map((s) => `${s.color} ${s.position}%`).join(', ');
  const cssValue =
    type === 'linear'
      ? `linear-gradient(${angle}deg, ${stopsStr})`
      : type === 'radial'
        ? `radial-gradient(circle, ${stopsStr})`
        : `conic-gradient(from ${angle}deg, ${stopsStr})`;

  const applyPreset = (preset: typeof GRADIENT_PRESETS[number]) => {
    setType(preset.type);
    setAngle(preset.angle);
    setStops(preset.stops.map((s) => ({ ...s, id: ++_stopId })));
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Palette className="size-5" /> CSS Gradient</CardTitle>
        <CardDescription>Build and preview CSS gradients</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div
          className="w-full h-40 rounded-lg border"
          style={{ background: cssValue }}
        />
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          <div className="space-y-1">
            <Label className="text-xs">Type</Label>
            <Select value={type} onValueChange={(v) => setType(v as 'linear' | 'radial' | 'conic')}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="linear">Linear</SelectItem>
                <SelectItem value="radial">Radial</SelectItem>
                <SelectItem value="conic">Conic</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {(type === 'linear' || type === 'conic') && (
            <div className="space-y-1">
              <Label className="text-xs">Angle: {angle}&deg;</Label>
              <Slider value={[angle]} onValueChange={([v]) => setAngle(v)} min={0} max={360} step={1} />
            </div>
          )}
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs">Color Stops</Label>
            <Button variant="outline" size="sm" onClick={addStop} disabled={stops.length >= 5}>
              <Plus className="size-3.5 mr-1" /> Add
            </Button>
          </div>
          {stops.map((s) => (
            <div key={s.id} className="flex items-center gap-2">
              <input
                type="color"
                value={s.color}
                onChange={(e) => updateStop(s.id, 'color', e.target.value)}
                className="size-8 rounded border cursor-pointer bg-transparent"
              />
              <Slider
                value={[s.position]}
                onValueChange={([v]) => updateStop(s.id, 'position', v)}
                min={0}
                max={100}
                step={1}
                className="flex-1"
              />
              <span className="text-xs text-muted-foreground w-10 text-right">{s.position}%</span>
              <Button variant="ghost" size="sm" onClick={() => removeStop(s.id)} disabled={stops.length <= 2}>
                <Trash2 className="size-3.5" />
              </Button>
            </div>
          ))}
        </div>
        <div className="space-y-2">
          <Label className="text-xs">Presets</Label>
          <div className="flex flex-wrap gap-2">
            {GRADIENT_PRESETS.map((p) => (
              <Button key={p.name} variant="outline" size="sm" onClick={() => applyPreset(p)}>
                <div className="size-4 rounded-full mr-1.5 border" style={{ background: `linear-gradient(135deg, ${p.stops[0].color}, ${p.stops[p.stops.length - 1].color})` }} />
                {p.name}
              </Button>
            ))}
          </div>
        </div>
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <Label className="text-xs">CSS Code</Label>
            <CopyButton text={`background: ${cssValue};`} />
          </div>
          <div className="bg-muted p-2 rounded text-sm font-mono break-all">background: {cssValue};</div>
        </div>
      </CardContent>
    </Card>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   5. LoremIpsum
   ═══════════════════════════════════════════════════════════════════════ */
const LOREM_WORDS = [
  'lorem','ipsum','dolor','sit','amet','consectetur','adipiscing','elit','sed','do',
  'eiusmod','tempor','incididunt','ut','labore','et','dolore','magna','aliqua','enim',
  'ad','minim','veniam','quis','nostrud','exercitation','ullamco','laboris','nisi','aliquip',
  'ex','ea','commodo','consequat','duis','aute','irure','in','reprehenderit','voluptate',
  'velit','esse','cillum','fugiat','nulla','pariatur','excepteur','sint','occaecat','cupidatat',
  'non','proident','sunt','culpa','qui','officia','deserunt','mollit','anim','id','est','laborum',
];

const CLASSIC_OPENING = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.';

function generateSentence(wordCount: number): string {
  const words: string[] = [];
  for (let i = 0; i < wordCount; i++) {
    words.push(LOREM_WORDS[Math.floor(Math.random() * LOREM_WORDS.length)]);
  }
  words[0] = words[0].charAt(0).toUpperCase() + words[0].slice(1);
  return words.join(' ') + '.';
}

function generateParagraph(sentenceCount: number): string {
  const sentences: string[] = [];
  for (let i = 0; i < sentenceCount; i++) {
    sentences.push(generateSentence(8 + Math.floor(Math.random() * 10)));
  }
  return sentences.join(' ');
}

export function LoremIpsum() {
  const [type, setType] = useState<'paragraphs' | 'sentences' | 'words'>('paragraphs');
  const [quantity, setQuantity] = useState(3);
  const [startWithClassic, setStartWithClassic] = useState(true);
  const [result, setResult] = useState('');

  const generate = () => {
    let text = '';
    if (type === 'paragraphs') {
      const paras: string[] = [];
      for (let i = 0; i < quantity; i++) {
        paras.push(generateParagraph(4 + Math.floor(Math.random() * 4)));
      }
      if (startWithClassic && paras.length > 0) paras[0] = CLASSIC_OPENING;
      text = paras.join('\n\n');
    } else if (type === 'sentences') {
      const sentences: string[] = [];
      for (let i = 0; i < quantity; i++) {
        sentences.push(generateSentence(8 + Math.floor(Math.random() * 10)));
      }
      if (startWithClassic && sentences.length > 0) sentences[0] = CLASSIC_OPENING;
      text = sentences.join(' ');
    } else {
      const words: string[] = [];
      for (let i = 0; i < quantity; i++) {
        words.push(LOREM_WORDS[Math.floor(Math.random() * LOREM_WORDS.length)]);
      }
      if (startWithClassic && words.length >= 2) {
        words[0] = 'lorem';
        words[1] = 'ipsum';
      }
      text = words.join(' ');
    }
    setResult(text);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Type className="size-5" /> Lorem Ipsum</CardTitle>
        <CardDescription>Generate placeholder text</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Type</Label>
            <Select value={type} onValueChange={(v) => setType(v as typeof type)}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="paragraphs">Paragraphs</SelectItem>
                <SelectItem value="sentences">Sentences</SelectItem>
                <SelectItem value="words">Words</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Quantity (1-20)</Label>
            <Input type="number" min={1} max={20} value={quantity} onChange={(e) => setQuantity(Math.max(1, Math.min(20, Number(e.target.value) || 1)))} />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Switch checked={startWithClassic} onCheckedChange={setStartWithClassic} id="classic-start" />
          <Label htmlFor="classic-start" className="text-sm cursor-pointer">Start with &quot;Lorem ipsum dolor sit amet...&quot;</Label>
        </div>
        <Button onClick={generate} className="w-full">
          <FileText className="size-4 mr-2" /> Generate
        </Button>
        {result && (
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <Label className="text-xs text-muted-foreground">Result</Label>
              <CopyButton text={result} />
            </div>
            <div className="bg-muted p-3 rounded text-sm whitespace-pre-wrap max-h-80 overflow-y-auto">{result}</div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   6. UuidGenerator
   ═══════════════════════════════════════════════════════════════════════ */
function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  // Fallback
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

export function UuidGenerator() {
  const [quantity, setQuantity] = useState(5);
  const [uuids, setUuids] = useState<string[]>([]);
  const [uppercase, setUppercase] = useState(false);
  const [noHyphens, setNoHyphens] = useState(false);

  const generate = () => {
    const result: string[] = [];
    for (let i = 0; i < quantity; i++) {
      let uuid = generateUUID();
      if (noHyphens) uuid = uuid.replace(/-/g, '');
      if (uppercase) uuid = uuid.toUpperCase();
      result.push(uuid);
    }
    setUuids(result);
  };

  const formatUuid = (uuid: string) => {
    let u = uuid;
    if (noHyphens) u = u.replace(/-/g, '');
    if (uppercase) u = u.toUpperCase();
    return u;
  };

  const allUuids = uuids.join('\n');

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Fingerprint className="size-5" /> UUID Generator</CardTitle>
        <CardDescription>Generate UUID v4 identifiers</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Quantity (1-50)</Label>
            <Input type="number" min={1} max={50} value={quantity} onChange={(e) => setQuantity(Math.max(1, Math.min(50, Number(e.target.value) || 1)))} />
          </div>
          <div className="space-y-3 pt-6">
            <div className="flex items-center gap-2">
              <Switch checked={uppercase} onCheckedChange={setUppercase} id="uuid-upper" />
              <Label htmlFor="uuid-upper" className="text-sm cursor-pointer">Uppercase</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={noHyphens} onCheckedChange={setNoHyphens} id="uuid-no-hyphens" />
              <Label htmlFor="uuid-no-hyphens" className="text-sm cursor-pointer">No hyphens</Label>
            </div>
          </div>
        </div>
        <Button onClick={generate} className="w-full">
          <RefreshCw className="size-4 mr-2" /> Generate
        </Button>
        {uuids.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs text-muted-foreground">{uuids.length} UUID{uuids.length > 1 ? 's' : ''}</Label>
              <CopyButton text={allUuids} />
            </div>
            <div className="max-h-64 overflow-y-auto space-y-1">
              {uuids.map((uuid, i) => (
                <div key={i} className="flex items-center justify-between bg-muted/50 rounded px-2 py-1.5 font-mono text-sm">
                  <span className="truncate">{formatUuid(uuid)}</span>
                  <CopyButton text={formatUuid(uuid)} />
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   7. HashGenerator
   ═══════════════════════════════════════════════════════════════════════ */
async function hashText(text: string, algorithm: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest(algorithm, data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export function HashGenerator() {
  const [input, setInput] = useState('');
  const [hashes, setHashes] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleInputChange = (value: string) => {
    setInput(value);
    if (timerRef.current) clearTimeout(timerRef.current);
    if (!value) {
      setHashes({});
      setLoading(false);
      return;
    }
    setLoading(true);
    timerRef.current = setTimeout(async () => {
      try {
        const [sha1, sha256, sha512] = await Promise.all([
          hashText(value, 'SHA-1'),
          hashText(value, 'SHA-256'),
          hashText(value, 'SHA-512'),
        ]);
        setHashes({ 'SHA-1': sha1, 'SHA-256': sha256, 'SHA-512': sha512 });
      } catch {
        setHashes({});
      }
      setLoading(false);
    }, 300);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Shield className="size-5" /> Hash Generator</CardTitle>
        <CardDescription>Generate SHA-1, SHA-256, and SHA-512 hashes</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Input Text</Label>
          <Textarea value={input} onChange={(e) => handleInputChange(e.target.value)} placeholder="Enter text to hash..." rows={3} />
        </div>
        {loading && <div className="text-sm text-muted-foreground animate-pulse">Computing hashes...</div>}
        {Object.entries(hashes).length > 0 && (
          <div className="space-y-3">
            {Object.entries(hashes).map(([algo, hash]) => (
              <div key={algo} className="space-y-1">
                <div className="flex items-center justify-between">
                  <Badge variant="outline">{algo}</Badge>
                  <CopyButton text={hash} />
                </div>
                <div className="bg-muted p-2 rounded text-xs font-mono break-all">{hash}</div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   8. CronBuilder
   ═══════════════════════════════════════════════════════════════════════ */
const CRON_PRESETS: { label: string; cron: string; desc: string }[] = [
  { label: 'Every minute', cron: '* * * * *', desc: 'Every minute' },
  { label: 'Every 5 minutes', cron: '*/5 * * * *', desc: 'Every 5 minutes' },
  { label: 'Every hour', cron: '0 * * * *', desc: 'Every hour at minute 0' },
  { label: 'Every day at midnight', cron: '0 0 * * *', desc: 'Every day at 00:00' },
  { label: 'Every Monday at 9 AM', cron: '0 9 * * 1', desc: 'Every Monday at 09:00' },
  { label: 'Every month on the 1st', cron: '0 0 1 * *', desc: 'Every month on day 1 at 00:00' },
  { label: 'Every weekday at 9 AM', cron: '0 9 * * 1-5', desc: 'Every weekday at 09:00' },
];

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTH_NAMES = ['', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function describeCron(parts: string[]): string {
  const [min, hour, dom, month, dow] = parts;
  const descParts: string[] = [];

  // Minute
  if (min === '*') descParts.push('every minute');
  else if (min.startsWith('*/')) descParts.push(`every ${min.slice(2)} minutes`);
  else descParts.push(`at minute ${min}`);

  // Hour
  if (hour === '*') descParts.push('every hour');
  else if (hour.startsWith('*/')) descParts.push(`every ${hour.slice(2)} hours`);
  else descParts.push(`at hour ${hour}`);

  // Day of month
  if (dom !== '*') descParts.push(`on day ${dom} of the month`);

  // Month
  if (month !== '*') {
    const monthNum = parseInt(month);
    if (!isNaN(monthNum) && monthNum >= 1 && monthNum <= 12) {
      descParts.push(`in ${MONTH_NAMES[monthNum]}`);
    } else {
      descParts.push(`in month ${month}`);
    }
  }

  // Day of week
  if (dow !== '*') {
    if (dow.includes('-')) {
      const [start, end] = dow.split('-').map(Number);
      descParts.push(`on ${DAY_NAMES[start]} through ${DAY_NAMES[end]}`);
    } else {
      const dowNum = parseInt(dow);
      if (!isNaN(dowNum) && dowNum >= 0 && dowNum <= 6) {
        descParts.push(`on ${DAY_NAMES[dowNum]}`);
      } else {
        descParts.push(`on day of week ${dow}`);
      }
    }
  }

  // Simplify common patterns
  if (min === '*' && hour === '*' && dom === '*' && month === '*' && dow === '*') return 'Every minute';
  if (min === '0' && hour === '*' && dom === '*' && month === '*' && dow === '*') return 'Every hour at minute 0';
  if (min === '0' && hour === '0' && dom === '*' && month === '*' && dow === '*') return 'Every day at midnight';

  return descParts.join(', ').replace(/^/, 'Runs ').replace('every minute, every hour', 'every hour').replace('every minute, every hour, on', 'on');
}

function getNextCronRuns(parts: string[], count: number): Date[] {
  const runs: Date[] = [];
  const now = new Date();
  const test = new Date(now.getTime());
  test.setSeconds(0, 0);
  test.setMinutes(test.getMinutes() + 1);

  const matchesField = (field: string, value: number, min: number, max: number): boolean => {
    if (field === '*') return true;
    if (field.startsWith('*/')) {
      const step = parseInt(field.slice(2));
      return step > 0 && value % step === 0;
    }
    if (field.includes(',')) return field.split(',').some((f) => matchesField(f, value, min, max));
    if (field.includes('-')) {
      const [start, end] = field.split('-').map(Number);
      return value >= start && value <= end;
    }
    return parseInt(field) === value;
  };

  const maxIter = 525600; // ~1 year of minutes
  let iter = 0;
  while (runs.length < count && iter < maxIter) {
    const min = test.getMinutes();
    const hour = test.getHours();
    const dom = test.getDate();
    const month = test.getMonth() + 1;
    const dow = test.getDay();

    if (
      matchesField(parts[0], min, 0, 59) &&
      matchesField(parts[1], hour, 0, 23) &&
      matchesField(parts[2], dom, 1, 31) &&
      matchesField(parts[3], month, 1, 12) &&
      matchesField(parts[4], dow, 0, 6)
    ) {
      runs.push(new Date(test.getTime()));
    }
    test.setMinutes(test.getMinutes() + 1);
    iter++;
  }
  return runs;
}

export function CronBuilder() {
  const [minute, setMinute] = useState('*');
  const [hour, setHour] = useState('*');
  const [dom, setDom] = useState('*');
  const [month, setMonth] = useState('*');
  const [dow, setDow] = useState('*');

  const parts = [minute, hour, dom, month, dow];
  const cronExpr = parts.join(' ');
  const description = describeCron(parts);
  const nextRuns = useMemo(() => getNextCronRuns(parts, 5), [minute, hour, dom, month, dow]);

  const applyPreset = (cron: string) => {
    const p = cron.split(' ');
    setMinute(p[0] ?? '*');
    setHour(p[1] ?? '*');
    setDom(p[2] ?? '*');
    setMonth(p[3] ?? '*');
    setDow(p[4] ?? '*');
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Clock className="size-5" /> Cron Builder</CardTitle>
        <CardDescription>Build and visualize cron expressions</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label className="text-xs">Presets</Label>
          <Select onValueChange={(v) => {
            const preset = CRON_PRESETS.find((p) => p.cron === v);
            if (preset) applyPreset(preset.cron);
          }}>
            <SelectTrigger className="w-full"><SelectValue placeholder="Select a preset..." /></SelectTrigger>
            <SelectContent>
              {CRON_PRESETS.map((p) => (
                <SelectItem key={p.cron} value={p.cron}>{p.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-5 gap-2">
          {[
            { label: 'Min', value: minute, setter: setMinute },
            { label: 'Hour', value: hour, setter: setHour },
            { label: 'Day', value: dom, setter: setDom },
            { label: 'Month', value: month, setter: setMonth },
            { label: 'DOW', value: dow, setter: setDow },
          ].map(({ label, value, setter }) => (
            <div key={label} className="space-y-1">
              <Label className="text-xs text-muted-foreground">{label}</Label>
              <Input value={value} onChange={(e) => setter(e.target.value)} className="text-center font-mono text-sm" />
            </div>
          ))}
        </div>
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <Label className="text-xs text-muted-foreground">Cron Expression</Label>
            <CopyButton text={cronExpr} />
          </div>
          <div className="bg-muted p-2 rounded text-center font-mono text-lg">{cronExpr}</div>
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Description</Label>
          <div className="text-sm">{description}</div>
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Next 5 Runs</Label>
          <div className="space-y-1 max-h-44 overflow-y-auto">
            {nextRuns.map((d, i) => (
              <div key={i} className="bg-muted/50 rounded px-2 py-1 text-sm font-mono">{d.toLocaleString()}</div>
            ))}
            {nextRuns.length === 0 && <div className="text-sm text-muted-foreground">No upcoming runs found</div>}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   9. JwtDecoder
   ═══════════════════════════════════════════════════════════════════════ */
function base64UrlDecode(str: string): string {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  const pad = base64.length % 4;
  if (pad) base64 += '='.repeat(4 - pad);
  try {
    return decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
  } catch {
    return atob(base64);
  }
}

export function JwtDecoder() {
  const [token, setToken] = useState('');

  const decoded = useMemo(() => {
    if (!token.trim()) return null;
    const parts = token.trim().split('.');
    if (parts.length !== 3) return { error: 'Invalid JWT: must have 3 parts separated by dots' };
    try {
      const header = JSON.parse(base64UrlDecode(parts[0]));
      const payload = JSON.parse(base64UrlDecode(parts[1]));
      const isExpired = payload.exp && Date.now() / 1000 > payload.exp;
      return { header, payload, signature: parts[2], isExpired };
    } catch (e: unknown) {
      return { error: `Failed to decode: ${(e as Error).message}` };
    }
  }, [token]);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Shield className="size-5" /> JWT Decoder</CardTitle>
        <CardDescription>Decode and inspect JSON Web Tokens</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>JWT Token</Label>
          <Textarea value={token} onChange={(e) => setToken(e.target.value)} placeholder="Paste your JWT token here..." rows={3} className="font-mono text-sm" />
        </div>
        {decoded && 'error' in decoded && decoded.error && (
          <div className="text-destructive text-sm bg-destructive/10 p-2 rounded">{decoded.error}</div>
        )}
        {decoded && !('error' in decoded) && (
          <div className="space-y-3">
            {decoded.isExpired && (
              <div className="flex items-center gap-2 bg-destructive/10 text-destructive p-2 rounded text-sm">
                <AlertTriangle className="size-4" />
                <span>This token is <strong>expired</strong> (exp: {new Date((decoded.payload as Record<string, unknown>).exp as number * 1000).toLocaleString()})</span>
              </div>
            )}
            <div className="space-y-1">
              <Label className="text-xs text-red-500 font-semibold">Header</Label>
              <pre className="bg-muted p-2 rounded text-xs font-mono overflow-x-auto whitespace-pre-wrap">{JSON.stringify(decoded.header, null, 2)}</pre>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-purple-500 font-semibold">Payload</Label>
              <pre className="bg-muted p-2 rounded text-xs font-mono overflow-x-auto whitespace-pre-wrap">{JSON.stringify(decoded.payload, null, 2)}</pre>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-blue-500 font-semibold">Signature</Label>
              <div className="bg-muted p-2 rounded text-xs font-mono break-all">{decoded.signature}</div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   10. MarkdownPreview
   ═══════════════════════════════════════════════════════════════════════ */
function renderMarkdown(md: string): string {
  let html = md;

  // Escape HTML (but we'll handle code blocks specially)
  const codeBlocks: string[] = [];
  const inlineCodes: string[] = [];

  // Extract code blocks
  html = html.replace(/```([\s\S]*?)```/g, (_, code) => {
    codeBlocks.push(`<pre class="bg-muted p-3 rounded overflow-x-auto text-sm"><code>${code.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</code></pre>`);
    return `%%CODEBLOCK_${codeBlocks.length - 1}%%`;
  });

  // Extract inline code
  html = html.replace(/`([^`]+)`/g, (_, code) => {
    inlineCodes.push(`<code class="bg-muted px-1.5 py-0.5 rounded text-sm">${code.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</code>`);
    return `%%INLINECODE_${inlineCodes.length - 1}%%`;
  });

  // Escape remaining HTML
  html = html.replace(/</g, '&lt;').replace(/>/g, '&gt;');

  // Horizontal rules
  html = html.replace(/^---$/gm, '<hr class="border-border my-4"/>');

  // Headers
  html = html.replace(/^### (.+)$/gm, '<h3 class="text-lg font-bold mt-4 mb-2">$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2 class="text-xl font-bold mt-5 mb-2">$1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h1 class="text-2xl font-bold mt-6 mb-3">$1</h1>');

  // Bold and italic
  html = html.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');

  // Links
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a class="text-primary underline" href="$2" target="_blank" rel="noopener noreferrer">$1</a>');

  // Blockquotes
  html = html.replace(/^&gt; (.+)$/gm, '<blockquote class="border-l-4 border-muted-foreground/30 pl-4 italic text-muted-foreground my-2">$1</blockquote>');

  // Unordered lists
  html = html.replace(/^- (.+)$/gm, '<li class="ml-4 list-disc">$1</li>');

  // Ordered lists
  html = html.replace(/^\d+\. (.+)$/gm, '<li class="ml-4 list-decimal">$1</li>');

  // Paragraphs / line breaks
  html = html.replace(/\n\n/g, '</p><p class="my-2">');
  html = html.replace(/\n/g, '<br/>');

  // Restore code blocks and inline code
  codeBlocks.forEach((block, i) => {
    html = html.replace(`%%CODEBLOCK_${i}%%`, block);
  });
  inlineCodes.forEach((code, i) => {
    html = html.replace(`%%INLINECODE_${i}%%`, code);
  });

  return `<div class="prose prose-sm dark:prose-invert max-w-none"><p class="my-2">${html}</p></div>`;
}

const SAMPLE_MARKDOWN = `# Welcome to Markdown Preview

This is a **live preview** of your *markdown* content.

## Features

- Bold and italic text
- Headers (h1, h2, h3)
- Lists and links
- Code examples

### Code Example

\`\`\`
function hello() {
  console.log("Hello, World!");
}
\`\`\`

Use \`console.log()\` for debugging.

> This is a blockquote

---

1. First item
2. Second item
3. Third item

Visit [GitHub](https://github.com) for more info.`;

export function MarkdownPreview() {
  const [markdown, setMarkdown] = useState('');

  const renderedHtml = useMemo(() => renderMarkdown(markdown), [markdown]);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><FileText className="size-5" /> Markdown Preview</CardTitle>
        <CardDescription>Write and preview Markdown side by side</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button variant="outline" size="sm" onClick={() => setMarkdown(SAMPLE_MARKDOWN)}>
          <FileText className="size-3.5 mr-1.5" /> Sample Markdown
        </Button>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Markdown</Label>
            <Textarea
              value={markdown}
              onChange={(e) => setMarkdown(e.target.value)}
              placeholder="Type your markdown here..."
              rows={16}
              className="font-mono text-sm resize-y"
            />
          </div>
          <div className="space-y-2">
            <Label>Preview</Label>
            <div
              className="border rounded-md p-3 min-h-[340px] max-h-[500px] overflow-y-auto bg-background text-sm"
              dangerouslySetInnerHTML={{ __html: renderedHtml || '<span class="text-muted-foreground">Preview will appear here...</span>' }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   11. BinaryConverter
   ═══════════════════════════════════════════════════════════════════════ */
export function BinaryConverter() {
  const [inputBase, setInputBase] = useState<'decimal' | 'binary' | 'hex' | 'octal'>('decimal');
  const [input, setInput] = useState('');
  const [bitSize, setBitSize] = useState<8 | 16 | 32>(32);

  const conversions = useMemo(() => {
    if (!input.trim()) return null;
    let decimal: number | null = null;

    try {
      switch (inputBase) {
        case 'decimal':
          decimal = parseInt(input, 10);
          break;
        case 'binary':
          decimal = parseInt(input, 2);
          break;
        case 'hex':
          decimal = parseInt(input, 16);
          break;
        case 'octal':
          decimal = parseInt(input, 8);
          break;
      }
    } catch {
      return null;
    }

    if (isNaN(decimal)) return null;

    const padBinary = (n: number, bits: number) => {
      const bin = (n >>> 0).toString(2);
      if (bin.length <= bits) return bin.padStart(bits, '0');
      return bin.slice(-bits);
    };

    const asciiChar = decimal >= 32 && decimal <= 126 ? String.fromCharCode(decimal) : null;

    return {
      decimal: decimal.toString(10),
      binary: padBinary(decimal, bitSize),
      hex: (decimal >>> 0).toString(16).toUpperCase().padStart(bitSize / 4, '0'),
      octal: (decimal >>> 0).toString(8).padStart(Math.ceil(bitSize / 3), '0'),
      ascii: asciiChar,
    };
  }, [input, inputBase, bitSize]);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Binary className="size-5" /> Binary Converter</CardTitle>
        <CardDescription>Convert between number bases</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Input Base</Label>
            <Select value={inputBase} onValueChange={(v) => { setInputBase(v as typeof inputBase); setInput(''); }}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="decimal">Decimal</SelectItem>
                <SelectItem value="binary">Binary</SelectItem>
                <SelectItem value="hex">Hexadecimal</SelectItem>
                <SelectItem value="octal">Octal</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Bit Size</Label>
            <Select value={String(bitSize)} onValueChange={(v) => setBitSize(Number(v) as 8 | 16 | 32)}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="8">8-bit</SelectItem>
                <SelectItem value="16">16-bit</SelectItem>
                <SelectItem value="32">32-bit</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="space-y-2">
          <Label>Value</Label>
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              inputBase === 'decimal'
                ? 'Enter decimal number...'
                : inputBase === 'binary'
                  ? 'Enter binary number...'
                  : inputBase === 'hex'
                    ? 'Enter hexadecimal number...'
                    : 'Enter octal number...'
            }
            className="font-mono"
          />
        </div>
        {conversions && (
          <div className="space-y-2">
            {[
              { label: 'Decimal', value: conversions.decimal, color: 'text-green-600 dark:text-green-400' },
              { label: 'Binary', value: conversions.binary, color: 'text-blue-600 dark:text-blue-400' },
              { label: 'Hexadecimal', value: conversions.hex, color: 'text-purple-600 dark:text-purple-400' },
              { label: 'Octal', value: conversions.octal, color: 'text-orange-600 dark:text-orange-400' },
            ].map(({ label, value, color }) => (
              <div key={label} className="flex items-center justify-between bg-muted/50 rounded px-3 py-2">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <Badge variant="outline" className="shrink-0">{label}</Badge>
                  <span className={`font-mono text-sm truncate ${color}`}>{value}</span>
                </div>
                <CopyButton text={value} />
              </div>
            ))}
            {conversions.ascii && (
              <div className="flex items-center justify-between bg-muted/50 rounded px-3 py-2">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">ASCII</Badge>
                  <span className="font-mono text-sm text-muted-foreground">{conversions.ascii}</span>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
