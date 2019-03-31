import React, { useEffect, useState } from "react";
import DisplayTable from "./DisplayTable";
import MUIDataTable from "mui-datatables";
//import Layout from "../components/Layout";

const BacktestTable = (props) => {
  const [data, setData] = useState([]);
  //const [genome, setGenome] = useState(0)
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
    console.log(json)
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

  function dingdong(foo) {
    return Object.keys(foo).map(i => foo[i].toString());
  }


  const tableData = data.map(({ name, data }) => [
    name.split("/").slice(2,3),
    /*data.results.currency,
    data.results.RTs,
    data.results.profit,
    data.results.alpha,
    data.results.sharpe,
    data.results.v2ratio,
    data.results.RoMaD,
    data.results.winRate,
*/
    `${data.results.currency}`,
    `${data.results.RTs}`,
    `${data.results.profit}`,
    `${data.results.alpha}`,
    `${data.results.sharpe}`,
    `${data.results.v2ratio}`,
    `${data.results.RoMaD}`,
    `${data.results.winRate}`
    //...dingdong(data.results),
  ]);
  //<DisplayTable headers={headers} data={tableData} />
  //tableData.unshift(headers);

  console.log(tableData);
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
