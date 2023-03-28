import { Container, type FederatedPointerEvent, type Texture, Sprite, Graphics } from 'pixi.js'
import { logLayout, logPointerEvent, logKeydown, logKeyup, logPlayerBounds, logPlayerGravity, logMoveLevelBounds } from './logger'
import { type IScene } from './SceneManager'
import { StartModal } from './StartModal'
import { Player, type IPlayerOptions } from './Player'
import { Platform } from './Platform'

interface ISidescrollSceneOptions {
  viewWidth: number
  viewHeight: number
  backgroundTexture: Texture
  platformTexture: Texture
  hillsTexture: Texture
  platformSmallTallTexture: Texture
  playerTextures: IPlayerOptions['textures']
}

export class SidescrollScene extends Container implements IScene {
  public gravity = 0.7
  public gameEnded = false

  public viewWidth!: number
  public viewHeight!: number
  public world!: Container
  public background!: Sprite
  public platforms!: Container
  public player!: Player
  public moveLevelBounds!: Graphics
  public moveLevelBoundsOptions = {
    fill: 0x333300,
    left: 100,
    right: 400
  }

  public startModal!: StartModal

  constructor (options: ISidescrollSceneOptions) {
    super()
    this.viewWidth = options.viewWidth
    this.viewHeight = options.viewHeight
    this.setup(options)
    this.addEventLesteners()
  }

  setup ({ viewWidth, viewHeight, backgroundTexture, hillsTexture, platformTexture, playerTextures }: ISidescrollSceneOptions): void {
    const world = new Container()

    const background = new Sprite(backgroundTexture)
    world.addChild(background)
    this.background = background

    const hills = new Sprite(hillsTexture)
    hills.position.y = background.height - hills.height
    background.addChild(hills)

    this.platforms = new Container()

    const platform1 = new Platform(platformTexture)
    platform1.position.y = background.height - platform1.height
    this.platforms.addChild(platform1)

    const platform2 = new Platform(platformTexture)
    platform2.position.set(platform1.width, platform1.y - platform2.height)
    this.platforms.addChild(platform2)

    world.addChild(this.platforms)

    this.player = new Player({ textures: playerTextures })
    world.addChild(this.player)

    this.addChild(world)
    this.world = world

    const { moveLevelBoundsOptions } = this
    const moveLevelBounds = new Graphics()
    moveLevelBounds.alpha = logMoveLevelBounds.enabled ? 0.5 : 0
    moveLevelBounds.beginFill(moveLevelBoundsOptions.fill)
    moveLevelBounds.drawRect(0, 0, moveLevelBoundsOptions.right - moveLevelBoundsOptions.left, viewHeight)
    moveLevelBounds.endFill()
    moveLevelBounds.position.x = 100
    this.addChild(moveLevelBounds)
    this.moveLevelBounds = moveLevelBounds

    this.startModal = new StartModal({ viewWidth, viewHeight })
    this.startModal.visible = false
    this.addChild(this.startModal)
  }

  handleResize (options: { viewWidth: number, viewHeight: number }): void {
    this.viewWidth = options.viewWidth
    this.viewHeight = options.viewHeight
    this.resizeBackground(options)
    this.centerModal(options)
  }

  centerModal ({ viewWidth, viewHeight }: { viewWidth: number, viewHeight: number }): void {
    this.startModal.position.set(viewWidth / 2 - this.startModal.boxOptions.width / 2, viewHeight / 2 - this.startModal.boxOptions.height / 2)
  }

  resizeBackground ({ viewWidth, viewHeight }: { viewWidth: number, viewHeight: number }): void {
    logLayout(`bgw=${this.world.width} bgh=${this.world.height} vw=${viewWidth} vh=${viewHeight}`)
    // this.background.width = viewWidth
    // this.world.height = viewHeight
  }

