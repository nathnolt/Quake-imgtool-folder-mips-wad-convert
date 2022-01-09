// 
// This script is a little helper program to make using the fte imgtool a little bit more convenient.
// 
//
// fte imgtool: https://fte.triptohell.info/moodles/win64/
// 
// Usage: 
//   2. create folders inside of this folder (or any other folder, see config.js)
//   2. put (prepared) img files into those folders.
//   3. edit the config.js file to setup your outputWadDir
//   4. on commandline: run: node ./tool.js
// 
// 
// Extra info
//   The tool converts the pixels of img files into the Quake palette, 
//   but you get no configuration for this, You want to prepare the img files 
//   with something like Gimp, to convert it into a non fullbright quake palette friendly img.
//   
//   Supported img formats (only png, tga, jpg, jpeg and bmp tested): [
//     'png', 'tga', 'jpg', 'jpeg', 'bmp', 'dds', 'ktx', 'ico', 
//     'psd', 'pfm', 'pbm', 'pgm', 'ppm', 'hdr', 'astc', 'pkm', 'pcx'
//   ]
//
// 
// TODO
//   - Add support for dithering ( https://github.com/makeworld-the-better-one/didder/releases ) and no fullbright pixels
//   



// 0. initial stuff
const fs = require('fs')
const child_process = require("child_process")
const path = require('path')
const config = require('./config.js')

// define console colors, for prettier logging output
// SEE https://www.lihaoyi.com/post/BuildyourownCommandLinewithANSIescapecodes.html
const cc = {
	bgblue: '\u001b[44m',
	bgcyan: '\u001b[46m',
	bgred: '\u001b[41m',
	bggreen: '\u001b[42m',
	bggrey: '\u001b[48;5;238m',
	bgorange: '\u001b[48;5;202m',
	r: '\u001b[0m',
}


// Set vars from the config
const thisPath = normalizeFolder('')
const inputDir = normalizeFolder(config.inputDir)
const pngOutputDir = normalizeFolder(config.pngOutputDir)
const outputWadDir = normalizeFolder(config.outputWadDir)
const img2mipCommand = config.img2mipCommand
const buildWadCommand = config.buildWadCommand
const wad2pngsCommand = config.wad2pngsCommand
const imgtoolLog = config.imgtoolLog
const pedanticLog = config.pedanticLog
const toolPath = path.normalize(config.toolPath)
const indentStr1 = '            '
const devDebug = true
const supportedImageTypes = [
	'png',
	'tga',
	'jpg',
	'jpeg',
	'bmp',
	'dds',
	'ktx',
	'ico',
	'psd',
	'pfm',
	'pbm',
	'pgm',
	'ppm',
	'hdr',
	'astc',
	'pkm',
	'pcx'
]

// Check if the imgtool exists
if(!pathExists(toolPath)) {
	console.error(cc.bgred, 'ERROR', cc.r, toolPath, 'not found: download the program from https://fte.triptohell.info/moodles/win64/')
	process.exit(1)
}

ensureFolder(inputDir)
ensureFolder(outputWadDir)
ensureFolder(pngOutputDir)


// check command line arguments
const commands = {
	'-d':        defaultRoute,
	'--default': defaultRoute,
	'-r':        reverseRoute,
	'--reverse': reverseRoute,
	'-h':        helpRoute,
	'--help':    helpRoute,
}
const cmdArgs = process.argv.slice(2)

let forceRecreateFlag = false
let forceSingleName
if(cmdArgs.length == 0) {
	helpRoute()
} else {
	const firstArg = cmdArgs[0].toLowerCase()
	
	if(cmdArgs.length >= 2) {
		const secondArg = cmdArgs[1].toLowerCase()
		if(secondArg == '-fa' || secondArg == '--forceall') {
			forceRecreateFlag = true
			console.log('Force recreate.')
		} else {
			// assume name, and just force that one.
			forceSingleName = cmdArgs[1]
			forceRecreateFlag = true
		}
	}
	
	let found = false
	for(let k in commands) {
		if(k == firstArg) {
			found = true
			const fn = commands[k]
			fn()
			break
		}
	}

	if(!found) {
		console.log('invalid command:', firstArg)
		helpRoute()
	}
}


