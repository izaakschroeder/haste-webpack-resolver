// @flow
import path from 'path';

const getPlatform = (file) => {
  const match = /\.(ios|android|web|native)\.js$/.exec(file);
  if (match) {
    return match[1];
  }
  return null;
};

const modulesForFile = (fs, options, file) => {
  const {platform} = options;
  return new Promise((resolve, reject) => {
    const filePlatform = getPlatform(file);
    if ((filePlatform && filePlatform !== platform)) {
      resolve([]);
    } else {
      fs.readFile(file, (err, data) => {
        if (err) {
          reject(err);
          return;
        }
        const match = /@providesModule\s+(.*)/.exec(data.toString('utf8'));
        if (match) {
          resolve([{module: match[1], path: file, platform: filePlatform}]);
        } else {
          resolve([]);
        }
      });
    }
  });
};

const walk = (fs, options, entry) => {
  const handleFile = (file) => {
    if (options.blacklist(file)) {
      return Promise.resolve([]);
    }
    return new Promise((resolve, reject) => {
      fs.stat(file, (err, stats) => {
        if (err) {
          reject(err);
        } else if (stats.isDirectory()) {
          walk(fs, options, file).then(resolve, reject);
        } else if (stats.isFile()) {
          if (!/\.js$/.test(file)) {
            resolve([]);
            return;
          }
          modulesForFile(fs, options, file).then(resolve, reject);
        } else {
          reject(new Error('Unknown file type.'));
        }
      });
    });
  };
  return new Promise((resolve, reject) => {
    fs.readdir(entry, function(err, files) {
      if (err) {
        reject(err);
      } else {
        const promises = files.map((file) => {
          return handleFile(path.join(entry, file));
        });
        resolve(Promise.all(promises).then((entries) => {
          return Array.prototype.concat.apply([], entries);
        }));
      }
    });
  });
};

const scan = (fs, options, paths) => {
  return Promise.all(
    paths.map((entry) => walk(fs, options, entry))
  ).then((entries) => {
    const map = {};
    entries.forEach((entry) => {
      entry.forEach(({module, path, platform}) => {
        if (!map[module] || platform) {
          map[module] = path;
        }
      });
    });
    return map;
  });
};

type Options = {
  directories: Array<string>,
  platform: 'ios' | 'android' | 'web',
  blacklist: (path: string) => boolean,
}

export default class HasteResolver {
  directories: Array<string>;
  options: {
    platform: 'ios' | 'android' | 'web';
    blacklist: (path: string) => boolean;
  }

  constructor({
    directories,
    platform,
    blacklist = (file) => {
      const name = path.basename(file);
      return [
        'node_modules',
        '__tests__',
        '__mocks__',
        '__fixtures__',
        'react-packager',
        'androidTest',
      ].indexOf(name) >= 0;
    },
  }: Options) {
    this.directories = directories;
    this.options = {
      blacklist,
      platform,
    };
  }

  apply(resolver: any) {
    const modules = scan(resolver.fileSystem, this.options, this.directories);

    resolver.plugin('described-resolve', (request, callback) => {
      const innerRequest = request.request;
      modules.then((map) => {
        const result = map[innerRequest];

        if (!innerRequest || !result) {
          return callback();
        }
        const resolved = {
          ...request,
          request: result,
        };
        return resolver.doResolve(
          'resolve',
          resolved,
          `Aliased ${innerRequest} to haste mapping: ${result}`,
          callback
        );
      }, callback);
    });
  }
}
