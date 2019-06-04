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
  transition: opacity 0.5s;
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
   transform: translate(-50%, 0%);
   width: 480px;
   height: 100vh;
   display: flex;
   pointer-events: none;
}

.pitchClass {
   height: 100vh;
   width: calc(100vw / 12);
   opacity: 0.0;
   transition: opacity 0.5s;
}
|}
  ++ pitchClasses;

let createStyle = () : Dom.element => {
  let style = DocumentRe.createElementNS(htmlNs, "style", document);
  ElementRe.setAttribute("type", "text/css", style);

  ElementRe.setTextContent(style, styleText);
  style;
};

let createIconButtonWithCallback =
    (~parentSelector: string, ~name: string, ~callback: Dom.event => unit)
    : unit => {
  let icon = createIconFromText(name);
  let button = createElementWithId("div", name);
  ElementRe.appendChild(icon, button);

  ElementRe.addEventListener("click", callback, button);

  withQuerySelectorDom(parentSelector, toolbar =>
    ElementRe.appendChild(button, toolbar)
  )
  |> ignore;
};

let createStructureOn = (htmlContainer: Dom.element) : unit => {
  let snapshotCanvas = createElementWithId("canvas", "snapshotCanvas");
  let iconCanvas = createElementWithId("canvas", "iconCanvas");

  let sources = createElementWithId("div", "sources");
  let videoContainer = createElementWithId("div", "videoContainer");
  let iframeContainer = createElementWithId("div", "iframeContainer");
  ElementRe.appendChild(videoContainer, sources);
  ElementRe.appendChild(iframeContainer, sources);

  let codes = createElementWithId("div", "codes");
  let focus = createElementWithId("div", "focus");
  let queerLoop = createElementWithId("div", "queer-loop");
  ElementRe.appendChild(queerLoop, focus);

  let toolbar = createElementWithId("div", "toolbar");

  let download = createElementWithId("div", "download");
  let saveIcon = createIconFromText("save");
  ElementRe.appendChild(saveIcon, download);
  ElementRe.appendChild(download, toolbar);
  ElementRe.appendChild(toolbar, htmlContainer);

  let log = createElementWithId("div", "log");

  ElementRe.appendChild(snapshotCanvas, htmlContainer);
  ElementRe.appendChild(iconCanvas, htmlContainer);
  ElementRe.appendChild(sources, htmlContainer);

  let chromaBackdrop = createElementWithId("div", "chromaBackdrop");
  for (i in 0 to 11) {
    let pitchClassBackdrop =
      createElementWithId("div", "pc" ++ string_of_int(i));
    ElementRe.setClassName(pitchClassBackdrop, "pitchClass");
    ElementRe.appendChild(pitchClassBackdrop, chromaBackdrop);
  };
  ElementRe.appendChild(chromaBackdrop, htmlContainer);

  ElementRe.appendChild(codes, htmlContainer);
  ElementRe.appendChild(focus, htmlContainer);
  ElementRe.appendChild(log, htmlContainer);
  ();
};

let setup = () => {
  let style = createStyle();
  withQuerySelectorDom("head", head => ElementRe.appendChild(style, head));
  withQuerySelectorDom("#htmlContainer", createStructureOn);
};
