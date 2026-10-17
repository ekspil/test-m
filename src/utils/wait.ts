import {GameConfig} from "../config/game.config";


export async function wait(): Promise<void> {
    if (GameConfig.storageDelayMs > 0) {
    await new Promise(resolve => setTimeout(resolve, GameConfig.storageDelayMs ))
}
}