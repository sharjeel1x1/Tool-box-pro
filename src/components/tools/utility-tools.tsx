'use client'

import React, { useState, useMemo, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import {
  Palette, Globe, Cake, Dices,
  Copy, RefreshCw, Shuffle, ArrowUpDown,
  Clock, CalendarDays, Heart, Zap, Timer
} from 'lucide-react'

// ==================== ColorPicker ====================
function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '')
  return [parseInt(h.substring(0, 2), 16), parseInt(h.substring(2, 4), 16), parseInt(h.substring(4, 6), 16)]
}

function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('')
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255; g /= 255; b /= 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b)
  const l = (max + min) / 2
  if (max === min) return [0, 0, Math.round(l * 100)]
  const d = max - min
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
  let h = 0
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6
  else if (max === g) h = ((b - r) / d + 2) / 6
  else h = ((r - g) / d + 4) / 6
  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)]
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  h /= 360; s /= 100; l /= 100
  if (s === 0) { const v = Math.round(l * 255); return [v, v, v] }
  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1; if (t > 1) t -= 1
    if (t < 1 / 6) return p + (q - p) * 6 * t
    if (t < 1 / 2) return q
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6
    return p
  }
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s
  const p = 2 * l - q
  return [Math.round(hue2rgb(p, q, h + 1 / 3) * 255), Math.round(hue2rgb(p, q, h) * 255), Math.round(hue2rgb(p, q, h - 1 / 3) * 255)]
}

