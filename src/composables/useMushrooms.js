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
  }, (error) => {
    console.error('Firestore 監聽失敗', error)
  })

  onUnmounted(unsubscribe)

  async function addMushroom({ size, type, coordinates, players, friendCode }) {
    const now = Timestamp.now()
    const expiresAt = Timestamp.fromMillis(now.toMillis() + 12 * 60 * 60 * 1000)
    try {
      await addDoc(collection(db, 'mushrooms'), {
        size,
        type,
        coordinates,
        players,
        friendCode,
        createdAt: now,
        expiresAt
      })
    } catch (error) {
      console.error('新增香菇失敗', error)
      throw error
    }
  }

  return { mushrooms, addMushroom }
}
