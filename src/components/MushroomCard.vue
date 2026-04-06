<script setup>
import { computed } from 'vue'

const props = defineProps({
  mushroom: Object
})

const timeLeft = computed(() => {
  if (!props.mushroom.expiresAt) return '已過期'
  const now = Date.now()
  const expires = props.mushroom.expiresAt.toMillis()
  const diff = expires - now
  if (diff <= 0) return '已過期'
  const h = Math.floor(diff / 3600000)
  const m = Math.floor((diff % 3600000) / 60000)
  return `剩 ${h}小時 ${m}分鐘`
})

const shortCode = computed(() => {
  return props.mushroom.friendCode?.slice(-6) ?? '------'
})
</script>

<template>
  <div class="mushroom-card">
    <div class="card-header">
      <span class="mushroom-name">{{ mushroom.size }} {{ mushroom.type }}菇</span>
      <span class="time-left">{{ timeLeft }}</span>
    </div>
    <div class="card-body">
      <div class="info-row">
        <span class="label">座標</span>
        <span class="value coord">{{ mushroom.coordinates }}</span>
      </div>
      <div class="info-row">
        <span class="label">人數</span>
        <span class="value">{{ mushroom.players }} 人</span>
      </div>
      <div class="info-row">
        <span class="label">代碼後6碼</span>
        <span class="value">****{{ shortCode }}</span>
      </div>
    </div>
  </div>
</template>
