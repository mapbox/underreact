import React from 'react';
import _ from 'lodash';
import './styles.less';

export default class App extends React.Component {
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
          <div className="snowflake" style={{ height: 300, width: 300 }}/>
        </p>
        <p>
          Real image snowflake:
          <img src="images/snowflake.jpg" />
        </p>
      </div>
    );
  }
}
