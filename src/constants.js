export const SENSOR_NODES = ["Node A", "Node B", "Node C"];

export const latencyTier = () => {
  const val = Math.random();
  if (val < 0.7) return "low";
  if (val < 0.9) return "medium";
  return "high";
};
