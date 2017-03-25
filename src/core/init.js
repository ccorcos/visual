import { isAdded, isDeleted, isUpdated, isMoved } from "./diffpatch";

const init = (diffpatcher, core) =>
  modules => {
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

    const patch = (prev, next, delta) => {
      // when we recurse, we might have already computed the delta
      if (!delta) {
        delta = diffpatcher.diff(prev, next);
        // if they're the same, we still might need to patch the new functions
        if (!delta) {
          hook("update", patch, prev, next, delta);
          return next;
        }
      }
      if (isAdded(delta)) {
        hook("create", patch, delta[1]);
        return next;
      }
      if (isUpdated(delta)) {
        throw new Error(
          "this shouldnt happen so long as the tree is defined by an object, which it should..."
        );
      }
      if (isDeleted(delta)) {
        hook("destroy", patch, prev);
        return next;
      }
      if (isNested(delta)) {
        // if you change the id, then we're going to treat that like creating everything anew.
        for (var i = 0; i < diffpatcher.idKeys.length; i++) {
          if (delta[diffpatcher.idKeys[i]]) {
            hook("destroy", patch, prev);
            hook("create", patch, next);
            return next;
          }
        }
        hook("update", patch, prev, next, delta);
        return next;
      }
      throw new Error("this shouldnt happen");
    };
    return patch;
  };

export default init;
