import React, { useEffect, useState } from "react";

const Line = props => {
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

  const lineData = data.map(x => [x.id, x.close]).slice(0, 2000);

  google.charts.load("current", { packages: ["corechart"] });
  google.charts.setOnLoadCallback(drawChart);

  function drawChart() {
    if (!document.getElementById("line_div")) {
      return;
    }
    var data = google.visualization.arrayToDataTable(lineData, true);

    var options = {
      height: 500,
      legend: "none",
      explorer: {
        actions: ["dragToZoom", "rightClickToReset"],
        axis: "horizontal",
        keepInBounds: true,
        maxZoomIn: 20.0
      }
    };

    var line = new google.visualization.LineChart(
      document.getElementById("line_div")
    );

    line.draw(data, options);
  }

  const display = loading ? <div>Loading...</div> : <div id="line_div" />;

  return <>{display}</>;
};

export default Line;
