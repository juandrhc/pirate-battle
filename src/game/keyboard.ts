const KEY_BINDINGS = {
  advance: ['KeyW', 'ArrowUp'],
  turnLeft: ['KeyA', 'ArrowLeft'],
  turnRight: ['KeyD', 'ArrowRight'],
  fireFront: ['Space'],
  fireLeft: ['KeyQ'],
  fireRight: ['KeyE'],
} as const

const GAME_KEYS = new Set<string>(Object.values(KEY_BINDINGS).flat())

export type IsActionPressed = (action: keyof typeof KEY_BINDINGS) => boolean

export function listenToKeyboard(signal: AbortSignal): IsActionPressed {
  const pressedKeys = new Set<string>()

  window.addEventListener(
    'keydown',
    (event) => {
      if (!GAME_KEYS.has(event.code)) return

      event.preventDefault()
      pressedKeys.add(event.code)
    },
    { signal }
  )

  window.addEventListener(
    'keyup',
    (event) => {
      pressedKeys.delete(event.code)
    },
    { signal }
  )

  // PT Ao perder o foco, a janela pode deixar de receber o evento de soltura da tecla
  //    e manter o comando ativo.
  // EN When the window loses focus, it can miss a keyup event and leave a control active.
  window.addEventListener('blur', () => pressedKeys.clear(), { signal })

  return (action) => KEY_BINDINGS[action].some((key) => pressedKeys.has(key))
}
