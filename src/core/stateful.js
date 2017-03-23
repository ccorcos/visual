const stateful = {
  create(next) {
    const node = next.node;
    node.bag.state = next.stateful.init();
    node.bag.actions = {};
    // connect actions to the event emitter
    Object.keys(next.stateful.actions).forEach(key => {
      node.bag.actions[key] = value => node.update.emit(key, value);
    });
    // subscribe to events to update state
    Object.keys(next.stateful.actions).forEach(key => {
      node.update.subscribe(key, value => {
        node.bag.state = next.stateful.actions[key](node.bag.state, value);
      });
    });
  }
};

export default stateful;
