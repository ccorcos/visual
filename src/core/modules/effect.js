const effect = (key, patch, start) => ({
  create(tree) {
    const node = tree.node;
    node.effects[key] = patch(start, tree[key](node.bag));
    node.listeners[`effect-${key}`] = node.update.subscribe("*", value => {
      node.effects[key] = patch(node.effects[key], tree[key](node.bag));
    });
  },
  update(patch, prev, next, delta) {
    const node = prev.node;
    node.update.stop(node.listeners[`effect-${key}`]);
    node.listeners[`effect-${key}`] = node.update.subscribe("*", value => {
      node.effects[key] = patch(node.effects[key], next[key](node.bag));
    });
  }
});

export default effect;
