import { Graphics, Sprite } from 'pixi.js'
import type { Container, Rectangle, Texture, Ticker } from 'pixi.js'
import type { IsActionPressed } from './keyboard'
import type { BattleTextures } from './textures'

export type BattleStats = {
  score: number
  health: number
  timeLeft: number
  status: 'playing' | 'timeUp' | 'defeated'
}

/*const MATCH_DURATION = 120*/

const PLAYER = {
  maxHealth: 100,
  speed: 180,
  turnSpeed: 2.4,
  radius: 22,
  marginX: 30,
  marginY: 40,
}

const CHASER = {
  speed: 70,
  radius: 20,
  damage: 25,
  stopDistance: 42,
  impactDistance: 42.5,
  reward: 100,
  spawnInterval: 3,
  maxCount: 5,
}

const SHOOTER = {
  speed: 50,
  radius: 20,
  stopDistance: 220,
  reward: 150,
  damage: 10,
  fireInterval: 2,
}

const PROJECTILE = { speed: 350, lifetime: 1.2 }
const ENEMY_PROJECTILE = {
  speed: 250,
  lifetime: 2,
}

const EXPLOSION_DURATION = 0.45
const BROADSIDE_OFFSETS = [-20, 0, 20]

const CANNONS = [
  {
    action: 'fireFront',
    interval: 0.35,
    angleOffset: 0,
    hullOffsets: [0],
    muzzleDistance: 42,
  },
  {
    action: 'fireLeft',
    interval: 0.8,
    angleOffset: -Math.PI / 2,
    hullOffsets: BROADSIDE_OFFSETS,
    muzzleDistance: 26,
  },
  {
    action: 'fireRight',
    interval: 0.8,
    angleOffset: Math.PI / 2,
    hullOffsets: BROADSIDE_OFFSETS,
    muzzleDistance: 26,
  },
] as const

type Projectile = {
  sprite: Sprite
  velocityX: number
  velocityY: number
  remaining: number
  owner: 'player' | 'enemy'
}

type Explosion = {
  graphic: Graphics
  remaining: number
}

// PT Estado de um inimigo ativo.
// EN State of an active enemy.
type Enemy = {
  sprite: Sprite
  type: 'chaser' | 'shooter'
  fireCooldown: number
}

