# Lil Framework

This is an extremely lightweight JS framework that tries to just be a wrapper around native Web Components. Its goal is to make native web components a little more declarative, but still recognizably Web Components. Lil Framework is intentionally very light on features, and doesn't support certain complex DOM structures. In exchange for these shortcomings, it fits into only a few kilobytes, has a very simple learning curve, and plays nicely with UI not created using its component generator.

## Features

Lil Framework (abbreviated to LF in the rest of this document) consists of two basic parts:

* The `lfComponent` function, which registers web components.
* A simple state manager.

Components created using `lfComponent` have a lean list of features that make them an upgrade over native Web Components while doing as little as possible. The intent is for developers to use native Javascript APIs as needed to extend this feature set.

* UI Reactivity. Component templates can contain references to state variables, and the markup automatically updates. LF doesn't use a virtual DOM, but instead inserts additional DOM elements and attributes and updates the component HTML in place. This is performant, but does the potential for weird behavior in complex use cases. For most use cases, this approach is sufficient.
* Hooks. It's easy to register hooks that execute code whenever an attribute is updated. This is achieved using Proxies and Web Components' `attributeChangeCallback`.
* Iterative markup. LF includes an `<lf-for>` component. This can be used to achieve an effect similar to Vue's `v-for`.
* Declarative event handlers. LF includes a convenient and declarative way to bind component methods to events.

## Use

Here is a sample component declaration:

```typescript
import { lilComponent } from "lil-framework"

const name = "sample-component"

const template = `
<div>{{headerMessage}}</div>
<p>{{inputValue}}</p>
<input lfbind="inputValue:input" placeholder="Type something"/>
<span>{{clickCount}}</span>
<button lfhandle="incrementClickCount:click">Click me</button>
`

lilComponent({
  name,
  template,
  state: {
    clickCount: 0
  },
  hooks: {
    clickCount: [function (after, before) {
      console.log(`Click count went from ${before} to ${after}.`)
    }]
  }
  handlers: {
    incrementClickCount() {
      this.state.clickCount++
    }
  }
})
```

Using this component should look something like:

```html
<sample-component headerMessage="This message will appear at the top of the component"></sample-component>
```
