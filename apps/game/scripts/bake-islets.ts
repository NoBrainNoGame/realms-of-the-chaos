/**
 * Bakes the distant islets of the backdrop: `bun run bake:islets` draws a
 * few varied islands with the board's own block drawing, fully opaque, and
 * writes them to assets/islets/islet-N.png (transparent only around them).
 */
import { chromium } from "playwright-core"
import page from "./bake-islets.html"
import { ISLET_VIEWS, isletFile } from "./islets"

const out = new URL("../assets/islets/", import.meta.url).pathname
const server = Bun.serve({ port: 0, routes: { "/": page } })
const executablePath = process.env.CHROMIUM_PATH || undefined
const browser = await chromium.launch({
  executablePath,
  args: [
    "--use-gl=angle",
    "--use-angle=swiftshader",
    "--enable-unsafe-swiftshader",
  ],
})
try {
  const tab = await browser.newPage()
  tab.on("pageerror", (e) => console.error("page error:", e.message))
  await tab.goto(server.url.href)
  await tab.waitForFunction(() => "bake" in window)
  await Bun.$`mkdir -p ${out}`
  for (const [view, { pitch }] of ISLET_VIEWS.entries()) {
    const { urls, bounds, width, height } = await tab.evaluate(
      (v) =>
        (window as unknown as { bake: (v: number) => Promise<never> }).bake(v),
      view,
    )
    for (const [i, url] of (urls as string[]).entries()) {
      const [x0, y0, x1, y1] = bounds[i]
      if (x0 < 0 || y0 < 0 || x1 > width || y1 > height)
        throw new Error(
          `islet ${i} at ${pitch} overflows its canvas: ${bounds[i]} in ${width}x${height}`,
        )
      const bytes = Buffer.from(url.split(",")[1], "base64")
      await Bun.write(`${out}${isletFile(i, pitch)}`, bytes)
      console.log(
        isletFile(i, pitch),
        bytes.length,
        "bytes",
        bounds[i].map(Math.round),
      )
    }
  }
} finally {
  await browser.close()
  await server.stop()
}
