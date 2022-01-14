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
//   [ ] Add support for dithering ( https://github.com/makeworld-the-better-one/didder/releases ) and no fullbright pixels
//   [ ] add support for wadconfigs from the subfolder, where each depth is 
//       checked, and overwrites the previous settings for those items that are in that folder.



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

const skipFolderNames = ['.git', 'mip'] // The folder names which are skipped.

const supportedImgtoolTypes = [
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

const supportedDidderTypes = [
	'png',
	'jpg',
	'jpeg',
	'gif',
	'bmp',
]

// Define the palette strings for didder
const nonFullbrightPalette = '0,0,0 15,15,15 31,31,31 47,47,47 63,63,63 75,75,75 91,91,91 107,107,107 123,123,123 139,139,139 155,155,155 171,171,171 187,187,187 203,203,203 219,219,219 235,235,235 15,11,7 23,15,11 31,23,11 39,27,15 47,35,19 55,43,23 63,47,23 75,55,27 83,59,27 91,67,31 99,75,31 107,83,31 115,87,31 123,95,35 131,103,35 143,111,35 11,11,15 19,19,27 27,27,39 39,39,51 47,47,63 55,55,75 63,63,87 71,71,103 79,79,115 91,91,127 99,99,139 107,107,151 115,115,163 123,123,175 131,131,187 139,139,203 0,0,0 7,7,0 11,11,0 19,19,0 27,27,0 35,35,0 43,43,7 47,47,7 55,55,7 63,63,7 71,71,7 75,75,11 83,83,11 91,91,11 99,99,11 107,107,15 7,0,0 15,0,0 23,0,0 31,0,0 39,0,0 47,0,0 55,0,0 63,0,0 71,0,0 79,0,0 87,0,0 95,0,0 103,0,0 111,0,0 119,0,0 127,0,0 19,19,0 27,27,0 35,35,0 47,43,0 55,47,0 67,55,0 75,59,7 87,67,7 95,71,7 107,75,11 119,83,15 131,87,19 139,91,19 151,95,27 163,99,31 175,103,35 35,19,7 47,23,11 59,31,15 75,35,19 87,43,23 99,47,31 115,55,35 127,59,43 143,67,51 159,79,51 175,99,47 191,119,47 207,143,43 223,171,39 239,203,31 255,243,27 11,7,0 27,19,0 43,35,15 55,43,19 71,51,27 83,55,35 99,63,43 111,71,51 127,83,63 139,95,71 155,107,83 167,123,95 183,135,107 195,147,123 211,163,139 227,179,151 171,139,163 159,127,151 147,115,135 139,103,123 127,91,111 119,83,99 107,75,87 95,63,75 87,55,67 75,47,55 67,39,47 55,31,35 43,23,27 35,19,19 23,11,11 15,7,7 187,115,159 175,107,143 163,95,131 151,87,119 139,79,107 127,75,95 115,67,83 107,59,75 95,51,63 83,43,55 71,35,43 59,31,35 47,23,27 35,19,19 23,11,11 15,7,7 219,195,187 203,179,167 191,163,155 175,151,139 163,135,123 151,123,111 135,111,95 123,99,83 107,87,71 95,75,59 83,63,51 67,51,39 55,43,31 39,31,23 27,19,15 15,11,7 111,131,123 103,123,111 95,115,103 87,107,95 79,99,87 71,91,79 63,83,71 55,75,63 47,67,55 43,59,47 35,51,39 31,43,31 23,35,23 15,27,19 11,19,11 7,11,7 255,243,27 239,223,23 219,203,19 203,183,15 187,167,15 171,151,11 155,131,7 139,115,7 123,99,7 107,83,0 91,71,0 75,55,0 59,43,0 43,31,0 27,15,0 11,7,0 0,0,255 11,11,239 19,19,223 27,27,207 35,35,191 43,43,175 47,47,159 47,47,143 47,47,127 47,47,111 47,47,95 43,43,79 35,35,63 27,27,47 19,19,31 11,11,15'
const fullPalette = nonFullbrightPalette + ' 43,0,0 59,0,0 75,7,0 95,7,0 111,15,0 127,23,7 147,31,7 163,39,11 183,51,15 195,75,27 207,99,43 219,127,59 227,151,79 231,171,95 239,191,119 247,211,139 167,123,59 183,155,55 199,195,55 231,227,87 127,191,255 171,231,255 215,255,255 103,0,0 139,0,0 179,0,0 215,0,0 255,0,0 255,243,147 255,247,199 255,255,255 159,91,83'

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
		const folderObjs = getFolderObjs(inputDir)
		
		if(folderObjs.length == 0) {
			console.error(cc.bgred, 'ERROR', cc.r, 'could not find any folders in ', inputDir)
			process.exit(1)
		}
		
		folderObjs.forEach(doFolder)
	}
}

