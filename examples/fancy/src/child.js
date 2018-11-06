import React from 'react';

export default class Child extends React.Component {
  state = {
    counter: 0
  };
  componentDidMount() {
    setInterval(
      () => this.setState(state => ({ counter: state.counter + 2 })),
      1500
    );
  }
  render() {
    return (
      <>
        <div>Here is child counter: {this.state.counter}</div>
      </>
    );
  }
}
