// Generated by BUCKLESCRIPT VERSION 5.0.2, PLEASE EDIT WITH CARE

import * as Curry from "../node_modules/bs-platform/lib/es6/curry.js";
import * as Caml_option from "../node_modules/bs-platform/lib/es6/caml_option.js";
import * as JsQr$QueerLoop from "./JsQr.bs.js";
import * as Util$QueerLoop from "./Util.bs.js";
import * as Canvas$QueerLoop from "./Canvas.bs.js";
import * as Caml_js_exceptions from "../node_modules/bs-platform/lib/es6/caml_js_exceptions.js";
import * as UserMedia$QueerLoop from "./UserMedia.bs.js";

function syncScan(scanCallback, invertOptions, imageData) {
  var match = JsQr$QueerLoop.jsQR(imageData.data, imageData.width, imageData.height, invertOptions);
  if (match !== undefined) {
    return Curry._1(scanCallback, Caml_option.valFromOption(match).data);
  } else {
    return /* () */0;
  }
}

function scanUsingDeviceId(videoEl, deviceId, currentOptions, scanCallback) {
  return UserMedia$QueerLoop.initStreamByDeviceId(videoEl, deviceId).then((function (video) {
                var canvas = document.createElementNS(Util$QueerLoop.htmlNs, "canvas");
                Util$QueerLoop.withQuerySelectorDom("body", (function (body) {
                        body.appendChild(canvas);
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
                if (maybeWorker !== undefined) {
                  var msgBackHandler = function (e) {
                    var maybeCode = e.data;
                    if (maybeCode !== undefined) {
                      return Curry._1(scanCallback, Caml_option.valFromOption(maybeCode).data);
                    } else {
                      return /* () */0;
                    }
                  };
                  Caml_option.valFromOption(maybeWorker).onmessage = msgBackHandler;
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
                      var match = currentOptions[0][/* invert */4];
                      var invert = match ? /* OnlyInvert */2 : /* DontInvert */1;
                      if (invert !== 1) {
                        Canvas$QueerLoop.invert(canvas);
                      }
                      var imageData = ctx.getImageData(0, 0, width, height);
                      if (maybeWorker !== undefined) {
                        Caml_option.valFromOption(maybeWorker).postMessage(/* tuple */[
                              imageData.data,
                              width,
                              height,
                              /* DontInvert */1
                            ]);
                      } else {
                        syncScan(scanCallback, /* DontInvert */1, imageData);
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
  scanUsingDeviceId ,
  
}
/* JsQr-QueerLoop Not a pure module */
