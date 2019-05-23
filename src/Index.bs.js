// Generated by BUCKLESCRIPT VERSION 5.0.2, PLEASE EDIT WITH CARE

import * as $$Array from "../node_modules/bs-platform/lib/es6/array.js";
import * as Curry from "../node_modules/bs-platform/lib/es6/curry.js";
import * as Js_dict from "../node_modules/bs-platform/lib/es6/js_dict.js";
import * as Debouncer from "../node_modules/re-debouncer/src/Debouncer.bs.js";
import * as Caml_array from "../node_modules/bs-platform/lib/es6/caml_array.js";
import * as Belt_Option from "../node_modules/bs-platform/lib/es6/belt_Option.js";
import * as Caml_format from "../node_modules/bs-platform/lib/es6/caml_format.js";
import * as Caml_option from "../node_modules/bs-platform/lib/es6/caml_option.js";
import * as Hash$QueerLoop from "./Hash.bs.js";
import * as Util$QueerLoop from "./Util.bs.js";
import * as Scanner$QueerLoop from "./Scanner.bs.js";
import * as Caml_js_exceptions from "../node_modules/bs-platform/lib/es6/caml_js_exceptions.js";
import * as QrCodeGen$QueerLoop from "./QrCodeGen.bs.js";
import * as QueerCode$QueerLoop from "./QueerCode.bs.js";
import * as UserMedia$QueerLoop from "./UserMedia.bs.js";

var domain = "qqq.lu";

var defaultOptions_005 = /* cameraIndices : array */[0];

var defaultOptions = /* record */[
  /* background */"",
  /* includeDomain */true,
  /* includeQueryString */true,
  /* includeHash */true,
  /* opacity */0.1,
  defaultOptions_005
];

var currentOptions = /* record */[/* contents */defaultOptions];

function setBackground(selector, bgCss) {
  return Util$QueerLoop.withQuerySelector(selector, (function (el) {
                el.style.setProperty("background", bgCss, "");
                console.log(bgCss);
                return /* () */0;
              }));
}

var codeRegex = new RegExp("https:\\/\\/qqq.lu\\/#(.+)");

var defaultCode = QrCodeGen$QueerLoop.QrCode[/* _encodeText */0]("https://qqq.lu", QrCodeGen$QueerLoop.Ecc[/* low */0]);

var initialHash = /* record */[/* contents */""];

var camerasRef = /* record */[/* contents : array */[]];

function setSrc (img,src){
     img.src = src;};

var dataSeen = { };

var currentSignature = /* record */[/* contents */""];

var canvasesRef = /* record */[/* contents : array */[]];

function copyVideoToSnapshotCanvas(param) {
  return Util$QueerLoop.withQuerySelectorDom("#snapshotCanvas", (function (snapshotCanvas) {
                var snapshotCtx = snapshotCanvas.getContext("2d");
                snapshotCtx.globalAlpha = currentOptions[0][/* opacity */4];
                return $$Array.mapi((function (i, canvas) {
                              var h = canvas.height;
                              var x = (canvas.width - h | 0) / 2 | 0;
                              snapshotCtx.drawImage(canvas, x, 0, h, h, 0, 0, snapshotCanvas.width, snapshotCanvas.height);
                              return /* () */0;
                            }), canvasesRef[0]);
              }));
}

function takeSnapshot(param) {
  return Util$QueerLoop.withQuerySelectorDom("#snapshotCanvas", (function (snapshotCanvas) {
                snapshotCanvas.getContext("2d");
                return snapshotCanvas.toDataURL("image/jpeg", 0.9);
              }));
}

function getTimestamp(param) {
  return new Date().toISOString();
}

function getTimestampAndLocaleString(param) {
  var date = new Date();
  return /* tuple */[
          date.toISOString(),
          date.toLocaleString()
        ];
}

function asOfNow(f) {
  return Curry._1(f, new Date());
}

function setHashToNow(param) {
  return Util$QueerLoop.setHash(new Date().toISOString());
}

var hasChanged = /* record */[/* contents */false];

function onClick(maybeHash, param) {
  if (!hasChanged[0]) {
    hasChanged[0] = true;
  }
  if (maybeHash !== undefined) {
    var match = Js_dict.get(dataSeen, maybeHash);
    if (match !== undefined) {
      window.location.href = match;
      return /* () */0;
    } else {
      return /* () */0;
    }
  } else {
    return Util$QueerLoop.setHash(new Date().toISOString());
  }
}

