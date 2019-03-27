import Vue from 'vue'
import App from './App.vue'
import { createStore } from './store'
import { createRouter } from './router'
import { sync } from 'vuex-router-sync'

const store = createStore()

const router = createRouter(store)
sync(store, router)

router.beforeResolve((to, from, next) => {
  const matched = router.getMatchedComponents(to)

  Promise.all(matched.map(c => {
    if (c.asyncData) {
      return c.asyncData({ store, route: to })
    }
  })).then(() => {
    next()
  }).catch(next)
})

/* eslint-disable no-new */
new Vue({
  el: '#app',
  router,
  store,
  template: '<App/>',
  components: { App }
})
