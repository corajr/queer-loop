type mediaStream;

[@bs.deriving abstract]
type videoConstraint = {deviceId: string};

type audioConstraint = bool;

[@bs.deriving abstract]
type constraints = {
  [@bs.optional]
  video: videoConstraint,
  [@bs.optional]
  audio: audioConstraint,
};

[@bs.deriving abstract]
type mediaDeviceInfo = {
  deviceId: string,
  groupId: string,
  kind: string,
  label: string,
};

[@bs.val] [@bs.scope ("window", "navigator", "mediaDevices")]
external enumerateDevices : unit => Js.Promise.t(array(mediaDeviceInfo)) =
  "";

[@bs.val] [@bs.scope ("window", "navigator", "mediaDevices")]
external getUserMedia : constraints => Js.Promise.t(mediaStream) = "";

let getCameras: unit => Js.Promise.t(array(mediaDeviceInfo)) =
  () =>
    enumerateDevices()
    |> Js.Promise.then_(devices =>
         Js.Promise.resolve(
           Belt.Array.keep(devices, x => kindGet(x) == "videoinput"),
         )
       );

[@bs.get] external videoHeight : Dom.element => int = "";
[@bs.get] external videoWidth : Dom.element => int = "";

[@bs.get] external readyState : Dom.element => int = "";

[@bs.set]
external setSrcObject : (Dom.element, mediaStream) => unit = "srcObject";

[@bs.send] external play : Dom.element => unit = "";

let getAudioStream = _ => getUserMedia(constraints(~audio=true, ()));

let initStreamByDeviceId: (Dom.element, string) => Js.Promise.t(Dom.element) =
  (videoEl, deviceId) =>
    getUserMedia(constraints(~video=videoConstraint(~deviceId), ()))
    |> Js.Promise.then_(stream => {
         setSrcObject(videoEl, stream);
         switch (DomRe.Element.asHtmlElement(videoEl)) {
         | Some(video) =>
           HtmlElementRe.setAttribute("playsinline", "true", video)
         | None => ()
         };
         play(videoEl);
         Js.Promise.resolve(videoEl);
       });
