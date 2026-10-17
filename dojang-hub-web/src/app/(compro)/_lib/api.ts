const DEFAULT_API_URL = "http://localhost:8000/api";

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") || DEFAULT_API_URL;

type ContactInquiryPayload = {
  akademi_name: string;
  person_name: string;
  phone: string;
  plan_interest?: string;
  message?: string;
  source_page?: string;
};

export async function submitContactInquiry(payload: ContactInquiryPayload) {
  const response = await fetch(`${API_URL}/compro/inquiries`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const fallbackMessage = `Inquiry submit failed: ${response.status}`;

    try {
      const errorBody = await response.json();
      throw new Error(errorBody.message || fallbackMessage);
    } catch (error) {
      if (error instanceof Error && error.message !== fallbackMessage) {
        throw error;
      }

      throw new Error(fallbackMessage);
    }
  }

  return response.json();
}

