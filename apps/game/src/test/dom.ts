/**
 * Test environment for the view layer: a DOM (happy-dom) and a fake 2D
 * canvas context, enough for PixiJS to build scenes, textures and texts
 * without a browser. Nothing is ever rendered to the screen.
 */
import { GlobalRegistrator } from "@happy-dom/global-registrator"

GlobalRegistrator.register({ width: 1280, height: 800 })

const noop = () => {}

function fakeContext2D(canvas: HTMLCanvasElement) {
  let font = "10px sans-serif"
  const fontSize = () => Number(/(\d+(?:\.\d+)?)px/.exec(font)?.[1] ?? 10)
  return {
    canvas,
    get font() {
      return font
    },
    set font(value: string) {
      font = value
    },
    fillStyle: "#000",
    strokeStyle: "#000",
    lineWidth: 1,
    textBaseline: "alphabetic",
    globalAlpha: 1,
    globalCompositeOperation: "source-over",
    imageSmoothingEnabled: true,
    letterSpacing: "0px",
    fillRect: noop,
    clearRect: noop,
    strokeRect: noop,
    fillText: noop,
    strokeText: noop,
    beginPath: noop,
    closePath: noop,
    moveTo: noop,
    lineTo: noop,
    arc: noop,
    rect: noop,
    fill: noop,
    stroke: noop,
    save: noop,
    restore: noop,
    scale: noop,
    translate: noop,
    rotate: noop,
    setTransform: noop,
    resetTransform: noop,
    drawImage: noop,
    putImageData: noop,
    clip: noop,
    createRadialGradient: () => ({ addColorStop: noop }),
    createLinearGradient: () => ({ addColorStop: noop }),
    createPattern: () => ({}),
    measureText: (text: string) => {
      const size = fontSize()
      return {
        width: text.length * size * 0.6,
        actualBoundingBoxAscent: size * 0.8,
        actualBoundingBoxDescent: size * 0.2,
        actualBoundingBoxLeft: 0,
        actualBoundingBoxRight: text.length * size * 0.6,
        fontBoundingBoxAscent: size * 0.8,
        fontBoundingBoxDescent: size * 0.2,
      }
    },
    getImageData: (_x: number, _y: number, w: number, h: number) => ({
      width: w,
      height: h,
      data: new Uint8ClampedArray(Math.max(1, w * h * 4)),
    }),
    createImageData: (w: number, h: number) => ({
      width: w,
      height: h,
      data: new Uint8ClampedArray(Math.max(1, w * h * 4)),
    }),
  }
}

const proto = (globalThis as any).HTMLCanvasElement.prototype
proto.getContext = function (type: string) {
  if (type !== "2d") return null
  this.__ctx ??= fakeContext2D(this)
  return this.__ctx
}
proto.toDataURL = () => "data:image/png;base64,"

// fonts are always "loaded"
;(globalThis as any).document.fonts ??= {
  load: async () => [],
  ready: Promise.resolve(),
}

// PixiJS checks a few canvas features on the prototype
;(globalThis as any).CanvasRenderingContext2D ??=
  class CanvasRenderingContext2D {
    letterSpacing = "0px"
    textLetterSpacing = "0px"
  }
