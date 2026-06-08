import { analyticsHandlers } from './analytics'
import { fileHandlers } from './files'
import { extraHandlers } from './extra'
import { routeHandlers } from './routes'

/** MSW: analytics before legacy reports; file handlers first. */
export const handlers = [...fileHandlers, ...extraHandlers, ...analyticsHandlers, ...routeHandlers]
