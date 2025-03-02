
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


### Prefabs behavior that makes sense

The amount of times I've lost work to Prefabs is... a lot. I wish Prefabs were more intuitive, or more verbose in what they were doing. When I drop an item over an existing Prefab, what's it doing? Updating? Overwriting?


### Better abstraction for getting a handle on a Component within an object in the scene

I want a better way to accomplish what is done in the following example.

```ts
const warehouseObject = RE.Runtime.scene.getObjectByName("SolFront Warehouse") as THREE.Object3D;
const warehouseComp = Warehouse.get(warehouseObject)
```


### Type to search for a filename in the Project file browser

When I've got lots of audio files and I know the one I want, I'd like to type in it's name to find it quickly.


### Ability to cancel a drag & drop operation

Sometimes I drag and change my mind before dropping. Other times I drag by mistake. There's no way to cancel. (unfulfilled expectation to press Esc to cancel)