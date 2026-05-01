import { phoneDigitsOnly } from './phone';

export interface ShareTarget {
  phone?: string;
  email?: string;
}

export interface QuoteShareInput {
  clientName: string;
  manicuriName: string;
  amountFormatted: string;
  publicUrl: string;
  validUntil?: string;
  customMessage?: string;
}

export function buildQuoteMessage(input: QuoteShareInput): string {
  const lines = [
    `Hola ${input.clientName}!`,
    ``,
    `${input.manicuriName} ha preparado tu cotizacion personalizada:`,
    `Total: ${input.amountFormatted}`,
  ];
  if (input.validUntil) lines.push(`Valida hasta: ${input.validUntil}`);
  if (input.customMessage) {
    lines.push('');
    lines.push(input.customMessage);
  }
  lines.push('');
  lines.push(`Mira los detalles y confirma aqui: ${input.publicUrl}`);
  return lines.join('\n');
}

export function whatsappLink(phone: string, message: string): string {
  const digits = phoneDigitsOnly(phone);
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

export function telegramShareLink(url: string, text: string): string {
  return `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;
}

export function mailtoLink(email: string, subject: string, body: string): string {
  const params = new URLSearchParams({ subject, body });
  return `mailto:${email}?${params.toString()}`;
}

export function smsLink(phone: string, message: string): string {
  const digits = phoneDigitsOnly(phone);
  return `sms:${digits}?body=${encodeURIComponent(message)}`;
}
