const path = require('path');

module.exports = function(HasteResolver, options) {
  return {
    entry: path.join(__dirname, 'main.js'),
    output: {
      path: path.join(__dirname, 'dist'),
      filename: 'test.js',
    },
    resolve: {
      plugins: [
        new HasteResolver(options),
      ],
    },
  };
};
