function normalizePhoneNumber(phone) {
  if (!phone) return "";

  return String(phone).replace(/\D/g, "");
}

export function contactStoreOnWhatsApp({ phoneNumber, orderNumber }) {
  const phone = normalizePhoneNumber(phoneNumber);

  if (!phone) {
    console.warn("Store WhatsApp number is unavailable.");
    return;
  }

  const message = `Hello, I'm contacting you about my ROA order ${orderNumber}. I have a question about my order.`;

  const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;

  window.open(url, "_blank", "noopener,noreferrer");
}
