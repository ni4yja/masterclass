import { docToResource, findById } from '../helpers';
import { firestore } from '../main';
import { doc, onSnapshot, getDocs, collection, writeBatch, arrayUnion, serverTimestamp, getDoc, increment, updateDoc } from '@firebase/firestore';

export default {
  async createPost({ commit, state }, post) {
    post.userId = state.authId;
    post.publishedAt = serverTimestamp();
    const postRef = doc(collection(firestore, 'posts'));
    const userRef = doc(collection(firestore, 'users'), state.authId);
    console.log(userRef);

    const batch = writeBatch(firestore);  
    batch.set(postRef, post);
    batch.update(doc(firestore, 'threads', post.threadId), {
      posts: arrayUnion(postRef.id),
      contributors: arrayUnion(state.authId),
    });
    batch.update(userRef, {
      postsCount: increment(1)
    });
    await batch.commit();
    console.log(userRef);
    
    const newPost = await getDoc(postRef);

    commit('setItem', { resource: 'posts', item: { ...newPost.data(), id: newPost.id } }) // set the post
    commit('appendPostToThread', { childId: newPost.id, parentId: post.threadId }) // append post to thread
    commit('appendContributorToThread', { childId: state.authId, parentId: post.threadId });
  },
  async updatePost ({ commit, state }, { text, id }) {
    const post = {
      text,
      edited: {
        at: serverTimestamp(),
        by: state.authId,
        moderated: false
      }
    }
    const postRef = doc(collection(firestore, 'posts'), id);
    await updateDoc(postRef, post);
    const updatedPost = await getDoc(postRef);
    commit('setItem', { resource: 'posts', item: updatedPost });
  },
  async createThread({ commit, state, dispatch }, { title, text, forumId }) {
    const userId = state.authId;
    const publishedAt = serverTimestamp();
    const threadRef = doc(collection(firestore, 'threads'));  
    const userRef = doc(collection(firestore, 'users'), userId);
    const forumRef = doc(collection(firestore, 'forums'), forumId);
    
    const thread = {
      forumId,
      title,
      publishedAt,
      userId,
      id: threadRef.id,
    };

    const batch = writeBatch(firestore);
    batch.set(threadRef, thread);
    batch.update(userRef, {
      threads: arrayUnion(threadRef.id)
    });
    batch.update(forumRef, {
      threads: arrayUnion(threadRef.id)
    });
    await batch.commit();

    const newThread = await getDoc(threadRef);

    commit('setItem', { resource: 'threads', item: { ...newThread.data(), id: newThread.id } });
    commit('appendThreadToUser', { parentId: userId, childId: threadRef.id });
    commit('appendThreadToForum', { parentId: forumId, childId: threadRef.id });
    await dispatch('createPost', { text, threadId: threadRef.id });
    return findById(state.threads, threadRef.id);
  },
  async updateThread({ commit, state }, { title, text, id }) {
    const thread = findById(state.threads, id);
    const post = findById(state.posts, thread.posts[0]);

    let newThread = { ...thread, title };
    let newPost = { ...post, text };

    const threadRef = doc(collection(firestore, 'threads'), id); 
    const postRef = doc(collection(firestore, 'posts'), post.id);
    
    const batch = writeBatch(firestore);
    batch.update(threadRef, newThread);
    batch.update(postRef, newPost);
    await batch.commit();

    newThread = await getDoc(threadRef);
    newPost = await getDoc(postRef);
    
    commit('setItem', { resource: 'threads', item: newThread });
    commit('setItem', { resource: 'posts', item: newPost });
    
    return docToResource(newThread);
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
      const docRef = doc(collection(firestore, resource), id);
      const unsubscribe = onSnapshot(docRef, (doc) => {
        const item = { ...doc.data(), id: doc.id };
        commit('setItem', { resource, id, item });
        resolve(item);
      });
      commit('appendUnsubscribe', { unsubscribe });
    });
  },
  fetchItems({ dispatch }, { ids, resource }) {
    return Promise.all(ids.map(id => dispatch('fetchItem', { id, resource })));
  },
  async unsubscribeAllSnapshots ({ state, commit }) {
    state.unsubscribes.forEach(unsubscribe => unsubscribe());
    commit('clearAllUnsubscribes');
  },
}