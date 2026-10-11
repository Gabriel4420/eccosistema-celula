'use strict';

const utils = require('./utils');
const { MAX_DEPTH } = require('./constants');

module.exports = (ast, options = {}) => {
  const maxDepth = typeof options.maxDepth === 'number' ? Math.min(MAX_DEPTH, options.maxDepth) : MAX_DEPTH;

  const stringify = (node, parent = {}, depth = 0) => {
    if (depth > maxDepth) {
      throw new RangeError(`AST nesting depth (${depth}), exceeds max depth (${maxDepth})`);
    }

    const invalidBlock = options.escapeInvalid && utils.isInvalidBrace(parent);
    const invalidNode = node.invalid === true && options.escapeInvalid === true;
    let output = '';

    if (node.value) {
      if ((invalidBlock || invalidNode) && utils.isOpenOrClose(node)) {
        return '\\' + node.value;
      }
      return node.value;
    }

    if (node.value) {
      return node.value;
    }

    if (node.nodes) {
      for (const child of node.nodes) {
        output += stringify(child, {}, depth + 1);
      }
    }
    return output;
  };

  return stringify(ast);
};

