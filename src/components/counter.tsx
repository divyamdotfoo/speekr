import { useEffect, useState } from "react";

import { Box, render, Text } from "ink";

function Counter() {
  const [count, setCount] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => {
      setCount(count + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [count]);
  return (
    <Box flexDirection="row" justifyContent="center" alignItems="center">
      <Text>Count: {count}</Text>
    </Box>
  );
}

export function renderCounter() {
  return render(<Counter />);
}
