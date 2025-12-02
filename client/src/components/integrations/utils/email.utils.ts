export function parseEmailList(emailString: string): string[] {
  if (!emailString.trim()) {
    return [];
  }
  return emailString
    .split(',')
    .map((email) => email.trim())
    .filter((email) => email.length > 0);
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validateEmailList(emails: string[]): {
  isValid: boolean;
  invalidEmails: string[];
} {
  const invalidEmails = emails.filter((email) => !validateEmail(email));
  return {
    isValid: invalidEmails.length === 0,
    invalidEmails,
  };
}

