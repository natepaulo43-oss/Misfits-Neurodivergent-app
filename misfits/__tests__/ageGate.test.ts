import { validateBirthYear } from '../utils/ageGate';

const REFERENCE_YEAR = 2025;

describe('validateBirthYear – age gate', () => {
  test('empty field is blocked', () => {
    const result = validateBirthYear('', REFERENCE_YEAR);
    expect(result.valid).toBe(false);
    expect((result as { valid: false; error: string }).error).toBe(
      'Please enter your birth year.',
    );
  });

  test('under-13 is blocked with the correct message', () => {
    const under13Year = String(REFERENCE_YEAR - 12);
    const result = validateBirthYear(under13Year, REFERENCE_YEAR);
    expect(result.valid).toBe(false);
    expect((result as { valid: false; error: string }).error).toBe(
      'Misfits requires users to be 13 or older to create an account.',
    );
  });

  test('exactly-13 is allowed', () => {
    const exactly13Year = String(REFERENCE_YEAR - 13);
    const result = validateBirthYear(exactly13Year, REFERENCE_YEAR);
    expect(result.valid).toBe(true);
  });

  test('over-13 is allowed', () => {
    const over13Year = String(REFERENCE_YEAR - 20);
    const result = validateBirthYear(over13Year, REFERENCE_YEAR);
    expect(result.valid).toBe(true);
  });
});
