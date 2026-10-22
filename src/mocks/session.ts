/**
 * Mock-mode stand-in for the API's server-side state: issued codes and the refresh "cookie".
 * Real builds keep the refresh token in the HttpOnly gz_rt cookie; mock builds have no server,
 * so this fake session lives in localStorage. It holds no real credential.
 */
const SESSION_KEY = "gz.mock.session"
const CODES_KEY = "gz.mock.codes"

export interface MockSession {
  persona: string
  authTime: number
  sid: string
}

interface MockCode {
  persona: string
  challenge: string
  redirectUri: string
  authTime: number
  expiresAt: number
}

function read(key: string): unknown {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as unknown) : null
  } catch {
    return null
  }
}

function write(key: string, value: unknown): void {
  try {
    if (value === null) localStorage.removeItem(key)
    else localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // ignore
  }
}

export const mockSession = {
  get: (): MockSession | null => read(SESSION_KEY) as MockSession | null,
  set: (s: MockSession | null) => write(SESSION_KEY, s),
  issueCode(code: MockCode & { code: string }): void {
    const codes = (read(CODES_KEY) ?? {}) as Record<string, MockCode>
    const { code: key, ...rest } = code
    codes[key] = rest
    write(CODES_KEY, codes)
  },
  takeCode(code: string): MockCode | null {
    const codes = (read(CODES_KEY) ?? {}) as Record<string, MockCode>
    const found = codes[code] ?? null
    write(CODES_KEY, Object.fromEntries(Object.entries(codes).filter(([k]) => k !== code)))
    return found && found.expiresAt > Date.now() ? found : null
  },
}
