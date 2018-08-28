const hasAnsi = require("has-ansi");
const stripAnsi = require("strip-ansi");

module.exports = {
  test: value => typeof value === "string" && hasAnsi(value),
  print: (value, serialize) => serialize( stripAnsi(value)),
};
