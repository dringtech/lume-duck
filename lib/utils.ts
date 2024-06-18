/**
 * Utility function to transpose a 2D matrix.
 *
 * @param matrix Input matrix
 * @returns Transposed matrix
 */
export const transpose = <T>(matrix: T[][]) =>
  matrix[0].map((_outer, i) => matrix.map((inner) => inner[i]));
