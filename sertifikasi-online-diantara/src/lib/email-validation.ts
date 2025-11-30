/**
 * Validate email format with proper domain and TLD
 * @param email - Email address to validate
 * @returns true if email is valid, false otherwise
 */
export function isValidEmail(email: string): boolean {
  // Basic email format check
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Get user-friendly error message for invalid email
 * @param email - Email address that failed validation
 * @returns Error message string
 */
export function getEmailErrorMessage(email: string): string {
  if (!email || email.trim() === "") {
    return "Email tidak boleh kosong";
  }
  
  if (!email.includes("@")) {
    return "Email harus mengandung simbol '@'";
  }
  
  if (!email.includes(".")) {
    return "Email harus memiliki domain dengan ekstensi (contoh: .com, .id, .co.id)";
  }
  
  const parts = email.split("@");
  if (parts.length > 2) {
    return "Email hanya boleh memiliki satu simbol '@'";
  }
  
  const domain = parts[1];
  if (domain && domain.endsWith(".")) {
    return "Domain email tidak boleh berakhir dengan '.'";
  }
  
  const domainParts = domain.split(".");
  if (domainParts.some((part) => part === "")) {
    return "Domain email tidak valid";
  }
  
  return "Format email tidak valid";
}
