<script setup>
import { useMushrooms } from './composables/useMushrooms'
import MushroomForm from './components/MushroomForm.vue'
import MushroomList from './components/MushroomList.vue'

const { mushrooms, addMushroom } = useMushrooms()
</script>

<template>
  <div id="app">
    <header class="site-header">
      <div class="header-inner">
        <div class="header-title">
          <span class="header-icon">🍄</span>
          <div>
            <h1>打菇約戰系統</h1>
            <p class="header-sub">Pikmin 4 香菇情報板</p>
          </div>
        </div>
        <div class="header-badge">即時同步</div>
      </div>
    </header>

    <main class="layout">
      <section class="form-section">
        <MushroomForm @submit="addMushroom" />
      </section>
      <section class="list-section-wrap">
        <MushroomList :mushrooms="mushrooms" />
      </section>
    </main>

    <footer class="site-footer">
      <p>資料每 12 小時自動清除 · 即時同步所有玩家</p>
    </footer>
  </div>
</template>