function helpRoute() {
	const helpLines = [
		cc.bgblue + 'Usage:' + cc.r,
		'  node tool.js "command", where "command" is something like -d or -r',
		'',
		'  ' + cc.bgcyan + 'example:' + cc.r,
		'    node tool.js -d',
		'',
		'  ' + cc.bgcyan + 'example2:' + cc.r + ' force recreate just 1:',
		'    node tool.js -d wadfolder',
		'',
		cc.bgblue + 'Commands:' + cc.r,
		'  -d, --default:',
		'',
		'    The default command, converts folders of imgs into mips and into wads',
		'',
		'  -r, --reverse:',
		'',
		'    The reverse command, converts wads back into folders with png files.',
		'    This only works for the wads directly in the outputWadDir, wads in subdirectories are not handled',
		'',
		'  -fa, --forceall: ',
		'',
		'    After another command to forcefully recreate everything regardless of the modification dates',
		'',
		'  "", -h, --help:',
		'',
		'    This help message',
	]
	console.log(helpLines.join('\n'))
}





// Actually do work
function reverseRoute() {
	// 1. get the wads
	const wads = getFileNames(outputWadDir, ['wad'])
	const logWadPath = getLogPath(thisPath, outputWadDir)
	
	// 2. loop through the wads
	for(let i=0; i < wads.length; i++) {
		// 3. get the wadName and folders
		const wadName = removeExtension(wads[i])
		const pngFolder = normalizeFolder(pngOutputDir + wadName)
		const logPngFolder = getLogPath(thisPath, pngFolder)
		
		// 4. ensure the png path exists
		ensureFolder(pngFolder)
		
		// 5. compare edit dates of wad and pngs
		if(!forceRecreateFlag) {
			const wadEditDateItems = getEditDates(outputWadDir, [wadName + '.wad'])
			const lastWadEditDate  = getLastEditDate(wadEditDateItems)
			const pngs = getFileNames(pngFolder, ['png'])
			const pngEditDateItems = getEditDates(pngFolder, pngs)
			const lastPngEditDate = getLastEditDate(pngEditDateItems)
			if(lastPngEditDate > lastWadEditDate) {
				if(pedanticLog) { console.log(`${cc.bggrey} pngs for ${wadName + '.wad'} ${cc.r} up 2 date`) }
				continue
			}
		}
		
		// 5. because we change the cwd, we need to change the toolpath as well
		const relativeToolPath = path.relative(pngFolder, toolPath)
		
		// 6. execute the command
		const wad2pngShellCommand = wad2pngsCommand(relativeToolPath, outputWadDir, wadName)
		if(devDebug) { console.log(`wad 2 png shell command: ${wad2pngShellCommand}`)}
		const result = executeShellScript(wad2pngShellCommand, {cwd: pngFolder})
		if(!result.success) {
			console.error(cc.bgred, 'imgtool ERROR', cc.r, 'Converting wad', (logWadPath + wadName + '.wad'), 'to pngs in', logPngFolder, result.error)
			continue
		} else
		// This function has other ways it can fail I have no Idea Why
		
		if(
			(result.msg.indexOf('Write failed') != -1) ||
			(result.msg.indexOf('\\') != -1) || 
			(result.msg.indexOf('/') != -1)
		) {
			console.error(cc.bgred, 'unknown imgtool ERROR', cc.r, (logWadPath + wadName + '.wad'))
		}
		
		if(pedanticLog) { console.log(`${logWadPath + wadName + '.wad'} -> ${logPngFolder}`) }
		if(imgtoolLog) { console.log(cc.bgcyan + ' imgtool ' + cc.r, afterFirstLineIndentLog(indentStr1, result.msg)) }
	}
	// this is good, if we're in the correct folder, and I believe this works through the current folder thingy.
	// '..\\imgtool64.exe -x ..\\..\\tech.wad'
	console.log(cc.bggreen, 'Program done.', cc.r)
}


