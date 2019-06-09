open Audio;

let hashToChroma = hexHash => {
  let chroma = Array.make_float(12);
  let hexDigits = Js.String.slice(~from=0, ~to_=3, hexHash);
  let v = ref(int_of_string("0x" ++ hexDigits));
  let perDigit = 1.0;
  for (i in 0 to 11) {
    if (v^ land 1 > 0) {
      chroma[i] = chroma[i] +. perDigit;
    };
    v := v^ lsr 1;
  };
  chroma;
};

let init =
    (
      ~audioContext: audioContext,
      ~sourceNode: audioNode,
      ~output: audioNode,
      _: unit,
    ) => {
  let bank =
    makeFilterBank(~audioCtx=audioContext, ~filterN=12, ~q=64.0, ~freqFunc=i =>
      noteToFrequency(float_of_int(i) +. 60.0)
    );
  updateFilterBank(
    ~filterBank=bank,
    ~filterValues=[|
      0.5,
      0.0,
      0.0,
      0.0,
      0.5,
      0.0,
      0.0,
      0.5,
      0.0,
      0.0,
      0.0,
      0.0,
    |],
    (),
  );

  let now = currentTimeGet(audioContext);
  let delayTime = 2.0;
  let delay = createDelay(audioContext, ~maxDelay=delayTime);
  setValueAtTime(delayTimeGet(delay), delayTime, now);
  connect(sourceNode, delay);
  connect(delay, bank.input);
  connect(bank.output, output);
  Some(bank);
};
