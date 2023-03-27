import { AnimatedSprite, Container, Graphics, type Texture } from 'pixi.js'
import { logPlayerBox, logPlayerBounds, logPlayerGravity, logPlayerMove } from './logger'

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
  public isPressed = false
  public moveSpeed = 1
  public jumpSpeed = 10

  private readonly directionPressed: Record<'top' | 'right' | 'bottom' | 'left', boolean> = {
    top: false,
    right: false,
    bottom: false,
    left: false
  }

  public velocity = {
    vx: 0,
    vy: 0
  }

  public health = 100
  public animation!: PlayerAnimation
  public idleLeft!: AnimatedSprite
  public idleRight!: AnimatedSprite
  public runLeft!: AnimatedSprite
  public runRight!: AnimatedSprite
  public playerBox!: Graphics
  public settings = {
    animationIdleSpeed: 0.2,
    animationRunSpeed: 0.2,
    spritesBoxColor: 0x0ea5e9
  }

  constructor (options: IPlayerOptions) {
    super()
    this.setup(options)
    this.draw(options)

    this.switchAnimation(PlayerAnimation.idleRight)
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
    const spritesBox = new Graphics()
    this.addChild(spritesBox)
    this.playerBox = spritesBox

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

    this.addChild(spritesContainer)
  }

  draw (_: IPlayerOptions): void {
    this.playerBox.beginFill(this.settings.spritesBoxColor)
    this.playerBox.drawRect(0, 0, this.width, this.height)
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

  releaseAllPressures (): void {
    this.directionPressed.top = false
    this.directionPressed.right = false
    this.directionPressed.bottom = false
    this.directionPressed.left = false
  }

  setTopDirectionPressed (pressed: boolean): void {
    this.directionPressed.top = pressed
  }

  setLeftDirectionPressed (pressed: boolean): void {
    this.directionPressed.left = pressed
  }

  setRightDirectionPressed (pressed: boolean): void {
    this.directionPressed.right = pressed
  }

  setBottomDirectionPressed (pressed: boolean): void {
    this.directionPressed.bottom = pressed
  }

  handleMove (pressed: boolean | undefined, x: number, y: number): void {
    const { directionPressed } = this
    if (typeof pressed === 'boolean') {
      this.isPressed = pressed
    }

    this.releaseAllPressures()
    if (this.isPressed) {
      const { top, right, bottom, left } = this.getBounds()

      if (x >= right) {
        directionPressed.right = true
      } else if (x <= left) {
        directionPressed.left = true
      }

      if (y >= bottom) {
        directionPressed.bottom = true
      } else if (y <= top) {
        directionPressed.top = true
      }

      if (x < right && x > left && y > top && y < bottom) {
        directionPressed.bottom = true
      }
    }
  }

  switchAnimation (animation: PlayerAnimation): void {
    this.hideAllAnimations()
    this.stopAllAnimations()
    switch (animation) {
      case PlayerAnimation.idleLeft:
        this.idleLeft.gotoAndPlay(0)
        this.idleLeft.visible = true
        break
      case PlayerAnimation.idleRight:
        this.idleRight.gotoAndPlay(0)
        this.idleRight.visible = true
        break
      case PlayerAnimation.runLeft:
        this.runLeft.gotoAndPlay(0)
        this.runLeft.visible = true
        break
      case PlayerAnimation.runRight:
        this.runRight.gotoAndPlay(0)
        this.runRight.visible = true
        break
    }
    this.animation = animation
  }

  updateAnimation (): void {
    this.switchAnimation(Player.ANIMATION.idleRight)
    if (this.velocity.vx > 0) {
      this.switchAnimation(Player.ANIMATION.runRight)
    } else if (this.velocity.vx < 0) {
      this.switchAnimation(Player.ANIMATION.runLeft)
    }
  }

  update ({
    gravity,
    levelLeft,
    levelRight,
    levelBottom
  }: {
    gravity: number
    levelLeft: number
    levelRight: number
    levelBottom: number
  }): void {
    const { position, velocity, directionPressed, jumpSpeed, moveSpeed } = this
    if (directionPressed.top && velocity.vy === 0) {
      velocity.vy = -jumpSpeed
    }
    if (directionPressed.left) {
      velocity.vx = -moveSpeed
    } else if (directionPressed.right) {
      velocity.vx = moveSpeed
    } else {
      velocity.vx = 0
    }

    const { bottom, left, right, width, height } = this.getBounds()
    logPlayerBounds(`pl=${left} pr=${right} pw=${width} ph=${height}`)
    if (bottom + velocity.vy >= levelBottom) {
      logPlayerGravity(`Floor bot=${bottom} vy=${velocity.vy} fl=${levelBottom}`)
      velocity.vy = 0
      position.y = levelBottom - height
    } else {
      logPlayerGravity(`Gravity bot=${bottom} vy=${velocity.vy} fl=${levelBottom}`)
      velocity.vy += gravity
      position.y += velocity.vy
    }

    logPlayerMove(`Move left=${left} right=${right} vy=${velocity.vx}`)
    if (left + velocity.vx < levelLeft) {
      velocity.vx = 0
      position.x = levelLeft - width
    } else if (right + velocity.vx > levelRight) {
      velocity.vx = 0
      position.x = levelRight - width
    } else {
      position.x += velocity.vx
    }

    this.updateAnimation()
  }
}
