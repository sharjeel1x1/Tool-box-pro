import { NextResponse } from 'next/server';

// Cache rates for 1 hour
let cachedRates: Record<string, number> | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

const FALLBACK_RATES: Record<string, number> = {
  USD: 1, EUR: 0.92, GBP: 0.79, JPY: 149.5, CNY: 7.24,
  INR: 83.12, AUD: 1.53, CAD: 1.36, CHF: 0.88, KRW: 1328.5,
  MXN: 17.15, BRL: 4.97, SGD: 1.34, HKD: 7.82, NOK: 10.95,
  SEK: 10.42, NZD: 1.71, ZAR: 18.35, THB: 35.2, AED: 3.67,
};

export async function GET() {
  try {
    const now = Date.now();

    // Return cached rates if still valid
    if (cachedRates && now - cacheTimestamp < CACHE_TTL) {
      return NextResponse.json({
        rates: cachedRates,
        base: 'USD',
        cached: true,
        timestamp: cacheTimestamp,
      });
    }

    // Fetch fresh rates from free API
    const res = await fetch('https://api.exchangerate-api.com/v4/latest/USD', {
      next: { revalidate: 3600 },
    });

    if (res.ok) {
      const data = await res.json();
      if (data.rates && typeof data.rates === 'object') {
        cachedRates = data.rates;
        cacheTimestamp = now;
        return NextResponse.json({
          rates: cachedRates,
          base: 'USD',
          cached: false,
          date: data.date,
          timestamp: now,
        });
      }
    }

    // Fallback to static rates if API fails
    return NextResponse.json({
      rates: FALLBACK_RATES,
      base: 'USD',
      cached: false,
      fallback: true,
      timestamp: now,
    });
  } catch (error) {
    console.error('Exchange rate API error:', error);
    return NextResponse.json(
      {
        rates: FALLBACK_RATES,
        base: 'USD',
        cached: false,
        fallback: true,
        error: 'Failed to fetch live rates',
      },
      { status: 200 } // Return 200 with fallback rates rather than erroring
    );
  }
}
