import type { ILilComponentProps, IState } from "./types";

import { stateObject } from "./stateObject";
import { parseTemplate } from "./parseTemplate";

type Dependency = Record<string, Array<any>>
export function lilComponent({ name, template, data = {}, hooks = {}, handlers = {} }: ILilComponentProps) {
  getImplicitVariables(template, hooks).forEach((stateVariable) => {
    data[stateVariable] = data[stateVariable] ?? "";
  });

  data.mounted ||= "false"

  // Store list of state variables so we don't need to recompute it
  data._stateVars = Object.keys(data);


  // Process template string so it can be updated in place instead of doing a full re-render
  template = parseTemplate(template, data);

  // Generate a class that manages internal state and re-rendering
  const LilComponentClass = class extends HTMLElement {
    state?: Record<string, any>
    handlers?: Record<string, Function>
    dependencyTree?: Dependency
    static get observedAttributes() {
      return data._stateVars.map((v: string) => v.toLowerCase());
    }
    constructor() {
      super();
    }
    connectedCallback() {
      this.innerHTML = template;
      this.addListeners();
      this.dependencyTree = this.parseDependencies();
      const _hooks = { ...hooks, ...this.getRenderHooks({ data, hooks })}
      this.state = stateObject(this, { data, hooks: _hooks });
      this.handlers = handlers
      // Update state variables based on attributes
      try {
        this.state._stateVars.forEach((stateVariable: string) => {
          if (this.hasAttribute(stateVariable) || stateVariable === "mounted") {
            if (this.state) {
              this.state[stateVariable] = stateVariable !== "mounted" ? this.getAttribute(stateVariable) : "true";
            }
          }
        });
      } catch (_) {}
    }
    attributeChangedCallback(name: string, oldValue: any, newValue: any) {
      if (!this.state) {
        return
      }
      const variable = data._stateVars.find((v: string) => v.toLowerCase() === name)
      this.state[variable] = newValue;
    }
    parseDependencies() {
      const dependencyTree: Record<string, Array<any>> = {};
      this.querySelectorAll("[has-lfdeps]").forEach((el) => {
        // TODO: Handle cases where an attribute has "-" in it.
        const dependencies = el
          .getAttributeNames()
          .filter((attr) => attr.startsWith("lfdep"));
        dependencies.forEach((dep) => {
          let [prefix, attribute, variable] = dep.split("-");
          variable = data._stateVars.find((v: string) => v.toLowerCase() === variable)
          if (variable) {
            if (!dependencyTree[variable]) {
              dependencyTree[variable] = [];
            }
            dependencyTree[variable].push({
              el,
              attribute,
              innerText: !attribute
            });
          }
        });
      });
      return dependencyTree
    }
    getRenderHooks({ data, hooks }: IState) {
      return Object.keys(data).reduce((acc: Dependency, prop) => {
        acc[prop] = hooks[prop] || []
        acc[prop].push((newVal: any) => {
          if (this.dependencyTree) {
            this.dependencyTree[prop]?.forEach(({ el, attribute }) => {
              if (attribute) {
                el.setAttribute(attribute, newVal)
              } else {
                el.innerText = newVal
              }
            })
          }
        })
        return acc
      }, {})
    }
    addListeners() {
      this.querySelectorAll("[lfbind]").forEach((el) => {
        // @ts-ignore
        const [binding, event] = el.getAttribute("lfbind").split(":");
        el.addEventListener(event, (e) => {
          // TODO: Handle different tag types
          try {
            // @ts-ignore
            this.state[binding] = e.detail || e.target.value || "";
          } catch (err) {}
        });
      });
      this.querySelectorAll("[lfhandle]").forEach((el) => {
        // @ts-ignore
        const [handlerName, event] = el.getAttribute("lfhandle").split(":");
        el.addEventListener(event, (e) => {
          // @ts-ignore
          this.handlers[handlerName].call(this, e)
          e.stopImmediatePropagation()
        });
      });
    }
  };
  window.customElements.define(name, LilComponentClass);
}

function getImplicitVariables(template: string, hooks: Record<string, any>): Array<string> {
  const stateVariables: Set<string> = new Set()
  template.match(/{{([^}}]*)}}/gm)?.forEach(ref => {
    const variableName = ref.replace("{{", "").replace("}}", "")
    stateVariables.add(variableName);
  });
  Object.keys(hooks).forEach(key => stateVariables.add(key))
  return Array.from(stateVariables);
}