import { getBaseUrl } from '../config/api';
import { authStore } from '../store/authStore';

export async function registerFaceVector(vector: number[]) {
  const token = authStore.getState().token;
  const url = getBaseUrl() + '/vektor-face';
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ vector }),
  });
  return response.json();
}

export async function getUserFaceVector() {
  const token = authStore.getState().token;
  const url = getBaseUrl() + '/vektor-face';
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  });
  return response.json();
}

export function cosineSimilarity(a: number[], b: number[]): number {
  if (!a || !b || a.length !== b.length) return 0;
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}
