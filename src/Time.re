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
    Some(date);
  } else {
    None;
  };
};

let getTimestamp = _ => serializeTime(Js.Date.make());

let getTimestampAndLocaleString = _ => {
  let date = Js.Date.make();
  (serializeTime(date), Js.Date.toLocaleString(date));
};
