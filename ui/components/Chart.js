import React, { useEffect, useState } from "react";
import CircularProgress from "@material-ui/core/CircularProgress";
import AnyChart from "anychart-react";
import anychart from "anychart";
import "./themes/dark_turquoise.js"

const Chart = (props) => {
  const {table} = props;
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
  }, [table]);

  const candleData = data.map(
    ({ endTime, low, open, close, high, volume }, index) => [
      endTime,
      low,
      open,
      close,
      high,
      volume
    ]
  );

  anychart.theme("darkTurquoise");
  const chartData = anychart.data.table();
  chartData.addData(candleData);
  const mapping = chartData.mapAs();
  mapping.addField("open", 1);
  mapping.addField("high", 2);
  mapping.addField("low", 3);
  mapping.addField("close", 4);
  mapping.addField("value", 5);
  const chart = anychart.stock();
  
  //FIRST PLOT
  chart.plot(0).candlestick(mapping);

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
  chart.scroller().area(mapping);

  // create range picker
  const rangePicker = anychart.ui.rangePicker();
  // init range picker
  rangePicker.render(chart);

  // create range selector
  var rangeSelector = anychart.ui.rangeSelector();
  // init range selector
  rangeSelector.render(chart);

  const page = (
    <>
      <AnyChart
        instance={chart}
        title={table}
        height={1000}
        theme="monochromatic"
      />
    </>
  );

  const display = loading ? <><center><CircularProgress /></center></> : page;

  return <>{display}</>;
};

export default Chart;
