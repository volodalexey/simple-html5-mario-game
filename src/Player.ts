import { AnimatedSprite, Container, Graphics, type Texture } from 'pixi.js'
import { logPlayerBox, logPlayerBounds, logPlayerGravity, logPlayerMove, logPlayerDirection } from './logger'

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
  public pointerXDown = -1
  public pointerYDown = -1
  public moveSpeed = 8
  public jumpSpeed = 20

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

  isPointerDown (): boolean {
    return this.pointerXDown >= 0 && this.pointerYDown >= 0
  }

  handleMove (pressed: boolean | undefined, x: number, y: number): void {
    const { directionPressed } = this
    if (typeof pressed === 'boolean') {
      this.pointerXDown = pressed ? x : -1
      this.pointerYDown = pressed ? y : -1
    }

    this.releaseAllPressures()
    const { centerX, centerY } = this.getCenter()
    if (this.isPointerDown()) {
      if (x > centerX) {
        directionPressed.right = true
      } else if (x < centerX) {
        directionPressed.left = true
      }

      if (y > centerY) {
        directionPressed.bottom = true
      } else if (y < centerY) {
        directionPressed.top = true
      }
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      logPlayerDirection(`dp-t=${directionPressed.top} dp-r=${directionPressed.right} dp-b=${directionPressed.bottom} dp-l=${directionPressed.left}`)
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
        break
      case PlayerAnimation.runRight:
        this.runRight.play()
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
    // if (this.isPointerDown()) {
    //   this.handleMove(undefined, this.pointerXDown, this.pointerYDown)
    // }
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
      position.x = levelLeft
    } else if (right + velocity.vx > levelRight) {
      velocity.vx = 0
      position.x = levelRight - width
    } else {
      position.x += velocity.vx
    }

    this.updateAnimation()
  }
}
