const effect = (key, patch, start) => ({
  create(next) {
    const node = next.node;
    node.effects[key] = patch(start, next[key](node.bag));
    node.update.subscribe("*", value => {
      node.effects[key] = patch(node.effects[key], next[key](node.bag));
    });
  }
});

export default effect;
