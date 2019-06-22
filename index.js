/* eslint-env node */

const BasePlugin = require('ember-cli-deploy-plugin');
const fs = require('fs');

module.exports = {
  name: require('./package').name,

  createDeployPlugin(options) {
    const Plugin = BasePlugin.extend({
      name: options.name,

      defaultConfig: {
        urlTagKey: '/MOUNT_POINT',
        indexFileName: 'index.html',
        cloudfrontDomain: 'testing123',
        assetPrefix: 'ember',
        distDir: function (context) {
          return context.distDir;
        },
      },

      // Perform at first stage of deploy
      didBuild(context) {
        const rootPath = context.project.root;
        const distDir = this.readConfig('distDir');
        const indexFileName = this.readConfig('indexFileName');
        const filePath = [rootPath, distDir, indexFileName].join('/');

        this.log(`Opening index file: ${ filePath }`, { verbose: true });
        const data = fs.readFileSync(filePath);

        if (!data) {
          throw new Error(`Error reading file: ${ filePath }`);
        }

        const rawBody = data.toString();
        const reWrittenBody = this._rewriteBody(rawBody);

        this.log(`Writing index file: ${filePath}`, { verbose: true });
        fs.writeFileSync(filePath, reWrittenBody);
      },

      _rewriteBody(body) {
        const urlTagKey = this.readConfig('urlTagKey');
        const cloudfrontDomain = this.readConfig('cloudfrontDomain');
        const assetPrefix = this.readConfig('assetPrefix');
        const tagAsRegex = new RegExp(urlTagKey, 'g');

        if (!cloudfrontDomain) {
          throw new Error('Error: no cloudfront domain is set');
        }

        if (!body || body === '')
          return '';

        const urlBase = `https://${ cloudfrontDomain }.cloudfront.net/${ assetPrefix }`;

        this.log(`Rewriting URLs with pattern ${ tagAsRegex } with ${ urlBase }...`, { verbose: true });

        return body.replace(tagAsRegex, urlBase);
      }
    });

    return new Plugin;
  },
};