function setCode(text) {
  Hash$QueerLoop.hexDigest("SHA-1", text).then((function (hash) {
          var alreadySeen = Belt_Option.isSome(Js_dict.get(dataSeen, hash));
          if (!alreadySeen) {
            dataSeen[hash] = text;
            var code = Belt_Option.getWithDefault(QrCodeGen$QueerLoop.QrCode[/* encodeText */1](text, QrCodeGen$QueerLoop.Ecc[/* medium */1]), defaultCode);
            Util$QueerLoop.withQuerySelectorDom(".queer-loop", (function (loopContainer) {
                    var match = takeSnapshot(/* () */0);
                    if (match !== undefined) {
                      var match$1 = getTimestampAndLocaleString(/* () */0);
                      var localeString = match$1[1];
                      var timestamp = match$1[0];
                      var match$2 = hasChanged[0];
                      var symbol = QueerCode$QueerLoop.createSymbol(text, code, hash, match$2 ? match : undefined, localeString, 6, true, false);
                      var match$3 = loopContainer.querySelector("svg");
                      var svg;
                      if (match$3 == null) {
                        var svg$1 = QueerCode$QueerLoop.createSvgSkeleton(hash);
                        loopContainer.appendChild(svg$1);
                        svg = svg$1;
                      } else {
                        svg = match$3;
                      }
                      svg.appendChild(symbol);
                      var url = QueerCode$QueerLoop.svgToDataURL(svg);
                      Util$QueerLoop.withQuerySelectorDom("#download", (function (a) {
                              a.setAttribute("download", timestamp + ".svg");
                              a.setAttribute("href", url);
                              return /* () */0;
                            }));
                      var singleSvg = QueerCode$QueerLoop.createInverseSvg(text, code, hash, localeString, 6);
                      var singleSvgUrl = QueerCode$QueerLoop.svgToDataURL(singleSvg);
                      Util$QueerLoop.withQuerySelectorDom("#codes", (function (container) {
                              var img = document.createElementNS(Util$QueerLoop.htmlNs, "img");
                              img.setAttribute("src", singleSvgUrl);
                              var partial_arg = hash;
                              img.addEventListener("click", (function (param) {
                                      return onClick(partial_arg, param);
                                    }));
                              container.appendChild(img);
                              return /* () */0;
                            }));
                      currentSignature[0] = hash;
                      return /* () */0;
                    } else {
                      return /* () */0;
                    }
                  }));
          }
          Util$QueerLoop.withQuerySelectorDom(".queer-loop svg use", (function (use) {
                  use.setAttribute("href", "#code" + hash);
                  return /* () */0;
                }));
          return Promise.resolve(/* () */0);
        }));
  return /* () */0;
}

var setText = Debouncer.make(200, (function (hash) {
        Util$QueerLoop.withQuerySelectorDom("#codeContents", (function (el) {
                el.innerText = decodeURIComponent(hash);
                return /* () */0;
              }));
        return /* () */0;
      }));

function onHashChange(param) {
  var opts = currentOptions[0];
  var url = new URL(window.location.href);
  var match = getTimestampAndLocaleString(/* () */0);
  var localeString = match[1];
  var timestamp = match[0];
  Util$QueerLoop.withQuerySelectorDom("title", (function (title) {
          title.innerText = localeString;
          return /* () */0;
        }));
  Util$QueerLoop.withQuerySelectorDom("time", (function (time) {
          time.setAttribute("datetime", timestamp);
          time.innerText = localeString;
          return /* () */0;
        }));
  var match$1 = opts[/* includeDomain */1];
  var match$2 = opts[/* includeQueryString */2];
  var match$3 = opts[/* includeHash */3];
  var urlText = (
    match$1 ? url.origin : ""
  ) + ((
      match$2 ? url.search : ""
    ) + (
      match$3 ? url.hash : ""
    ));
  setCode(urlText);
  return Curry._1(setText, urlText);
}

var frameCount = /* record */[/* contents */0];

var lastUpdated = /* record */[/* contents */0.0];

function onTick(ts) {
  frameCount[0] = frameCount[0] + 1 | 0;
  if (frameCount[0] % 5 === 1) {
    copyVideoToSnapshotCanvas(/* () */0);
  }
  if (ts - lastUpdated[0] >= 10000.0) {
    Util$QueerLoop.setHash(new Date().toISOString());
  }
  lastUpdated[0] = ts;
  requestAnimationFrame(onTick);
  return /* () */0;
}

function maybeUrl(s) {
  var exit = 0;
  var url;
  try {
    url = new URL(s);
    exit = 1;
  }
  catch (raw_e){
    var e = Caml_js_exceptions.internalToOCamlException(raw_e);
    console.error("Could not parse URL", e);
    return undefined;
  }
  if (exit === 1) {
    return Caml_option.some(url);
  }
  
}

function _onInput(param) {
  Util$QueerLoop.withQuerySelectorDom("#codeContents", (function (el) {
          var text = el.innerText;
          return Belt_Option.map(maybeUrl(text), (function (url) {
                        window.location;
                        window.location.hash = url.hash;
                        return /* () */0;
                      }));
        }));
  return /* () */0;
}

var onInput = Debouncer.make(100, _onInput);

function boolParam($$default, param) {
  if (param !== undefined) {
    var s = param;
    if (s === "true" || s === "1" || s === "y") {
      return true;
    } else {
      return s === "";
    }
  } else {
    return $$default;
  }
}

