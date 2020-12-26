const fs = require('fs').promises;
const parse = require('node-html-parser').parse;

const injectStyle = (template, css) => {
  return `\n<style>${css}</style>\n${template}`;
}

const t = `import { register, html } from 'dot';\n
{{ script }}\n
register({{ name }});\n
export default {{ name }};`;

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
      let result = t
        .replace(/{{ script }}/gi, script.innerText)
        .replace(/{{ name }}/gi, script.getAttribute('name'))
        .replace('// dot:inject', `this.$template = () => html\`${injectedTemplate}\``);
      return result;
    },
  };
};