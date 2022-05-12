<template>
  <h1 class="push-top">Welcome to Forum</h1>
  <category-list :categories="categories" />
</template>

<script>
import CategoryList from '../components/CategoryList.vue';
import { mapActions } from 'vuex';

export default {
  components: { CategoryList },
  name: 'PageHome',
  computed: {
    categories() {
      return this.$store.state.categories;
    }
  },
  async created() {
    const categories = await this.fetchAllCategories();
    const forumIds = categories.map(category => category.forums).flat();
    this.fetchForums({ ids: forumIds });
  },
  methods: {
    ...mapActions(['fetchAllCategories', 'fetchForums']),
  },
}
</script>

<style>
</style>