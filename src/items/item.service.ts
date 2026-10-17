import { Armor } from './armor.item'
import { Flare } from './flare.item'
import { BaseItem } from './base.item'
import { ItemType } from './item.types'
import { Medkit } from './medkit.item'
import { Ammo } from "./ammo.item";

export class ItemService {
  private readonly ExecutionEntities = new Map<ItemType, BaseItem>()

  constructor() {
    const items = [new Medkit(), new Armor(), new Ammo(), new Flare()]

    for (const item of items) {
      this.ExecutionEntities.set(item.type, item)
    }
  }

  getExecutionEntity(type: ItemType): BaseItem {
    const executionEntity = this.ExecutionEntities.get(type)
    if (!executionEntity) throw new Error('Неизвестный тип предмета')
    return executionEntity
  }
}
