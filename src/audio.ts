const FFT_SIZE = 4096;

export async function startListening(
  onFrame: (buffer: Float32Array, sampleRate: number) => void
): Promise<() => void> {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });

  // Use webkitAudioContext as fallback for Mobile Safari
  const AudioCtx = (window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext);
  const ctx = new AudioCtx();

  if (ctx.state === 'suspended') {
    await ctx.resume();
  }

  const source = ctx.createMediaStreamSource(stream);
  const analyser = ctx.createAnalyser();
  analyser.fftSize = FFT_SIZE;

  source.connect(analyser);

  const buffer = new Float32Array(analyser.fftSize);
  let rafId: number;
  let stopped = false;

  function loop() {
    if (stopped) return;
    analyser.getFloatTimeDomainData(buffer);
    onFrame(buffer, ctx.sampleRate);
    rafId = requestAnimationFrame(loop);
  }

  rafId = requestAnimationFrame(loop);

  return function stop() {
    stopped = true;
    cancelAnimationFrame(rafId);
    source.disconnect();
    stream.getTracks().forEach(t => t.stop());
    ctx.close();
  };
}
