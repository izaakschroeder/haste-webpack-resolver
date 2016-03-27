# haste-webpack-plugin

Use Facebook's haste module system with webpack.

```
import blacklist from 'react-native/packager/blacklist';

{
  plugins: [
    new HasteWebpackPlugin({
      blacklist,
      target: 'ios',
      paths: [
        path.resolve('node_modules/react-native/Libraries'),
        path.resolve('node_modules/react/lib/'),
      ],
    })
  ]
}
```
