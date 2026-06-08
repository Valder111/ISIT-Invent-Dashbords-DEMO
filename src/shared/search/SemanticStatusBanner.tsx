import type { IndexState } from './useSemanticSearch'
import type { EmbeddingStatus } from './useSemanticSearch'

export function SemanticStatusBanner({
  modelStatus: _modelStatus,
  indexState: _indexState,
  alwaysOn: _alwaysOn,
}: {
  modelStatus: EmbeddingStatus
  indexState: IndexState
  alwaysOn?: boolean
}) {
  return null
}
