import { Lightning, Router, Utils } from '@lightningjs/sdk'

export default class Home extends Lightning.Component {
  static _template() {
    return {
      rect: true,
      w: 1920,
      h: 1080,
      color: 0xff30be96,
      Header: {
        mount: 0.5,
        x: 960,
        y: 540,
        text: {
          text: 'Home Page',
          fontFace: 'Bold',
          fontSize: 128,
        },
      },
      Arrows: {
        Up: {
          flex: { direction: 'column' },
          Arrow: {
            flexItem: { marginTop: 50, marginBottom: 20 },
            mountX: 0.5,
            x: 960,
            src: Utils.asset('arrow.png'),
          },
          Label: {
            mountX: 0.5,
            x: 960,
            text: { text: 'Browse Page', fontFace: 'Regular' },
          },
        },
      },
    }
  }

  set persist(args) {
    console.log('we received data:', args)
  }

  _handleUp() {
    Router.navigate('home/browse/adventure')
  }

  pageTransition() {
    return 'up'
  }
}
