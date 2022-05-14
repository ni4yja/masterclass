import { createStore } from 'vuex';
import getters from './getters';
import actions from './actions';
import mutations from './mutations';

export default createStore({
  state: {
    categories: [],
    forums: [],
    threads: [],
    posts: [],
    users: [],
    authId: 'VXjpr2WHa8Ux4Bnggym8QFLdv5C3',
    unsubscribes: [],
  },
  getters,
  actions,
  mutations,
})