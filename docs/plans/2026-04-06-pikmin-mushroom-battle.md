# 皮克敏約戰打菇系統 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 建立一個即時多人共享的皮克敏打菇約戰網頁，玩家可新增香菇資訊並讓其他人即時看到。

**Architecture:** Vue 3 + Vite 單頁應用，Firestore 即時同步資料，部署至 GitHub Pages。資料以 Firestore TTL 機制在 12 小時後自動刪除，前端同時過濾已過期資料。

**Tech Stack:** Vue 3 (Composition API + `<script setup>`), Vite, Firebase Firestore, gh-pages (npm), Tailwind CSS (via CDN or inline)

---

## Task 1: 初始化 Vue 3 + Vite 專案

**Files:**
- Create: `package.json`, `vite.config.js`, `index.html`, `src/main.js`, `src/App.vue`

**Step 1: 建立 Vite + Vue 3 專案**

```bash
cd /Users/teddyhuang/Documents/teddy-playground/pikmin-fighters
npm create vite@latest . -- --template vue
npm install
```

**Step 2: 安裝必要套件**

```bash
npm install firebase gh-pages
```

**Step 3: 確認開發伺服器可運行**

```bash
npm run dev
```
Expected: 瀏覽器開啟 `http://localhost:5173` 顯示 Vue 預設頁面。

**Step 4: 清空預設內容**

修改 `src/App.vue`，移除所有預設 template/script/style 內容，只保留空殼：

```vue
<script setup>
</script>

<template>
  <div id="app">
  </div>
</template>

<style>
</style>
```

刪除 `src/components/HelloWorld.vue`，清空 `src/style.css`。

**Step 5: Commit**

```bash
git init
git add .
git commit -m "初始化 Vue 3 + Vite 專案"
```

---

## Task 2: 設定 Firebase Firestore

**Files:**
- Create: `src/firebase.js`

**Step 1: 在 Firebase Console 建立專案**

1. 前往 https://console.firebase.google.com/
2. 建立新專案（名稱例：`pikmin-mushroom-battle`）
3. 在 Firestore Database 建立資料庫（選擇 production mode）
4. 在 Project Settings → Your apps 新增 Web App，取得 firebaseConfig

**Step 2: 建立 `src/firebase.js`**

```js
import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
}

const app = initializeApp(firebaseConfig)
export const db = getFirestore(app)
```

**Step 3: 設定 Firestore 安全規則**

在 Firebase Console → Firestore → Rules 設定：

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /mushrooms/{docId} {
      allow read: if true;
      allow create: if request.resource.data.friendCode.size() == 12
                    && request.resource.data.friendCode.matches('[0-9]+')
                    && request.resource.data.size is number
                    && request.resource.data.type is string
                    && request.resource.data.coordinates is string
                    && request.resource.data.players is number;
      allow delete: if true;
      allow update: if false;
    }
  }
}
```

**Step 4: 設定 Firestore TTL**

在 Firebase Console → Firestore → Indexes → TTL policies，新增：
- Collection group: `mushrooms`
- TTL field: `expiresAt`

**Step 5: Commit**

```bash
git add src/firebase.js
git commit -m "設定 Firebase Firestore 連接"
```

---

## Task 3: 建立資料模型與 Composable

**Files:**
- Create: `src/composables/useMushrooms.js`

**Step 1: 建立 `src/composables/useMushrooms.js`**

```js
import { ref, onUnmounted } from 'vue'
import { db } from '../firebase'
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  Timestamp
} from 'firebase/firestore'

export function useMushrooms() {
  const mushrooms = ref([])

  // 即時監聽，只顯示未過期的香菇，依新增時間降序
  const q = query(
    collection(db, 'mushrooms'),
    where('expiresAt', '>', Timestamp.now()),
    orderBy('expiresAt', 'desc'),
    orderBy('createdAt', 'desc')
  )

  const unsubscribe = onSnapshot(q, (snapshot) => {
    mushrooms.value = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
  })

  onUnmounted(unsubscribe)

  async function addMushroom({ size, type, coordinates, players, friendCode }) {
    const now = Timestamp.now()
    const expiresAt = Timestamp.fromMillis(now.toMillis() + 12 * 60 * 60 * 1000)
    await addDoc(collection(db, 'mushrooms'), {
      size,
      type,
      coordinates,
      players,
      friendCode,
      createdAt: now,
      expiresAt
    })
  }

  return { mushrooms, addMushroom }
}
```

**Step 2: Commit**

```bash
git add src/composables/useMushrooms.js
git commit -m "新增 useMushrooms composable"
```

---

## Task 4: 建立新增香菇表單元件

**Files:**
- Create: `src/components/MushroomForm.vue`

**Step 1: 建立 `src/components/MushroomForm.vue`**

```vue
<script setup>
import { ref, onMounted } from 'vue'

const emit = defineEmits(['submit'])

