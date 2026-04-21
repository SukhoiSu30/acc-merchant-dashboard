// src/api.js
// All backend API calls live in this one file.
// If the backend URL ever changes, you only update one place.

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api';

// Helper: wrap fetch with error handling
async function apiFetch(path, options = {}) {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`API error ${res.status}: ${errorText}`);
  }

  return res.json();
}

// -------- Overview --------
export function getOverview() {
  return apiFetch('/overview');
}

// -------- Transactions --------
export function getTransactions({ status, method, search, limit } = {}) {
  const params = new URLSearchParams();
  if (status && status !== 'ALL') params.append('status', status);
  if (method && method !== 'ALL') params.append('method', method);
  if (search) params.append('search', search);
  if (limit) params.append('limit', limit);

  const query = params.toString() ? `?${params.toString()}` : '';
  return apiFetch(`/transactions${query}`);
}

export function getTransaction(id) {
  return apiFetch(`/transactions/${id}`);
}

// -------- Refunds --------
export function getRefunds() {
  return apiFetch('/refunds');
}

// -------- Settlements --------
export function getSettlements() {
  return apiFetch('/settlements');
}

// -------- Health --------
export function getHealth() {
  return apiFetch('/health');
}