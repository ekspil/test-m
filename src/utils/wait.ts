import {GameConfig} from "../config/game.config";


export async function wait(timeMs?: number): Promise<void> {
    const delay = timeMs ?? GameConfig.storageDelayMs
    if (delay > 0) {
    await new Promise(resolve => setTimeout(resolve, delay ))
}
}