import * as esbuild from "esbuild-wasm";

interface UnpkgPlugin {
  name: string;
  setup: (build: esbuild.PluginBuild) => void;
}

export const unpkgPathPlugin = (): UnpkgPlugin => {
  return {
    name: "unpkg-path-plugin",
    setup(build: esbuild.PluginBuild) {
      build.onResolve({ filter: /.*/ }, async (args: esbuild.OnResolveArgs) => {
        console.log("onResole", args);
        return { path: args.path, namespace: "a" };
      });

      build.onLoad({ filter: /.*/ }, async (args: esbuild.OnLoadArgs) => {
        console.log("onLoad", args);

        if (args.path === "index.js") {
          return {
            loader: "jsx",
            contents: `
              import message from 'tiny-test-pkg';
              console.log(message);
            `,
          };
        }
      });
    },
  };
};
