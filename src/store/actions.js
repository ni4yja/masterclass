import { findById } from '../helpers';
import { firestore } from '../main';
import { doc, onSnapshot, getDocs, collection, writeBatch, arrayUnion } from '@firebase/firestore';

export default {
  async createPost({ commit, state }, post) {
    post.userId = state.authId;
    post.publishedAt = Math.floor(Date.now() / 1000);

    const batch = writeBatch(firestore);
    const postRef = doc(collection(firestore, 'posts'));
    batch.set(postRef, post);
    batch.update(doc(firestore, 'threads', post.threadId), {
      posts: arrayUnion(postRef.id),
      contributors: arrayUnion(state.authId),
    });

    await batch.commit();

    commit('setItem', { resource: 'posts', item: { ...post, id: postRef.id } }); // set the post
    commit('appendPostToThread', { childId: postRef.id, parentId: post.threadId });
    commit('appendContributorToThread', { childId: state.authId, parentId: post.threadId });
  },
  async createThread({ commit, state, dispatch }, { title, text, forumId }) {
    const id = 'qqqq' + Math.random();
    const userId = state.authId;
    const publishedAt = Math.floor(Date.now() / 1000);
    const thread = { forumId, title, publishedAt, userId, id };
    commit('setItem', { resource: 'threads', item: thread });
    commit('appendThreadToUser', { parentId: userId, childId: id })
    commit('appendThreadToForum', { parentId: forumId, childId: id })
    dispatch('createPost', { text, threadId: id });
    return findById(state.threads, id);
  },
  async updateThread({ commit, state }, { title, text, id }) {
    const thread = findById(state.threads, id);
    const post = findById(state.posts, thread.posts[0]);
    const newThread = { ...thread, title };
    const newPost = { ...post, text };
    commit('setItem', { resource: 'threads', item: newThread });
    commit('setItem', { resource: 'posts', item: newPost });
    return newThread;
  },
  updateUser({ commit }, user) {
    commit('setItem', { resource: 'users', item: user });
  },
  // ---------------------------------------
  // Fetch Single Resource
  // ---------------------------------------
  fetchCategory: ({ dispatch }, { id }) => dispatch('fetchItem', { resource: 'categories', id }),
  fetchForum: ({ dispatch }, { id }) => dispatch('fetchItem', { resource: 'forums', id }),
  fetchThread: ({ dispatch }, { id }) => dispatch('fetchItem', { resource: 'threads', id }),
  fetchPost: ({ dispatch }, { id }) => dispatch('fetchItem', { resource: 'posts', id }),
  fetchUser: ({ dispatch }, { id }) => dispatch('fetchItem', { resource: 'users', id }),
  fetchAuthUser: ({ dispatch, state }) => dispatch('fetchItem', { resource: 'users', id: state.authId }),
  // ---------------------------------------
  // Fetch All of a Resource
  // ---------------------------------------
  fetchAllCategories({ commit }) {
    return new Promise((resolve) => {
      getDocs(collection(firestore, 'categories')).then((querySnapshot) => {
        const categories = querySnapshot.docs.map((doc) => {
          const item = { id: doc.id, ...doc.data() };
          commit('setItem', { resource: 'categories', item });
          return item;
        });
        resolve(categories);
      });
    });    
  },
  fetchCategories: ({ dispatch }, { ids }) => dispatch('fetchItems', { resource: 'categories', ids }),
  fetchForums: ({ dispatch }, { ids }) => dispatch('fetchItems', { resource: 'forums', ids }),
  fetchThreads: ({ dispatch }, { ids }) => dispatch('fetchItems', { resource: 'threads', ids }),
  fetchPosts: ({ dispatch }, { ids }) => dispatch('fetchItems', { resource: 'posts', ids }),
  fetchUsers: ({ dispatch }, { ids }) => dispatch('fetchItems', { resource: 'users', ids }),

  fetchItem({ state, commit }, { resource, id }) {
    return new Promise((resolve) => {
      onSnapshot(doc(firestore, resource, id), (doc) => {
        const item = { ...doc.data(), id: doc.id };
        commit('setItem', { resource, id, item });
        resolve(item);
      });
    });
  },
  fetchItems ({ dispatch }, { ids, resource }) {
    return Promise.all(ids.map(id => dispatch('fetchItem', { id, resource })));
  }
}