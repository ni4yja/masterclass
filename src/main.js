import { createApp } from 'vue';
import App from './App.vue';
import AppDate from './components/AppDate.vue';
import router from './router';
import store from './store';

import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

import './style.css';

const firebaseConfig = {
  apiKey: "AIzaSyA5zzEDS8x-Qo49X44U6f3sAuTi7x1KTBU",
  authDomain: "vue-school-forum-7ad8c.firebaseapp.com",
  projectId: "vue-school-forum-7ad8c",
  storageBucket: "vue-school-forum-7ad8c.appspot.com",
  messagingSenderId: "794816557110",
  appId: "1:794816557110:web:c32a8e0db310365d79a897"
};

const app = initializeApp(firebaseConfig);
const firestore = getFirestore(app);

export { firestore };

const forumApp = createApp(App);
forumApp.use(router);
forumApp.use(store);
forumApp.component('AppDate', AppDate);
forumApp.mount('#app');
