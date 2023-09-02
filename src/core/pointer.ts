import * as booyah from "@ghom/booyah"
import * as pixi from "pixi.js"

const pointer = new pixi.Point()

document.addEventListener("pointermove", (event) => {
  pointer.x = event.clientX
  pointer.y = event.clientY
})

export default pointer
