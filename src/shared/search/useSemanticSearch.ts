import { useEffect, useMemo, useRef, useState } from 'react'
import type { SearchDoc, SearchHit } from './types'

export type EmbeddingStatus =
  | { kind: 'idle' }
  | { kind: 'loading'; progress: number; file?: string }
  | { kind: 'ready' }
  | { kind: 'error'; message: string }

export type IndexState =
  | { kind: 'idle' }
  | { kind: 'building'; encoded: number; total: number; fromCache: number }
  | { kind: 'ready'; size: number; fromCache: number; newlyEncoded: number }
  | { kind: 'error'; message: string }

export type SearchState =
  | { kind: 'idle' }
  | { kind: 'searching' }
  | { kind: 'done'; hits: SearchHit[] }
  | { kind: 'error'; message: string }

export type IndexedItem = { type: SearchDoc['type']; id: number; text: string }

function scoreText(query: string, text: string): number {
  const q = query.toLowerCase().trim()
  const t = text.toLowerCase()
  if (!q || !t) return 0
  if (t.includes(q)) return 1
  const tokens = q.split(/\s+/).filter(Boolean)
  if (tokens.length === 0) return 0
  let matched = 0
  for (const tok of tokens) {
    if (t.includes(tok)) matched += 1
  }
  return matched / tokens.length
}

export function useEmbeddingStatus(_active: boolean): EmbeddingStatus {
  return { kind: 'ready' }
}

export function useSemanticIndex(
  docs: SearchDoc[] | null,
  enabled: boolean,
): { state: IndexState; index: IndexedItem[] } {
  const index = useMemo<IndexedItem[]>(() => {
    if (!enabled || !docs) return []
    return docs.map((d) => ({ type: d.type, id: d.id, text: d.text }))
  }, [docs, enabled])

  const state = useMemo<IndexState>(() => {
    if (!enabled || !docs) return { kind: 'idle' }
    return { kind: 'ready', size: index.length, fromCache: index.length, newlyEncoded: 0 }
  }, [enabled, docs, index.length])

  return { state, index }
}

export function useSemanticQuery(
  query: string,
  index: IndexedItem[],
  enabled: boolean,
  opts?: { topK?: number; minScore?: number; debounceMs?: number },
): SearchState {
  const [internalState, setInternalState] = useState<SearchState>({ kind: 'idle' })
  const reqIdRef = useRef(0)
  const debounceMs = opts?.debounceMs ?? 200
  const q = query.trim()
  const queryReady = enabled && q.length >= 2 && index.length > 0

  useEffect(() => {
    if (!queryReady) return
    const myId = ++reqIdRef.current
    const timer = setTimeout(() => {
      setInternalState({ kind: 'searching' })
      const minScore = opts?.minScore ?? 0.2
      const topK = opts?.topK ?? 80
      const hits: SearchHit[] = index
        .map((item) => ({ type: item.type, id: item.id, score: scoreText(q, item.text) }))
        .filter((h) => h.score >= minScore)
        .sort((a, b) => b.score - a.score)
        .slice(0, topK)
      if (myId !== reqIdRef.current) return
      setInternalState({ kind: 'done', hits })
    }, debounceMs)
    return () => clearTimeout(timer)
  }, [q, queryReady, index, opts?.minScore, opts?.topK, debounceMs])

  if (!queryReady) return { kind: 'idle' }
  return internalState
}
