
import {IPlayer, Position} from '../core/core.types'
import { IItemInstance } from './item.types'
import { ItemType } from './item.types'

export class BaseItem {
  readonly canUse: boolean = false

  constructor(readonly type: ItemType) {}

  onPickup(player: IPlayer): void {}
  onDrop(position: Position, players: IPlayer[], currentTick: number): void {}
  onUse(player: IPlayer, item: IItemInstance): void {}
  onEnd(player: IPlayer): void {}
}
