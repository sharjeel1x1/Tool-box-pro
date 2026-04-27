'use client'

import React, { useState, useMemo, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import {
  Wallet, Target, Receipt, TrendingUp, Coins,
  Plus, Trash2, Copy, ArrowUpRight, ArrowDownRight,
  DollarSign, Percent, Check
} from 'lucide-react'

// ==================== BudgetPlanner ====================
interface BudgetItem {
  id: string
  name: string
  amount: number
}

interface ExpenseCategory {
  id: string
  name: string
  items: BudgetItem[]
  color: string
}

const DEFAULT_CATEGORIES: ExpenseCategory[] = [
  { id: 'housing', name: 'Housing', items: [], color: 'bg-blue-500' },
  { id: 'transportation', name: 'Transportation', items: [], color: 'bg-amber-500' },
  { id: 'food', name: 'Food & Groceries', items: [], color: 'bg-green-500' },
  { id: 'entertainment', name: 'Entertainment', items: [], color: 'bg-purple-500' },
  { id: 'healthcare', name: 'Healthcare', items: [], color: 'bg-red-500' },
  { id: 'savings', name: 'Savings', items: [], color: 'bg-teal-500' },
  { id: 'other', name: 'Other', items: [], color: 'bg-gray-500' },
]

const PIE_COLORS = ['#3b82f6', '#f59e0b', '#22c55e', '#a855f7', '#ef4444', '#14b8a6', '#6b7280', '#ec4899', '#8b5cf6', '#f97316']

export function BudgetPlanner() {
  const [incomes, setIncomes] = useState<BudgetItem[]>([
    { id: '1', name: 'Primary Income', amount: 5000 },
  ])
  const [categories, setCategories] = useState<ExpenseCategory[]>(DEFAULT_CATEGORIES.map(c => ({ ...c })))
  const [newIncomeName, setNewIncomeName] = useState('')
  const [newIncomeAmount, setNewIncomeAmount] = useState(0)
  const [customCatName, setCustomCatName] = useState('')
  const [addingTo, setAddingTo] = useState<string | null>(null)
  const [newExpenseName, setNewExpenseName] = useState('')
  const [newExpenseAmount, setNewExpenseAmount] = useState(0)

  const totalIncome = incomes.reduce((sum, i) => sum + i.amount, 0)
  const totalExpenses = categories.reduce((sum, cat) => sum + cat.items.reduce((s, item) => s + item.amount, 0), 0)
  const remaining = totalIncome - totalExpenses

  const categoryTotals = categories.map(cat => ({
    ...cat,
    total: cat.items.reduce((sum, item) => sum + item.amount, 0),
  })).filter(c => c.total > 0)

  const addIncome = () => {
    if (!newIncomeName.trim() || newIncomeAmount <= 0) return
    setIncomes(prev => [...prev, { id: Date.now().toString(), name: newIncomeName, amount: newIncomeAmount }])
    setNewIncomeName('')
    setNewIncomeAmount(0)
  }

  const removeIncome = (id: string) => {
    setIncomes(prev => prev.filter(i => i.id !== id))
  }

  const addExpense = (catId: string) => {
    if (!newExpenseName.trim() || newExpenseAmount <= 0) return
    setCategories(prev => prev.map(cat =>
      cat.id === catId
        ? { ...cat, items: [...cat.items, { id: Date.now().toString(), name: newExpenseName, amount: newExpenseAmount }] }
        : cat
    ))
    setNewExpenseName('')
    setNewExpenseAmount(0)
    setAddingTo(null)
  }

  const removeExpense = (catId: string, itemId: string) => {
    setCategories(prev => prev.map(cat =>
      cat.id === catId
        ? { ...cat, items: cat.items.filter(i => i.id !== itemId) }
        : cat
    ))
  }

  const addCustomCategory = () => {
    if (!customCatName.trim()) return
    const id = `custom-${Date.now()}`
    const colorClass = `bg-pink-500`
    setCategories(prev => [...prev, { id, name: customCatName, items: [], color: colorClass }])
    setCustomCatName('')
  }

  const removeCategory = (catId: string) => {
    setCategories(prev => prev.filter(c => c.id !== catId))
  }

  const exportSummary = () => {
    let text = '=== BUDGET SUMMARY ===\n\n'
    text += 'INCOME:\n'
    incomes.forEach(i => { text += `  ${i.name}: $${i.amount.toLocaleString()}\n` })
    text += `  Total Income: $${totalIncome.toLocaleString()}\n\n`
    text += 'EXPENSES:\n'
    categories.forEach(cat => {
      const catTotal = cat.items.reduce((s, i) => s + i.amount, 0)
      if (catTotal > 0) {
        text += `  ${cat.name}:\n`
        cat.items.forEach(i => { text += `    ${i.name}: $${i.amount.toLocaleString()}\n` })
        text += `    Subtotal: $${catTotal.toLocaleString()}\n`
      }
    })
    text += `\n  Total Expenses: $${totalExpenses.toLocaleString()}\n\n`
    text += `REMAINING: $${remaining.toLocaleString()}\n`
    navigator.clipboard.writeText(text)
    toast.success('Budget summary copied to clipboard')
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wallet className="h-5 w-5" /> Budget Planner
        </CardTitle>
        <CardDescription>Plan and track your monthly income and expenses</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Income Section */}
        <div className="space-y-3">
          <Label className="text-base font-semibold flex items-center gap-2">
            <ArrowUpRight className="h-4 w-4 text-green-500" /> Income
          </Label>
          {incomes.map(income => (
            <div key={income.id} className="flex items-center gap-2 bg-green-500/10 p-2 rounded-lg">
              <span className="flex-1 text-sm">{income.name}</span>
              <span className="text-sm font-bold">${income.amount.toLocaleString()}</span>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeIncome(income.id)}>
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          ))}
          <div className="flex gap-2">
            <Input placeholder="Income name" value={newIncomeName} onChange={e => setNewIncomeName(e.target.value)} className="flex-1" />
            <Input type="number" placeholder="Amount" value={newIncomeAmount || ''} onChange={e => setNewIncomeAmount(Number(e.target.value))} className="w-28" />
            <Button variant="outline" size="icon" onClick={addIncome}><Plus className="h-4 w-4" /></Button>
          </div>
          <p className="text-sm font-medium">Total Income: <span className="text-green-600">${totalIncome.toLocaleString()}</span></p>
        </div>

        {/* Expenses Section */}
        <div className="space-y-3">
          <Label className="text-base font-semibold flex items-center gap-2">
            <ArrowDownRight className="h-4 w-4 text-red-500" /> Expenses
          </Label>
          {categories.map(cat => {
            const catTotal = cat.items.reduce((s, i) => s + i.amount, 0)
            return (
              <div key={cat.id} className="border rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${cat.color}`} />
                    <span className="text-sm font-medium">{cat.name}</span>
                    {catTotal > 0 && <span className="text-xs text-muted-foreground">(${catTotal.toLocaleString()})</span>}
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setAddingTo(addingTo === cat.id ? null : cat.id)}>
                      <Plus className="h-3 w-3 mr-1" /> Add
                    </Button>
                    {cat.id.startsWith('custom-') && (
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeCategory(cat.id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
                {cat.items.map(item => (
                  <div key={item.id} className="flex items-center gap-2 pl-5 bg-muted/50 p-1.5 rounded">
                    <span className="flex-1 text-sm">{item.name}</span>
                    <span className="text-sm">${item.amount.toLocaleString()}</span>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeExpense(cat.id, item.id)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
                {addingTo === cat.id && (
                  <div className="flex gap-2 pl-5">
                    <Input placeholder="Expense name" value={newExpenseName} onChange={e => setNewExpenseName(e.target.value)} className="flex-1 h-8 text-sm" />
                    <Input type="number" placeholder="$" value={newExpenseAmount || ''} onChange={e => setNewExpenseAmount(Number(e.target.value))} className="w-24 h-8 text-sm" />
                    <Button size="sm" className="h-8" onClick={() => addExpense(cat.id)}>Add</Button>
                  </div>
                )}
              </div>
            )
          })}
          {/* Add custom category */}
          <div className="flex gap-2">
            <Input placeholder="New category name" value={customCatName} onChange={e => setCustomCatName(e.target.value)} className="flex-1" />
            <Button variant="outline" onClick={addCustomCategory}>
              <Plus className="h-4 w-4 mr-1" /> Category
            </Button>
          </div>
          <p className="text-sm font-medium">Total Expenses: <span className="text-red-600">${totalExpenses.toLocaleString()}</span></p>
        </div>

        {/* Summary & Visual */}
        <div className="space-y-3">
          <div className={`p-4 rounded-lg text-center ${remaining >= 0 ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
            <p className="text-sm text-muted-foreground">Remaining</p>
            <p className={`text-3xl font-bold ${remaining >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ${remaining.toLocaleString()}
            </p>
          </div>

          {/* Simple bar chart */}
          {categoryTotals.length > 0 && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">Expense Breakdown</Label>
              <div className="flex h-6 rounded-full overflow-hidden">
                {categoryTotals.map((cat, i) => {
                  const pct = totalExpenses > 0 ? (cat.total / totalExpenses) * 100 : 0
                  return (
                    <div
                      key={cat.id}
                      className={`${cat.color} transition-all`}
                      style={{ width: `${pct}%` }}
                      title={`${cat.name}: $${cat.total.toLocaleString()} (${pct.toFixed(1)}%)`}
                    />
                  )
                })}
              </div>
              <div className="flex flex-wrap gap-3">
                {categoryTotals.map((cat, i) => {
                  const pct = totalExpenses > 0 ? (cat.total / totalExpenses) * 100 : 0
                  return (
                    <div key={cat.id} className="flex items-center gap-1 text-xs">
                      <div className={`w-3 h-3 rounded-full ${cat.color}`} />
                      <span>{cat.name} ({pct.toFixed(0)}%)</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          <Button variant="outline" onClick={exportSummary} className="w-full">
            <Copy className="h-4 w-4 mr-2" /> Export Summary
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// ==================== SavingsGoal ====================
export function SavingsGoal() {
  const [targetAmount, setTargetAmount] = useState(10000)
  const [currentSavings, setCurrentSavings] = useState(1000)
  const [monthlyContribution, setMonthlyContribution] = useState(500)
  const [annualReturn, setAnnualReturn] = useState(5)
  const [calculated, setCalculated] = useState(false)

  const results = useMemo(() => {
    if (!calculated) return null

    const monthlyRate = annualReturn / 100 / 12
    let balance = currentSavings
    let months = 0
    const maxMonths = 50 * 12 // 50 years max

    while (balance < targetAmount && months < maxMonths) {
      balance = balance * (1 + monthlyRate) + monthlyContribution
      months++
    }

    const totalContributions = currentSavings + monthlyContribution * months
    const interestEarned = balance - totalContributions
    const reached = months < maxMonths

    // Suggest higher contribution if not reachable
    let suggestedContribution = monthlyContribution
    if (!reached) {
      suggestedContribution = Math.ceil((targetAmount - currentSavings * Math.pow(1 + monthlyRate, maxMonths)) /
        ((Math.pow(1 + monthlyRate, maxMonths) - 1) / monthlyRate))
      suggestedContribution = Math.max(suggestedContribution, monthlyContribution + 100)
    }

    // Timeline data - yearly snapshots
    const timeline: { year: number; balance: number }[] = []
    let tempBalance = currentSavings
    for (let year = 1; year <= Math.min(Math.ceil(months / 12), 50); year++) {
      for (let m = 0; m < 12; m++) {
        tempBalance = tempBalance * (1 + monthlyRate) + monthlyContribution
      }
      timeline.push({ year, balance: Math.round(tempBalance) })
      if (tempBalance >= targetAmount) break
    }

    return {
      months,
      years: Math.round(months / 12 * 10) / 10,
      totalContributions: Math.round(totalContributions),
      interestEarned: Math.round(interestEarned),
      finalBalance: Math.round(balance),
      reached,
      suggestedContribution,
      progressPct: Math.min((currentSavings / targetAmount) * 100, 100),
      timeline,
    }
  }, [calculated, targetAmount, currentSavings, monthlyContribution, annualReturn])

  const calculate = () => {
    if (targetAmount <= 0 || monthlyContribution <= 0) {
      toast.error('Please enter valid values')
      return
    }
    setCalculated(true)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" /> Savings Goal Calculator
        </CardTitle>
        <CardDescription>Calculate how long to reach your savings target</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="sg-target">Target Amount ($)</Label>
            <Input id="sg-target" type="number" value={targetAmount} onChange={e => setTargetAmount(Number(e.target.value))} min={1} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sg-current">Current Savings ($)</Label>
            <Input id="sg-current" type="number" value={currentSavings} onChange={e => setCurrentSavings(Number(e.target.value))} min={0} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sg-monthly">Monthly Contribution ($)</Label>
            <Input id="sg-monthly" type="number" value={monthlyContribution} onChange={e => setMonthlyContribution(Number(e.target.value))} min={1} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sg-return">Expected Annual Return (%)</Label>
            <Input id="sg-return" type="number" value={annualReturn} onChange={e => setAnnualReturn(Number(e.target.value))} min={0} max={30} step={0.5} />
          </div>
        </div>

        {currentSavings > 0 && targetAmount > 0 && (
          <div className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span>Progress</span>
              <span>{Math.min((currentSavings / targetAmount) * 100, 100).toFixed(1)}%</span>
            </div>
            <Progress value={Math.min((currentSavings / targetAmount) * 100, 100)} />
          </div>
        )}

        <Button onClick={calculate} className="w-full">
          <TrendingUp className="h-4 w-4 mr-2" /> Calculate
        </Button>

        {results && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-muted p-3 rounded-lg text-center">
                <div className="text-2xl font-bold">{results.reached ? results.years : '50+'}</div>
                <div className="text-xs text-muted-foreground">Years</div>
              </div>
              <div className="bg-muted p-3 rounded-lg text-center">
                <div className="text-2xl font-bold">{results.months}</div>
                <div className="text-xs text-muted-foreground">Months</div>
              </div>
              <div className="bg-muted p-3 rounded-lg text-center">
                <div className="text-2xl font-bold">${(results.totalContributions / 1000).toFixed(1)}k</div>
                <div className="text-xs text-muted-foreground">Contributions</div>
              </div>
              <div className="bg-muted p-3 rounded-lg text-center">
                <div className="text-2xl font-bold text-green-500">${(results.interestEarned / 1000).toFixed(1)}k</div>
                <div className="text-xs text-muted-foreground">Interest Earned</div>
              </div>
            </div>

            {!results.reached && (
              <div className="bg-amber-500/10 p-3 rounded-lg">
                <p className="text-sm font-medium text-amber-700 dark:text-amber-400">
                  Goal not reachable in 50 years with current contribution
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Suggested monthly contribution: <span className="font-bold">${results.suggestedContribution.toLocaleString()}</span>
                </p>
              </div>
            )}

            {/* Timeline visualization */}
            {results.timeline.length > 0 && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">Growth Timeline</Label>
                <div className="flex items-end gap-1 h-32">
                  {results.timeline.map((point, i) => {
                    const heightPct = (point.balance / targetAmount) * 100
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1">
                        <div
                          className={`w-full rounded-t ${point.balance >= targetAmount ? 'bg-green-500' : 'bg-primary'} transition-all`}
                          style={{ height: `${Math.min(heightPct, 100)}%` }}
                        />
                        <span className="text-[10px] text-muted-foreground">{point.year}y</span>
                      </div>
                    )
                  })}
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Year 1</span>
                  <span>Target: ${targetAmount.toLocaleString()}</span>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ==================== TaxCalculator ====================
// 2024 US Federal Tax Brackets
const TAX_BRACKETS_2025: Record<string, { min: number; max: number; rate: number }[]> = {
  single: [
    { min: 0, max: 11600, rate: 0.10 },
    { min: 11600, max: 47150, rate: 0.12 },
    { min: 47150, max: 100525, rate: 0.22 },
    { min: 100525, max: 191950, rate: 0.24 },
    { min: 191950, max: 243725, rate: 0.32 },
    { min: 243725, max: 609350, rate: 0.35 },
    { min: 609350, max: Infinity, rate: 0.37 },
  ],
  'married-filing-jointly': [
    { min: 0, max: 23200, rate: 0.10 },
    { min: 23200, max: 94300, rate: 0.12 },
    { min: 94300, max: 201050, rate: 0.22 },
    { min: 201050, max: 383900, rate: 0.24 },
    { min: 383900, max: 487450, rate: 0.32 },
    { min: 487450, max: 731200, rate: 0.35 },
    { min: 731200, max: Infinity, rate: 0.37 },
  ],
  'married-filing-separately': [
    { min: 0, max: 11600, rate: 0.10 },
    { min: 11600, max: 47150, rate: 0.12 },
    { min: 47150, max: 100525, rate: 0.22 },
    { min: 100525, max: 191950, rate: 0.24 },
    { min: 191950, max: 243725, rate: 0.32 },
    { min: 243725, max: 365600, rate: 0.35 },
    { min: 365600, max: Infinity, rate: 0.37 },
  ],
  'head-of-household': [
    { min: 0, max: 16550, rate: 0.10 },
    { min: 16550, max: 63100, rate: 0.12 },
    { min: 63100, max: 100500, rate: 0.22 },
    { min: 100500, max: 191950, rate: 0.24 },
    { min: 191950, max: 243700, rate: 0.32 },
    { min: 243700, max: 609350, rate: 0.35 },
    { min: 609350, max: Infinity, rate: 0.37 },
  ],
}

const STANDARD_DEDUCTIONS: Record<string, number> = {
  single: 14600,
  'married-filing-jointly': 29200,
  'married-filing-separately': 14600,
  'head-of-household': 21900,
}

const STATE_TAX_RATES: Record<string, { name: string; rate: number }> = {
  none: { name: 'No State Tax', rate: 0 },
  CA: { name: 'California', rate: 0.0930 },
  NY: { name: 'New York', rate: 0.0685 },
  TX: { name: 'Texas', rate: 0 },
  FL: { name: 'Florida', rate: 0 },
  WA: { name: 'Washington', rate: 0 },
  IL: { name: 'Illinois', rate: 0.0495 },
  PA: { name: 'Pennsylvania', rate: 0.0307 },
  NJ: { name: 'New Jersey', rate: 0.1075 },
  OH: { name: 'Ohio', rate: 0.0399 },
  GA: { name: 'Georgia', rate: 0.0549 },
  NC: { name: 'North Carolina', rate: 0.045 },
  MA: { name: 'Massachusetts', rate: 0.05 },
  CO: { name: 'Colorado', rate: 0.044 },
  VA: { name: 'Virginia', rate: 0.0575 },
}

export function TaxCalculator() {
  const [filingStatus, setFilingStatus] = useState('single')
  const [grossIncome, setGrossIncome] = useState(75000)
  const [stateCode, setStateCode] = useState('none')
  const [additionalWithholding, setAdditionalWithholding] = useState(0)
  const [year, setYear] = useState<'2024' | '2025'>('2025')

  const results = useMemo(() => {
    if (grossIncome <= 0) return null

    const deduction = STANDARD_DEDUCTIONS[filingStatus] || 14600
    const taxableIncome = Math.max(0, grossIncome - deduction)
    const brackets = (year === '2024' ? TAX_BRACKETS_2025 : TAX_BRACKETS_2025)[filingStatus] || TAX_BRACKETS_2025.single

    let totalTax = 0
    const breakdown: { rate: number; min: number; max: number; taxable: number; tax: number; width: number }[] = []

    for (const bracket of brackets) {
      if (taxableIncome <= bracket.min) break
      const taxableInBracket = Math.min(taxableIncome, bracket.max) - bracket.min
      const taxInBracket = taxableInBracket * bracket.rate
      totalTax += taxInBracket
      breakdown.push({
        rate: bracket.rate,
        min: bracket.min,
        max: bracket.max === Infinity ? taxableIncome : bracket.max,
        taxable: Math.round(taxableInBracket),
        tax: Math.round(taxInBracket),
        width: 0,
      })
    }

    const effectiveRate = grossIncome > 0 ? (totalTax / grossIncome) * 100 : 0
    const marginalRate = breakdown.length > 0 ? breakdown[breakdown.length - 1].rate * 100 : 0
    const stateInfo = STATE_TAX_RATES[stateCode] || STATE_TAX_RATES.none
    const stateTax = Math.round(taxableIncome * stateInfo.rate)
    const totalStateTax = stateTax + additionalWithholding
    const grandTotal = Math.round(totalTax) + totalStateTax
    const monthlyFederal = Math.round(totalTax / 12)
    const monthlyState = Math.round(totalStateTax / 12)
    const biweeklyFederal = Math.round(totalTax / 26)
    const biweeklyState = Math.round(totalStateTax / 26)

    return {
      grossIncome,
      deduction,
      taxableIncome: Math.round(taxableIncome),
      totalTax: Math.round(totalTax),
      effectiveRate: Math.round(effectiveRate * 100) / 100,
      marginalRate,
      breakdown,
      stateCode,
      stateName: stateInfo.name,
      stateRate: stateInfo.rate * 100,
      stateTax,
      totalStateTax,
      grandTotal,
      monthlyFederal,
      monthlyState,
      biweeklyFederal,
      biweeklyState,
      takeHomePay: grossIncome - grandTotal,
    }
  }, [filingStatus, grossIncome, stateCode, additionalWithholding, year])

  const filingLabels: Record<string, string> = {
    single: 'Single',
    'married-filing-jointly': 'Married Filing Jointly',
    'married-filing-separately': 'Married Filing Separately',
    'head-of-household': 'Head of Household',
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Receipt className="h-5 w-5" /> Tax Calculator
        </CardTitle>
        <CardDescription>Estimate US federal & state income tax ({year})</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Filing Status</Label>
            <Select value={filingStatus} onValueChange={setFilingStatus}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(filingLabels).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="tax-income">Gross Annual Income ($)</Label>
            <Input id="tax-income" type="number" value={grossIncome} onChange={e => setGrossIncome(Math.max(0, Number(e.target.value)))} min={0} />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>State</Label>
            <Select value={stateCode} onValueChange={setStateCode}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(STATE_TAX_RATES).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v.name} {v.rate > 0 ? `(${(v.rate * 100).toFixed(2)}%)` : '(No tax)'}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="tax-additional">Additional Withholding ($)</Label>
            <Input id="tax-additional" type="number" value={additionalWithholding} onChange={e => setAdditionalWithholding(Math.max(0, Number(e.target.value)))} min={0} />
          </div>
          <div className="space-y-2">
            <Label>Tax Year</Label>
            <Select value={year} onValueChange={v => setYear(v as '2024' | '2025')}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="2024">2024</SelectItem>
                <SelectItem value="2025">2025</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {results && (
          <div className="space-y-4">
            {/* Key Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-muted p-3 rounded-lg text-center">
                <div className="text-lg font-bold">${results.taxableIncome.toLocaleString()}</div>
                <div className="text-xs text-muted-foreground">Taxable Income</div>
              </div>
              <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 p-3 rounded-lg text-center">
                <div className="text-lg font-bold text-red-600">${results.totalTax.toLocaleString()}</div>
                <div className="text-xs text-muted-foreground">Federal Tax</div>
              </div>
              <div className="bg-muted p-3 rounded-lg text-center">
                <div className="text-lg font-bold">{results.effectiveRate}%</div>
                <div className="text-xs text-muted-foreground">Effective Rate</div>
              </div>
              <div className="bg-muted p-3 rounded-lg text-center">
                <div className="text-lg font-bold">{results.marginalRate}%</div>
                <div className="text-xs text-muted-foreground">Marginal Rate</div>
              </div>
            </div>

            {/* Take-Home Highlight */}
            <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg p-4 text-center">
              <p className="text-sm text-muted-foreground mb-1">Estimated Annual Take-Home Pay</p>
              <p className="text-3xl font-bold text-green-600">${results.takeHomePay.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground mt-1">
                ${results.monthlyFederal + results.monthlyState.toLocaleString()}/month &middot; ${results.biweeklyFederal + results.biweeklyState.toLocaleString()}/biweekly
              </p>
            </div>

            {/* Bracket Breakdown */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Federal Bracket Breakdown</Label>
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted">
                      <th className="text-left p-2">Rate</th>
                      <th className="text-left p-2">Range</th>
                      <th className="text-right p-2">Taxable</th>
                      <th className="text-right p-2">Tax</th>
                      <th className="text-right p-2">Visual</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.breakdown.map((row, i) => (
                      <tr key={i} className="border-t">
                        <td className="p-2 font-medium">{(row.rate * 100).toFixed(0)}%</td>
                        <td className="p-2 text-muted-foreground text-xs">${row.min.toLocaleString()} – {row.max === Infinity ? '∞' : `$${row.max.toLocaleString()}`}</td>
                        <td className="text-right p-2">${row.taxable.toLocaleString()}</td>
                        <td className="text-right p-2 font-medium">${row.tax.toLocaleString()}</td>
                        <td className="p-2 w-24">
                          <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600"
                              style={{ width: `${Math.min(100, (row.tax / results.totalTax) * 100)}%` }}
                            />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* State Tax & Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-muted/60 p-4 rounded-lg space-y-2">
                <p className="text-sm font-medium">Federal Tax Details</p>
                <p className="text-sm"><span className="text-muted-foreground">Standard Deduction:</span> ${results.deduction.toLocaleString()}</p>
                <p className="text-sm"><span className="text-muted-foreground">Federal Tax:</span> <span className="font-medium text-red-600">${results.totalTax.toLocaleString()}</span></p>
                <p className="text-sm"><span className="text-muted-foreground">Monthly:</span> ${results.monthlyFederal.toLocaleString()}</p>
                <p className="text-sm"><span className="text-muted-foreground">Biweekly:</span> ${results.biweeklyFederal.toLocaleString()}</p>
              </div>
              <div className="bg-muted/60 p-4 rounded-lg space-y-2">
                <p className="text-sm font-medium">State Tax ({results.stateName})</p>
                <p className="text-sm"><span className="text-muted-foreground">State Rate:</span> {results.stateRate > 0 ? `${results.stateRate}%` : 'No state tax'}</p>
                <p className="text-sm"><span className="text-muted-foreground">State Tax:</span> <span className="font-medium">${results.stateTax.toLocaleString()}</span></p>
                {additionalWithholding > 0 && (
                  <p className="text-sm"><span className="text-muted-foreground">Additional:</span> ${additionalWithholding.toLocaleString()}</p>
                )}
                <p className="text-sm"><span className="text-muted-foreground">Total State:</span> <span className="font-medium">${results.totalStateTax.toLocaleString()}</span></p>
                <Separator />
                <p className="text-sm font-bold"><span className="text-muted-foreground">Grand Total:</span> <span className="text-red-600">${results.grandTotal.toLocaleString()}</span></p>
              </div>
            </div>

            <p className="text-xs text-muted-foreground text-center">
              ⚠️ Estimates only. Does not include FICA (Social Security 6.2% + Medicare 1.45%), deductions, credits, or AMT. Consult a tax professional for advice.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ==================== RoiCalculator ====================
export function RoiCalculator() {
  const [mode, setMode] = useState<'single' | 'recurring'>('single')
  const [investmentAmount, setInvestmentAmount] = useState(10000)
  const [finalValue, setFinalValue] = useState(15000)
  const [timePeriod, setTimePeriod] = useState(5)
  const [monthlyInvestment, setMonthlyInvestment] = useState(500)
  const [calculated, setCalculated] = useState(false)

  const results = useMemo(() => {
    if (!calculated) return null

    if (mode === 'single') {
      const totalGain = finalValue - investmentAmount
      const roi = (totalGain / investmentAmount) * 100
      // Annualized ROI: (FV/IV)^(1/n) - 1
      const annualizedRoi = timePeriod > 0 ? (Math.pow(finalValue / investmentAmount, 1 / timePeriod) - 1) * 100 : 0
      return {
        totalGain: Math.round(totalGain),
        roi: Math.round(roi * 100) / 100,
        annualizedRoi: Math.round(annualizedRoi * 100) / 100,
        totalInvested: investmentAmount,
        finalValue,
        isGain: totalGain >= 0,
      }
    } else {
      // Recurring monthly investment
      const totalInvested = investmentAmount + monthlyInvestment * 12 * timePeriod
      const totalGain = finalValue - totalInvested
      const roi = totalInvested > 0 ? (totalGain / totalInvested) * 100 : 0
      // Approximate annualized ROI using iterative approach
      let low = -50, high = 100
      for (let iter = 0; iter < 100; iter++) {
        const mid = (low + high) / 2
        const monthlyRate = mid / 100 / 12
        let balance = investmentAmount
        for (let m = 0; m < timePeriod * 12; m++) {
          balance = balance * (1 + monthlyRate) + monthlyInvestment
        }
        if (balance < finalValue) low = mid
        else high = mid
      }
      const annualizedRoi = (low + high) / 2

      return {
        totalGain: Math.round(totalGain),
        roi: Math.round(roi * 100) / 100,
        annualizedRoi: Math.round(annualizedRoi * 100) / 100,
        totalInvested,
        finalValue,
        isGain: totalGain >= 0,
      }
    }
  }, [calculated, mode, investmentAmount, finalValue, timePeriod, monthlyInvestment])

  const calculate = () => {
    if (investmentAmount <= 0 || finalValue <= 0 || timePeriod <= 0) {
      toast.error('Please enter valid positive values')
      return
    }
    setCalculated(true)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" /> ROI Calculator
        </CardTitle>
        <CardDescription>Calculate return on investment percentage</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Calculation Mode</Label>
          <div className="flex gap-2">
            <Button variant={mode === 'single' ? 'default' : 'outline'} onClick={() => { setMode('single'); setCalculated(false) }} className="flex-1">
              One-time Investment
            </Button>
            <Button variant={mode === 'recurring' ? 'default' : 'outline'} onClick={() => { setMode('recurring'); setCalculated(false) }} className="flex-1">
              Monthly Investment
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="roi-initial">Initial Investment ($)</Label>
            <Input id="roi-initial" type="number" value={investmentAmount} onChange={e => setInvestmentAmount(Number(e.target.value))} min={1} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="roi-final">Final Value ($)</Label>
            <Input id="roi-final" type="number" value={finalValue} onChange={e => setFinalValue(Number(e.target.value))} min={0} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="roi-period">Time Period (years)</Label>
            <Input id="roi-period" type="number" value={timePeriod} onChange={e => setTimePeriod(Number(e.target.value))} min={1} />
          </div>
          {mode === 'recurring' && (
            <div className="space-y-2">
              <Label htmlFor="roi-monthly">Monthly Investment ($)</Label>
              <Input id="roi-monthly" type="number" value={monthlyInvestment} onChange={e => setMonthlyInvestment(Number(e.target.value))} min={0} />
            </div>
          )}
        </div>

        <Button onClick={calculate} className="w-full">
          <Percent className="h-4 w-4 mr-2" /> Calculate ROI
        </Button>

        {results && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-muted p-3 rounded-lg text-center">
                <div className={`text-2xl font-bold ${results.isGain ? 'text-green-600' : 'text-red-600'}`}>
                  {results.roi > 0 ? '+' : ''}{results.roi}%
                </div>
                <div className="text-xs text-muted-foreground">Total ROI</div>
              </div>
              <div className="bg-muted p-3 rounded-lg text-center">
                <div className={`text-2xl font-bold ${results.annualizedRoi >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {results.annualizedRoi > 0 ? '+' : ''}{results.annualizedRoi}%
                </div>
                <div className="text-xs text-muted-foreground">Annualized ROI</div>
              </div>
              <div className="bg-muted p-3 rounded-lg text-center">
                <div className={`text-2xl font-bold ${results.isGain ? 'text-green-600' : 'text-red-600'}`}>
                  {results.totalGain >= 0 ? '+' : ''}${Math.abs(results.totalGain).toLocaleString()}
                </div>
                <div className="text-xs text-muted-foreground">{results.isGain ? 'Total Gain' : 'Total Loss'}</div>
              </div>
              <div className="bg-muted p-3 rounded-lg text-center">
                <div className="text-2xl font-bold">${results.totalInvested.toLocaleString()}</div>
                <div className="text-xs text-muted-foreground">Total Invested</div>
              </div>
            </div>

            {/* Visual bar */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Investment vs Return</Label>
              <div className="space-y-2">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Total Invested</span>
                    <span>${results.totalInvested.toLocaleString()}</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-4">
                    <div className="bg-blue-500 h-full rounded-full" style={{ width: '100%' }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Final Value</span>
                    <span>${results.finalValue.toLocaleString()}</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-4">
                    <div
                      className={`${results.isGain ? 'bg-green-500' : 'bg-red-500'} h-full rounded-full`}
                      style={{ width: `${Math.min((results.finalValue / results.totalInvested) * 100, 200)}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ==================== CurrencyFormatter ====================
const CURRENCIES = [
  { code: 'USD', name: 'US Dollar', symbol: '$', locale: 'en-US' },
  { code: 'EUR', name: 'Euro', symbol: '€', locale: 'de-DE' },
  { code: 'GBP', name: 'British Pound', symbol: '£', locale: 'en-GB' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥', locale: 'ja-JP' },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥', locale: 'zh-CN' },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹', locale: 'en-IN' },
  { code: 'KRW', name: 'South Korean Won', symbol: '₩', locale: 'ko-KR' },
  { code: 'BRL', name: 'Brazilian Real', symbol: 'R$', locale: 'pt-BR' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$', locale: 'en-CA' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', locale: 'en-AU' },
]

// Hardcoded approximate rates (relative to USD)
const EXCHANGE_RATES: Record<string, number> = {
  USD: 1,
  EUR: 0.92,
  GBP: 0.79,
  JPY: 154.5,
  CNY: 7.24,
  INR: 83.5,
  KRW: 1340,
  BRL: 4.97,
  CAD: 1.37,
  AUD: 1.53,
}

export function CurrencyFormatter() {
  const [amount, setAmount] = useState(1234.56)
  const [currency, setCurrency] = useState('USD')
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null)

  const formattedResult = useMemo(() => {
    if (isNaN(amount)) return ''
    try {
      const curr = CURRENCIES.find(c => c.code === currency)
      if (!curr) return ''
      return new Intl.NumberFormat(curr.locale, {
        style: 'currency',
        currency: curr.code,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(amount)
    } catch {
      return `${currency} ${amount}`
    }
  }, [amount, currency])

  const conversions = useMemo(() => {
    if (isNaN(amount)) return []
    const usdAmount = amount / (EXCHANGE_RATES[currency] || 1)
    return CURRENCIES.map(curr => {
      const converted = usdAmount * (EXCHANGE_RATES[curr.code] || 1)
      try {
        const formatted = new Intl.NumberFormat(curr.locale, {
          style: 'currency',
          currency: curr.code,
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }).format(converted)
        return { ...curr, converted, formatted }
      } catch {
        return { ...curr, converted, formatted: `${curr.code} ${converted.toFixed(2)}` }
      }
    })
  }, [amount, currency])

  const copyFormatted = (text: string, idx: number) => {
    navigator.clipboard.writeText(text)
    setCopiedIdx(idx)
    toast.success('Copied to clipboard')
    setTimeout(() => setCopiedIdx(null), 2000)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Coins className="h-5 w-5" /> Currency Formatter
        </CardTitle>
        <CardDescription>Format numbers as currency for different countries</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="cf-amount">Amount</Label>
            <Input id="cf-amount" type="number" value={amount || ''} onChange={e => setAmount(Number(e.target.value))} step="0.01" />
          </div>
          <div className="space-y-2">
            <Label>Currency</Label>
            <Select value={currency} onValueChange={setCurrency}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {CURRENCIES.map(c => (
                  <SelectItem key={c.code} value={c.code}>
                    {c.code} - {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {formattedResult && (
          <div className="bg-muted p-4 rounded-lg text-center space-y-2">
            <p className="text-3xl font-bold">{formattedResult}</p>
            <Button variant="ghost" size="sm" onClick={() => copyFormatted(formattedResult, -1)}>
              {copiedIdx === -1 ? <Check className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
              {copiedIdx === -1 ? 'Copied!' : 'Copy'}
            </Button>
          </div>
        )}

        {conversions.length > 0 && (
          <div className="space-y-2">
            <Label className="text-sm font-medium">Comparison Across Currencies</Label>
            <p className="text-xs text-muted-foreground">Approximate values using fixed rates</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-96 overflow-y-auto">
              {conversions.map((conv, i) => (
                <button
                  key={conv.code}
                  onClick={() => copyFormatted(conv.formatted, i)}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors text-left"
                >
                  <div>
                    <div className="text-xs text-muted-foreground">{conv.code} · {conv.name}</div>
                    <div className="text-sm font-bold">{conv.formatted}</div>
                  </div>
                  {copiedIdx === i ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4 text-muted-foreground" />
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        <p className="text-xs text-muted-foreground text-center">
          ⚠️ Exchange rates are approximate and for reference only. Not for financial decisions.
        </p>
      </CardContent>
    </Card>
  )
}
