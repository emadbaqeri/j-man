import * as esbuild from "esbuild-wasm";
import axios from "axios";
import * as localforage from "localforage";

const fileCache = localforage.createInstance({
  name: "fileCache",
});

interface UnpkgPlugin {
  name: string;
  setup: (build: esbuild.PluginBuild) => void;
}

export const unpkgPathPlugin = (inputCode: string): UnpkgPlugin => {
  return {
    name: "unpkg-path-plugin",
    setup(build: esbuild.PluginBuild) {
      build.onResolve(
        { filter: /.*/ },
        async (args: esbuild.OnResolveArgs): Promise<{ path: string; namespace: string }> => {
          console.log("onResole", args);
          if (args.path === "index.js") {
            return { path: args.path, namespace: "a" };
          }

          if (args.path.includes("./") || args.path.includes("../")) {
            return {
              namespace: "a",
              path: new URL(args.path, "https://unpkg.com" + args.resolveDir + "/").href,
            };
          }

          return {
            namespace: "a",
            path: `https://unpkg.com/${args.path}`,
          };
        }
      );

      build.onLoad({ filter: /.*/ }, async (args: esbuild.OnLoadArgs): Promise<esbuild.OnLoadResult> => {
        console.log("onLoad", args);

        if (args.path === "index.js") {
          return {
            loader: "jsx",
            contents: inputCode,
          };
        }

        // 1. check to see if we have already fetched the file
        // 2. if it is return in immediately
        const cachedResult = await fileCache.getItem<esbuild.OnLoadResult>(args.path);
        if (cachedResult) {
          return cachedResult;
        }

        const { data, request } = await axios.get(args.path);
        // 3. once we got the response we are going to store response in the cache

        const result: esbuild.OnLoadResult = {
          loader: "jsx",
          contents: data,
          resolveDir: new URL("./", request.responseURL).pathname,
        };

        await fileCache.setItem(args.path, result);

        return result;
      });
    },
  };
};
