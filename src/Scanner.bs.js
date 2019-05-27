// Generated by BUCKLESCRIPT VERSION 5.0.2, PLEASE EDIT WITH CARE

import * as Curry from "../node_modules/bs-platform/lib/es6/curry.js";
import * as Caml_option from "../node_modules/bs-platform/lib/es6/caml_option.js";
import * as JsQr$QueerLoop from "./JsQr.bs.js";
import * as Util$QueerLoop from "./Util.bs.js";
import * as Canvas$QueerLoop from "./Canvas.bs.js";
import * as Options$QueerLoop from "./Options.bs.js";
import * as Caml_js_exceptions from "../node_modules/bs-platform/lib/es6/caml_js_exceptions.js";
import * as UserMedia$QueerLoop from "./UserMedia.bs.js";

function syncScan(scanCallback, srcCanvas, invertOptions, imageData) {
  var match = JsQr$QueerLoop.jsQR(imageData.data, imageData.width, imageData.height, invertOptions);
  if (match !== undefined) {
    return Curry._2(scanCallback, srcCanvas, Caml_option.valFromOption(match));
  } else {
    return /* () */0;
  }
}

function copyVideoToSnapshotCanvas(videoCanvas) {
  return Util$QueerLoop.withQuerySelectorDom("#snapshotCanvas", (function (snapshotCanvas) {
                var snapshotCtx = snapshotCanvas.getContext("2d");
                snapshotCtx.globalCompositeOperation = "source-over";
                snapshotCtx.globalAlpha = Options$QueerLoop.currentOptions[0][/* opacity */6];
                var fullWidth = videoCanvas.width;
                var fullHeight = videoCanvas.height;
                var w = fullWidth < fullHeight ? fullWidth : fullHeight;
                var match;
                if (fullWidth > fullHeight) {
                  var offset = (fullWidth - w | 0) / 2 | 0;
                  match = /* tuple */[
                    offset,
                    0
                  ];
                } else {
                  var offset$1 = (fullHeight - w | 0) / 2 | 0;
                  match = /* tuple */[
                    0,
                    offset$1
                  ];
                }
                snapshotCtx.drawImage(videoCanvas, match[0], match[1], w, w, 0, 0, snapshotCanvas.width, snapshotCanvas.height);
                return /* () */0;
              }));
}

function runScanFromCanvas(canvas, maybeWorker, scanCallback) {
  var ctx = canvas.getContext("2d");
  if (maybeWorker !== undefined) {
    var msgBackHandler = function (e) {
      var maybeCode = e.data;
      if (maybeCode !== undefined) {
        return Curry._2(scanCallback, canvas, Caml_option.valFromOption(maybeCode));
      } else {
        return /* () */0;
      }
    };
    Caml_option.valFromOption(maybeWorker).onmessage = msgBackHandler;
  }
  var invert = Options$QueerLoop.currentOptions[0][/* invert */4];
  if (invert) {
    Canvas$QueerLoop.invert(canvas);
  }
  var imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  if (maybeWorker !== undefined) {
    Caml_option.valFromOption(maybeWorker).postMessage(/* tuple */[
          imageData.data,
          (function (prim) {
              return prim.width;
            }),
          (function (prim) {
              return prim.height;
            }),
          /* DontInvert */1
        ]);
    return /* () */0;
  } else {
    return syncScan(scanCallback, canvas, /* DontInvert */1, imageData);
  }
}

function scanUsingDeviceId(videoEl, deviceId, currentOptions, scanCallback) {
  return UserMedia$QueerLoop.initStreamByDeviceId(videoEl, deviceId).then((function (video) {
                var canvas = document.createElementNS(Util$QueerLoop.htmlNs, "canvas");
                Util$QueerLoop.withQuerySelectorDom("#htmlContainer", (function (htmlContainer) {
                        htmlContainer.appendChild(video);
                        htmlContainer.appendChild(canvas);
                        return /* () */0;
                      }));
                var maybeWorker;
                var exit = 0;
                var worker;
                try {
                  worker = new Worker("worker.js");
                  exit = 1;
                }
                catch (raw_e){
                  var e = Caml_js_exceptions.internalToOCamlException(raw_e);
                  console.log("Could not initialize worker, falling back to synchronous scan.");
                  console.log(e);
                  maybeWorker = undefined;
                }
                if (exit === 1) {
                  maybeWorker = Caml_option.some(worker);
                }
                var frameCount = /* record */[/* contents */0];
                var onTick = function (param) {
                  if (video.readyState === 4) {
                    var width = video.videoWidth;
                    var height = video.videoHeight;
                    if (canvas.width !== width) {
                      canvas.width = width;
                      canvas.height = height;
                    }
                    if (frameCount[0] % 5 === 0) {
                      var ctx = canvas.getContext("2d");
                      ctx.drawImage(video, 0, 0);
                      copyVideoToSnapshotCanvas(canvas);
                      var ctx$1 = canvas.getContext("2d");
                      if (maybeWorker !== undefined) {
                        var msgBackHandler = function (e) {
                          var maybeCode = e.data;
                          if (maybeCode !== undefined) {
                            return Curry._2(scanCallback, canvas, Caml_option.valFromOption(maybeCode));
                          } else {
                            return /* () */0;
                          }
                        };
                        Caml_option.valFromOption(maybeWorker).onmessage = msgBackHandler;
                      }
                      var invert = currentOptions[0][/* invert */4];
                      if (invert) {
                        Canvas$QueerLoop.invert(canvas);
                      }
                      var imageData = ctx$1.getImageData(0, 0, canvas.width, canvas.height);
                      if (maybeWorker !== undefined) {
                        Caml_option.valFromOption(maybeWorker).postMessage(/* tuple */[
                              imageData.data,
                              width,
                              height,
                              /* DontInvert */1
                            ]);
                      } else {
                        syncScan(scanCallback, canvas, /* DontInvert */1, imageData);
                      }
                    }
                    
                  }
                  frameCount[0] = frameCount[0] + 1 | 0;
                  requestAnimationFrame(onTick);
                  return /* () */0;
                };
                requestAnimationFrame(onTick);
                return Promise.resolve(canvas);
              }));
}

export {
  syncScan ,
  copyVideoToSnapshotCanvas ,
  runScanFromCanvas ,
  scanUsingDeviceId ,
  
}
/* JsQr-QueerLoop Not a pure module */
