/**
 * Thin client for backend/routers/auth.py. Talks to the real FastAPI
 * backend (unlike the rest of the frontend, which still renders from
 * local mock data — see README assumption #2).
 *
 * Session storage: the JWT + user are kept in localStorage for this demo.
 * That's simple but XSS-exposed — swap for an httpOnly cookie set by the
 * backend before any real production deployment.
 */
// 127.0.0.1, not "localhost" — see the same note in lib/api.ts.
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
const TOKEN_KEY = "fimiya_token";
const USER_KEY = "fimiya_user";

export type Role = "artist" | "organizer";

export type AuthUser = {
  id: string;
  email: string;
  full_name: string;
  role: Role;
  artist_id: string | null;
  organizer_id: string | null;
};

export type AuthResponse = {
  access_token: string;
  token_type: string;
  user: AuthUser;
};

export type RegisterPayload = {
  role: Role;
  email: string;
  password: string;
  full_name: string;
  city?: string;
  province?: string;
  phone?: string;
  // artist-only
  stage_name?: string;
  category?: string;
  // organizer-only
  organization_name?: string;
  organizer_type?: string;
};

async function parseErrorDetail(res: Response): Promise<string> {
  try {
    const body = await res.json();
    if (typeof body.detail === "string") return body.detail;
    if (Array.isArray(body.detail)) return body.detail.map((d: any) => d.msg).join(", ");
  } catch {
    // fall through
  }
  return `Request failed (${res.status})`;
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new Error(await parseErrorDetail(res));
  return res.json();
}

export async function register(payload: RegisterPayload): Promise<AuthResponse> {
  const res = await fetch(`${API_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await parseErrorDetail(res));
  return res.json();
}

export function storeSession(auth: AuthResponse) {
  localStorage.setItem(TOKEN_KEY, auth.access_token);
  localStorage.setItem(USER_KEY, JSON.stringify(auth.user));
}

export function getStoredUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}
