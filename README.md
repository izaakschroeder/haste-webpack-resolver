# haste-webpack-resolver

Use Facebook's haste module system with [webpack].

![build status](http://img.shields.io/travis/izaakschroeder/haste-webpack-resolver/master.svg?style=flat)
![coverage](https://img.shields.io/codecov/c/github/izaakschroeder/haste-webpack-resolver/master.svg?style=flat)
![license](http://img.shields.io/npm/l/haste-webpack-resolver.svg?style=flat)
![version](http://img.shields.io/npm/v/haste-webpack-resolver.svg?style=flat)
![downloads](http://img.shields.io/npm/dm/haste-webpack-resolver.svg?style=flat)

Usage:

```js
module.exports = {
  // ...
  resolve: {
    plugins: [
      new HasteResolver({
        platform: 'ios',
        directories: ['node_modules/react-native'],
        blacklist: (_path) => {
          return false;
        },
      }),
    ],
  },
};
```

Inspired by a lot of the work done in [haul].

[haul]: https://github.com/callstack/haul
[webpack]: https://webpack.js.org/
