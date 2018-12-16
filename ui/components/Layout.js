import React from "react";
import Header from "./Header";
import styled from "styled-components";

const StyledDiv = styled.div`
  margin: 20;
  padding: 20;
  border: "1px solid #DDD";
`;

export default props => (
  <StyledDiv>
    <Header />
    {props.children}
  </StyledDiv>
);
