module.exports = {
  /**
   * Transforms SVG file content for Jest testing.
   *
   * @param {string} src - The source SVG content.
   * @returns {{ code: string }} The transformed module code.
   */
  process(src) {
    return {
      code: `module.exports = ${JSON.stringify(src)};`,
    };
  },
};
