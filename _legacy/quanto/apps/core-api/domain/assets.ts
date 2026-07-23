import {
  ASSET_CLASSES,
  ASSET_INSTITUTIONS,
  ASSET_STATUSES,
  type AssetClass,
  type AssetInstitution,
  type AssetStatus,
} from '../../../packages/contracts/portfolio'
import {
  ASSET_LIFECYCLE_EVENT_TYPES,
  type AssetLifecycleEventType,
} from '../../../packages/contracts/detail'
import {
  IMPORTABLE_ASSET_STATUSES,
  type ImportableAssetStatus,
} from '../../../packages/contracts/import'

export const VALID_INSTITUTIONS = ASSET_INSTITUTIONS
export const VALID_CLASSES = ASSET_CLASSES
export const VALID_STATUSES = ASSET_STATUSES
export const IMPORTABLE_STATUSES = IMPORTABLE_ASSET_STATUSES
export const LIFECYCLE_EVENT_TYPES = ASSET_LIFECYCLE_EVENT_TYPES

export type Institution = AssetInstitution
export type { AssetClass, AssetStatus, ImportableAssetStatus, AssetLifecycleEventType }
