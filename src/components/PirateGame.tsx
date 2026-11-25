
import { useEffect, useRef, useState, useCallback } from 'react'
import type { BattleStats } from '../game/battle'
import { startPirateGame } from '../game/startPirateGame'
import './PirateGame.css'
import type { IsActionPressed } from '../game/keyboard'
import type { PointerEvent } from 'react'


type TouchAction = Parameters<IsActionPressed>[0]

const TOUCH_CONTROLS: {
  action: TouchAction
  label: string
  symbol: string
}[] = [
  { action: 'turnLeft', label: 'Turn left', symbol: '↶' },
  { action: 'advance', label: 'Advance', symbol: '↑' },
  { action: 'turnRight', label: 'Turn right', symbol: '↷' },
  { action: 'fireLeft', label: 'Fire left', symbol: 'L' },
  { action: 'fireFront', label: 'Fire front', symbol: '●' },
  { action: 'fireRight', label: 'Fire right', symbol: 'R' },
]


// PT Define as propriedades recebidas pelo componente.
// EN Define the properties received by the component.
type PirateGameProps = {
  matchDuration?: number
}

export default function PirateGame(
  { matchDuration = 120 }: PirateGameProps
) {


  const canvasHost = useRef<HTMLDivElement>(null)

  const [stats, setStats] = useState<BattleStats | null>(null)
  const [failedToStart, setFailedToStart] = useState(false)

  // PT Estado de pausa da partida.
  // EN Match pause state.
  const [paused, setPaused] = useState(false)
  const pausedRef = useRef(false)
  const touchActions = useRef(new Map<number, TouchAction>())
  const [matchId, setMatchId] = useState(0)

  // PT Alterna entre pausa e partida em andamento.
  // EN Toggle between paused and running states.
  
  const togglePause = useCallback(() => {
    const nextPaused = !pausedRef.current

    touchActions.current.clear()

    pausedRef.current = nextPaused
    setPaused(nextPaused)
  }, [])


// PT Reinicia a partida.
// EN Restart the match.

function restartGame() {
  touchActions.current.clear()

  pausedRef.current = false
  setPaused(false)
  setStats(null)
  setFailedToStart(false)
  setMatchId(previousId => previousId + 1)
}



// PT Registra uma ação quando o botão é pressionado.
// EN Register an action when the button is pressed.
function pressTouch(
  event: PointerEvent<HTMLButtonElement>,
  action: TouchAction,
) {
  if (pausedRef.current || event.button !== 0) return

  event.preventDefault()

  event.currentTarget.setPointerCapture(event.pointerId)

  touchActions.current.set(event.pointerId, action)
}

// PT Remove a ação quando o botão é solto.
// EN Remove the action when the button is released.
function releaseTouch(
  event: PointerEvent<HTMLButtonElement>,
) {
  touchActions.current.delete(event.pointerId)
}


  

  // PT Inicializa a arena do PixiJS.
  // EN Initialize the PixiJS arena.
  useEffect(() => {
    const host = canvasHost.current
    if (!host) return

    const lifetime = new AbortController()
    
      
    void startPirateGame(
      host,
      lifetime.signal,
      setStats,
      () => pausedRef.current,
      matchDuration,
      (action) => Array.from(touchActions.current.values()).includes(action),
    ).catch((error: unknown) => {



      if (lifetime.signal.aborted) return

      lifetime.abort()
      console.error('Failed to start Pirate Battle:', error)
      setStats(null)
      setFailedToStart(true)
    })

    
return () => lifetime.abort()
}, [matchId, matchDuration])


  
// PT Controla a pausa manual e automática.
// EN Control manual and automatic pause.
useEffect(() => {
  if (stats?.status !== 'playing' || failedToStart) return

  function handleEscape(event: KeyboardEvent) {
    if (event.key === 'Escape' && !event.repeat) {
      togglePause()
    }
  }

  // PT Pausa a partida automaticamente.
  // EN Automatically pause the match.
  function autoPause() {
  touchActions.current.clear()
  pausedRef.current = true
  setPaused(true)
}

  // PT Verifica se a aba está oculta.
  // EN Check if the tab is hidden.
  function handleVisibilityChange() {
    if (document.hidden) {
      autoPause()
    }
  }

  window.addEventListener('keydown', handleEscape)
  window.addEventListener('blur', autoPause)

  document.addEventListener(
    'visibilitychange',
    handleVisibilityChange
  )

  // Pause if the window is already inactive.
  if (document.hidden || !document.hasFocus()) {
    autoPause()
  }

  return () => {
    window.removeEventListener('keydown', handleEscape)
    window.removeEventListener('blur', autoPause)

    document.removeEventListener(
      'visibilitychange',
      handleVisibilityChange
    )
  }

}, [stats?.status, failedToStart, togglePause])


  return (
    <main aria-label="Pirate Battle game arena">

      {/* Match HUD */}
      {stats && (
        <dl className="game-hud">

          <div className="game-hud-item">
            <dt>Score</dt>
            <dd>{stats.score}</dd>
          </div>

          <div className="game-hud-item">
            <dt>Health</dt>
            <dd>{stats.health}</dd>
          </div>

          <div className="game-hud-item">
            <dt>Time left</dt>
            <dd>{formatTime(stats.timeLeft)}</dd>
          </div>

        </dl>
      )}

      {/* Pause controls */}
      {stats?.status === 'playing' && !failedToStart && (
        <div className="game-controls">
          <button
            type="button"
            className="pause-button"
            onClick={togglePause}
          >
            {paused ? 'Resume Game' : 'Pause Game'}
          </button>
        </div>
      )}

      {/* Loading message */}
      {!stats && !failedToStart && (
        <p className="game-loading" role="status">
          Loading game…
        </p>
      )}

      {/* PixiJS arena */}
      <div className="game-wrapper">

        <div
          ref={canvasHost}
          className="game-arena"
          hidden={failedToStart}
        />

        {/* Pause overlay */}
        {paused && stats?.status === 'playing' && !failedToStart && (
          <div className="pause-overlay">

            <h2>Game Paused</h2>

            <button
              type="button"
              className="pause-button"
              onClick={togglePause}
            >
              Resume Game
            </button>

          </div>
        )}

      </div>

{/* Mobile controls */}
{stats?.status === 'playing' && !paused && !failedToStart && (
  <div className="touch-controls">

    {TOUCH_CONTROLS.map((control) => (
      <button
        key={control.action}
        type="button"
        className="touch-button"
        aria-label={control.label}
        onPointerDown={(event) =>
          pressTouch(event, control.action)
        }
        onPointerUp={releaseTouch}
        onPointerCancel={releaseTouch}
        onLostPointerCapture={releaseTouch}
        onContextMenu={(event) => event.preventDefault()}
      >
        <span>{control.symbol}</span>
        <small>{control.label}</small>
      </button>
    ))}

  </div>
)}

      
{/* Match result */}
{stats && stats.status !== 'playing' && (
  <div className="game-result">

    <h2>Game Over</h2>

    <p role="status">
      {stats.status === 'timeUp'
        ? 'Time is up!'
        : 'Your ship was defeated.'}
    </p>

    <p>Final Score: {stats.score}</p>

    <button
      type="button"
      className="pause-button"
      onClick={restartGame}
    >
      Restart Game
    </button>

  </div>
)}


      {/* Error message */}
      {failedToStart && (
        <p className="game-error" role="alert">
          The game could not start. Reload the page to try again.
        </p>
      )}

    </main>
  )
}

// PT Formata o tempo em minutos e segundos.
// EN Format time in minutes and seconds.
function formatTime(seconds: number) {
  const minutes = String(Math.floor(seconds / 60)).padStart(2, '0')
  const remainingSeconds = String(seconds % 60).padStart(2, '0')

  return `${minutes}:${remainingSeconds}`
}
