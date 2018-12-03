import { useState } from "react";

export default () => {
  const [counter, setCounter] = useState(0);

  return (
    <button onClick={() => setCounter(counter + 1)}>Count: {counter}</button>
  );
};
