
import { useState } from 'react'
import PirateGame from './components/PirateGame'
import './Menu.css'

// PT Define as telas disponíveis.
// EN Define the available screens.
type Screen = 'menu' | 'game' | 'options' | 'leaderboard'

export default function App() {

  const [screen, setScreen] = useState<Screen>('menu')

  const [matchDuration, setMatchDuration] = useState<number>(() => {
    try {
      const savedDuration = localStorage.getItem('pirate-match-duration')
      const duration = Number(savedDuration)

      if (
        Number.isInteger(duration) &&
        duration >= 60 &&
        duration <= 180
      ) {
        return duration
      }
    } catch (error) {
      console.warn('Could not load match duration:', error)
    }

    return 120
  })


  // PT Atualiza e salva a duração da partida.
  // EN Update and save the match duration.
  function changeDuration(duration: number) {
    setMatchDuration(duration)

    try {
      localStorage.setItem(
        'pirate-match-duration',
        String(duration)
      )
    } catch (error) {
      console.warn('Could not save match duration:', error)
    }
  }



  // GAME
  if (screen === 'game') {
    return (
      <>
        <div className="menu-topbar">
          <button
            type="button"
            className="menu-button"
            onClick={() => setScreen('menu')}
          >
            Back to Main Menu
          </button>
        </div>

        <PirateGame matchDuration={matchDuration} />
      </>
    )
  }

 
// OPTIONS
if (screen === 'options') {
  return (
    <main className="menu-screen">

      <h1>Options</h1>

      <div className="options-panel">

        <label htmlFor="match-duration">
          Match Duration
        </label>

        <strong className="duration-value">
          {matchDuration} seconds
        </strong>

        <input
          id="match-duration"
          type="range"
          min={60}
          max={180}
          step={1}
          value={matchDuration}
          onChange={(event) =>
            changeDuration(Number(event.target.value))
          }
        />

        <div className="duration-limits">
          <span>60s</span>
          <span>180s</span>
        </div>

      </div>

      <button
        type="button"
        className="menu-button"
        onClick={() => setScreen('menu')}
      >
        Back to Main Menu
      </button>

    </main>
  )
}


  // LEADERBOARD
  if (screen === 'leaderboard') {
    return (
      <main className="menu-screen">

        <h1>Leaderboard</h1>

        <p>Player rankings</p>

        <button
          type="button"
          className="menu-button"
          onClick={() => setScreen('menu')}
        >
          Back to Main Menu
        </button>

      </main>
    )
  }

  // MAIN MENU
  return (
    <main className="menu-screen">

      <div className="menu-heading">
        <h1>Pirate Battle</h1>
        <p>Rule the seas</p>
      </div>

      <nav className="menu-navigation" aria-label="Main menu">

        <button
          type="button"
          className="menu-button menu-button-primary"
          onClick={() => setScreen('game')}
        >
          Play Game
        </button>

        <button
          type="button"
          className="menu-button"
          onClick={() => setScreen('options')}
        >
          Options
        </button>

        <button
          type="button"
          className="menu-button"
          onClick={() => setScreen('leaderboard')}
        >
          Leaderboard
        </button>

      </nav>

    </main>
  )
}
