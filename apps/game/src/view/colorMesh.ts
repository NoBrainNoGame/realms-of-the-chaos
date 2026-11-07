import { Buffer, BufferUsage, Geometry, GlProgram, Mesh, Shader } from "pixi.js"

const VERTEX = `
in vec2 aPosition;
in vec4 aColor;
uniform mat3 uProjectionMatrix;
uniform mat3 uWorldTransformMatrix;
uniform mat3 uTransformMatrix;
out vec4 vColor;
void main() {
  mat3 m = uProjectionMatrix * uWorldTransformMatrix * uTransformMatrix;
  gl_Position = vec4((m * vec3(aPosition, 1.0)).xy, 0.0, 1.0);
  vColor = aColor;
}`

const FRAGMENT = `
in vec4 vColor;
uniform vec4 uColor;
out vec4 finalColor;
void main() {
  finalColor = vec4(vColor.rgb * vColor.a, vColor.a) * uColor;
}`

let program: GlProgram | null = null

/**
 * A flat-shaded mesh with a colour and an alpha per vertex, rewritten
 * without allocating: fixed topology (shared index buffer), positions and
 * colours in preallocated arrays. Triangles must not overlap: the alpha is
 * baked in the vertices (no group made translucent as a whole).
 */
export class ColorMesh extends Mesh<Geometry, Shader> {
  positions: Float32Array
  /** RGBA bytes, four per vertex (alpha not premultiplied). */
  colors: Uint8Array
  /** Triangle list (indices past `usedIndices` are zero: degenerate). */
  indices: Uint32Array
  usedVertices = 0
  usedIndices = 0
  private readonly _vertexBuffer: Buffer
  private readonly _colorBuffer: Buffer
  private readonly _indexBuffer: Buffer

  constructor(vertices: number, indices: number) {
    const positions = new Float32Array(vertices * 2)
    const colors = new Uint8Array(vertices * 4)
    const triangles = new Uint32Array(indices)
    const vertexBuffer = new Buffer({
      data: positions,
      usage: BufferUsage.VERTEX | BufferUsage.COPY_DST,
    })
    const colorBuffer = new Buffer({
      data: colors,
      usage: BufferUsage.VERTEX | BufferUsage.COPY_DST,
    })
    const indexBuffer = new Buffer({
      data: triangles,
      usage: BufferUsage.INDEX | BufferUsage.COPY_DST,
    })
    const geometry = new Geometry({
      attributes: {
        aPosition: { buffer: vertexBuffer, format: "float32x2" },
        aColor: { buffer: colorBuffer, format: "unorm8x4" },
      },
      indexBuffer,
    })
    program ??= GlProgram.from({
      vertex: VERTEX,
      fragment: FRAGMENT,
      name: "color-mesh",
    })
    super({
      geometry,
      shader: new Shader({ glProgram: program, resources: {} }),
    })
    this.positions = positions
    this.colors = colors
    this.indices = triangles
    this._vertexBuffer = vertexBuffer
    this._colorBuffer = colorBuffer
    this._indexBuffer = indexBuffer
    this.eventMode = "none"
  }

  /** Room for at least this many vertices and indices (keeps what is written). */
  ensure(vertices: number, indices: number) {
    if (vertices * 2 > this.positions.length) {
      const size = Math.max(vertices, (this.positions.length / 2) * 2)
      const positions = new Float32Array(size * 2)
      positions.set(this.positions)
      const colors = new Uint8Array(size * 4)
      colors.set(this.colors)
      this.positions = positions
      this.colors = colors
      this._vertexBuffer.data = positions
      this._colorBuffer.data = colors
    }
    if (indices > this.indices.length) {
      const triangles = new Uint32Array(
        Math.max(indices, this.indices.length * 2),
      )
      triangles.set(this.indices)
      this.indices = triangles
      this._indexBuffer.data = triangles
    }
  }

  /** Uploads what was written (the first `usedVertices` and `usedIndices`). */
  commit(prevIndices = this.usedIndices) {
    for (let i = this.usedIndices; i < prevIndices; i++) this.indices[i] = 0
    this._vertexBuffer.update(this.usedVertices * 8)
    this._colorBuffer.update(this.usedVertices * 4)
    this._indexBuffer.update(Math.max(prevIndices, this.usedIndices) * 4)
  }

  /** Writes one vertex colour. */
  setColor(vertex: number, rgb: number, alpha: number) {
    const c = this.colors
    const o = vertex * 4
    c[o] = (rgb >> 16) & 255
    c[o + 1] = (rgb >> 8) & 255
    c[o + 2] = rgb & 255
    c[o + 3] = Math.round(Math.max(0, Math.min(1, alpha)) * 255)
  }
}
