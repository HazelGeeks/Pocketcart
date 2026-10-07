const fs = require("node:fs");
const vm = require("node:vm");
const ts = require("typescript");

exports.sourceModule = function sourceModule(path, dependencies, globals = {}) {
  const exports = {};
  vm.runInNewContext(
    ts.transpileModule(fs.readFileSync(path, "utf8"), {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
        esModuleInterop: true,
        jsx: ts.JsxEmit.React,
      },
    }).outputText,
    {
      ...globals,
      exports,
      React: dependencies.react,
      require(name) {
        if (Object.hasOwn(dependencies, name)) return dependencies[name];
        throw Error(`Unexpected dependency: ${name}`);
      },
    },
  );
  return exports;
};
