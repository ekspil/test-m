import { IPlayer, Position } from '../core/core.types'

export enum ItemType {
  Medkit = 'medkit',
  Armor = 'armor',
  Ammo = 'ammo',
  Flare = 'flare',
}

export interface IItemInstance {
  id: number
  type: ItemType
  position?: Position
  playerId?: number
  expiresAt?: number
}
