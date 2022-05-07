<template>
  <h1 class="push-top">Welcome to Forum</h1>
  <category-list :categories="categories" />
</template>

<script>
import CategoryList from '../components/CategoryList.vue';

export default {
  components: { CategoryList },
  name: 'PageHome',
  computed: {
    categories() {
      return this.$store.state.categories;
    }
  },
  async beforeCreate() {
    const categories = await this.$store.dispatch('fetchAllCategories');
    const forumIds = categories.map(category => category.forums).flat();
    this.$store.dispatch('fetchForums', { ids: forumIds });
  },
}
</script>

<style>
</style>