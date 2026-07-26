const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateEmail(email: string): string | null {
  const value = email.trim();
  if (!value) {
    return "Email is required.";
  }
  if (!EMAIL_PATTERN.test(value)) {
    return "Enter a valid email address.";
  }
  return null;
}

export function validatePassword(password: string, minimumLength = 8): string | null {
  if (!password) {
    return "Password is required.";
  }
  if (password.length < minimumLength) {
    return `Password must be at least ${minimumLength} characters.`;
  }
  return null;
}

export function validateName(name: string): string | null {
  if (!name.trim()) {
    return "Name is required.";
  }
  return null;
}

export function validatePasswordConfirmation(password: string, confirm: string): string | null {
  if (!confirm) {
    return "Confirm your password.";
  }
  if (password !== confirm) {
    return "Passwords do not match.";
  }
  return null;
}
