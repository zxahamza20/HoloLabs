/** Summarizes an equal-duration series of one-second rendering samples. */
const round = (v, digits = 1) => Number(v.toFixed(digits));
export function summarizeBenchmark(samples) {
  if (!Array.isArray(samples) || !samples.length) return null;
  const average = key => round(samples.reduce((sum, s) => sum + (Number.isFinite(s[key]) ? s[key] : 0), 0) / samples.length);
  return {
    seconds: samples.length,
    fps: average('fps'),
    p95FrameMs: average('p95FrameMs'),
    avgFrameMs: average('avgFrameMs'),
    trackingFps: average('trackingFps'),
    inferenceMs: average('inferenceMs'),
  };
}
