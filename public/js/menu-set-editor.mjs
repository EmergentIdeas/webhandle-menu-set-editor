import { View } from '@webhandle/backbone-view'
import { KalpaTreeView } from "kalpa-tree-on-page/kalpa-tree-view"
import { Dialog, FormAnswerDialog, formValueInjector, gatherFormData } from "@webhandle/dialog"
import { ImageInput } from "@webhandle/image-input"

let starterData = {
	menus: [
		{
			name: "primary"
			, nodes: [
				{
					"id": 0,
					"label": "main",
				}
			]
		}
	]
}


let sinkMenus
let sinkPages
let sinkFiles
try {
	let mod = await import("@webhandle/site-editor-bridge")
	sinkMenus = mod.siteEditorBridge.resourceTypes.menus
	sinkPages = mod.siteEditorBridge.resourceTypes.pages
	sinkFiles = mod.siteEditorBridge.resourceTypes.files
}
catch (e) {
	// well... This may keep it from working, but it doesn't need this if the sink
	// is passed with the constructor
}

export class MenuSetEditor extends View {
	currentMenu = "primary"
	curMaxId = 0
	data
	fileName = 'mainset.json'

	preinitialize(options) {
		this.events = Object.assign({}, {
			'click .image-holder a': 'linkClick'
			, 'click .image-holder': 'chooseImage'
			, 'click .delete-item': 'deleteItem'
			, 'click .create-item': 'createItem'
			, 'click .create-menu': 'createMenu'
			, 'click .delete-menu': 'deleteMenu'
			, 'click .save-menus': 'saveMenus'
			, 'change select[name="availableMenus"]': 'changeMenu'
			, 'keyup .node-view input': 'updateNodeForForm'
			, 'keyup .node-view textarea': 'updateNodeForForm'
			, 'change .node-view input': 'updateNodeForForm'
			, 'change .node-view textarea': 'updateNodeForForm'
			, 'change .node-view select': 'updateNodeForForm'
		}, options.events)
		options.events = this.events
	}
	
	
	async saveMenus() {
		await sinkMenus.write(this.fileName, JSON.stringify(this.data, null, '\t'))
		alert('The menu was saved.')
	}
	
	updateNodeForForm(evt, selected) {
		let nodeView = this.getNodeView()
		let data = gatherFormData(nodeView)
		delete data.attrName	
		delete data.attrValue
		
		
		let names = [...nodeView.querySelectorAll('input[name="attrName"]')]
		let values = [...nodeView.querySelectorAll('input[name="attrValue"]')]
		data.attributes = {}
		while(names.length > 0 && values.length > 0) {
			let name = names.shift()
			let value = values.shift()
			if(!name.value || !value.value) {
				continue
			}
			data.attributes[name.value] = value.value
		}
		
		this.tree.tree.edit(data)
	}

	findMaxId() {
		let menu = this.getCurrentMenu()
		let max = menu.nodes.reduce((max, node) => {
			if (node.id > max) {
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
		if (menuInfo && menuInfo.menuName) {
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
			this.data.menus.push(newMenu)

			let menuSelector = document.querySelector('select[name="availableMenus"]')
			menuSelector.innerHTML += `<option value="${name}">${name}</option>`
			menuSelector.value = name
			this.changeMenu(null, menuSelector)
		}
	}
	
	deleteMenu(evt, selected) {
		if(this.data.menus.length <= 1) {
			return alert('The last menu can not be deleted. Create anther menu first.')
		}
		let value = confirm('Are you sure you want to delete this menu?')
		if(value) {
			this.data.menus = this.data.menus.filter((item) => {
				if(item.name === this.currentMenu) {
					return false
				}
				return true
			})
			
			let menuSelector = document.querySelector('select[name="availableMenus"]')
			for(let option of menuSelector.children) {
				if(option.value === this.currentMenu) {
					option.remove()
					break
				}
			}
			
			let selectedMenu = this.data.menus[0].name
			menuSelector.value = selectedMenu
			
			this.tree.tree.removeNode(0, { silent: true, animate: false })
			this.currentMenu = selectedMenu
			let newMenu = this.getCurrentMenu()
			this.populateTreeForMenu(newMenu)
			this.tree.tree.select(0)
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
		if (!parent) {
			alert('Can not delete the root of a menu.')
		}
		else {
			this.tree.tree.removeNode(curItem)
			this.tree.tree.select(parent.id)
		}
	}

	createItem(evt, selected) {
		let curItem = this.tree.tree.selected()
		let parentId = 0
		if (curItem && curItem.parentId) {
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
		for (let node of menu.nodes) {
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
		let menu = this.data.menus.filter(menu => menu.name === this.currentMenu)
		return menu[0]
	}

	saveCurrentMenu() {
		let nodes = this.tree.serializeTree()
		let menu = this.getCurrentMenu()
		menu.nodes = nodes
	}

	setupMenuOptions() {
		let html = ''
		for (let name of this.data.menus.map(menu => menu.name)) {
			let additionalAttributes = ''
			if (name === this.currentMenu) {
				additionalAttributes = ' selected '
			}
			html += `<option value="${name}" ${additionalAttributes}>${name}</option>`
		}
		this.el.querySelector('.menu-controls select[name="availableMenus"]').innerHTML = html
	}
	
	async loadData() {
		try {
			let fileData = JSON.parse(await sinkMenus.read(this.fileName))
			this.data = fileData
		}
		catch(e) {
		}
		
		if(!this.data) {
			this.data = starterData
		}

	}

	async render() {
		await this.loadData()
		
		
		this.currentMenu = this.data.menus[0].name

		let holder = this.el.querySelector('.treebox')
		let tree = this.tree = new KalpaTreeView({
		})
		await tree.render()
		tree.appendTo(holder)

		tree.tree.editable()
		tree.emitter.on('select', (data) => {
			this.focusNode(data.node)
		})

		this.setupMenuOptions()
		this.populateTreeForMenu(this.getCurrentMenu())
	}
	
	getFormHTML(node) {
		let itemDetailsTemplate = this.el.querySelector("#menu-item-details-template");
		return itemDetailsTemplate.innerHTML.trim()
	}
	
	updateNodeView(node) {
		let nodeView = this.getNodeView()
		nodeView.innerHTML = formValueInjector(nodeView.innerHTML, node)

		let inputs = nodeView.querySelectorAll('input[data-view-component="@webhandle/image-input"]')
		for (let input of inputs) {
			let img = new ImageInput({
				input: input
				, sink: sinkFiles
				, imagesOnly: true
			})
			img.render()
			img.appendTo(input.parentElement)
		}
		
		if(!node.attributes) {
			node.attributes = {}
		}
		
		let names = [...nodeView.querySelectorAll('input[name="attrName"]')]
		let values = [...nodeView.querySelectorAll('input[name="attrValue"]')]
		let entries = Object.entries(node.attributes)
		while(names.length > 0 && values.length > 0 && entries.length > 0) {
			let name = names.shift()
			let value = values.shift()
			let [n, v] = entries.shift()
			name.value = n
			value.value = v
		}
	}
	
	getNodeView() {
		let nodeView = this.el.querySelector('.node-view')
		return nodeView
	}

	focusNode(node) {
		let nodeView = this.getNodeView()
		if (node.parentId === undefined || node.parentId === null) {
			nodeView.innerHTML = '<p>Choose a menu item from the tree to edit or select another menu from the drop down.</p>'
		}
		else {
			let formHtml = this.getFormHTML(node)
			nodeView.innerHTML = formHtml
			this.updateNodeView(node)

		}
	}

}