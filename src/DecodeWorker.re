open JsQr;

WebWorkers.setWorkerOnMessage(
  WebWorkers.self,
  (e: WebWorkers.MessageEvent.t) => {
    let (data, width, height, invert) = WebWorkers.MessageEvent.data(e);

    let maybeCode = jsQR(data, width, height, invert);
    WebWorkers.postMessageFromWorker(maybeCode);
  },
);
