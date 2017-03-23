import { DiffPatcher } from "jsondiffpatch/src/diffpatcher";
import thunk from "./thunk";

// compare a special key property
const diffpatcher = new DiffPatcher({
  objectHash: (obj, index) => obj.key || index,
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

diffpatcher.isCreated = field => {
  return field && field.length === 1;
};

diffpatcher.isUpdated = field => {
  return field && field.length === 2;
};

diffpatcher.iDestroyed = field => {
  return field && field.length === 3;
};

export default diffpatcher;
