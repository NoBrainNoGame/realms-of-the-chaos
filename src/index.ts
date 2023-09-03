import runner from "./core/runner"

// Add ObjectConstructor TypeScript typings for Object.keys and Object.values

declare global {
  interface ObjectConstructor {
    keys<T>(object: T): (keyof T)[]
  }
}

// Disable context menu by right click

document.addEventListener("contextmenu", function (e) {
  e.preventDefault()
})

runner.start()
