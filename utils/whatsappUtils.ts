/**
 * Sanitizes a phone number by removing all non-digit characters.
 * @param phoneNumber The phone number string.
 * @returns A string containing only digits.
 */
const sanitizePhoneNumber = (phoneNumber: string): string => {
  return phoneNumber.replace(/\D/g, '');
};

/**
 * Creates a WhatsApp "click to chat" link.
 * @param countryCode The country code (e.g., '+54').
 * @param phoneNumber The national phone number.
 * @returns The formatted 'https://wa.me/' URL.
 */
export const getWhatsAppLink = (countryCode: string, phoneNumber: string): string => {
  const sanitizedCountryCode = sanitizePhoneNumber(countryCode);
  const sanitizedPhoneNumber = sanitizePhoneNumber(phoneNumber);
  return `https://wa.me/${sanitizedCountryCode}${sanitizedPhoneNumber}`;
};


/**
 * Simulates checking if a phone number is registered on WhatsApp.
 * NOTE: A true client-side check is not possible without a backend or official API
 * due to browser security restrictions (CORS). This function mimics an API call
 * and returns true for phone numbers that appear to be validly formatted.
 * @param countryCode The country code.
 * @param phoneNumber The phone number to check.
 * @returns A promise that resolves to true if the number seems valid, false otherwise.
 */
export const checkWhatsAppAvailability = async (countryCode: string, phoneNumber: string): Promise<boolean> => {
  const fullNumber = `${countryCode}${phoneNumber}`;
  const sanitized = fullNumber.replace(/[\s-()]/g, '');

  // Basic validation: must be mostly digits, maybe a '+' at the start.
  // We'll assume numbers longer than 9 digits are potentially valid.
  if (/^\+?\d{10,}$/.test(sanitized)) {
    // Simulate network delay for the check
    await new Promise(resolve => setTimeout(resolve, 500));
    // In this mock, we'll assume most valid-looking numbers have WhatsApp.
    return true;
  }

  return false;
};