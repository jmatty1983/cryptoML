import React from "react";
import ReactDOM from "react-dom";
import { hot, setConfig } from "react-hot-loader";
setConfig({
  ignoreSFC: true, // RHL will be __completely__ disabled for SFC
  pureRender: true // RHL will not change render method
});

import { BrowserRouter as Router, Switch, Route } from "react-router-dom";

import Chart from "./pages/Chart";
import Line from "./pages/Line";
import Home from "./pages/Home";
const App = () => (
  <Router>
    <Switch>
      <Route exact path="/" component={Home} />
      <Route path="/chart/:table/" component={Chart} />
      <Route path="/home" component={Home} />
    </Switch>
  </Router>
);

export default hot(module)(App);
ReactDOM.render(<App />, document.getElementById("app"));
