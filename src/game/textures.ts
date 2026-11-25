import { Assets, Rectangle, Texture } from 'pixi.js'

const ASSET_DIRECTORY = `${import.meta.env.BASE_URL}assets/`
const SHIP_SHEET_URL = `${ASSET_DIRECTORY}ships_miscellaneous_sheet.png`
const ISLAND_SHEET_URL = `${ASSET_DIRECTORY}tiles_sheet.png`

let pendingSheets: Promise<Record<string, Texture>> | undefined

export type BattleTextures = {
  player: Texture
  chaser: Texture
  cannonball: Texture
  island: Texture
}

export async function loadBattleSheets() {
  // PT Montagens simultâneas compartilham o primeiro carregamento
  //    e a inicialização do gerenciador de recursos do PixiJS.
  // EN Concurrent mounts share the first load
  //    and the initialization of the PixiJS asset manager.
  pendingSheets ??= Assets.load<Texture>([SHIP_SHEET_URL, ISLAND_SHEET_URL]).finally(() => {
    pendingSheets = undefined
  })

  const sheets = await pendingSheets
  return [sheets[SHIP_SHEET_URL], sheets[ISLAND_SHEET_URL]] as const
}

export function createBattleTextures(ships: Texture, tiles: Texture): BattleTextures {
  // PT As coordenadas dos recortes são medidas em pixels
  //    a partir do canto superior esquerdo de cada folha de sprites.
  // EN Frame coordinates are measured in pixels from the top-left of each sprite sheet.
  return {
    player: createFrame(ships, 408, 0, 66, 113),
    chaser: createFrame(ships, 408, 115, 66, 113),
    cannonball: createFrame(ships, 120, 29, 10, 10),
    island: createFrame(tiles, 322, 2, 252, 252),
  }
}

function createFrame(sheet: Texture, x: number, y: number, width: number, height: number) {
  return new Texture({ source: sheet.source, frame: new Rectangle(x, y, width, height) })
}
