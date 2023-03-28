import { Sprite, type Texture } from 'pixi.js'

export class Platform extends Sprite {
  name!: string
  constructor ({ name, texture }: { name: string, texture: Texture }) {
    super(texture)
    this.name = name
  }
}
