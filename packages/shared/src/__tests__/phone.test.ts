import test from 'node:test';
import assert from 'node:assert/strict';
import { isValidPhone, normalizePhone, phoneDigitsOnly } from '../phone';

test('normalizePhone agrega prefijo cubano a numeros locales de 8 digitos', () => {
  assert.equal(normalizePhone('55551234'), '+5355551234');
  assert.equal(normalizePhone('5 555 1234'), '+5355551234');
});

test('normalizePhone respeta numeros con prefijo +', () => {
  assert.equal(normalizePhone('+5355551234'), '+5355551234');
  assert.equal(normalizePhone(' +1 305 5551234 '), '+13055551234');
});

test('normalizePhone convierte 00 internacional a +', () => {
  assert.equal(normalizePhone('005355551234'), '+5355551234');
});

test('isValidPhone acepta E.164 y rechaza basura', () => {
  assert.equal(isValidPhone('+5355551234'), true);
  assert.equal(isValidPhone('55551234'), true);
  assert.equal(isValidPhone('123'), false);
  assert.equal(isValidPhone('abcde'), false);
});

test('phoneDigitsOnly elimina + y separadores', () => {
  assert.equal(phoneDigitsOnly('+53 5555-1234'), '5355551234');
});
