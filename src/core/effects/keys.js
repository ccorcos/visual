import diffpatcher from "../diffpatcher";
import eventemitter from "../utils/eventemitter";
import keymaster from "keymaster";

const create = next => {
  const node = {};
  node.update = eventemitter();
  node.listeners = {};
  // create keymaster listeners
  Object.keys(next.keys).forEach(key => {
    keymaster(key, () => node.update.emit(key));
  });
  // create subscriptions
  Object.keys(next.keys).forEach(key => {
    node.listeners[key] = node.update.subscribe(key, () => next.keys[key]());
  });
  next.node = node;
  return next;
};

// TODO. recurse children
const patch = (prev = {}, next) => {
  const delta = diffpatcher.diff(prev, next);
  if (!delta) {
    return next;
  }
  if (delta.keys) {
    if (diffpatcher.isAdded(delta.keys)) {
      next.node = create(next);
    } else if (diffpatcher.isUpdated(delta.keys)) {
      throw new Error(
        "this should never happen because keys should always be an object."
      );
    } else if (diffpatcher.isDeleted(delta.keys)) {
      next.node.update.clear();
    } else {
      Object.keys(delta.keys).forEach(key => {
        if (diffpatcher.isAdded(delta.keys[key])) {
          next.node.update.subscribe(key, () => next.keys[key]());
        } else if (diffpatcher.isUpdated(delta.keys[key])) {
          throw new Error(
            "this should never happen because functions do not diff."
          );
        } else if (diffpatcher.isDeleted(delta.keys[key])) {
          next.node.update.stop(next.node.listeners[key]);
          delete next.node.listeners[key];
        } else {
          throw new Error("this should never happen because this isnt a diff.");
        }
      });
    }
  }
  return next;
};

export default patch;
