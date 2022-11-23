import { protocol } from "electron";
import path from "node:path";
import { readFile } from "node:fs";
import { URL } from "node:url";

export default (scheme: string, serverPath = __dirname) => {
  protocol.registerBufferProtocol(scheme, (request, respond) => {
    let pathName = new URL(request.url).pathname;
    pathName = decodeURI(pathName); // Needed in case URL contains spaces
    readFile(path.join(serverPath, pathName), (error, data) => {
      if (error) {
        console.error(
          `Failed to read ${pathName} on ${scheme} protocol`,
          error,
        );
      }
      const extension = path.extname(pathName).toLowerCase();
      let mimeType = "";

      if (extension === ".js") {
        mimeType = "text/javascript";
      } else if (extension === ".html") {
        mimeType = "text/html";
      } else if (extension === ".css") {
        mimeType = "text/css";
      } else if (extension === ".svg" || extension === ".svgz") {
        mimeType = "image/svg+xml";
      } else if (extension === ".json") {
        mimeType = "application/json";
      } else if (extension === ".wasm") {
        mimeType = "application/wasm";
      }
      respond({ mimeType, data });
    });
  });
};
