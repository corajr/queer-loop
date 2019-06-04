open Audio;

[@bs.deriving abstract]
type analyzerOpts('a) = {
  audioContext,
  source: audioNode,
  bufferSize: int,
  featureExtractors: array(string),
  callback: 'a => unit,
};

type analyzer;

[@bs.send] external start : analyzer => unit = "";
[@bs.send] external stop : analyzer => unit = "";

[@bs.val] [@bs.scope "Meyda"]
external createMeydaAnalyzer : analyzerOpts('a) => analyzer = "";
