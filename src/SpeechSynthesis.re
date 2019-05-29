module Voice = {
  [@bs.deriving abstract]
  type t = {
    name: string,
    lang: string,
  };
};

module Utterance = {
  [@bs.deriving abstract]
  type t = {
    mutable voice: Voice.t,
    mutable lang: string,
    /* pitch: 0.0 to 2.0 */
    mutable pitch: float,
    /* rate: 0.1 to 10.0 */
    mutable rate: float,
    /* volume: 0.0 to 1.0 */
    mutable volume: float,
    /* text: max length 2^15 - 1 (32767) chars */
    mutable text: string,
  };

  external asEventTarget : t => Dom.eventTarget = "%identity";

  [@bs.new] external make : string => t = "SpeechSynthesisUtterance";
  /* events: boundary, end */
};

[@bs.val] [@bs.scope ("window", "speechSynthesis")]
external getVoices : unit => array(Voice.t) = "";

[@bs.val] [@bs.scope ("window", "speechSynthesis")]
external speak : Utterance.t => unit = "";
