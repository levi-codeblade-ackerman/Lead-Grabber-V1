import { PUBLIC_BASE_URL } from "$env/static/public";

export function getLeadboxEmbedCode(leadboxId: string) {
  const timestamp = Date.now();
  return `<script src="${PUBLIC_BASE_URL}/embed/leadbox/${leadboxId}?t=${timestamp}"></script>`;
}

export function getLeadformEmbedCode(formId: string) {
  const timestamp = Date.now();
  return `<script src="${PUBLIC_BASE_URL}/embed/leadform/${formId}?t=${timestamp}"></script>`;
} 