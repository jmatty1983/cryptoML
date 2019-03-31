import React from "react";
import { useState, useCallback } from 'react'
import Layout from "../components/Layout";
import Typography from "@material-ui/core/Typography";
//import CircularProgress from "@material-ui/core/CircularProgress";

import Table from "../components/BacktestTable";
import ChartBacktest from "../components/ChartBacktest";

//
export default () => {

  const [backtest, setBacktest] = useState(null);
  const changeBacktest= useCallback((backtest) => setBacktest(backtest), []);

  return(
    <Layout>
    <div>
      <Typography variant="h4" gutterBottom>
        Backtest Results
      </Typography>
      <ChartBacktest backtest={backtest}/>
      <Table setBacktest={changeBacktest}/>
    </div>
    </Layout>)
};