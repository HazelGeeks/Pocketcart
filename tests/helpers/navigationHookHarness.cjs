const fs = require("node:fs");
const vm = require("node:vm");
const ts = require("typescript");

exports.navigationHookHarness = function navigationHookHarness() {
  return require("./hookHarness.cjs").hookHarness((react) => {
    const mod = { exports: {} };
    const native = {
      Platform: { OS: "ios" },
      Animated: {
        Value: class {
          constructor(value) {
            this.value = value;
          }
          setValue(value) {
            this.value = value;
          }
        },
        spring: (value) => ({
          start() {
            value.setValue(0);
          },
        }),
        timing: () => ({
          start(fn) {
            fn({ finished: true });
          },
        }),
      },
      PanResponder: { create: (handlers) => ({ panHandlers: handlers }) },
    };
    vm.runInNewContext(
      ts.transpileModule(fs.readFileSync("src/hooks/useNativeBackNavigation.ts", "utf8"), {
        compilerOptions: {
          module: ts.ModuleKind.CommonJS,
          target: ts.ScriptTarget.ES2022,
          esModuleInterop: true,
        },
      }).outputText,
      {
        exports: mod.exports,
        require(name) {
          if (name === "react") return react;
          if (name === "react-native") return native;
          if (name === "../shared/features") return require("../../.tmp-tests/shared/features.js");
          if (name === "./useScopedState")
            return require("./sourceModule.cjs").sourceModule("src/hooks/useScopedState.ts", { react });
          if (name.includes("nativeBackNavigation"))
            return require("../../.tmp-tests/utils/nativeBackNavigation.js");
          throw Error(name);
        },
      },
    );
    return mod.exports.default;
  });
};
