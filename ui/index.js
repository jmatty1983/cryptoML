import React from "react";
import ReactDOM from "react-dom";
import { hot, setConfig } from "react-hot-loader";
import { BrowserRouter as Router, Switch, Route } from "react-router-dom";
setConfig({
  ignoreSFC: true, // RHL will be __completely__ disabled for SFC
  pureRender: true // RHL will not change render method
});

import Chart from "./components/Chart";
import Table from "./components/Table";

import GA from "./pages/GA";
import GARun from "./pages/GARun";
import Genomes from "./pages/Genomes";
import Home from "./pages/Home";
import Import from "./pages/Import";
import PaperTrader from "./pages/PaperTrader";
import Process from "./pages/Process";

const App = () => (
  <Router>
    <Switch>
      <Route exact path="/" component={Home} />
      <Route path="/home" component={Home} />
      <Route path="/Process" component={Process} />
      <Route path="/GA/:candle" component={GARun} />
      <Route path="/GA" component={GA} />
      <Route path="/Import" component={Import} />
      <Route path="/Genomes" component={Genomes} />
      <Route path="/chart/:table/" component={Chart} />
      <Route path="/Table" component={Table} />
      <Route path="/papertrader" component={PaperTrader} />
    </Switch>
  </Router>
);

export default hot(module)(App);
ReactDOM.render(<App />, document.getElementById("app"));
