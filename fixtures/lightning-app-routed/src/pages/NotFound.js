import { Lightning, Router, Utils } from '@lightningjs/sdk'

export default class NotFound extends Lightning.Component {
  static _template() {
    return {
      rect: true,
      w: 1920,
      h: 1080,
      color: 0xff402662,
      Header: {
        mount: 0.5,
        x: 960,
        y: 540,
        text: {
          text: 'Page not found',
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
        Right: {
          flex: {},
          mountX: 1,
          x: 1920,
          mountY: 0.5,
          y: 540,
          Label: {
            mountY: 0.5,
            y: 24,
            text: {
              text: 'Account Page',
              fontFace: 'Regular',
              textAlign: 'right',
              wordWrapWidth: 300,
              lineHeight: 48,
            },
          },
          Arrow: {
            flexItem: { marginRight: 50, marginLeft: 20 },
            rotation: Math.PI * 0.5,
            src: Utils.asset('arrow.png'),
          },
        },
        Enter: {
          mountX: 0.5,
          x: 960,
          y: 980,
          text: { text: 'press [Back] to go to the previous page', fontFace: 'Regular' },
        },
      },
    }
  }

  _handleUp() {
    Router.navigate('home')
  }

  _handleRight() {
    Router.navigate('account')
  }

  pageTransition() {
    return 'right'
  }
}
