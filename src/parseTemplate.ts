/**
 * Finds references to state variables either in attributes or content. Inserts elements and adds attributes that make the data dependency explicit.
 * 
 * @param {string} template - An HTML string with references to state variables, e.g., <div>{{stateVariable}}</div>
 */

export function parseTemplate(template: string, state: Record<string, any>): string {
  let parsedTemplate = template
  const attrReferenceRegex = /[a-zA-Z-]*="{{[^}}]*}}"/gm  // Detects things like 'attribute="{{stateVariable}}"'
                                                          // Not totally foolproof, but what are the odds the content of an element matches this?                                                          
  template.match(attrReferenceRegex)?.forEach(ref => {
    const [attr, variableRef] = ref.split("=")
    const variableName = variableRef.replace('"{{', "").replace('}}"', "")
    const replacement = `has-lfdeps lfdep-${attr}-${variableName} ${attr}="${state[variableName] ?? ''}"` // Results in stuff like '<img lfdep-src-imageSource src="{{imageSource}}" />
    parsedTemplate = parsedTemplate.replace(ref, replacement)
  })

  const contentReferenceRegex = /{{[^}}]*}}/gm  // Detects things like '<div>Here's a value: {{stateVariable}}</div>
  template.match(contentReferenceRegex)?.forEach(ref => {
    const variableName = ref.replace("{{", "").replace("}}", "")
    const replacement = `<span has-lfdeps lfdep--${variableName}>${state[variableName] ?? ""}</span>` // Results in stuff like '<div>Look, a value: <span lfdep--stateVariable>{{stateVariable}}</span>
    parsedTemplate = parsedTemplate.replace(ref, replacement)
  });
  return parsedTemplate
}