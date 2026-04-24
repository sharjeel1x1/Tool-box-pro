'use client'

import React, { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import {
  Apple, Droplets, Heart, Moon, Ruler,
  Calculator, ArrowRight, Activity, GlassWater
} from 'lucide-react'

// ==================== CalorieCalculator ====================
function calcBMR(gender: 'male' | 'female', weightKg: number, heightCm: number, age: number): number {
  // Mifflin-St Jeor Equation
  if (gender === 'male') {
    return 10 * weightKg + 6.25 * heightCm - 5 * age + 5
  }
  return 10 * weightKg + 6.25 * heightCm - 5 * age - 161
}

const ACTIVITY_MULTIPLIERS: Record<string, { label: string; multiplier: number }> = {
  sedentary: { label: 'Sedentary (little or no exercise)', multiplier: 1.2 },
  light: { label: 'Light (1-3 days/week)', multiplier: 1.375 },
  moderate: { label: 'Moderate (3-5 days/week)', multiplier: 1.55 },
  active: { label: 'Active (6-7 days/week)', multiplier: 1.725 },
  'very-active': { label: 'Very Active (hard daily exercise)', multiplier: 1.9 },
}

export function CalorieCalculator() {
  const [gender, setGender] = useState<'male' | 'female'>('male')
  const [age, setAge] = useState(25)
  const [weight, setWeight] = useState(70)
  const [height, setHeight] = useState(175)
  const [weightUnit, setWeightUnit] = useState<'kg' | 'lbs'>('kg')
  const [heightUnit, setHeightUnit] = useState<'cm' | 'ft'>('cm')
  const [activity, setActivity] = useState('moderate')
  const [calculated, setCalculated] = useState(false)

  const weightKg = weightUnit === 'lbs' ? weight * 0.453592 : weight
  const heightCm = heightUnit === 'ft' ? height * 30.48 : height

  const results = useMemo(() => {
    if (!calculated) return null
    const bmr = calcBMR(gender, weightKg, heightCm, age)
    const tdee = bmr * (ACTIVITY_MULTIPLIERS[activity]?.multiplier || 1.55)
    const loseWeight = tdee - 500
    const gainWeight = tdee + 500

    const calcMacros = (calories: number) => {
      const protein = (calories * 0.30) / 4
      const carbs = (calories * 0.40) / 4
      const fat = (calories * 0.30) / 9
      return { protein: Math.round(protein), carbs: Math.round(carbs), fat: Math.round(fat) }
    }

    return {
      bmr: Math.round(bmr),
      tdee: Math.round(tdee),
      loseWeight: Math.round(loseWeight),
      gainWeight: Math.round(gainWeight),
      maintainMacros: calcMacros(tdee),
      loseMacros: calcMacros(loseWeight),
      gainMacros: calcMacros(gainWeight),
    }
  }, [calculated, gender, weightKg, heightCm, age, activity])

  const calculate = () => {
    if (age <= 0 || weight <= 0 || height <= 0) {
      toast.error('Please fill in all fields with valid values')
      return
    }
    setCalculated(true)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Apple className="h-5 w-5" /> Calorie Calculator
        </CardTitle>
        <CardDescription>Calculate daily calorie needs based on your profile</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Gender</Label>
          <div className="flex gap-2">
            <Button
              variant={gender === 'male' ? 'default' : 'outline'}
              onClick={() => setGender('male')}
              className="flex-1"
            >
              Male
            </Button>
            <Button
              variant={gender === 'female' ? 'default' : 'outline'}
              onClick={() => setGender('female')}
              className="flex-1"
            >
              Female
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="cal-age">Age</Label>
            <Input id="cal-age" type="number" value={age} onChange={e => setAge(Number(e.target.value))} min={1} max={120} />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="cal-weight">Weight</Label>
              <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => setWeightUnit(weightUnit === 'kg' ? 'lbs' : 'kg')}>
                {weightUnit === 'kg' ? 'kg → lbs' : 'lbs → kg'}
              </Button>
            </div>
            <Input id="cal-weight" type="number" value={weight} onChange={e => setWeight(Number(e.target.value))} min={1} />
            <p className="text-xs text-muted-foreground">{weightUnit} {weightUnit === 'lbs' ? `(${weightKg.toFixed(1)} kg)` : ''}</p>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="cal-height">Height</Label>
              <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => setHeightUnit(heightUnit === 'cm' ? 'ft' : 'cm')}>
                {heightUnit === 'cm' ? 'cm → ft' : 'ft → cm'}
              </Button>
            </div>
            <Input id="cal-height" type="number" value={height} onChange={e => setHeight(Number(e.target.value))} min={1} />
            <p className="text-xs text-muted-foreground">{heightUnit} {heightUnit === 'ft' ? `(${heightCm.toFixed(1)} cm)` : ''}</p>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Activity Level</Label>
          <Select value={activity} onValueChange={setActivity}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(ACTIVITY_MULTIPLIERS).map(([key, val]) => (
                <SelectItem key={key} value={key}>{val.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button onClick={calculate} className="w-full">
          <Calculator className="h-4 w-4 mr-2" /> Calculate Calories
        </Button>

        {results && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'BMR', value: results.bmr, sub: 'Base metabolic rate' },
                { label: 'TDEE', value: results.tdee, sub: 'Maintain weight' },
                { label: 'Lose Weight', value: results.loseWeight, sub: '-500 cal/day' },
                { label: 'Gain Weight', value: results.gainWeight, sub: '+500 cal/day' },
              ].map(stat => (
                <div key={stat.label} className="bg-muted p-3 rounded-lg text-center">
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <div className="text-xs font-medium">{stat.label}</div>
                  <div className="text-xs text-muted-foreground">{stat.sub}</div>
                </div>
              ))}
            </div>

            <div className="space-y-2">
              <Label className="font-medium">Macros Breakdown (30% Protein / 40% Carbs / 30% Fat)</Label>
              {[
                { label: 'Maintain', cal: results.tdee, macros: results.maintainMacros },
                { label: 'Lose Weight', cal: results.loseWeight, macros: results.loseMacros },
                { label: 'Gain Weight', cal: results.gainWeight, macros: results.gainMacros },
              ].map(goal => (
                <div key={goal.label} className="bg-muted/50 p-3 rounded-lg">
                  <p className="text-sm font-medium mb-2">{goal.label} ({goal.cal} cal)</p>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                      <p className="text-lg font-bold text-red-500">{goal.macros.protein}g</p>
                      <p className="text-xs text-muted-foreground">Protein</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-amber-500">{goal.macros.carbs}g</p>
                      <p className="text-xs text-muted-foreground">Carbs</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-green-500">{goal.macros.fat}g</p>
                      <p className="text-xs text-muted-foreground">Fat</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ==================== WaterIntake ====================
export function WaterIntake() {
  const [weight, setWeight] = useState(70)
  const [weightUnit, setWeightUnit] = useState<'kg' | 'lbs'>('kg')
  const [activity, setActivity] = useState<'sedentary' | 'moderate' | 'active'>('moderate')
  const [climate, setClimate] = useState<'cold' | 'temperate' | 'hot'>('temperate')
  const [calculated, setCalculated] = useState(false)

  const results = useMemo(() => {
    if (!calculated) return null
    const weightKg = weightUnit === 'lbs' ? weight * 0.453592 : weight

    // Base: ~33ml per kg body weight
    let baseLiters = (weightKg * 33) / 1000

    // Activity adjustment
    if (activity === 'moderate') baseLiters *= 1.2
    else if (activity === 'active') baseLiters *= 1.4

    // Climate adjustment
    if (climate === 'hot') baseLiters *= 1.3
    else if (climate === 'cold') baseLiters *= 0.9

    const liters = Math.round(baseLiters * 10) / 10
    const oz = Math.round(liters * 33.814)
    const glasses = Math.round(liters / 0.25) // 250ml glasses

    // Schedule
    const morning = Math.round(liters * 0.3 * 10) / 10
    const midday = Math.round(liters * 0.3 * 10) / 10
    const afternoon = Math.round(liters * 0.25 * 10) / 10
    const evening = Math.round(liters * 0.15 * 10) / 10

    return { liters, oz, glasses, schedule: { morning, midday, afternoon, evening } }
  }, [calculated, weight, weightUnit, activity, climate])

  const calculate = () => {
    if (weight <= 0) {
      toast.error('Please enter a valid weight')
      return
    }
    setCalculated(true)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Droplets className="h-5 w-5" /> Water Intake Calculator
        </CardTitle>
        <CardDescription>Calculate recommended daily water consumption</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="water-weight">Weight</Label>
              <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => setWeightUnit(weightUnit === 'kg' ? 'lbs' : 'kg')}>
                {weightUnit === 'kg' ? 'kg → lbs' : 'lbs → kg'}
              </Button>
            </div>
            <Input id="water-weight" type="number" value={weight} onChange={e => setWeight(Number(e.target.value))} min={1} />
            <p className="text-xs text-muted-foreground">{weightUnit}</p>
          </div>
          <div className="space-y-2">
            <Label>Activity Level</Label>
            <Select value={activity} onValueChange={v => setActivity(v as 'sedentary' | 'moderate' | 'active')}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="sedentary">Sedentary</SelectItem>
                <SelectItem value="moderate">Moderate</SelectItem>
                <SelectItem value="active">Active</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Climate</Label>
            <Select value={climate} onValueChange={v => setClimate(v as 'cold' | 'temperate' | 'hot')}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="cold">Cold</SelectItem>
                <SelectItem value="temperate">Temperate</SelectItem>
                <SelectItem value="hot">Hot</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button onClick={calculate} className="w-full">
          <GlassWater className="h-4 w-4 mr-2" /> Calculate Intake
        </Button>

        {results && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-muted p-4 rounded-lg text-center">
                <div className="text-3xl font-bold text-blue-500">{results.liters}L</div>
                <div className="text-xs text-muted-foreground">Liters/day</div>
              </div>
              <div className="bg-muted p-4 rounded-lg text-center">
                <div className="text-3xl font-bold text-cyan-500">{results.oz}</div>
                <div className="text-xs text-muted-foreground">Fluid oz/day</div>
              </div>
              <div className="bg-muted p-4 rounded-lg text-center">
                <div className="text-3xl font-bold text-teal-500">{results.glasses}</div>
                <div className="text-xs text-muted-foreground">Glasses (250ml)</div>
              </div>
            </div>

            {/* Visual representation */}
            <div className="space-y-2">
              <Label className="font-medium">Daily Water Goal</Label>
              <div className="flex flex-wrap gap-1 justify-center">
                {Array.from({ length: results.glasses }).map((_, i) => (
                  <div
                    key={i}
                    className="w-6 h-8 rounded-b-full border-2 border-blue-400 bg-blue-400/30 flex items-end justify-center"
                  >
                    <div className="w-4 h-5 rounded-b-full bg-blue-400" />
                  </div>
                ))}
              </div>
            </div>

            {/* Schedule */}
            <div className="space-y-2">
              <Label className="font-medium">Suggested Schedule</Label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: 'Morning', sub: '6am - 12pm', amount: results.schedule.morning, icon: '🌅' },
                  { label: 'Midday', sub: '12pm - 3pm', amount: results.schedule.midday, icon: '☀️' },
                  { label: 'Afternoon', sub: '3pm - 6pm', amount: results.schedule.afternoon, icon: '🌤️' },
                  { label: 'Evening', sub: '6pm - 10pm', amount: results.schedule.evening, icon: '🌙' },
                ].map(slot => (
                  <div key={slot.label} className="bg-muted p-3 rounded-lg flex items-center gap-3">
                    <span className="text-2xl">{slot.icon}</span>
                    <div>
                      <p className="text-sm font-medium">{slot.label}</p>
                      <p className="text-xs text-muted-foreground">{slot.sub}</p>
                      <p className="text-sm font-bold text-blue-500">{slot.amount}L</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ==================== HeartRateZones ====================
const ZONE_COLORS = [
  'bg-blue-400',
  'bg-green-400',
  'bg-yellow-400',
  'bg-orange-500',
  'bg-red-500',
]

const ZONE_TEXT_COLORS = [
  'text-blue-600 dark:text-blue-400',
  'text-green-600 dark:text-green-400',
  'text-yellow-600 dark:text-yellow-400',
  'text-orange-600 dark:text-orange-400',
  'text-red-600 dark:text-red-400',
]

export function HeartRateZones() {
  const [age, setAge] = useState(30)
  const [restingHR, setRestingHR] = useState<number | ''>('')
  const [calculated, setCalculated] = useState(false)

  const results = useMemo(() => {
    if (!calculated || age <= 0) return null

    const maxHR = 220 - age
    const rhr = typeof restingHR === 'number' && restingHR > 0 ? restingHR : null

    const zones = [
      { name: 'Zone 1', label: 'Warm Up', minPct: 0.50, maxPct: 0.60, desc: 'Light activity, warm-up' },
      { name: 'Zone 2', label: 'Fat Burn', minPct: 0.60, maxPct: 0.70, desc: 'Fat burning, endurance' },
      { name: 'Zone 3', label: 'Cardio', minPct: 0.70, maxPct: 0.80, desc: 'Aerobic, stamina' },
      { name: 'Zone 4', label: 'Anaerobic', minPct: 0.80, maxPct: 0.90, desc: 'Performance, speed' },
      { name: 'Zone 5', label: 'Max Effort', minPct: 0.90, maxPct: 1.00, desc: 'Maximum effort, sprint' },
    ]

    const zoneResults = zones.map(zone => {
      let minHR: number, maxHR2: number
      if (rhr) {
        // Karvonen formula: HR = ((maxHR - restingHR) * %) + restingHR
        minHR = Math.round((maxHR - rhr) * zone.minPct + rhr)
        maxHR2 = Math.round((maxHR - rhr) * zone.maxPct + rhr)
      } else {
        minHR = Math.round(maxHR * zone.minPct)
        maxHR2 = Math.round(maxHR * zone.maxPct)
      }
      return { ...zone, minHR, maxHR: maxHR2 }
    })

    return { maxHR, zones: zoneResults, method: rhr ? 'Karvonen' : 'Percentage' }
  }, [calculated, age, restingHR])

  const calculate = () => {
    if (age <= 0) {
      toast.error('Please enter a valid age')
      return
    }
    setCalculated(true)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Heart className="h-5 w-5" /> Heart Rate Zones
        </CardTitle>
        <CardDescription>Calculate training zones based on your age and resting heart rate</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="hr-age">Age</Label>
            <Input id="hr-age" type="number" value={age} onChange={e => setAge(Number(e.target.value))} min={1} max={120} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="hr-resting">Resting Heart Rate (optional)</Label>
            <Input
              id="hr-resting"
              type="number"
              value={restingHR}
              onChange={e => setRestingHR(e.target.value ? Number(e.target.value) : '')}
              placeholder="e.g., 60"
              min={30}
              max={120}
            />
          </div>
        </div>

        <Button onClick={calculate} className="w-full">
          <Activity className="h-4 w-4 mr-2" /> Calculate Zones
        </Button>

        {results && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-muted p-3 rounded-lg text-center">
                <div className="text-2xl font-bold">{results.maxHR}</div>
                <div className="text-xs text-muted-foreground">Max Heart Rate (bpm)</div>
              </div>
              <div className="bg-muted p-3 rounded-lg text-center">
                <div className="text-2xl font-bold">{results.method}</div>
                <div className="text-xs text-muted-foreground">Calculation Method</div>
              </div>
            </div>

            <div className="space-y-3">
              {results.zones.map((zone, i) => (
                <div key={zone.name} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`font-bold ${ZONE_TEXT_COLORS[i]}`}>{zone.name}</span>
                      <Badge variant="outline">{zone.label}</Badge>
                    </div>
                    <span className={`font-bold ${ZONE_TEXT_COLORS[i]}`}>{zone.minHR} - {zone.maxHR} bpm</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-4 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${ZONE_COLORS[i]} transition-all`}
                      style={{ width: `${(zone.maxPct - zone.minPct) * 100 + 10}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">{zone.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ==================== SleepCalculator ====================
function formatTime(hours: number, minutes: number): string {
  const period = hours >= 12 ? 'PM' : 'AM'
  const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours
  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`
}

function addMinutes(h: number, m: number, minutesToAdd: number): { h: number; m: number } {
  let totalMinutes = h * 60 + m + minutesToAdd
  while (totalMinutes < 0) totalMinutes += 1440
  totalMinutes = totalMinutes % 1440
  return { h: Math.floor(totalMinutes / 60), m: totalMinutes % 60 }
}

export function SleepCalculator() {
  const [mode, setMode] = useState<'wake' | 'bed'>('wake')
  const [hour, setHour] = useState(7)
  const [minute, setMinute] = useState(0)
  const [calculated, setCalculated] = useState(false)

  const results = useMemo(() => {
    if (!calculated) return null

    const fallAsleepMinutes = 15
    const cycleMinutes = 90

    const options = []

    if (mode === 'wake') {
      // Calculate bedtimes based on wake time
      for (let cycles = 6; cycles >= 4; cycles--) {
        const totalMinutesBack = cycles * cycleMinutes + fallAsleepMinutes
        const bedtime = addMinutes(hour, minute, -totalMinutesBack)
        const sleepHours = (cycles * cycleMinutes) / 60
        options.push({
          cycles,
          time: bedtime,
          sleepDuration: sleepHours,
          label: `${cycles} cycles`,
        })
      }
    } else {
      // Calculate wake times based on bedtime
      for (let cycles = 4; cycles <= 6; cycles++) {
        const totalMinutesForward = cycles * cycleMinutes + fallAsleepMinutes
        const wakeTime = addMinutes(hour, minute, totalMinutesForward)
        const sleepHours = (cycles * cycleMinutes) / 60
        options.push({
          cycles,
          time: wakeTime,
          sleepDuration: sleepHours,
          label: `${cycles} cycles`,
        })
      }
    }

    return options
  }, [calculated, mode, hour, minute])

  const calculate = () => {
    setCalculated(true)
  }

  const timeDisplay = formatTime(hour, minute)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Moon className="h-5 w-5" /> Sleep Calculator
        </CardTitle>
        <CardDescription>Find optimal sleep times based on 90-minute sleep cycles</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Mode</Label>
          <div className="flex gap-2">
            <Button
              variant={mode === 'wake' ? 'default' : 'outline'}
              onClick={() => { setMode('wake'); setCalculated(false) }}
              className="flex-1"
            >
              I want to wake up at...
            </Button>
            <Button
              variant={mode === 'bed' ? 'default' : 'outline'}
              onClick={() => { setMode('bed'); setCalculated(false) }}
              className="flex-1"
            >
              I&apos;m going to bed at...
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <Label>{mode === 'wake' ? 'Wake-up Time' : 'Bedtime'}</Label>
          <div className="flex gap-2 items-center">
            <Select value={hour.toString()} onValueChange={v => setHour(Number(v))}>
              <SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
              <SelectContent>
                {Array.from({ length: 24 }, (_, i) => i).map(h => (
                  <SelectItem key={h} value={h.toString()}>
                    {h.toString().padStart(2, '0')}:00
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="text-lg font-bold">:</span>
            <Select value={minute.toString()} onValueChange={v => setMinute(Number(v))}>
              <SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
              <SelectContent>
                {[0, 15, 30, 45].map(m => (
                  <SelectItem key={m} value={m.toString()}>
                    {m.toString().padStart(2, '0')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="text-sm text-muted-foreground ml-2">{timeDisplay}</span>
          </div>
        </div>

        <Button onClick={calculate} className="w-full">
          <Moon className="h-4 w-4 mr-2" /> Calculate
        </Button>

        {results && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              {mode === 'wake'
                ? 'Try going to bed at one of these times:'
                : 'Try waking up at one of these times:'}
            </p>

            <div className="grid gap-2">
              {results.map((option, i) => {
                const isRecommended = i === (mode === 'wake' ? 1 : 1)
                return (
                  <div
                    key={i}
                    className={`p-4 rounded-lg border-2 ${
                      isRecommended ? 'border-primary bg-primary/5' : 'border-border bg-muted/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-2xl font-bold">{formatTime(option.time.h, option.time.m)}</span>
                          {isRecommended && <Badge>Recommended</Badge>}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {option.cycles} sleep cycles · {option.sleepDuration}h of sleep
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold">{option.sleepDuration}h</div>
                        <div className="text-xs text-muted-foreground">{option.label}</div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            <p className="text-xs text-muted-foreground text-center">
              Based on 90-minute sleep cycles + 15 minutes to fall asleep
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ==================== BodyFatCalc ====================
const BF_CATEGORIES_MALE = [
  { label: 'Essential', min: 2, max: 5, color: 'bg-red-400' },
  { label: 'Athletes', min: 6, max: 13, color: 'bg-orange-400' },
  { label: 'Fitness', min: 14, max: 17, color: 'bg-yellow-400' },
  { label: 'Average', min: 18, max: 24, color: 'bg-green-400' },
  { label: 'Obese', min: 25, max: 50, color: 'bg-red-600' },
]

const BF_CATEGORIES_FEMALE = [
  { label: 'Essential', min: 10, max: 13, color: 'bg-red-400' },
  { label: 'Athletes', min: 14, max: 20, color: 'bg-orange-400' },
  { label: 'Fitness', min: 21, max: 24, color: 'bg-yellow-400' },
  { label: 'Average', min: 25, max: 31, color: 'bg-green-400' },
  { label: 'Obese', min: 32, max: 60, color: 'bg-red-600' },
]

export function BodyFatCalc() {
  const [gender, setGender] = useState<'male' | 'female'>('male')
  const [unit, setUnit] = useState<'cm' | 'in'>('cm')
  const [waist, setWaist] = useState(0)
  const [neck, setNeck] = useState(0)
  const [hip, setHip] = useState(0)
  const [height, setHeight] = useState(175)
  const [calculated, setCalculated] = useState(false)

  const results = useMemo(() => {
    if (!calculated) return null

    // Convert to cm if inches
    const waistCm = unit === 'in' ? waist * 2.54 : waist
    const neckCm = unit === 'in' ? neck * 2.54 : neck
    const hipCm = unit === 'in' ? hip * 2.54 : hip
    const heightCm = unit === 'in' ? height * 2.54 : height

    if (waistCm <= 0 || neckCm <= 0 || heightCm <= 0 || (gender === 'female' && hipCm <= 0)) {
      return null
    }

    // US Navy Method
    let bodyFat: number
    if (gender === 'male') {
      bodyFat = 495 / (1.0324 - 0.19077 * Math.log10(waistCm - neckCm) + 0.15456 * Math.log10(heightCm)) - 450
    } else {
      bodyFat = 495 / (1.29579 - 0.35004 * Math.log10(waistCm + hipCm - neckCm) + 0.22100 * Math.log10(heightCm)) - 450
    }

    bodyFat = Math.max(2, Math.min(60, bodyFat))

    const categories = gender === 'male' ? BF_CATEGORIES_MALE : BF_CATEGORIES_FEMALE
    const category = categories.find(c => bodyFat >= c.min && bodyFat <= c.max) || categories[categories.length - 1]

    return { bodyFat: Math.round(bodyFat * 10) / 10, category, categories }
  }, [calculated, gender, unit, waist, neck, hip, height])

  const calculate = () => {
    if (waist <= 0 || neck <= 0 || height <= 0 || (gender === 'female' && hip <= 0)) {
      toast.error('Please fill in all required measurements')
      return
    }
    setCalculated(true)
  }

  const categories = gender === 'male' ? BF_CATEGORIES_MALE : BF_CATEGORIES_FEMALE

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Ruler className="h-5 w-5" /> Body Fat Calculator
        </CardTitle>
        <CardDescription>Estimate body fat percentage using the US Navy method</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Gender</Label>
          <div className="flex gap-2">
            <Button variant={gender === 'male' ? 'default' : 'outline'} onClick={() => { setGender('male'); setCalculated(false) }} className="flex-1">Male</Button>
            <Button variant={gender === 'female' ? 'default' : 'outline'} onClick={() => { setGender('female'); setCalculated(false) }} className="flex-1">Female</Button>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <Label>Unit</Label>
          <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => { setUnit(unit === 'cm' ? 'in' : 'cm'); setCalculated(false) }}>
            {unit === 'cm' ? 'cm → inches' : 'inches → cm'}
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="bf-waist">Waist ({unit})</Label>
            <Input id="bf-waist" type="number" value={waist || ''} onChange={e => { setWaist(Number(e.target.value)); setCalculated(false) }} placeholder="e.g., 85" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bf-neck">Neck ({unit})</Label>
            <Input id="bf-neck" type="number" value={neck || ''} onChange={e => { setNeck(Number(e.target.value)); setCalculated(false) }} placeholder="e.g., 38" />
          </div>
          {gender === 'female' && (
            <div className="space-y-2">
              <Label htmlFor="bf-hip">Hip ({unit})</Label>
              <Input id="bf-hip" type="number" value={hip || ''} onChange={e => { setHip(Number(e.target.value)); setCalculated(false) }} placeholder="e.g., 95" />
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="bf-height">Height ({unit})</Label>
            <Input id="bf-height" type="number" value={height || ''} onChange={e => { setHeight(Number(e.target.value)); setCalculated(false) }} placeholder="e.g., 175" />
          </div>
        </div>

        <Button onClick={calculate} className="w-full">
          <Calculator className="h-4 w-4 mr-2" /> Calculate Body Fat
        </Button>

        {results && (
          <div className="space-y-4">
            <div className="bg-muted p-4 rounded-lg text-center">
              <div className="text-4xl font-bold">{results.bodyFat}%</div>
              <Badge variant="outline" className="mt-2">{results.category.label}</Badge>
            </div>

            {/* Visual scale */}
            <div className="space-y-2">
              <Label className="font-medium">Body Fat Scale ({gender === 'male' ? 'Male' : 'Female'})</Label>
              <div className="space-y-1">
                {categories.map(cat => {
                  const range = cat.max - cat.min
                  const isCurrent = results.bodyFat >= cat.min && results.bodyFat <= cat.max
                  return (
                    <div key={cat.label} className="flex items-center gap-2">
                      <div
                        className={`h-6 rounded ${cat.color} ${isCurrent ? 'ring-2 ring-primary' : 'opacity-60'}`}
                        style={{ width: `${(range / (gender === 'male' ? 48 : 50)) * 100}%`, minWidth: '60px' }}
                      />
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-medium ${isCurrent ? 'text-foreground' : 'text-muted-foreground'}`}>
                          {cat.label}
                        </span>
                        <span className="text-xs text-muted-foreground">({cat.min}-{cat.max}%)</span>
                        {isCurrent && <ArrowRight className="h-3 w-3 text-primary" />}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
