import React, { useEffect, useState } from "react";
import MUIDataTable from "mui-datatables";


const BacktestTable = (props) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const options = {
    rowsPerPage: 100,
    pagination: true,
    filter: false,
    print: false,
  };

  const fetchData = async () => {
    const response = await fetch(`/api/backtests`);
    const json = await response.json();
  
    setData(json);
    setLoading(false);
  };

  useEffect(() => {
    setLoading(true);
    fetchData();
  }, []);

  const headers = [
    { 
        name: "name",
        options: {
                customBodyRender: (value) => <button onClick={() => props.setBacktest(value)}>{value}</button>
        },
    },
    "currency",
    "RTs",
    "profit",
    "alpha",
    "sharpe",
    "v2ratio",
    "RoMaD",
    "winRate",
  ];

  const tableData = data.map(({ name, data }) => [
    name.split("/").slice(2,3),
    `${data.results.currency}`,
    `${data.results.RTs}`,
    `${data.results.profit}`,
    `${data.results.alpha}`,
    `${data.results.sharpe}`,
    `${data.results.v2ratio}`,
    `${data.results.RoMaD}`,
    `${data.results.winRate}`
  ]);

  const page = (
    <>
            <MUIDataTable
    data={tableData}
    columns={headers}
    options={options}
/>
    </>
  );

  const display = loading ? <div>Loading...</div> : page;

  return <>{display}</>;
};

export default BacktestTable;
