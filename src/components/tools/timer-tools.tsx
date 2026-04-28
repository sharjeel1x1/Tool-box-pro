'use client'

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import {
  Timer, Hourglass, Target, Dices, CheckCircle2, Globe,
  Play, Pause, RotateCcw, Flag, Sun, Moon, Plus, Trash2,
  Sparkles, Clock, Trophy, Coffee, Zap, Circle, Minus, Check
} from 'lucide-react'

// ==================== AudioContext Beep ====================
function playBeep(frequency = 800, duration = 300) {
  try {
    const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.frequency.value = frequency
    gain.gain.value = 0.5
    osc.start()
    setTimeout(() => { osc.stop(); ctx.close() }, duration)
  } catch {
    // AudioContext not available
  }
}

function playDoubleBeep() {
  playBeep(800, 200)
  setTimeout(() => playBeep(1000, 200), 300)
}

// ==================== Stopwatch ====================
export function Stopwatch() {
  const [elapsed, setElapsed] = useState(0) // ms
  const [running, setRunning] = useState(false)
  const [laps, setLaps] = useState<number[]>([])
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const startTimeRef = useRef(0)

  useEffect(() => {
    if (running) {
      startTimeRef.current = Date.now() - elapsed
      intervalRef.current = setInterval(() => {
        setElapsed(Date.now() - startTimeRef.current)
      }, 10)
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [running, elapsed])

  const start = () => setRunning(true)
  const pause = () => setRunning(false)
  const reset = () => {
    setRunning(false)
    setElapsed(0)
    setLaps([])
  }
  const lap = () => {
    if (running) setLaps((prev) => [elapsed, ...prev])
  }

  const formatTime = (ms: number) => {
    const hours = Math.floor(ms / 3600000)
    const minutes = Math.floor((ms % 3600000) / 60000)
    const seconds = Math.floor((ms % 60000) / 1000)
    const centiseconds = Math.floor((ms % 1000) / 10)
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${centiseconds.toString().padStart(2, '0')}`
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Timer className="h-5 w-5" /> Stopwatch
        </CardTitle>
        <CardDescription>Precise stopwatch with lap tracking</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="text-center">
          <div className="font-mono text-5xl sm:text-6xl font-bold tracking-tight tabular-nums">
            {formatTime(elapsed)}
          </div>
        </div>
        <div className="flex items-center justify-center gap-3">
          {!running ? (
            <Button onClick={start} size="lg" className="gap-2">
              <Play className="h-5 w-5" /> Start
            </Button>
          ) : (
            <Button onClick={pause} variant="secondary" size="lg" className="gap-2">
              <Pause className="h-5 w-5" /> Pause
            </Button>
          )}
          <Button onClick={lap} variant="outline" size="lg" disabled={!running} className="gap-2">
            <Flag className="h-5 w-5" /> Lap
          </Button>
          <Button onClick={reset} variant="outline" size="lg" className="gap-2">
            <RotateCcw className="h-5 w-5" /> Reset
          </Button>
        </div>
        {laps.length > 0 && (
          <div className="space-y-2">
            <Label className="text-muted-foreground">Laps ({laps.length})</Label>
            <div className="max-h-64 overflow-y-auto border rounded-lg">
              {laps.map((lapTime, i) => {
                const lapNum = laps.length - i
                const prevLap = i < laps.length - 1 ? laps[i + 1] : 0
                const delta = lapTime - prevLap
                return (
                  <div key={i} className="flex items-center justify-between px-4 py-2 border-b last:border-b-0 text-sm">
                    <span className="text-muted-foreground">Lap {lapNum}</span>
                    <span className="font-mono tabular-nums text-orange-600 dark:text-orange-400">+{formatTime(delta)}</span>
                    <span className="font-mono tabular-nums">{formatTime(lapTime)}</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ==================== CountdownTimer ====================
const PRESETS = [
  { label: '1m', seconds: 60 },
  { label: '5m', seconds: 300 },
  { label: '10m', seconds: 600 },
  { label: '15m', seconds: 900 },
  { label: '25m', seconds: 1500 },
  { label: '30m', seconds: 1800 },
  { label: '60m', seconds: 3600 },
]

export function CountdownTimer() {
  const [inputHours, setInputHours] = useState(0)
  const [inputMinutes, setInputMinutes] = useState(5)
  const [inputSeconds, setInputSeconds] = useState(0)
  const [totalSeconds, setTotalSeconds] = useState(300)
  const [remaining, setRemaining] = useState(300)
  const [running, setRunning] = useState(false)
  const [finished, setFinished] = useState(false)
  const [flashing, setFlashing] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (running && remaining > 0) {
      intervalRef.current = setInterval(() => {
        setRemaining((prev) => {
          if (prev <= 1) {
            setRunning(false)
            setFinished(true)
            playDoubleBeep()
            setFlashing(true)
            setTimeout(() => setFlashing(false), 3000)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [running])

  const start = () => {
    if (remaining <= 0) {
      const total = inputHours * 3600 + inputMinutes * 60 + inputSeconds
      if (total <= 0) {
        toast.error('Set a time greater than 0')
        return
      }
      setTotalSeconds(total)
      setRemaining(total)
    }
    setFinished(false)
    setRunning(true)
  }

  const pause = () => setRunning(false)
  const reset = () => {
    setRunning(false)
    setFinished(false)
    setFlashing(false)
    const total = inputHours * 3600 + inputMinutes * 60 + inputSeconds
    setTotalSeconds(total)
    setRemaining(total)
  }

  const applyPreset = (secs: number) => {
    setRunning(false)
    setFinished(false)
    const h = Math.floor(secs / 3600)
    const m = Math.floor((secs % 3600) / 60)
    const s = secs % 60
    setInputHours(h)
    setInputMinutes(m)
    setInputSeconds(s)
    setTotalSeconds(secs)
    setRemaining(secs)
  }

  const progress = totalSeconds > 0 ? (totalSeconds - remaining) / totalSeconds : 0
  const radius = 90
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference * (1 - progress)

  const displayHours = Math.floor(remaining / 3600)
  const displayMinutes = Math.floor((remaining % 3600) / 60)
  const displaySeconds = remaining % 60

  const formatDisplay = () => {
    const h = displayHours.toString().padStart(2, '0')
    const m = displayMinutes.toString().padStart(2, '0')
    const s = displaySeconds.toString().padStart(2, '0')
    return displayHours > 0 ? `${h}:${m}:${s}` : `${m}:${s}`
  }

  return (
    <Card className={flashing ? 'animate-pulse ring-2 ring-orange-500' : ''}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Hourglass className="h-5 w-5" /> Countdown Timer
        </CardTitle>
        <CardDescription>Set countdown timers with alerts</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Visual progress ring */}
        <div className="flex justify-center">
          <div className="relative">
            <svg width="220" height="220" className="-rotate-90">
              <circle cx="110" cy="110" r={radius} fill="none" stroke="currentColor" strokeWidth="8" className="text-muted/30" />
              <circle
                cx="110" cy="110" r={radius} fill="none"
                stroke="currentColor" strokeWidth="8"
                strokeLinecap="round"
                className="text-primary"
                style={{
                  strokeDasharray: circumference,
                  strokeDashoffset,
                  transition: 'stroke-dashoffset 0.5s ease',
                }}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="font-mono text-4xl font-bold tabular-nums">
                {formatDisplay()}
              </span>
            </div>
          </div>
        </div>

        {finished && (
          <div className="text-center text-orange-600 dark:text-orange-400 font-semibold animate-bounce">
            ⏰ Time&apos;s up!
          </div>
        )}

        {/* Preset buttons */}
        <div className="flex flex-wrap gap-2 justify-center">
          {PRESETS.map((p) => (
            <Button key={p.label} variant="outline" size="sm" onClick={() => applyPreset(p.seconds)}>
              {p.label}
            </Button>
          ))}
        </div>

        {/* Custom input */}
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1">
            <Label className="text-xs text-center block">Hours</Label>
            <Input type="number" min={0} max={23} value={inputHours} onChange={(e) => setInputHours(Math.max(0, Number(e.target.value)))} className="text-center" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-center block">Minutes</Label>
            <Input type="number" min={0} max={59} value={inputMinutes} onChange={(e) => setInputMinutes(Math.max(0, Number(e.target.value)))} className="text-center" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-center block">Seconds</Label>
            <Input type="number" min={0} max={59} value={inputSeconds} onChange={(e) => setInputSeconds(Math.max(0, Number(e.target.value)))} className="text-center" />
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-3">
          {!running ? (
            <Button onClick={start} size="lg" className="gap-2">
              <Play className="h-5 w-5" /> {remaining < totalSeconds && remaining > 0 ? 'Resume' : 'Start'}
            </Button>
          ) : (
            <Button onClick={pause} variant="secondary" size="lg" className="gap-2">
              <Pause className="h-5 w-5" /> Pause
            </Button>
          )}
          <Button onClick={reset} variant="outline" size="lg" className="gap-2">
            <RotateCcw className="h-5 w-5" /> Reset
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// ==================== PomodoroTimer ====================
type PomodoroPhase = 'work' | 'shortBreak' | 'longBreak'

export function PomodoroTimer() {
  const [workDuration, setWorkDuration] = useState(25)
  const [shortBreakDuration, setShortBreakDuration] = useState(5)
  const [longBreakDuration, setLongBreakDuration] = useState(15)
  const [longBreakInterval, setLongBreakInterval] = useState(4)
  const [phase, setPhase] = useState<PomodoroPhase>('work')
  const [remaining, setRemaining] = useState(25 * 60)
  const [running, setRunning] = useState(false)
  const [completedPomodoros, setCompletedPomodoros] = useState(0)
  const [totalFocusSeconds, setTotalFocusSeconds] = useState(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const phaseLabel = phase === 'work' ? 'Focus' : phase === 'shortBreak' ? 'Short Break' : 'Long Break'
  const phaseDuration = phase === 'work' ? workDuration * 60 : phase === 'shortBreak' ? shortBreakDuration * 60 : longBreakDuration * 60

  useEffect(() => {
    if (running && remaining > 0) {
      intervalRef.current = setInterval(() => {
        setRemaining((prev) => {
          if (phase === 'work') {
            setTotalFocusSeconds((s) => s + 1)
          }
          if (prev <= 1) {
            setRunning(false)
            playDoubleBeep()
            // Auto-advance phase
            if (phase === 'work') {
              const newCount = completedPomodoros + 1
              setCompletedPomodoros(newCount)
              if (newCount % longBreakInterval === 0) {
                setPhase('longBreak')
                setRemaining(longBreakDuration * 60)
              } else {
                setPhase('shortBreak')
                setRemaining(shortBreakDuration * 60)
              }
            } else {
              setPhase('work')
              setRemaining(workDuration * 60)
            }
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [running, phase, completedPomodoros, longBreakInterval, workDuration, shortBreakDuration, longBreakDuration])

  const start = () => setRunning(true)
  const pause = () => setRunning(false)
  const reset = () => {
    setRunning(false)
    setPhase('work')
    setRemaining(workDuration * 60)
  }

  const progress = phaseDuration > 0 ? (phaseDuration - remaining) / phaseDuration : 0
  const radius = 90
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference * (1 - progress)

  const displayMinutes = Math.floor(remaining / 60).toString().padStart(2, '0')
  const displaySeconds = (remaining % 60).toString().padStart(2, '0')

  const totalFocusMinutes = Math.floor(totalFocusSeconds / 60)

  const phaseColor = phase === 'work' ? 'text-rose-500' : phase === 'shortBreak' ? 'text-emerald-500' : 'text-sky-500'
  const phaseRingColor = phase === 'work' ? 'text-rose-500' : phase === 'shortBreak' ? 'text-emerald-500' : 'text-sky-500'

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" /> Pomodoro Timer
        </CardTitle>
        <CardDescription>Focus timer with work and break intervals</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Phase indicator */}
        <div className="flex items-center justify-center gap-2">
          <Badge variant={phase === 'work' ? 'default' : 'secondary'} className={phaseColor}>
            {phase === 'work' ? <Zap className="h-3 w-3 mr-1" /> : <Coffee className="h-3 w-3 mr-1" />}
            {phaseLabel}
          </Badge>
          <Badge variant="outline">
            🍅 {completedPomodoros} completed
          </Badge>
        </div>

        {/* Visual timer */}
        <div className="flex justify-center">
          <div className="relative">
            <svg width="220" height="220" className="-rotate-90">
              <circle cx="110" cy="110" r={radius} fill="none" stroke="currentColor" strokeWidth="8" className="text-muted/30" />
              <circle
                cx="110" cy="110" r={radius} fill="none"
                stroke="currentColor" strokeWidth="8"
                strokeLinecap="round"
                className={phaseRingColor}
                style={{
                  strokeDasharray: circumference,
                  strokeDashoffset,
                  transition: 'stroke-dashoffset 0.5s ease',
                }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-mono text-4xl font-bold tabular-nums">
                {displayMinutes}:{displaySeconds}
              </span>
              <span className="text-xs text-muted-foreground mt-1">{phaseLabel}</span>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-3">
          {!running ? (
            <Button onClick={start} size="lg" className="gap-2">
              <Play className="h-5 w-5" /> Start
            </Button>
          ) : (
            <Button onClick={pause} variant="secondary" size="lg" className="gap-2">
              <Pause className="h-5 w-5" /> Pause
            </Button>
          )}
          <Button onClick={reset} variant="outline" size="lg" className="gap-2">
            <RotateCcw className="h-5 w-5" /> Reset
          </Button>
        </div>

        {/* Settings */}
        <div className="grid grid-cols-2 gap-3 border-t pt-4">
          <div className="space-y-1">
            <Label className="text-xs">Work (min)</Label>
            <Input type="number" min={1} max={90} value={workDuration} onChange={(e) => { const v = Math.max(1, Number(e.target.value)); setWorkDuration(v); if (phase === 'work' && !running) setRemaining(v * 60) }} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Short Break (min)</Label>
            <Input type="number" min={1} max={30} value={shortBreakDuration} onChange={(e) => { const v = Math.max(1, Number(e.target.value)); setShortBreakDuration(v); if (phase === 'shortBreak' && !running) setRemaining(v * 60) }} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Long Break (min)</Label>
            <Input type="number" min={1} max={60} value={longBreakDuration} onChange={(e) => { const v = Math.max(1, Number(e.target.value)); setLongBreakDuration(v); if (phase === 'longBreak' && !running) setRemaining(v * 60) }} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Long Break Every N</Label>
            <Input type="number" min={2} max={10} value={longBreakInterval} onChange={(e) => setLongBreakInterval(Math.max(2, Number(e.target.value)))} />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-muted p-3 rounded-lg text-center">
            <div className="text-2xl font-bold">{completedPomodoros}</div>
            <div className="text-xs text-muted-foreground">Pomodoros Today</div>
          </div>
          <div className="bg-muted p-3 rounded-lg text-center">
            <div className="text-2xl font-bold">{totalFocusMinutes}</div>
            <div className="text-xs text-muted-foreground">Focus Minutes</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ==================== DecisionMaker ====================
export function DecisionMaker() {
  const [options, setOptions] = useState<string[]>([])
  const [newOption, setNewOption] = useState('')
  const [bulkInput, setBulkInput] = useState('')
  const [deciding, setDeciding] = useState(false)
  const [currentDisplay, setCurrentDisplay] = useState('')
  const [finalResult, setFinalResult] = useState('')
  const [history, setHistory] = useState<string[]>([])
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const addOption = () => {
    const trimmed = newOption.trim()
    if (!trimmed) return
    if (options.includes(trimmed)) {
      toast.error('Option already exists')
      return
    }
    setOptions((prev) => [...prev, trimmed])
    setNewOption('')
  }

  const addBulkOptions = () => {
    const lines = bulkInput.split('\n').map((l) => l.trim()).filter((l) => l.length > 0)
    const newOpts = lines.filter((l) => !options.includes(l))
    if (newOpts.length === 0) {
      toast.error('No new options to add')
      return
    }
    setOptions((prev) => [...prev, ...newOpts])
    setBulkInput('')
    toast.success(`Added ${newOpts.length} option(s)`)
  }

  const removeOption = (index: number) => {
    setOptions((prev) => prev.filter((_, i) => i !== index))
  }

  const decide = useCallback(() => {
    if (options.length < 2) {
      toast.error('Add at least 2 options to decide')
      return
    }
    setDeciding(true)
    setFinalResult('')
    let elapsed = 0
    const totalDuration = 2000
    const interval = 60

    const tick = () => {
      elapsed += interval
      const randomIdx = Math.floor(Math.random() * options.length)
      setCurrentDisplay(options[randomIdx])

      if (elapsed < totalDuration) {
        timeoutRef.current = setTimeout(tick, interval)
      } else {
        // Land on final result
        const finalIdx = Math.floor(Math.random() * options.length)
        const result = options[finalIdx]
        setCurrentDisplay(result)
        setFinalResult(result)
        setDeciding(false)
        setHistory((prev) => [result, ...prev].slice(0, 20))
        playBeep(1000, 200)
      }
    }

    tick()
  }, [options])

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Dices className="h-5 w-5" /> Decision Maker
        </CardTitle>
        <CardDescription>Let the wheel decide! Enter options and spin</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add option */}
        <div className="flex gap-2">
          <Input
            value={newOption}
            onChange={(e) => setNewOption(e.target.value)}
            placeholder="Add an option..."
            onKeyDown={(e) => { if (e.key === 'Enter') addOption() }}
          />
          <Button onClick={addOption} size="icon" className="shrink-0">
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {/* Bulk add */}
        <details className="group">
          <summary className="text-sm text-muted-foreground cursor-pointer hover:text-foreground transition-colors">
            Bulk add (one per line)
          </summary>
          <div className="mt-2 space-y-2">
            <Textarea
              value={bulkInput}
              onChange={(e) => setBulkInput(e.target.value)}
              placeholder="Option 1&#10;Option 2&#10;Option 3"
              rows={4}
            />
            <Button onClick={addBulkOptions} variant="outline" size="sm">Add All</Button>
          </div>
        </details>

        {/* Options list */}
        {options.length > 0 && (
          <div className="space-y-1 max-h-40 overflow-y-auto">
            {options.map((opt, i) => (
              <div key={i} className="flex items-center justify-between gap-2 bg-muted px-3 py-1.5 rounded text-sm">
                <span className="flex-1 truncate">{opt}</span>
                <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => removeOption(i)}>
                  <Trash2 className="h-3 w-3 text-muted-foreground" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Result display */}
        <div className="min-h-24 flex items-center justify-center">
          {deciding ? (
            <div className="text-center">
              <div className={`text-3xl font-bold transition-all ${deciding ? 'animate-pulse' : ''}`}>
                {currentDisplay}
              </div>
            </div>
          ) : finalResult ? (
            <div className="text-center space-y-2">
              <div className="text-sm text-muted-foreground">The decision is:</div>
              <div className="text-3xl font-bold text-primary flex items-center justify-center gap-2">
                <Sparkles className="h-6 w-6" /> {finalResult}
              </div>
            </div>
          ) : (
            <div className="text-muted-foreground text-sm">Add options and press Decide!</div>
          )}
        </div>

        {/* Decide button */}
        <Button onClick={decide} disabled={deciding || options.length < 2} className="w-full" size="lg">
          <Sparkles className="h-5 w-5 mr-2" /> Decide!
        </Button>

        {/* History */}
        {history.length > 0 && (
          <div className="space-y-2">
            <Label className="text-muted-foreground text-xs">Decision History</Label>
            <div className="flex flex-wrap gap-1">
              {history.map((h, i) => (
                <Badge key={i} variant="secondary" className="text-xs">{h}</Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ==================== HabitTracker ====================
interface Habit {
  id: string
  name: string
  completedDays: string[] // ISO date strings e.g. "2024-01-15"
}

function getWeekDates(): string[] {
  const today = new Date()
  const dayOfWeek = today.getDay()
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
  const monday = new Date(today)
  monday.setDate(today.getDate() + mondayOffset)
  const dates: string[] = []
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    dates.push(d.toISOString().split('T')[0])
  }
  return dates
}

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function getStreak(completedDays: string[]): number {
  if (completedDays.length === 0) return 0
  const sorted = [...completedDays].sort().reverse()
  let streak = 0
  const today = new Date().toISOString().split('T')[0]
  let checkDate = new Date(today)

  // If today is not completed, start checking from yesterday
  if (!sorted.includes(today)) {
    checkDate.setDate(checkDate.getDate() - 1)
  }

  while (true) {
    const dateStr = checkDate.toISOString().split('T')[0]
    if (sorted.includes(dateStr)) {
      streak++
      checkDate.setDate(checkDate.getDate() - 1)
    } else {
      break
    }
  }
  return streak
}

function loadHabitsFromStorage(): Habit[] {
  try {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('habits')
      if (saved) return JSON.parse(saved)
    }
  } catch {
    // ignore
  }
  return []
}

export function HabitTracker() {
  const [habits, setHabits] = useState<Habit[]>(loadHabitsFromStorage)
  const [newHabit, setNewHabit] = useState('')

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem('habits', JSON.stringify(habits))
  }, [habits])

  const weekDates = useMemo(() => getWeekDates(), [])

  const addHabit = () => {
    const trimmed = newHabit.trim()
    if (!trimmed) return
    setHabits((prev) => [...prev, { id: Date.now().toString(), name: trimmed, completedDays: [] }])
    setNewHabit('')
  }

  const deleteHabit = (id: string) => {
    setHabits((prev) => prev.filter((h) => h.id !== id))
  }

  const toggleDay = (habitId: string, date: string) => {
    setHabits((prev) =>
      prev.map((h) => {
        if (h.id !== habitId) return h
        const completed = h.completedDays.includes(date)
        return {
          ...h,
          completedDays: completed ? h.completedDays.filter((d) => d !== date) : [...h.completedDays, date],
        }
      })
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5" /> Habit Tracker
        </CardTitle>
        <CardDescription>Track daily habits with a visual streak calendar</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            value={newHabit}
            onChange={(e) => setNewHabit(e.target.value)}
            placeholder="Add a new habit..."
            onKeyDown={(e) => { if (e.key === 'Enter') addHabit() }}
          />
          <Button onClick={addHabit} size="icon" className="shrink-0">
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {habits.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">
            No habits yet. Add one above to start tracking!
          </div>
        ) : (
          <div className="space-y-3">
            {/* Day labels header */}
            <div className="grid grid-cols-[1fr,repeat(7,40px),60px] gap-1 items-center text-xs text-muted-foreground">
              <span></span>
              {DAY_LABELS.map((d, i) => (
                <span key={d} className="text-center">{d}</span>
              ))}
              <span className="text-center">Streak</span>
            </div>

            {habits.map((habit) => {
              const streak = getStreak(habit.completedDays)
              return (
                <div key={habit.id} className="grid grid-cols-[1fr,repeat(7,40px),60px] gap-1 items-center">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-sm truncate">{habit.name}</span>
                    <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => deleteHabit(habit.id)}>
                      <Trash2 className="h-3 w-3 text-muted-foreground" />
                    </Button>
                  </div>
                  {weekDates.map((date) => {
                    const isCompleted = habit.completedDays.includes(date)
                    const isToday = date === new Date().toISOString().split('T')[0]
                    return (
                      <button
                        key={date}
                        onClick={() => toggleDay(habit.id, date)}
                        className={`h-8 w-8 mx-auto rounded-full border-2 transition-all flex items-center justify-center ${
                          isCompleted
                            ? 'bg-emerald-500 border-emerald-500 text-white'
                            : `border-muted-foreground/30 hover:border-muted-foreground/60 ${isToday ? 'ring-2 ring-primary/30' : ''}`
                        }`}
                        title={`${DAY_LABELS[weekDates.indexOf(date)]} - ${date}`}
                      >
                        {isCompleted && <Check className="h-4 w-4" />}
                        {!isCompleted && <Circle className="h-3 w-3 text-muted-foreground/30" />}
                      </button>
                    )
                  })}
                  <div className="text-center">
                    <span className="text-sm font-semibold text-orange-600 dark:text-orange-400">{streak}🔥</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ==================== WorldClock ====================
interface CityClock {
  city: string
  timezone: string
  country: string
}

const DEFAULT_CITIES: CityClock[] = [
  { city: 'New York', timezone: 'America/New_York', country: 'USA' },
  { city: 'London', timezone: 'Europe/London', country: 'UK' },
  { city: 'Paris', timezone: 'Europe/Paris', country: 'France' },
  { city: 'Dubai', timezone: 'Asia/Dubai', country: 'UAE' },
  { city: 'Mumbai', timezone: 'Asia/Kolkata', country: 'India' },
  { city: 'Singapore', timezone: 'Asia/Singapore', country: 'Singapore' },
  { city: 'Tokyo', timezone: 'Asia/Tokyo', country: 'Japan' },
  { city: 'Sydney', timezone: 'Australia/Sydney', country: 'Australia' },
  { city: 'Los Angeles', timezone: 'America/Los_Angeles', country: 'USA' },
  { city: 'São Paulo', timezone: 'America/Sao_Paulo', country: 'Brazil' },
]

const ALL_TIMEZONES: CityClock[] = [
  ...DEFAULT_CITIES,
  { city: 'Chicago', timezone: 'America/Chicago', country: 'USA' },
  { city: 'Denver', timezone: 'America/Denver', country: 'USA' },
  { city: 'Anchorage', timezone: 'America/Anchorage', country: 'USA' },
  { city: 'Honolulu', timezone: 'Pacific/Honolulu', country: 'USA' },
  { city: 'Toronto', timezone: 'America/Toronto', country: 'Canada' },
  { city: 'Vancouver', timezone: 'America/Vancouver', country: 'Canada' },
  { city: 'Mexico City', timezone: 'America/Mexico_City', country: 'Mexico' },
  { city: 'Buenos Aires', timezone: 'America/Argentina/Buenos_Aires', country: 'Argentina' },
  { city: 'Bogotá', timezone: 'America/Bogota', country: 'Colombia' },
  { city: 'Santiago', timezone: 'America/Santiago', country: 'Chile' },
  { city: 'Lima', timezone: 'America/Lima', country: 'Peru' },
  { city: 'Berlin', timezone: 'Europe/Berlin', country: 'Germany' },
  { city: 'Madrid', timezone: 'Europe/Madrid', country: 'Spain' },
  { city: 'Rome', timezone: 'Europe/Rome', country: 'Italy' },
  { city: 'Amsterdam', timezone: 'Europe/Amsterdam', country: 'Netherlands' },
  { city: 'Moscow', timezone: 'Europe/Moscow', country: 'Russia' },
  { city: 'Istanbul', timezone: 'Europe/Istanbul', country: 'Turkey' },
  { city: 'Athens', timezone: 'Europe/Athens', country: 'Greece' },
  { city: 'Cairo', timezone: 'Africa/Cairo', country: 'Egypt' },
  { city: 'Johannesburg', timezone: 'Africa/Johannesburg', country: 'South Africa' },
  { city: 'Lagos', timezone: 'Africa/Lagos', country: 'Nigeria' },
  { city: 'Nairobi', timezone: 'Africa/Nairobi', country: 'Kenya' },
  { city: 'Bangkok', timezone: 'Asia/Bangkok', country: 'Thailand' },
  { city: 'Seoul', timezone: 'Asia/Seoul', country: 'South Korea' },
  { city: 'Shanghai', timezone: 'Asia/Shanghai', country: 'China' },
  { city: 'Hong Kong', timezone: 'Asia/Hong_Kong', country: 'China' },
  { city: 'Jakarta', timezone: 'Asia/Jakarta', country: 'Indonesia' },
  { city: 'Kuala Lumpur', timezone: 'Asia/Kuala_Lumpur', country: 'Malaysia' },
  { city: 'Taipei', timezone: 'Asia/Taipei', country: 'Taiwan' },
  { city: 'Auckland', timezone: 'Pacific/Auckland', country: 'New Zealand' },
  { city: 'Fiji', timezone: 'Pacific/Fiji', country: 'Fiji' },
]

interface ClockDisplay {
  city: string
  timezone: string
  country: string
}

function loadCitiesFromStorage(): ClockDisplay[] {
  try {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('worldClockCities')
      if (saved) return JSON.parse(saved)
    }
  } catch {
    // ignore
  }
  return DEFAULT_CITIES
}

export function WorldClock() {
  const [cities, setCities] = useState<ClockDisplay[]>(loadCitiesFromStorage)
  const [selectedTimezone, setSelectedTimezone] = useState('')
  const [, setTick] = useState(0)

  // Save cities
  useEffect(() => {
    if (cities.length > 0) {
      localStorage.setItem('worldClockCities', JSON.stringify(cities))
    }
  }, [cities])

  // Tick every second
  useEffect(() => {
    const timer = setInterval(() => setTick((t) => t + 1), 1000)
    return () => clearInterval(timer)
  }, [])

  const getTimeInfo = (timezone: string) => {
    try {
      const now = new Date()
      const timeStr = new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      }).format(now)

      const dateStr = new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      }).format(now)

      const hourStr = new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        hour: 'numeric',
        hour12: false,
      }).format(now)
      const hour = parseInt(hourStr, 10)
      const isDaytime = hour >= 6 && hour < 18

      const offsetStr = new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        timeZoneName: 'shortOffset',
      }).format(now).split(' ').pop() || ''

      return { timeStr, dateStr, isDaytime, offsetStr }
    } catch {
      return { timeStr: 'Invalid', dateStr: '', isDaytime: true, offsetStr: '' }
    }
  }

  const addCity = () => {
    const tz = ALL_TIMEZONES.find((t) => t.timezone === selectedTimezone)
    if (!tz) {
      toast.error('Select a timezone')
      return
    }
    if (cities.some((c) => c.timezone === tz.timezone)) {
      toast.error('City already added')
      return
    }
    setCities((prev) => [...prev, { city: tz.city, timezone: tz.timezone, country: tz.country }])
    setSelectedTimezone('')
  }

  const removeCity = (timezone: string) => {
    setCities((prev) => prev.filter((c) => c.timezone !== timezone))
  }

  const availableTimezones = ALL_TIMEZONES.filter((tz) => !cities.some((c) => c.timezone === tz.timezone))

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="h-5 w-5" /> World Clock
        </CardTitle>
        <CardDescription>View current time across multiple cities worldwide</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add city */}
        <div className="flex gap-2">
          <Select value={selectedTimezone} onValueChange={setSelectedTimezone}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Add a city..." />
            </SelectTrigger>
            <SelectContent>
              {availableTimezones.map((tz) => (
                <SelectItem key={tz.timezone} value={tz.timezone}>
                  {tz.city}, {tz.country}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={addCity} size="icon" className="shrink-0">
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {/* Clock grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {cities.map((city) => {
            const info = getTimeInfo(city.timezone)
            return (
              <div key={city.timezone} className="bg-muted/50 rounded-lg p-4 flex items-center gap-3 group">
                <div className={`shrink-0 h-10 w-10 rounded-full flex items-center justify-center ${
                  info.isDaytime ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-600' : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                }`}>
                  {info.isDaytime ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm truncate">{city.city}</span>
                    <span className="text-xs text-muted-foreground">{info.offsetStr}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">{city.country} &middot; {info.dateStr}</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="font-mono text-lg font-bold tabular-nums">{info.timeStr}</div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => removeCity(city.timezone)}
                >
                  <Trash2 className="h-3 w-3 text-muted-foreground" />
                </Button>
              </div>
            )
          })}
        </div>

        {cities.length === 0 && (
          <div className="text-center py-8 text-muted-foreground text-sm">
            No cities added. Select a city above to get started!
          </div>
        )}
      </CardContent>
    </Card>
  )
}
