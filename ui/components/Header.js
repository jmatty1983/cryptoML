import React from "react";
import { Link } from "react-router-dom";

import Button from "@material-ui/core/Button";
import AppBar from "@material-ui/core/AppBar";
import styled from "styled-components";

const MenuDiv = styled.div`
  margin: 0;
  width: 100%;
`;

export default () => (
  <>
    <AppBar position="static" color="default">
      <MenuDiv>
        <ul>
          <Button color="inherit">NEATUI</Button>
          <Button color="primary" component={Link} to="/">
            Home
          </Button>
          <Button color="primary" component={Link} to="/Import">
            Import
          </Button>
          <Button color="primary" component={Link} to="/Process">
            Process
          </Button>
          <Button color="primary" component={Link} to="/GA">
            GA
          </Button>
          <Button color="primary" component={Link} to="/Genomes">
            Genomes
          </Button>
          <Button color="primary" component={Link} to="/papertrader">
            Paper Trader
          </Button>
        </ul>
      </MenuDiv>
    </AppBar>
  </>
);
