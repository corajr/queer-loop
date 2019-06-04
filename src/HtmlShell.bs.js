// Generated by BUCKLESCRIPT VERSION 5.0.2, PLEASE EDIT WITH CARE

import * as $$Array from "../node_modules/bs-platform/lib/es6/array.js";
import * as Util$QueerLoop from "./Util.bs.js";
import * as QueerCode$QueerLoop from "./QueerCode.bs.js";

function pcToStr(i, v) {
  var iStr = String(i);
  var vStr = v.toString();
  return "#pc" + (String(iStr) + (" {\n    background: hsl(" + (String(vStr) + "turn,100%,50%);\n}")));
}

var pcs = $$Array.mapi(pcToStr, $$Array.init(12, (function (i) {
            return i / 12.0;
          })));

var pitchClasses = pcs.join("\n");

var styleText = "\nh1 { display: none; }\n\nbody { margin: 0; font-family: \"courier new\", monospace; }\ncanvas {\n  display: none;\n  pointer-events: none;\n}\n\niframe, video {\n  position: fixed;\n  min-width: 100vw;\n  min-height: 100vh;\n  left: 50%;\n  top: 50%;\n  transform: translate(-50%, -50%);\n  mix-blend-mode: screen;\n}\n\n.invert iframe, .invert video {\n  mix-blend-mode: multiply;\n}\n\nvideo {\n  pointer-events: none;\n}\n\n#welcome {\n  display: none;\n}\n\n#htmlContainer {\n  display: flex;\n  justify-content: space-between;\n  align-items: center;\n  width: 95vw;\n  height: 95vh;\n}\n\n@media (orientation: landscape) {\n  #htmlContainer {\n      flex-direction: row;\n  }\n}\n\n@media (orientation: portrait) {\n  #htmlContainer {\n      flex-direction: column;\n  }\n}\n\n#codes {\n  display: flex;\n  flex-wrap: wrap;\n  justify-content: flex-start;\n  align-items: flex-start;\n  z-index: 100;\n  flex-basis: 20%;\n}\n\n#focus {\n  flex-basis: 45%;\n}\n\n#queer-loop {\n  z-index: 100;\n  margin: auto;\n  position: fixed;\n  width: 480px;\n  height: 480px;\n  left: 50%;\n  top: 50%;\n  transform: translate(-50%, -50%);\n  transition: opacity 0.5s;\n}\n\n.hidden {\n   opacity: 0.0;\n}\n\n#log {\n  flex-basis: 20%;\n  flex-wrap: wrap;\n  z-index: 100;\n}\n\n.log-entry {\n  display: inline-flex;\n  flex-direction: column;\n  padding: 1em;\n  text-decoration: none;\n  color: white;\n}\n\n.log-entry:active, .log-entry:visited {\n  color: white;\n}\n\n.log-entry div {\n  display: flex;\n}\n\n.codeLink.active {\n  position: relative;\n}\n\n.codeLink.active:after {\n  position: absolute;\n  content: '';\n  display: block;\n  top: 0;\n  left: 0;\n  right: 0;\n  bottom: 0;\n  border: 6px solid rgba(255, 255, 255, 0.5);\n}\n\n#toolbar {\n   z-index: 101;\n}\n\n#chromaBackdrop {\n   position: fixed;\n   left: 50%;\n   transform: translate(-50%, 0%);\n   width: 480px;\n   height: 100vh;\n   display: flex;\n   pointer-events: none;\n}\n\n.pitchClass {\n   height: 100vh;\n   width: calc(100vw / 12);\n   opacity: 0.0;\n   transition: opacity 0.5s;\n}\n" + pitchClasses;

function createStyle(param) {
  var style = document.createElementNS(Util$QueerLoop.htmlNs, "style");
  style.setAttribute("type", "text/css");
  style.textContent = styleText;
  return style;
}

function createIconButtonWithCallback(parentSelector, name, callback) {
  var icon = QueerCode$QueerLoop.createIconFromText(name);
  var button = Util$QueerLoop.createElementWithId("div", name);
  button.appendChild(icon);
  button.addEventListener("click", callback);
  Util$QueerLoop.withQuerySelectorDom(parentSelector, (function (toolbar) {
          toolbar.appendChild(button);
          return /* () */0;
        }));
  return /* () */0;
}

function createStructureOn(htmlContainer) {
  var snapshotCanvas = Util$QueerLoop.createElementWithId("canvas", "snapshotCanvas");
  var iconCanvas = Util$QueerLoop.createElementWithId("canvas", "iconCanvas");
  var sources = Util$QueerLoop.createElementWithId("div", "sources");
  var videoContainer = Util$QueerLoop.createElementWithId("div", "videoContainer");
  var iframeContainer = Util$QueerLoop.createElementWithId("div", "iframeContainer");
  sources.appendChild(videoContainer);
  sources.appendChild(iframeContainer);
  var codes = Util$QueerLoop.createElementWithId("div", "codes");
  var focus = Util$QueerLoop.createElementWithId("div", "focus");
  var queerLoop = Util$QueerLoop.createElementWithId("div", "queer-loop");
  focus.appendChild(queerLoop);
  var toolbar = Util$QueerLoop.createElementWithId("div", "toolbar");
  var download = Util$QueerLoop.createElementWithId("div", "download");
  var saveIcon = QueerCode$QueerLoop.createIconFromText("save");
  download.appendChild(saveIcon);
  toolbar.appendChild(download);
  focus.appendChild(toolbar);
  var log = Util$QueerLoop.createElementWithId("div", "log");
  htmlContainer.appendChild(snapshotCanvas);
  htmlContainer.appendChild(iconCanvas);
  htmlContainer.appendChild(sources);
  var chromaBackdrop = Util$QueerLoop.createElementWithId("div", "chromaBackdrop");
  for(var i = 0; i <= 11; ++i){
    var pitchClassBackdrop = Util$QueerLoop.createElementWithId("div", "pc" + String(i));
    pitchClassBackdrop.className = "pitchClass";
    chromaBackdrop.appendChild(pitchClassBackdrop);
  }
  htmlContainer.appendChild(chromaBackdrop);
  htmlContainer.appendChild(codes);
  htmlContainer.appendChild(focus);
  htmlContainer.appendChild(log);
  return /* () */0;
}

function setup(param) {
  var style = createStyle(/* () */0);
  Util$QueerLoop.withQuerySelectorDom("head", (function (head) {
          head.appendChild(style);
          return /* () */0;
        }));
  return Util$QueerLoop.withQuerySelectorDom("#htmlContainer", createStructureOn);
}

export {
  pitchClasses ,
  styleText ,
  createStyle ,
  createIconButtonWithCallback ,
  createStructureOn ,
  setup ,
  
}
/* pcs Not a pure module */
