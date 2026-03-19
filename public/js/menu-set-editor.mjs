import { View } from '@webhandle/backbone-view'
import {KalpaTreeView} from "kalpa-tree-on-page/kalpa-tree-view"
import {Dialog, FormAnswerDialog} from "@webhandle/dialog"

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
		, {
			name: "admin"
			, nodes: [

				{
					"id": 0,
					"label": "admin",
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
	curMaxId = 0

	preinitialize(options) {
		this.events = Object.assign({}, {
			'click .image-holder a': 'linkClick'
			, 'click .image-holder': 'chooseImage'
			, 'click .delete-item': 'deleteItem'
			, 'click .create-item': 'createItem'
			, 'click .create-menu': 'createMenu'
			, 'change select[name="availableMenus"]': 'changeMenu'
			, 'click .browse': 'chooseImage'
		}, options.events)
		options.events = this.events
	}
	
	findMaxId() {
		let menu = this.getCurrentMenu()
		let max = menu.nodes.reduce((max, node) => {
			if(node.id > max) {
				max = node.id
			}
			return max
		}, 0)
		return max
	}
	
	createNewId() {
		return ++this.curMaxId	
	}
	
	watchInputForSlug(input) {
		input.addEventListener('input', (evt) => {
			setTimeout(() => {
				this.fixInputForSlug(input)
			})
		})
	}

	fixInputForSlug(input) {
		input.value = this.fixValueForSlug(input.value)
	}

	fixValueForSlug(value) {
		value ||= ''
		return value.toLowerCase().replaceAll(/\s/gi, '-').replaceAll(/['"\[\]!@#$%^&*()=+{}<>,.?\/\\|`~:;]/gi, '-')
	}
	
	async createMenu(evt, selected) {

		let dialog = new FormAnswerDialog({
			body: '<label>New menu name: <br><input name="menuName" type="text" /></label>'
			, title: 'Create a New Menu'
			, showCancelButton: true
		})
		let menuInfo = await dialog.open()
		if(menuInfo && menuInfo.menuName) {
			let name = menuInfo.menuName
			let newMenu = {
				name: name
				, nodes: [
					{
						id: 0
						, label: name
					}
					, {
						id: 1001
						, parentId: 0
						, label: 'first item'
					}
				]
			}
			data.menus.push(newMenu)
			
			let menuSelector = document.querySelector('select[name="availableMenus"]')
			menuSelector.innerHTML += `<option value="${name}">${name}</option>`
			menuSelector.value = name
			this.changeMenu(null, menuSelector)
		}
	}

	changeMenu(evt, selected) {
		let selectedMenu = selected.value
		this.saveCurrentMenu()
		this.tree.tree.removeNode(0, { silent: true, animate: false })
		this.currentMenu = selectedMenu
		let newMenu = this.getCurrentMenu()
		this.populateTreeForMenu(newMenu)
		this.tree.tree.select(0)
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

	createItem(evt, selected) {
		let curItem = this.tree.tree.selected()
		let parentId = 0
		if(curItem && curItem.parentId) {
			parentId = curItem.parentId
		}
		
		let newId = this.createNewId()
		let node = {
			id: newId
			, parentId: parentId
			, label: 'item ' + newId
		}
		this.tree.tree.options.stream.emit('data', node)
		this.tree.tree.select(newId)
	}
	
	populateTreeForMenu(menu) {
		for(let node of menu.nodes) {
			this.tree.tree.options.stream.emit('data', node)
		}
		this.curMaxId = this.findMaxId()
		// You'd think we're setting this too many times, but it doesn't work otherwise
		let root = this.tree.tree.get()
		this.tree.tree.select(root)
		this.focusNode(this.tree.tree.get(0))
		this.tree.tree.select(0)
	}

	getCurrentMenu() {
		let menu = data.menus.filter(menu => menu.name === this.currentMenu)
		return menu[0]
	}

	saveCurrentMenu() {
		let nodes = this.tree.serializeTree()
		let menu = this.getCurrentMenu()
		menu.nodes = nodes
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
		
		let holder = this.el.querySelector('.treebox')
		let tree = this.tree = new KalpaTreeView({
		})
		await tree.render()
		tree.appendTo(holder)

		tree.tree.editable()
		tree.events.on('select', (data) => {
			this.focusNode(data.node)
		})
		
		this.setupMenuOptions()
		this.populateTreeForMenu(this.getCurrentMenu())
	}

	focusNode(node) {
		this.el.querySelector('.node-view').innerHTML = '<pre>' + JSON.stringify(node, null, '\t') + '</pre>'
	}

}