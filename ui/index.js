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
import ChartGenome from "./components/ChartGenome";
import PnL from "./components/PnL";
import ChartBacktest from "./components/ChartBacktest";

import GA from "./pages/GA";
import GARun from "./pages/GARun";
import Genomes from "./pages/Genomes";
import BacktestResults from "./pages/BacktestResults";
import Home from "./pages/Home";
import Import from "./pages/Import";
import Charts from "./pages/Charts";
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
      <Route path="/BacktestResults" component={BacktestResults} />
      <Route path="/Charts" component={Charts} />
      <Route path="/chart/:table/" component={Chart} />
      <Route path="/ChartBacktest/:backtest" component={ChartBacktest} />
      <Route path="/Table" component={Table} />
      <Route path="/papertrader" component={PaperTrader} />
      <Route path="/ChartGenome/:genome" component={ChartGenome} />
      <Route path="/PnL/:genome" component={PnL} />
    </Switch>
  </Router>
);

export default hot(module)(App);
ReactDOM.render(<App />, document.getElementById("app"));