function defaultRoute() {
	if(forceSingleName) {
		const normalizedPath = normalizeFolder(inputDir + forceSingleName)
		
		// Check if it exists
		if(!pathExists(normalizedPath)) {
			console.error(cc.bgred, 'ERROR', cc.r, 'item does not exist:', forceSingleName)
			process.exit(1)
		}
		
		// Extract the dirname from normalizedPath
		let normalized
		{
			const pathArr = normalizedPath.split(/\\|\//)
			normalized = pathArr.slice(-2, -1)[0]
		}
		console.log('recreate only', normalized)
		doFolder(normalized)
	} else {
		
		// The default case.
		const folders = getFolderNames(inputDir).filter(filterFolderNames)
		if(folders.length == 0) {
			console.error(cc.bgred, 'ERROR', cc.r, 'could not find any folders in ', inputDir)
			process.exit(1)
		}
		folders.forEach(doFolder)
	}
}

/**
* This function checks if the wad has to be built at all, 
* and then does it.
*/
function doFolder(folderName) {
	const folderPath = normalizeFolder(inputDir + folderName)
	const wadConfig = getWadConfig(folderPath)
	const images = getFileNames(folderPath, supportedImageTypes)
	if(images.length == 0) {
		console.error(cc.bgred, 'ERROR', cc.r, 'No valid image files found.')
	}
	const imgEditDateItems = getEditDates(folderPath, images)
	const wadExists = pathExists(wadConfig.outputWadDir + folderName + '.wad')
	
	let wadHasToBeBuilt = false
	if(wadExists && !forceRecreateFlag && !wadConfig.forceRebuilt) {
		// compare the edit dates of the imgs and the wad, to check if we need to rebuild the wad
		const lastImgEditDate = getLastEditDate(imgEditDateItems)
		const wadEditDateItems = getEditDates(wadConfig.outputWadDir, [folderName + '.wad'])
		const lastWadEditDate = getLastEditDate(wadEditDateItems)
		wadHasToBeBuilt = lastImgEditDate > lastWadEditDate
	} else {
		wadHasToBeBuilt = true
	}
	
	if(wadHasToBeBuilt) {
		console.log('Building', cc.bgblue, (folderName + '.wad'), cc.r )
		imgs2mipsAndBuildWad(folderName, wadConfig, imgEditDateItems)
	} else {
		console.log(cc.bggrey, (folderName + '.wad'), cc.r, 'up 2 date.')
	}
}

/**
* We need to get the wad config, which is a combination
* of the defaultWadConfig and an optional wadconfig file within the folderPath
*/
function getWadConfig(folderPath) {
	
	// 1. get the default wadConfig.
	let defaultWadConfig = {}
	if(config.defaultWadConfig) {
		defaultWadConfig = Object.assign(defaultWadConfig, config.defaultWadConfig)
	}
	const wadConfig = defaultWadConfig
	
	// 2. see if there is a wadConfig file inside of the folderPath, and require it.
	let overwriteWadConfig
	if(pathExists(folderPath + 'wadconfig.js')) {
		overwriteWadConfig = require(folderPath + 'wadconfig.js')
	}
	if(overwriteWadConfig) {
		Object.assign(wadConfig, overwriteWadConfig)
	}
	
	// Add an outputWadDir property, which has the absolute value.
	if(wadConfig.relativeOutputWadDir) {
		wadConfig.outputWadDir = normalizeFolder(outputWadDir + wadConfig.relativeOutputWadDir)
		ensureFolder(wadConfig.outputWadDir)
	} else {
		wadConfig.outputWadDir = outputWadDir
	}
	
	// console.log(wadConfig)
	return wadConfig
}

/**
* 2. convert the imgs into mips and build the wad
*/
function imgs2mipsAndBuildWad(folderName, wadConfig, imgEditDateItems) {
	const folderPath = normalizeFolder(inputDir + folderName)
	const mipFolder = normalizeFolder(folderPath + 'mip')
	
	const logFolderPath = getLogPath(thisPath, folderPath)
	const logMipFolderPath = getLogPath(thisPath, mipFolder)
	
	// 1. create the mip folder if it doesn't exist
	ensureFolder(mipFolder)
	
	// 2. compare the data of the mip files and the imgs, to determine which ones need to get built.
	let imgs2Convert
	if(pathExists(mipFolder) && !forceRecreateFlag) {
		// compare the edit dates of the imgs and the mips to check which imgs we need to rebuild to mips
		const mips = getFileNames(mipFolder, ['mip'])
		const mipEditDateItems = getEditDates(mipFolder, mips)
		imgs2Convert = compareImgAndMipDateItems(imgEditDateItems, mipEditDateItems)
	} else {
		imgs2Convert = imgEditDateItems
	}
	
	// 3. convert the imgs to mips
	let mipFileNames2Move = []
	if(pedanticLog && imgs2Convert.length > 0) { console.log(cc.bgblue, 'converted', cc.r) }
	for(let i = 0; i < imgs2Convert.length; i++) {
		const imgItem = imgs2Convert[i]
		
		const relativeToolPath = path.relative(folderPath, toolPath)
		
		const img2mipConvertShellCommand = img2mipCommand(relativeToolPath, imgItem.fileName)
		if(devDebug) { console.log(`img 2 mip shell command: ${img2mipConvertShellCommand}`)}
		const result = executeShellScript(img2mipConvertShellCommand, {cwd: folderPath})
		if(!result.success) {
			console.error(cc.bgred, 'imgtool ERROR', cc.r, 'Converting img to mip:', (logFolderPath + imgItem.fileName), result.error)
			continue
		}
		
		const mipFileName = removeExtension(imgItem.fileName) + '.mip'
		mipFileNames2Move.push(mipFileName)
		if(pedanticLog) { console.log(`  ${logFolderPath + imgItem.fileName} -> ${logFolderPath + mipFileName}`) }
		if(imgtoolLog) { console.log(' ', cc.bgcyan + ' imgtool ' + cc.r, afterFirstLineIndentLog(indentStr1, result.msg)) }
	}
	
	// 4. move the mips to the mip subfolder
	if(pedanticLog && mipFileNames2Move.length > 0) { console.log(cc.bgblue, 'moved', cc.r) }
	for(let i = 0; i < mipFileNames2Move.length; i++) {
		const mipFileName = mipFileNames2Move[i]
		const oldMipPath = folderPath + mipFileName
		const newMipPath = mipFolder + mipFileName
		fs.renameSync(oldMipPath, newMipPath)
		if(pedanticLog) { console.log(`  ${logFolderPath + mipFileName} -> ${logMipFolderPath + mipFileName}`) }
	}
	
	// 5. build the wad file
	const wadBuildShellCommand = buildWadCommand(toolPath, getLogPath(thisPath, wadConfig.outputWadDir), folderName, getLogPath(thisPath, mipFolder))
	if(devDebug) { console.log(`wad build shell command: ${wadBuildShellCommand}`)}
	const result = executeShellScript(wadBuildShellCommand, {cwd: thisPath})
	if(!result.success) {
		console.error(cc.bgred, 'imgtool ERROR', cc.r, 'Building wad:', (wadConfig.outputWadDir + folderName + '.wad'), result.error)
		return
	}
	
	// 6. wad file built.
	if(imgtoolLog) {
		const msg = result.msg.trim()
		if(msg != '') {
			cc.bgcyan + ' imgtool ' + cc.r, console.log(msg)
		}
	}
	console.log(cc.bggreen, (folderName + '.wad'), cc.r, 'built' )
	console.log('')
}






// More specific helper functions

/**
* We want to return the array of img items that have a newer edit date than the mip items, 
* or build items that don't have a mip item at all.
*/
function compareImgAndMipDateItems(imgEditDateItems, mipEditDateItems) {
	const imgs2convert = []
	for(var i = 0; i < imgEditDateItems.length; i++) {
		const imgItem = imgEditDateItems[i]
		const mipItem = findMip(removeExtension(imgItem.fileName), mipEditDateItems)
		if(!mipItem) {
			imgs2convert.push(imgItem)
		} else {
			// Compare the img editDate to the mip editDate
			if(imgItem.editDate > mipItem.editDate) {
				imgs2convert.push(imgItem)
			}
		}
	}
	return imgs2convert
}

/**
* sub function for compareImgAndMipDateItems.
*/
function findMip(name, mipEditDateItems) {
	const mipFileName = name + '.mip'
	
	// lsearch within mipEditDateItems for mipFileName
	for(let i = 0; i < mipEditDateItems.length; i++) {
		const mipItem = mipEditDateItems[i]
		if(mipItem.fileName == mipFileName) {
			return mipItem
		}
	}
	return false
}

function filterFolderNames(folderName) {
	if(folderName.indexOf('.git') != -1) {
		return false
	}
	return true
}


// More generic helper functions

/**
* Indent a string after the first line
*/
function afterFirstLineIndentLog(lineIndentStr, str) {
	let strArr = str.trim().split('\n')
	for(let i = 1; i < strArr.length; i++) {
		strArr[i] = lineIndentStr + strArr[i]
	}
	return strArr.join('\n')
}

/**
* this executes a shell script and returns true if succesfull, false if not successfull
*/
function executeShellScript(string, options) {
	const defaultOptions = {encoding: 'utf8'}
	if(options == undefined) {
		options = defaultOptions
	} else {
		options = Object.assign(defaultOptions, options)
	}
	
	let msg
	try {
		msg = child_process.execSync(string, options)
	} catch(e) {
		return {success: false, error: e}
	}
	return {success: true, msg: msg}
}


/**
* Get the edit dates of a list of filePaths
* 
* uses ctimeMs because that's the most recent time something has happened to the file.
* The result is a large object with all the relevant items.
*/
function getEditDates(folderPath, fileNameArr) {
	const editDates = []
	for(let i = 0; i < fileNameArr.length; i++) {
		const fileName = fileNameArr[i]
		const filePath = folderPath + fileName
		const stats = fs.lstatSync(filePath)
		editDates.push({folderPath: folderPath, fileName: fileName, editDate: stats.ctimeMs})
	}
	return editDates
}

/**
* get last edit date from an array of edit dates, created from the getEditDates function
*/
function getLastEditDate(editDates) {
	let lastEditDate
	for(let i = 0; i < editDates.length; i++) {
		const editDateItem = editDates[i]
		const date = editDateItem.editDate
		if(lastEditDate == undefined || date > lastEditDate) {
			lastEditDate = date
		}
	}
	return lastEditDate
}


/**
* Get a list of the folders within a folder
*/
function getFolderNames(dirPath) {
	const dirItems = fs.readdirSync(dirPath, {withFileTypes: true})
	const folders = []
	
	for(let i = 0; i < dirItems.length; i++) {
		const item = dirItems[i]
		if(item.isDirectory()) {
			folders.push(item.name)
		}
	}
	return folders
}

/**
* Get a list of files with a specific extension within a folder.
* Note: the file names include the extension in them.
*/
function getFileNames(inputDir, filterExtensionArr) {
	const items = fs.readdirSync(inputDir)
	const hasSpecifiedExtensionFn = funcRetEq(getExtension, filterExtensionArr)
	return items.filter(hasSpecifiedExtensionFn)
}

/**
* creates a function that compares the result of the the value called within the returned function to a 
* value set during creation of the function.
*/
function funcRetEq(func, filterExtArr) {
	return function(x) {
		return filterExtArr.includes(func(x))
	}
}

/**
* Gets the extension of a file path
*/
function getExtension(inputFile) {
	const dotIndex = inputFile.lastIndexOf('.')
	if(dotIndex == -1) {
		return ''
	} else {
		return inputFile.slice(dotIndex + 1)
	}
}


/**
* Removes the extension from a file name
*/
function removeExtension(inputFile) {
	const dotIndex = inputFile.lastIndexOf('.')
	if(dotIndex == -1) {
		return inputFile
	} else {
		return inputFile.slice(0, dotIndex)
	}
}

/**
* Normalize a folder
*/
function normalizeFolder(dirPath) {
	dirPath = path.resolve(dirPath)
	dirPath = dirPath.replace(/\\/g, '/')
	if(dirPath.charAt(dirPath.length - 1) != '/') {
		dirPath = dirPath + '/'
	}
	return path.normalize(dirPath)
}

function getLogPath(thisPath, folderPath) {
	let relPath = path.relative(thisPath, folderPath)
	relPath = relPath.replace(/\\/g, '/')
	if(relPath.charAt(relPath.length - 1) != '/') {
		relPath = relPath + '/'
	}
	let normalized = path.normalize(relPath)
	normalized = normalized.replace(/\\/g, '/')
	return normalized
}

/**
* returns is a path exists yes or no (true / false)
*/
function pathExists(path) {
	return fs.existsSync(path)
}

/**
* create a folder if it does not exsit already
*/
function ensureFolder(folder) {
	if(!pathExists(folder)) {
		fs.mkdirSync(folder, {recursive: true})
	}
}
