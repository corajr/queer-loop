open JsQr;

WebWorkers.setWorkerOnMessage(
  WebWorkers.self,
  (e: WebWorkers.MessageEvent.t) => {
    let (data, width, height) = WebWorkers.MessageEvent.data(e);

    let maybeCode = jsQR(data, width, height);
    WebWorkers.postMessageFromWorker(maybeCode);
  },
);
