export type AgeGateResult =
  | { valid: true }
  | { valid: false; error: string };

export function validateBirthYear(
  birthYearStr: string,
  referenceYear: number = new Date().getFullYear(),
): AgeGateResult {
  if (!birthYearStr || birthYearStr.trim() === '') {
    return { valid: false, error: 'Please enter your birth year.' };
  }

  const year = parseInt(birthYearStr.trim(), 10);
  if (isNaN(year) || birthYearStr.trim().length !== 4) {
    return { valid: false, error: 'Please enter a valid 4-digit birth year.' };
  }

  if (referenceYear - year < 13) {
    return {
      valid: false,
      error: 'The Misfits Project requires users to be 13 or older to create an account.',
    };
  }

  return { valid: true };
}
