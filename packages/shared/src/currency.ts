import type { Currency, Money } from './types';

const SYMBOLS: Record<Currency, string> = {
  CUP: '$',
  MLC: 'MLC',
  USD: 'USD',
};

const LOCALE = 'es-CU';

export function formatMoney(money: Money): string {
  const formatter = new Intl.NumberFormat(LOCALE, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
  const value = formatter.format(money.amount);
  if (money.currency === 'CUP') return `${value} CUP`;
  return `${value} ${SYMBOLS[money.currency]}`;
}

export function formatAmount(amount: number, currency: Currency): string {
  return formatMoney({ amount, currency });
}

export function parseAmount(input: string): number | null {
  const cleaned = input.replace(/[^\d.,-]/g, '').replace(/,/g, '.');
  const value = Number.parseFloat(cleaned);
  return Number.isFinite(value) ? value : null;
}
