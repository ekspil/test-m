import { GameConfig } from '../../config/game.config'
import { IPlayer } from '../../core/core.types'
import { BaseItem } from '../base.item'
import { ItemType } from '../item.types'

export class Ammo extends BaseItem {
  readonly canUse: boolean = true

  constructor() {
    super(ItemType.Ammo)
  }

  onUse(player: IPlayer): void {
    player.ammo = Math.min(GameConfig.ammoMax, player.ammo + GameConfig.ammoBonus)
  }
}
