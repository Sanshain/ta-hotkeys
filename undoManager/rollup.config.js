
import { terser } from "rollup-plugin-terser";

export default ({
  input: "initialize.js",
  output: {
    file: "release/undo-mimic.js",
    format: 'iife',
    name: 'actionhandler'
  },
  plugins: [terser()],
});