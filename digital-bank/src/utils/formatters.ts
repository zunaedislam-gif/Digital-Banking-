/**
 * Utility functions for formatting currency, dates, account numbers, and status badges.
 */

export function formatCurrency(amount: number, currency: string = 'BDT'): string {
  const formattedNumber = new Intl.NumberFormat('en-BD', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount || 0);

  if (currency === 'BDT') {
    return `৳${formattedNumber}`;
  }
  return `${currency} ${formattedNumber}`;
}

export function maskAccountNumber(accNumber?: string): string {
  if (!accNumber) return 'ZR-••••-••••';
  const parts = accNumber.split('-');
  if (parts.length >= 3) {
    return `${parts[0]}-••••-${parts[parts.length - 1]}`;
  }
  if (accNumber.length > 8) {
    return `${accNumber.slice(0, 4)}••••${accNumber.slice(-4)}`;
  }
  return accNumber;
}

export function maskCardNumber(cardNumber?: string): string {
  if (!cardNumber) return '•••• •••• •••• ••••';
  const clean = cardNumber.replace(/\s+/g, '');
  if (clean.length >= 16) {
    return `${clean.slice(0, 4)} •••• •••• ${clean.slice(-4)}`;
  }
  return cardNumber;
}

export function formatDate(dateString?: string): string {
  if (!dateString) return '-';
  try {
    const d = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(d);
  } catch {
    return dateString;
  }
}

export function formatDateTime(dateString?: string): string {
  if (!dateString) return '-';
  try {
    const d = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }).format(d);
  } catch {
    return dateString;
  }
}

export function formatRelativeTime(dateString?: string): string {
  if (!dateString) return '';
  try {
    const now = new Date().getTime();
    const then = new Date(dateString).getTime();
    const diffSec = Math.floor((now - then) / 1000);

    if (diffSec < 60) return 'Just now';
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
    if (diffSec < 604800) return `${Math.floor(diffSec / 86400)}d ago`;
    return formatDate(dateString);
  } catch {
    return dateString;
  }
}
