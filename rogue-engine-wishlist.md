
## Rogue Engine wishlist

### A solution for Undefined material errors

There are literally HUNDREDS of similar warnings in the console, with no clear solution.

    three.js:2 THREE.ObjectLoader: Undefined material 6d933ac3-433f-4a02-a628-a8b20eab1a37


### Ability to add many Components without touching the mouse

I wish the `Add Component` screen input box didn't change focus, so I could add several Components one after another, pressing enter between 


### More reliable Audio file drag & drop

Often I drag and drop an audio file into a Component prop, but it doesn't stay in the component prop because my cursor was moving while I released the audio file. Only when I carefully pause and hold still before dropping does the audio file stay in the prop.


### Auto-scrolling console messages

If there are a lot of console messages, only the oldest messages can be seen while testing the game. Scrolling up requires removing focus from the game window.


### RE code documentation

When I type, "RE.traverseComponents" in VSCode, I wish the documentation for that function was in the tooltip hints. Currently, all I get is the type info. Example:

```ts
(alias) function traverseComponents(fn: (component: RE.Component, objectUUID: string, index: number) => void): void
export traverseComponents
```