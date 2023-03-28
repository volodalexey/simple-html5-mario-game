import { AnimatedSprite, Container, Graphics, type Texture } from 'pixi.js'
import { logPlayerBox, logPlayerMove } from './logger'

export interface IPlayerOptions {
  textures: {
    idleLeftTexture: Texture[]
    idleRightTexture: Texture[]
    runLeftTexture: Texture[]
    runRightTexture: Texture[]
  }
}

export enum PlayerAnimation {
  idleLeft = 'idleLeft',
  idleRight = 'idleRight',
  runLeft = 'runLeft',
  runRight = 'runRight',
}

export class Player extends Container {
  static ANIMATION = PlayerAnimation
  public pointerXDown: number | null = null
  public pointerYDown: number | null = null
  public moveSpeed = 8
  public jumpSpeed = 20

  public velocity = {
    vx: 0,
    vy: 0
  }

  public idleAnimation = PlayerAnimation.idleRight
  public animation!: PlayerAnimation
  public idleLeft!: AnimatedSprite
  public idleRight!: AnimatedSprite
  public runLeft!: AnimatedSprite
  public runRight!: AnimatedSprite
  public playerBox!: Graphics
  public settings = {
    scale: 0.375,
    animationIdleSpeed: 0.2,
    animationRunSpeed: 1,
    spritesBoxColorTL: 0x0ea5e9,
    spritesBoxColorTR: 0xa3e635,
    spritesBoxColorBR: 0xe11d48,
    spritesBoxColorBL: 0xeab308
  }

  constructor (options: IPlayerOptions) {
    super()
    this.setup(options)
    this.draw(options)

    this.switchAnimation(this.idleAnimation)
  }

  setup ({
    textures: {
      idleLeftTexture,
      idleRightTexture,
      runLeftTexture,
      runRightTexture
    }
  }: IPlayerOptions): void {
    const { settings } = this
    const playerBox = new Graphics()
    this.addChild(playerBox)
    this.playerBox = playerBox

    const spritesContainer = new Container()

    const idleLeft = new AnimatedSprite(idleLeftTexture)
    idleLeft.animationSpeed = settings.animationIdleSpeed
    spritesContainer.addChild(idleLeft)
    this.idleLeft = idleLeft

    const idleRight = new AnimatedSprite(idleRightTexture)
    idleRight.animationSpeed = settings.animationIdleSpeed
    spritesContainer.addChild(idleRight)
    this.idleRight = idleRight

    const runLeft = new AnimatedSprite(runLeftTexture)
    runLeft.animationSpeed = settings.animationRunSpeed
    spritesContainer.addChild(runLeft)
    this.runLeft = runLeft

    const runRight = new AnimatedSprite(runRightTexture)
    runRight.animationSpeed = settings.animationRunSpeed
    spritesContainer.addChild(runRight)
    this.runRight = runRight

    spritesContainer.scale.set(settings.scale)

    this.addChild(spritesContainer)
  }

  isRunning (): boolean {
    return [PlayerAnimation.runLeft, PlayerAnimation.runRight].includes(this.animation)
  }

  getCenter (): { centerX: number, centerY: number } {
    return {
      centerX: this.x + this.width / 2,
      centerY: this.y + this.height / 2
    }
  }

  draw (_: IPlayerOptions): void {
    const { centerX, centerY } = this.getCenter()
    this.playerBox.beginFill(this.settings.spritesBoxColorTL)
    this.playerBox.drawRect(0, 0, centerX, centerY)
    this.playerBox.endFill()
    this.playerBox.beginFill(this.settings.spritesBoxColorTR)
    this.playerBox.drawRect(centerX, 0, centerX, centerY)
    this.playerBox.endFill()
    this.playerBox.beginFill(this.settings.spritesBoxColorBL)
    this.playerBox.drawRect(0, centerY, centerX, centerY)
    this.playerBox.endFill()
    this.playerBox.beginFill(this.settings.spritesBoxColorBR)
    this.playerBox.drawRect(centerX, centerY, centerX, centerY)
    this.playerBox.endFill()
    this.playerBox.alpha = logPlayerBox.enabled ? 0.5 : 0
  }

  stopAllAnimations (): void {
    [this.idleLeft, this.idleRight, this.runLeft, this.runRight].forEach(spr => {
      spr.stop()
    })
  }

  hideAllAnimations (): void {
    [this.idleLeft, this.idleRight, this.runLeft, this.runRight].forEach(spr => {
      spr.visible = false
    })
  }

  setTopDirectionPressed (pressed: boolean): void {
    this.pointerYDown = pressed ? -1 : null
  }

  setLeftDirectionPressed (pressed: boolean): void {
    this.pointerXDown = pressed
      ? -1
      : (this.pointerXDown === -1 ? null : this.pointerXDown)
  }

  setRightDirectionPressed (pressed: boolean): void {
    this.pointerXDown = pressed
      ? 1
      : (this.pointerXDown === 1 ? null : this.pointerXDown)
  }

  isPointerDown (): boolean {
    return this.pointerXDown !== null && this.pointerYDown !== null
  }

  handleMove (pressed: boolean | undefined, x: number, y: number): void {
    const { centerX } = this.getCenter()
    if (pressed === true) {
      this.pointerXDown = x - centerX
      this.pointerYDown = y - this.y
    } else if (pressed === false) {
      this.pointerXDown = null
      this.pointerYDown = null
    } else {
      if (this.isPointerDown()) {
        logPlayerMove(`player-pointer-down x=${x} y=${x}`)
        this.pointerXDown = x - centerX
        this.pointerYDown = y - this.y
      }
    }
  }

  switchAnimation (animation: PlayerAnimation): void {
    this.hideAllAnimations()
    this.stopAllAnimations()
    switch (animation) {
      case PlayerAnimation.idleLeft:
        this.idleLeft.play()
        this.idleLeft.visible = true
        break
      case PlayerAnimation.idleRight:
        this.idleRight.play()
        this.idleRight.visible = true
        break
      case PlayerAnimation.runLeft:
        this.runLeft.play()
        this.runLeft.visible = true
        this.idleAnimation = PlayerAnimation.idleLeft
        break
      case PlayerAnimation.runRight:
        this.runRight.play()
        this.runRight.visible = true
        this.idleAnimation = PlayerAnimation.idleRight
        break
    }
    this.animation = animation
  }

  updateAnimation (): void {
    if (this.velocity.vx > 0) {
      this.switchAnimation(Player.ANIMATION.runRight)
    } else if (this.velocity.vx < 0) {
      this.switchAnimation(Player.ANIMATION.runLeft)
    } else {
      this.switchAnimation(this.idleAnimation)
    }
  }

  update (): void {
    this.updateAnimation()
  }

  reset (): void {
    this.stopAllAnimations()
    this.velocity.vx = 0
    this.velocity.vy = 0
    this.pointerXDown = null
    this.pointerYDown = null
  }
}
