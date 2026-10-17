import {ItemService} from './items/item.service'
import {TempStorage} from './storage/storage.service'
import {CoreService} from './core/core.service'

export async function app(): Promise<CoreService> {
  const storage = new TempStorage()
  const items = new ItemService()

  return new CoreService(storage, items)


}

