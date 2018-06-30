import React from 'react';
import _ from 'lodash';
import pFinally from './vendor/p-finally';
import './styles.less';

export default class App extends React.Component {
  componentDidMount() {
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
        <p>
          Here's a random number: {_.random(0, 100)}
        </p>
        <p>
          Did the DefinePlugin work? {typeof DEFINE_WORKED === 'undefined' ? 'No' : DEFINE_WORKED}
        </p>
        <p>
          Less-loading worked if this text is light blue.
        </p>
        <p>
          Value of the env variable ENV_VAR: {process.env.ENV_VAR}
        </p>
        <p>
          Background image snowflake:
        </p>
        <div className="snowflake" style={{ height: 300, width: 300 }}/>
        <p>
          Real image snowflake:
        </p>
        <img src="images/snowflake.jpg" />
      </div>
    );
  }
}
