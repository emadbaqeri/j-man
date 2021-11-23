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

  const codeChangeHandler = React.useCallback((event: React.ChangeEvent<HTMLTextAreaElement>): void => {
    setInput(event.target.value);
  }, []);

  const submitHandler = React.useCallback(async (): Promise<void> => {
    if (!ref.current) {
      return;
    }
    const result = await ref.current?.build({
      entryPoints: ["index.js"],
      bundle: true,
      write: false,
      plugins: [unpkgPathPlugin()],
      define: {
        "process.env.NODE_ENV": '"production"',
        global: "window",
      },
    });

    setCode(result.outputFiles[0].text);
  }, []);

  return (
    <div>
      <textarea cols={30} id="editor" name="editor" onChange={codeChangeHandler} rows={10} value={input} />
      <div>
        <button onClick={submitHandler} type="submit">
          {`submit`}
        </button>
      </div>
      <pre>{code}</pre>
    </div>
  );
};

ReactDOM.render(<App />, document.getElementById("root"));
