export const WHATSAPP_NUMBER = "6281377095318";
export const WHATSAPP_DISPLAY = "0813 7709 5318";

export function createWhatsAppUrl(message: string, number?: string) {
  const num = number ?? WHATSAPP_NUMBER;
  return `https://wa.me/${num}?text=${encodeURIComponent(message)}`;
}

export function formatWhatsAppDisplay(number: string): string {
  const digits = number.replace(/\D/g, "");
  if (digits.startsWith("62") && digits.length >= 11) {
    const local = "0" + digits.slice(2);
    return local.replace(/(\d{4})(\d{4})(\d+)/, "$1 $2 $3");
  }
  return number;
}

