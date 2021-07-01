import { Launch } from '@lightningjs/sdk'
import App from './App'

export default function() {
  return Launch(App, ...arguments)
}
