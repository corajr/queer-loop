let serializeTime = date => Js.Float.toString(Js.Date.getTime(date));

let deserializeTime = str => {
  let date = Js.Date.make();
  Js.Date.setTime(date, Js.Float.fromString(str));
  date;
};

let maybeDeserializeTime = str => {
  let t = Js.Float.fromString(str);
  if (Js.Float.isFinite(t)) {
    let date = Js.Date.make();
    Js.Date.setTime(date, t);
    switch (Js.Date.toISOString(date)) {
    | _ => Some(date)
    | exception err =>
      Js.Console.error3("Could not make valid date from:", t, err);
      None;
    };
  } else {
    None;
  };
};

let getTimestamp = _ => serializeTime(Js.Date.make());

let getTimestampAndLocaleString = _ => {
  let date = Js.Date.make();
  (serializeTime(date), Js.Date.toLocaleString(date));
};

let toOptionFiniteFloat = f => if (Js.Float.isFinite(f)) { Some(f) } else { None };

let parseTimestampFromText = text => {
  if (text === "") {
    None
  } else {
    switch (Js.Date.fromString(text)) {
    | date => toOptionFiniteFloat(Js.Date.getTime(date))
    | exception _ => None
    }
  }
};

let parseTimestampFromFragment = href => {
  switch (Webapi.Url.make(href)) {
  | url => 
    let fragment = Js.String.sliceToEnd(~from=1, Webapi.Url.hash(url));
    if (fragment === "") {
      None
    } else {
      let tryFloat =
        switch (maybeDeserializeTime(fragment)) {
        | Some(date) => toOptionFiniteFloat(Js.Date.getTime(date))
        | None => None
        };
      switch (tryFloat) {
      | Some(ts) => Some(ts)
      | None =>
        if (fragment === "") {
          None
        } else {
          switch (Js.Date.fromString(fragment)) {
          | date2 => toOptionFiniteFloat(Js.Date.getTime(date2))
          | exception _ => None
          }
        }
      }
    }
  | exception _ => None
  }
};

let getTimestampFromElement = element => {
  let getTextTimestamp = () =>
    switch (Webapi.Dom.Element.querySelector("text", element)) {
    | Some(text) => parseTimestampFromText(Webapi.Dom.Element.textContent(text))
    | None => None
    };
  switch (Webapi.Dom.Element.querySelector("a", element)) {
  | Some(link) => 
    switch (Webapi.Dom.Element.getAttribute("href", link)) {
    | Some(href) =>
      switch (parseTimestampFromFragment(href)) {
      | Some(timestamp) => Some(timestamp)
      | None => getTextTimestamp()
      }
    | None => getTextTimestamp()
    }
  | None => getTextTimestamp()
  }
};
