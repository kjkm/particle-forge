export function Square(squareSize) {
    const tris = new Float32Array([
      -squareSize, -squareSize, squareSize, -squareSize, squareSize, squareSize, -squareSize, -squareSize, squareSize, squareSize, -squareSize, squareSize,
    ]);
    return tris;
}