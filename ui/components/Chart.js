import React, { useEffect, useState } from "react";
import Layout from "../components/Layout";
import { ema } from "../../src/dataManager/indicators";

const Chart = props => {
  const table = props.match.params.table;
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async table => {
    const response = await fetch(`/api/chart/${table}`);
    const json = await response.json();
    setData(json);
    setLoading(false);
  };

  useEffect(() => {
    setLoading(true);
    fetchData(table);
  }, []);

  //this won't be quite right but just want to see if i can get it drawn
  const closes = data.map(({ close }) => close);
  const emaData200 = ema(200, [[], [], [], closes]);
  const emaData50 = ema(50, [[], [], [], closes]);
  const candleData = data
    .map(({ id, low, open, close, high, volume }, index) => [
      id,
      low,
      open,
      close,
      high,
      emaData200[index],
      emaData50[index],
      volume
    ])
    .slice(0, 5000);

  const drawDashboard = () => {
    if (!document.getElementById("dashboard_div")) {
      return;
    }

    //PROCESS ARRAY DATA
    const candleTableData = google.visualization.arrayToDataTable(
      candleData,
      true
    );

    //CREATE DASHBOARD INSTANCE
    const dashboard = new google.visualization.Dashboard(
      document.getElementById("dashboard_div")
    );

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

    //CREATE CHART RANGE FILTER SLIDER
    const control = new google.visualization.ControlWrapper({
      controlType: "ChartRangeFilter",
      containerId: "slider_div",
      options: {
        // Filter by the date axis which is index 0 in this case.
        filterColumnIndex: 0,
        ui: {
          chartType: "HistogramChart",
          chartOptions: {
            colors: ["#c6c4be"],
            chartArea: { width: "70%", height: "20%" },
            hAxis: { baselineColor: "#291A21" }
          },
          chartView: {
            columns: [0, 3]
          },
          minRangeSize: 100
        }
      },
      state: { range: { start: 0, end: 500 } }
    });

    const chart = new google.visualization.ChartWrapper({
      chartType: "CandlestickChart",
      containerId: "chart_div",
      options: {
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
        seriesType: "candlesticks",
        series: {
          0: { type: "candlesticks " },
          1: { type: "line" },
          2: { type: "line" },
          3: { type: "none" }
        },
        backgroundColor: "#F7FBF1"
      }
    });

    const volumeChart = new google.visualization.ChartWrapper({
      chartType: "LineChart",
      containerId: "volume_div",
      options: {
        height: 200,
        width: "90%",
        chartArea: { height: "90%", width: "70%" },
        hAxis: { slantedText: false },
        legend: { position: "none" },
        colors: ["#c6c4be"],
        backgroundColor: "#F7FBF1"
      }
    });

    dashboard.bind(control, [chart, volumeChart]);
    dashboard.draw(candleTableData);
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

  return <Layout>{display}</Layout>;
};

export default Chart;
