import path from 'path';

const getPlatform = (file) => {
  const match = /\.(ios|android|web)\.js$/.exec(file);
  if (match) {
    return match[1];
  }
  return null;
};

const modulesForFile = (fs, options, file) => {
  const {blacklist, target} = options;
  return new Promise((resolve, reject) => {
    if (!/\.js$/.test(file)) {
      resolve([]);
    } else {
      const platform = getPlatform(file);
      if (blacklist.test(file) || (platform && platform !== target)) {
        resolve([]);
      } else {
        fs.readFile(file, (err, data) => {
          if (err) {
            reject(err);
            return;
          }

          const match = /@providesModule\s+(.*)\n/.exec(data.toString('utf8'));
          if (match) {
            resolve([{module: match[1], path: file}]);
          } else {
            resolve([]);
          }
        });
      }
    }
  });
};

const handleFile = (fs, options, file) => {
  return new Promise((resolve, reject) => {
    fs.stat(file, (err, stats) => {
      if (err) {
        reject(err);
      } else if (stats.isDirectory()) {
        const name = path.basename(file);
        if (name === '__test__' || name === '__mock__') {
          resolve([]);
        } else {
          resolve(walk(fs, options, file));
        }
      } else if (stats.isFile()) {
        resolve(modulesForFile(fs, options, file));
      } else {
        reject(new Error('Unknown file type.'));
      }
    });
  });
};

const walk = (fs, options, entry) => {
  return new Promise((resolve, reject) => {
    fs.readdir(entry, function(err, files) {
      if (err) {
        reject(err);
      } else {
        const promises = files.map((file) => {
          return handleFile(fs, options, path.join(entry, file));
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
    return Array.prototype.concat.apply([], entries);
  });
};

export default class HasteWebpackPlugin {
  constructor({paths, target, blacklist}) {
    this.paths = paths;
    this.target = target;
    this.blacklist = blacklist;
  }

  apply(compiler) {
    const options = {
      blacklist: this.blacklist(this.platform),
      target: this.target,
    };

    compiler.plugin('normal-module-factory', (factory) => {
      const fs = factory.resolvers.normal.fileSystem;
      const modules = scan(fs, options, this.paths).then((entries) => {
        const modules = { };
        entries.forEach(({module, path}) => {
          modules[module] = path;
        });
        return modules;
      });

      factory.plugin('before-resolve', function(result, callback) {
        modules.then((modules) => {
          if (result.request in modules) {
            result.request = modules[result.request];
          }
          callback(null, result);
        }, callback);
      });
    });
  }
}
