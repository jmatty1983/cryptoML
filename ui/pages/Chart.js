import React, { useEffect, useState } from "react";

const Chart = props => {
  const table = props.match.params.table;
  const [data, setData] = useState({});
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

  const display = loading ? (
    <div>Loading</div>
  ) : (
    <div>{JSON.stringify(data)}</div>
  );
  return <>{display}</>;
};

export default Chart;
