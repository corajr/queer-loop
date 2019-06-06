open Audio;

type t = {
  delayNode: Audio.delayNode,
  masterDelayNode: Audio.delayNode,
  biquadFilter: Audio.biquadFilter,
  gainNode: Audio.gainNode,
  masterGainNode: Audio.gainNode,
};

let setupDelay =
    (
      ~audioContext,
      ~sourceNode: audioNode,
      ~output: audioNode,
      ~gain: float=0.7,
      ~cutoff=2000.0,
      ~midiNote: float=45.0,
      _: unit,
    )
    : t => {
  let now = currentTimeGet(audioContext);

  let masterGainNode = createGain(audioContext);
  let masterDelayTime = 4.0;
  let masterDelayNode = createDelay(audioContext, ~maxDelay=masterDelayTime);

  setValueAtTime(delayTimeGet(masterDelayNode), masterDelayTime, now);
  setValueAtTime(gain_Get(masterGainNode), 0.5, now);

  let delayNode = createDelay(audioContext, ~maxDelay=1.0);
  let biquadFilter =
    makeFilter(~audioCtx=audioContext, ~filterType=LowPass(cutoff, 0.0));
  let gainNode = createGain(audioContext);

  let delayOffset = 128.0 /. sampleRateGet(audioContext);
  let delayPeriod = 1.0 /. noteToFrequency(midiNote) -. delayOffset;
  Js.log(delayPeriod);

  setValueAtTime(gain_Get(gainNode), gain, now);
  setValueAtTime(delayTimeGet(delayNode), delayPeriod, now);
  connect(sourceNode, masterDelayNode);
  /* connect(masterDelayNode, gainNode); */
  connect(masterDelayNode, delayNode);
  connect(delayNode, biquadFilter);
  connect(biquadFilter, gainNode);

  /* feedback */
  connect(gainNode, delayNode);

  connect(gainNode, masterGainNode);
  connect(masterGainNode, output);
  {delayNode, biquadFilter, gainNode, masterDelayNode, masterGainNode};
};
