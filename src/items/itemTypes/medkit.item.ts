import { BaseItem } from '../base.item'
import { ItemType } from '../item.types'
import { IPlayer } from "../../core/core.types";
import { GameConfig } from "../../config/game.config";

export class Medkit extends BaseItem {
  readonly canUse: boolean = true

  constructor() {
    super(ItemType.Medkit)
  }

  onUse(player: IPlayer): void {
    player.health = GameConfig.healthMax
  }
}
