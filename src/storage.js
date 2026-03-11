// localStorage adapter — replaces window.storage from the Claude artifact environment
export const storage = {
  async get(key) {
    const val = localStorage.getItem(key);
    if (val === null) throw new Error('Key not found: ' + key);
    return { key, value: val };
  },
  async set(key, value) {
    localStorage.setItem(key, value);
    return { key, value };
  },
  async delete(key) {
    localStorage.removeItem(key);
    return { key, deleted: true };
  },
  async list(prefix) {
    const keys = Object.keys(localStorage).filter(k => !prefix || k.startsWith(prefix));
    return { keys };
  },
};