import { Lightning, Router, Utils } from '@lightningjs/sdk'

export default class Account extends Lightning.Component {
  static _template() {
    return {
      rect: true,
      w: 1920,
      h: 1080,
      color: 0xff0b63f6,
      Blur: {
        rtt: true,
        w: 1920,
        h: 1080,
        type: Lightning.components.FastBlurComponent,
        amount: 0,
        transitions: {
          amount: { duration: 0.3 },
          scale: { duration: 0.3 },
        },
        content: {
          w: 1920,
          h: 1080,
          Header: {
            mount: 0.5,
            x: 960,
            y: 540,
            text: {
              text: 'Account Page',
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
                  text: 'Search with data-provider',
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
            Left: {
              flex: {},
              mountY: 0.5,
              y: 540,
              Arrow: {
                flexItem: { marginRight: 20, marginLeft: 50 },
                rotation: Math.PI * 1.5,
                src: Utils.asset('arrow.png'),
              },
              Label: {
                mountY: 0.5,
                y: 24,
                text: {
                  text: 'Menu Widget',
                  fontFace: 'Regular',
                  textAlign: 'right',
                  wordWrapWidth: 300,
                  lineHeight: 48,
                },
              },
            },
          },
        },
      },
    }
  }

  _init() {
    this.application.on('blurContent', ({ amount, scale }) => {
      this.tag('Blur').setSmooth('amount', amount)
      this.tag('Blur').setSmooth('scale', scale, {
        duration: 0.3,
        timingFunction: 'cubic-bezier(0.17, 0.9, 0.32, 1.3)',
      })
    })
  }

  _handleRight() {
    Router.navigate('home/search/vikings/12/22')
  }

  _handleLeft() {
    Router.focusWidget('Menu')
  }

  _handleUp() {
    Router.navigate('home')
  }

  pageTransition() {
    return 'left'
  }
}
