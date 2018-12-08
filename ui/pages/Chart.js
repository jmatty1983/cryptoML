import React, { useEffect, useState } from "react";

const Chart = props => {
  const table = props.match.params.table;
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async table => {
    const response = await fetch(`/chart/json/${table}`);
    const json = await response.json();
    setData(json);
    setLoading(false);
  };

  useEffect(() => {
    setLoading(true);
    fetchData(table);
  }, []);

  const candleData = data
    .map(candle => [
      candle.startTime,
      candle.open,
      candle.close,
      candle.high,
      candle.low
    ])
    .slice(0, 1000);

  google.charts.load("current", { packages: ["corechart"] });
  google.charts.setOnLoadCallback(drawChart);

  function drawChart() {
    if (!document.getElementById("chart_div")) {
      return;
    }
    var data = google.visualization.arrayToDataTable(candleData, true);

    var options = {
      legend: "none"
    };

    var chart = new google.visualization.CandlestickChart(
      document.getElementById("chart_div")
    );

    chart.draw(data, options);
  }

  const display = loading ? <div>Loading...</div> : <div id="chart_div" />;

  return <>{display}</>;
};

export default Chart;
