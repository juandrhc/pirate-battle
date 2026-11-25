
import { Application } from 'pixi.js'
import { createBattle, type BattleStats } from './battle'
import { listenToKeyboard } from './keyboard'
import type { IsActionPressed } from './keyboard'
import { createBattleTextures, loadBattleSheets } from './textures'
import type { BattleTextures } from './textures'

export async function startPirateGame(
  host: HTMLDivElement,
  signal: AbortSignal,
  onStatsChange: (stats: BattleStats) => void,
  isPaused: () => boolean,
  matchDuration: number = 120,
  isTouchPressed: IsActionPressed = () => false,
) {

  // PT Carrega as folhas de sprites compartilhadas antes de criar o renderizador da arena.
  // EN Load the shared sprite sheets before creating the arena renderer.
  const sheets = await loadBattleSheets()
  if (signal.aborted) return

  const app = new Application()
  let textures: BattleTextures | undefined
  let started = false

  function destroy() {
    if (app.renderer) {
      app.destroy(
        { removeView: true },
        { children: true, context: true }
      )
    } else {
      app.stage.destroy()
    }

    // PT Cada montagem possui seus recortes de textura.
    //    O gerenciador Assets mantém as folhas compartilhadas.
    // EN Each mount owns its cropped textures.
    //    The Assets manager keeps the shared sheets.
    if (textures) {
      for (const texture of Object.values(textures)) {
        texture.destroy()
      }
    }
  }

  try {
    await app.init({
      resizeTo: host,
      background: '#12638f',
      antialias: true,
      resolution: Math.min(window.devicePixelRatio, 2),
      autoDensity: true,
      autoStart: false,
    })

    // PT O PixiJS pode terminar a inicialização depois que o React desmonta a arena.
    // EN PixiJS can finish initializing after React has unmounted the arena.
    if (signal.aborted) return

    textures = createBattleTextures(...sheets)

    
    // PT Captura os comandos do teclado.
    // EN Capture keyboard input.
    const isKeyboardPressed = listenToKeyboard(signal)

    // PT Combina os controles de teclado e toque.
    // EN Combine keyboard and touch controls.
    const isPressed: IsActionPressed = (action) => {
      return isKeyboardPressed(action) || isTouchPressed(action)
    }


    // PT Cria a batalha e recebe sua função de atualização.
    // EN Creates the battle and receives its update function.
    const updateBattle = createBattle(
      app.stage,
      app.screen,
      textures,
      isPressed,
      onStatsChange,
      isPaused,
      matchDuration,
    )

    if (signal.aborted) return

    // PT Registra a atualização da batalha no ticker.
    // EN Registers the battle update in the ticker.
    app.ticker.add(updateBattle)

    host.append(app.canvas)

    app.start()

    signal.addEventListener('abort', destroy, { once: true })

    started = true

  } finally {
    if (!started) destroy()
  }
}
