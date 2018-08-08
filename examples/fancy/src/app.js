import React from 'react';
import _ from 'lodash';
import pFinally from 'p-finally';
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
          Value of the env variable passed through cli ENV_VAR: {process.env.UNDERREACT_APP_ENV_VAR}
        </p>
        <p>
          Value of the env variable from file UNDERREACT_APP_CLIENT_TOKEN: {process.env.UNDERREACT_APP_CLIENT_TOKEN}
        </p>
        <p>
        Does it leak SECRET_TOKEN: {process.env.SECRET_TOKEN=== undefined? `No`: 'Yes'}
        </p>
        <p>
          Background image snowflake:
        </p>
        <div className="snowflake" style={{ height: 300, width: 300 }}/>
        <p>
          Real image snowflake:
        </p>
        <img src="images/snowflake.jpg" />
        <p>
          The library <code>p-finally</code> is not ES5, so this page should throw an error in older browsers like IE11.
        </p>
      </div>
    );
  }
}
