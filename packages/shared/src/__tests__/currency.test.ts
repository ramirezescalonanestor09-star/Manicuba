import test from 'node:test';
import assert from 'node:assert/strict';
import { formatAmount, parseAmount } from '../currency';

test('formatAmount agrega sufijo de moneda', () => {
  assert.match(formatAmount(3500, 'CUP'), /3.?500 CUP/);
  assert.match(formatAmount(20, 'USD'), /20 USD/);
  assert.match(formatAmount(15, 'MLC'), /15 MLC/);
});

test('parseAmount tolera comas, espacios y simbolos', () => {
  assert.equal(parseAmount('3,500'), 3.5);
  assert.equal(parseAmount('$ 3500'), 3500);
  assert.equal(parseAmount('20.50 USD'), 20.5);
  assert.equal(parseAmount('xx'), null);
});
