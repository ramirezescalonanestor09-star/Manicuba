import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildQuoteMessage,
  mailtoLink,
  smsLink,
  telegramShareLink,
  whatsappLink,
} from '../share-links';

test('buildQuoteMessage incluye nombre, manicuri, total y URL publica', () => {
  const msg = buildQuoteMessage({
    clientName: 'Maria',
    manicuriName: 'Salon Demo',
    amountFormatted: '3500 CUP',
    publicUrl: 'https://manicuba.app/r/abc',
  });
  assert.match(msg, /Maria/);
  assert.match(msg, /Salon Demo/);
  assert.match(msg, /3500 CUP/);
  assert.match(msg, /https:\/\/manicuba\.app\/r\/abc/);
});

test('whatsappLink usa solo digitos del telefono y URL-encoda el mensaje', () => {
  const link = whatsappLink('+53 5555-1234', 'Hola Maria!');
  assert.equal(
    link,
    'https://wa.me/5355551234?text=Hola%20Maria!',
  );
});

test('telegramShareLink encoda url y texto', () => {
  const link = telegramShareLink('https://x.com/y', 'Hola');
  assert.match(link, /share\/url\?url=https%3A%2F%2Fx\.com%2Fy/);
  assert.match(link, /text=Hola/);
});

test('mailtoLink y smsLink generan los esquemas correctos', () => {
  assert.match(mailtoLink('a@b.com', 'Hola', 'Cuerpo'), /^mailto:a@b\.com\?/);
  assert.equal(smsLink('+5355551234', 'hola'), 'sms:5355551234?body=hola');
});