  handleUpdate (): void {
    if (this.gameEnded) {
      return
    }
    const { position, velocity, jumpSpeed, moveSpeed, pointerXDown, pointerYDown } = this.player
    if (typeof pointerYDown === 'number' && pointerYDown < 0 && velocity.vy === 0) {
      velocity.vy = -jumpSpeed
    }
    if (typeof pointerXDown === 'number') {
      if (pointerXDown < 0) {
        velocity.vx = -moveSpeed
      } else if (pointerXDown > 0) {
        velocity.vx = moveSpeed
      }
    } else {
      velocity.vx = 0
    }
    const { left, right, bottom, width, height } = this.player.getBounds()
    logPlayerBounds(`pl=${left} pr=${right} pw=${width} ph=${height}`)
    if (left + velocity.vx < this.background.x) {
      velocity.vx = 0
      position.x = this.background.x
    } else if (right + velocity.vx > this.background.width) {
      velocity.vx = 0
      position.x = this.background.width - width
    } else {
      position.x += velocity.vx
    }

    if (this.platforms.children.some((child) => {
      const platformBounds = child.getBounds()
      if (right >= platformBounds.left && left <= platformBounds.right &&
        bottom + velocity.vy >= platformBounds.y && bottom <= platformBounds.y) {
        logPlayerGravity(`Floor bot=${bottom} vy=${velocity.vy} fl=${platformBounds.y}`)
        velocity.vy = 0
        position.y = platformBounds.y - height
        return true
      }
      return false
    })) {
      // on some platform
    } else {
      logPlayerGravity(`Gravity bot=${bottom} vy=${velocity.vy}`)
      velocity.vy += this.gravity
      position.y += velocity.vy
    }
    const playerGlobal = this.player.toGlobal(this)
    if (playerGlobal.x + width > this.moveLevelBounds.x + this.moveLevelBounds.width && velocity.vx > 0) {
      this.world.pivot.x += velocity.vx
    } else if (playerGlobal.x < this.moveLevelBounds.x && velocity.vx < 0) {
      this.world.pivot.x += velocity.vx
    }
    if (this.world.pivot.x < 0) {
      this.world.pivot.x = 0
    }
    if (this.world.pivot.x !== 0) {
      this.background.pivot.x = -this.world.pivot.x + this.world.pivot.x * 0.5
    } else {
      this.background.pivot.x = 0
    }
    if (bottom > this.background.height) {
      this.endGame(false)
    } else {
      this.player.update()
      if (this.player.x > 2000) {
        this.endGame(true)
      }
    }
  }

  addEventLesteners (): void {
    this.world.interactive = true
    this.world.on('pointerdown', this.handlePlayerStartMove)
    this.world.on('pointermove', this.handlePlayerKeepMove)
    this.world.on('pointerup', this.handlePlayerStopMove)
    window.addEventListener('keydown', this.handleKeyDown)
    window.addEventListener('keyup', this.handleKeyUp)
    this.startModal.on('click', this.startGame)
  }

  removeEventListeners (): void {
    this.world.interactive = false
    this.world.off('pointerdown', this.handlePlayerStartMove)
    this.world.off('pointermove', this.handlePlayerKeepMove)
    this.world.off('pointerup', this.handlePlayerStopMove)
    window.removeEventListener('keydown', this.handleKeyDown)
    window.removeEventListener('keyup', this.handleKeyUp)
    this.startModal.off('click', this.startGame)
  }

  handlePlayerMove (pressed: boolean | undefined, e: FederatedPointerEvent): void {
    const point = this.world.toLocal(e.global)
    logPointerEvent(`${e.type} px=${point.x} py=${point.y}`)
    this.player.handleMove(pressed, point.x, point.y)
  }

  handlePlayerStartMove = (e: FederatedPointerEvent): void => {
    this.handlePlayerMove(true, e)
  }

  handlePlayerKeepMove = (e: FederatedPointerEvent): void => {
    this.handlePlayerMove(undefined, e)
  }

  handlePlayerStopMove = (e: FederatedPointerEvent): void => {
    this.handlePlayerMove(false, e)
  }

  handleKeyDown = (e: KeyboardEvent): void => {
    logKeydown(`${e.code} ${e.key}`)
    switch (e.code) {
      case 'KeyW': case 'ArrowUp': case 'Space': case 'ShiftLeft':
        this.player.setTopDirectionPressed(true)
        break
      case 'KeyA': case 'ArrowLeft':
        this.player.setLeftDirectionPressed(true)
        break
      case 'KeyD':case 'ArrowRight':
        this.player.setRightDirectionPressed(true)
        break
    }
  }

  handleKeyUp = (e: KeyboardEvent): void => {
    logKeyup(`${e.code} ${e.key}`)
    switch (e.code) {
      case 'KeyW': case 'ArrowUp': case 'Space': case 'ShiftLeft':
        this.player.setTopDirectionPressed(false)
        break
      case 'KeyA': case 'ArrowLeft':
        this.player.setLeftDirectionPressed(false)
        break
      case 'KeyD':case 'ArrowRight':
        this.player.setRightDirectionPressed(false)
        break
    }
  }

  startGame = (): void => {
    this.startModal.visible = false
    this.gameEnded = false
    this.world.pivot.x = 0
    this.background.pivot.x = 0
    this.player.position.set(0, 0)
  }

  endGame (reason: boolean): void {
    this.gameEnded = true
    this.player.reset()
    this.startModal.visible = true
    this.startModal.reasonText.text = reason ? 'You Win' : 'You Lose'
  }
}
