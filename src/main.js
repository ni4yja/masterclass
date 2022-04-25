import { createApp } from 'vue';
import App from './App.vue';
import AppDate from './components/AppDate.vue';
import router from './router';
import store from './store'

import './style.css';

const forumApp = createApp(App);
forumApp.use(router);
forumApp.use(store);
forumApp.component('AppDate', AppDate);
forumApp.mount('#app');
