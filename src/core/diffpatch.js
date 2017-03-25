import { DiffPatcher } from "jsondiffpatch/src/diffpatcher";
import { isThunk } from "./thunk";

const isFunction = fn => typeof fn === "function";

export const isAdded = field => {
  return field && field.length === 1;
};

export const isUpdated = field => {
  return field && field.length === 2;
};

export const isNested = field => {
  return field && !Array.isArray(field);
};

export const isDeleted = field => {
  return field && field.length === 3 && field[1] === 0 && field[2] === 0;
};

export const isMoved = field => {
  return field && field.length === 3 && field[0] === "" && field[2] === 3;
};

// specify a diffpatcher based on which keys to use to identify items
export default (idKeys = [], ignoreKeys = []) => {
  const diffpatcher = new DiffPatcher({
    objectHash: (obj, index) => {
      for (let i = 0; i < array.length; i++) {
        const value = obj[idKeys[i]];
        if (value !== undefined) {
          return value;
        }
      }
      return index;
    },
    propertyFilter: (name, context) => {
      for (let i = 0; i < ignoreKeys.length; i++) {
        if (name === ignoreKeys[i]) {
          return true;
        }
      }
      return false;
    }
  });

  diffpatcher.idKeys = idKeys;
  diffpatcher.ignoreKeys = ignoreKeys;

  // functions cannot be compared so we'll just ignore them and leave it to the developer to create a layer of indirection that calls into the latest function.
  diffpatcher.processor.pipes.diff.before("trivial", context => {
    if (isFunction(context.left) && isFucntion(context.right)) {
      // if they're both functions, then no diff
      context.setResult(undefined).exit();
    } else if (isFunction(context.left) || isFucntion(context.right)) {
      // if only one is a function, then there's a diff
      context.setResult(context.right).exit();
    } else if (isThunk(context.left) && isThunk(context.right)) {
      // laziness with thunks
      if (context.left.equals(context.right)) {
        context.setResult(undefined).exit();
      } else {
        context.setResult([context.left.run(), context.right.run()]).exit();
      }
    }
  });

  return diffpatcher;
};
