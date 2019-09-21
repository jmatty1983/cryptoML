import React from "react";
import { useState, useCallback } from 'react'
import Layout from "../components/Layout";
import Typography from "@material-ui/core/Typography";

import Table from "../components/Table";
import ChartGenome from "../components/ChartGenome";
//import PNL from "../components/PnL";


export default () => {

  const [genome, setGenome] = useState(null);
  const changeGenome = useCallback((genome) => setGenome(genome), []);

  return(
    <Layout>
    <div>
      <Typography variant="h4" gutterBottom>
        Genomes
      </Typography>
      <ChartGenome genome={genome}/>
      <Table setGenome={changeGenome}/>
    </div>
    </Layout>)
};