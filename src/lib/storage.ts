import type { TestRecord } from '../types'

const KEY = 'methanol-guard-tests-v1'

export function loadTests(): TestRecord[] {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as TestRecord[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function saveTest(record: TestRecord) {
  const all = loadTests()
  all.unshift(record)
  localStorage.setItem(KEY, JSON.stringify(all.slice(0, 200)))
}

export function deleteTest(id: string) {
  localStorage.setItem(KEY, JSON.stringify(loadTests().filter((t) => t.id !== id)))
}

export function clearTests() {
  localStorage.removeItem(KEY)
}
