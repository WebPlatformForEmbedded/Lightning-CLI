import { Lightning, Router } from '@lightningjs/sdk'
import MenuItem from './MenuItem'

export default class Menu extends Lightning.Component {
  static _template() {
    return {
      rect: true,
      w: 500,
      h: 1920,
      color: 0xff3900a6,
      x: -500,
      transitions: {
        x: { duration: 0.3, timingFunction: 'cubic-bezier(0.17, 0.9, 0.32, 1.3)' },
        w: { duration: 0.3, timingFunction: 'cubic-bezier(0.17, 0.9, 0.32, 1.3)' },
      },
      Items: {
        y: 540,
        mountY: 0.5,
        flex: { direction: 'column' },
        Home: {
          x: 160,
          type: MenuItem,
          label: 'Home',
          pageId: 'home',
        },
        Settings: {
          x: 160,
          type: MenuItem,
          label: 'Settings',
          pageId: 'settings',
        },
      },
    }
  }

  _init() {
    this._index = 0
  }

  _focus() {
    this.patch({
      smooth: {
        x: -100,
      },
    })

    this.application.emit('blurContent', { amount: 3, scale: 1.2 })
  }

  _unfocus() {
    this.patch({
      smooth: {
        x: -500,
      },
    })

    this.application.emit('blurContent', { amount: 0, scale: 1 })
  }

  _handleUp() {
    if (this._index > 0) {
      this._index--
    }
  }

  _handleDown() {
    if (this._index < this.tag('Items').children.length - 1) {
      this._index++
    }
  }

  _handleRight() {
    Router.focusPage()
  }

  _handleEnter() {
    Router.restoreFocus()
    Router.navigate(this.activeItem.pageId)
  }

  get activeItem() {
    return this.tag('Items').children[this._index]
  }

  _getFocused() {
    return this.activeItem
  }
}
