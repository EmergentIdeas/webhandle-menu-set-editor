# @webhandle/menu-set-editor

Edits a file which contains menus. Relies on `@webhandle/site-editor-bridge` for access to server data.


## Install

```bash
npm install @webhandle/menu-set-editor
```

## Configuration

```json
{
	"@webhandle/menu-set-editor": {
		"publicFilesPrefix": "/@webhandle/menu-set-editor/files"
		, "alwaysProvideResources": false
	}
}
```

## Initialization

```js
import editorSetup from "@webhandle/menu-set-editor/initialize-webhandle-component.mjs"
let editorManager = await editorSetup(webhandle)
```

## Usage

The easiest way to use this is to include it in a page.

```html
<h1> Menu Set Editor</h1>
__externalResourceManager::@webhandle/menu-set-editor/addExternalResources__
<div id="menu-set-editor" style="height: 80vh">
	__::@webhandle/menu-set-editor/frame__
</div>
<script type="module">
	import { MenuSetEditor } from "@webhandle/menu-set-editor"
	let mse = document.querySelector('#menu-set-editor')
	let editor = new MenuSetEditor({
		el: mse
	})
	editor.render()
</script>
```

## Dependencies

There's a ton of webhandle components used. Directly it also uses a stylesheet,
`public/css/menu-set-editor.css`