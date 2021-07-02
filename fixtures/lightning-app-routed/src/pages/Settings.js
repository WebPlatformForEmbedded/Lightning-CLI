import { Lightning, Router, Utils } from '@lightningjs/sdk'

export default class Settings extends Lightning.Component {
  static _template() {
    return {
      rect: true,
      w: 1920,
      h: 1080,
      color: 0xfff40076,
      Header: {
        mount: 0.5,
        x: 960,
        y: 540,
        text: {
          text: 'Settings Page',
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
            text: {
              text: 'Home Page',
              fontFace: 'Regular',
              textAlign: 'center',
              wordWrapWidth: 300,
              lineHeight: 48,
            },
          },
        },
        Down: {
          flex: { direction: 'column' },
          mountY: 1,
          y: 1080,
          Label: {
            mountX: 0.5,
            x: 960,
            text: {
              text: 'Page with error',
              fontFace: 'Regular',
              textAlign: 'center',
              wordWrapWidth: 300,
              lineHeight: 48,
            },
          },
          Arrow: {
            flexItem: { marginTop: 20, marginBottom: 50 },
            mountX: 0.5,
            x: 960,
            rotation: Math.PI,
            src: Utils.asset('arrow.png'),
          },
        },
      },
    }
  }

  set title(v) {
    console.log('title:', v)
  }

  _handleUp() {
    Router.navigate('home', { ref: this, a: 1, b: 2 })
  }

  _handleDown() {
    Router.navigate('account/details/save', { ref: this, a: 1, b: 2 })
  }

  // https://github.com/rdkcentral/Lightning-SDK/blob/feature/router/docs/plugins/router.md#page-transitions
  pageTransition() {
    return 'up'
  }
}
