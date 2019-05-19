open Canvas;
open JsQr;
open UserMedia;
open Util;
open Webapi.Dom;

let syncScan = (scanCallback, imageData) =>
  switch (
    jsQR(
      dataGet(imageData),
      widthGet(imageData),
      heightGet(imageData),
      DontInvert,
    )
  ) {
  | Some(code) => scanCallback(textDataGet(code))
  | None => ()
  };

let scanUsingDeviceId:
  (Dom.element, string, string => unit) => Js.Promise.t(Dom.element) =
  (videoEl, deviceId, scanCallback) =>
    initStreamByDeviceId(videoEl, deviceId)
    |> Js.Promise.then_(video => {
         let canvas = DocumentRe.createElementNS(htmlNs, "canvas", document);
         withQuerySelectorDom("#htmlContainer", body =>
           ElementRe.appendChild(canvas, body)
         );

         let maybeWorker =
           switch (WebWorkers.create_webworker("worker.js")) {
           | worker => Some(worker)
           | exception e =>
             Js.log(
               "Could not initialize worker, falling back to synchronous scan.",
             );
             Js.log(e);
             None;
           };

         switch (maybeWorker) {
         | Some(worker) =>
           let msgBackHandler: WebWorkers.MessageEvent.t => unit = (
             e => {
               let maybeCode: option(code) = WebWorkers.MessageEvent.data(e);
               switch (maybeCode) {
               | Some(qrCode) => scanCallback(textDataGet(qrCode))
               | None => ()
               };
             }
           );
           WebWorkers.onMessage(worker, msgBackHandler);

         | None => ()
         };

         let frameCount = ref(0);

         let rec onTick = _ => {
           if (readyState(video) == 4) {
             let width = videoWidth(video);
             let height = videoHeight(video);
             if (getWidth(canvas) !== width) {
               setWidth(canvas, width);
               setHeight(canvas, height);
             };

             if (frameCount^ mod 5 == 0) {
               let ctx = getContext(canvas);
               Ctx.drawImage(ctx, ~image=video, ~dx=0, ~dy=0);

               let imageData =
                 Ctx.getImageData(ctx, ~sx=0, ~sy=0, ~sw=width, ~sh=height);

               switch (maybeWorker) {
               | Some(worker) =>
                 WebWorkers.postMessage(
                   worker,
                   (dataGet(imageData), width, height),
                 )
               | None => syncScan(scanCallback, imageData)
               };
             };
           };

           frameCount := frameCount^ + 1;
           Webapi.requestAnimationFrame(onTick);
         };
         Webapi.requestAnimationFrame(onTick);
         Js.Promise.resolve(canvas);
       });
