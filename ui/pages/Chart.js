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

  const initData = {
    candleData: [],
    volumeData: []
  };

  let { candleData, volumeData } = !data.length
    ? initData
    : data.reduce((pieces, { id, low, open, close, high, volume }) => {
        pieces.candleData.push([id, low, open, close, high]);
        pieces.volumeData.push([id, volume]);
        return pieces;
      }, initData);

  //slicing data so it's workable for now ... need a way to paginate or something
  candleData = candleData.slice(0, 1000);
  volumeData = volumeData.slice(0, 1000);

  const drawDashboard = () => {
    if (!document.getElementById("dashboard_div")) {
      return;
    }

    //PROCESS ARRAY DATA
    const candleTableData = google.visualization.arrayToDataTable(
      candleData,
      true
    );
    const volumeTableData = google.visualization.arrayToDataTable(
      volumeData,
      true
    );

    //CREATE DASHBOARD INSTANCE
    const dashboard = new google.visualization.Dashboard(
      document.getElementById("dashboard_div")
    );

    //CREATE CHART RANGE FILTER SLIDER
    const control = new google.visualization.ControlWrapper({
      controlType: "ChartRangeFilter",
      containerId: "slider_div",
      options: {
        // Filter by the date axis which is index 0 in this case.
        filterColumnIndex: 3,
        ui: {
          chartType: "HistogramChart",
          chartOptions: {
            colors: ["#c6c4be"],
            chartArea: { width: "70%", height: "20%" },
            hAxis: { baselineColor: "#291A21" }
          },
          // Display a single series that shows the closing value of the stock.
          // Thus, this view has two columns: the date (axis) and the stock value (line series).
          chartView: {
            columns: [0, 3]
          },
          // 1 day in milliseconds = 24 * 60 * 60 * 1000 = 86,400,000
          minRangeSize: 100
        }
      },
      // Initial range: 2012-02-09 to 2012-03-20.
      state: { range: { start: 0, end: 500 } }
    });

    //OPTIONS I CAN PASTE IN WHEN I GET THE CHART RENDERING.
    /*
        'options': {
          'height': 500,
          'bar': { 'groupWidth': "90.6%" },
          'colors':['grey'],
          'candlestick': { 'hollowIsRising': true,
            'risingColor': { 'fill': "#1ff126",
                          'stroke': "#1ff126",
                          'strokeWidth': 0 },
            'fallingColor': { 'fill': "#f21f42",
                            'stroke': "#f21f42",
                            'strokeWidth': 0 }
          },
          'backgroundColor': "#f9fafc",
          'explorer': {
            'actions': ["dragToZoom", "rightClickToReset"],
            'axis': "horizontal",
            'keepInBounds': true,
            'maxZoomIn': 20.0
          }

        }*/

    //CHART WRAPPER INSTANCE
    const chart = new google.visualization.ChartWrapper({
      chartType: "CandlestickChart",
      containerId: "chart_div",
      options: {
        // Use the same chart area width as the control for axis alignment.
        height: 500,
        width: "90%",
        chartArea: { height: "90%", width: "70%" },
        hAxis: { slantedText: false },
        legend: { position: "none" },
        colors: ["#c6c4be"],
        candlestick: {
          hollowIsRising: false,
          risingColor: { fill: "#38CE5F", stroke: "#38CE5F", strokeWidth: 0 },
          fallingColor: { fill: "#FF5B45", stroke: "#FF5B45", strokeWidth: 0 }
        },
        backgroundColor: "#F7FBF1"
      }
    });
    const options = {
      hAxis: {
        title: "Time"
      },
      vAxis: {
        title: "Volume"
      }
    };

    const table = new google.visualization.Table(
      document.getElementById("table_div")
    );
    const volume = new google.visualization.LineChart(
      document.getElementById("volume_div")
    );

    dashboard.bind(control, chart);
    dashboard.draw(candleTableData);
    //table.draw(data, {showRowNumber: false, width: '90%', height: '100%'});
    //volume.draw(volumedata, options)
    //chart.draw(data, options);
  };

  google.charts.load("current", {
    packages: ["corechart", "table", "gauge", "controls"]
  });
  google.charts.setOnLoadCallback(drawDashboard);

  const page = (
    <>
      <div id="dashboard_div">
        <div id="chart_div" />
        <div id="volume_div" />
        <div id="slider_div" />
        <div id="table_div" />
      </div>
    </>
  );

  const display = loading ? <div>Loading...</div> : page;

  return <>{display}</>;
};

export default Chart;
