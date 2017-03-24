import { DiffPatcher } from "jsondiffpatch/src/diffpatcher";
import thunk from "./thunk";

// compare a special key property
const diffpatcher = new DiffPatcher({
  objectHash: (obj, index) => {
    if (obj.key !== undefined) {
      return obj.key;
    } else if (obj.type !== undefined) {
      return obj.type;
    } else {
      return index;
    }
  },
  // dont diff the `node` property
  propertyFilter: (name, context) => name !== "node"
});

diffpatcher.processor.pipes.diff.before("trivial", context => {
  // functions cannot be compared so we'll just ignore them. this means that you should create a layer of indirection for calling functions.
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
  }
  // we can introduce laziness using thunks
  if (thunk.isThunk(context.left) && thunk.isThunk(context.right)) {
    if (context.left.equals(context.right)) {
      context.setResult(undefined).exit();
    } else {
      context.setResult([context.left.run(), context.right.run()]).exit();
    }
    return;
  }
});

diffpatcher.isAdded = field => {
  return field && field.length === 1;
};

diffpatcher.isUpdated = field => {
  return field && field.length === 2;
};

diffpatcher.isNested = field => {
  return field && !Array.isArray(field);
};

diffpatcher.isDeleted = field => {
  return field && field.length === 3 && field[1] === 0 && field[2] === 0;
};

// WARNING: its important to check `isMoved(field) === false` because the returned value could be 0!
diffpatcher.isMoved = field => {
  return field && field.length === 3 && field[0] === "" && field[2] === 3;
};

// diffpatcher = jsondiffpatch.create({
//   objectHash: function(obj, index) {
//     return obj.id === undefined ? index : obj.id;
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
// diffpatcher.diff(
//   { children: [{ id: 0, x: 1, y: 2 }, { id: 2 }, { id: 1, z: 3 }] },
//   { children: [{ id: 0, x: 2 }, { id: 1, p: 0 }] }
// ).children;
// diffpatcher.diff(
//   { children: [{ id: 0, x: 1, y: 2 }, { id: 2 }, { id: 1, z: 3 }] },
//   { children: [{ id: 0, x: 2 }, { id: 1, p: 0 }, { id: 2 }] }
// ).children;
// diffpatcher.diff(
//   { children: [{ id: 0, x: 1, y: 2 }, { id: 1, z: 3 }] },
//   { children: [{ id: 3 }, { id: 0, x: 2 }, { id: 2 }, { id: 1, p: 0 }] }
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
// > diffpatcher.diff(
// ...   { children: [{ id: 0, x: 1, y: 2 }, { id: 2 }, { id: 1, z: 3 }] },
// ...   { children: [{ id: 0, x: 2 }, { id: 1, p: 0 }] }
// ... ).children;
// { '0': { x: [ 1, 2 ], y: [ 2, 0, 0 ] },
//   '1': { z: [ 3, 0, 0 ], p: [ 0 ] },
//   _t: 'a',
//   _1: [ { id: 2 }, 0, 0 ] }
// > diffpatcher.diff(
// ...   { children: [{ id: 0, x: 1, y: 2 }, { id: 2 }, { id: 1, z: 3 }] },
// ...   { children: [{ id: 0, x: 2 }, { id: 1, p: 0 }, { id: 2 }] }
// ... ).children;
// { '0': { x: [ 1, 2 ], y: [ 2, 0, 0 ] },
//   '1': { z: [ 3, 0, 0 ], p: [ 0 ] },
//   _t: 'a',
//   _2: [ '', 1, 3 ] }
// > diffpatcher.diff(
// ...   { children: [{ id: 0, x: 1, y: 2 }, { id: 1, z: 3 }] },
// ...   { children: [{ id: 3 }, { id: 0, x: 2 }, { id: 2 }, { id: 1, p: 0 }] }
// ... ).children;
// { '0': [ { id: 3 } ],
//   '1': { x: [ 1, 2 ], y: [ 2, 0, 0 ] },
//   '2': [ { id: 2 } ],
//   '3': { z: [ 3, 0, 0 ], p: [ 0 ] },
//   _t: 'a' }

// diffpatcher.diff(
//   { children: [{ id: 1 }, { id: 2 }] },
//   { children: [{ id: 2 }, { id: 1, x: 1 }] }
// ).children;

// NOTE. Items are deleted and moved first which updates the indexes for anything added or updated.

// find all deleted items
// find all added items
// find all moved items
// find all updated items
// make sure all the indexes are correct!

// {
//   deleted: [[pidx, key]],
//   updated: [[pidx, nidx, key]],
//   added: [[nidx, key]]
// }
//
// diffpatcher.parseArrayDelta = delta => {
//   const { left, right } = Object.keys(delta).reduce(
//     ({ left, right }) => {
//       if (key === "_t") {
//         return { left, right };
//       } else if (key[0] === "_") {
//         left.push({ key, index: Number(key.slice(1)) });
//         return { left, right };
//       } else {
//         right.push({ key, index: Number(key) });
//         return { left, right };
//       }
//     },
//     {
//       left: [],
//       right: []
//     }
//   );
//
//   const deleted = [];
//   const added = [];
//   const updated = [];
//
//   left.forEach(({ key, index }) => {
//     if (diffpatcher.isDeleted(delta[key])) {
//       deleted.push([index, key]);
//     } else if (diffpatcher.isMoved(delta[key])) {
//       const dest = delta[key][1];
//       updated.push([index, dest, key]);
//     } else {
//       throw new Error("this shouldnt happen");
//     }
//   });
//
//   const movedAndUpdated = []
//
//   right.forEach(({ key, index }) => {
//     if (diffpatcher.isAdded(delta[key])) {
//       added.push([index, key]);
//     } else {
//       const move = updated.find(([_, dest]) => dest === index)
//       if (move) {
//         move[2] = key
//       } else {
//         let prev = index
//         deleted.forEach(i => {
//           if (i <= index) {
//             prev += 1
//           }
//         })
//
//       }
//     }
//   });
//

// const keys = Object.keys(delta).reduce(
//   (state, key) => {
//     if (key === "_t") {
//       return state;
//     } else if (key[0] === "_") {
//       const index = Number(key.slice(1));
//       if (diffpatcher.isDeleted(delta[key])) {
//         state.deleted.push(index);
//         return state;
//       } else if (diffpatcher.isMoved(delta[key])) {
//         const dest = delta[key][1];
//         // we're not actually patching, we just want to know the diff.
//         if (index === dest) {
//           return state;
//         } else {
//           state.moves.push([index, dest]);
//           return state;
//         }
//       } else {
//         throw new Error("this shouldnt happen");
//       }
//     } else {
//       const index = Number(key);
//       if (Array.isArray(delta[key])) {
//
//       } else {
//         state.updates.push([index, delta[key]])
//         return state
//       }
//     }
//   },
//   { deleted: [], added: [], moved: [], updated: [] }
// );
// };

export default diffpatcher;
