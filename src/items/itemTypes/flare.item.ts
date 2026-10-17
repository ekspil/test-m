import { distance } from '../../utils/distance'
import type {IPlayer, Position} from '../../core/core.types'
import { BaseItem } from '../base.item'
import { ItemType } from '../item.types'
import { GameConfig } from "../../config/game.config";

export class Flare extends BaseItem {
  constructor() {
    super(ItemType.Flare)
  }

  onDrop( position: Position, players: IPlayer[], currentTick: number): void {
    for (const player of players) {
      if (distance(player.position, position) > GameConfig.nearRadius) continue
      player.persistedEffects.push({
        type: this.type,
        expirationTick: currentTick + GameConfig.flareTicks
      })

      player.visible = true
    }
  }

  onEnd(player: IPlayer): void {
    player.visible = false
  }
}
