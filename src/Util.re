open Webapi.Dom;

let htmlNs = "http://www.w3.org/1999/xhtml";
let svgNs = "http://www.w3.org/2000/svg";

let withQuerySelectorDom = (query, f) =>
  document |> Document.querySelector(query) |. Belt.Option.map(f);

let withQuerySelector = (query, f) =>
  document
  |> Document.querySelector(query)
  |. Belt.Option.flatMap(Element.asHtmlElement)
  |. Belt.Option.map(f);

let catMaybes: array(option('a)) => array('a) =
  ary => {
    let newArray = [||];
    Array.iter(
      fun
      | Some(a) => Js.Array.push(a, newArray) |> ignore
      | None => (),
      ary,
    );
    newArray;
  };

let mapMaybe: ('a => option('b), array('a)) => array('b) =
  (f, arrayA) => catMaybes(Array.map(f, arrayA));

let withQuerySelectorFrom = (query, element, f) =>
  Element.querySelector(query, element) |. Belt.Option.map(f);

let withQuerySelectorAllFrom = (query, element, f) =>
  Element.querySelectorAll(query, element)
  |> NodeList.toArray
  |> mapMaybe(Element.ofNode)
  |> f;

let withQuerySelectorAll = (query, f) =>
  document
  |> Document.querySelectorAll(query)
  |> NodeList.toArray
  |> mapMaybe(Element.ofNode)
  |> f;

let withQuerySelectorSub = (query, childQuery, f) =>
  document
  |> Document.querySelector(query)
  |. Belt.Option.flatMap(Element.querySelector(childQuery))
  |. Belt.Option.map(f);

let removeFromParentNode = node =>
  switch (Node.parentNode(node)) {
  | Some(parent) => Node.removeChild(node, parent) |> ignore
  | None => ()
  };

let removeFromParent = element =>
  switch (Element.parentElement(element)) {
  | Some(parent) => Element.removeChild(element, parent) |> ignore
  | None => ()
  };

let createElementWithId = (tagName: string, id: string) : Dom.element => {
  let element = Document.createElementNS(htmlNs, tagName, document);
  Element.setId(element, id);
  element;
};

[@bs.val]
external encodeURIComponent : string => string = "encodeURIComponent";

[@bs.val]
external decodeURIComponent : string => string = "decodeURIComponent";

let getHash = _ => Location.hash(Window.location(window));

let setHash = (hash: string) =>
  Location.setHash(Window.location(window), hash);

let getQueryString = _ => Location.search(Window.location(window));

let setQueryString = search =>
  Location.setSearch(Window.location(window), search);

let setBackground = (selector, bgCss) =>
  withQuerySelector(
    selector,
    el => {
      CssStyleDeclaration.setProperty(
        "background",
        bgCss,
        "",
        HtmlElement.style(el),
      );
      Js.log(bgCss);
    },
  );

let setSrc = [%bs.raw (img, src) => {|
     img.src = src;|}];
