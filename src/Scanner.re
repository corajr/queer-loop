open Canvas;
open JsQr;
open Options;
open UserMedia;
open Util;
open Webapi.Dom;

let syncScan = (scanCallback, srcCanvas, invertOptions, imageData) =>
  switch (
    jsQR(
      dataGet(imageData),
      widthGet(imageData),
      heightGet(imageData),
      invertOptions,
    )
  ) {
  | Some(code) => scanCallback(srcCanvas, code)
  | None => ()
  };

let copyVideoToSnapshotCanvas = videoCanvas =>
  withQuerySelectorDom("#snapshotCanvas", snapshotCanvas => {
    let snapshotCtx = getContext(snapshotCanvas);

    Ctx.setGlobalCompositeOperation(snapshotCtx, "source-over");
    Ctx.setGlobalAlpha(snapshotCtx, currentOptions^.opacity);
    let fullWidth = getWidth(videoCanvas);
    let fullHeight = getHeight(videoCanvas);
    let w = min(fullWidth, fullHeight);
    let (x, y) =
      if (fullWidth > fullHeight) {
        let offset = (fullWidth - w) / 2;
        (offset, 0);
      } else {
        let offset = (fullHeight - w) / 2;
        (0, offset);
      };
    Ctx.drawImageSourceRectDestRect(
      snapshotCtx,
      ~image=videoCanvas,
      ~sx=x,
      ~sy=y,
      ~sw=w,
      ~sh=w,
      ~dx=0,
      ~dy=0,
      ~dw=getWidth(snapshotCanvas),
      ~dh=getHeight(snapshotCanvas),
    );
  });

let scanUsingDeviceId =
    (videoEl, deviceId, currentOptions, scanCallback)
    : Js.Promise.t(Dom.element) =>
  initStreamByDeviceId(videoEl, deviceId)
  |> Js.Promise.then_(video => {
       let canvas = DocumentRe.createElementNS(htmlNs, "canvas", document);

       withQuerySelectorDom("#htmlContainer", htmlContainer => {
         ElementRe.appendChild(video, htmlContainer);
         ElementRe.appendChild(canvas, htmlContainer);
       });

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
             | Some(qrCode) => scanCallback(canvas, qrCode)
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
             copyVideoToSnapshotCanvas(canvas);

             let invert = currentOptions^.invert;

             if (invert) {
               Canvas.invert(canvas);
             };

             let imageData =
               Ctx.getImageData(ctx, ~sx=0, ~sy=0, ~sw=width, ~sh=height);

             switch (maybeWorker) {
             | Some(worker) =>
               WebWorkers.postMessage(
                 worker,
                 (dataGet(imageData), width, height, DontInvert),
               )
             | None => syncScan(scanCallback, canvas, DontInvert, imageData)
             };
           };
         };

         frameCount := frameCount^ + 1;
         Webapi.requestAnimationFrame(onTick);
       };
       Webapi.requestAnimationFrame(onTick);
       Js.Promise.resolve(canvas);
     });
