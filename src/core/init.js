import diffpatcher from "../utils/diffpatcher";
import eventemitter from "../utils/eventemitter";

// diffpatcher = jsondiffpatch.create({
//   objectHash: function(obj, index) {
//     return obj.id || index;
//   }
// });
// diffpatcher.diff(
//   { children: [{ x: 1, y: 2 }, { z: 3 }] },
//   { children: [{ x: 2 }, { y: 4 }] }
// ).children;
// diffpatcher.diff(
//   { children: [{ x: 1, y: 2 }, { z: 3 }] },
//   { children: [{ x: 2 }] }
// ).children;
// diffpatcher.diff(
//   { children: [{ x: 1, y: 2 }, { z: 3 }] },
//   { children: [{ x: 2 }, {}, { p: 0 }] }
// ).children;
// diffpatcher.diff(
//   { children: [{ id: 0, x: 1, y: 2 }, { id: 1, z: 3 }] },
//   { children: [{ id: 0, x: 2 }, { id: 2 }, { id: 1, p: 0 }] }
// ).children;

// > diffpatcher.diff(
// ...   { children: [{ x: 1, y: 2 }, { z: 3 }] },
// ...   { children: [{ x: 2 }, { y: 4 }] }
// ... ).children;
// { '0': { x: [ 1, 2 ], y: [ 2, 0, 0 ] },
//   '1': { z: [ 3, 0, 0 ], y: [ 4 ] },
//   _t: 'a' }
// > diffpatcher.diff(
// ...   { children: [{ x: 1, y: 2 }, { z: 3 }] },
// ...   { children: [{ x: 2 }] }
// ... ).children;
// { '0': { x: [ 1, 2 ], y: [ 2, 0, 0 ] },
//   _t: 'a',
//   _1: [ { z: 3 }, 0, 0 ] }
// > diffpatcher.diff(
// ...   { children: [{ x: 1, y: 2 }, { z: 3 }] },
// ...   { children: [{ x: 2 }, {}, { p: 0 }] }
// ... ).children;
// { '0': { x: [ 1, 2 ], y: [ 2, 0, 0 ] },
//   '1': { z: [ 3, 0, 0 ] },
//   '2': [ { p: 0 } ],
//   _t: 'a' }
// > diffpatcher.diff(
// ...   { children: [{ id: 0, x: 1, y: 2 }, { id: 1, z: 3 }] },
// ...   { children: [{ id: 0, x: 2 }, { id: 2 }, { id: 1, p: 0 }] }
// ... ).children;
// { '0': { x: [ 1, 2 ], y: [ 2, 0, 0 ] },
//   '1': [ { id: 2 } ],
//   '2': { z: [ 3, 0, 0 ], p: [ 0 ] },
//   _t: 'a' }

const core = {
  create(next) {
    const node = {};
    node.update = eventemitter();
    node.bag = {};
    node.effects = {};
    next.node = node;
  },
  destroy(next) {
    next.node.update.clear();
  }
};

const init = modules => {
  const hook = (name, ...args) => {
    if (core[name]) {
      core[name](...args);
    }
    modules.forEach(module => {
      if (module[name]) {
        module[name](...args);
      }
    });
  };
  const patch = (prev = {}, next = {}, delta) => {
    if (!delta) {
      delta = diffpatcher.diff(prev, next);
      if (!delta) {
        return next;
      }
    }
    if (delta.type) {
      if (diffpatcher.isCreated(delta.type)) {
        hook("create", next);
      } else if (diffpatcher.isUpdated(delta.type)) {
        hook("destroy", prev);
        hook("create", next);
      } else if (diffpatcher.isDestroyed(delta.type)) {
        hook("destroy", prev);
      } else {
        throw new Error("this shouldnt happen because type cant be nested");
      }
    } else if (delta.children) {
      Object.keys(delt);
    } else {
      throw new Error(
        "this shouldnt happen because components of the same type should have the same interface"
      );
    }
    return next;
  };
  return patch;
};

export default init;
