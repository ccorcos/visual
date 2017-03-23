import diffpatcher from "../utils/diffpatcher";
import eventemitter from "../utils/eventemitter";

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
  return (prev = {}, next = {}) => {
    const delta = diffpatcher.diff(prev, next);
    if (!delta) {
      return next;
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
    } else {
      throw new Error(
        "this shouldnt happen because components of the same type should have the same interface"
      );
    }
    return next;
  };
};

export default init;
