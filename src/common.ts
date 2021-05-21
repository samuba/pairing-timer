export const localStoragePut = (key: string, value: boolean) => localStorage.setItem(key, `${value}`)
export const localStorageGet = (key: string, defaultValue: boolean) => {
  const val = localStorage.getItem(key)
  if (val === null) return defaultValue
  else return val == "true"
}