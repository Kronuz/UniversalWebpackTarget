import * as React from 'react';
import { Switch, Route, Link } from 'react-router-dom';

import { Hello } from './components/Hello';

import('./test1' /* webpackChunkName: "test1", webpackPreload: true */).then(({ test1 }) => {
  test1('first');
  import('./test2' /* webpackChunkName: "test2", webpackPreload: true */).then(({ test2 }) => {
    test2('first');
    import('./test3' /* webpackChunkName: "test3" */).then(({ test3 }) => {
      test3('first');
    });
  });
});

const NoMatch = ({ location }: any) => (
  <h3>
    No match for <code>{location.pathname}</code>
  </h3>
);

class Home extends React.Component<
  {},
  {
    Component: React.ReactType | null;
  }
> {
  constructor(props: any) {
    super(props);
    this.state = { Component: null };
  }

  public componentWillMount() {
    import('./components/Home' /* webpackChunkName: "Home" */).then(({ Home }) => {
      this.setState({ Component: Home });
    });
  }

  public render() {
    const { Component } = this.state;
    return Component ? <Component {...this.props} /> : null;
  }
}

const Test = ({ match }: any) => {
  return <Hello name={match.params.name} compiler="TypeScript" framework="React" />;
};

export const App = () => (
  <div>
    <ul>
      <li>
        <Link to={`/`}>Home</Link>
      </li>
      <li>
        <Link to={`/test/one`}>Test 1</Link>
      </li>
      <li>
        <Link to={`/test/two`}>Test 2</Link>
      </li>
    </ul>
    <Switch>
      <Route exact path="/" component={Home} />
      <Route path="/test/:name" component={Test} />
      <Route component={NoMatch} />
    </Switch>
  </div>
);
