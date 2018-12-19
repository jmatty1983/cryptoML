import React, { useEffect, useState } from "react";
import Layout from "../components/Layout";
//import { ema } from "../../src/dataManager/indicators";

const Table = props => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    const response = await fetch(`/api/genomes`);
    const json = await response.json();
    setData(json);
    setLoading(false);
  };

  useEffect(() => {
    setLoading(true);
    fetchData(table);
  }, []);

  const tableData = data.map(({ genome, data }, index) => [genome, data]);

  const drawTable = () => {
    if (!document.getElementById("table_div")) {
      return;
    }

    //PROCESS ARRAY DATA
    const TableData = google.visualization.arrayToDataTable(tableData, true);

    //CREATE DASHBOARD INSTANCE
    const table = new google.visualization.Table(
      document.getElementById("table_div")
    );

    table.draw(TableData, {
      showRowNumber: true,
      width: "100%",
      height: "100%"
    });
  };

  google.charts.load("current", { packages: ["table"] });
  google.charts.setOnLoadCallback(drawTable);

  const page = (
    <>
      <div id="table_div" />
    </>
  );

  const display = loading ? <div>Loading...</div> : page;

  return <Layout>{display}</Layout>;
};

export default Chart;
