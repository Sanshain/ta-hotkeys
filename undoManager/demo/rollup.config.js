
import { terser } from "rollup-plugin-terser";
import commonjs from "@rollup/plugin-commonjs";
import resolve from "@rollup/plugin-node-resolve";

// const production = !process.env.ROLLUP_WATCH;
// console.log(process.env);

export default ({
  input: "index.js",
  output: {
    // name: 'actionhandler',
    file: "release/undo-mimic.js",
    format: 'iife',
    sourcemap: true
  },
  plugins: [
    resolve(),
    commonjs(),
    // terser(),
  ],
});