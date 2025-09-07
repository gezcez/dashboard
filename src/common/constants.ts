export const ENV : "dev" | "production" = "production"

const TESTING_API = "http://localhost:80"
export const STATUS_URL = "https://status.gezcez.com"


export const OAUTH_URL = "https://oauth.gezcez.com"
export const API_URL = ENV === "production" as any ? "https://api.gezcez.com" : TESTING_API