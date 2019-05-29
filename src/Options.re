type options = {
  background: string,
  includeDomain: bool,
  includeQueryString: bool,
  includeHash: bool,
  invert: bool,
  animate: bool,
  opacity: float,
  title: option(string),
  url: option(string),
  youtubeVideo: option(string),
  cameraIndices: array(int),
};

let defaultOptions = {
  background: "",
  includeDomain: true,
  includeQueryString: true,
  includeHash: true,
  invert: false,
  animate: true,
  opacity: 0.1,
  title: None,
  url: None,
  youtubeVideo: None,
  cameraIndices: [|0|],
};

let currentOptions = ref(defaultOptions);
