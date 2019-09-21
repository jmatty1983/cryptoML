import React, { useState, useEffect, useCallback } from "react";

import CircularProgress from "@material-ui/core/CircularProgress";

import Layout from "../components/Layout";
import ListCharts from "../components/ListCharts"
import Chart from "../components/Chart";

export default () => {
  const [tableData, setTableData] = useState([]);
  const [loading, setLoading] = useState(true);

  const [table, setTable] = useState(null);
  const changeTable = useCallback((table) => setTable(table), []);

   const fetchData = async () => {
    const response = await fetch(`/api/candles`);
    const json = await response.json();
  
    setTableData(json);
    setLoading(false);
  };

  useEffect(() => {
    setLoading(true);
    fetchData();
  }, []);

  return (
    <Layout>
      {loading ? (
        <CircularProgress />
      ) : (
      <>
    <ListCharts setTable={changeTable}/>
    <Chart table={table}/>
    </>
      )}
    </Layout>
  );
};
