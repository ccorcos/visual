const stateful = {
  create(tree) {
    const node = tree.node;
    node.bag.state = tree.stateful.init();
    node.bag.actions = {};
    // connect actions to the event emitter
    Object.keys(tree.stateful.actions).forEach(key => {
      node.bag.actions[key] = value => node.update.emit(key, value);
    });
    node.listeners.stateful = [];
    // subscribe to events to update state
    Object.keys(tree.stateful.actions).forEach(key => {
      node.listeners.stateful.push(
        node.update.subscribe(key, value => {
          node.bag.state = tree.stateful.actions[key](node.bag.state, value);
        })
      );
    });
  },
  update(patch, prev, next, delta) {
    const node = prev.node;
    node.listeners.stateful.forEach(key => node.update.stop(key));
    node.listeners.stateful = [];
    // subscribe to events to update state
    Object.keys(next.stateful.actions).forEach(key => {
      node.listeners.stateful.push(
        node.update.subscribe(key, value => {
          node.bag.state = next.stateful.actions[key](node.bag.state, value);
        })
      );
    });
  }
};

export default stateful;
