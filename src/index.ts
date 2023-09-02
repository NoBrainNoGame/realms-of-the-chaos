import runner from "./core/runner"

declare global {
  interface ObjectConstructor {
    keys<T>(object: T): (keyof T)[]
  }
}

runner.start()
