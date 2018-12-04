import fetch from "isomorphic-unfetch";

import Layout from "../components/Layout.js";
//import { CanvasJS, CanvasJSChart  } from '../canvas/canvasjs.react';

const Chart = props => (
  <Layout>
    <div>
      <p>{JSON.stringify(props.data)}</p>
    </div>
  </Layout>
);

Chart.getInitialProps = async function(context) {
  const res = await fetch(
    `http://localhost:3000/Chart/json/${context.query.table}`
  );
  const data = await res.json();
  return { data };
};

export default Chart;
