import * as esbuild from "esbuild-wasm";
import * as React from "react";
import ReactDOM from "react-dom";

import { unpkgPathPlugin } from "./plugins";

const App: React.FC = () => {
  const ref = React.useRef<esbuild.Service>();
  const [code, setCode] = React.useState<string>("");
  const [input, setInput] = React.useState<string>("");

  const startService = React.useCallback(async () => {
    ref.current = await esbuild.startService({
      worker: true,
      wasmURL: "/esbuild.wasm",
    });
  }, []);

  React.useEffect(() => {
    startService().catch(() => true);
  }, [startService]);

  const submitHandler = async (): Promise<void> => {
    if (!ref.current) {
      return;
    }
    const result = await ref.current?.build({
      entryPoints: ["index.js"],
      bundle: true,
      write: false,
      plugins: [unpkgPathPlugin()],
    });

    setCode(result.outputFiles[0].text);
  };

  return (
    <div>
      <textarea
        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setInput(e.target.value)}
        value={input}
        name="editor"
        id="editor"
        cols={30}
        rows={10}
      />
      <div>
        <button onClick={submitHandler}>submit</button>
      </div>
      <pre>{code}</pre>
    </div>
  );
};

ReactDOM.render(<App />, document.getElementById("root"));
