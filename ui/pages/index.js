import { useState } from "react";
import Layout from "../components/Layout.js";

export default () => {
  const [counter, setCounter] = useState(0);

  return (
    <Layout>
      <button onClick={() => setCounter(counter + 1)}>Count: {counter}</button>
    </Layout>
  );
};
