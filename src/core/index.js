import diffpatch, { isAdded, isDeleted, isUpdated, isMoved } from "./diffpatch";
import init from "./init";
import eventemitter from "./eventemitter";

// There are two parallel trees going on here. There's the decarlative tree description that we get from the developer, and then we have this effectful tree that mutates in place and wires everything up with the outside world.
class Node {
  constructor() {
    this.update = eventemitter();
    this.bag = {};
    this.effects = {};
    this.children = [];
    this.listeners = {};
  }
  append(child) {
    this.children.push(child);
  }
  insert(child, index) {
    this.children.splice(child, index);
  }
  remove(child) {
    this.children.splice(this.children.indexOf(child), 1);
  }
  move(child, to) {
    this.remove(child);
    this.children.splice(to, 0, child);
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
      delete tree.node;
    }
  },
  update(patch, prev, next, delta) {
    // we want to carry over the node regardless
    const node = prev.node;
    next.node = node;
    if (!delta) {
      return;
    }
    if (delta.children) {
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
        const child = prev.children[Number(key.slice(1))];
        if (isDeleted(d)) {
          node.remove(child);
          patch(child, undefined);
        } else if (isMoved(d)) {
          node.move(child, d[1]);
        }
      });

      right.forEach(key => {
        const d = delta.children[key];
        if (isAdded(d)) {
          const child = d[0];
          node.insert(patch(undefined, child, d), Number(key));
        } else if (isUpdated(d)) {
          const i = Number(key);
          patch(node.children[i], next.children[i], d);
        }
      });
    }
  }
};

export default init(diffpatch(["key", "type"], ["node"]), core);
