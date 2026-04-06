<script setup>
import { ref } from 'vue'

const emit = defineEmits(['submit'])

const friendCode = ref(localStorage.getItem('pikmin_friend_code') || '')

const SIZES = ['小', '一般', '大', '巨大活動菇']
const TYPES = ['活動', '白', '藍', '紅', '冰藍', '粉紅', '火', '電', '水', '毒', '水晶']
const PLAYERS = [1, 2, 3, 4, 5]

const selectedSize = ref('')
const selectedType = ref('')
const coordinates = ref('')
const selectedPlayers = ref(null)
const error = ref('')

function saveFriendCode() {
  localStorage.setItem('pikmin_friend_code', friendCode.value)
}

function submit() {
  error.value = ''
  if (!/^\d{12}$/.test(friendCode.value)) {
    error.value = '好友代碼必須是 12 位數字'
    return
  }
  if (!selectedSize.value) {
    error.value = '請選擇香菇大小'
    return
  }
  if (!selectedType.value) {
    error.value = '請選擇香菇種類'
    return
  }
  if (!coordinates.value.trim()) {
    error.value = '請輸入座標'
    return
  }
  if (selectedPlayers.value === null) {
    error.value = '請選擇目前人數'
    return
  }
  emit('submit', {
    size: selectedSize.value,
    type: selectedType.value,
    coordinates: coordinates.value.trim(),
    players: selectedPlayers.value,
    friendCode: friendCode.value
  })
  selectedSize.value = ''
  selectedType.value = ''
  coordinates.value = ''
  selectedPlayers.value = null
}
</script>

<template>
  <div class="form-card">
    <h2>新增香菇</h2>

    <div class="field">
      <label>好友代碼（12位）</label>
      <input
        v-model="friendCode"
        @blur="saveFriendCode"
        maxlength="12"
        placeholder="123456789012"
        inputmode="numeric"
      />
    </div>

    <div class="field">
      <label>大小</label>
      <div class="btn-group">
        <button
          v-for="s in SIZES"
          :key="s"
          :class="{ active: selectedSize === s }"
          @click="selectedSize = s"
        >{{ s }}</button>
      </div>
    </div>

    <div class="field">
      <label>種類</label>
      <div class="btn-group">
        <button
          v-for="t in TYPES"
          :key="t"
          :class="{ active: selectedType === t }"
          @click="selectedType = t"
        >{{ t }}</button>
      </div>
    </div>

    <div class="field">
      <label>座標</label>
      <input v-model="coordinates" placeholder="貼上遊戲內座標" />
    </div>

    <div class="field">
      <label>目前人數</label>
      <div class="btn-group">
        <button
          v-for="p in PLAYERS"
          :key="p"
          :class="{ active: selectedPlayers === p }"
          @click="selectedPlayers = p"
        >{{ p }}</button>
      </div>
    </div>

    <p v-if="error" class="error">{{ error }}</p>
    <button class="submit-btn" @click="submit">新增香菇</button>
  </div>
</template>
