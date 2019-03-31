import React, { useEffect, useState } from "react";
import DisplayTable from "./DisplayTable";
import MUIDataTable from "mui-datatables";
//import Layout from "../components/Layout";

const GenomeTable = (props) => {
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
    const response = await fetch(`/api/genomes`);
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
                customBodyRender: (value) => <button onClick={() => props.setGenome(value)}>{value}</button>
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
    name,
    /*data.testStats.currency,
    data.testStats.RTs,
    data.testStats.profit,
    data.testStats.alpha,
    data.testStats.sharpe,
    data.testStats.v2ratio,
    data.testStats.RoMaD,
    data.testStats.winRate,
*/
    `${data.testStats.currency}`,
    `${data.testStats.RTs}`,
    `${data.testStats.profit}`,
    `${data.testStats.alpha}`,
    `${data.testStats.sharpe}`,
    `${data.testStats.v2ratio}`,
    `${data.testStats.RoMaD}`,
    `${data.testStats.winRate}`
    //...dingdong(data.testStats),
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

export default GenomeTable;
