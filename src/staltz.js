import h from "snabbdom/h";
import { DiffPatcher } from "jsondiffpatch/src/diffpatcher";
import diffpatcher from "./utils/diffpatcher";
import eventemitter from "./utils/eventemitter";
import patchv from "./effects/view";
import patchk from "./effects/keys";

const patchc = (prev = {}, next) => {
  const delta = diffpatcher.diff(prev, next);
  if (!delta) {
    return next;
  }
  console.log(delta);
  if (delta.type) {
    if (diffpatcher.isCreated(delta.type)) {
      // diffpatcher.isCreated
      const node = {};
      node.update = eventemitter();
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
    } else if (diffpatcher.isDestroyed(delta.type)) {
      // diffpatcher.isDestroyed
      prev.node.update.clear();
    } else {
      // diffpatcher.isUpdated
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
// - refactor patches into modules
// - handle diffing children
// - examples
//   - two counters
//   - toggling things into view
//   - listof counters
