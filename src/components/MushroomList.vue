<script setup>
import MushroomCard from './MushroomCard.vue'

defineProps({
  mushrooms: {
    type: Array,
    default: () => []
  }
})
</script>

<template>
  <div class="list-section">
    <h2>香菇列表</h2>
    <p v-if="mushrooms.length === 0" class="empty">目前沒有香菇，快去新增一個！</p>
    <div class="mushroom-list">
      <MushroomCard
        v-for="m in mushrooms"
        :key="m.id"
        :mushroom="m"
      />
    </div>
  </div>
</template>
