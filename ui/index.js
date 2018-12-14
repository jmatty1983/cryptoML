import React from "react";
import ReactDOM from "react-dom";
import { hot, setConfig } from "react-hot-loader";
setConfig({
  ignoreSFC: true, // RHL will be __completely__ disabled for SFC
  pureRender: true // RHL will not change render method
});

import { BrowserRouter as Router, Route } from "react-router-dom";

import Chart from "./pages/Chart";
import Line from "./pages/Line";

const App = () => (
  <Router basename="/">
    <Route path="/chart/:table/" component={Chart} />
  </Router>
);

export default hot(module)(App);
ReactDOM.render(<App />, document.getElementById("app"));
