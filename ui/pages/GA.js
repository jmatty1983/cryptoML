import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";

import Button from "@material-ui/core/Button";
import CircularProgress from "@material-ui/core/CircularProgress";

import DisplayTable from "../components/DisplayTable";
import Layout from "../components/Layout";

export default () => {
  const [tableData, setTableData] = useState([]);
  const [loading, setLoading] = useState(true);

  const headers = ["Name", "Win %"];

  const fetchData = async () => {
    const response = await fetch(`/api/candles`);
    const json = await response.json();
    const formatted = json.map(d => [
      ...d.split("_"),
      <Button
        component={Link}
        to={`/GA/${encodeURIComponent(d)}`}
        color="primary"
        variant="contained"
      >
        Start
      </Button>
    ]);

    setTableData(formatted);
    setLoading(false);
  };

  useEffect(() => {
    setLoading(true);
    fetchData();
  }, []);

  return (
    <Layout>
      {loading ? (
        <CircularProgress />
      ) : (
        <DisplayTable
          headers={["Pair", "Type", "Length", ""]}
          data={tableData}
        />
      )}
    </Layout>
  );
};
