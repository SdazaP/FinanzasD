import { assertFails, assertSucceeds, initializeTestEnvironment, type RulesTestEnvironment } from '@firebase/rules-unit-testing'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { readFileSync } from 'node:fs'
import { afterAll, beforeAll, describe, test } from 'vitest'

const OWNER = '4MAGAbrwFCSyEfxJM3bHgVIeE0a2'
const paths = [
  `users/${OWNER}`,
  `users/${OWNER}/recurring/netflix`,
  `users/${OWNER}/recurring/netflix/payments/p1`,
  `users/${OWNER}/categories/mascotas`,
]

let env: RulesTestEnvironment

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: 'demo-finanzas',
    firestore: { rules: readFileSync('firestore.rules', 'utf8'), host: '127.0.0.1', port: 8080 },
  })
})

afterAll(() => env.cleanup())

describe.each(paths)('%s', (path) => {
  test('el dueño puede leer y escribir', async () => {
    const db = env.authenticatedContext(OWNER).firestore()
    await assertSucceeds(setDoc(doc(db, path), { amount: 100 }))
    await assertSucceeds(getDoc(doc(db, path)))
  })

  test('otro usuario no puede leer ni escribir', async () => {
    const db = env.authenticatedContext('intruso').firestore()
    await assertFails(setDoc(doc(db, path), { amount: 100 }))
    await assertFails(getDoc(doc(db, path)))
  })

  test('sin sesión no se puede leer ni escribir', async () => {
    const db = env.unauthenticatedContext().firestore()
    await assertFails(setDoc(doc(db, path), { amount: 100 }))
    await assertFails(getDoc(doc(db, path)))
  })
})

test('otro usuario tampoco puede usar su propia carpeta', async () => {
  const db = env.authenticatedContext('intruso').firestore()
  await assertFails(setDoc(doc(db, 'users/intruso/recurring/x'), { amount: 1 }))
})
