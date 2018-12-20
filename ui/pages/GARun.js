import React, { useState, useEffect } from "react";

import CircularProgress from "@material-ui/core/CircularProgress";

import DisplayTable from "../components/DisplayTable";
import Layout from "../components/Layout";

import clientSocket from "../lib/clientSocket";

const GARun = props => {
  const [cTableData, setCTableData] = useState([]);
  const [pTableData, setPTableData] = useState([]);
  const [gen, setGen] = useState(0);
  const headers = ["Gen", "Profit", "RTs", "Win%", "tProfit", "tRTs", "tWin%"];

  const candle = props.match.params.candle;
  const fetchData = candle => fetch(`/api/garun/${candle}`);

  useEffect(() => {
    fetchData(candle);
    const fn = data => {
      const { generation, candidates, parents } = data;
      setGen(generation);
      const genomeToTable = ({ generation, stats, testStats }) => {
        return [
          generation,
          stats.profit.toFixed(3) * 100,
          stats.RTs.toFixed(2),
          stats.winRate.toFixed(4) * 100,
          testStats.profit.toFixed(3) * 100,
          testStats.RTs.toFixed(2),
          testStats.winRate.toFixed(4) * 100
        ];
      };
      setCTableData(candidates.map(genomeToTable));
      setPTableData(parents.map(genomeToTable));
    };
    clientSocket.addListener(fn);
    //need to add a stop button or something
    //for now just ctrl + c on the server ... womp
    return () => clientSocket.removeListener(fn);
  }, []);

  return (
    <Layout>
      <h3>Generation: {gen}</h3>
      <h3>candidates: {cTableData.length}</h3>
      <DisplayTable headers={headers} data={cTableData} />
      <h3>parents: {pTableData.length}</h3>
      <DisplayTable headers={headers} data={pTableData} />
    </Layout>
  );
};

export default GARun;
