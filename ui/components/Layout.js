import React from "react";
import Header from "./Header";
import styled from "styled-components";

import { createGlobalStyle } from "styled-components";

//GlobabStyle not working.
const GlobalStyle = createGlobalStyle`
@import url('https://fonts.googleapis.com/css?family=Roboto:300,400,700');
*, **, html, body {
  box-sizing: border-box;
}
html, body {
  font-size: 18px;
  line-height: 1.6;
  font-family: 'Roboto', sans-serif;
  font-style: normal;
  padding: 0;
  margin: 0;
  height: 100vh;
  color: #000000;
  background-color: #ffffff; 
  -webkit-font-smoothing: subpixel-antialiased;
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
