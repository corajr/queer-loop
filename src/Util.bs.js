// Generated by BUCKLESCRIPT, PLEASE EDIT WITH CARE

import * as $$Array from "../node_modules/bs-platform/lib/es6/array.js";
import * as Curry from "../node_modules/bs-platform/lib/es6/curry.js";
import * as Belt_Option from "../node_modules/bs-platform/lib/es6/belt_Option.js";
import * as Caml_option from "../node_modules/bs-platform/lib/es6/caml_option.js";
import * as Webapi__Dom__Element from "../node_modules/bs-webapi/src/Webapi/Webapi__Dom/Webapi__Dom__Element.js";

var htmlNs = "http://www.w3.org/1999/xhtml";

function withQuerySelectorDom(query, f) {
  return Belt_Option.map(Caml_option.nullable_to_opt(document.querySelector(query)), f);
}

function withQuerySelector(query, f) {
  return Belt_Option.map(Belt_Option.flatMap(Caml_option.nullable_to_opt(document.querySelector(query)), Webapi__Dom__Element.asHtmlElement), f);
}

function catMaybes(ary) {
  var newArray = /* array */[];
  $$Array.iter((function (param) {
          if (param !== undefined) {
            newArray.push(Caml_option.valFromOption(param));
            return /* () */0;
          } else {
            return /* () */0;
          }
        }), ary);
  return newArray;
}

function mapMaybe(f, arrayA) {
  return catMaybes($$Array.map(f, arrayA));
}

function withQuerySelectorFrom(query, element, f) {
  return Belt_Option.map(Caml_option.nullable_to_opt(element.querySelector(query)), f);
}

function withQuerySelectorAllFrom(query, element, f) {
  var arrayA = Array.prototype.slice.call(element.querySelectorAll(query));
  return Curry._1(f, catMaybes($$Array.map(Webapi__Dom__Element.ofNode, arrayA)));
}

function withQuerySelectorAll(query, f) {
  var arrayA = Array.prototype.slice.call(document.querySelectorAll(query));
  return Curry._1(f, catMaybes($$Array.map(Webapi__Dom__Element.ofNode, arrayA)));
}

function withQuerySelectorSub(query, childQuery, f) {
  return Belt_Option.map(Belt_Option.flatMap(Caml_option.nullable_to_opt(document.querySelector(query)), (function (param) {
                    return Caml_option.nullable_to_opt(param.querySelector(childQuery));
                  })), f);
}

function removeFromParentNode(node) {
  var match = node.parentNode;
  if (match == null) {
    return /* () */0;
  } else {
    match.removeChild(node);
    return /* () */0;
  }
}

function removeFromParent(element) {
  var match = element.parentElement;
  if (match == null) {
    return /* () */0;
  } else {
    match.removeChild(element);
    return /* () */0;
  }
}

function createElementWithId(tagName, id) {
  var element = document.createElementNS(htmlNs, tagName);
  element.id = id;
  return element;
}

function getHash(param) {
  return window.location.hash;
}

function setHash(hash) {
  window.location.hash = hash;
  return /* () */0;
}

function getQueryString(param) {
  return window.location.search;
}

function setQueryString(search) {
  window.location.search = search;
  return /* () */0;
}

function setBackground(selector, bgCss) {
  return withQuerySelector(selector, (function (el) {
                el.style.setProperty("background", bgCss, "");
                console.log(bgCss);
                return /* () */0;
              }));
}

function setSrc (img,src){
     img.src = src;};

var svgNs = "http://www.w3.org/2000/svg";

export {
  htmlNs ,
  svgNs ,
  withQuerySelectorDom ,
  withQuerySelector ,
  catMaybes ,
  mapMaybe ,
  withQuerySelectorFrom ,
  withQuerySelectorAllFrom ,
  withQuerySelectorAll ,
  withQuerySelectorSub ,
  removeFromParentNode ,
  removeFromParent ,
  createElementWithId ,
  getHash ,
  setHash ,
  getQueryString ,
  setQueryString ,
  setBackground ,
  setSrc ,
  
}
/* Webapi__Dom__Element Not a pure module */
