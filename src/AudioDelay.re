open Audio;

type t = {
  delayNode: Audio.delayNode,
  biquadFilter: Audio.biquadFilter,
  gainNode: Audio.gainNode,
};

let setupSingleDelay =
    (
      ~audioContext,
      ~sourceNode: audioNode,
      ~output: audioNode,
      ~gain: float=0.7,
      ~outputGain: float=0.5,
      ~cutoff=2000.0,
      ~midiNote: float=45.0,
      _: unit,
    )
    : t => {
  let now = currentTimeGet(audioContext);

  let delayNode = createDelay(audioContext, ~maxDelay=1.0);
  let biquadFilter =
    makeFilter(~audioCtx=audioContext, ~filterType=LowPass(cutoff, 0.0));
  let gainNode = createGain(audioContext);
  let localGainNode = createGain(audioContext);

  let delayOffset = 128.0 /. sampleRateGet(audioContext);
  let delayPeriod = 1.0 /. noteToFrequency(midiNote) -. delayOffset;
  Js.log(delayPeriod);

  setValueAtTime(gain_Get(gainNode), gain, now);
  setValueAtTime(delayTimeGet(delayNode), delayPeriod, now);

  setValueAtTime(gain_Get(localGainNode), outputGain, now);

  connect(sourceNode, delayNode);
  connect(delayNode, biquadFilter);
  connect(biquadFilter, gainNode);

  /* feedback */
  connect(gainNode, delayNode);

  connect(gainNode, localGainNode);
  connect(localGainNode, output);
  {delayNode, biquadFilter, gainNode};
};

let setupDelaysFeedback =
    (
      ~audioContext,
      ~sourceNode: audioNode,
      ~output: audioNode,
      ~gain: float=0.7,
      ~cutoff=2000.0,
      ~midiNotes: array(float)=[|45.0, 52.0|],
      _: unit,
    )
    : t => {
  let now = currentTimeGet(audioContext);

  let masterGainNode = createGain(audioContext);
  let masterDelayTime = 0.5;
  let masterDelayNode = createDelay(audioContext, ~maxDelay=masterDelayTime);

  let biquadFilter =
    makeFilter(~audioCtx=audioContext, ~filterType=LowPass(cutoff, 0.0));

  setValueAtTime(delayTimeGet(masterDelayNode), masterDelayTime, now);
  setValueAtTime(gain_Get(masterGainNode), 0.5, now);

  let delayOutputGain = 1.0 /. float_of_int(Array.length(midiNotes));

  let delays =
    Array.map(
      midiNote =>
        setupSingleDelay(
          ~audioContext,
          ~sourceNode=unwrapDelay(masterDelayNode),
          ~gain,
          ~cutoff,
          ~midiNote,
          ~output=unwrapGain(masterGainNode),
          ~outputGain=delayOutputGain,
        ),
      midiNotes,
    );

  connect(sourceNode, masterDelayNode);
  connect(masterGainNode, output);
  {delayNode: masterDelayNode, biquadFilter, gainNode: masterGainNode};
};

let setupDelays =
    (
      ~audioContext,
      ~sourceNode: audioNode,
      ~output: audioNode,
      ~gain: float=0.7,
      ~cutoff: float=2000.0,
      ~midiNotes: array(float)=[|45.0, 62.0, 69.0, 73.0|],
      _: unit,
    )
    : t => {
  let now = currentTimeGet(audioContext);

  let masterGainNode = createGain(audioContext);
  let masterDelayTime = 0.5;
  let masterDelayNode = createDelay(audioContext, ~maxDelay=masterDelayTime);

  let biquadFilter =
    makeFilter(~audioCtx=audioContext, ~filterType=LowPass(cutoff, 0.0));

  setValueAtTime(delayTimeGet(masterDelayNode), masterDelayTime, now);
  setValueAtTime(gain_Get(masterGainNode), 0.5, now);

  let delayOutputGain = 1.0 /. float_of_int(Array.length(midiNotes));

  let delays =
    Array.map(
      midiNote =>
        setupSingleDelay(
          ~audioContext,
          ~sourceNode=unwrapDelay(masterDelayNode),
          ~gain,
          ~cutoff,
          ~midiNote,
          ~output=unwrapGain(masterGainNode),
          ~outputGain=delayOutputGain,
        ),
      midiNotes,
    );

  connect(sourceNode, masterDelayNode);
  connect(masterGainNode, output);
  {delayNode: masterDelayNode, biquadFilter, gainNode: masterGainNode};
};
