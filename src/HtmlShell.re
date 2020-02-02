/** Add in the basic structure/style of the HTML page. **/
open QueerCode;
open Webapi.Dom;
open Util;

let pitchClasses = {
  let pcToStr = (i, v) => {
    let iStr = string_of_int(i);
    let vStr = Js.Float.toString(v);
    {j|#pc$iStr {
    background: hsl($(vStr)turn,100%,50%);
}|j};
  };
  let pcs =
    Array.mapi(pcToStr, Array.init(12, i => float_of_int(i) /. 12.0));
  Js.Array.joinWith("\n", pcs);
};
let styleText =
  {|
h1 { display: none; }

body { margin: 0; font-family: "courier new", monospace; }
canvas {
  display: none;
  pointer-events: none;
}

iframe, video {
  position: fixed;
  min-width: 100vw;
  min-height: 100vh;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  mix-blend-mode: screen;
}

.invert iframe, .invert video {
  mix-blend-mode: multiply;
}

video {
  pointer-events: none;
}

#welcome {
  display: none;
}

#htmlContainer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 95vw;
  height: 95vh;
}

@media (orientation: landscape) {
  #htmlContainer {
      flex-direction: row;
  }
}

@media (orientation: portrait) {
  #htmlContainer {
      flex-direction: column;
  }
}

#codes {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-start;
  align-items: flex-start;
  z-index: 100;
  flex-basis: 20%;
}

#focus {
  flex-basis: 45%;
}

#queer-loop {
  z-index: 100;
  margin: auto;
  position: fixed;
  width: 480px;
  height: 480px;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  transition: opacity 0.1s;
}

.hidden {
   opacity: 0.0;
}

#log {
  flex-basis: 20%;
  flex-wrap: wrap;
  z-index: 100;
}

.log-entry {
  display: inline-flex;
  flex-direction: column;
  padding: 1em;
  text-decoration: none;
  color: white;
}

.log-entry:active, .log-entry:visited {
  color: white;
}

.log-entry div {
  display: flex;
}

.codeLink.active {
  position: relative;
}

.codeLink.active:after {
  position: absolute;
  content: '';
  display: block;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  border: 6px solid rgba(255, 255, 255, 0.5);
}

#toolbar {
   z-index: 101;
   position: fixed;
   display: flex;
   flex-direction: column;
   top: 0;
   left:  0;
}

#chromaBackdrop {
   position: fixed;
   left: 50%;
   top: 0%;
   transform: translate(-50%, 0%);
   width: 480px;
   min-height: 100vh;
   display: flex;
   pointer-events: none;
}

#inputCanvas {
   position: fixed;
   display: block;
   right: 0;
   top: 0;
}

.pitchClass {
   height: 100vh;
   width: calc(100vw / 12);
   opacity: 0.0;
   transition: opacity 0.1s;
}
|}
  ++ pitchClasses;

let createStyle = () : Dom.element => {
  let style = Document.createElementNS(htmlNs, "style", document);
  Element.setAttribute("type", "text/css", style);

  Element.setTextContent(style, styleText);
  style;
};

let createIconButtonWithCallback =
    (~parentSelector: string, ~name: string, ~callback: Dom.event => unit)
    : unit => {
  let icon = createIconFromText(name);
  let button = createElementWithId("div", name);
  Element.appendChild(icon, button);

  Element.addEventListener("click", callback, button);

  withQuerySelectorDom(parentSelector, toolbar =>
    Element.appendChild(button, toolbar)
  )
  |> ignore;
};

let createStructureOn = (htmlContainer: Dom.element) : unit => {
  let inputCanvas = createElementWithId("canvas", "inputCanvas");
  let snapshotCanvas = createElementWithId("canvas", "snapshotCanvas");
  let iconCanvas = createElementWithId("canvas", "iconCanvas");

  let sources = createElementWithId("div", "sources");
  let videoContainer = createElementWithId("div", "videoContainer");
  let iframeContainer = createElementWithId("div", "iframeContainer");
  Element.appendChild(videoContainer, sources);
  Element.appendChild(iframeContainer, sources);

  let codes = createElementWithId("div", "codes");
  let focus = createElementWithId("div", "focus");

  let toolbar = createElementWithId("div", "toolbar");

  let download = createElementWithId("div", "download");
  let saveIcon = createIconFromText("save");
  Element.appendChild(saveIcon, download);
  Element.appendChild(download, toolbar);
  Element.appendChild(toolbar, htmlContainer);

  let log = createElementWithId("div", "log");

  Element.appendChild(snapshotCanvas, htmlContainer);
  Element.appendChild(iconCanvas, htmlContainer);
  Element.appendChild(inputCanvas, htmlContainer);
  Element.appendChild(sources, htmlContainer);

  let chromaBackdrop = createElementWithId("div", "chromaBackdrop");
  for (i in 0 to 11) {
    let pitchClassBackdrop =
      createElementWithId("div", "pc" ++ string_of_int(i));
    Element.setClassName(pitchClassBackdrop, "pitchClass");
    Element.appendChild(pitchClassBackdrop, chromaBackdrop);
  };
  Element.appendChild(chromaBackdrop, focus);

  let queerLoop = createElementWithId("div", "queer-loop");
  Element.appendChild(queerLoop, focus);

  Element.appendChild(codes, htmlContainer);
  Element.appendChild(focus, htmlContainer);
  Element.appendChild(log, htmlContainer);
  ();
};

let setup = () => {
  let style = createStyle();
  withQuerySelectorDom("head", head => Element.appendChild(style, head));
  withQuerySelectorDom("#htmlContainer", createStructureOn);
};
