declare module "pica" {
  const pica: () => {
    resize(
      from: HTMLCanvasElement,
      to: HTMLCanvasElement,
      options?: {
        unsharpAmount?: number;
        unsharpRadius?: number;
        unsharpThreshold?: number;
      }
    ): Promise<HTMLCanvasElement>;
    toBlob(
      canvas: HTMLCanvasElement,
      mimeType?: string,
      quality?: number
    ): Promise<Blob>;
  };

  export default pica;
}
