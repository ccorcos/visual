import patchv from "./effects/view";
import patchk from "./effects/keys";
import effect from "./core/effect";
import stateful from "./core/stateful";
import init from "./core/init";
import h from "snabbdom/h";

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

const patch = init([
  stateful,
  effect("keys", patchk, undefined),
  effect("view", patchv, div)
]);

patch({}, Counter());

// TODO.
// - handle diffing children
// examples
// - two counters
// - toggling things into view
// - listof counters
// - weather
// - undoable
// - state machine composition
