import React, { useEffect, useState } from "react";
import MUIDataTable from "mui-datatables";

const GenomeTable = (props) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const options = {
    rowsPerPage: 100,
    pagination: true,
    filter: true,
    sort: true,
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

  const tableData = data.map(({ name, data }) => [
    name,
    `${parseFloat(data.testStats.currency).toFixed(2)}`,
    `${parseFloat(data.testStats.RTs).toFixed(2)}`,
    `${parseFloat(data.testStats.profit).toFixed(2)}`,
    `${parseFloat(data.testStats.alpha).toFixed(2)}`,
    `${parseFloat(data.testStats.sharpe).toFixed(2)}`,
    `${parseFloat(data.testStats.v2ratio).toFixed(2)}`,
    `${parseFloat(data.testStats.RoMaD).toFixed(2)}`,
    `${parseFloat(data.testStats.winRate).toFixed(2)}`
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

export default GenomeTable;
