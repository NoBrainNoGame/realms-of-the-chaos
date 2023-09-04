import * as booyah from "@ghom/booyah"

export default class DebugComposite extends booyah.Composite {
  constructor(
    public readonly target: booyah.Chip,
    private _onLog: (log: string) => void,
    private _path: string[] = [],
    /**
     * Returns true if the path should be ignored.
     */
    private _ignore?: (name: string) => boolean,
  ) {
    super()
  }

  protected _onActivate() {
    const path = this._path.slice(0)
    const name = this.target.constructor.name

    if (this._ignore && this._ignore(name)) {
      this.terminate()
      return
    }

    path.push(name)

    this._subscribe(this.target, "activated", () =>
      this._onLog(`${path.join(".")}: ON`),
    )
    this._subscribe(this.target, "terminated", () =>
      this._onLog(`${path.join(".")}: OFF`),
    )

    if (
      this.target instanceof booyah.Composite &&
      !(this.target instanceof DebugComposite)
    ) {
      const debugList: DebugComposite[] = []

      this._subscribe(this.target, "beforeActivatedChildChip", (child) => {
        if (child instanceof DebugComposite) return

        const debug = new DebugComposite(child, this._onLog, path, this._ignore)

        debugList.push(debug)

        this._activateChildChip(debug)
      })

      this._subscribe(this.target, "terminatedChildChip", (child) => {
        if (child instanceof DebugComposite) return

        const debug = debugList.find((debug) => debug.target === child)

        if (debug && debug.state === "active") {
          this._terminateChildChip(debug)

          debugList.splice(debugList.indexOf(debug), 1)
        }
      })
    }
  }
}
