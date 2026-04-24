'use client'

import React, { useState, useMemo, useCallback, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import {
  Type, Hash, Smile, Code2, ImageDown,
  Copy, Trash2, AlertCircle, Download,
  Twitter, Instagram, Facebook, Linkedin, Youtube,
  Plus, ZoomIn
} from 'lucide-react'

// ==================== CharCounter ====================
const PLATFORM_LIMITS = [
  { name: 'Twitter', limit: 280, icon: Twitter, color: 'text-sky-500' },
  { name: 'Instagram', limit: 2200, icon: Instagram, color: 'text-pink-500' },
  { name: 'Facebook', limit: 63206, icon: Facebook, color: 'text-blue-600' },
  { name: 'LinkedIn', limit: 3000, icon: Linkedin, color: 'text-blue-700' },
  { name: 'YouTube Title', limit: 100, icon: Youtube, color: 'text-red-500' },
  { name: 'YouTube Desc', limit: 5000, icon: Youtube, color: 'text-red-400' },
]

function getLimitColor(count: number, limit: number): string {
  const ratio = count / limit
  if (ratio <= 0.8) return 'text-green-600 dark:text-green-400'
  if (ratio <= 1) return 'text-yellow-600 dark:text-yellow-400'
  return 'text-red-600 dark:text-red-400'
}

function getLimitBg(count: number, limit: number): string {
  const ratio = count / limit
  if (ratio <= 0.8) return 'bg-green-500'
  if (ratio <= 1) return 'bg-yellow-500'
  return 'bg-red-500'
}

export function CharCounter() {
  const [text, setText] = useState('')

  const stats = useMemo(() => {
    const chars = text.length
    const charsNoSpaces = text.replace(/\s/g, '').length
    const words = text.trim() ? text.trim().split(/\s+/).length : 0
    const sentences = text.trim() ? (text.match(/[.!?]+/g) || []).length || (text.trim() ? 1 : 0) : 0
    const paragraphs = text.trim() ? text.split(/\n\s*\n/).filter(p => p.trim()).length || 1 : 0
    return { chars, charsNoSpaces, words, sentences, paragraphs }
  }, [text])

  const copyText = () => {
    navigator.clipboard.writeText(text)
    toast.success('Text copied to clipboard')
  }

  const clearText = () => {
    setText('')
    toast.success('Text cleared')
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Type className="h-5 w-5" /> Character Counter
        </CardTitle>
        <CardDescription>Count characters, words, and check platform limits</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="char-text">Enter Text</Label>
          <Textarea
            id="char-text"
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Type or paste your text here..."
            rows={6}
          />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={copyText} disabled={!text}>
            <Copy className="h-4 w-4 mr-1" /> Copy
          </Button>
          <Button variant="outline" size="sm" onClick={clearText} disabled={!text}>
            <Trash2 className="h-4 w-4 mr-1" /> Clear
          </Button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[
            { label: 'Characters', value: stats.chars },
            { label: 'No Spaces', value: stats.charsNoSpaces },
            { label: 'Words', value: stats.words },
            { label: 'Sentences', value: stats.sentences },
            { label: 'Paragraphs', value: stats.paragraphs },
          ].map(stat => (
            <div key={stat.label} className="bg-muted p-3 rounded-lg text-center">
              <div className="text-2xl font-bold">{stat.value}</div>
              <div className="text-xs text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium">Platform Limits</Label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {PLATFORM_LIMITS.map(platform => {
              const Icon = platform.icon
              const ratio = Math.min(stats.chars / platform.limit, 1.5)
              const percentage = Math.min((stats.chars / platform.limit) * 100, 150)
              return (
                <div key={platform.name} className="bg-muted/50 p-3 rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon className={`h-4 w-4 ${platform.color}`} />
                      <span className="text-sm font-medium">{platform.name}</span>
                    </div>
                    <span className={`text-sm font-bold ${getLimitColor(stats.chars, platform.limit)}`}>
                      {stats.chars}/{platform.limit}
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${getLimitBg(stats.chars, platform.limit)}`}
                      style={{ width: `${Math.min(percentage, 100)}%` }}
                    />
                  </div>
                  {stats.chars > platform.limit && (
                    <p className="text-xs text-red-500 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" /> Over by {stats.chars - platform.limit} characters
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ==================== HashtagGenerator ====================
const COMMON_SUFFIXES = ['life', 'daily', 'vibes', 'love', 'instagood', 'style', 'goals', 'mood', 'inspo', 'community']
const NICHE_SUFFIXES = ['tips', 'hacks', 'tutorial', 'ideas', 'guide', 'advice', 'facts', 'truth', 'struggles', 'problems']
const ENGAGEMENT_SUFFIXES = ['fyp', 'viral', 'trending', 'explore', 'foryou', 'foryoupage', 'mustread', 'amazing', 'best', 'top']

function extractKeywords(text: string): string[] {
  const stopWords = new Set([
    'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
    'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should',
    'to', 'of', 'in', 'for', 'on', 'with', 'at', 'by', 'from', 'as', 'into',
    'about', 'but', 'or', 'and', 'not', 'no', 'so', 'if', 'it', 'its', 'this',
    'that', 'these', 'those', 'i', 'me', 'my', 'we', 'our', 'you', 'your', 'he',
    'him', 'his', 'she', 'her', 'they', 'them', 'their', 'what', 'which', 'who',
    'how', 'when', 'where', 'why', 'all', 'just', 'also', 'very', 'too', 'up',
  ])
  const words = text.toLowerCase().match(/\b[a-z]{3,}\b/g) || []
  const freq: Record<string, number> = {}
  words.forEach(w => {
    if (!stopWords.has(w)) freq[w] = (freq[w] || 0) + 1
  })
  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([w]) => w)
}

function toCamelCase(str: string): string {
  return str
    .split(/[\s_-]+/)
    .map((word, i) =>
      i === 0 ? word.toLowerCase() : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    )
    .join('')
}

function generateHashtags(inputText: string, _language: string): { trending: string[]; niche: string[]; engagement: string[] } {
  const keywords = extractKeywords(inputText)
  const trending: string[] = []
  const niche: string[] = []
  const engagement: string[] = []

  keywords.forEach(kw => {
    trending.push(`#${toCamelCase(kw)}`)
    COMMON_SUFFIXES.forEach(suffix => {
      if (trending.length < 12) {
        trending.push(`#${kw}${suffix.charAt(0).toUpperCase() + suffix.slice(1)}`)
      }
    })
    NICHE_SUFFIXES.forEach(suffix => {
      if (niche.length < 10) {
        niche.push(`#${kw}${suffix.charAt(0).toUpperCase() + suffix.slice(1)}`)
      }
    })
    ENGAGEMENT_SUFFIXES.forEach(suffix => {
      if (engagement.length < 8) {
        engagement.push(`#${kw}${suffix.charAt(0).toUpperCase() + suffix.slice(1)}`)
      }
    })
  })

  // Fill up if few keywords
  if (keywords.length === 0) {
    trending.push('#ContentCreation', '#SocialMedia', '#DigitalMarketing', '#BrandBuilding', '#CreatorLife')
    niche.push('#ContentTips', '#MarketingHacks', '#SocialStrategy', '#GrowthMindset', '#CreativeIdeas')
    engagement.push('#FYP', '#Viral', '#Trending', '#Explore', '#MustSee')
  }

  // Ensure we have enough
  while (trending.length < 10) trending.push(`#trending${trending.length + 1}`)
  while (niche.length < 10) niche.push(`#niche${niche.length + 1}`)
  while (engagement.length < 10) engagement.push(`#engage${engagement.length + 1}`)

  return {
    trending: trending.slice(0, 12),
    niche: niche.slice(0, 10),
    engagement: engagement.slice(0, 8),
  }
}

export function HashtagGenerator() {
  const [inputText, setInputText] = useState('')
  const [language, setLanguage] = useState('english')
  const [hashtags, setHashtags] = useState<{ trending: string[]; niche: string[]; engagement: string[] } | null>(null)

  const generate = () => {
    if (!inputText.trim()) {
      toast.error('Please enter some text or keywords')
      return
    }
    const result = generateHashtags(inputText, language)
    setHashtags(result)
    toast.success(`Generated ${result.trending.length + result.niche.length + result.engagement.length} hashtags`)
  }

  const copyAll = () => {
    if (!hashtags) return
    const all = [...hashtags.trending, ...hashtags.niche, ...hashtags.engagement].join(' ')
    navigator.clipboard.writeText(all)
    toast.success('All hashtags copied')
  }

  const copyCategory = (tags: string[]) => {
    navigator.clipboard.writeText(tags.join(' '))
    toast.success('Hashtags copied')
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Hash className="h-5 w-5" /> Hashtag Generator
        </CardTitle>
        <CardDescription>Generate relevant hashtags from your content</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="hashtag-input">Text or Keywords</Label>
          <Textarea
            id="hashtag-input"
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            placeholder="Enter your post content or keywords separated by commas..."
            rows={4}
          />
        </div>
        <div className="flex gap-3 items-end">
          <div className="flex-1 space-y-2">
            <Label>Language</Label>
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="english">English</SelectItem>
                <SelectItem value="spanish">Spanish</SelectItem>
                <SelectItem value="french">French</SelectItem>
                <SelectItem value="german">German</SelectItem>
                <SelectItem value="portuguese">Portuguese</SelectItem>
                <SelectItem value="italian">Italian</SelectItem>
                <SelectItem value="dutch">Dutch</SelectItem>
                <SelectItem value="korean">Korean</SelectItem>
                <SelectItem value="japanese">Japanese</SelectItem>
                <SelectItem value="chinese">Chinese</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={generate}>
            <Hash className="h-4 w-4 mr-2" /> Generate
          </Button>
        </div>

        {hashtags && (
          <div className="space-y-4">
            <div className="flex justify-end">
              <Button variant="outline" size="sm" onClick={copyAll}>
                <Copy className="h-4 w-4 mr-1" /> Copy All
              </Button>
            </div>

            {[
              { label: 'Trending', tags: hashtags.trending, color: 'bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300 border-pink-200 dark:border-pink-800' },
              { label: 'Niche', tags: hashtags.niche, color: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800' },
              { label: 'Engagement', tags: hashtags.engagement, color: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800' },
            ].map(category => (
              <div key={category.label} className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="font-medium">{category.label}</Label>
                  <Button variant="ghost" size="sm" onClick={() => copyCategory(category.tags)}>
                    <Copy className="h-3 w-3 mr-1" /> Copy
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {category.tags.map((tag, i) => (
                    <Badge key={i} variant="outline" className={category.color}>
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}

            <div className="bg-muted p-3 rounded-lg">
              <p className="text-sm text-muted-foreground">
                Total: {hashtags.trending.length + hashtags.niche.length + hashtags.engagement.length} hashtags generated
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ==================== EmojiPicker ====================
const EMOJI_CATEGORIES: Record<string, { label: string; emojis: string[] }> = {
  'smileys': {
    label: 'Smileys & People',
    emojis: [
      '😀','😃','😄','😁','😆','😅','🤣','😂','🙂','🙃','😉','😊','😇','🥰','😍','🤩',
      '😘','😗','😚','😙','🥲','😋','😛','😜','🤪','😝','🤑','🤗','🤭','🤫','🤔',
      '🫡','🤐','🤨','😐','😑','😶','🫥','😏','😒','🙄','😬','🤥','😌','😔','😪',
      '🤤','😴','😷','🤒','🤕','🤢','🤮','🥵','🥶','🥴','😵','🤯','🤠','🥳','🥸',
      '😎','🤓','🧐','😕','🫤','😟','🙁','😮','😯','😲','😳','🥺','🥹','😦','😧',
      '😨','😰','😥','😢','😭','😱','😖','😣','😞','😓','😩','😫','🥱','😤','😡',
      '😠','🤬','😈','👿','💀','☠️','💩','🤡','👹','👺','👻','👽','👾','🤖','😺',
      '😸','😹','😻','😼','😽','🙀','😿','😾',
    ],
  },
  'people': {
    label: 'People & Body',
    emojis: [
      '👋','🤚','🖐️','✋','🖖','🫱','🫲','🫳','🫴','👌','🤌','🤏','✌️','🤞','🫰',
      '🤟','🤘','🤙','👈','👉','👆','🖕','👇','☝️','🫵','👍','👎','✊','👊','🤛',
      '🤜','👏','🙌','🫶','👐','🤲','🤝','🙏','✍️','💅','🤳','💪','🦾','🦿','🦵',
      '🦶','👂','🦻','👃','🧠','🫀','🫁','🦷','🦴','👀','👁️','👅','👄','🫦','👶',
      '🧒','👦','👧','🧑','👱','👨','🧔','👩','🧓','👴','👵','🙍','🙎','🙅','🙆',
      '💁','🙋','🧏','🧎','🧍','👨‍🦯','👩‍🦯','👨‍🦼','👩‍🦼','👨‍🦽','👩‍🦽','🏃','🚶','💃','🕺',
    ],
  },
  'animals': {
    label: 'Animals & Nature',
    emojis: [
      '🐶','🐱','🐭','🐹','🐰','🦊','🐻','🐼','🐻‍❄️','🐨','🐯','🦁','🐮','🐷','🐸',
      '🐵','🙈','🙉','🙊','🐒','🐔','🐧','🐦','🐤','🐣','🐥','🦆','🦅','🦉','🦇',
      '🐺','🐗','🐴','🦄','🐝','🪱','🐛','🦋','🐌','🐞','🐜','🪰','🪲','🪳','🦟',
      '🦗','🕷️','🦂','🐢','🐍','🦎','🦖','🦕','🐙','🦑','🦐','🦞','🦀','🐡','🐠',
      '🐟','🐬','🐳','🐋','🦈','🐊','🐅','🐆','🦓','🦍','🦧','🐘','🦛','🦏','🐪',
      '🐫','🦒','🦘','🦬','🐃','🐂','🐄','🐎','🐖','🐏','🐑','🦙','🐐','🦌','🐕',
      '🐩','🦮','🐈','🐓','🦃','🦚','🦜','🦢','🦩','🕊️','🐇','🦝','🦨','🦡','🦫',
      '🦦','🦥','🐁','🐀','🐿️','🦔','🐾','🐉','🐲',
    ],
  },
  'nature': {
    label: 'Nature',
    emojis: [
      '🌸','💮','🏵️','🌹','🥀','🌺','🌻','🌼','🌷','🌱','🪴','🌲','🌳','🌴','🌵',
      '🌾','🌿','☘️','🍀','🍁','🍂','🍃','🍄','🌰','🦀','🪸','🪨','🌺','🌷','💐',
    ],
  },
  'food': {
    label: 'Food & Drink',
    emojis: [
      '🍇','🍈','🍉','🍊','🍋','🍌','🍍','🥭','🍎','🍏','🍐','🍑','🍒','🍓','🫐',
      '🥝','🍅','🫒','🥥','🥑','🍆','🥔','🥕','🌽','🌶️','🫑','🥒','🥬','🥦','🧄',
      '🧅','🍄','🥜','🌰','🍞','🥐','🥖','🫓','🥨','🥯','🥞','🧇','🧀','🍖','🍗',
      '🥩','🥓','🍔','🍟','🍕','🌭','🥪','🌮','🌯','🫔','🥙','🧆','🥚','🍳','🥘',
      '🍲','🫕','🥣','🥗','🍿','🧈','🧂','🥫','🍱','🍘','🍙','🍚','🍛','🍜','🍝',
      '🍠','🍢','🍣','🍤','🍥','🥮','🍡','🥟','🥠','🥡','🦀','🦞','🦐','🦑','🦪',
      '🍦','🍧','🍨','🍩','🍪','🎂','🍰','🧁','🥧','🍫','🍬','🍭','🍮','🍯','🍼',
      '🥛','☕','🫖','🍵','🍶','🍾','🍷','🍸','🍹','🍺','🍻','🥂','🥃','🫗','🥤',
    ],
  },
  'travel': {
    label: 'Travel & Places',
    emojis: [
      '🚗','🚕','🚙','🚌','🚎','🏎️','🚓','🚑','🚒','🚐','🛻','🚚','🚛','🚜','🏍️',
      '🛵','🦽','🦼','🛺','🚲','🛴','🛹','🛼','🚏','🛣️','🛤️','🛞','⛽','🛞','🚨',
      '🚥','🚦','🛑','🚧','⚓','🛟','⛵','🛶','🚤','🛳️','⛴️','🛥️','🚢','✈️','🛩️',
      '🛫','🛬','🪂','💺','🚁','🚟','🚠','🚡','🛰️','🚀','🛸','🗼','🏰','🏯','🏟️',
      '🎡','🎢','🎠','⛲','⛱️','🏖️','🏝️','🏜️','🌋','⛰️','🏔️','🗻','🏕️','⛺','🛖',
      '🏠','🏡','🏘️','🏚️','🏗️','🏭','🏢','🏬','🏣','🏤','🏥','🏦','🏨','🏪','🏫',
      '🏩','💒','🏛️','⛪','🕌','🛕','🕍','⛩️','🕋','🌍','🌎','🌏','🗺️','🧭','🏔️',
    ],
  },
  'activities': {
    label: 'Activities',
    emojis: [
      '⚽','🏀','🏈','⚾','🥎','🎾','🏐','🏉','🥏','🎱','🪀','🏓','🏸','🏒','🏑',
      '🥍','🏏','🪃','🥅','⛳','🪁','🏹','🎣','🤿','🥊','🥋','🎽','🛹','🛼','🛷',
      '⛸️','🥌','🎿','⛷️','🏂','🪂','🏋️','🤼','🤸','⛹️','🤺','🤾','🏌️','🏇','🧘',
      '🏄','🏊','🤽','🚣','🧗','🚵','🚴','🏆','🥇','🥈','🥉','🏅','🎖️','🏵️','🎗️',
      '🎫','🎟️','🎪','🤹','🎭','🩰','🎨','🎬','🎤','🎧','🎼','🎹','🥁','🪘','🎷',
      '🎺','🪗','🎸','🪕','🎻','🪈','🎲','♟️','🎯','🎳','🎮','🕹️','🧩','🪄','🎰',
    ],
  },
  'objects': {
    label: 'Objects',
    emojis: [
      '👓','🕶️','🥽','🥼','🦺','👔','👕','👖','🧣','🧤','🧥','🧦','👗','👘','🥻',
      '🩱','🩲','🩳','👙','👚','🪭','👛','👜','👝','🛍️','🎒','🩴','👞','👟','🥾',
      '🥿','👠','👡','🩰','👢','👑','👒','🎩','🧢','🪖','⛑️','📿','💄','💍','💎',
      '📱','📲','☎️','📞','📟','📠','🔋','🪫','🔌','💻','🖥️','🖨️','⌨️','🖱️','🖲️',
      '💽','💾','💿','📀','🧮','🎥','🎞️','📽️','🎬','📺','📷','📸','📹','📼','🔍',
      '🔎','🕯️','💡','🔦','🏮','🪔','📔','📕','📖','📗','📘','📙','📚','📓','📒',
      '📃','📜','📄','📰','🗞️','📑','🔖','🏷️','💰','🪙','💴','💵','💶','💷','💸',
      '💳','🧾','✉️','📧','📨','📩','📤','📥','📦','📫','📪','📬','📭','📮','🗳️',
    ],
  },
  'symbols': {
    label: 'Symbols',
    emojis: [
      '❤️','🧡','💛','💚','💙','💜','🖤','🤍','🤎','💔','❣️','💕','💞','💓','💗',
      '💖','💘','💝','💟','☮️','✝️','☪️','🕉️','☸️','✡️','🔯','🕎','☯️','☦️','🛐',
      '⛎','♈','♉','♊','♋','♌','♍','♎','♏','♐','♑','♒','♓','🆔','⚛️',
      '🉑','☢️','☣️','📴','📳','🈶','🈚','🈸','🈺','🈷️','✴️','🆚','💮','🉐','㊙️',
      '㊗️','🈴','🈵','🈹','🈲','🅰️','🅱️','🆎','🆑','🅾️','🆘','❌','⭕','🛑','⛔',
      '📛','🚫','💯','💢','♨️','🚷','🚯','🚳','🚱','🔞','📵','🚭','❗','❕','❓',
      '❔','‼️','⁉️','🔅','🔆','〽️','⚠️','🚸','🔱','⚜️','🔰','♻️','✅','🈯','💹',
      '❇️','✳️','❎','🌐','💠','Ⓜ️','🌀','💤','🏧','🚾','♿','🅿️','🛗','🈳','🈂️',
    ],
  },
  'flags': {
    label: 'Flags',
    emojis: [
      '🏁','🚩','🎌','🏴','🏳️','🏳️‍🌈','🏳️‍⚧️','🏴‍☠️','🇺🇸','🇬🇧','🇫🇷','🇩🇪','🇮🇹','🇪🇸','🇯🇵',
      '🇰🇷','🇨🇳','🇷🇺','🇧🇷','🇮🇳','🇨🇦','🇦🇺','🇲🇽','🇳🇱','🇧🇪','🇨🇭','🇦🇹','🇸🇪','🇳🇴','🇩🇰',
      '🇫🇮','🇵🇱','🇵🇹','🇬🇷','🇹🇷','🇿🇦','🇪🇬','🇳🇬','🇰🇪','🇸🇦','🇦🇪','🇮🇱','🇮🇩','🇹🇭','🇻🇳',
      '🇵🇭','🇲🇾','🇸🇬','🇳🇿','🇦🇷','🇨🇱','🇨🇴','🇵🇪','🇻🇪','🇨🇺','🇯🇲','🇭🇷','🇷🇴','🇧🇬','🇺🇦',
    ],
  },
}

export function EmojiPicker() {
  const [activeCategory, setActiveCategory] = useState('smileys')
  const [search, setSearch] = useState('')
  const [recentEmojis, setRecentEmojis] = useState<string[]>([])

  const filteredEmojis = useMemo(() => {
    if (!search.trim()) return EMOJI_CATEGORIES[activeCategory]?.emojis || []
    const results: string[] = []
    Object.values(EMOJI_CATEGORIES).forEach(cat => {
      cat.emojis.forEach(emoji => {
        if (emoji.includes(search.trim())) {
          results.push(emoji)
        }
      })
    })
    return results.length > 0 ? results : []
  }, [activeCategory, search])

  const handleEmojiClick = (emoji: string) => {
    navigator.clipboard.writeText(emoji)
    toast.success(`${emoji} copied!`)
    setRecentEmojis(prev => {
      const updated = [emoji, ...prev.filter(e => e !== emoji)].slice(0, 10)
      return updated
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Smile className="h-5 w-5" /> Emoji Picker
        </CardTitle>
        <CardDescription>Browse and copy emojis organized by category</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="emoji-search">Search</Label>
          <Input
            id="emoji-search"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search emojis..."
          />
        </div>

        {!search && recentEmojis.length > 0 && (
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">Recently Used</Label>
            <div className="flex flex-wrap gap-1">
              {recentEmojis.map((emoji, i) => (
                <button
                  key={i}
                  onClick={() => handleEmojiClick(emoji)}
                  className="h-9 w-9 flex items-center justify-center text-xl rounded-md hover:bg-muted transition-colors"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        )}

        {!search && (
          <div className="flex flex-wrap gap-1">
            {Object.entries(EMOJI_CATEGORIES).map(([key, cat]) => (
              <Button
                key={key}
                variant={activeCategory === key ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveCategory(key)}
                className="text-xs"
              >
                {cat.label}
              </Button>
            ))}
          </div>
        )}

        <div className="border rounded-lg p-3">
          <div className="flex flex-wrap gap-1 max-h-64 overflow-y-auto">
            {filteredEmojis.map((emoji, i) => (
              <button
                key={i}
                onClick={() => handleEmojiClick(emoji)}
                className="h-9 w-9 flex items-center justify-center text-xl rounded-md hover:bg-muted transition-colors cursor-pointer"
                title={`Click to copy ${emoji}`}
              >
                {emoji}
              </button>
            ))}
            {filteredEmojis.length === 0 && (
              <p className="text-muted-foreground text-sm py-4 text-center w-full">No emojis found</p>
            )}
          </div>
        </div>

        <p className="text-xs text-muted-foreground text-center">Click any emoji to copy it to clipboard</p>
      </CardContent>
    </Card>
  )
}

// ==================== MetaTagGen ====================
export function MetaTagGen() {
  const [pageTitle, setPageTitle] = useState('')
  const [description, setDescription] = useState('')
  const [keywords, setKeywords] = useState('')
  const [author, setAuthor] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [pageUrl, setPageUrl] = useState('')

  const generatedCode = useMemo(() => {
    const lines: string[] = []
    if (pageTitle) lines.push(`<title>${pageTitle}</title>`)
    if (description) lines.push(`<meta name="description" content="${description}" />`)
    if (keywords) lines.push(`<meta name="keywords" content="${keywords}" />`)
    if (author) lines.push(`<meta name="author" content="${author}" />`)
    lines.push('')
    // Open Graph
    if (pageTitle) lines.push(`<meta property="og:title" content="${pageTitle}" />`)
    if (description) lines.push(`<meta property="og:description" content="${description}" />`)
    if (imageUrl) lines.push(`<meta property="og:image" content="${imageUrl}" />`)
    if (pageUrl) lines.push(`<meta property="og:url" content="${pageUrl}" />`)
    lines.push(`<meta property="og:type" content="website" />`)
    lines.push('')
    // Twitter Card
    lines.push(`<meta name="twitter:card" content="summary_large_image" />`)
    if (pageTitle) lines.push(`<meta name="twitter:title" content="${pageTitle}" />`)
    if (description) lines.push(`<meta name="twitter:description" content="${description}" />`)
    if (imageUrl) lines.push(`<meta name="twitter:image" content="${imageUrl}" />`)
    return lines.join('\n')
  }, [pageTitle, description, keywords, author, imageUrl, pageUrl])

  const copyCode = () => {
    navigator.clipboard.writeText(generatedCode)
    toast.success('Meta tags copied to clipboard')
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Code2 className="h-5 w-5" /> Meta Tag Generator
        </CardTitle>
        <CardDescription>Generate SEO meta tags for your web pages</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="meta-title">Page Title</Label>
            <Input id="meta-title" value={pageTitle} onChange={e => setPageTitle(e.target.value)} placeholder="My Awesome Website" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="meta-author">Author</Label>
            <Input id="meta-author" value={author} onChange={e => setAuthor(e.target.value)} placeholder="John Doe" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="meta-url">Page URL</Label>
            <Input id="meta-url" value={pageUrl} onChange={e => setPageUrl(e.target.value)} placeholder="https://example.com" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="meta-image">Image URL</Label>
            <Input id="meta-image" value={imageUrl} onChange={e => setImageUrl(e.target.value)} placeholder="https://example.com/image.jpg" />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="meta-desc">Description</Label>
          <Textarea id="meta-desc" value={description} onChange={e => setDescription(e.target.value)} placeholder="A brief description of your page..." rows={3} />
          {description && (
            <p className={`text-xs ${description.length > 160 ? 'text-red-500' : description.length > 120 ? 'text-yellow-600' : 'text-muted-foreground'}`}>
              {description.length}/160 characters {description.length > 160 ? '(too long for search results)' : ''}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="meta-keywords">Keywords (comma separated)</Label>
          <Input id="meta-keywords" value={keywords} onChange={e => setKeywords(e.target.value)} placeholder="web, development, tools" />
        </div>

        {generatedCode && (
          <>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Generated Meta Tags</Label>
                <Button variant="ghost" size="sm" onClick={copyCode}>
                  <Copy className="h-4 w-4 mr-1" /> Copy
                </Button>
              </div>
              <pre className="bg-muted p-3 rounded-lg text-xs font-mono overflow-auto max-h-64 whitespace-pre-wrap">{generatedCode}</pre>
            </div>

            {/* Search Preview */}
            <div className="space-y-2">
              <Label>Search Result Preview</Label>
              <div className="border rounded-lg p-4 bg-background">
                <div className="space-y-1">
                  <p className="text-blue-700 dark:text-blue-400 text-lg hover:underline cursor-pointer truncate">
                    {pageTitle || 'Page Title'}
                  </p>
                  <p className="text-green-700 dark:text-green-400 text-sm truncate">
                    {pageUrl || 'https://example.com'}
                  </p>
                  <p className="text-muted-foreground text-sm line-clamp-2">
                    {description || 'A brief description of your page will appear here...'}
                  </p>
                </div>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

// ==================== SocialImage ====================
const SOCIAL_PRESETS = [
  { name: 'Instagram Post', width: 1080, height: 1080, icon: Instagram },
  { name: 'Instagram Story', width: 1080, height: 1920, icon: Instagram },
  { name: 'Facebook Cover', width: 820, height: 312, icon: Facebook },
  { name: 'Twitter Header', width: 1500, height: 500, icon: Twitter },
  { name: 'LinkedIn Cover', width: 1584, height: 396, icon: Linkedin },
  { name: 'YouTube Thumbnail', width: 1280, height: 720, icon: Youtube },
]

export function SocialImage() {
  const [selectedPreset, setSelectedPreset] = useState(0)
  const [originalImage, setOriginalImage] = useState<string | null>(null)
  const [originalDimensions, setOriginalDimensions] = useState<{ w: number; h: number } | null>(null)
  const [processedImage, setProcessedImage] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const preset = SOCIAL_PRESETS[selectedPreset]

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = reader.result as string
      setOriginalImage(dataUrl)
      setProcessedImage(null)

      const img = new Image()
      img.onload = () => {
        setOriginalDimensions({ w: img.width, h: img.height })
      }
      img.src = dataUrl
    }
    reader.readAsDataURL(file)
  }

  const resizeImage = () => {
    if (!originalImage) return

    const canvas = canvasRef.current
    if (!canvas) return

    const img = new Image()
    img.onload = () => {
      canvas.width = preset.width
      canvas.height = preset.height

      const ctx = canvas.getContext('2d')
      if (!ctx) return

      // Fill background
      ctx.fillStyle = '#000000'
      ctx.fillRect(0, 0, preset.width, preset.height)

      // Calculate cover crop (center crop)
      const srcAspect = img.width / img.height
      const dstAspect = preset.width / preset.height

      let sx = 0, sy = 0, sw = img.width, sh = img.height

      if (srcAspect > dstAspect) {
        // Image is wider - crop sides
        sw = img.height * dstAspect
        sx = (img.width - sw) / 2
      } else {
        // Image is taller - crop top/bottom
        sh = img.width / dstAspect
        sy = (img.height - sh) / 2
      }

      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, preset.width, preset.height)

      const result = canvas.toDataURL('image/png')
      setProcessedImage(result)
      toast.success(`Image resized to ${preset.width}×${preset.height}`)
    }
    img.src = originalImage
  }

  const downloadImage = () => {
    if (!processedImage) return
    const a = document.createElement('a')
    a.href = processedImage
    a.download = `${preset.name.replace(/\s+/g, '-').toLowerCase()}-${preset.width}x${preset.height}.png`
    a.click()
    toast.success('Image downloaded')
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ImageDown className="h-5 w-5" /> Social Image Resizer
        </CardTitle>
        <CardDescription>Resize images for social media platform requirements</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <canvas ref={canvasRef} className="hidden" />

        <div className="space-y-2">
          <Label>Select Platform Preset</Label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {SOCIAL_PRESETS.map((p, i) => {
              const Icon = p.icon
              return (
                <button
                  key={i}
                  onClick={() => { setSelectedPreset(i); setProcessedImage(null) }}
                  className={`p-3 rounded-lg border text-left transition-all ${
                    selectedPreset === i
                      ? 'border-primary bg-primary/5 ring-1 ring-primary'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Icon className="h-4 w-4" />
                    <span className="text-sm font-medium">{p.name}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{p.width}×{p.height}</p>
                </button>
              )
            })}
          </div>
        </div>

        <div className="space-y-2">
          <Label>Upload Image</Label>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => fileInputRef.current?.click()} className="flex-1">
              <Plus className="h-4 w-4 mr-2" /> Choose Image
            </Button>
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*"
              onChange={handleFileUpload}
            />
          </div>
        </div>

        {originalImage && originalDimensions && (
          <div className="bg-muted p-3 rounded-lg space-y-2">
            <p className="text-sm font-medium">Original: {originalDimensions.w}×{originalDimensions.h}</p>
            <p className="text-sm text-muted-foreground">Target: {preset.width}×{preset.height}</p>
            <div className="relative w-full max-w-xs mx-auto">
              <img
                src={originalImage}
                alt="Original"
                className="w-full rounded border"
                style={{ aspectRatio: `${originalDimensions.w}/${originalDimensions.h}` }}
              />
            </div>
          </div>
        )}

        {originalImage && (
          <div className="flex gap-2">
            <Button onClick={resizeImage} className="flex-1">
              <ZoomIn className="h-4 w-4 mr-2" /> Resize & Crop
            </Button>
          </div>
        )}

        {processedImage && (
          <div className="space-y-3">
            <div className="relative w-full max-w-xs mx-auto">
              <img
                src={processedImage}
                alt="Processed"
                className="w-full rounded border"
                style={{ aspectRatio: `${preset.width}/${preset.height}` }}
              />
            </div>
            <Button onClick={downloadImage} className="w-full">
              <Download className="h-4 w-4 mr-2" /> Download {preset.name} ({preset.width}×{preset.height})
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
