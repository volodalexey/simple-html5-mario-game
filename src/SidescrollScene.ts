import { Container, type FederatedPointerEvent, type Texture, TilingSprite } from 'pixi.js'
import { logLayout, logPointerEvent, logKeydown, logKeyup } from './logger'
import { type IScene } from './SceneManager'
import { StartModal } from './StartModal'
import { Player, type IPlayerOptions } from './Player'

interface ISidescrollSceneOptions {
  viewWidth: number
  viewHeight: number
  backgroundTexture: Texture
  playerTextures: IPlayerOptions['textures']
}

export class SidescrollScene extends Container implements IScene {
  public gravity = 0.7
  public floorY = 480
  public gameEnded = false

  public background!: TilingSprite
  public player!: Player
  public startModal!: StartModal

  constructor (options: ISidescrollSceneOptions) {
    super()
    this.setup(options)
    this.addEventLesteners()
  }

  setup ({ viewWidth, viewHeight, backgroundTexture, playerTextures }: ISidescrollSceneOptions): void {
    this.background = new TilingSprite(backgroundTexture)
    this.addChild(this.background)

    this.player = new Player({ textures: playerTextures })
    this.addChild(this.player)

    this.startModal = new StartModal({ viewWidth, viewHeight })
    this.startModal.visible = false
    this.addChild(this.startModal)
  }

  handleResize (options: { viewWidth: number, viewHeight: number }): void {
    this.resizeBackground(options)
    this.centerModal(options)
  }

  centerModal ({ viewWidth, viewHeight }: { viewWidth: number, viewHeight: number }): void {
    this.startModal.position.set(viewWidth / 2 - this.startModal.boxOptions.width / 2, viewHeight / 2 - this.startModal.boxOptions.height / 2)
  }

  resizeBackground ({ viewWidth, viewHeight }: { viewWidth: number, viewHeight: number }): void {
    logLayout(`bgw=${this.background.width} bgh=${this.background.height} vw=${viewWidth} vh=${viewHeight}`)
    this.background.width = viewWidth
    this.background.height = viewHeight
  }

  handleUpdate (): void {
    if (this.gameEnded) {
      return
    }
    this.player.update({
      gravity: this.gravity,
      levelLeft: 0,
      levelRight: this.background.width,
      levelBottom: this.floorY
    })
  }

  addEventLesteners (): void {
    this.interactive = true
    this.on('pointerdown', this.handlePlayerStartMove)
    this.on('pointermove', this.handlePlayerKeepMove)
    this.on('pointerup', this.handlePlayerStopMove)
    window.addEventListener('keydown', this.handleKeyDown)
    window.addEventListener('keyup', this.handleKeyUp)
  }

  removeEventListeners (): void {
    this.interactive = false
    this.off('pointerdown', this.handlePlayerStartMove)
    this.off('pointermove', this.handlePlayerKeepMove)
    this.off('pointerup', this.handlePlayerStopMove)
    window.removeEventListener('keydown', this.handleKeyDown)
    window.removeEventListener('keyup', this.handleKeyUp)
  }

  handlePlayerMove (pressed: boolean | undefined, e: FederatedPointerEvent): void {
    const point = e.global
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
      case 'KeyW': case 'ArrowUp':
        this.player.setTopDirectionPressed(true)
        break
      case 'KeyA': case 'ArrowLeft':
        this.player.setLeftDirectionPressed(true)
        break
      case 'KeyS': case 'Space': case 'ShiftLeft': case 'ArrowDown': case 'Numpad0': case 'ShiftRight':
        this.player.setBottomDirectionPressed(true)
        break
      case 'KeyD':case 'ArrowRight':
        this.player.setRightDirectionPressed(true)
        break
    }
  }

  handleKeyUp = (e: KeyboardEvent): void => {
    logKeyup(`${e.code} ${e.key}`)
    switch (e.code) {
      case 'KeyW': case 'ArrowUp':
        this.player.setTopDirectionPressed(false)
        break
      case 'KeyA': case 'ArrowLeft':
        this.player.setLeftDirectionPressed(false)
        break
      case 'KeyS': case 'Space': case 'ShiftLeft': case 'ArrowDown': case 'Numpad0': case 'ShiftRight':
        this.player.setBottomDirectionPressed(false)
        break
      case 'KeyD':case 'ArrowRight':
        this.player.setRightDirectionPressed(false)
        break
    }
  }

  startGame = (): void => {
    this.startModal.visible = false
    this.gameEnded = false
    this.player.position.set(0, 0)
  }

  endGame (): void {
    this.gameEnded = true
    this.startModal.visible = true
  }
}
