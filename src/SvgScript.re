open Util;

let setAnimacy = (svg, hash) => {
  withQuerySelectorAllFrom(
    ".animate",
    svg,
    Array.map(animated =>
      ElementRe.setAttribute("class", "code previous", animated)
    ),
  );
  withQuerySelectorAllFrom(
    ".previous",
    svg,
    Array.map(animated => ElementRe.setAttribute("class", "code", animated)),
  );
  withQuerySelectorAllFrom(
    ".selected",
    svg,
    Array.map(animated => ElementRe.setAttribute("class", "code", animated)),
  );

  ElementRe.querySelector("#code" ++ hash, svg)
  |. Belt.Option.map(toAnimate =>
       ElementRe.setAttribute("class", "code animate", toAnimate)
     );
};

let setSelection = (svg, hash) => {
  withQuerySelectorAllFrom(
    ".animate",
    svg,
    Array.map(animated => ElementRe.setAttribute("class", "code", animated)),
  );

  withQuerySelectorAllFrom(
    ".previous",
    svg,
    Array.map(animated => ElementRe.setAttribute("class", "code", animated)),
  );

  withQuerySelectorAllFrom(
    ".selected",
    svg,
    Array.map(animated => ElementRe.setAttribute("class", "code", animated)),
  );

  ElementRe.querySelector("#code" ++ hash, svg)
  |. Belt.Option.map(toAnimate =>
       ElementRe.setAttribute("class", "code selected", toAnimate)
     );
};

let modifyClassSet:
  (Belt.Set.String.t => Belt.Set.String.t, Dom.element) => unit =
  (f, el) => {
    let newSet =
      switch (ElementRe.getAttribute("class", el)) {
      | Some(s) => f(Belt.Set.String.fromArray(Js.String.split(" ", s)))
      | None => f(Belt.Set.String.empty)
      };
    ElementRe.setAttribute(
      "class",
      Js.Array.joinWith(" ", Belt.Set.String.toArray(newSet)),
      el,
    );
  };

let getClassesSvg: Dom.element => Belt.Set.String.t =
  el =>
    switch (ElementRe.getAttribute("class", el)) {
    | Some(s) => Belt.Set.String.fromArray(Js.String.split(" ", s))
    | None => Belt.Set.String.empty
    };

let addClassSvg: (Dom.element, string) => unit =
  (el, classNameToAdd) =>
    modifyClassSet(s => Belt.Set.String.add(s, classNameToAdd), el);

let removeClassSvg: (Dom.element, string) => unit =
  (el, classNameToRemove) =>
    modifyClassSet(s => Belt.Set.String.remove(s, classNameToRemove), el);

let toggleClassSvg = (el, classNameToToggle) =>
  modifyClassSet(
    s =>
      if (Belt.Set.String.has(s, classNameToToggle)) {
        Belt.Set.String.remove(s, classNameToToggle);
      } else {
        Belt.Set.String.add(s, classNameToToggle);
      },
    el,
  );

let toggleHash = hash : bool => {
  withQuerySelectorDom("#code" ++ hash, code =>
    toggleClassSvg(code, "active")
  );

  let result =
    Belt.Array.some(
      withQuerySelectorAll(
        ".code" ++ hash,
        Array.map(link => {
          let linkClasses = ElementRe.classList(link);
          DomTokenListRe.toggle("active", linkClasses);
        }),
      ),
      x =>
      x
    );

  withQuerySelectorAll(".active", a =>
    withQuerySelectorDom(".code.animate", code =>
      if (! Belt.Set.String.has(getClassesSvg(code), "active")) {
        if (Array.length(a) > 0) {
          addClassSvg(code, "temporarilyInactive");
        } else {
          removeClassSvg(code, "temporarilyInactive");
        };
      }
    )
    |> ignore
  );
  result;
};
