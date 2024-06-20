/**
 * Provisioner utility to download DuckDB library for the current system.
 * 
 * This will detect the system using `Deno.build` and extract the correct
 * library from the release zip file to the current directory.
 * 
 * It can be run on the command line
 * 
 * ```sh
 * deno run --allow-read --allow-write --allow-net jsr:@dringtech/lume-duck/provisioner
 * ```
 * 
 * @example
 * 
 * It also exports the {@link provisioner} function which can be used in a script.
 * 
 * ```typescript
 * import provisioner from "jsr:@dringtech/lume-duck/provisioner";
 * 
 * await provisioner();
 * ```
 */
import { exists } from "jsr:@std/fs@0.229.3";
import { ZipReader } from "jsr:@zip-js/zip-js@2.7.45";

const DUCK_RELEASE =
  "https://github.com/duckdb/duckdb/releases/download/v1.0.0";

/**
 * A function to extract a file from a zip.
 *
 * @param url Source URL for zip file
 * @param localPath Local file to save to - assumed to be same a path if omitted
 * @returns ReadableStream of the contents of the file
 */
async function extract(url: string, path: string): Promise<ReadableStream> {
  // Get the url
  const response = await fetch(url);

  // Create zip reader
  const zip = new ZipReader(response.body!);

  // Locate the library in the zip file
  const library = (await zip.getEntries()).find((e) => e.filename === path);
  if (!library) {
    console.error("Library not found in stream");
    throw new Error(`${library} not found in ${url}`);
  }

  // Unpack the library from the zip file
  const extractStream = new TransformStream();
  library.getData!(extractStream.writable);

  return extractStream.readable;
}

/**
 * Core provisioner which extracts a specified file from the zip file
 *
 * @param library Library filename
 * @param url Source url for ZIP file
 */
async function provision(library: string, url: string): Promise<void> {
  if (await exists(library, { isFile: true })) return;
  console.info("DuckDB Library not found, provisioning!");
  await Deno.writeFile(library, await extract(url, library));
  console.info(`Downloaded ${library}`);
}

async function provisionWindows() {
  await provision(
    "duckdb.dll",
    `${DUCK_RELEASE}/libduckdb-windows-amd64.zip`,
  );
}

async function provisionMacos() {
  await provision(
    "libduckdb.dylib",
    `${DUCK_RELEASE}/libduckdb-osx-universal.zip`,
  );
}

async function provisionLinux() {
  switch (Deno.build.arch) {
    case "x86_64":
      await provision(
        "libduckdb.so",
        `${DUCK_RELEASE}/libduckdb-linux-amd64.zip`,
      );
      break;
    case "aarch64":
      await provision(
        "libduckdb.so",
        `${DUCK_RELEASE}/libduckdb-linux-aarch64.zip`,
      );
      break;
    default:
      throw new Error("Unknown linux architecture");
  }
}

/**
 * Provisioning wrapper function which selects the appropriate provisioning function.
 */
export default async function provisioner() {
  switch (Deno.build.os) {
    case "windows":
      await provisionWindows();
      break;
    case "darwin":
      await provisionMacos();
      break;
    case "linux":
      await provisionLinux();
      break;
    default:
      console.log(
        "Unkownn platform - download manually from https://duckdb.org/docs/installation/index",
      );
      break;
  }
}

/**
 * Code to be called if this is the entrypoint
 */
if (import.meta.main) {
  await provisioner();
}
