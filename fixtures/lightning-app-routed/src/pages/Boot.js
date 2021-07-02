import { Lightning, Router } from '@lightningjs/sdk'

export default class Boot extends Lightning.Component {
  static _template() {
    return {
      rect: true,
      w: 1920,
      h: 1080,
      color: 0xffff6b00,
      Header: {
        mount: 0.5,
        x: 960,
        y: 540,
        text: {
          text: 'Boot Page',
          fontFace: 'Bold',
          fontSize: 128,
        },
      },
      Arrows: {
        Enter: {
          mountX: 0.5,
          x: 960,
          y: 980,
          text: { text: 'press [enter] to resume to link / deeplink', fontFace: 'Regular' },
        },
      },
    }
  }

  _handleEnter() {
    Router.resume()
  }
}
