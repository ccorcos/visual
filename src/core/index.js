import diffpatcher from "../utils/diffpatcher";
import eventemitter from "../utils/eventemitter";

// There are two parallel trees going on here. There's the decarlative tree description that we get from the developer, and then we have this effectful tree that mutates in place and wires everything up with the outside world.
class Node {
  constructor() {
    this.update = eventemitter();
    this.bag = {};
    this.effects = {};
    this.children = [];
  }
  append(child) {
    this.children.push(child);
  }
  remove(child) {
    this.children.splice(this.children.indexOf(child), 1)
  }
  move(from, to) {
    const [value] = this.children.splice(from, 1)
    this.children.splice(to, 0, value)
  }
}

// This is the core module that gets the developer tree and handles all the externalities. Typically, this involves creating a parallel tree that holds all the mutations and effects.
const core = {
  create(patch, tree) {
    tree.node = new Node();
    if (tree.children) {
      tree.children.forEach(child => {
        tree.node.append(patch(undefined, child));
      });
    }
  },
  destroy(patch, tree) {
    tree.node.update.clear();
    if (tree.children) {
      tree.node.children.forEach(child => {
        patch(child, undefined);
      });
      delete tree.node
    }
  },
  update(patch, prev, next, delta) {
    if (delta.type) {
      if (diffpatcher.isAdded(delta.type)) {
        hook("destroy", patch, prev);
        hook("create", patch, next);
      } else if (diffpatcher.isUpdated(delta.type)) {
        hook("destroy", patch, prev);
        hook("create", patch, next);
      } else {
        throw new Error("this shouldnt happen");
      }
    }
  },

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

  const patch = (prev = undefined, next = {}, delta) => {
    if (!delta) {
      delta = diffpatcher.diff(prev, next);
      if (!delta) {
        return next;
      }
    }
    if (diffpatcher.isAdded(delta)) {
      hook("create", patch, tree);
    } else if (diffpatcher.isUpdated(delta)) {
      throw new Error("this shouldnt happen");
    } else if (diffpatcher.isDeleted(delta)) {
      hook("destroy", patch, tree);
    } else if (diffpatcher.isNested(delta)) {
      if (delta.key) {
        hook("destroy", patch, prev);
        hook("create", patch, next);
      } else {
        hook("update", patch, prev, next, delta)
      } else if (delta.children) {
        // left are deletes and moves on prev
        // right are adds and updates on next
        const { left, right } = Object.keys(delta.children).reduce(
          ({ left, right }, key) => {
            if (key === "_t") {
              return { left, right };
            } else if (key[0] === "_") {
              left.push(key);
              return { left, right };
            } else {
              right.push(key);
              return { left, right };
            }
          },
          { left: [], right: [] }
        );

        left.forEach(key => {
          const d = delta.children[key];
          if (diffpatcher.isDeleted(d)) {
            destroy();
          }
        });
        // find all the children to delete
        // find all the children to move
        // prev.children, prev.node.children
      } else {
        throw new Error("this shouldnt happen");
      }
    } else {
      throw new Error("this shouldnt happen");
    }
    return next;
  };
  return patch;
};

export default init;
