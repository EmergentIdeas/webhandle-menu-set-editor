import { View } from '@webhandle/backbone-view'
import KalpaTreeView from "kalpa-tree-on-page/kalpa-tree-view"

let data = {
	menus: [
		{
			name: "main"
			, nodes: [

				{
					"id": 0,
					"label": "main",
				}
				, {
					"id": 1002,
					"label": "node 2",
					"parentId": 0
				}
				, {
					"id": 1003,
					"label": "node 3",
					"parentId": 0
				}
				, {
					"id": 1004,
					"label": "node 4",
					"parentId": 1003
				}
			]
		}
	]
}


let sinkMenus
let sinkPages
try {
	let mod = await import("@webhandle/site-editor-bridge")
	sinkMenus = mod.siteEditorBridge.resourceTypes.menus
	sinkPages = mod.siteEditorBridge.resourceTypes.pages
}
catch (e) {
	// well... This may keep it from working, but it doesn't need this if the sink
	// is passed with the constructor
}

export class MenuSetEditor extends View {
	currentMenu = "main"

	preinitialize(options) {
		this.events = Object.assign({}, {
			'click .image-holder a': 'linkClick'
			, 'click .image-holder': 'chooseImage'
			, 'click .delete-item': 'deleteItem'
			, 'click .browse': 'chooseImage'
		}, options.events)
		options.events = this.events
	}
	
	deleteItem(evt, selected) {
		let curItem = this.tree.tree.selected()
		let parent = this.tree.tree.parent(curItem)
		if(!parent) {
			console.log('Can not delete the root of a menu')
		}
		else {
			this.tree.tree.removeNode(curItem)
			this.tree.tree.select(parent.id)

		}
	}
	
	populateTreeForMenu(menu) {
		for(let node of menu.nodes) {
			this.tree.tree.options.stream.emit('data', node)
		}

	}

	setupMenuOptions() {
		let html = ''
		for(let name of data.menus.map(menu => menu.name)) {
			let additionalAttributes = ''
			if(name === this.currentMenu) {
				additionalAttributes = ' selected '
			}	
			html += `<option value="${name}" ${additionalAttributes}>${name}</option>`
		}
		this.el.querySelector('.menu-controls select[name="availableMenus"]').innerHTML = html
	}

	async render() {
		this.currentMenu = data.menus[0].name
		
		let nodes = data.menus[0].nodes

		let holder = this.el.querySelector('.treebox')
		let tree = this.tree = new KalpaTreeView({
		})
		await tree.render()
		tree.appendTo(holder)

		tree.tree.editable()
		tree.events.on('select', (data) => {
			console.log('select')
			console.log(data)
			this.focusNode(data)
		})
		
		this.setupMenuOptions()
		this.populateTreeForMenu(data.menus[0])
	}

	focusNode(node) {
		this.el.querySelector('.node-view').innerHTML = '<pre>' + JSON.stringify(node, null, '\t') + '</pre>'
	}

}