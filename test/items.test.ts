import assert from 'node:assert/strict'
import test from 'node:test'
import { CoreService } from '../src/core/core.service'
import type { IPlayer } from '../src/core/core.types'
import type { IItemInstance } from '../src/items/item.types'
import { ItemService } from '../src/items/item.service'
import { ItemType } from '../src/items/item.types'
import { GameConfig } from '../src/config/game.config'
import { TempStorage } from '../src/storage/storage.service'

function section(title: string): void {
  console.log(`\n${title}`)
}

function playerLine(player: IPlayer): string {
  const effects = player.persistedEffects
    .map(effect => `${effect.type} до тика ${effect.expirationTick}`)
    .join(', ') || 'нет'

  return `Игрок ${player.id}: позиция [${player.position.join(', ')}], здоровье ${player.health}, броня ${player.armor}, патроны ${player.ammo}, Подсвечен ${player.visible ? 'да' : 'нет'}, эффекты ${effects}`
}

function printPlayer(title: string, player: IPlayer): void {
  section(title)
  console.log(playerLine(player))
}

function printPlayers(title: string, players: IPlayer[]): void {
  section(title)
  for (const player of players) {
    console.log(playerLine(player))
  }
}

function printInventory(title: string, items: IItemInstance[]): void {
  section(title)
  if (items.length === 0) {
    console.log('пусто')
    return
  }

  for (const item of items) {
    console.log(`${item.type} #${item.id}`)
  }
}

function resultText(result: PromiseSettledResult<void>): string {
  if (result.status === 'fulfilled') return 'выполнено'
  return result.reason instanceof Error ? result.reason.message : String(result.reason)
}

function printPlayerResults(
  title: string,
  rows: Array<{ playerId: number, result: PromiseSettledResult<void>, attempt?: number }>,
): void {
  section(title)
  for (const row of rows) {
    const attempt = row.attempt === undefined ? '' : `, использование ${row.attempt}`
    console.log(`Игрок ${row.playerId}${attempt}: ${resultText(row.result)}`)
  }
}

async function stage(action: string): Promise<void> {
  console.log('\n---------------------------------')
  await new Promise(resolve => setTimeout(resolve, 4000))
  console.log(`\n${action}`)
}