// 從 localStorage 讀取好友代碼
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
  if (!selectedPlayers.value) {
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
  // 重置除好友代碼以外的欄位
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
```

**Step 2: Commit**

```bash
git add src/components/MushroomForm.vue
git commit -m "新增 MushroomForm 元件"
```

---

## Task 5: 建立香菇列表元件

**Files:**
- Create: `src/components/MushroomList.vue`
- Create: `src/components/MushroomCard.vue`

**Step 1: 建立 `src/components/MushroomCard.vue`**

```vue
<script setup>
import { computed } from 'vue'
import { Timestamp } from 'firebase/firestore'

const props = defineProps({
  mushroom: Object
})

const timeLeft = computed(() => {
  const now = Date.now()
  const expires = props.mushroom.expiresAt.toMillis()
  const diff = expires - now
  if (diff <= 0) return '已過期'
  const h = Math.floor(diff / 3600000)
  const m = Math.floor((diff % 3600000) / 60000)
  return `${h}小時 ${m}分鐘`
})

const shortCode = computed(() => {
  const code = props.mushroom.friendCode
  return code.slice(-6)
})
</script>

<template>
  <div class="mushroom-card">
    <div class="card-header">
      <span class="mushroom-name">{{ mushroom.size }} {{ mushroom.type }}菇</span>
      <span class="time-left">剩 {{ timeLeft }}</span>
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
```

**Step 2: 建立 `src/components/MushroomList.vue`**

```vue
<script setup>
import MushroomCard from './MushroomCard.vue'

defineProps({
  mushrooms: Array
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
```

**Step 3: Commit**

```bash
git add src/components/MushroomList.vue src/components/MushroomCard.vue
git commit -m "新增 MushroomList 與 MushroomCard 元件"
```

---

## Task 6: 組合主頁面與全域樣式

**Files:**
- Modify: `src/App.vue`
- Modify: `src/style.css`

**Step 1: 更新 `src/App.vue`**

```vue
<script setup>
import { useMushrooms } from './composables/useMushrooms'
import MushroomForm from './components/MushroomForm.vue'
import MushroomList from './components/MushroomList.vue'

const { mushrooms, addMushroom } = useMushrooms()
</script>

<template>
  <div id="app">
    <header>
      <h1>皮克敏 打菇約戰系統</h1>
    </header>
    <main>
      <MushroomForm @submit="addMushroom" />
      <MushroomList :mushrooms="mushrooms" />
    </main>
  </div>
</template>
```

**Step 2: 更新 `src/style.css`（皮克敏主題配色）**

使用綠色系皮克敏主題配色，包含：
- `body`: 淺綠底色背景，無 serif 字型
- `.form-card`, `.list-section`: 白色卡片、圓角、陰影
- `.btn-group button`: 灰色預設，點選後變綠色（`active` class）
- `.submit-btn`: 深綠色大按鈕
- `.mushroom-card`: 帶左側彩色邊框的卡片
- `.error`: 紅色文字
- RWD：手機版單欄，桌機版雙欄並排（form 左、list 右）

**Step 3: 執行開發伺服器確認畫面正常**

```bash
npm run dev
```
Expected: 看到完整介面，可新增香菇並出現在列表中。

**Step 4: Commit**

```bash
git add src/App.vue src/style.css
git commit -m "完成主頁面與全域樣式"
```

---

## Task 7: 設定 GitHub Pages 部署

**Files:**
- Modify: `vite.config.js`
- Modify: `package.json`

**Step 1: 設定 `vite.config.js` 的 base path**

GitHub Pages 的 repo 名稱為 `pikmin-fighters`，需設定 base：

```js
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  base: '/pikmin-fighters/'
})
```

**Step 2: 在 `package.json` 新增 deploy script**

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "deploy": "npm run build && gh-pages -d dist"
  }
}
```

**Step 3: 在 GitHub 建立 repository**

```bash
git remote add origin https://github.com/<YOUR_USERNAME>/pikmin-fighters.git
git push -u origin main
```

**Step 4: 部署到 GitHub Pages**

```bash
npm run deploy
```
Expected: 成功推送到 `gh-pages` 分支。

**Step 5: 在 GitHub repo 設定 Pages**

前往 GitHub repo → Settings → Pages → Source 選擇 `gh-pages` 分支。

**Step 6: 確認網站上線**

前往 `https://<YOUR_USERNAME>.github.io/pikmin-fighters/`，確認頁面正常顯示。

**Step 7: Commit**

```bash
git add vite.config.js package.json
git commit -m "設定 GitHub Pages 部署"
```

---

## 資料結構總覽

```
Firestore collection: mushrooms
{
  id: string (auto),
  size: "小" | "一般" | "大" | "巨大活動菇",
  type: "活動" | "白" | "藍" | "紅" | "冰藍" | "粉紅" | "火" | "電" | "水" | "毒" | "水晶",
  coordinates: string,
  players: 1 | 2 | 3 | 4 | 5,
  friendCode: string (12位數字),
  createdAt: Timestamp,
  expiresAt: Timestamp (createdAt + 12小時, 設定為 TTL field)
}
```

## 注意事項

- Firebase config 中的 apiKey 是公開可見的（正常現象），安全靠 Firestore Rules 控管
- Firestore TTL 最多有 24 小時延遲才真正刪除，但前端 query 已過濾不顯示
- `巨大活動菇` 在大小選項中，種類按鈕可選可不選（特殊情況）
