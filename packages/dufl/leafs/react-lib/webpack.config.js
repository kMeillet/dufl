'use strict';

const path = require('path');
const CaseSensitivePathsPlugin = require('case-sensitive-paths-webpack-plugin');
const ModuleScopePlugin = require('react-dev-utils/ModuleScopePlugin');
const ModuleNotFoundPlugin = require('react-dev-utils/ModuleNotFoundPlugin');
const PeerDepsExternalsPlugin = require('peer-deps-externals-webpack-plugin');
const { DefinePlugin } = require('webpack');

const shouldUseSourceMap = false;

module.exports = ({
  paths,
  alias,
  env,
  output,
  helpers: { eslint, terser },
}) => {
  const isProd = env.raw.NODE_ENV === 'production';
  const isDev = env.raw.NODE_ENV === 'development';
  const sourcemaps = {
    production: 'source-map',
    development: 'cheap-module-source-map',
  };
  const sourcemap = sourcemaps[env.raw.NODE_ENV];

  return {
    performance: false,
    mode: env.raw.NODE_ENV,
    bail: isProd,
    devtool: shouldUseSourceMap ? sourcemap : false,
    entry: [paths.appIndexJs],
    output: {
      pathinfo: isDev,
      libraryTarget: 'commonjs2',
      path: paths.appBuild,
      filename: `${output}.js`,
      // Point sourcemap entries to original disk location (format as URL on Windows).
      devtoolModuleFilenameTemplate: isProd
        ? info =>
            path
              .relative(paths.appSrc, info.absoluteResourcePath)
              .replace(/\\/g, '/')
        : isDev &&
          (info => path.resolve(info.absoluteResourcePath).replace(/\\/g, '/')),
    },
    optimization: {
      minimize: isProd,
      minimizer: [terser({ shouldUseSourceMap })],
    },
    resolve: {
      alias,
      plugins: [new ModuleScopePlugin(paths.appSrc, [paths.appPackageJson])],
      extensions: ['.mjs', '.js', '.json'],
    },
    module: {
      strictExportPresence: true,
      rules: [
        { parser: { requireEnsure: false } },
        eslint({ appSrc: paths.appSrc }),
        {
          oneOf: [
            {
              test: /\.(js|mjs)$/,
              include: paths.appSrc,
              loader: require.resolve('babel-loader'),
              options: {
                customize: require.resolve(
                  'babel-preset-dufl/webpack-overrides',
                ),
                presets: [
                  [
                    require.resolve('babel-preset-dufl'),
                    { platform: 'web', emotion: true },
                  ],
                ],
                babelrc: false,
                configFile: false,
                cacheDirectory: true,
                cacheCompression: isProd,
                compact: isProd,
              },
            },
            {
              test: /\.(js|mjs)$/,
              exclude: /@babel(?:\/|\\{1,2})runtime/,
              loader: require.resolve('babel-loader'),
              options: {
                presets: [
                  [
                    require.resolve('babel-preset-dufl/dependencies'),
                    { helpers: true },
                  ],
                ],
                babelrc: false,
                configFile: false,
                cacheDirectory: true,
                cacheCompression: isProd,
                compact: false,
                sourceMaps: false,
              },
            },
          ],
        },
      ],
    },
    plugins: [
      new PeerDepsExternalsPlugin(),
      new ModuleNotFoundPlugin(paths.appPath),
      new CaseSensitivePathsPlugin(),
      new DefinePlugin(env.stringified),
    ],
    node: {
      dgram: 'empty',
      fs: 'empty',
      net: 'empty',
      tls: 'empty',
      child_process: 'empty',
    },
  };
};
