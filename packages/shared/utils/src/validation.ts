// Validation utilities

export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const isValidPassword = (password: string): boolean => {
  // At least 8 characters
  return password.length >= 8;
};

export const isValidSurahNumber = (surah: string): boolean => {
  const num = parseInt(surah, 10);
  return !isNaN(num) && num >= 1 && num <= 114;
};

export const isValidVerseRange = (verses: string): boolean => {
  // Accepts formats like "1-7" or "1,3,5" or "1"
  const rangeRegex = /^\d+(-\d+)?$/;
  const listRegex = /^\d+(,\d+)*$/;
  return rangeRegex.test(verses) || listRegex.test(verses);
};
