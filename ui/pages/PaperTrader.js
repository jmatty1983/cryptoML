import React, { useEffect, useState } from "react";

import Button from "@material-ui/core/Button";
import CircularProgress from "@material-ui/core/CircularProgress";
import Paper from "@material-ui/core/Paper";
import Path from "path";
import TextField from "@material-ui/core/TextField";
import Tooltip from "@material-ui/core/Tooltip";
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
  const [data, setData] = useState([]);
  const [tableData, setTableData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rowsSelected, setRowsSelected] = useState([]);
  const [warmingCandles, setWarmingCandles] = useState(0);

  const headers = ["Pair", "Type", "Len", "Name", "PnL%", "Win %"];

  const fetchData = async () => {
    const response = await fetch(`/api/genomes`);
    const json = await response.json();

    const formatted = json
      .map(d => [
        <div>
          {
            Path.basename(d.name)
              .replace(/_/g, " ")
              .split(" ")[0]
          }
        </div>,
        <div onClick={() => console.log(d)}>
          {
            Path.basename(d.name)
              .replace(/_/g, " ")
              .split(" ")[1]
          }
        </div>,
        <div onClick={() => console.log(d)}>
          {
            Path.basename(d.name)
              .replace(/_/g, " ")
              .split(" ")[2]
          }
        </div>,
        <div onClick={() => console.log(d)}>
          {Path.basename(d.name)
            .replace(/_/g, " ")
            .split(" ")
            .pop()
            .replace(/[\(\)]/g, "")}
        </div>,
        `${Math.round(d.data.testStats.profit * 10000) / 100}%`,
        `${Math.round(d.data.testStats.winRate * 10000) / 100}%`
      ])
      .sort((a, b) => (parseFloat(a[4]) > parseFloat(b[4]) ? -1 : 1));
    setData(json);
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
            <Tooltip title="Enter the amount of candles to seed the paper trader with.">
              <TextField
                label="Warming Candles"
                value={warmingCandles}
                onChange={e => setWarmingCandles(e.target.value)}
                type="number"
                InputLabelProps={{
                  shrink: true
                }}
                margin="normal"
              />
            </Tooltip>
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
