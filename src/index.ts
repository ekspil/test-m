import {ItemService} from './items/item.service'
import {TempStorage} from './storage/storage.service'
import {CoreService} from './core/core.service'
import {GameConfig} from "./config/game.config";
import {wait} from "./utils/wait";



export async function app(): Promise<CoreService> {
  const storage = new TempStorage()
  const items = new ItemService()

  return new CoreService(storage, items)
}

async function init(): Promise<void> {
  const core = await app()

  //Нормальное создание уже поленился сделать
  await core.addTestPlayers()

  //Изначально в планах было CLI сделать для отправки команд, но пот ТЗ вроде как тестов достаточно, но пусть будет
  while (true) {
    const startedAt = Date.now()
    await core.tick()

    const idleTime = GameConfig.tickIntervalMs - (Date.now() - startedAt)
    if (idleTime > 0) {
      await wait(idleTime)
    }
  }
}


init()


