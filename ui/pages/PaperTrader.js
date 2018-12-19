import React, { useEffect, useState } from "react";
import CircularProgress from "@material-ui/core/CircularProgress";
import Paper from "@material-ui/core/Paper";

import DisplayTable from "../components/DisplayTable";
import Layout from "../components/Layout";

const PaperTrader = () => {
  const headers = ["Name", "Win %"];
  const [data, setData] = useState([]);
  const [tableData, setTableData] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    const response = await fetch(`/api/genomes`);
    const json = await response.json();
    setData(json);

    const formatted = json.map(d => [
      d.name
        .split("\\")
        .pop()
        .split("_")
        .slice(0, 5)
        .join(" "),
      `${Math.round(d.data.testStats.winRate * 100) / 100}%`
    ]);

    setTableData(formatted);
    setLoading(false);
  };

  useEffect(() => {
    setLoading(true);
    fetchData();
  }, []);

  return (
    <Layout>
      <Paper>
        {loading ? (
          <CircularProgress />
        ) : (
          <DisplayTable headers={headers} data={tableData} />
        )}
      </Paper>
    </Layout>
  );
};

export default PaperTrader;
