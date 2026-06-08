import type { EmbeddingStatus } from './useSemanticSearch'

export type { EmbeddingStatus }

export function getEmbeddingClient() {
  return {
    getStatus: (): EmbeddingStatus => ({ kind: 'ready' }),
    subscribe: (fn: (s: EmbeddingStatus) => void) => {
      fn({ kind: 'ready' })
      return () => {}
    },
    init: () => {},
    embed: async () => [] as Float32Array[],
  }
}
