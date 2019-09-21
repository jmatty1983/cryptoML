import React, { useEffect, useState } from "react";
import Layout from "../components/Layout";
import AnyChart from "anychart-react";
import anychart from "anychart";
import "./themes/dark_turquoise.js"

const Chart = props => {
  const table = props.match.params.genome;
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async table => {
    const response = await fetch(`/api/genomes/tickstats/${table}`);
    const json = await response.json();
    setData(json);
    setLoading(false);
  };

  useEffect(() => {
    setLoading(true);
    fetchData(table);
  }, []);

  //set dataset
  const chartdata = anychart.data.set(data)

  //TIMESTAMP(close), close, totalvalue, alpha, profit, maxupdraw, maxdowndraw

  // map the datasets
  const price = chartdata.mapAs({x: 0, value: 1});
  const balance = chartdata.mapAs({x: 0, value: 2});
  //call chart
  const chart = anychart.line()
  // create the second series
  chart.line(balance)
  .name("Total Balance")
  .stroke({
    thickness: 0.8,
  })
  
  const page = (
    <>
    <div>
      <AnyChart instance={chart} title={table} height={750}/>
    </div>
    </>
  );

  const display = loading ? <div>Loading...</div> : page;

  return <Layout>{display}</Layout>;
};

export default Chart;
