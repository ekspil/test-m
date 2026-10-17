import { IItemInstance } from '../items/item.types'
import { IPlayer } from '../core/core.types'
import { wait } from "../utils/wait";

export class TempStorage {
  private players : IPlayer[] = []
  private items: IItemInstance[] = []

  constructor() {}




  async addPlayer(player: IPlayer): Promise<IPlayer> {
    await wait()
    const blockItem = this.players.find((i) => i.id === player.id)
    if (blockItem) throw new Error("Игрок с таким ИД уже существует")
    this.players.push(player)
    return {...player}
  }


  async getPlayers(): Promise<IPlayer[]> {
    await wait()
    return [...this.players]
  }
  async getPlayer(id: number): Promise<IPlayer | null> {
    await wait()
    const player = this.players.find(i=>i.id === id)
    if(!player) return null
    return {...player}
  }

  async getInventory(playerId: number): Promise<IItemInstance[]> {
    await wait()
    return [...this.items.filter(item => item.playerId === playerId)]
  }

  async addItem(playerId: number, item: IItemInstance): Promise<void> {
    await wait()
    const blockItem = this.items.find((i) => i.id === item.id)
    if (blockItem) throw new Error("Предмет с таким ИД уже существует")
    item.playerId = playerId
    this.items.push(item)
  }

  async removeItem(item: IItemInstance): Promise<void> {
    await wait()
    this.items = this.items.filter(i => i.id !== item.id)
  }

  async updateItem(item: IItemInstance): Promise<IItemInstance | null> {
    await wait()
    let result = null
    this.items = this.items.map( i => {
      if(i.id === item.id) {
        result = item
        return Object.assign(i, item)
      }
      return i
    })
    return result
  }

  async updatePlayer(player: IPlayer): Promise<IPlayer | null> {
    await wait()
    let result = null
    this.players = this.players.map( i => {
      if(i.id === player.id) {
        result = player
        return Object.assign(i, player)
      }
      return i
    })
    return result
  }

  async getItemFromInventory(playerId: number, itemId: number): Promise<IItemInstance | null> {
    await wait()
    const item = this.items.find(i=> i.id === itemId && i.playerId === playerId)
    if(!item) return null
    return {...item}

  }

  async getItemFromGround(itemId: number): Promise<IItemInstance | null> {

    await wait()

    const item =  this.items.find(item => item.id === itemId && !item.playerId && item.position)
    if(!item) return null
    return {...item}


  }


  async removeExpiredItems(currentTick: number): Promise<void> {
    await wait()
    this.items = this.items.filter(item => !(item.expiresAt && item.expiresAt < currentTick))
  }
}
