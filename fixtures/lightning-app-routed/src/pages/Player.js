import { Lightning, Router, Utils } from '@lightningjs/sdk'

export default class Player extends Lightning.Component {
  static _template() {
    return {
      rect: true,
      w: 1920,
      h: 1080,
      color: 0xffe233ff,
      Blur: {
        rtt: true,
        w: 1920,
        h: 1080,
        type: Lightning.components.FastBlurComponent,
        amount: 0,
        transitions: {
          amount: { duration: 0.3 },
        },
        content: {
          w: 1920,
          h: 1080,
          Header: {
            mount: 0.5,
            x: 960,
            y: 540,
            text: {
              text: 'Player Page',
              fontFace: 'Bold',
              fontSize: 128,
            },
          },
          SubHeader: {
            mount: 0.5,
            x: 960,
            y: 650,
            text: {
              text: 'Player Page',
              fontFace: 'Regular',
              fontSize: 48,
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
                  text: 'Reload with different params',
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
                  text: 'Non existing page',
                  fontFace: 'Regular',
                  textAlign: 'right',
                  wordWrapWidth: 300,
                  lineHeight: 48,
                },
              },
            },
            Enter: {
              mountX: 0.5,
              x: 960,
              y: 980,
              text: { text: 'press [enter] to show a notification', fontFace: 'Regular' },
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

  /**
   * Tell the router to do a navigate
   */
  _handleUp() {
    const videoId = Math.floor(Math.random() * 300000) + 800000
    Router.navigate(`discover/player/${videoId}`)
  }

  /**
   * Tell the router to do a navigate
   */
  _handleLeft() {
    Router.navigate('this/route/does/not/exist')
  }

  _handleRight() {
    Router.navigate('home/search/vikings')
  }

  /**
   * References to all the widgets are available via:
   * this.widgets
   * @private
   */
  _handleEnter() {
    this.widgets.notification.notify(`Widget notification for videoId: ${this._videoId}`)
  }

  _onUrlParams(args) {
    this._videoId = args.videoId
    this.tag('Blur').content.tag('SubHeader').text = `videoId: ${args.videoId}`
  }

  pageTransition() {
    return 'up'
  }
}
