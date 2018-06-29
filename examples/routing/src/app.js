import React from 'react';
import { BrowserRouter as Router, Route, Link } from 'react-router-dom';

function Home() {
  return (
    <div>
      <h1 className="txt-h1">Home page</h1>
    </div>
  );
}

function Alt() {
  return (
    <div>
      <h1 className="txt-h1">Alt page!</h1>
    </div>
  );
}

export default class App extends React.Component {
  render() {
    return (
      <Router>
        <div className="px36 py36">
          <ul className="flex-parent mb24">
            <li className="flex-child">
              <Link className="link" to="/">
                Home
              </Link>
            </li>
            <li className="flex-child ml24">
              <Link className="link" to="/alt">
                Alt
              </Link>
            </li>
          </ul>

          <Route exact path="/" component={Home} />
          <Route exact path="/alt" component={Alt} />
        </div>
      </Router>
    );
  }
}
