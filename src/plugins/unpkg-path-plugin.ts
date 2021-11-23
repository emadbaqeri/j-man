import * as esbuild from "esbuild-wasm";
import axios from "axios";

interface UnpkgPlugin {
  name: string;
  setup: (build: esbuild.PluginBuild) => void;
}

export const unpkgPathPlugin = (): UnpkgPlugin => {
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

      build.onLoad({ filter: /.*/ }, async (args: esbuild.OnLoadArgs) => {
        console.log("onLoad", args);

        if (args.path === "index.js") {
          return {
            loader: "jsx",
            contents: `
              import React from 'react';
              console.log(React)
            `,
          };
        }

        const { data, request } = await axios.get(args.path);
        return {
          loader: "jsx",
          contents: data,
          resolveDir: new URL("./", request.responseURL).pathname,
        };
      });
    },
  };
};
