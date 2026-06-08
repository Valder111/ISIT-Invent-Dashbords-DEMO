import {
  http as mswHttp,
  HttpResponse,
  type DefaultBodyType,
  type HttpResponseResolver,
  type PathParams,
  type RequestHandlerOptions,
} from 'msw'

/** Путь с wildcard-префиксом — MSW перехватывает /api на GitHub Pages (подкаталог BASE_URL). */
function apiPath(path: string | RegExp): string | RegExp {
  if (path instanceof RegExp) return path
  if (path.includes('*')) return path
  const normalized = path.startsWith('/') ? path : `/${path}`
  return `*${normalized}`
}

type HandlerArgs<Params extends PathParams> = [
  resolver: HttpResponseResolver<Params, DefaultBodyType, undefined>,
  options?: RequestHandlerOptions,
]

function wrap<M extends keyof typeof mswHttp>(method: M) {
  return (path: string | RegExp, ...args: HandlerArgs<PathParams>) =>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (mswHttp[method] as any)(apiPath(path), ...args)
}

export const http = {
  get: wrap('get'),
  post: wrap('post'),
  put: wrap('put'),
  patch: wrap('patch'),
  delete: wrap('delete'),
  head: wrap('head'),
  options: wrap('options'),
  all: mswHttp.all,
}

export { HttpResponse }
