import createInitializeWebhandleComponent from "@webhandle/initialize-webhandle-component/create-initialize-webhandle-component.mjs"
import ComponentManager from "@webhandle/initialize-webhandle-component/component-manager.mjs"
import path from "node:path"
import setupMaterialIcons from "@webhandle/material-icons/initialize-webhandle-component.mjs"
import setupBackboneView from "@webhandle/backbone-view/initialize-webhandle-component.mjs"
import setupDialog from "@webhandle/dialog/initialize-webhandle-component.mjs"
import siteEditorBridgeSetup from "@webhandle/site-editor-bridge/initialize-webhandle-component.mjs"
import kalpaTreeSetup from "kalpa-tree-on-page/initialize-webhandle-component.mjs"
import stylesSetup from "ei-form-styles-1/initialize-webhandle-component.mjs"
import setupImageInput from "@webhandle/image-input/initialize-webhandle-component.mjs"



const initializeWebhandleComponent = createInitializeWebhandleComponent()

initializeWebhandleComponent.componentName = '@webhandle/menu-set-editor'
initializeWebhandleComponent.componentDir = import.meta.dirname
initializeWebhandleComponent.defaultConfig = {
	"publicFilesPrefix": '/' + initializeWebhandleComponent.componentName + "/files"
	, "alwaysProvideResources": false
}
initializeWebhandleComponent.staticFilePath = 'public'
initializeWebhandleComponent.templatePath = 'views'


initializeWebhandleComponent.setup = async function(webhandle, config) {
	let manager = new ComponentManager()
	manager.config = config
	
	let kalpaTreeManager = await kalpaTreeSetup(webhandle)
	let managerMaterialIcons = await setupMaterialIcons(webhandle)
	setupBackboneView(webhandle)
	let managerDialog = await setupDialog(webhandle)
	let siteEditorBridgeSetupManager = await siteEditorBridgeSetup(webhandle)
	let stylesManager = await stylesSetup(webhandle)
	let managerImageInput = await setupImageInput(webhandle)

	webhandle.routers.preDynamic.use((req, res, next) => {
		if(config.alwaysProvideResources || !initializeWebhandleComponent.supportsMultipleImportMaps(req)) {
			manager.addExternalResources(res.locals.externalResourceManager)
		}
		next()
	})
	
	manager.addExternalResources = (externalResourceManager, options) => {
		managerMaterialIcons.addExternalResources(externalResourceManager)
		managerDialog.addExternalResources(externalResourceManager)
		siteEditorBridgeSetupManager.addExternalResources(externalResourceManager)
		stylesManager.addExternalResources(externalResourceManager)
		managerImageInput.addExternalResources(externalResourceManager)

		externalResourceManager.includeResource({
			mimeType: 'text/css'
			, url: config.publicFilesPrefix + '/css/menu-set-editor.css'
		})

		externalResourceManager.provideResource({
			url: config.publicFilesPrefix + '/js/menu-set-editor.mjs'
			, mimeType: 'application/javascript'
			, resourceType: 'module'
			, name: initializeWebhandleComponent.componentName
		})
	}

	webhandle.addTemplate(initializeWebhandleComponent.componentName + '/addExternalResources', (data) => {
		let externalResourceManager = initializeWebhandleComponent.getExternalResourceManager(data)
		manager.addExternalResources(externalResourceManager)
		let resources = externalResourceManager.render()
		return resources
	})

	// webhandle.addTemplate(initializeWebhandleComponent.componentName + '/doTheThing', (data) => {
	// 	try {
	// 		let externalResourceManager = initializeWebhandleComponent.getExternalResourceManager(data)
	// 		manager.addExternalResources(externalResourceManager)

	// 		let resources = externalResourceManager.render()
	// 		let action = `
	// <script type="module">
	// 		import { component } from "${initializeWebhandleComponent.componentName}"
	// 		component()
	// </script>`

	// 		return resources + action
	// 	}
	// 	catch(e) {
	// 		console.error(e)
	// 	}
	// })

	// Allow access to the component and style code
	let filePath = path.join(initializeWebhandleComponent.componentDir, initializeWebhandleComponent.staticFilePath)
	manager.staticPaths.push(
		webhandle.addStaticDir(
			filePath,
			{
				urlPrefix: config.publicFilesPrefix
				, fixedSetOfFiles: true
			}
		)
	)
	
	webhandle.addTemplateDir(
		path.join(initializeWebhandleComponent.componentDir, initializeWebhandleComponent.templatePath)
		, {
			immutable: true
		}
	)

	return manager
}

export default initializeWebhandleComponent
