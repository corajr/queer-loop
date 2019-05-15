open Canvas;
open JsQr;
open UserMedia;
open Webapi.Dom;

let scanUsingDeviceId:
  (Dom.element, string, string => unit) => Js.Promise.t(unit) =
  (videoEl, deviceId, scanCallback) =>
    initStreamByDeviceId(videoEl, deviceId)
    |> Js.Promise.then_(video => {
         let canvas = DocumentRe.createElement("canvas", document);

         let frameCount = ref(0);

         let rec onTick = _ => {
           if (frameCount^ mod 5 == 0 && readyState(video) == 4) {
             let width = videoWidth(video);
             let height = videoHeight(video);
             setWidth(canvas, width);
             setHeight(canvas, height);
             let ctx = getContext(canvas);
             Ctx.drawImage(ctx, ~image=video, ~dx=0, ~dy=0);
             let imageData =
               Ctx.getImageData(ctx, ~sx=0, ~sy=0, ~sw=width, ~sh=height);
             let maybeCode = jsQR(data, width, height);
             switch (maybeCode) {
             | Some(qrCode) => scanCallback(contentGet(qrCode))
             | None => ()
             };
             ();
           };

           frameCount := frameCount^ + 1;
           Webapi.requestAnimationFrame(onTick);
         };
         Webapi.requestAnimationFrame(onTick);
         Js.Promise.resolve();
       });
