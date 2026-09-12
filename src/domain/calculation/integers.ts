export class CalculationInputError extends Error {
  override name = 'CalculationInputError';
}

const fail = (message: string): never => { throw new CalculationInputError(message); };

export function assertSafeInteger(value: number, label: string, minimum = 0): void {
  if (!Number.isSafeInteger(value) || value < minimum) {
    fail(`${label} must be a safe integer greater than or equal to ${minimum}`);
  }
}

export function addSafeIntegers(...values: readonly number[]): number {
  const total = values.reduce((sum, value) => sum + value, 0);
  if (!Number.isSafeInteger(total)) fail('integer addition exceeded Number.MAX_SAFE_INTEGER');
  return total;
}

export function subtractSafeIntegers(left: number, right: number): number {
  const difference = left - right;
  if (!Number.isSafeInteger(difference)) fail('integer subtraction exceeded Number.MAX_SAFE_INTEGER');
  return difference;
}

export function multiplySafeIntegers(left: number, right: number): number {
  const product = left * right;
  if (!Number.isSafeInteger(product)) fail('integer multiplication exceeded Number.MAX_SAFE_INTEGER');
  return product;
}

export function ceilDivide(dividend: number, divisor: number): number {
  if (!Number.isSafeInteger(dividend) || !Number.isSafeInteger(divisor) || dividend < 0 || divisor <= 0) {
    fail('ceilDivide requires a non-negative integer dividend and positive integer divisor');
  }
  return Math.floor(dividend / divisor) + (dividend % divisor === 0 ? 0 : 1);
}

export function minSafeInteger(left: number, right: number): number {
  return left < right ? left : right;
}
