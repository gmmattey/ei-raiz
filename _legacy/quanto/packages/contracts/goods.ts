import type { GoodType } from './portfolio'
export type { GoodType } from './portfolio'

export const GOOD_TYPES = ['FGTS', 'IMOVEL', 'VEICULO'] as const
export const PROPERTY_TYPES = ['APARTAMENTO', 'CASA', 'TERRENO', 'SALA_COMERCIAL'] as const
export const VEHICLE_TYPES = ['CARRO', 'MOTO', 'UTILITARIO'] as const

export type PropertyType = typeof PROPERTY_TYPES[number]
export type VehicleType = typeof VEHICLE_TYPES[number]

export interface GoodSummary {
  id: number
  type: GoodType
  name: string
  estimatedValue: number
  balanceUpdatedAt: string | null
  staleDays: number | null
  propertyType: string | null
  areaM2: number | null
  vehicleType: string | null
  year: number | null
  brand: string | null
  modelName: string | null
  employer: string | null
  city: string | null
  state: string | null
  isFinanced: boolean
  notes: string | null
  status: 'active' | 'archived'
}

export interface GoodsResponse {
  total: number
  byType: Record<GoodType, number>
  goods: GoodSummary[]
}

export interface CreateGoodInput {
  type: GoodType
  name: string
  estimatedValue: number
  propertyType?: PropertyType | null
  areaM2?: number | null
  city?: string | null
  state?: string | null
  vehicleType?: VehicleType | null
  year?: number | null
  brand?: string | null
  modelName?: string | null
  employer?: string | null
  isFinanced?: boolean
  notes?: string | null
}

export interface CreateGoodResponse {
  id: number
  user_id: number
  type: GoodType
  name: string
  estimated_value: number
  balance_updated_at: string | null
  property_type: PropertyType | null
  area_m2: number | null
  city: string | null
  state: string | null
  vehicle_type: VehicleType | null
  year: number | null
  brand: string | null
  model_name: string | null
  employer: string | null
  is_financed: 0 | 1
  notes: string | null
  status: 'active'
}

export interface UpdateGoodResponse {
  id: number
  user_id: number
  type: GoodType
  name: string
  estimated_value: number
  balance_updated_at: string | null
  property_type: PropertyType | null
  area_m2: number | null
  city: string | null
  state: string | null
  vehicle_type: VehicleType | null
  year: number | null
  brand: string | null
  model_name: string | null
  employer: string | null
  is_financed: 0 | 1
  notes: string | null
  status: 'active' | 'archived'
}

export interface ArchiveGoodResponse {
  archived: true
}

export interface UpdateGoodInput {
  name?: string | null
  estimatedValue?: number | null
  propertyType?: PropertyType | null
  areaM2?: number | null
  city?: string | null
  state?: string | null
  vehicleType?: VehicleType | null
  year?: number | null
  brand?: string | null
  modelName?: string | null
  employer?: string | null
  isFinanced?: boolean
  notes?: string | null
}
