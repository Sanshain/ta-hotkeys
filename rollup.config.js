import { uglify } from "rollup-plugin-uglify";
import babel from 'rollup-plugin-babel';


export default {
    input: 'editor__tools.js',
    output: {
      file: '__release__/hotkeys.js',
      format: 'iife',
      name: 'hokInit',
      strict: false,
      sourcemap: true
    },
    plugins: [
        babel({
            exclude: 'node_modules/**',
            presets: [
              [
                '@babel/env',
                {
                  modules: false,
                  targets: {
                    browsers: 'IE 11',                    
                  },                  
                }
              ]
            ]
          }),
        uglify()
    ]
  };