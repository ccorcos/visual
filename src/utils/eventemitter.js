class EventEmitter {
  constructor() {
    this.id = 0;
    this.subscribers = {};
  }
  subscribe(key, fn) {
    const id = this.id;
    if (!this.subscribers[key]) {
      this.subscribers[key] = {};
    }
    this.subscribers[key][id] = fn;
    this.id++;
    return [key, id];
  }
  stop([key, id]) {
    delete this.subscribers[key][id];
  }
  emit(key, value) {
    Object.keys(this.subscribers[key] || {}).forEach(id =>
      this.subscribers[key][id](value));
    Object.keys(this.subscribers["*"] || {}).forEach(id =>
      this.subscribers["*"][id](value));
  }
  clear() {
    this.subscribers = {};
  }
}

const eventemitter = () => new EventEmitter();
export default eventemitter;