/**
* This is the entry function for every folder.
* 
* This function checks if the wad has to be built at all, 
* and then does the building.
* 
*/
function doFolder(folderObj) {
	
	const folderName = folderObj.name
	const folderPath = folderObj.path
	const wadConfig = getWadConfig(folderPath)
	
	const images = getFileNames(folderPath, supportedImgtoolTypes)
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
		imgs2mipsAndBuildWad(folderPath, folderName, wadConfig, imgEditDateItems)
	} else {
		console.log(cc.bggrey, (folderName + '.wad'), cc.r, 'up 2 date.')
	}
}

/**
* We need to get the wad config, which is a combination
* of the defaultWadConfig and an optional wadconfig file within the folderPath.
* 
* We need to define the output folder here.
*/
function getWadConfig(folderPath) {
	
	// 1. get the default wadConfig.
	let defaultWadConfig = {}
	if(config.defaultWadConfig) {
		defaultWadConfig = Object.assign(defaultWadConfig, config.defaultWadConfig)
	}
	const wadConfig = defaultWadConfig
	
	// @todo: do the relativePath here, just so we can load potential other wadconfigs, 
	//        to make this nesting system of wadconfig files work.
	//        [BUT] we can work on this later, when we actually have the palette 
	//        conversion / dithering system working with didder
	
	
	// 2. see if there is a wadConfig file inside of the folderPath, and require it.
	let overwriteWadConfig
	if(pathExists(folderPath + 'wadconfig.js')) {
		overwriteWadConfig = require(folderPath + 'wadconfig.js')
	}
	if(overwriteWadConfig) {
		Object.assign(wadConfig, overwriteWadConfig)
	}
	
	// outputWadDir property
	{
		// 1. check for a wadConfig flag
		let otherOutputDir = false
		
		if(wadConfig.relativeOutputWadDir) {
			otherOutputDir = true
		} else {
			// Second case in which a otheroutputdir is possible (if the path is deeper.)
			const relativePath = path.relative(inputDir, folderPath)
			const slashArr = relativePath.split(/\\|\//)
			if(slashArr.length > 1) {
				otherOutputDir = true
				// also set the relativeOutputDir, so we can do the next section in the same way.
				wadConfig.relativeOutputWadDir = slashArr.slice(0, -1).join('/')
			}
		}
		
		if(otherOutputDir) {
			wadConfig.outputWadDir = normalizeFolder(outputWadDir + wadConfig.relativeOutputWadDir)
			ensureFolder(wadConfig.outputWadDir)
		} else {
			wadConfig.outputWadDir = outputWadDir
		}
	}
	
	// console.log(wadConfig)
	return wadConfig
}

/**
* 2. convert the imgs into mips and build the wad
*/
function imgs2mipsAndBuildWad(folderPath, folderName, wadConfig, imgEditDateItems) {
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
	if(pedanticLog && imgs2Convert.length > 0) { console.log(cc.bgblue, 'converted', cc.r) }
	const mipFileNames2Move = convertImagesToMips(imgs2Convert, wadConfig, folderPath, logFolderPath)
	
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


/**
* Convert the images to mips.
* 
* So: before this was really easy... with the new system,
* if there are any images that need to be color converted, we need to do the following:
* 
* 1. convert any unsupported didder format into a didder supported one
* 2. convert the images into their palleted versions
* 3. then we can convert the images into the mips.
* 
* The most straightforward thing would be to do this per image, instead of doing it per step, because the process is more steps.
* 
*/
function convertImagesToMips(imgs2Convert, wadConfig, folderPath, logFolderPath) {
	
	console.log(wadConfig)
	
	const mipFileNames2Move = []
	
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
	
	
	return mipFileNames2Move
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


function folderNameValid(folderName) {
	if(skipFolderNames.indexOf(folderName) != -1) {
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
* Get a list of all the subfolders within a folder except the folders from filterFolderNames
*/
function getFolderObjs(dirPath) {
	
	const folders = []
	const dirItems = fs.readdirSync(dirPath, {withFileTypes: true})
	
	// loop through the dirItems
	for(const item of dirItems) {
		if(item.isDirectory()) {
			
			if(!folderNameValid(item.name)) {
				continue
			}
			const folderObj = {
				name: item.name,
				path: normalizeFolder(dirPath + item.name)
			}
			folders.push(folderObj)
			
			// recurse
			const subFolderObjs = getFolderObjs(folderObj.path)
			arrPushArr(folders, subFolderObjs)
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

/**
* Helper function to push 1 array onto the other array.
* has no limit on elements, like Array.prototype.push.apply
* And works faster than array concat, because it modifies
* arr1
*/
function arrPushArr(arr1, arr2) {
	let i = 0
	const len = arr2.length
	while(i<len) {
		arr1.push(arr2[i])
		i++
	}
}