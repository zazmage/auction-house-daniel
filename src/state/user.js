class Store {
  constructor() { this.state = { profile: null, token: null }; this.subs = new Set() }
  set(next) { this.state = { ...this.state, ...next }; this.subs.forEach(cb => cb(this.state)) }
  subscribe(cb) { this.subs.add(cb); cb(this.state); return () => this.subs.delete(cb) }
}

export const userStore = new Store()
