<template>
  <div
  v-if="asyncDataStatus_ready"
    class="container"
  >
    <h1 class="push-top">Welcome to Forum</h1>
    <category-list :categories="categories" />
  </div>
</template>

<script>
import CategoryList from '../components/CategoryList.vue';
import { mapActions } from 'vuex';
import asyncDataStatus from '../mixins/asyncDataStatus';

export default {
  name: 'PageHome',
  components: { CategoryList },
  mixins: [asyncDataStatus],
  computed: {
    categories() {
      return this.$store.state.categories;
    }
  },
  async created() {
    const categories = await this.fetchAllCategories();
    const forumIds = categories.map(category => category.forums).flat();
    await this.fetchForums({ ids: forumIds });
    this.asyncDataStatus_fetched();
  },
  methods: {
    ...mapActions(['fetchAllCategories', 'fetchForums']),
  },
}
</script>

<style>
</style>