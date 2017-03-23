import snabbdom from "snabbdom";
import classModule from "snabbdom/modules/class";
import propsModule from "snabbdom/modules/props";
import styleModule from "snabbdom/modules/style";
import eventModule from "snabbdom/modules/eventlisteners";
import h from "snabbdom/h";
import { DiffPatcher } from "jsondiffpatch/src/diffpatcher";
import keymaster from "keymaster";

const patchv = snabbdom.init([
  classModule,
  propsModule,
  styleModule,
  eventModule
]);

const diffpatcher = new DiffPatcher({
  objectHash: obj => obj.key
});

diffpatcher.processor.pipes.diff.before("trivial", context => {
  // functions are ignored
  if (
    typeof context.left === "function" && typeof context.right === "function"
  ) {
    context.setResult(undefined).exit();
    return;
  }
  if (
    typeof context.left === "function" || typeof context.right === "function"
  ) {
    context.setResult(context.right).exit();
    // throw new Error(
    //   "you cannot add or remove functions. functions are aliased since they cannot be diffed."
    // );
  }
  // lazy Thunks
  if (context.left instanceof Thunk && context.right instanceof Thunk) {
    if (context.left.equals(context.right)) {
      context.setResult(undefined).exit();
    } else {
      context.setResult([context.left.run(), context.right.run()]).exit();
    }
    return;
  }
});

class Thunk {
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
const created = field => {
  return field && field.length === 1;
};

const updated = field => {
  return field && field.length === 2;
};

const destroyed = field => {
  return field && field.length === 3;
};

const patchk = (prev = {}, next) => {
  const delta = diffpatcher.diff(prev, next);
  if (!delta) {
    return next;
  }
  if (delta.keys) {
    if (created(delta.keys)) {
      // created
      const node = {};
      node.element = next;
      node.update = new EventEmitter();
      // create keymaster listeners
      Object.keys(next.keys).forEach(key => {
        keymaster(key, () => node.update.emit(key));
      });
      // create subscriptions
      Object.keys(next.keys).forEach(key => {
        node.update.subscribe(key, () => next.keys[key]());
      });
      next.node = node;
      return next;
    } else if (destroyed(delta.keys)) {
      next.node.update.destroy();
    } else {
      // updated
    }
  } else {
    // updated
  }
  return next;
};

const patchc = (prev = {}, next) => {
  const delta = diffpatcher.diff(prev, next);
  if (!delta) {
    return next;
  }
  if (delta.type) {
    if (created(delta.type)) {
      // created
      const node = {};
      node.update = new EventEmitter();
      node.bag = {};
      node.bag.state = next.stateful.init();
      node.bag.actions = {};
      // connect actions to the event emitter
      Object.keys(next.stateful.actions).forEach(key => {
        node.bag.actions[key] = value => node.update.emit(key, value);
      });
      // subscribe to events to update state
      Object.keys(next.stateful.actions).forEach(key => {
        node.update.subscribe(key, value => {
          node.bag.state = next.stateful.actions[key](node.bag.state, value);
        });
      });
      // patch the view and subscribe to updates
      node.effects = {};
      node.effects.view = patchv(prev.node.effects.view, next.view(node.bag));
      node.update.subscribe("*", value => {
        node.effects.view = patchv(node.effects.view, next.view(node.bag));
      });

      node.effects.keys = patchk(prev.node.effects.keys, next.keys(node.bag));
      node.update.subscribe("*", value => {
        node.effects.keys = patchk(node.effects.keys, next.keys(node.bag));
      });

      next.node = node;
      return next;
    } else if (destroyed(delta.type)) {
      // destroyed
      prev.node.update.clear();
    } else {
      // updated
      // TODO.
    }
    // TODO.
    // if (delta.children) {
    //   // recurse
    // }
  } else {
    // update node
    console.error("this shouldnt happen");
    // TODO.
    // if (delta.children) {
    //   // recurse
    // }
  }
  return next;
};

const Counter = () => ({
  // when components are the same type, the state carries over!
  type: "counter",
  stateful: {
    init: () => 0,
    actions: {
      inc: (state, event) => state + 1,
      dec: (state, event) => state - 1
    }
  },
  view: ({ state, actions }, children) =>
    h("div", [
      h("button", { on: { click: actions.dec } }, "-"),
      h("span", state.toString()),
      h("button", { on: { click: actions.inc } }, "+")
    ]),
  keys: ({ state, actions }, children) => ({
    keys: {
      "=": actions.inc,
      "-": actions.dec
    }
  })
});

const div = document.createElement("div");
document.body.appendChild(div);

const rootc = patchc(
  {
    node: {
      effects: {
        view: div,
        keys: {}
      }
    }
  },
  Counter()
);

// TODO.
// - hotkeys effects driver
// - refactor patches into modules
// - handle diffing children
// - examples
//   - two counters
//   - toggling things into view
//   - listof counters