test('игроки используют все предметы, два из них дважды, затем flare по тикам', async () => {
  const storage = new TempStorage()
  const core = new CoreService(storage, new ItemService())

  await core.addTestPlayers()
  const created = await storage.getPlayers()
  assert.equal(created.length, 4)
  printPlayers('Игроки после создания', created)

  const playerId = created[0].id
  const secondPlayerId = created[1].id
  const medkit = await core.giveItem(playerId, ItemType.Medkit)
  const armor = await core.giveItem(playerId, ItemType.Armor)
  const firstAmmo = await core.giveItem(playerId, ItemType.Ammo)
  const secondAmmo = await core.giveItem(playerId, ItemType.Ammo)
  const flare = await core.giveItem(playerId, ItemType.Flare)

  assert.ok(medkit)
  assert.ok(armor)
  assert.ok(firstAmmo)
  assert.ok(secondAmmo)
  assert.ok(flare)

  await stage(`Действие: игрок ${playerId} использует аптечку`)
  await core.useItem(playerId, medkit.id)
  const afterMedkit = await storage.getPlayer(playerId)
  assert.ok(afterMedkit)
  printPlayer(`Игрок ${playerId} после аптечки`, afterMedkit)
  assert.equal(afterMedkit.health, GameConfig.healthMax)

  await stage(`Действие: игрок ${playerId} дважды использует броню`)
  const beforeArmor = await storage.getPlayer(playerId)
  assert.ok(beforeArmor)
  printPlayer(`Игрок ${playerId} до использования брони`, beforeArmor)
  const armorUses = await Promise.allSettled([
    core.useItem(playerId, armor.id),
    core.useItem(playerId, armor.id),
  ])
  printPlayerResults('Результат двойного использования брони', [
    { playerId, result: armorUses[0], attempt: 1 },
    { playerId, result: armorUses[1], attempt: 2 },
  ])
  const afterArmor = await storage.getPlayer(playerId)
  assert.ok(afterArmor)
  printPlayer(`Игрок ${playerId} после использования брони`, afterArmor)
  assert.equal(armorUses.filter(result => result.status === 'fulfilled').length, 1)
  assert.equal(armorUses.filter(result => result.status === 'rejected').length, 1)
  assert.equal(
    afterArmor.armor,
    Math.min(GameConfig.armorMax, beforeArmor.armor + GameConfig.armorBonus),
  )

  await stage(`Действие: игрок ${playerId} дважды использует патроны #${firstAmmo.id}`)
  const beforeAmmo = await storage.getPlayer(playerId)
  assert.ok(beforeAmmo)
  printPlayer(`Игрок ${playerId} до использования патронов`, beforeAmmo)
  const ammoUses = await Promise.allSettled([
    core.useItem(playerId, firstAmmo.id),
    core.useItem(playerId, firstAmmo.id),
  ])
  printPlayerResults('Результат двойного использования патронов', [
    { playerId, result: ammoUses[0], attempt: 1 },
    { playerId, result: ammoUses[1], attempt: 2 },
  ])
  const afterAmmo = await storage.getPlayer(playerId)
  assert.ok(afterAmmo)
  printPlayer(`Игрок ${playerId} после использования патронов`, afterAmmo)
  assert.equal(ammoUses.filter(result => result.status === 'fulfilled').length, 1)
  assert.equal(ammoUses.filter(result => result.status === 'rejected').length, 1)
  assert.equal(
    afterAmmo.ammo,
    Math.min(GameConfig.ammoMax, beforeAmmo.ammo + GameConfig.ammoBonus),
  )

  await stage(`Действие: игрок ${playerId} выбрасывает патроны #${secondAmmo.id}`)
  const beforeDrop = await core.getInventory(playerId)
  printInventory(`Инвентарь игрока ${playerId} до выброса`, beforeDrop)
  await core.dropItem(playerId, secondAmmo.id)
  const afterDrop = await core.getInventory(playerId)
  printInventory(`Инвентарь игрока ${playerId} после выброса`, afterDrop)
  assert.equal(afterDrop.some(item => item.id === secondAmmo.id), false)

  await stage(`Действие: игрок ${playerId} подбирает патроны #${secondAmmo.id}`)
  await core.pickupItem(playerId, secondAmmo.id)
  const afterPickup = await core.getInventory(playerId)
  printInventory(`Инвентарь игрока ${playerId} после подбора`, afterPickup)
  assert.equal(afterPickup.some(item => item.id === secondAmmo.id), true)

  await stage(`Действие: игрок ${playerId} снова выбрасывает патроны #${secondAmmo.id}`)
  await core.dropItem(playerId, secondAmmo.id)
  const afterSecondDrop = await core.getInventory(playerId)
  printInventory(`Инвентарь игрока ${playerId} после второго выброса`, afterSecondDrop)
  assert.equal(afterSecondDrop.some(item => item.id === secondAmmo.id), false)

  await stage(`Действие: игрок ${playerId} и игрок ${secondPlayerId} одновременно подбирают патроны #${secondAmmo.id}`)
  const pickupRace = await Promise.allSettled([
    core.pickupItem(playerId, secondAmmo.id),
    core.pickupItem(secondPlayerId, secondAmmo.id),
  ])
  printPlayerResults('Результат одновременного подбора', [
    { playerId, result: pickupRace[0] },
    { playerId: secondPlayerId, result: pickupRace[1] },
  ])

  const firstInventory = await core.getInventory(playerId)
  const secondInventory = await core.getInventory(secondPlayerId)
  printInventory(`Инвентарь игрока ${playerId} после одновременного подбора`, firstInventory)
  printInventory(`Инвентарь игрока ${secondPlayerId} после одновременного подбора`, secondInventory)
  assert.equal(pickupRace.filter(result => result.status === 'fulfilled').length, 1)
  assert.equal(pickupRace.filter(result => result.status === 'rejected').length, 1)
  assert.equal(
    [firstInventory, secondInventory].filter(items => items.some(item => item.id === secondAmmo.id)).length,
    1,
  )

  await stage(`Действие: игрок ${playerId} выбрасывает flare #${flare.id}`)
  section(`Действие: проверка исчезновения flare #${flare.id} после ${GameConfig.dropDeleteTicks} тиков`)
  await core.dropItem(playerId, flare.id)
  const flareOnGround = await storage.getItemFromGround(flare.id)
  section(`Предмет flare #${flare.id} на земле: ${flareOnGround ? 'да' : 'нет'}`)
  assert.ok(flareOnGround)
  const afterFlareDrop = await storage.getPlayers()
  printPlayers('Игроки сразу после выброса flare', afterFlareDrop)
  assert.deepEqual(
    afterFlareDrop.map(player => player.visible),
    [true, true, true, false],
  )

  for (let step = 1; step <= GameConfig.dropDeleteTicks + 1; step += 1) {
    await core.tick()
    if (step <= GameConfig.flareTicks + 2) {
      printPlayers(`Игроки после тика ${step}`, await storage.getPlayers())
    }

    const stillOnGround = await storage.getItemFromGround(flare.id)
    section(`Тик ${step}: flare #${flare.id} на земле: ${stillOnGround ? 'да' : 'нет'}`)
    if (step === GameConfig.dropDeleteTicks) assert.ok(stillOnGround)
    if (step === GameConfig.dropDeleteTicks + 1) assert.equal(stillOnGround, null)
  }

  const afterFlare = await storage.getPlayers()
  assert.deepEqual(
    afterFlare.map(player => player.visible),
    [false, false, false, false],
  )
  assert.deepEqual(
    afterFlare.map(player => player.persistedEffects.length),
    [0, 0, 0, 0],
  )
})
