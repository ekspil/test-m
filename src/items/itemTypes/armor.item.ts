import { BaseItem } from '../base.item'
import { ItemType } from '../item.types'
import { IPlayer } from "../../core/core.types";
import { GameConfig } from "../../config/game.config";

export class Armor extends BaseItem {
  readonly canUse: boolean = true

  constructor() {
    super(ItemType.Armor)
  }

  onUse(player: IPlayer): void {
    player.armor = Math.min(GameConfig.armorMax, player.armor + GameConfig.armorBonus)
  }
}
