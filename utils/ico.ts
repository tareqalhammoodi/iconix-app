export async function createIcoFromPngs(
  pngs: { size: number; blob: Blob }[]
): Promise<Blob> {
  const entries = await Promise.all(
    pngs.map(async (png) => {
      const buffer = await png.blob.arrayBuffer();
      return { size: png.size, buffer: new Uint8Array(buffer) };
    })
  );

  const headerSize = 6;
  const dirEntrySize = 16;
  const imageOffsetStart = headerSize + dirEntrySize * entries.length;

  let offset = imageOffsetStart;
  const buffers: Uint8Array[] = [];

  const header = new Uint8Array(headerSize);
  header[0] = 0;
  header[1] = 0;
  header[2] = 1;
  header[3] = 0;
  header[4] = entries.length;
  header[5] = 0;
  buffers.push(header);

  const dirTable = new Uint8Array(dirEntrySize * entries.length);
  entries.forEach((entry, index) => {
    const width = entry.size >= 256 ? 0 : entry.size;
    const height = entry.size >= 256 ? 0 : entry.size;
    const bytes = entry.buffer.length;
    const base = index * dirEntrySize;

    dirTable[base + 0] = width;
    dirTable[base + 1] = height;
    dirTable[base + 2] = 0;
    dirTable[base + 3] = 0;
    dirTable[base + 4] = 1;
    dirTable[base + 5] = 0;
    dirTable[base + 6] = 32;
    dirTable[base + 7] = 0;

    dirTable[base + 8] = bytes & 0xff;
    dirTable[base + 9] = (bytes >> 8) & 0xff;
    dirTable[base + 10] = (bytes >> 16) & 0xff;
    dirTable[base + 11] = (bytes >> 24) & 0xff;

    dirTable[base + 12] = offset & 0xff;
    dirTable[base + 13] = (offset >> 8) & 0xff;
    dirTable[base + 14] = (offset >> 16) & 0xff;
    dirTable[base + 15] = (offset >> 24) & 0xff;

    offset += bytes;
  });

  buffers.push(dirTable);
  entries.forEach((entry) => buffers.push(entry.buffer));

  const totalLength = buffers.reduce((sum, chunk) => sum + chunk.length, 0);
  const ico = new Uint8Array(totalLength);
  let cursor = 0;
  buffers.forEach((chunk) => {
    ico.set(chunk, cursor);
    cursor += chunk.length;
  });

  return new Blob([ico], { type: "image/x-icon" });
}