export function ColorPicker() {
  const [hex, setHex] = useState('#6366f1')
  const [rgb, setRgb] = useState<[number, number, number]>([99, 102, 241])
  const [hsl, setHsl] = useState<[number, number, number]>([239, 84, 67])
  const [history, setHistory] = useState<string[]>([])
  const [updateSource, setUpdateSource] = useState<string>('')

  const updateFromHex = (newHex: string) => {
    if (!/^#[0-9a-fA-F]{6}$/.test(newHex)) { setHex(newHex); return }
    setUpdateSource('hex')
    setHex(newHex)
    const newRgb = hexToRgb(newHex)
    setRgb(newRgb)
    setHsl(rgbToHsl(...newRgb))
  }

  const updateFromRgb = (newRgb: [number, number, number]) => {
    setUpdateSource('rgb')
    setRgb(newRgb)
    setHex(rgbToHex(...newRgb))
    setHsl(rgbToHsl(...newRgb))
  }

  const updateFromHsl = (newHsl: [number, number, number]) => {
    setUpdateSource('hsl')
    setHsl(newHsl)
    const newRgb = hslToRgb(...newHsl)
    setRgb(newRgb)
    setHex(rgbToHex(...newRgb))
  }

  const randomColor = () => {
    const h = Math.random() * 360
    const s = 50 + Math.random() * 50
    const l = 30 + Math.random() * 40
    updateFromHsl([Math.round(h), Math.round(s), Math.round(l)])
  }

  const addToHistory = () => {
    setHistory(prev => [hex, ...prev.filter(c => c !== hex)].slice(0, 10))
    toast.success('Color saved to history')
  }

  const copyValue = (value: string, label: string) => {
    navigator.clipboard.writeText(value)
    toast.success(`${label} copied: ${value}`)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Palette className="h-5 w-5" /> Color Picker
        </CardTitle>
        <CardDescription>Pick and convert colors between HEX, RGB, and HSL</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div
          className="w-full h-32 rounded-lg border-2 shadow-inner cursor-pointer"
          style={{ backgroundColor: hex }}
          onClick={addToHistory}
          title="Click to save to history"
        />
        <Tabs defaultValue="hex">
          <TabsList className="w-full">
            <TabsTrigger value="hex" className="flex-1">HEX</TabsTrigger>
            <TabsTrigger value="rgb" className="flex-1">RGB</TabsTrigger>
            <TabsTrigger value="hsl" className="flex-1">HSL</TabsTrigger>
          </TabsList>
          <TabsContent value="hex" className="space-y-3">
            <div className="flex gap-2 items-center">
              <input type="color" value={hex} onChange={e => updateFromHex(e.target.value)} className="h-10 w-12 cursor-pointer rounded border" />
              <Input value={hex} onChange={e => updateFromHex(e.target.value)} className="flex-1" />
              <Button variant="outline" size="icon" onClick={() => copyValue(hex, 'HEX')}><Copy className="h-4 w-4" /></Button>
            </div>
          </TabsContent>
          <TabsContent value="rgb" className="space-y-3">
            <div className="space-y-2">
              <Label>R: {rgb[0]}</Label>
              <Slider value={[rgb[0]]} onValueChange={v => updateFromRgb([v[0], rgb[1], rgb[2]])} min={0} max={255} />
            </div>
            <div className="space-y-2">
              <Label>G: {rgb[1]}</Label>
              <Slider value={[rgb[1]]} onValueChange={v => updateFromRgb([rgb[0], v[0], rgb[2]])} min={0} max={255} />
            </div>
            <div className="space-y-2">
              <Label>B: {rgb[2]}</Label>
              <Slider value={[rgb[2]]} onValueChange={v => updateFromRgb([rgb[0], rgb[1], v[0]])} min={0} max={255} />
            </div>
            <div className="flex gap-2 items-center">
              <Input value={`rgb(${rgb.join(', ')})`} readOnly />
              <Button variant="outline" size="icon" onClick={() => copyValue(`rgb(${rgb.join(', ')})`, 'RGB')}><Copy className="h-4 w-4" /></Button>
            </div>
          </TabsContent>
          <TabsContent value="hsl" className="space-y-3">
            <div className="space-y-2">
              <Label>H: {hsl[0]}°</Label>
              <Slider value={[hsl[0]]} onValueChange={v => updateFromHsl([v[0], hsl[1], hsl[2]])} min={0} max={360} />
            </div>
            <div className="space-y-2">
              <Label>S: {hsl[1]}%</Label>
              <Slider value={[hsl[1]]} onValueChange={v => updateFromHsl([hsl[0], v[0], hsl[2]])} min={0} max={100} />
            </div>
            <div className="space-y-2">
              <Label>L: {hsl[2]}%</Label>
              <Slider value={[hsl[2]]} onValueChange={v => updateFromHsl([hsl[0], hsl[1], v[0]])} min={0} max={100} />
            </div>
            <div className="flex gap-2 items-center">
              <Input value={`hsl(${hsl[0]}, ${hsl[1]}%, ${hsl[2]}%)`} readOnly />
              <Button variant="outline" size="icon" onClick={() => copyValue(`hsl(${hsl[0]}, ${hsl[1]}%, ${hsl[2]}%)`, 'HSL')}><Copy className="h-4 w-4" /></Button>
            </div>
          </TabsContent>
        </Tabs>
        <div className="flex gap-2">
          <Button onClick={randomColor} variant="outline" className="flex-1">
            <Shuffle className="h-4 w-4 mr-2" /> Random Color
          </Button>
        </div>
        {history.length > 0 && (
          <div className="space-y-2">
            <Label className="text-muted-foreground">Color History (click swatch to select)</Label>
            <div className="flex flex-wrap gap-2">
              {history.map((color, i) => (
                <button
                  key={i}
                  className="w-8 h-8 rounded-md border-2 cursor-pointer hover:scale-110 transition-transform"
                  style={{ backgroundColor: color }}
                  onClick={() => updateFromHex(color)}
                  title={color}
                />
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ==================== TimezoneConverter ====================
const TIMEZONES = [
  { value: 'UTC', label: 'UTC (Coordinated Universal Time)' },
  { value: 'America/New_York', label: 'EST (New York)' },
  { value: 'America/Chicago', label: 'CST (Chicago)' },
  { value: 'America/Denver', label: 'MST (Denver)' },
  { value: 'America/Los_Angeles', label: 'PST (Los Angeles)' },
  { value: 'Europe/London', label: 'London (GMT/BST)' },
  { value: 'Europe/Paris', label: 'Paris (CET)' },
  { value: 'Asia/Tokyo', label: 'Tokyo (JST)' },
  { value: 'Australia/Sydney', label: 'Sydney (AEST)' },
  { value: 'Asia/Dubai', label: 'Dubai (GST)' },
  { value: 'Asia/Singapore', label: 'Singapore (SGT)' },
  { value: 'Asia/Shanghai', label: 'Shanghai (CST)' },
  { value: 'Asia/Kolkata', label: 'Kolkata (IST)' },
  { value: 'Pacific/Auckland', label: 'Auckland (NZST)' },
]

export function TimezoneConverter() {
  const [sourceTz, setSourceTz] = useState('America/New_York')
  const [targetTz, setTargetTz] = useState('Asia/Tokyo')
  const [dateStr, setDateStr] = useState(new Date().toISOString().split('T')[0])
  const [timeStr, setTimeStr] = useState('12:00')
  const [liveClockTz, setLiveClockTz] = useState('UTC')
  const [currentTime, setCurrentTime] = useState('')

  useEffect(() => {
    const timer = setInterval(() => {
      try {
        setCurrentTime(new Intl.DateTimeFormat('en-US', {
          timeZone: liveClockTz,
          weekday: 'short',
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        }).format(new Date()))
      } catch {
        setCurrentTime('Invalid timezone')
      }
    }, 1000)
    return () => clearInterval(timer)
  }, [liveClockTz])

  const convertedTime = useMemo(() => {
    try {
      const dateTime = new Date(`${dateStr}T${timeStr}:00`)
      if (isNaN(dateTime.getTime())) return 'Invalid date/time'
      return new Intl.DateTimeFormat('en-US', {
        timeZone: targetTz,
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      }).format(dateTime)
    } catch {
      return 'Invalid timezone'
    }
  }, [dateStr, timeStr, targetTz])

  const swapTimezones = () => {
    setSourceTz(targetTz)
    setTargetTz(sourceTz)
  }

  const copyConverted = () => {
    navigator.clipboard.writeText(convertedTime)
    toast.success('Time copied')
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="h-5 w-5" /> Timezone Converter
        </CardTitle>
        <CardDescription>Convert time between different time zones</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Date</Label>
            <Input type="date" value={dateStr} onChange={e => setDateStr(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Time</Label>
            <Input type="time" value={timeStr} onChange={e => setTimeStr(e.target.value)} />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-[1fr,auto,1fr] gap-2 items-end">
          <div className="space-y-2">
            <Label>From</Label>
            <Select value={sourceTz} onValueChange={setSourceTz}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {TIMEZONES.map(tz => (
                  <SelectItem key={tz.value} value={tz.value}>{tz.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button variant="outline" size="icon" onClick={swapTimezones} className="shrink-0">
            <ArrowUpDown className="h-4 w-4" />
          </Button>
          <div className="space-y-2">
            <Label>To</Label>
            <Select value={targetTz} onValueChange={setTargetTz}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {TIMEZONES.map(tz => (
                  <SelectItem key={tz.value} value={tz.value}>{tz.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="bg-muted p-4 rounded-lg">
          <div className="text-sm text-muted-foreground mb-1">Converted Time</div>
          <div className="text-xl font-bold flex items-center justify-between">
            <span>{convertedTime}</span>
            <Button variant="ghost" size="sm" onClick={copyConverted}><Copy className="h-4 w-4" /></Button>
          </div>
        </div>
        <div className="space-y-2 border-t pt-4">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <Label>Live Clock</Label>
          </div>
          <Select value={liveClockTz} onValueChange={setLiveClockTz}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {TIMEZONES.map(tz => (
                <SelectItem key={tz.value} value={tz.value}>{tz.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="bg-muted p-3 rounded-lg font-mono text-lg text-center">
            {currentTime || 'Loading...'}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ==================== AgeCalculator ====================
export function AgeCalculator() {
  const [dob, setDob] = useState('')
  const [asOf, setAsOf] = useState(new Date().toISOString().split('T')[0])

  const result = useMemo(() => {
    if (!dob) return null
    const birthDate = new Date(dob)
    const asOfDate = asOf ? new Date(asOf) : new Date()
    if (isNaN(birthDate.getTime()) || isNaN(asOfDate.getTime())) return null
    if (birthDate > asOfDate) return null

    // Calculate years, months, days
    let years = asOfDate.getFullYear() - birthDate.getFullYear()
    let months = asOfDate.getMonth() - birthDate.getMonth()
    let days = asOfDate.getDate() - birthDate.getDate()

    if (days < 0) {
      months--
      const prevMonth = new Date(asOfDate.getFullYear(), asOfDate.getMonth(), 0)
      days += prevMonth.getDate()
    }
    if (months < 0) {
      years--
      months += 12
    }

    // Total calculations
    const diffMs = asOfDate.getTime() - birthDate.getTime()
    const totalDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    const totalWeeks = Math.floor(totalDays / 7)
    const totalMonths = years * 12 + months
    const totalHours = totalDays * 24

    // Next birthday
    let nextBirthday = new Date(asOfDate.getFullYear(), birthDate.getMonth(), birthDate.getDate())
    if (nextBirthday <= asOfDate) {
      nextBirthday = new Date(asOfDate.getFullYear() + 1, birthDate.getMonth(), birthDate.getDate())
    }
    const daysUntilBirthday = Math.ceil((nextBirthday.getTime() - asOfDate.getTime()) / (1000 * 60 * 60 * 24))

    // Fun facts
    const heartbeats = Math.round(totalDays * 100000)
    const breaths = Math.round(totalDays * 20000)
    const sleepHours = Math.round(totalDays * 8)

    return { years, months, days, totalDays, totalWeeks, totalMonths, totalHours, daysUntilBirthday, heartbeats, breaths, sleepHours }
  }, [dob, asOf])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Cake className="h-5 w-5" /> Age Calculator
        </CardTitle>
        <CardDescription>Calculate your age and discover fun facts</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Date of Birth</Label>
            <Input type="date" value={dob} onChange={e => setDob(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>As of Date</Label>
            <Input type="date" value={asOf} onChange={e => setAsOf(e.target.value)} />
          </div>
        </div>
        {result && (
          <>
            <div className="bg-muted p-4 rounded-lg text-center">
              <div className="text-3xl font-bold">
                {result.years} <span className="text-base font-normal">years</span>{' '}
                {result.months} <span className="text-base font-normal">months</span>{' '}
                {result.days} <span className="text-base font-normal">days</span>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                { label: 'Total Days', value: result.totalDays.toLocaleString() },
                { label: 'Total Weeks', value: result.totalWeeks.toLocaleString() },
                { label: 'Total Months', value: result.totalMonths.toLocaleString() },
                { label: 'Total Hours', value: result.totalHours.toLocaleString() },
                { label: 'Next Birthday', value: `${result.daysUntilBirthday} days` },
              ].map(stat => (
                <div key={stat.label} className="bg-muted/50 p-3 rounded-lg text-center">
                  <div className="text-lg font-bold">{stat.value}</div>
                  <div className="text-xs text-muted-foreground">{stat.label}</div>
                </div>
              ))}
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-1"><Zap className="h-4 w-4" /> Fun Facts</Label>
              <div className="bg-muted/50 p-3 rounded-lg space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Heart className="h-4 w-4 text-red-500" />
                  <span>~{result.heartbeats.toLocaleString()} heartbeats</span>
                </div>
                <div className="flex items-center gap-2">
                  <Timer className="h-4 w-4 text-blue-500" />
                  <span>~{result.breaths.toLocaleString()} breaths taken</span>
                </div>
                <div className="flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-purple-500" />
                  <span>~{result.sleepHours.toLocaleString()} hours of sleep</span>
                </div>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

// ==================== RandomGenerator ====================
const FIRST_NAMES = [
  'James', 'Mary', 'Robert', 'Patricia', 'John', 'Jennifer', 'Michael', 'Linda',
  'David', 'Elizabeth', 'William', 'Barbara', 'Richard', 'Susan', 'Joseph', 'Jessica',
  'Thomas', 'Sarah', 'Christopher', 'Karen', 'Charles', 'Lisa', 'Daniel', 'Nancy',
  'Matthew', 'Betty', 'Anthony', 'Margaret', 'Mark', 'Sandra', 'Donald', 'Ashley',
  'Steven', 'Kimberly', 'Paul', 'Emily', 'Andrew', 'Donna', 'Joshua', 'Michelle',
  'Kenneth', 'Carol', 'Kevin', 'Amanda', 'Brian', 'Dorothy', 'George', 'Melissa',
  'Timothy', 'Deborah', 'Ronald', 'Stephanie', 'Edward', 'Rebecca', 'Jason', 'Sharon',
  'Jeffrey', 'Laura', 'Ryan', 'Cynthia',
]

const LAST_NAMES = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
  'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson',
  'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 'Thompson',
  'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson',
]

export function RandomGenerator() {
  const [tab, setTab] = useState('numbers')
  // Numbers
  const [minNum, setMinNum] = useState(1)
  const [maxNum, setMaxNum] = useState(100)
  const [quantity, setQuantity] = useState(5)
  const [allowDuplicates, setAllowDuplicates] = useState(true)
  const [numbers, setNumbers] = useState<number[]>([])
  // Names
  const [nameType, setNameType] = useState<'first' | 'last' | 'full'>('full')
  const [nameQuantity, setNameQuantity] = useState(5)
  const [names, setNames] = useState<string[]>([])

  const generateNumbers = useCallback(() => {
    const arr = new Uint32Array(quantity)
    crypto.getRandomValues(arr)
    const range = maxNum - minNum + 1
    if (!allowDuplicates && quantity > range) {
      toast.error(`Cannot generate ${quantity} unique numbers in range ${minNum}-${maxNum}`)
      return
    }
    const result: number[] = []
    if (allowDuplicates) {
      for (let i = 0; i < quantity; i++) {
        result.push(minNum + (arr[i] % range))
      }
    } else {
      const available = Array.from({ length: range }, (_, i) => minNum + i)
      for (let i = 0; i < quantity; i++) {
        const idx = arr[i] % available.length
        result.push(available[idx])
        available.splice(idx, 1)
      }
    }
    setNumbers(result)
  }, [minNum, maxNum, quantity, allowDuplicates])

  const generateNames = useCallback(() => {
    const arr = new Uint32Array(nameQuantity * 2)
    crypto.getRandomValues(arr)
    const result: string[] = []
    for (let i = 0; i < nameQuantity; i++) {
      const first = FIRST_NAMES[arr[i * 2] % FIRST_NAMES.length]
      const last = LAST_NAMES[arr[i * 2 + 1] % LAST_NAMES.length]
      if (nameType === 'first') result.push(first)
      else if (nameType === 'last') result.push(last)
      else result.push(`${first} ${last}`)
    }
    setNames(result)
  }, [nameQuantity, nameType])

  const copyAll = (items: (number | string)[]) => {
    navigator.clipboard.writeText(items.join('\n'))
    toast.success('All items copied')
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Dices className="h-5 w-5" /> Random Generator
        </CardTitle>
        <CardDescription>Generate random numbers or names</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="w-full">
            <TabsTrigger value="numbers" className="flex-1">Numbers</TabsTrigger>
            <TabsTrigger value="names" className="flex-1">Names</TabsTrigger>
          </TabsList>
          <TabsContent value="numbers" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Min</Label>
                <Input type="number" value={minNum} onChange={e => setMinNum(Number(e.target.value))} />
              </div>
              <div className="space-y-2">
                <Label>Max</Label>
                <Input type="number" value={maxNum} onChange={e => setMaxNum(Number(e.target.value))} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Quantity: {quantity}</Label>
              <Slider value={[quantity]} onValueChange={v => setQuantity(v[0])} min={1} max={50} />
            </div>
            <div className="flex items-center space-x-2">
              <Switch id="allow-dup" checked={allowDuplicates} onCheckedChange={setAllowDuplicates} />
              <Label htmlFor="allow-dup" className="cursor-pointer">Allow Duplicates</Label>
            </div>
            <Button onClick={generateNumbers} className="w-full">
              <RefreshCw className="h-4 w-4 mr-2" /> Generate Numbers
            </Button>
            {numbers.length > 0 && (
              <div className="space-y-2">
                <div className="flex flex-wrap gap-2">
                  {numbers.map((n, i) => (
                    <Badge key={i} variant="secondary" className="text-lg px-3 py-1">{n}</Badge>
                  ))}
                </div>
                <Button variant="outline" size="sm" onClick={() => copyAll(numbers)}>
                  <Copy className="h-4 w-4 mr-2" /> Copy All
                </Button>
              </div>
            )}
          </TabsContent>
          <TabsContent value="names" className="space-y-4">
            <div className="space-y-2">
              <Label>Name Type</Label>
              <Select value={nameType} onValueChange={v => setNameType(v as 'first' | 'last' | 'full')}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="first">First Names</SelectItem>
                  <SelectItem value="last">Last Names</SelectItem>
                  <SelectItem value="full">Full Names</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Quantity: {nameQuantity}</Label>
              <Slider value={[nameQuantity]} onValueChange={v => setNameQuantity(v[0])} min={1} max={20} />
            </div>
            <Button onClick={generateNames} className="w-full">
              <RefreshCw className="h-4 w-4 mr-2" /> Generate Names
            </Button>
            {names.length > 0 && (
              <div className="space-y-2">
                <div className="space-y-1">
                  {names.map((name, i) => (
                    <div key={i} className="bg-muted px-3 py-2 rounded text-sm">{name}</div>
                  ))}
                </div>
                <Button variant="outline" size="sm" onClick={() => copyAll(names)}>
                  <Copy className="h-4 w-4 mr-2" /> Copy All
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
