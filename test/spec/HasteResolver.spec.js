import HasteResolver from '../../src/HasteResolver';
import webpack from 'webpack';
import createConfig from '../fixture/webpack.config';
import path from 'path';
import vm from 'vm';
import fs from 'fs';
import {expect} from 'chai';

const baseConfig = {
  directories: [
    path.join(
      path.dirname(require.resolve('../fixture/webpack.config')),
      'modules'
    ),
  ],
};

const execWebpack = (config) => {
  const compiler = webpack(config);
  return new Promise((resolve) => {
    compiler.run((err, _stats) => {
      expect(err).to.be.null;
      const data = {};
      const sandbox = vm.createContext(data);
      const bin = path.join(config.output.path, config.output.filename);
      const code = fs.readFileSync(bin, 'utf8');
      vm.runInContext(code, sandbox);
      resolve(sandbox);
    });
  });
};

describe('HasteResolver', () => {
  it('should resolve platform specific code', () => {
    const config = createConfig(HasteResolver, {
      ...baseConfig,
      platform: 'ios',
    });
    return execWebpack(config).then((result) => {
      expect(result).to.have.property('result', 'Bananas IOS');
    });
  });

  it('should resolve to fallback without platform specific code', () => {
    const config = createConfig(HasteResolver, {
      ...baseConfig,
      platform: 'android',
    });
    return execWebpack(config).then((result) => {
      expect(result).to.have.property('result', 'Bananas');
    });
  });
});
