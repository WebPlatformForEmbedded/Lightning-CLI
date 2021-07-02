import { Lightning, Router, Utils } from '@lightningjs/sdk'

export default class Browse extends Lightning.Component {
  static _template() {
    return {
      rect: true,
      w: 1920,
      h: 1080,
      color: 0xff9055ff,
      Header: {
        mount: 0.5,
        x: 960,
        y: 540,
        text: {
          text: 'Browse Page',
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
            text: { text: 'Player Page', fontFace: 'Regular' },
          },
        },
        Right: {
          flex: {},
          mountX: 1,
          x: 1920,
          mountY: 0.5,
          y: 540,
          Label: {
            mountY: 0.5,
            y: 24,
            text: { text: 'Account Page', fontFace: 'Regular' },
          },
          Arrow: {
            flexItem: { marginRight: 50, marginLeft: 20 },
            rotation: Math.PI * 0.5,
            src: Utils.asset('arrow.png'),
          },
        },
      },
    }
  }

  _handleUp() {
    const videoId = Math.floor(Math.random() * 300000) + 800000
    Router.navigate(`discover/player/${videoId}`)
  }

  _handleRight() {
    Router.navigate('account')
  }

  pageTransition() {
    return 'up'
  }
}
