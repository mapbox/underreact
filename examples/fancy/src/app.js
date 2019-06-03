import React from 'react';
import _ from 'lodash';
import pFinally from 'p-finally';
import { hot } from 'react-hot-loader';

import Child from './child';
import './bg.css';
import './styles.less';

const DynamicComponent = React.lazy(() => import('./dynamic'));

class App extends React.Component {
  state = {
    counter: 0
  };
  componentDidMount() {
    setInterval(
      () => this.setState(state => ({ counter: state.counter + 1 })),
      1500
    );
    pFinally(Promise.resolve(), () => {
      console.log('resolved!');
    });
    pFinally(Promise.reject().catch(() => {}), () => {
      console.log('rejected!');
    });
  }
  render() {
    return (
      <div>
        <p>Here's a random number: {_.random(0, 100)}</p>
        <p>Here's a the state counter: {this.state.counter}</p>
        <Child />
        <p>
          Did the DefinePlugin work?{' '}
          {typeof DEFINE_WORKED === 'undefined' ? 'No' : DEFINE_WORKED}
        </p>
        <p>Less-loading worked if this text is light blue.</p>
        <p className="blink">
         HTML base path injection works if this text blinks.
        </p>
        <p>
          Value of the env variable CLIENT_TOKEN:{' '}
          {process.env.CLIENT_TOKEN}
        </p>
        <p>
          Does it leak SECRET_TOKEN:{' '}
          {process.env.SECRET_TOKEN === undefined ? 'No' : 'Yes'}
        </p>
        <p>Background image snowflake:</p>
        <div className="snowflake" style={{ height: 300, width: 300 }} />
        <p>Real image snowflake:</p>
        <img src={`${process.env.BASE_PATH}/images/snowflake.jpg`} />
        <p>
          The library <code>p-finally</code> is not ES5, so this page should
          throw an error in older browsers like IE11.
        </p>
        <React.Suspense fallback={<div>Loading dynamic component...</div>}>
          <DynamicComponent />
        </React.Suspense>
      </div>
    );
  }
}

export default hot(module)(App);
