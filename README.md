# <a href="https://qqq.lu"><img width="64" height="64" src="queer-loop.svg" alt="a QR code for queer-loop"/> queer-loop</a>

# <a href="https://qqq.lu/#2019-05-20T16:00:22.283Z"><img width="256" height="256" src="queer-loop-animated.svg" alt="an example Q(uee)r code"/> </a>

[queer-loop](https://qqq.lu) is a simple [ReasonML](https://reasonml.github.io/)
app that generates and reads QR codes based on URL parameters.

Tested on:
- Chrome (desktop and Android mobile)

**NOTE: this only works in iOS version 11 and higher.**

## Usage

The prototypical use is to hold `queer-loop` up to a mirror so that it can read itself.
Each capture in this mode represents one instance where the QR code was safely read back
by the software, accompanied by an image that accumulates frames from the camera.

Here are a few ways I've found so far to play with it:

- open two copies of qqq.lu on different devices and point their screens/cameras at
  each other
- hook up a capture card (I use the ClonerAlliance Flint LXT) to a Chromecast,
  and cast...:
    - a phone camera to it
    - the tab to itself

Below are the query parameters which may be supplied.

### Query Parameters

#### a (animation)

`a` controls SVG animation, which may be slow on some devices. Default is 0 (off).

Examples:

[`https://qqq.lu/?a=0`](https://qqq.lu/?a=0)
[`https://qqq.lu/?a=1`](https://qqq.lu/?a=1)

#### b (background)

`b` sets the "background" CSS property of the document's body. Default is none.

Examples:

[`https://qqq.lu/?b=url("queer-loop.svg")`](https://qqq.lu/?b=url("queer-loop.svg"))
[`https://qqq.lu/?b=lightpink`](https://qqq.lu/?b=lightpink)
[`https://qqq.lu/?b=%23faa`](https://qqq.lu/?b=%23faa) (must use "%23" since `#` is reserved for the timestamp)

#### c (camera)

If you have more than one camera, you can set the camera(s) using e.g. `?c=1` or `?c=0&c=1`.

Examples:

[`https://qqq.lu/?c=0&c=1`](https://qqq.lu/?c=0&c=1)
[`https://qqq.lu/?c=1`](https://qqq.lu/?c=1)

#### d

`d` sets whether to include the domain in the Q(uee)r code.

Examples:

[`https://qqq.lu/?d=0`](https://qqq.lu/?d=0)

#### i (invert)

`i` renders the code as white on a dark background.

Examples:

[`https://qqq.lu/?i=1`](https://qqq.lu/?i=1)


#### o (opacity)

Set the opacity of the camera image (default: 0.1). Smaller values result in a longer exposure (more time is captured).

Examples:

[`https://qqq.lu/?o=0.05`](https://qqq.lu/?o=0.05)

#### p (poem)

Get the poem by poets.org slug.

Examples:

[`https://qqq.lu/?p=im-nobody-who-are-you-260`](https://qqq.lu/?p=im-nobody-who-are-you-260)

#### t (title)

Set the page title.

Examples:

[`https://qqq.lu/?t=Hello%20there`](https://qqq.lu/?t=Hello%20there)

#### w (wiki)

Get the English Wikipedia page.

Examples:

[`https://qqq.lu/?w=QR+code`](https://qqq.lu/?w=QR+code)

#### v (video)

Get the video by YouTube ID.

Examples:

[`https://qqq.lu/?v=DGHjHU_Z8d8`](https://qqq.lu/?v=DGHjHU_Z8d8)


## Development

<img width="256" height="256" src="development.svg" alt="a version of queer-loop pointed to localhost" />

License is GPL v3.

### Requirements

- [yarn](https://yarnpkg.com/)

Development has only tested on Ubuntu 18.10, but should work anywhere Node does.

### Build + Watch

In different terminals (or tmux splits), run:

```
yarn start
```

```
rollup -c -w
```

### Build for Production

```
yarn build:production
```
