const fs = require('fs').promises;
const parse = require('node-html-parser').parse;

const injectStyle = (template, css) => {
  return `\n<style>${css}</style>\n${template}`;
}

module.exports = function (snowpackConfig, pluginOptions) {
  return {
    name: 'dot-loader',
    resolve: {
      input: ['.dotc'],
      output: ['.js'],
    },
    async load({ filePath }) {
      const code = await fs.readFile(filePath);
      const dom = parse(code);
      const script = dom.querySelector('script');
      const style = dom.querySelector('style');
      const template = dom.querySelector('template');
      if (!script) throw new Error('Component must specify at least a script tag');
      if (!template) throw new Error('Component must specify at least a template tag');

      const injectedTemplate = injectStyle(template.innerHTML, style.innerText);
    
      let result = `import { register, html } from 'dot';
${script.innerText}

register(${script.getAttribute('data-name')});

export default ${script.getAttribute('data-name')};
      `;
      result = result.replace('// dot:inject', `= () => html\`${injectedTemplate}\``)
      return result;
    },
  };
};