export function createBattle(
  stage: Container,
  screen: Rectangle,
  textures: BattleTextures,
  isPressed: IsActionPressed,
  onStatsChange: (stats: BattleStats) => void,
  isPaused: () => boolean,
  matchDuration: number = 120,
) {
  const island = createCenteredSprite(textures.island, 0.65)
  island.position.set(screen.width * 0.72, screen.height * 0.5)
  const islandRadius = island.width / 2

  
const player = createCenteredSprite(textures.player, 0.65)

// PT Calcula uma posição inicial segura, afastada da ilha.
// EN Calculate a safe starting position away from the island.
const safeDistance = islandRadius + PLAYER.radius + 24

const startX = Math.max(
  PLAYER.marginX,
  Math.min(
    screen.width / 2,
    island.x - safeDistance
  )
)

player.position.set(startX, screen.height / 2)

player.rotation = Math.PI


  const healthBar = new Graphics()
  let playerHealth = PLAYER.maxHealth

  // PT Inimigos ativos e temporizador de surgimento.
  // EN Active enemies and spawn timer.
  const enemies: Enemy[] = []
  let spawnTimer = CHASER.spawnInterval

  let score = 0
  let timeLeft = matchDuration
  let status: BattleStats['status'] = 'playing'
  let lastReportedStats: BattleStats | undefined

  const projectiles: Projectile[] = []
  const explosions: Explosion[] = []
  const cannons = CANNONS.map((cannon) => ({ ...cannon, cooldown: 0 }))

  stage.addChild(island, player, healthBar)
  spawnEnemy()
  drawHealthBar()
  healthBar.position.set(player.x, player.y - 58)
  publishStats()

  // PT Envia ao React as estatísticas quando um valor exibido muda.
  // EN Send the stats to React when a displayed value changes.
  function publishStats() {
    const seconds = Math.ceil(timeLeft)
    if (
      lastReportedStats?.timeLeft === seconds &&
      lastReportedStats.score === score &&
      lastReportedStats.health === playerHealth &&
      lastReportedStats.status === status
    ) {
      return
    }

    lastReportedStats = { score, health: playerHealth, timeLeft: seconds, status }
    onStatsChange(lastReportedStats)
  }

  function drawHealthBar() {
    const width = 60
    const height = 7
    const fillWidth = width * (playerHealth / PLAYER.maxHealth)

    healthBar
      .clear()
      .rect(-width / 2, 0, width, height)
      .fill(0x263238)
      .rect(-width / 2, 0, fillWidth, height)
      .fill(0x39cc7c)
  }

  function distanceToIsland(x: number, y: number) {
    return Math.hypot(x - island.x, y - island.y)
  }

  // PT Tenta posicionar um inimigo em uma borda aleatória da arena.
  // EN Try to spawn an enemy at a random edge of the arena.
  function spawnEnemy() {
    // PT Sorteia o tipo de inimigo.
    // EN Randomly select the enemy type.
    const type = Math.random() < 0.7 ? 'chaser' : 'shooter'
    const sprite = createCenteredSprite(textures.chaser, 0.55)

    // PT Usa uma cor diferente para identificar os navios atiradores.
    // EN Use a different color to distinguish shooter ships.
    if (type === 'shooter') {
      sprite.tint = 0x8899ff
    }

    const edge = Math.floor(Math.random() * 4)
    const margin = 40
    let x = 0
    let y = 0

    switch (edge) {
      case 0:
        x = Math.random() * screen.width
        y = margin
        break

      case 1:
        x = screen.width - margin
        y = Math.random() * screen.height
        break

      case 2:
        x = Math.random() * screen.width
        y = screen.height - margin
        break

      case 3:
        x = margin
        y = Math.random() * screen.height
        break
    }

    // PT Evita que o inimigo surja dentro da ilha ou perto do jogador.
    // EN Avoid spawning inside the island or near the player.
    if (distanceToIsland(x, y) < islandRadius + CHASER.radius) {
      sprite.destroy()
      return
    }

    if (Math.hypot(x - player.x, y - player.y) < 150) {
      sprite.destroy()
      return
    }

    sprite.position.set(x, y)
    stage.addChild(sprite)

    enemies.push({
      sprite,
      type,
      fireCooldown: SHOOTER.fireInterval,
    })
  }

  // PT Tenta criar inimigos em intervalos regulares, respeitando o limite de inimigos ativos.
  // EN Try to spawn enemies at regular intervals, up to the active enemy limit.
  function updateSpawning(delta: number) {
    spawnTimer -= delta

    if (spawnTimer <= 0) {
      if (enemies.length < CHASER.maxCount) {
        spawnEnemy()
      }

      spawnTimer = CHASER.spawnInterval
    }
  }

  function updatePlayer(delta: number) {
    const turn = Number(isPressed('turnRight')) - Number(isPressed('turnLeft'))
    player.rotation += turn * PLAYER.turnSpeed * delta

    if (isPressed('advance')) {
      const distance = PLAYER.speed * delta
      const nextX = player.x - Math.sin(player.rotation) * distance
      const nextY = player.y + Math.cos(player.rotation) * distance

      if (distanceToIsland(nextX, nextY) >= islandRadius + PLAYER.radius) {
        player.position.set(nextX, nextY)
      }
    }

    player.x = Math.max(PLAYER.marginX, Math.min(screen.width - PLAYER.marginX, player.x))
    player.y = Math.max(PLAYER.marginY, Math.min(screen.height - PLAYER.marginY, player.y))
    healthBar.position.set(player.x, player.y - 58)
  }

  function createExplosion(x: number, y: number) {
    const graphic = new Graphics()
      .circle(0, 0, 18)
      .fill(0xff8c00)
      .circle(0, 0, 10)
      .fill(0xffe066)

    graphic.position.set(x, y)
    stage.addChild(graphic)
    explosions.push({ graphic, remaining: EXPLOSION_DURATION })
  }

  function updateExplosions(delta: number) {
    // PT Percorre a lista de trás para frente para preservar os índices
    //    ao remover um efeito expirado.
    // EN Iterate backward to preserve earlier indices
    //    when removing an expired effect.
    for (let index = explosions.length - 1; index >= 0; index--) {
      const explosion = explosions[index]
      explosion.remaining -= delta

      if (explosion.remaining <= 0) {
        explosion.graphic.destroy()
        explosions.splice(index, 1)
        continue
      }

      const fractionRemaining = explosion.remaining / EXPLOSION_DURATION
      explosion.graphic.scale.set(1 + (1 - fractionRemaining) * 2)
      explosion.graphic.alpha = fractionRemaining
    }
  }

  // PT Destrói o inimigo e concede pontos se o jogador o eliminou.
  // EN Destroy the enemy and award points if the player defeated it.
  function destroyEnemy(index: number, killedByPlayer: boolean = false) {
    const enemy = enemies[index]
    if (!enemy) return

    if (killedByPlayer) {
      score += 1
    }

    createExplosion(enemy.sprite.x, enemy.sprite.y)
    enemy.sprite.destroy()
    enemies.splice(index, 1)
  }

  // PT Dispara um projétil inimigo na direção do jogador.
  // EN Fire an enemy projectile toward the player.
  function fireEnemyCannon(enemy: Enemy) {
    const dx = player.x - enemy.sprite.x
    const dy = player.y - enemy.sprite.y
    const distance = Math.hypot(dx, dy)
    if (distance === 0) return

    const directionX = dx / distance
    const directionY = dy / distance
    const muzzleDistance = 36

    createProjectile(
      enemy.sprite.x + directionX * muzzleDistance,
      enemy.sprite.y + directionY * muzzleDistance,
      directionX,
      directionY,
      'enemy'
    )
  }

  // PT Atualiza todos os inimigos ativos.
  // EN Update all active enemies.
  function updateEnemies(delta: number) {
    for (let index = enemies.length - 1; index >= 0; index--) {
      const enemy = enemies[index]
      const chaser = enemy.sprite
      const config = enemy.type === 'chaser' ? CHASER : SHOOTER

      const dx = player.x - chaser.x
      const dy = player.y - chaser.y
      const distance = Math.hypot(dx, dy)

      if (distance > 0) {
        const directionX = dx / distance
        const directionY = dy / distance
        chaser.rotation = Math.atan2(-directionX, directionY)

        const step = Math.min(config.speed * delta, Math.max(0, distance - config.stopDistance))
        const nextX = chaser.x + directionX * step
        const nextY = chaser.y + directionY * step

        if (distanceToIsland(nextX, nextY) >= islandRadius + config.radius) {
          chaser.position.set(nextX, nextY)
        }
      }

      // PT Mede a distância ao jogador após o movimento para verificar alcance e colisão.
      // EN Measure the distance to the player after movement for range and collision checks.
      const distanceToPlayer = Math.hypot(player.x - chaser.x, player.y - chaser.y)

      // PT O navio atirador dispara quando o temporizador zera e o jogador está ao alcance.
      // EN The shooter fires when its cooldown reaches zero and the player is in range.
      if (enemy.type === 'shooter') {
        enemy.fireCooldown = Math.max(0, enemy.fireCooldown - delta)

        if (
          enemy.fireCooldown <= 0 &&
          distanceToPlayer <= SHOOTER.stopDistance + 20
        ) {
          fireEnemyCannon(enemy)
          enemy.fireCooldown = SHOOTER.fireInterval
        }
      }

      if (enemy.type === 'chaser' && distanceToPlayer <= CHASER.impactDistance) {
        playerHealth = Math.max(0, playerHealth - CHASER.damage)
        drawHealthBar()
        destroyEnemy(index)
      }
    }
  }

  // PT Cria um projétil com os parâmetros de quem disparou.
  // EN Create a projectile with the firing ship's settings.
  function createProjectile(
    x: number,
    y: number,
    directionX: number,
    directionY: number,
    owner: 'player' | 'enemy' = 'player'
  ) {
    const config = owner === 'player' ? PROJECTILE : ENEMY_PROJECTILE
    const sprite = createCenteredSprite(textures.cannonball, 1.6)

    if (owner === 'enemy') {
      sprite.tint = 0xff8844
    }

    sprite.position.set(x, y)
    stage.addChild(sprite)

    projectiles.push({
      sprite,
      velocityX: directionX * config.speed,
      velocityY: directionY * config.speed,
      remaining: config.lifetime,
      owner,
    })
  }

  function updateCannons(delta: number) {
    for (const cannon of cannons) {
      cannon.cooldown = Math.max(0, cannon.cooldown - delta)
      if (cannon.cooldown > 0 || !isPressed(cannon.action)) continue

      // PT Com rotação zero, a proa aponta para baixo.
      //    Os canhões laterais se distribuem ao longo do casco.
      // EN At zero rotation, the ship's bow points down.
      //    The side cannons are spaced along the hull.
      const forwardX = -Math.sin(player.rotation)
      const forwardY = Math.cos(player.rotation)
      const angle = player.rotation + cannon.angleOffset
      const directionX = -Math.sin(angle)
      const directionY = Math.cos(angle)

      for (const offset of cannon.hullOffsets) {
        const x = player.x + forwardX * offset + directionX * cannon.muzzleDistance
        const y = player.y + forwardY * offset + directionY * cannon.muzzleDistance
        createProjectile(x, y, directionX, directionY)
      }

      cannon.cooldown = cannon.interval
    }
  }

  function updateProjectiles(delta: number) {
    for (let index = projectiles.length - 1; index >= 0; index--) {
      const projectile = projectiles[index]
      const { sprite } = projectile

      // PT Atualiza a posição e o tempo de vida restante do projétil.
      // EN Update the projectile's position and remaining lifetime.
      sprite.x += projectile.velocityX * delta
      sprite.y += projectile.velocityY * delta
      projectile.remaining -= delta

      const outsideArena =
        sprite.x < 0 ||
        sprite.x > screen.width ||
        sprite.y < 0 ||
        sprite.y > screen.height

      const bulletRadius = sprite.width / 2
      const hitIsland =
        distanceToIsland(sprite.x, sprite.y) <= islandRadius + bulletRadius

      let hitTarget = false

      // PT Verifica acertos enquanto o projétil estiver ativo,
      //    dentro da arena e fora da ilha.
      // EN Check for hits while the projectile is active,
      //    inside the arena, and clear of the island.
      if (!hitIsland && !outsideArena && projectile.remaining > 0) {
        if (projectile.owner === 'player') {
          // PT Verifica se o projétil do jogador atingiu um inimigo.
          // EN Check whether the player's projectile hit an enemy.
          for (let enemyIndex = enemies.length - 1; enemyIndex >= 0; enemyIndex--) {
            const enemy = enemies[enemyIndex]
            const config = enemy.type === 'chaser' ? CHASER : SHOOTER
            const distance = Math.hypot(
              sprite.x - enemy.sprite.x,
              sprite.y - enemy.sprite.y
            )

            if (distance <= config.radius + bulletRadius) {
              hitTarget = true
              destroyEnemy(enemyIndex, true)
              break
            }
          }
        } else {
          // PT Verifica se o projétil inimigo atingiu o jogador.
          // EN Check whether the enemy projectile hit the player.
          const distance = Math.hypot(sprite.x - player.x, sprite.y - player.y)

          if (distance <= PLAYER.radius + bulletRadius) {
            hitTarget = true
            playerHealth = Math.max(0, playerHealth - SHOOTER.damage)
            drawHealthBar()
          }
        }
      }

      // PT Remove projéteis que expiraram, saíram da arena ou colidiram.
      // EN Remove projectiles that expired, left the arena, or collided.
      if (projectile.remaining <= 0 || outsideArena || hitIsland || hitTarget) {
        sprite.destroy()
        projectiles.splice(index, 1)
      }
    }
  }

  return function updateBattle(ticker: Ticker) {
    if (status !== 'playing' || isPaused()) return

    // PT Converte o intervalo do PixiJS de milissegundos para segundos.
    // EN Convert the PixiJS time step from milliseconds to seconds.
    const delta = ticker.deltaMS / 1000
    timeLeft = Math.max(0, timeLeft - delta)

    if (timeLeft === 0) {
      status = 'timeUp'
      publishStats()
      return
    }

    updateExplosions(delta)
    updateCannons(delta)
    updatePlayer(delta)
    updateSpawning(delta)
    updateEnemies(delta)

    if (playerHealth > 0) updateProjectiles(delta)
    if (playerHealth === 0) status = 'defeated'

    publishStats()
  }
}

function createCenteredSprite(texture: Texture, scale: number) {
  const sprite = new Sprite(texture)
  sprite.anchor.set(0.5)
  sprite.scale.set(scale)
  return sprite
}
