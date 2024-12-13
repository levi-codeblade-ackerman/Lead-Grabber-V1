import { PUBLIC_BASE_URL } from "$env/static/public";

export function getLeadboxEmbedCode(id: string = 'default') {
  return `<script src="${PUBLIC_BASE_URL}/embed/leadbox/${id}?t=${Date.now()}"></script>`;
}

export function getLeadformEmbedCode(id: string = 'default') {
  return `<script src="${PUBLIC_BASE_URL}/embed/leadform/${id}?t=${Date.now()}"></script>`;
} 