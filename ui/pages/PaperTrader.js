import React, { useEffect, useState } from "react";

import Button from "@material-ui/core/Button";
import CircularProgress from "@material-ui/core/CircularProgress";
import Paper from "@material-ui/core/Paper";
import TextField from "@material-ui/core/TextField";
import Typography from "@material-ui/core/Typography";

import styled from "styled-components";

import DisplayTable from "../components/DisplayTable";
import Layout from "../components/Layout";

import clientSocket from "../lib/clientSocket";

const TableHeading = styled.div`
  padding-top: 1em;
  padding-left: 1em;
`;

const StyledBody = styled.div`
  display: grid;
  grid-gap: 1em;
`;

const Controls = styled.div`
  display: grid;
  grid-template-rows: 1fr;
  grid-template-columns: 2fr 1fr 10fr;
  grid-gap: 1em;
  padding: 1em;
`;

const StartButton = styled(Button)`
  height: 2em;
  align-self: center;
`;

const PaperTrader = () => {
  const [tableData, setTableData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rowsSelected, setRowsSelected] = useState([]);
  const [warmingCandles, setWarmingCandles] = useState(0);

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
    const fn = console.log;
    clientSocket.addListener(fn);
    return () => clientSocket.removeListener(fn);
  }, []);

  return (
    <Layout>
      <StyledBody>
        <Paper>
          <Controls>
            <TextField
              label="Starting Candles"
              value={warmingCandles}
              onChange={e => setWarmingCandles(e.target.value)}
              type="number"
              InputLabelProps={{
                shrink: true
              }}
              margin="normal"
            />
            <StartButton
              color="primary"
              variant="contained"
              onClick={() => console.log("test")}
            >
              Start
            </StartButton>
          </Controls>
        </Paper>
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
      </StyledBody>
    </Layout>
  );
};

export default PaperTrader;
