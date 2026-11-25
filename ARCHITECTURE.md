```
     _ _   _ _   _  ____ _     _____
    | | | | | \ | |/ ___| |   | ____|
 _  | | | | |  \| | |  _| |   |  _|
| |_| | |_| | |\  | |_| | |___| |___
 \___/ \___/|_| \_|\____|_____|_____|

              G A M I N G

        FRONTEND GAME DEVELOPER
           TECHNICAL CHALLENGE
```

# Pirate Battle — Architecture

## 🇧🇷 Português

### Organização do projeto

A estrutura do jogo foi desenvolvida gradualmente, procurando separar a interface das mecânicas de combate.

O React controla as telas, configurações e informações da partida. O PixiJS é responsável pela renderização da arena e pela simulação do jogo.

### Estrutura

```
src/
├── components/
│   ├── PirateGame.tsx
│   └── PirateGame.css
├── game/
│   ├── battle.ts
│   ├── keyboard.ts
│   ├── startPirateGame.ts
│   └── textures.ts
├── App.tsx
├── Menu.css
├── App.css
├── index.css
└── main.tsx
```

| Arquivo | Responsabilidade |
|---|---|
| App.tsx | Navegação e configurações. |
| PirateGame.tsx | HUD, pausa, reinício e controles mobile. |
| startPirateGame.ts | Inicialização e gerenciamento do PixiJS. |
| battle.ts | Mecânicas de combate e game loop. |
| keyboard.ts | Captura dos comandos do teclado. |
| textures.ts | Carregamento e recorte dos sprites. |
| Arquivos CSS | Interface e responsividade. |

### Comunicação entre React e PixiJS

O React envia as configurações da partida através de props e parâmetros de funções.

O PixiJS utiliza callbacks para informar ao React alterações na vida, pontuação, tempo restante e estado da partida.

### Game loop

O ticker do PixiJS controla a movimentação, os disparos, as colisões, os inimigos e o cronômetro.

O delta time é utilizado nos cálculos para reduzir a dependência da taxa de frames.

### Estado e controles

- **useState:** informações apresentadas na interface.
- **useRef:** estado de pausa e comandos dos controles virtuais.
- **useEffect:** inicialização do jogo e gerenciamento de eventos.
- **Pointer Events e Map:** suporte a ações simultâneas no mobile.
- **AbortController:** limpeza de recursos e eventos ao reiniciar ou sair da partida.
- **LocalStorage:** armazenamento da duração escolhida pelo jogador.

### Limitações

O projeto funciona inteiramente no lado do cliente. As integrações com APIs, ranking, histórico de partidas e testes automatizados ainda não foram implementadas.

---

## 🇺🇸 English

### Project organization

The game structure was developed gradually, keeping the user interface separate from combat mechanics.

React manages screens, settings and match information. PixiJS handles arena rendering and game simulation.

### Structure

```
src/
├── components/
│   ├── PirateGame.tsx
│   └── PirateGame.css
├── game/
│   ├── battle.ts
│   ├── keyboard.ts
│   ├── startPirateGame.ts
│   └── textures.ts
├── App.tsx
├── Menu.css
├── App.css
├── index.css
└── main.tsx
```

| File | Responsibility |
|---|---|
| App.tsx | Navigation and settings. |
| PirateGame.tsx | HUD, pause, restart and mobile controls. |
| startPirateGame.ts | PixiJS initialization and management. |
| battle.ts | Combat mechanics and game loop. |
| keyboard.ts | Keyboard input handling. |
| textures.ts | Sprite loading and texture cropping. |
| CSS files | Interface and responsive layout. |

### React and PixiJS communication

React passes match settings through props and function parameters.

PixiJS uses callbacks to notify React about changes in health, score, remaining time and match status.

### Game loop

The PixiJS ticker manages movement, cannon attacks, collisions, enemies and the match timer.

Delta time is used in calculations to reduce frame rate dependency.

### State and controls

- **useState:** information displayed in the interface.
- **useRef:** pause state and virtual control inputs.
- **useEffect:** game initialization and event management.
- **Pointer Events and Map:** simultaneous mobile inputs.
- **AbortController:** resource and event cleanup when restarting or leaving a match.
- **LocalStorage:** persistence of the selected match duration.

### Limitations

The project runs entirely on the client side. API integration, ranking services, match history and automated testing remain unimplemented.

---

### Autor / Author

**Juan Daniel Ribeiro Huayamares CHavez**

Front-end Development & Design

[GitHub](https://github.com/juandrhc) | [Behance](https://www.behance.net/juandrhc)
