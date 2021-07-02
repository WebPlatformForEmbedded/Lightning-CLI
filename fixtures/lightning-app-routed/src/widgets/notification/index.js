import { Lightning } from '@lightningjs/sdk'

export default class Notification extends Lightning.Component {
  static _template() {
    return {
      alpha: 0,
      scale: 0.9,
      w: 1720,
      h: 100,
      transitions: {
        alpha: { duration: 0.3, timingFunction: 'cubic-bezier(0.17, 0.9, 0.32, 1.3)' },
        scale: { duration: 0.3, timingFunction: 'cubic-bezier(0.17, 0.9, 0.32, 1.3)' },
      },
      Background: {
        mountX: 0.5,
        x: 960,
        y: 70,
        color: 0xff402662,
        texture: Lightning.Tools.getRoundRect(1720, 100, 12, 0, 0x00000000, true, 0xffffffff),
        Message: {
          mountY: 0.5,
          y: 54,
          x: 40,
          text: {
            text: '',
            fontFace: 'Regular',
            fontSize: 40,
          },
        },
      },
    }
  }

  notify(v) {
    this.tag('Message').text = v
    this.setSmooth('alpha', 1)
    this.setSmooth('scale', 1)

    this.application.emit('blurContent', { amount: 3, scale: 1.2 })

    this._timeout = setTimeout(() => {
      this.setSmooth('alpha', 0)
      this.setSmooth('scale', 0.9)
      this.application.emit('blurContent', { amount: 0, scale: 1 })
    }, 2000)
  }

  _focus() {
    this.setSmooth('scale', 1.2)
  }

  _unfocus() {
    this.setSmooth('scale', 1)
  }
}
