export class Thunk {
  constructor(fn, ...args) {
    this.fn = fn;
    this.args = args;
  }
  equals(t2) {
    const t1 = this;
    if (t1.fn !== t2.fn) {
      return false;
    }
    if (t1.args.length !== t2.args.length) {
      return false;
    }
    for (let i = 0; i < t1.args.length; i++) {
      if (t1.args[i] !== t2.args[i]) {
        return false;
      }
    }
    return true;
  }
  run() {
    if (this.result) {
      return this.result;
    } else {
      this.result = this.fn(...this.args);
      return this.result;
    }
  }
}

const thunk = (...args) => new Thunk(...args);

export const isThunk = obj => obj instanceof Thunk;

export default thunk;
