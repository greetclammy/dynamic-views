declare module "colorthief" {
  export default class ColorThief {
    /**
     * Extract dominant color from image
     * @throws {Error} On CORS issues, invalid images, or canvas access failures
     */
    getColor(img: HTMLImageElement, quality?: number): [number, number, number];
    /**
     * Extract color palette from image
     * @throws {Error} On CORS issues, invalid images, or canvas access failures
     */
    getPalette(
      img: HTMLImageElement,
      colorCount?: number,
      quality?: number,
    ): [number, number, number][];
  }
}
