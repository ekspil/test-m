import {ItemType} from "../items/item.types";

export type Position = [number, number]
export interface IPersistedEffect {
  expirationTick: number,
  type: ItemType
}

export interface IPlayer {
  id: number
  position: Position
  health: number
  armor: number
  ammo: number
  persistedEffects: IPersistedEffect[]
  visible: boolean
}

