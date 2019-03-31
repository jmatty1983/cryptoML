import React, { useEffect, useState } from "react";
import CircularProgress from "@material-ui/core/CircularProgress";
//import Layout from "../components/Layout";
import AnyChart from "anychart-react";
import anychart from "anychart";
import "./themes/dark_turquoise.js"

const Chart = (props) => {
  const {backtest} = props;
  const [data, setData] = useState([]);
  const [trades, setTrades] = useState({});
  const [loading, setLoading] = useState(true);

  const fetchData = async table => {
    const response = await fetch(`/api/backtest/chart/${backtest  }`);
    const json = await response.json();
    setData(json);
    setLoading(false);
  };

  const fetchTrades = async trades => {
    const response = await fetch(`/api/backtest/chartTrades/${backtest}`);
    const json = await response.json();
    setTrades(json);
    setLoading(false);
  };

  useEffect(() => {
    setLoading(true);
    fetchData(backtest);
    fetchTrades(backtest);
  }, [backtest]);

  //console.log(trades);
  anychart.theme("darkTurquoise");
  const chartData = anychart.data.table();
  chartData.addData(data);
  const mapping = chartData.mapAs();
  mapping.addField("open", 1);
  mapping.addField("high", 2);
  mapping.addField("low", 3);
  mapping.addField("close", 4);
  mapping.addField("value", 5);
  mapping.addField("sma", 6);
  
  const chart = anychart.stock();
  
  //FIRST PLOT
  const plot = chart.plot(0);
  // create candlestick series
  plot.line()
  .data(chartData.mapAs({'value': 4}))
  plot.line()
  .data(chartData.mapAs({'value': 6}))

  plot.eventMarkers(trades);

  const eventMarkers = plot.eventMarkers();
  eventMarkers
    .position("series")
    .seriesId(0)
    .type("flag")
    .direction("up")


  // create second plot
  const volumePlot = chart.plot(1);
  // set yAxis labels formatter
  volumePlot.height(200);
  volumePlot
    .yAxis()
    .labels()
    .format("{%Value}{scale:(1000)(1)|(k)}");
  // set crosshair y-label formatter
  volumePlot
    .crosshair()
    .yLabel()
    .format("{%Value}{scale:(1000)(1)|(k)}");

  // create volume series on the plot
  var volumeSeries = volumePlot.column(mapping);
  // set series settings
  volumeSeries.name("Volume");

  // create scroller series with mapped data
  chart.scroller().line(mapping);

  // create range picker
  const rangePicker = anychart.ui.rangePicker();
  // init range picker
  rangePicker.render(chart);

  // create range selector
  var rangeSelector = anychart.ui.rangeSelector();
  // init range selector
  rangeSelector.render(chart);

  //console.log(data);

  const page = (
    <>
      <AnyChart instance={chart} title={{backtest}} height={1000} />
    </>
  );

  const display = loading ? <><center><CircularProgress /></center></> : page;

  return <>{display}</>;
};

export default Chart;
