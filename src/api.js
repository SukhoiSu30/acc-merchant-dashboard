// src/api.js
// All backend API calls — with Clerk auth token attached to every request.

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api';

// The token getter is set externally (from App.jsx) once Clerk is ready
let getTokenFn = null;

export function setTokenGetter(fn) {
  getTokenFn = fn;
}

async function apiFetch(path, options = {}) {
  const url = `${API_BASE}${path}`;

  // Get the auth token from Clerk
  const token = getTokenFn ? await getTokenFn() : null;

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const res = await fetch(url, {
    ...options,
    headers,
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