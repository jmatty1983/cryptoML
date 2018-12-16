import React from "react";
import ReactDOM from "react-dom";
import { hot, setConfig } from "react-hot-loader";
setConfig({
  ignoreSFC: true, // RHL will be __completely__ disabled for SFC
  pureRender: true // RHL will not change render method
});

import { BrowserRouter as Router, Switch, Route } from "react-router-dom";

import Chart from "./components/Chart";
import Home from "./pages/Home";
import Genomes from "./pages/Genomes";
import Import from "./pages/Import";
import Process from "./pages/Process";
import GA from "./pages/GA";
const App = () => (
  <Router>
    <Switch>
      <Route exact path="/" component={Home} />
      <Route path="/home" component={Home} />
      <Route path="/Process" component={Process} />
      <Route path="/GA" component={GA} />
      <Route path="/Import" component={Import} />
      <Route path="/Genomes" component={Genomes} />
      <Route path="/chart/:table/" component={Chart} />
    </Switch>
  </Router>
);

export default hot(module)(App);
ReactDOM.render(<App />, document.getElementById("app"));
