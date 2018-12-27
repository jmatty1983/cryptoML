import React from "react";
import Header from "./Header";
import styled from "styled-components";

import { createGlobalStyle } from "styled-components";

//GlobabStyle not working.
const GlobalStyle = createGlobalStyle`
  body {
    color: #000000;
  }
  
`;
//Style for things used on header, layout, pages.
const StyledDiv = styled.div`
  font-family: "Raleway", Arial, Helvetica, sans-serif;
  font-weight: 400;
  font-size: 1rem;
  line-height: 1.65;
  margin: auto;
  padding: 20;
  border: "1px solid #DDD";
`;

//Style for pages / content only.
const ContentDiv = styled.div`
  padding: 50px 50px 50px 50px;
`;

export default props => (
  <>
    <GlobalStyle />
    <StyledDiv>
      <Header />
      <ContentDiv>{props.children}</ContentDiv>
    </StyledDiv>
  </>
);
