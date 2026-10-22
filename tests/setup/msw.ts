import { setupServer } from "msw/node"

/** Node MSW server for unit tests. Tests add handlers with server.use(...). */
export const server = setupServer()
