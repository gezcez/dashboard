export const ENV : "dev" | "production" = "dev"

const TESTING_API = "http://localhost:80"
export const STATUS_URL = "https://status.gezcez.com"


export const OAUTH_URL = ENV === "production" as any ?"https://oauth.gezcez.com": "http://localhost:8081"
export const API_URL = ENV === "production" as any ? "https://api.gezcez.com" : TESTING_API