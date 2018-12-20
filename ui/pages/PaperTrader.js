import React, { useEffect, useState } from "react";

import CircularProgress from "@material-ui/core/CircularProgress";
import Paper from "@material-ui/core/Paper";
import Typography from "@material-ui/core/Typography";

import styled from "styled-components";

import DisplayTable from "../components/DisplayTable";
import Layout from "../components/Layout";

const TableHeading = styled.div`
  padding-top: 10px;
  padding-left: 10px;
`;

const PaperTrader = () => {
  const [tableData, setTableData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rowsSelected, setRowsSelected] = useState([]);

  const headers = ["Name", "Win %"];

  const fetchData = async () => {
    const response = await fetch(`/api/genomes`);
    const json = await response.json();

    const formatted = json.map((d, i) => [
      <div onClick={() => console.log(d)}>
        {d.name
          .split("\\")
          .pop()
          .split("_")
          .slice(0, 5)
          .join(" ")}
      </div>,
      `${Math.round(d.data.testStats.winRate * 10000) / 100}%`
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
      <Paper>
        {loading ? (
          <CircularProgress />
        ) : (
          <>
            <TableHeading>
              <Typography variant="h6">
                Genomes - Selected: {rowsSelected.length}
              </Typography>
            </TableHeading>
            <DisplayTable
              multiSelect={true}
              onSelectChange={setRowsSelected}
              headers={headers}
              data={tableData}
            />
          </>
        )}
      </Paper>
    </Layout>
  );
};

export default PaperTrader;
