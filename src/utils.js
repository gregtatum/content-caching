/**
 * @param {TemplateStringsArray} strings
 * @param {any[]} injections
 * @returns {string}
 */
export function sql(strings, ...injections) {
  let text = '';

  for (let i = 0; i < strings.length; i++) {
    const string = strings[i];
    text += string;

    const injection = injections[i];
    if (injection !== undefined) {
      text += injection;
    }
  }

  return text;
}
