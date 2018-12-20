import React, { useState, useEffect } from "react";

import Typography from "@material-ui/core/Typography";

import clientSocket from "../lib/clientSocket";

import Layout from "../components/Layout";

export default () => {
  const [tableData, setTableData] = useState([]);
  const [loading, setLoading] = useState(true);

  const headers = ["Name", "Win %"];

  const fetchData = async () => {
    const response = await fetch(`/api/candles`);
    const json = await response.json();

    const formatted = json.map((d, i) => [
      <div onClick={() => console.log(d)}>
        {d.name
          .split("\\")
          .pop()
          .split("_")
          .slice(0, 5)
          .join(" ")}
      </div>,
      `${Math.round(d.data.testStats.winRate * 10000) / 100}%`
    ]);
    setTableData(formatted);
    setLoading(false);
  };

  useEffect(() => {
    setLoading(true);
    fetchData();
    const fn = console.log;
    clientSocket.addListener(fn);
    return () => clientSocket.removeListener(fn);
  }, []);
  return (
    <Layout>
      <div>
        <Typography variant="h4" gutterBottom>
          GA
        </Typography>
      </div>
    </Layout>
  );
};