function pick(ary, indices) {
  return $$Array.map((function (i) {
                return Caml_array.caml_array_get(ary, i);
              }), indices);
}

function init(param) {
  Util$QueerLoop.withQuerySelectorDom("#snapshotCanvas", (function (canvas) {
          canvas.width = 480;
          canvas.height = 480;
          return /* () */0;
        }));
  var queryString = Util$QueerLoop.getQueryString(/* () */0);
  if (queryString !== "") {
    var params = new URLSearchParams(queryString);
    var cameraIndices = $$Array.map(Caml_format.caml_int_of_string, params.getAll("c"));
    var match = cameraIndices.length === 0;
    currentOptions[0] = /* record */[
      /* background */decodeURIComponent(Belt_Option.getWithDefault(Caml_option.nullable_to_opt(params.get("b")), "")),
      /* includeDomain */boolParam(true, Caml_option.nullable_to_opt(params.get("d"))),
      /* includeQueryString */boolParam(true, Caml_option.nullable_to_opt(params.get("q"))),
      /* includeHash */boolParam(true, Caml_option.nullable_to_opt(params.get("h"))),
      /* opacity */Number(Belt_Option.getWithDefault(Caml_option.nullable_to_opt(params.get("o")), "0.1")),
      /* cameraIndices */match ? /* array */[0] : cameraIndices
    ];
  }
  if (currentOptions[0][/* background */0] !== "") {
    setBackground("body", currentOptions[0][/* background */0]);
  }
  initialHash[0] = Util$QueerLoop.getHash(/* () */0).slice(1);
  if (initialHash[0] === "") {
    initialHash[0] = new Date().toISOString();
    Util$QueerLoop.setHash(initialHash[0]);
  } else {
    onHashChange(/* () */0);
  }
  Util$QueerLoop.withQuerySelectorDom(".queer-loop", (function (el) {
          el.addEventListener("click", (function (param) {
                  return onClick(undefined, param);
                }));
          return /* () */0;
        }));
  Util$QueerLoop.withQuerySelectorDom("#codeContents", (function (el) {
          el.addEventListener("blur", (function (_evt) {
                  return Curry._1(onInput, /* () */0);
                }));
          return /* () */0;
        }));
  var response = function (input) {
    if (input !== "") {
      Hash$QueerLoop.hexDigest("SHA-1", input).then((function (hexHash) {
              if (!hasChanged[0]) {
                hasChanged[0] = true;
              }
              var alreadySeen = Belt_Option.isSome(Js_dict.get(dataSeen, hexHash));
              if (!alreadySeen) {
                dataSeen[hexHash] = input;
              }
              if (hexHash === currentSignature[0] || !alreadySeen) {
                Util$QueerLoop.setHash(new Date().toISOString());
              }
              return Promise.resolve(/* () */0);
            }));
      return /* () */0;
    } else {
      return 0;
    }
  };
  UserMedia$QueerLoop.getCameras(/* () */0).then((function (cameras) {
              camerasRef[0] = cameras;
              return Promise.all($$Array.map((function (camera) {
                                var videoEl = document.createElementNS(Util$QueerLoop.htmlNs, "video");
                                Util$QueerLoop.withQuerySelectorDom("#htmlContainer", (function (body) {
                                        body.appendChild(videoEl);
                                        return /* () */0;
                                      }));
                                return Scanner$QueerLoop.scanUsingDeviceId(videoEl, camera.deviceId, response);
                              }), pick(cameras, currentOptions[0][/* cameraIndices */5])));
            })).then((function (canvases) {
            canvasesRef[0] = canvases;
            requestAnimationFrame(onTick);
            return Promise.resolve(/* () */0);
          })).catch((function (err) {
          console.error("getCameras failed", err);
          Util$QueerLoop.withQuerySelectorDom("#welcome", (function (welcome) {
                  welcome.setAttribute("style", "display: block;");
                  return /* () */0;
                }));
          return Promise.resolve(/* () */0);
        }));
  return /* () */0;
}

window.addEventListener("load", (function (param) {
        return init(/* () */0);
      }));

window.addEventListener("hashchange", (function (param) {
        return onHashChange(/* () */0);
      }));

var defaultHash = "fff";

export {
  domain ,
  defaultOptions ,
  currentOptions ,
  setBackground ,
  codeRegex ,
  defaultCode ,
  defaultHash ,
  initialHash ,
  camerasRef ,
  setSrc ,
  dataSeen ,
  currentSignature ,
  canvasesRef ,
  copyVideoToSnapshotCanvas ,
  takeSnapshot ,
  getTimestamp ,
  getTimestampAndLocaleString ,
  asOfNow ,
  setHashToNow ,
  hasChanged ,
  onClick ,
  setCode ,
  setText ,
  onHashChange ,
  frameCount ,
  lastUpdated ,
  onTick ,
  maybeUrl ,
  _onInput ,
  onInput ,
  boolParam ,
  pick ,
  init ,
  
}
/* codeRegex Not a pure module */
