const fs = require('fs').promises;
const parse = require('node-html-parser').parse;
const sass = require('sass');

const injectStyle = (template, css) => {
  return `\n<style>${css}</style>\n${template}`;
}

const t = `import { register, html } from 'dot';\n
{{ dot:script }}\n
register({{ dot:name }});\n
export default {{ dot:name }};`;

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

      // Compile the style if necessary
      let compiledStyle;
      if (style.getAttribute('lang') === 'sass') {
        const sassCode = style.innerText;
        compiledStyle = sass.renderSync({ data: sassCode });
      } else {
        compiledStyle = style.innerText;
      }

      // Inject style in the template and complete the template
      const injectedTemplate = injectStyle(template.innerHTML, compiledStyle);    
      let result = t
        .replace(/{{ dot:script }}/gi, script.innerText)
        .replace(/{{ dot:name }}/gi, script.getAttribute('name'))
        .replace('// dot:template', `this.$template = () => html\`${injectedTemplate}\``);
      return result;
    },
  };
};