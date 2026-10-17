import { GameConfig } from '../config/game.config'
import { ItemService } from '../items/item.service'
import { IItemInstance } from '../items/item.types'
import { ItemType } from '../items/item.types'
import { distance } from '../utils/distance'
import {TempStorage} from "../storage/storage.service";
import {IPersistedEffect} from "./core.types";

export class CoreService {
  private currentTick = 0
  private nextItemId = 1
  private queueOfOperationsWithItems = new Set<number>()

  constructor(
    private readonly storage: TempStorage,
    private readonly items: ItemService,
  ) {


  }

  async addTestPlayers(

  ): Promise<void> {
    for( let i = 1; i < 5; i++){
      await this.storage.addPlayer({
        id: i,
        position: [i, i],
        health: 55,
        armor: 55,
        ammo: 20,
        visible: false,
        persistedEffects: []
      })
    }

  }



  async giveItem(
    playerId: number,
    itemType: ItemType,
  ): Promise<IItemInstance | undefined> {
    try {

      await this.storage.getPlayer(playerId)

      this.items.getExecutionEntity(itemType)

      const item: IItemInstance = {
        id: this.nextItemId++,
        type: itemType,
        playerId
      }

      await this.storage.addItem(playerId, item)
      return item
    }
    catch (e) {
      if(e instanceof Error){
        console.log(e.message)
      }
    }
  }

  async dropItem(playerId: number, itemId: number): Promise<void> {
    try {
      if (this.queueOfOperationsWithItems.has(itemId)) throw new Error('Кто то начал взаимодействовать с предметом раньше вас')
      this.queueOfOperationsWithItems.add(itemId)

      const player = await this.storage.getPlayer(playerId)
      if (!player) throw new Error('Игрока не существует')
      const item = await this.storage.getItemFromInventory(playerId, itemId)
      if (!item) throw new Error('Предмета нет в инвентаре')

      item.expiresAt = this.currentTick + GameConfig.dropDeleteTicks
      item.playerId = undefined
      item.position = player.position

      await this.storage.updateItem(item)

      const players = await this.storage.getPlayers()
      this.items.getExecutionEntity(item.type).onDrop(
          item.position,
          players,
          this.currentTick
      )

      for (const currentPlayer of players) {
        await this.storage.updatePlayer(currentPlayer)
      }

    }
    finally {
      this.queueOfOperationsWithItems.delete(itemId)
    }

  }

  async pickupItem(playerId: number, itemId: number): Promise<void> {
    try {
      if(this.queueOfOperationsWithItems.has(itemId)) throw new Error('Кто то начал взаимодействовать с предметом раньше вас')
      this.queueOfOperationsWithItems.add(itemId)

      const player = await this.storage.getPlayer(playerId)
      if (!player) throw new Error('Ошибка при определении игрока')
      const found = await this.storage.getItemFromGround(itemId)

      if (!found || !found.position) throw new Error('Предмет уже забрали или он не существует в мире')
      if (distance(player.position, found.position) > GameConfig.nearRadius) {
        throw new Error('Предмет слишком далеко')
      }
      found.position = undefined
      found.playerId = playerId

      const item = await this.storage.updateItem(found)
      if (!item) throw new Error('Предмет уже забрали или он исчез')

      this.items.getExecutionEntity(item.type).onPickup(player)
      await this.storage.updatePlayer(player)

    }
    finally {
      this.queueOfOperationsWithItems.delete(itemId)
    }

  }

  async useItem(playerId: number, itemId: number): Promise<void> {

    try {
      if (this.queueOfOperationsWithItems.has(itemId)) throw new Error('Кто то начал взаимодействовать с предметом раньше вас')
      this.queueOfOperationsWithItems.add(itemId)

      const player = await this.storage.getPlayer(playerId)

      if (!player) throw new Error('Ошибка при определении игрока')
      const item = await this.storage.getItemFromInventory(playerId, itemId)
      if (!item) throw new Error('Предмета нет в инвентаре')

      const executionEntity = this.items.getExecutionEntity(item.type)
      if (!executionEntity.canUse) throw new Error('Этот предмет нельзя использовать')

      executionEntity.onUse(player, item)

      await Promise.all([this.storage.removeItem(item), this.storage.updatePlayer(player)])

    }
    finally {
      this.queueOfOperationsWithItems.delete(itemId)
    }

  }

  async getInventory(playerId: number): Promise<IItemInstance[]> {
    return this.storage.getInventory(playerId)
  }


  async tick(): Promise<void> {
    this.currentTick += 1
    await this.storage.removeExpiredItems(this.currentTick)

    const players = await this.storage.getPlayers()
    for (const player of players) {

      const notEndedEffects: IPersistedEffect[] = []
      for (const effect of player.persistedEffects) {
        const executionEntity = this.items.getExecutionEntity(effect.type)

        if (effect.expirationTick < this.currentTick) {
          executionEntity.onEnd(player)
        }
        else {
          notEndedEffects.push(effect)
        }
      }

      player.persistedEffects = notEndedEffects
      await this.storage.updatePlayer(player)
    }
  }
}


