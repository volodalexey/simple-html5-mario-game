import { Container, type Texture } from 'pixi.js'
import { Platform } from './Platform'

interface IPlatformsOptions {
  platformSmallTallTexture: Texture
  platformTexture: Texture
  bottom: number
}

export class Platforms extends Container<Platform> {
  constructor (options: IPlatformsOptions) {
    super()
    this.setup(options)
  }

  setup ({ platformTexture, platformSmallTallTexture, bottom }: IPlatformsOptions): void {
    const platform1 = new Platform({ name: '1', texture: platformTexture })
    platform1.position.y = bottom - platformTexture.height
    this.addChild(platform1)

    const platform2 = new Platform({ name: '2', texture: platformTexture })
    platform2.position.set(platform1.width, platform1.y - platform2.height)
    this.addChild(platform2)

    const platform3 = new Platform({ name: '3s', texture: platformSmallTallTexture })
    platform3.position.set(platform2.x + platform2.width + 200, bottom - platformSmallTallTexture.height)
    this.addChild(platform3)

    const platform4 = new Platform({ name: '4s', texture: platformSmallTallTexture })
    platform4.position.set(platform3.x + platform3.width + 300, bottom - platformSmallTallTexture.height - 50)
    this.addChild(platform4)

    const platform5 = new Platform({ name: '5', texture: platformTexture })
    platform5.position.set(platform4.x + platform4.width + 200, bottom - platformTexture.height - 50)
    this.addChild(platform5)

    const platform6 = new Platform({ name: '6', texture: platformTexture })
    platform6.position.set(platform5.x + platform5.width + 200, bottom - platformTexture.height - 50)
    this.addChild(platform6)

    const platform7 = new Platform({ name: '7s', texture: platformSmallTallTexture })
    platform7.position.set(platform6.x + platform6.width - platformSmallTallTexture.width, platform6.y - platformSmallTallTexture.height)
    this.addChild(platform7)

    const platform8 = new Platform({ name: '8', texture: platformTexture })
    platform8.position.set(platform7.x + platform7.width + 500, bottom - platformTexture.height)
    this.addChild(platform8)
  }
}
