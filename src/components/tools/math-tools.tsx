'use client'

import React, { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import {
  Calculator as CalcIcon, Percent, Receipt, Landmark, Heart,
  TrendingUp, Tag, Shapes, Delete, ArrowLeft, History,
  Pi, Superscript, RotateCcw
} from 'lucide-react'

// ==================== 1. Calculator ====================
// Custom recursive descent math expression parser (no eval)
function parseMathExpression(input: string): number | null {
  try {
    // Preprocess: replace display symbols with parseable equivalents
    let expr = input
      .replace(/×/g, '*')
      .replace(/÷/g, '/')
      .replace(/π/g, `(${Math.PI})`)
      .replace(/−/g, '-')
    // Tokenize
    const tokens = tokenize(expr)
    if (tokens.length === 0) return null
    const parser = new ExprParser(tokens)
    const result = parser.parseExpression()
    if (parser.pos < tokens.length) return null // leftover tokens
    if (typeof result === 'number' && isFinite(result)) return result
    return null
  } catch {
    return null
  }
}

type Token = { type: 'num' | 'op' | 'lparen' | 'rparen' | 'fn'; value: string }

function tokenize(expr: string): Token[] {
  const tokens: Token[] = []
  let i = 0
  const fns = ['sin', 'cos', 'tan', 'log', 'ln', 'sqrt']
  while (i < expr.length) {
    if (expr[i] === ' ' || expr[i] === '\t') { i++; continue }
    if (expr[i] === '(') { tokens.push({ type: 'lparen', value: '(' }); i++; continue }
    if (expr[i] === ')') { tokens.push({ type: 'rparen', value: ')' }); i++; continue }
    if ('+-'.includes(expr[i])) { tokens.push({ type: 'op', value: expr[i] }); i++; continue }
    if ('*/'.includes(expr[i])) {
      if (expr[i] === '*' && expr[i + 1] === '*') {
        tokens.push({ type: 'op', value: '**' }); i += 2
      } else {
        tokens.push({ type: 'op', value: expr[i] }); i++
      }
      continue
    }
    if (expr[i] === '^') { tokens.push({ type: 'op', value: '**' }); i++; continue }
    if (/[0-9.]/.test(expr[i])) {
      let num = ''
      while (i < expr.length && /[0-9.]/.test(expr[i])) { num += expr[i]; i++ }
      tokens.push({ type: 'num', value: num }); continue
    }
    // Check for function names
    let matched = false
    for (const fn of fns) {
      if (expr.substring(i, i + fn.length) === fn) {
        tokens.push({ type: 'fn', value: fn }); i += fn.length; matched = true; break
      }
    }
    if (matched) continue
    // Check for standalone 'e' (Euler's number)
    if (expr[i] === 'e') {
      tokens.push({ type: 'num', value: Math.E.toString() }); i++; continue
    }
    i++ // skip unknown
  }
  return tokens
}

class ExprParser {
  pos = 0
  constructor(private tokens: Token[]) {}

  private peek(): Token | undefined { return this.tokens[this.pos] }
  private consume(): Token { return this.tokens[this.pos++] }

  parseExpression(): number {
    let left = this.parseTerm()
    while (this.peek()?.type === 'op' && (this.peek()!.value === '+' || this.peek()!.value === '-')) {
      const op = this.consume().value
      const right = this.parseTerm()
      left = op === '+' ? left + right : left - right
    }
    return left
  }

  private parseTerm(): number {
    let left = this.parsePower()
    while (this.peek()?.type === 'op' && (this.peek()!.value === '*' || this.peek()!.value === '/')) {
      const op = this.consume().value
      const right = this.parsePower()
      left = op === '*' ? left * right : left / right
    }
    return left
  }

  private parsePower(): number {
    let base = this.parseUnary()
    while (this.peek()?.type === 'op' && this.peek()!.value === '**') {
      this.consume()
      const exp = this.parseUnary()
      base = Math.pow(base, exp)
    }
    return base
  }

  private parseUnary(): number {
    if (this.peek()?.type === 'op' && this.peek()!.value === '-') {
      this.consume()
      return -this.parseUnary()
    }
    if (this.peek()?.type === 'op' && this.peek()!.value === '+') {
      this.consume()
      return this.parseUnary()
    }
    return this.parseCall()
  }

  private parseCall(): number {
    if (this.peek()?.type === 'fn') {
      const fn = this.consume().value
      if (this.peek()?.type !== 'lparen') throw new Error('Expected ( after function')
      this.consume() // consume '('
      const arg = this.parseExpression()
      if (this.peek()?.type !== 'rparen') throw new Error('Expected ) after function arg')
      this.consume() // consume ')'
      switch (fn) {
        case 'sin': return Math.sin(arg)
        case 'cos': return Math.cos(arg)
        case 'tan': return Math.tan(arg)
        case 'log': return Math.log10(arg)
        case 'ln': return Math.log(arg)
        case 'sqrt': return Math.sqrt(arg)
        default: throw new Error('Unknown function: ' + fn)
      }
    }
    return this.parsePrimary()
  }

  private parsePrimary(): number {
    const token = this.peek()
    if (!token) throw new Error('Unexpected end of expression')
    if (token.type === 'num') {
      this.consume()
      return parseFloat(token.value)
    }
    if (token.type === 'lparen') {
      this.consume()
      const result = this.parseExpression()
      if (this.peek()?.type !== 'rparen') throw new Error('Expected )')
      this.consume()
      return result
    }
    throw new Error('Unexpected token: ' + token.value)
  }
}

export function Calculator() {
  const [display, setDisplay] = useState('0')
  const [expression, setExpression] = useState('')
  const [history, setHistory] = useState<string[]>([])
  const [showHistory, setShowHistory] = useState(false)
  const [isNewNumber, setIsNewNumber] = useState(true)

  const handleNumber = (num: string) => {
    if (isNewNumber) {
      setDisplay(num === '.' ? '0.' : num)
      setIsNewNumber(false)
    } else {
      if (num === '.' && display.includes('.')) return
      setDisplay(prev => prev === '0' && num !== '.' ? num : prev + num)
    }
  }

  const handleOperator = (op: string) => {
    setExpression(prev => {
      const current = display
      if (prev && !isNewNumber) {
        return prev + ' ' + current + ' ' + op
      } else if (prev) {
        return prev.slice(0, -1) + op
      }
      return current + ' ' + op
    })
    setIsNewNumber(true)
  }

  const handleScientific = (fn: string) => {
    const current = parseFloat(display)
    let result: number | null = null
    let exprStr = ''

    switch (fn) {
      case 'sin':
        result = Math.sin(current)
        exprStr = `sin(${display})`
        break
      case 'cos':
        result = Math.cos(current)
        exprStr = `cos(${display})`
        break
      case 'tan':
        result = Math.tan(current)
        exprStr = `tan(${display})`
        break
      case 'log':
        result = Math.log10(current)
        exprStr = `log(${display})`
        break
      case 'ln':
        result = Math.log(current)
        exprStr = `ln(${display})`
        break
      case 'sqrt':
        result = Math.sqrt(current)
        exprStr = `sqrt(${display})`
        break
      case 'pow':
        setExpression(prev => prev ? prev + ' ' + display + ' ^' : display + ' ^')
        setIsNewNumber(true)
        return
      case 'pi':
        setDisplay(Math.PI.toString())
        setIsNewNumber(true)
        return
      case 'e':
        setDisplay(Math.E.toString())
        setIsNewNumber(true)
        return
    }

    if (result !== null && isFinite(result)) {
      const rounded = parseFloat(result.toPrecision(12))
      setDisplay(rounded.toString())
      setIsNewNumber(true)
      setHistory(prev => [`${exprStr} = ${rounded}`, ...prev].slice(0, 10))
    } else {
      setDisplay('Error')
      setIsNewNumber(true)
    }
  }

  const handleParenthesis = (p: string) => {
    if (isNewNumber && p === '(') {
      setExpression(prev => prev + ' (')
      setIsNewNumber(true)
    } else if (p === ')') {
      setExpression(prev => prev + ' ' + display + ' )')
      setIsNewNumber(true)
    }
  }

  const handleEquals = () => {
    const fullExpr = expression ? expression + ' ' + display : display
    const result = parseMathExpression(fullExpr)
    if (result !== null) {
      const rounded = parseFloat(result.toPrecision(12))
      setHistory(prev => [`${fullExpr} = ${rounded}`, ...prev].slice(0, 10))
      setDisplay(rounded.toString())
      setExpression('')
      setIsNewNumber(true)
    } else {
      setDisplay('Error')
      setExpression('')
      setIsNewNumber(true)
    }
  }

  const handleClear = () => {
    setDisplay('0')
    setExpression('')
    setIsNewNumber(true)
  }

  const handleBackspace = () => {
    if (display.length > 1) {
      setDisplay(prev => prev.slice(0, -1))
    } else {
      setDisplay('0')
      setIsNewNumber(true)
    }
  }

  const handleNegate = () => {
    if (display !== '0') {
      setDisplay(prev => prev.startsWith('-') ? prev.slice(1) : '-' + prev)
    }
  }

  const btnBase = 'h-12 font-semibold transition-colors'
  const numBtn = `${btnBase} bg-background hover:bg-muted border border-border`
  const opBtn = `${btnBase} bg-primary/10 hover:bg-primary/20 text-primary`
  const sciBtn = `${btnBase} text-xs bg-muted/50 hover:bg-muted`
  const eqBtn = `${btnBase} bg-primary text-primary-foreground hover:bg-primary/90`

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalcIcon className="h-5 w-5" /> Scientific Calculator
        </CardTitle>
        <CardDescription>Perform calculations with scientific functions</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Display */}
        <div className="bg-muted/50 rounded-lg p-4 space-y-1">
          <div className="text-sm text-muted-foreground text-right min-h-[20px] truncate">
            {expression || '\u00A0'}
          </div>
          <div className="text-3xl font-bold text-right truncate">
            {display}
          </div>
        </div>

        {/* Scientific Functions Row */}
        <div className="grid grid-cols-5 gap-1.5">
          {['sin', 'cos', 'tan', 'log', 'ln'].map(fn => (
            <Button key={fn} variant="ghost" size="sm" className={sciBtn} onClick={() => handleScientific(fn)}>
              {fn}
            </Button>
          ))}
        </div>
        <div className="grid grid-cols-5 gap-1.5">
          <Button variant="ghost" size="sm" className={sciBtn} onClick={() => handleScientific('sqrt')}>√</Button>
          <Button variant="ghost" size="sm" className={sciBtn} onClick={() => handleScientific('pow')}>x^y</Button>
          <Button variant="ghost" size="sm" className={sciBtn} onClick={() => handleScientific('pi')}>π</Button>
          <Button variant="ghost" size="sm" className={sciBtn} onClick={() => handleScientific('e')}>e</Button>
          <Button variant="ghost" size="sm" className={sciBtn} onClick={() => handleParenthesis('(')}>(</Button>
        </div>

        {/* Main Buttons */}
        <div className="grid grid-cols-4 gap-1.5">
          <Button variant="ghost" className={opBtn} onClick={handleClear}>C</Button>
          <Button variant="ghost" className={opBtn} onClick={handleBackspace}><Delete className="h-4 w-4" /></Button>
          <Button variant="ghost" className={opBtn} onClick={() => handleParenthesis(')')}>)</Button>
          <Button variant="ghost" className={opBtn} onClick={() => handleOperator('÷')}>÷</Button>

          {[7, 8, 9].map(n => (
            <Button key={n} variant="ghost" className={numBtn} onClick={() => handleNumber(n.toString())}>{n}</Button>
          ))}
          <Button variant="ghost" className={opBtn} onClick={() => handleOperator('×')}>×</Button>

          {[4, 5, 6].map(n => (
            <Button key={n} variant="ghost" className={numBtn} onClick={() => handleNumber(n.toString())}>{n}</Button>
          ))}
          <Button variant="ghost" className={opBtn} onClick={() => handleOperator('-')}>−</Button>

          {[1, 2, 3].map(n => (
            <Button key={n} variant="ghost" className={numBtn} onClick={() => handleNumber(n.toString())}>{n}</Button>
          ))}
          <Button variant="ghost" className={opBtn} onClick={() => handleOperator('+')}>+</Button>

          <Button variant="ghost" className={opBtn} onClick={handleNegate}>±</Button>
          <Button variant="ghost" className={numBtn} onClick={() => handleNumber('0')}>0</Button>
          <Button variant="ghost" className={numBtn} onClick={() => handleNumber('.')}>.</Button>
          <Button variant="ghost" className={eqBtn} onClick={handleEquals}>=</Button>
        </div>

        {/* History Toggle */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowHistory(!showHistory)}
            className="text-muted-foreground"
          >
            <History className="h-4 w-4 mr-1" /> {showHistory ? 'Hide' : 'Show'} History
          </Button>
          {history.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setHistory([])}
              className="text-muted-foreground"
            >
              <RotateCcw className="h-3 w-3 mr-1" /> Clear
            </Button>
          )}
        </div>

        {showHistory && (
          <div className="max-h-48 overflow-y-auto rounded-lg border bg-muted/30 p-2 space-y-1">
            {history.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-2">No history yet</p>
            ) : (
              history.map((entry, i) => (
                <div key={i} className="text-sm font-mono py-1 px-2 rounded hover:bg-muted/50 truncate">
                  {entry}
                </div>
              ))
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ==================== 2. PercentageCalc ====================
export function PercentageCalc() {
  const [mode, setMode] = useState<'of' | 'is' | 'change'>('of')
  const [x, setX] = useState('')
  const [y, setY] = useState('')

  const xNum = parseFloat(x) || 0
  const yNum = parseFloat(y) || 0

  const result = useMemo(() => {
    switch (mode) {
      case 'of':
        return (xNum / 100) * yNum
      case 'is':
        return yNum !== 0 ? (xNum / yNum) * 100 : 0
      case 'change':
        return xNum !== 0 ? ((yNum - xNum) / Math.abs(xNum)) * 100 : 0
      default:
        return 0
    }
  }, [mode, xNum, yNum])

  const modeDescriptions: Record<string, { label: string; xLabel: string; yLabel: string; resultLabel: string }> = {
    of: { label: 'What is X% of Y?', xLabel: 'Percentage (X)', yLabel: 'Number (Y)', resultLabel: 'Result' },
    is: { label: 'X is what % of Y?', xLabel: 'Number (X)', yLabel: 'Total (Y)', resultLabel: 'Percentage' },
    change: { label: 'Percentage change from X to Y', xLabel: 'From (X)', yLabel: 'To (Y)', resultLabel: 'Change' },
  }

  const desc = modeDescriptions[mode]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Percent className="h-5 w-5" /> Percentage Calculator
        </CardTitle>
        <CardDescription>Calculate percentages in different ways</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs value={mode} onValueChange={v => setMode(v as 'of' | 'is' | 'change')}>
          <TabsList className="w-full">
            <TabsTrigger value="of" className="flex-1 text-xs sm:text-sm">X% of Y</TabsTrigger>
            <TabsTrigger value="is" className="flex-1 text-xs sm:text-sm">X is ?% of Y</TabsTrigger>
            <TabsTrigger value="change" className="flex-1 text-xs sm:text-sm">% Change</TabsTrigger>
          </TabsList>

          <TabsContent value={mode} className="space-y-4 mt-4">
            <div className="bg-muted/50 rounded-lg p-3 text-sm font-medium text-center">
              {desc.label}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="pct-x">{desc.xLabel}</Label>
                <Input
                  id="pct-x"
                  type="number"
                  value={x}
                  onChange={e => setX(e.target.value)}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pct-y">{desc.yLabel}</Label>
                <Input
                  id="pct-y"
                  type="number"
                  value={y}
                  onChange={e => setY(e.target.value)}
                  placeholder="0"
                />
              </div>
            </div>
            <div className="bg-muted p-4 rounded-lg text-center">
              <div className="text-sm text-muted-foreground mb-1">{desc.resultLabel}</div>
              <div className="text-3xl font-bold">
                {mode === 'is' || mode === 'change'
                  ? result.toLocaleString(undefined, { maximumFractionDigits: 4 }) + '%'
                  : result.toLocaleString(undefined, { maximumFractionDigits: 4 })}
              </div>
              {mode === 'change' && xNum !== 0 && (
                <Badge variant={result >= 0 ? 'default' : 'destructive'} className="mt-2">
                  {result >= 0 ? 'Increase' : 'Decrease'}
                </Badge>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

// ==================== 3. TipCalculator ====================
export function TipCalculator() {
  const [billAmount, setBillAmount] = useState('')
  const [tipPercent, setTipPercent] = useState(18)
  const [people, setPeople] = useState(1)

  const bill = parseFloat(billAmount) || 0
  const tipAmount = bill * (tipPercent / 100)
  const totalWithTip = bill + tipAmount
  const perPerson = people > 0 ? totalWithTip / people : totalWithTip

  const presetTips = [10, 15, 18, 20, 25]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Receipt className="h-5 w-5" /> Tip Calculator
        </CardTitle>
        <CardDescription>Calculate tips and split the bill</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="tip-bill">Bill Amount ($)</Label>
          <Input
            id="tip-bill"
            type="number"
            value={billAmount}
            onChange={e => setBillAmount(e.target.value)}
            placeholder="0.00"
            min="0"
            step="0.01"
          />
        </div>

        <div className="space-y-3">
          <Label>Tip: {tipPercent}%</Label>
          <Slider
            value={[tipPercent]}
            onValueChange={v => setTipPercent(v[0])}
            min={5}
            max={50}
            step={1}
          />
          <div className="flex gap-2 flex-wrap">
            {presetTips.map(pct => (
              <Button
                key={pct}
                variant={tipPercent === pct ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTipPercent(pct)}
              >
                {pct}%
              </Button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="tip-people">Number of People</Label>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="icon" onClick={() => setPeople(Math.max(1, people - 1))}>−</Button>
            <span className="text-lg font-bold w-8 text-center">{people}</span>
            <Button variant="outline" size="icon" onClick={() => setPeople(Math.min(20, people + 1))}>+</Button>
          </div>
        </div>

        {/* Visual Breakdown */}
        <div className="bg-muted/50 rounded-lg p-4 space-y-3">
          <div className="text-center text-sm font-medium text-muted-foreground mb-2">Bill Breakdown</div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Subtotal</span>
              <span className="font-medium">${bill.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Tip ({tipPercent}%)</span>
              <span className="font-medium text-green-600 dark:text-green-400">${tipAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            <div className="border-t pt-2 flex justify-between font-bold text-lg">
              <span>Total</span>
              <span>${totalWithTip.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            {people > 1 && (
              <div className="border-t pt-2 flex justify-between text-sm">
                <span>Per Person</span>
                <span className="font-bold text-primary">${perPerson.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
            )}
          </div>
        </div>

        {/* Visual bar */}
        {bill > 0 && (
          <div className="space-y-1">
            <div className="flex h-4 rounded-full overflow-hidden">
              <div
                className="bg-primary transition-all duration-300"
                style={{ width: `${(bill / totalWithTip) * 100}%` }}
              />
              <div
                className="bg-green-500 dark:bg-green-400 transition-all duration-300"
                style={{ width: `${(tipAmount / totalWithTip) * 100}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Bill</span>
              <span>Tip</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ==================== 4. LoanCalculator ====================
export function LoanCalculator() {
  const [loanAmount, setLoanAmount] = useState('250000')
  const [interestRate, setInterestRate] = useState('6.5')
  const [loanTerm, setLoanTerm] = useState('30')
  const [termUnit, setTermUnit] = useState<'years' | 'months'>('years')
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0])

  const principal = parseFloat(loanAmount) || 0
  const annualRate = parseFloat(interestRate) || 0
  const totalMonths = termUnit === 'years'
    ? (parseFloat(loanTerm) || 0) * 12
    : (parseFloat(loanTerm) || 0)

  const monthlyRate = annualRate / 100 / 12

  const monthlyPayment = useMemo(() => {
    if (principal <= 0 || monthlyRate <= 0 || totalMonths <= 0) return 0
    return principal * (monthlyRate * Math.pow(1 + monthlyRate, totalMonths)) / (Math.pow(1 + monthlyRate, totalMonths) - 1)
  }, [principal, monthlyRate, totalMonths])

  const totalPayment = monthlyPayment * totalMonths
  const totalInterest = totalPayment - principal

  const amortizationSchedule = useMemo(() => {
    if (monthlyPayment <= 0) return []
    const schedule = []
    let balance = principal
    const startD = new Date(startDate)
    for (let i = 1; i <= Math.min(totalMonths, 12); i++) {
      const interestPayment = balance * monthlyRate
      const principalPayment = monthlyPayment - interestPayment
      balance -= principalPayment
      if (balance < 0) balance = 0
      const paymentDate = new Date(startD)
      paymentDate.setMonth(paymentDate.getMonth() + i)
      schedule.push({
        month: i,
        date: paymentDate.toLocaleDateString(undefined, { month: 'short', year: 'numeric' }),
        payment: monthlyPayment,
        principal: principalPayment,
        interest: interestPayment,
        balance: balance,
      })
    }
    return schedule
  }, [principal, monthlyRate, monthlyPayment, totalMonths, startDate])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Landmark className="h-5 w-5" /> Loan Calculator
        </CardTitle>
        <CardDescription>Calculate monthly payments and view amortization schedule</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="loan-amount">Loan Amount ($)</Label>
            <Input
              id="loan-amount"
              type="number"
              value={loanAmount}
              onChange={e => setLoanAmount(e.target.value)}
              placeholder="0"
              min="0"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="loan-rate">Annual Interest Rate (%)</Label>
            <Input
              id="loan-rate"
              type="number"
              value={interestRate}
              onChange={e => setInterestRate(e.target.value)}
              placeholder="0"
              min="0"
              step="0.1"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="loan-term">Loan Term</Label>
            <div className="flex gap-2">
              <Input
                id="loan-term"
                type="number"
                value={loanTerm}
                onChange={e => setLoanTerm(e.target.value)}
                placeholder="0"
                min="0"
                className="flex-1"
              />
              <Select value={termUnit} onValueChange={v => setTermUnit(v as 'years' | 'months')}>
                <SelectTrigger className="w-28">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="years">Years</SelectItem>
                  <SelectItem value="months">Months</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="loan-start">Start Date</Label>
            <Input
              id="loan-start"
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
            />
          </div>
        </div>

        {/* Results */}
        {monthlyPayment > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-muted/50 rounded-lg p-3 text-center">
              <div className="text-xs text-muted-foreground mb-1">Monthly Payment</div>
              <div className="text-xl font-bold text-primary">
                ${monthlyPayment.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
            <div className="bg-muted/50 rounded-lg p-3 text-center">
              <div className="text-xs text-muted-foreground mb-1">Total Payment</div>
              <div className="text-xl font-bold">
                ${totalPayment.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
            <div className="bg-muted/50 rounded-lg p-3 text-center">
              <div className="text-xs text-muted-foreground mb-1">Total Interest</div>
              <div className="text-xl font-bold text-destructive">
                ${totalInterest.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
          </div>
        )}

        {/* Amortization Schedule */}
        {amortizationSchedule.length > 0 && (
          <div className="space-y-2">
            <div className="text-sm font-medium">Amortization Schedule (First 12 Months)</div>
            <div className="max-h-72 overflow-y-auto rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">#</TableHead>
                    <TableHead className="text-xs">Date</TableHead>
                    <TableHead className="text-xs text-right">Payment</TableHead>
                    <TableHead className="text-xs text-right">Principal</TableHead>
                    <TableHead className="text-xs text-right">Interest</TableHead>
                    <TableHead className="text-xs text-right">Balance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {amortizationSchedule.map(row => (
                    <TableRow key={row.month}>
                      <TableCell className="text-xs">{row.month}</TableCell>
                      <TableCell className="text-xs">{row.date}</TableCell>
                      <TableCell className="text-xs text-right">${row.payment.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                      <TableCell className="text-xs text-right">${row.principal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                      <TableCell className="text-xs text-right">${row.interest.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                      <TableCell className="text-xs text-right">${row.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ==================== 5. BmiCalculator ====================
export function BmiCalculator() {
  const [unit, setUnit] = useState<'metric' | 'imperial'>('metric')
  const [heightCm, setHeightCm] = useState('')
  const [weightKg, setWeightKg] = useState('')
  const [heightFt, setHeightFt] = useState('')
  const [heightIn, setHeightIn] = useState('')
  const [weightLbs, setWeightLbs] = useState('')

  const bmi = useMemo(() => {
    if (unit === 'metric') {
      const h = parseFloat(heightCm) || 0
      const w = parseFloat(weightKg) || 0
      if (h <= 0 || w <= 0) return null
      const heightM = h / 100
      return w / (heightM * heightM)
    } else {
      const ft = parseFloat(heightFt) || 0
      const inches = parseFloat(heightIn) || 0
      const lbs = parseFloat(weightLbs) || 0
      const totalInches = ft * 12 + inches
      if (totalInches <= 0 || lbs <= 0) return null
      return (lbs / (totalInches * totalInches)) * 703
    }
  }, [unit, heightCm, weightKg, heightFt, heightIn, weightLbs])

  const getCategory = (bmi: number): { label: string; color: string; range: string } => {
    if (bmi < 18.5) return { label: 'Underweight', color: 'text-blue-500', range: '< 18.5' }
    if (bmi < 25) return { label: 'Normal', color: 'text-green-500', range: '18.5 - 24.9' }
    if (bmi < 30) return { label: 'Overweight', color: 'text-yellow-500', range: '25 - 29.9' }
    return { label: 'Obese', color: 'text-red-500', range: '≥ 30' }
  }

  // Gauge position: BMI from 10 to 45 maps to 0-100%
  const gaugePosition = bmi ? Math.min(100, Math.max(0, ((bmi - 10) / 35) * 100)) : 0

  const category = bmi ? getCategory(bmi) : null

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Heart className="h-5 w-5" /> BMI Calculator
        </CardTitle>
        <CardDescription>Calculate your Body Mass Index</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <Label>Unit System</Label>
          <div className="flex items-center gap-2">
            <span className={`text-sm ${unit === 'metric' ? 'font-medium' : 'text-muted-foreground'}`}>Metric</span>
            <Switch
              checked={unit === 'imperial'}
              onCheckedChange={checked => setUnit(checked ? 'imperial' : 'metric')}
            />
            <span className={`text-sm ${unit === 'imperial' ? 'font-medium' : 'text-muted-foreground'}`}>Imperial</span>
          </div>
        </div>

        {unit === 'metric' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="bmi-height-cm">Height (cm)</Label>
              <Input
                id="bmi-height-cm"
                type="number"
                value={heightCm}
                onChange={e => setHeightCm(e.target.value)}
                placeholder="170"
                min="0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bmi-weight-kg">Weight (kg)</Label>
              <Input
                id="bmi-weight-kg"
                type="number"
                value={weightKg}
                onChange={e => setWeightKg(e.target.value)}
                placeholder="70"
                min="0"
              />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="bmi-height-ft">Height (ft)</Label>
              <Input
                id="bmi-height-ft"
                type="number"
                value={heightFt}
                onChange={e => setHeightFt(e.target.value)}
                placeholder="5"
                min="0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bmi-height-in">Height (in)</Label>
              <Input
                id="bmi-height-in"
                type="number"
                value={heightIn}
                onChange={e => setHeightIn(e.target.value)}
                placeholder="10"
                min="0"
                max="11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bmi-weight-lbs">Weight (lbs)</Label>
              <Input
                id="bmi-weight-lbs"
                type="number"
                value={weightLbs}
                onChange={e => setWeightLbs(e.target.value)}
                placeholder="154"
                min="0"
              />
            </div>
          </div>
        )}

        {bmi !== null && category && (
          <>
            <div className="bg-muted/50 rounded-lg p-4 text-center">
              <div className="text-sm text-muted-foreground mb-1">Your BMI</div>
              <div className="text-4xl font-bold">{bmi.toFixed(1)}</div>
              <div className={`text-lg font-semibold mt-1 ${category.color}`}>{category.label}</div>
            </div>

            {/* Visual Gauge */}
            <div className="space-y-2">
              <div className="relative h-6 rounded-full overflow-hidden">
                {/* Background gradient segments */}
                <div className="absolute inset-0 flex">
                  <div className="bg-blue-400 flex-1" />       {/* Underweight: ~14% */}
                  <div className="bg-green-400 flex-1" />      {/* Normal: ~29% */}
                  <div className="bg-yellow-400 flex-1" />     {/* Overweight: ~14% */}
                  <div className="bg-red-400 flex-1" />        {/* Obese: ~43% */}
                </div>
                {/* Pointer */}
                <div
                  className="absolute top-0 h-full w-1 bg-foreground shadow-lg transition-all duration-300"
                  style={{ left: `${gaugePosition}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>10</span>
                <span>18.5</span>
                <span>25</span>
                <span>30</span>
                <span>45</span>
              </div>

              {/* Category Reference */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2">
                {[
                  { label: 'Underweight', range: '< 18.5', color: 'bg-blue-400' },
                  { label: 'Normal', range: '18.5-24.9', color: 'bg-green-400' },
                  { label: 'Overweight', range: '25-29.9', color: 'bg-yellow-400' },
                  { label: 'Obese', range: '≥ 30', color: 'bg-red-400' },
                ].map(cat => (
                  <div key={cat.label} className="flex items-center gap-1.5 text-xs">
                    <div className={`w-3 h-3 rounded-full ${cat.color}`} />
                    <div>
                      <div className="font-medium">{cat.label}</div>
                      <div className="text-muted-foreground">{cat.range}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

// ==================== 6. CompoundInterest ====================
export function CompoundInterest() {
  const [principal, setPrincipal] = useState('10000')
  const [annualRate, setAnnualRate] = useState('7')
  const [frequency, setFrequency] = useState<'1' | '2' | '4' | '12' | '365'>('12')
  const [years, setYears] = useState('10')
  const [monthlyContribution, setMonthlyContribution] = useState('200')

  const P = parseFloat(principal) || 0
  const r = (parseFloat(annualRate) || 0) / 100
  const n = parseInt(frequency)
  const t = parseFloat(years) || 0
  const monthly = parseFloat(monthlyContribution) || 0

  const { finalAmount, totalContributions, totalInterest, yearlyData } = useMemo(() => {
    if (P <= 0 && monthly <= 0) return { finalAmount: 0, totalContributions: 0, totalInterest: 0, yearlyData: [] }
    if (r <= 0 || n <= 0 || t <= 0) return { finalAmount: 0, totalContributions: 0, totalInterest: 0, yearlyData: [] }

    const data: { year: number; balance: number; contributions: number; interest: number }[] = []
    let balance = P
    let totalContrib = P

    for (let year = 1; year <= t; year++) {
      // For each compounding period in this year
      for (let period = 0; period < n; period++) {
        balance = balance * (1 + r / n)
        // Add monthly contributions spread across compounding periods
        if (monthly > 0) {
          const contributionPerPeriod = monthly * 12 / n
          balance += contributionPerPeriod
          totalContrib += contributionPerPeriod
        }
      }
      data.push({
        year,
        balance,
        contributions: totalContrib,
        interest: balance - totalContrib,
      })
    }

    return {
      finalAmount: balance,
      totalContributions: totalContrib,
      totalInterest: balance - totalContrib,
      yearlyData: data,
    }
  }, [P, r, n, t, monthly])

  const freqLabels: Record<string, string> = {
    '1': 'Annually',
    '2': 'Semi-annually',
    '4': 'Quarterly',
    '12': 'Monthly',
    '365': 'Daily',
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" /> Compound Interest
        </CardTitle>
        <CardDescription>Calculate compound interest growth over time</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="ci-principal">Principal Amount ($)</Label>
            <Input
              id="ci-principal"
              type="number"
              value={principal}
              onChange={e => setPrincipal(e.target.value)}
              placeholder="0"
              min="0"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ci-rate">Annual Interest Rate (%)</Label>
            <Input
              id="ci-rate"
              type="number"
              value={annualRate}
              onChange={e => setAnnualRate(e.target.value)}
              placeholder="0"
              min="0"
              step="0.1"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Compounding Frequency</Label>
            <Select value={frequency} onValueChange={v => setFrequency(v as '1' | '2' | '4' | '12' | '365')}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(freqLabels).map(([val, label]) => (
                  <SelectItem key={val} value={val}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="ci-years">Time Period (years)</Label>
            <Input
              id="ci-years"
              type="number"
              value={years}
              onChange={e => setYears(e.target.value)}
              placeholder="0"
              min="0"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="ci-monthly">Monthly Contribution ($)</Label>
          <Input
            id="ci-monthly"
            type="number"
            value={monthlyContribution}
            onChange={e => setMonthlyContribution(e.target.value)}
            placeholder="0"
            min="0"
          />
        </div>

        {finalAmount > 0 && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-muted/50 rounded-lg p-3 text-center">
                <div className="text-xs text-muted-foreground mb-1">Final Amount</div>
                <div className="text-xl font-bold text-primary">
                  ${finalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>
              <div className="bg-muted/50 rounded-lg p-3 text-center">
                <div className="text-xs text-muted-foreground mb-1">Total Contributions</div>
                <div className="text-xl font-bold">
                  ${totalContributions.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>
              <div className="bg-muted/50 rounded-lg p-3 text-center">
                <div className="text-xs text-muted-foreground mb-1">Interest Earned</div>
                <div className="text-xl font-bold text-green-600 dark:text-green-400">
                  ${totalInterest.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>
            </div>

            {/* Growth bar visual */}
            {totalContributions > 0 && (
              <div className="space-y-1">
                <div className="flex h-4 rounded-full overflow-hidden">
                  <div
                    className="bg-primary transition-all duration-300"
                    style={{ width: `${(totalContributions - P) / totalContributions * 100}%` }}
                    title="Monthly contributions"
                  />
                  <div
                    className="bg-muted-foreground/30 transition-all duration-300"
                    style={{ width: `${P / totalContributions * 100}%` }}
                    title="Principal"
                  />
                  <div
                    className="bg-green-500 dark:bg-green-400 transition-all duration-300"
                    style={{ width: `${totalInterest / finalAmount * 100}%` }}
                    title="Interest"
                  />
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Contributions</span>
                  <span>Interest</span>
                </div>
              </div>
            )}

            {/* Year-by-year table */}
            {yearlyData.length > 0 && (
              <div className="space-y-2">
                <div className="text-sm font-medium">Year-by-Year Growth</div>
                <div className="max-h-72 overflow-y-auto rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs">Year</TableHead>
                        <TableHead className="text-xs text-right">Balance</TableHead>
                        <TableHead className="text-xs text-right">Contributions</TableHead>
                        <TableHead className="text-xs text-right">Interest</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {yearlyData.map(row => (
                        <TableRow key={row.year}>
                          <TableCell className="text-xs">{row.year}</TableCell>
                          <TableCell className="text-xs text-right font-medium">${row.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                          <TableCell className="text-xs text-right">${row.contributions.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                          <TableCell className="text-xs text-right text-green-600 dark:text-green-400">${row.interest.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}

// ==================== 7. DiscountCalculator ====================
export function DiscountCalculator() {
  const [mode, setMode] = useState<'percentage' | 'fixed' | 'bogo'>('percentage')
  const [originalPrice, setOriginalPrice] = useState('')
  const [discountValue, setDiscountValue] = useState('')
  const [extraDiscount, setExtraDiscount] = useState('')
  const [buyQty, setBuyQty] = useState('2')
  const [getQty, setGetQty] = useState('1')

  const price = parseFloat(originalPrice) || 0
  const discount = parseFloat(discountValue) || 0
  const extra = parseFloat(extraDiscount) || 0

  const result = useMemo(() => {
    if (price <= 0) return { discountAmount: 0, finalPrice: 0, totalSavings: 0 }

    if (mode === 'percentage') {
      const firstDiscount = price * (discount / 100)
      const afterFirst = price - firstDiscount
      const extraDiscountAmt = afterFirst * (extra / 100)
      const finalPrice = afterFirst - extraDiscountAmt
      return {
        discountAmount: firstDiscount,
        finalPrice,
        totalSavings: price - finalPrice,
      }
    } else if (mode === 'fixed') {
      const firstDiscount = discount
      const afterFirst = Math.max(0, price - firstDiscount)
      const extraDiscountAmt = extra
      const finalPrice = Math.max(0, afterFirst - extraDiscountAmt)
      return {
        discountAmount: firstDiscount,
        finalPrice,
        totalSavings: price - finalPrice,
      }
    } else {
      // Buy X Get Y mode
      const buy = parseInt(buyQty) || 2
      const get = parseInt(getQty) || 1
      const totalItems = buy + get
      const freeItems = get
      const discountAmt = price * freeItems
      const finalPrice = price * buy
      return {
        discountAmount: discountAmt,
        finalPrice,
        totalSavings: discountAmt,
      }
    }
  }, [price, discount, extra, mode, buyQty, getQty])

  const savingsPercent = price > 0 ? (result.totalSavings / price) * 100 : 0

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Tag className="h-5 w-5" /> Discount Calculator
        </CardTitle>
        <CardDescription>Calculate discounts, savings, and sale prices</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs value={mode} onValueChange={v => setMode(v as 'percentage' | 'fixed' | 'bogo')}>
          <TabsList className="w-full">
            <TabsTrigger value="percentage" className="flex-1 text-xs sm:text-sm">% Off</TabsTrigger>
            <TabsTrigger value="fixed" className="flex-1 text-xs sm:text-sm">$ Off</TabsTrigger>
            <TabsTrigger value="bogo" className="flex-1 text-xs sm:text-sm">Buy X Get Y</TabsTrigger>
          </TabsList>

          <TabsContent value={mode} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="disc-price">Original Price ($)</Label>
              <Input
                id="disc-price"
                type="number"
                value={originalPrice}
                onChange={e => setOriginalPrice(e.target.value)}
                placeholder="0.00"
                min="0"
                step="0.01"
              />
            </div>

            {mode !== 'bogo' ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="disc-value">
                    {mode === 'percentage' ? 'Discount (%)' : 'Discount ($)'}
                  </Label>
                  <Input
                    id="disc-value"
                    type="number"
                    value={discountValue}
                    onChange={e => setDiscountValue(e.target.value)}
                    placeholder="0"
                    min="0"
                    step={mode === 'percentage' ? '1' : '0.01'}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="disc-extra">
                    Extra Discount ({mode === 'percentage' ? '%' : '$'})
                    <span className="text-muted-foreground text-xs ml-1">optional</span>
                  </Label>
                  <Input
                    id="disc-extra"
                    type="number"
                    value={extraDiscount}
                    onChange={e => setExtraDiscount(e.target.value)}
                    placeholder="0"
                    min="0"
                    step={mode === 'percentage' ? '1' : '0.01'}
                  />
                </div>
              </>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="disc-buy">Buy</Label>
                  <Input
                    id="disc-buy"
                    type="number"
                    value={buyQty}
                    onChange={e => setBuyQty(e.target.value)}
                    min="1"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="disc-get">Get Free</Label>
                  <Input
                    id="disc-get"
                    type="number"
                    value={getQty}
                    onChange={e => setGetQty(e.target.value)}
                    min="1"
                  />
                </div>
              </div>
            )}

            {price > 0 && result.totalSavings > 0 && (
              <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                {mode === 'bogo' ? (
                  <>
                    <div className="flex justify-between text-sm">
                      <span>Buy {buyQty} + Get {getQty} Free</span>
                      <span className="font-medium">{parseInt(buyQty) + parseInt(getQty)} items</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Free Items Value</span>
                      <span className="font-medium text-green-600 dark:text-green-400">
                        -${result.discountAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex justify-between text-sm">
                      <span>First Discount</span>
                      <span className="font-medium text-green-600 dark:text-green-400">
                        -${result.discountAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                    {extra > 0 && (
                      <div className="flex justify-between text-sm">
                        <span>Extra Discount</span>
                        <span className="font-medium text-green-600 dark:text-green-400">
                          -${(result.totalSavings - result.discountAmount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                    )}
                  </>
                )}
                <div className="border-t pt-2 flex justify-between font-bold text-lg">
                  <span>Final Price</span>
                  <span className="text-primary">${result.finalPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Total Savings</span>
                  <span className="font-semibold text-green-600 dark:text-green-400">
                    ${result.totalSavings.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ({savingsPercent.toFixed(1)}%)
                  </span>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

// ==================== 8. AreaCalculator ====================
type ShapeType = 'rectangle' | 'circle' | 'triangle' | 'trapezoid' | 'ellipse' | 'parallelogram'

interface ShapeInfo {
  label: string
  icon: string
  areaFormula: string
  perimeterFormula: string
}

const SHAPE_INFO: Record<ShapeType, ShapeInfo> = {
  rectangle: { label: 'Rectangle', icon: '▬', areaFormula: 'A = length × width', perimeterFormula: 'P = 2 × (length + width)' },
  circle: { label: 'Circle', icon: '●', areaFormula: 'A = π × r²', perimeterFormula: 'C = 2 × π × r' },
  triangle: { label: 'Triangle', icon: '△', areaFormula: 'A = ½ × base × height', perimeterFormula: 'P = a + b + c' },
  trapezoid: { label: 'Trapezoid', icon: '⏢', areaFormula: 'A = ½ × (a + b) × height', perimeterFormula: 'P = a + b + c + d' },
  ellipse: { label: 'Ellipse', icon: '⬮', areaFormula: 'A = π × a × b', perimeterFormula: 'P ≈ π × (3(a+b) - √((3a+b)(a+3b)))' },
  parallelogram: { label: 'Parallelogram', icon: '▱', areaFormula: 'A = base × height', perimeterFormula: 'P = 2 × (base + side)' },
}

export function AreaCalculator() {
  const [shape, setShape] = useState<ShapeType>('rectangle')
  const [inputs, setInputs] = useState<Record<string, string>>({
    length: '10', width: '5',
  })

  const handleShapeChange = (newShape: ShapeType) => {
    setShape(newShape)
    // Set default inputs for each shape
    const defaults: Record<ShapeType, Record<string, string>> = {
      rectangle: { length: '10', width: '5' },
      circle: { radius: '7' },
      triangle: { base: '10', height: '8', sideA: '10', sideB: '8', sideC: '6' },
      trapezoid: { sideA: '10', sideB: '6', height: '5', sideC: '5', sideD: '5' },
      ellipse: { semiMajor: '8', semiMinor: '5' },
      parallelogram: { base: '10', height: '6', side: '8' },
    }
    setInputs(defaults[newShape])
  }

  const updateInput = (key: string, value: string) => {
    setInputs(prev => ({ ...prev, [key]: value }))
  }

  const getNum = (key: string): number => parseFloat(inputs[key] || '0') || 0

  const { area, perimeter } = useMemo(() => {
    let a = 0
    let p = 0

    switch (shape) {
      case 'rectangle': {
        const l = getNum('length')
        const w = getNum('width')
        a = l * w
        p = 2 * (l + w)
        break
      }
      case 'circle': {
        const r = getNum('radius')
        a = Math.PI * r * r
        p = 2 * Math.PI * r
        break
      }
      case 'triangle': {
        const base = getNum('base')
        const h = getNum('height')
        const sA = getNum('sideA')
        const sB = getNum('sideB')
        const sC = getNum('sideC')
        a = 0.5 * base * h
        p = sA + sB + sC
        break
      }
      case 'trapezoid': {
        const topA = getNum('sideA')
        const topB = getNum('sideB')
        const h = getNum('height')
        const sC = getNum('sideC')
        const sD = getNum('sideD')
        a = 0.5 * (topA + topB) * h
        p = topA + topB + sC + sD
        break
      }
      case 'ellipse': {
        const sa = getNum('semiMajor')
        const sb = getNum('semiMinor')
        a = Math.PI * sa * sb
        // Ramanujan's approximation
        p = Math.PI * (3 * (sa + sb) - Math.sqrt((3 * sa + sb) * (sa + 3 * sb)))
        break
      }
      case 'parallelogram': {
        const base = getNum('base')
        const h = getNum('height')
        const side = getNum('side')
        a = base * h
        p = 2 * (base + side)
        break
      }
    }

    return { area: a, perimeter: p }
  }, [shape, inputs])

  const info = SHAPE_INFO[shape]

  const renderInputs = () => {
    const fieldConfig: Record<ShapeType, { key: string; label: string; unit?: string }[]> = {
      rectangle: [
        { key: 'length', label: 'Length', unit: 'units' },
        { key: 'width', label: 'Width', unit: 'units' },
      ],
      circle: [
        { key: 'radius', label: 'Radius', unit: 'units' },
      ],
      triangle: [
        { key: 'base', label: 'Base', unit: 'units' },
        { key: 'height', label: 'Height', unit: 'units' },
        { key: 'sideA', label: 'Side A', unit: 'units' },
        { key: 'sideB', label: 'Side B', unit: 'units' },
        { key: 'sideC', label: 'Side C', unit: 'units' },
      ],
      trapezoid: [
        { key: 'sideA', label: 'Top Side (a)', unit: 'units' },
        { key: 'sideB', label: 'Bottom Side (b)', unit: 'units' },
        { key: 'height', label: 'Height', unit: 'units' },
        { key: 'sideC', label: 'Left Side (c)', unit: 'units' },
        { key: 'sideD', label: 'Right Side (d)', unit: 'units' },
      ],
      ellipse: [
        { key: 'semiMajor', label: 'Semi-Major Axis (a)', unit: 'units' },
        { key: 'semiMinor', label: 'Semi-Minor Axis (b)', unit: 'units' },
      ],
      parallelogram: [
        { key: 'base', label: 'Base', unit: 'units' },
        { key: 'height', label: 'Height', unit: 'units' },
        { key: 'side', label: 'Side', unit: 'units' },
      ],
    }

    const fields = fieldConfig[shape]
    return (
      <div className={`grid gap-4 ${fields.length <= 2 ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-2 sm:grid-cols-3'}`}>
        {fields.map(field => (
          <div key={field.key} className="space-y-2">
            <Label htmlFor={`area-${field.key}`} className="text-xs">
              {field.label} {field.unit && <span className="text-muted-foreground">({field.unit})</span>}
            </Label>
            <Input
              id={`area-${field.key}`}
              type="number"
              value={inputs[field.key] || ''}
              onChange={e => updateInput(field.key, e.target.value)}
              placeholder="0"
              min="0"
              step="0.1"
            />
          </div>
        ))}
      </div>
    )
  }

  // SVG diagrams for each shape
  const renderDiagram = () => {
    const svgSize = 160
    const cx = svgSize / 2
    const cy = svgSize / 2

    const strokeColor = 'hsl(var(--primary))'
    const fillColor = 'hsl(var(--primary) / 0.1)'

    switch (shape) {
      case 'rectangle': {
        const w = 100
        const h = 60
        return (
          <svg width={svgSize} height={svgSize} viewBox={`0 0 ${svgSize} ${svgSize}`}>
            <rect x={cx - w / 2} y={cy - h / 2} width={w} height={h} fill={fillColor} stroke={strokeColor} strokeWidth={2} rx={2} />
            <text x={cx} y={cy + 4} textAnchor="middle" className="text-[10px] fill-muted-foreground">length</text>
            <text x={cx - w / 2 - 4} y={cy} textAnchor="end" className="text-[10px] fill-muted-foreground" transform={`rotate(-90, ${cx - w / 2 - 4}, ${cy})`}>width</text>
          </svg>
        )
      }
      case 'circle': {
        const r = 50
        return (
          <svg width={svgSize} height={svgSize} viewBox={`0 0 ${svgSize} ${svgSize}`}>
            <circle cx={cx} cy={cy} r={r} fill={fillColor} stroke={strokeColor} strokeWidth={2} />
            <line x1={cx} y1={cy} x2={cx + r} y2={cy} stroke={strokeColor} strokeWidth={1} strokeDasharray="4" />
            <text x={cx + r / 2} y={cy - 5} textAnchor="middle" className="text-[10px] fill-muted-foreground">r</text>
          </svg>
        )
      }
      case 'triangle': {
        return (
          <svg width={svgSize} height={svgSize} viewBox={`0 0 ${svgSize} ${svgSize}`}>
            <polygon points={`${cx},${cy - 45} ${cx - 55},${cy + 40} ${cx + 55},${cy + 40}`} fill={fillColor} stroke={strokeColor} strokeWidth={2} />
            <text x={cx} y={cy + 54} textAnchor="middle" className="text-[10px] fill-muted-foreground">base</text>
            <line x1={cx} y1={cy - 45} x2={cx} y2={cy + 40} stroke={strokeColor} strokeWidth={1} strokeDasharray="4" />
            <text x={cx + 8} y={cy} className="text-[10px] fill-muted-foreground">h</text>
          </svg>
        )
      }
      case 'trapezoid': {
        return (
          <svg width={svgSize} height={svgSize} viewBox={`0 0 ${svgSize} ${svgSize}`}>
            <polygon points={`${cx - 30},${cy - 30} ${cx + 30},${cy - 30} ${cx + 55},${cy + 30} ${cx - 55},${cy + 30}`} fill={fillColor} stroke={strokeColor} strokeWidth={2} />
            <text x={cx} y={cy - 35} textAnchor="middle" className="text-[10px] fill-muted-foreground">a</text>
            <text x={cx} y={cy + 44} textAnchor="middle" className="text-[10px] fill-muted-foreground">b</text>
            <line x1={cx + 55} y1={cy - 30} x2={cx + 55} y2={cy + 30} stroke={strokeColor} strokeWidth={1} strokeDasharray="4" />
            <text x={cx + 62} y={cy} className="text-[10px] fill-muted-foreground">h</text>
          </svg>
        )
      }
      case 'ellipse': {
        return (
          <svg width={svgSize} height={svgSize} viewBox={`0 0 ${svgSize} ${svgSize}`}>
            <ellipse cx={cx} cy={cy} rx={60} ry={35} fill={fillColor} stroke={strokeColor} strokeWidth={2} />
            <line x1={cx} y1={cy} x2={cx + 60} y2={cy} stroke={strokeColor} strokeWidth={1} strokeDasharray="4" />
            <text x={cx + 30} y={cy - 5} textAnchor="middle" className="text-[10px] fill-muted-foreground">a</text>
            <line x1={cx} y1={cy} x2={cx} y2={cy - 35} stroke={strokeColor} strokeWidth={1} strokeDasharray="4" />
            <text x={cx + 8} y={cy - 18} className="text-[10px] fill-muted-foreground">b</text>
          </svg>
        )
      }
      case 'parallelogram': {
        return (
          <svg width={svgSize} height={svgSize} viewBox={`0 0 ${svgSize} ${svgSize}`}>
            <polygon points={`${cx - 40},${cy + 25} ${cx + 40},${cy + 25} ${cx + 55},${cy - 25} ${cx - 25},${cy - 25}`} fill={fillColor} stroke={strokeColor} strokeWidth={2} />
            <text x={cx} y={cy + 40} textAnchor="middle" className="text-[10px] fill-muted-foreground">base</text>
            <line x1={cx + 40} y1={cy - 25} x2={cx + 40} y2={cy + 25} stroke={strokeColor} strokeWidth={1} strokeDasharray="4" />
            <text x={cx + 50} y={cy} className="text-[10px] fill-muted-foreground">h</text>
          </svg>
        )
      }
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shapes className="h-5 w-5" /> Area Calculator
        </CardTitle>
        <CardDescription>Calculate area and perimeter for various shapes</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Shape</Label>
          <Select value={shape} onValueChange={v => handleShapeChange(v as ShapeType)}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(SHAPE_INFO).map(([key, val]) => (
                <SelectItem key={key} value={key}>{val.icon} {val.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Diagram + Formulas */}
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="flex justify-center">
            {renderDiagram()}
          </div>
          <div className="space-y-1 text-sm flex-1">
            <div className="font-medium text-base mb-2">{info.icon} {info.label}</div>
            <div className="bg-muted/50 rounded px-3 py-1.5 font-mono text-xs">{info.areaFormula}</div>
            <div className="bg-muted/50 rounded px-3 py-1.5 font-mono text-xs">{info.perimeterFormula}</div>
          </div>
        </div>

        {/* Input Fields */}
        {renderInputs()}

        {/* Results */}
        {area > 0 && (
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-muted/50 rounded-lg p-3 text-center">
              <div className="text-xs text-muted-foreground mb-1">Area</div>
              <div className="text-xl font-bold text-primary">
                {area.toLocaleString(undefined, { maximumFractionDigits: 4 })}
              </div>
              <div className="text-xs text-muted-foreground">sq. units</div>
            </div>
            <div className="bg-muted/50 rounded-lg p-3 text-center">
              <div className="text-xs text-muted-foreground mb-1">Perimeter</div>
              <div className="text-xl font-bold">
                {perimeter.toLocaleString(undefined, { maximumFractionDigits: 4 })}
              </div>
              <div className="text-xs text-muted-foreground">units</div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
