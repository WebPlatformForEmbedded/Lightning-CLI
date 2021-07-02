import { getToken, doSearch } from './api'

// we import all the pages that we want to add to our app
import { Home, Browse, Player, Search, Settings, Account, NotFound, Error } from '../pages'

export default {
  boot: params => {
    console.log(params)
    return new Promise((resolve, reject) => {
      getToken().then(token => {
        resolve()
      })
    })
    // boot request will always fire
    // on root and deeplink
  },
  // First we define a root, this is the hash were the browser will point to
  // at the moment that you boot your app
  root: 'home',
  // Next we can define the rest of our routes
  routes: [
    {
      // this is a one level deep route.
      path: 'home',
      // define the attached Component that the Router will show
      // on this route. If configured the Router will create an instance
      component: Home,
      before() {
        console.log('before home!')
        return Promise.resolve()
      },
    },
    {
      path: 'settings',
      component: Settings,
      options: {
        preventStorage: false,
      },
    },
    {
      path: 'account',
      component: Account,
      widgets: ['Menu'],
    },
    {
      // we can specify deeper route levels
      path: 'home/browse/adventure',
      component: Browse,
    },
    {
      // and as you can see we can define multiple routes that lead to the same page.
      path: 'home/browse/adventure/new',
      component: Browse,
    },
    {
      path: 'home/search',
      component: Search,
    },
    {
      // We've created a route with a dynamic name (keyword), this translates to the following;
      // when the browser points to: 127.0.0.1:8080/#home/search/vikings the Router will load
      // the Search Page, and add the property keyword to the instance with the value=>vikings
      // you can add a set keyword(){...} and invoke logic if needed.
      path: 'home/search/:keyword',
      component: Search,
      before(page, { keyword }) {
        return doSearch(keyword).then(results => {
          page.results = results
        })
      },
      widgets: ['Menu', 'Notification'],
      cache: 10,
    },
    {
      path: 'account/details/:action',
      component: Account,
      on({ page, action }) {
        // we fake that a async request went wrong and we're
        // rejecting the Promise.
        return new Promise((resolve, reject) => {
          setTimeout(() => {
            reject('Something went wrong, ERROR 343011.22384.18765')
          }, 2000)
        })
      },
    },
    {
      path: 'home/search/:keyword/:amount/:filterId',
      component: Search,
      after(page, { keyword, amount, filterId }) {
        return doSearch(keyword, amount, filterId).then(results => {
          page.results = results
        })
      },
    },
    {
      path: 'discover/player/:videoId{/[0-9a-z]{2,12}/ig}',
      component: Player,
      widgets: ['Notification'],
      hook(page, { videoId }) {
        console.log('You can use:', page)
        console.log('or do something with: ', videoId)
      },
    },
    {
      path: '*',
      component: NotFound,
    },
    {
      path: '!',
      component: Error,
    },
  ],
  beforeEachRoute: async (from, to) => {
    return true
  },
}
