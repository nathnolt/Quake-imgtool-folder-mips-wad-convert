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
// It also uses: didder 
//   - https://github.com/makeworld-the-better-one/didder
//   - https://github.com/makeworld-the-better-one/didder/blob/main/MANPAGE.md
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


// 
// @todo: instead of doing the comparison of the squashed viewport in the fix16 by checking the difference percentage of each viewport, we should instead get the apect ratio (W / H) and then compare it to the previous one.
// 
// We should also try different scale values than just 2, by getting the aspect ratio, maybe seeing a pattern in the aspect ratio, or maybe getting the common factors of the W / H... Anways, somehow I need to try to do it times 1.5, 1.2 and these other kinds of fractional values, just because it might give us a better result in certain cases.
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
	bgyellow: '\u001b[33;1m\u001b[7m',
	bggreen: '\u001b[32m\u001b[7m',
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
const img2pngCommand = config.img2pngCommand
const didderConvertCommand = config.didderConvertCommand
const imageInfoCommand = config.imageInfoCommand
const imgtoolLog = config.imgtoolLog
const basicLog = config.basicLog
const pedanticLog = config.pedanticLog
const commandLog = config.commandLog
const devLog = config.devLog
const toolPath = path.normalize(config.toolPath)
const didderToolPath = path.normalize(config.didderToolPath)
const indentStr1 = '            '

// The list of allowed config names, in order of trying to find them. 
// the first one found is the one that gets used for that folder.
const allowedConfigNames = [
	'!wadconfig.js',
	'!config.js',
	'wadconfig.js',
	'config.js',
]

const skipFolderNames = [ // The folder names which are skipped
	'.git', 'mip', 'dithered'
] 

const supportedImgtoolTypes = [
	'png', 'tga', 'jpg', 'jpeg',
	'bmp', 'dds', 'ktx', 'ico',
	'psd', 'pfm', 'pbm', 'pgm',
	'ppm', 'hdr', 'pkm', 'astc',
	'pcx'
]

const supportedDidderTypes = [
	'png', 'jpg', 'jpeg',
	'gif', 'bmp',
]

// Define the palette strings for didder. they are defined as space seperated RGB colors (Red Blue Green), where each color is a comma seperated RGB component
// so for example: 225,0,20 meaning 225 Red, 0 Green and 20 Blue
const nonFullbrightPalette = '0,0,0 15,15,15 31,31,31 47,47,47 63,63,63 75,75,75 91,91,91 107,107,107 123,123,123 139,139,139 155,155,155 171,171,171 187,187,187 203,203,203 219,219,219 235,235,235 15,11,7 23,15,11 31,23,11 39,27,15 47,35,19 55,43,23 63,47,23 75,55,27 83,59,27 91,67,31 99,75,31 107,83,31 115,87,31 123,95,35 131,103,35 143,111,35 11,11,15 19,19,27 27,27,39 39,39,51 47,47,63 55,55,75 63,63,87 71,71,103 79,79,115 91,91,127 99,99,139 107,107,151 115,115,163 123,123,175 131,131,187 139,139,203 0,0,0 7,7,0 11,11,0 19,19,0 27,27,0 35,35,0 43,43,7 47,47,7 55,55,7 63,63,7 71,71,7 75,75,11 83,83,11 91,91,11 99,99,11 107,107,15 7,0,0 15,0,0 23,0,0 31,0,0 39,0,0 47,0,0 55,0,0 63,0,0 71,0,0 79,0,0 87,0,0 95,0,0 103,0,0 111,0,0 119,0,0 127,0,0 19,19,0 27,27,0 35,35,0 47,43,0 55,47,0 67,55,0 75,59,7 87,67,7 95,71,7 107,75,11 119,83,15 131,87,19 139,91,19 151,95,27 163,99,31 175,103,35 35,19,7 47,23,11 59,31,15 75,35,19 87,43,23 99,47,31 115,55,35 127,59,43 143,67,51 159,79,51 175,99,47 191,119,47 207,143,43 223,171,39 239,203,31 255,243,27 11,7,0 27,19,0 43,35,15 55,43,19 71,51,27 83,55,35 99,63,43 111,71,51 127,83,63 139,95,71 155,107,83 167,123,95 183,135,107 195,147,123 211,163,139 227,179,151 171,139,163 159,127,151 147,115,135 139,103,123 127,91,111 119,83,99 107,75,87 95,63,75 87,55,67 75,47,55 67,39,47 55,31,35 43,23,27 35,19,19 23,11,11 15,7,7 187,115,159 175,107,143 163,95,131 151,87,119 139,79,107 127,75,95 115,67,83 107,59,75 95,51,63 83,43,55 71,35,43 59,31,35 47,23,27 35,19,19 23,11,11 15,7,7 219,195,187 203,179,167 191,163,155 175,151,139 163,135,123 151,123,111 135,111,95 123,99,83 107,87,71 95,75,59 83,63,51 67,51,39 55,43,31 39,31,23 27,19,15 15,11,7 111,131,123 103,123,111 95,115,103 87,107,95 79,99,87 71,91,79 63,83,71 55,75,63 47,67,55 43,59,47 35,51,39 31,43,31 23,35,23 15,27,19 11,19,11 7,11,7 255,243,27 239,223,23 219,203,19 203,183,15 187,167,15 171,151,11 155,131,7 139,115,7 123,99,7 107,83,0 91,71,0 75,55,0 59,43,0 43,31,0 27,15,0 11,7,0 0,0,255 11,11,239 19,19,223 27,27,207 35,35,191 43,43,175 47,47,159 47,47,143 47,47,127 47,47,111 47,47,95 43,43,79 35,35,63 27,27,47 19,19,31 11,11,15'
const fullPalette = nonFullbrightPalette + ' 43,0,0 59,0,0 75,7,0 95,7,0 111,15,0 127,23,7 147,31,7 163,39,11 183,51,15 195,75,27 207,99,43 219,127,59 227,151,79 231,171,95 239,191,119 247,211,139 167,123,59 183,155,55 199,195,55 231,227,87 127,191,255 171,231,255 215,255,255 103,0,0 139,0,0 179,0,0 215,0,0 255,0,0 255,243,147 255,247,199 255,255,255 159,91,83'

// Check if the imgtool exists
if(!pathExists(toolPath)) {
	console.error(cc.bgred, 'ERROR', cc.r, toolPath, 'not found: download the program from https://fte.triptohell.info/moodles/win64/')
	process.exit(1)
}

// Code for verifying that didder exists
let didderExists = undefined
function verifyDidderExistsWithError() {
	didderExists = pathExists(didderToolPath)
	if(!didderExists) {
		console.error(cc.bgred, 'ERROR', cc.r, didderToolPath, 'not found: download the program from https://github.com/makew0rld/didder/releases')
	}
	return didderExists
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





/**
* Converts the wads back into png files.
*/
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
				console.log(`${cc.bggrey} pngs for ${wadName + '.wad'} ${cc.r} up 2 date`)
				continue
			}
		}
		
		// 5. because we change the cwd, we need to change the toolpath as well
		const relativeToolPath = path.relative(pngFolder, toolPath)
		
		// 6. execute the command
		const wad2pngShellCommand = wad2pngsCommand(relativeToolPath, outputWadDir, wadName)
		if(commandLog) { console.log(`wad 2 png shell command: ${wad2pngShellCommand}`)}
		const result = executeShellScript(wad2pngShellCommand, {cwd: pngFolder})
		if(!result.success) {
			console.error(
				cc.bgred, 'imgtool ERROR', cc.r, 'Converting wad', 
				(logWadPath + wadName + '.wad'), 'to pngs in', logPngFolder, result.error
			)
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


/**
* This is the entry for the default route ( -d ) functionality.
* obviously we want to convert all the folders and sub folders within the inputDir folder into same name wad files.
* 
* but how do we go about doing this?
* well: first we split on the case where you just want a single item, 
* this is the case when you do -d somename where somename is a folder name inside of the inputDir
*/
function defaultRoute() {
	// This is the default -d case
	if(!forceSingleName) {
		const folderObjs = getFolderObjs(inputDir)
		
		if(devLog) { console.log('folders handled: ', folderObjs) }
		
		if(folderObjs.length == 0) {
			console.error(cc.bgred, 'ERROR', cc.r, 'could not find any folders in ', inputDir)
			process.exit(1)
		}
		
		folderObjs.forEach(defaultRoute_handleFolder)
	} else
	// This is the case for forceSingle name being set
	{
		const folderObjs = getFolderObjs(inputDir)
		
		const forceSingleArr = getPathItems(forceSingleName)
		const filteredFolders = folderObjs.filter(function(folderObj) {
			return arrayItemsMatchInOrder(folderObj.parts, forceSingleArr)
		})
		
		filteredFolders.forEach(defaultRoute_handleFolder)
	}
}


/**
* This is the entry function for every folder.
* 
* This function checks if the wad has to be built at all, 
* and then does the building.
* 
*/
function defaultRoute_handleFolder(folderObj) {
	// 1. setup
	const folderName = folderObj.name
	const folderPath = folderObj.path
	const ditheredPath = normalizeFolder(folderPath + 'dithered')
	
	// 2. get the images
	const ditheredImages = getFileNames(ditheredPath, supportedImgtoolTypes)
	const images = getFileNames(folderPath, supportedImgtoolTypes)
	if(images.length == 0 && ditheredImages.length == 0) {
		// console.error(cc.bgred, 'ERROR', cc.r, 'No valid image files found.')
		return
	}
	
	// 3. get the wadConfig
	const wadConfig = getWadConfig(folderPath)
	
	// 5. set a forceRebuild flag on the wadConfig
	wadConfig.forceRebuilt = forceRecreateFlag || wadConfig.forceRebuilt
	
	// 5. get the edit dates of the images, and check if the wad exists.
	const imgEditDateItems = getEditDates(folderPath, images)
	const ditheredEditDates = getEditDates(ditheredPath, ditheredImages)
	const combinedImages = imgEditDateItems.concat(ditheredEditDates)
	const wadExists = pathExists(wadConfig.outputWadDir + folderName + '.wad')
	
	// 6. check if the wad needs to be built at all. if not, we can skip it.
	let wadHasToBeBuilt = false
	if(wadExists && !wadConfig.forceRebuilt) {
		// compare the edit dates of the imgs and the wad, to check if we need to rebuild the wad
		const lastImgEditDate = getLastEditDate(combinedImages)
		const wadEditDateItems = getEditDates(wadConfig.outputWadDir, [folderName + '.wad'])
		const lastWadEditDate = getLastEditDate(wadEditDateItems)
		wadHasToBeBuilt = lastImgEditDate > lastWadEditDate
	} else {
		wadHasToBeBuilt = true
	}
	
	// 7. if the wad does need to be build, go ahead and build it.
	if(wadHasToBeBuilt) {
		console.log('Building', cc.bgblue, (folderName + '.wad'), cc.r )
		buildWadForFolder(folderObj, wadConfig, imgEditDateItems)
	} else {
		console.log(cc.bggrey, (folderName + '.wad'), cc.r, 'up 2 date.')
	}
}

/**
* We need to get the wad config, which is a combination
* of the defaultWadConfig and an optional wadconfig file within any of the proceeding folder paths.
* 
*/
function getWadConfig(folderPath) {
	
	// 1. get the default wadConfig.
	let defaultWadConfig = {}
	if(config.defaultWadConfig) {
		defaultWadConfig = ObjectAssignDeep(defaultWadConfig, config.defaultWadConfig)
	}
	
	const wadConfig = defaultWadConfig
	const propDepth = {}
	wadConfig.propDepth = propDepth
	incrementDefineDepth(wadConfig, propDepth)
	
	// 2. build up an overwriteWadConfig
	// loop through the path chain
	const relativePath = path.relative(inputDir, folderPath)
	const pathItems = getPathItems(relativePath)
	pathItems.unshift('')
	let handlePath = inputDir
	for(const item of pathItems) {
		handlePath = normalizeFolder(handlePath + item)
		
		// overwrite it.
		{
			let overwriteConfig
			
			const configName = allowedConfigNames.find(function(configName) {
				return pathExists(handlePath + configName)
			})
			
			if(configName != undefined) {
				overwriteConfig = require(handlePath + configName)
			}
			
			if(overwriteConfig) {
				incrementDefineDepth(overwriteConfig, propDepth)
				ObjectAssignDeep(wadConfig, overwriteConfig)
			}
		}
	}
	
	
	// 3. handle outputWadDir property
	{
		// 1. check for a wadConfig flag
		let otherOutputDir = false
		
		if(wadConfig.relativeOutputWadDir) {
			otherOutputDir = true
		} else {
			// Second case in which a otheroutputdir is possible (if the path is deeper.)
			const relativePath = path.relative(inputDir, folderPath)
			const slashArr = getPathItems(relativePath)
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
	
	// 4. return it
	return wadConfig
}

/**
* We have wadConfig, but for the scale and fix16AlignedMethod prop, we want to make it
* so that when the width or height (or both) properties are set, it will overwrite
* scale and fix16AlignedMethod. Now... A problem would arise if someone sets width/height properties in 1 directory, 
* but then sets the scale and fix16AlignedMethod in a deeper directory :: the width and height props would propagate downwards.
* if we had a depth level however, which indicated the level a property was defined at: we could alleviate these problems, 
* by making scale / fix16AlignedMethod take precidence, whenever these settings were defined in a deeper level.
* And we could do more as well.
*/
function incrementDefineDepth(wadConfig, propDepth) {
	if(propDepth.currentDepth == undefined) {
		propDepth.currentDepth = 0
	}
	propDepth.currentDepth++
	// 2. loop though all of the keys in the wadConfig (minus propDepth)
	for(let k in wadConfig) {
		propDepth[k] = propDepth.currentDepth
	}
}


// convert a string with slashes into an array of items in between the slashes
function getPathItems(path) {
	return path.split(/\\|\//)
}

// 
// does object.assign, but also caters for deeply nested objects within the root object,
// at the same time it's also used as a simple deep copy
// 
function ObjectAssignDeep(base, extender) {
	for(let k in extender) {
		const extenderVal = extender[k]
		const baseVal = base[k]
		const extenderValType = getType(extenderVal)
		const baseValType = getType(baseVal)
		
		// simple set when type is unequal
		if(extenderValType != baseValType) {
			base[k] = extenderVal
			continue
		}
		
		const extenderTypeIsComplex = extenderValType == 'array' || extenderValType == 'object'
		if(!extenderTypeIsComplex) {
			base[k] = extenderVal
		} else {
			// recurse
			base[k] = ObjectAssignDeep(baseVal, extenderVal)
		}
	}
	return base
}


/**
* 2. build the wad, for 1 folder.
*    these are the steps (for the default setup)
*    1. convert all of the images into pngs
*    2. convert all of the pngs into dithered pngs
*    3. convert all of the dithered pngs into mips
*    4. convert all of the mips into a wad file
* 
* the next thing is my idea of what it would look like, maybe it's possible.
*/
function buildWadForFolder(folderObj, wadConfig, imgEditDateItems) {
	
	const folderName = folderObj.name
	const folderPath = folderObj.path
	const folderParts = folderObj.parts
	
	// 1. check FBR name settings.
	{
		let fullBrightSuffixNameMatchIndex
		const fbrNameSettings = wadConfig.useFullbrightNames.folders
		if(fbrNameSettings.fullbright) {
			fullBrightSuffixNameMatchIndex = nameArrayMatchesArrayWithSuffixes(folderParts, wadConfig.fullBrightNameSuffixes)
		}
		
		let noFullBrightSuffixNameMatchIndex
		if(fbrNameSettings.nofullbright) {
			noFullBrightSuffixNameMatchIndex = nameArrayMatchesArrayWithSuffixes(folderParts, wadConfig.noFullbrightNameSuffixes)
		}
		
		const theSame = fullBrightSuffixNameMatchIndex == noFullBrightSuffixNameMatchIndex
		const notTheSame = !theSame
		
		if(notTheSame) {
			if(fullBrightSuffixNameMatchIndex > noFullBrightSuffixNameMatchIndex) {
				console.log('Found fullbright suffix on folder')
				wadConfig.removeFullbrightPixels = false
			} else {
				console.log('Found nofullbright suffix on folder')
				wadConfig.removeFullbrightPixels = true
			}
		}
	}
	
	// 2. Do the extra steps.
	if(!wadConfig.skipDithering_nofullbright) {
		// skip some steps I guess.
		convertUnsupportedToPng(folderPath, imgEditDateItems, wadConfig)
		convertToFullBrightFixedDithered(folderPath, wadConfig)
		normalizeFolder(folderPath + 'dithered')
	}
	
	buildMips(folderPath, wadConfig)
	buildWadFromMips(folderPath, folderName, wadConfig)
}


function convertUnsupportedToPng(folderPath, imgEditDateItems, wadConfig) {
	if(basicLog) { console.log('converting unsupported images to png') }
	// 0. define some vars for later usage
	const relativeToolPath = path.relative(folderPath, toolPath)
	const logFolderPath = getLogPath(thisPath, folderPath)
	
	// 1. loop through a map, to get png item, and non png item.
	const map = convertDateItemsToMap(imgEditDateItems)
	// console.log('map', map)
	for(let name in map) {
		const sameNamedImages = map[name]
		
		// 2. give an error when there are more than 2 items
		if(sameNamedImages.length > 2 && pedanticLog) {
			console.warn(`${cc.bgyellow} WARN ${cc.r} Item with name ${name} has more than 2 items. This could lead to unexpected behaviour.`)
		}
		
		// 3. get the supported item and the not supported item
		let supportedItem
		let notSupportedItem
		for(const dateItem of sameNamedImages) {
			const ext = getExtension(dateItem.fileName)
			if(supportedDidderTypes.includes(ext)) {
				supportedItem = dateItem
			} else {
				notSupportedItem = dateItem
			}
		}
		
		// 4. check if the png has to be built, this is based on state and existence of supported / notSupportedItem
		let buildPng = true
		if(notSupportedItem != undefined)
		// 4.A. if there is a notSupportedItem item
		{
			if(supportedItem != undefined) {
				// check if the supportedItem's date is newer, and if so, turn buildPng to false
				if(!wadConfig.forceRebuilt && supportedItem.editDate > notSupportedItem.editDate) {
					buildPng = false
				}
			}
			
			if(wadConfig?.textureOpts?.[name]?.skipDithering_nofullbright) {
				buildPng = false
			}
			
		} else
		// 4.B. since there isn't a notSupportedItem, it means there is a supportedItem, and it's the only item.
		//      therefore, we don't have to build a png.
		{
			buildPng = false
		}
		
		// 5. If buildPng is true, build a PNG
		if(buildPng) {
			console.log(`converting ${notSupportedItem.fileName} -> .png`)
			const shellCommand = img2pngCommand(relativeToolPath, notSupportedItem.fileName)
			if(commandLog) { console.log(`img 2 png command: ${shellCommand}`)}
			const result = executeShellScript(shellCommand, {cwd: folderPath})
			if(!result.success) {
				console.error(cc.bgred, 'imgtool ERROR', cc.r, 'Converting:', (logFolderPath + notSupportedItem.fileName), result.error)
				continue
			}
		}
	}
}


/**
* This step runs the didder code.
* this handles the dithering and the fullbright fixing.
*/
function convertToFullBrightFixedDithered(folderPath, wadConfig) {
	if(basicLog) { console.log('dithering items') }
	
	// check if didder exists.
	if(didderExists == undefined) {
		didderExists = verifyDidderExistsWithError()
	}
	if(!didderExists) {
		console.log('Didder was not found, skipping dithering.')
		return
	}
	
	// 1. reobtain the items within the current folder path
	const images = getFileNames(folderPath, supportedDidderTypes)
	
	// 2. also obtain the files from the dithered folder.
	const ditherFolderPath = normalizeFolder(folderPath + 'dithered')
	const ditherLogFolderPath = getLogPath(thisPath, ditherFolderPath)
	ensureFolder(ditherFolderPath)
	const ditheredImages = getFileNames(ditherFolderPath, supportedImgtoolTypes)
	
	// 3. get the dates.
	const imgEditDateItems = getEditDates(folderPath, images)
	const ditheredDateItems = getEditDates(ditherFolderPath, ditheredImages)
	
	// console.log('imgEditDateItems', imgEditDateItems)
	// console.log('ditheredDateItems', ditheredDateItems)
	
	const relativeDidderToolPath = path.relative(folderPath, didderToolPath)
	const relativeToolPath = path.relative(folderPath, toolPath)
	const logFolderPath = getLogPath(thisPath, folderPath)
	
	
	// console.error('there are items in ditheredDateItems', ditheredDateItems, imgEditDateItems)
	dateItemsExec(imgEditDateItems, ditheredDateItems, wadConfig.forceRebuilt, function(fromItem) {
		const name = removeExtension(fromItem.fileName)
		
		// set textureOpts obj
		const textureOpts = wadConfig?.textureOpts?.[name]
		
		// get the depth
		const propDepth = Object.assign({}, wadConfig.propDepth)
		if(textureOpts) {
			incrementDefineDepth(textureOpts, propDepth) // inc
		}
		
		// start handling the params.
		if(textureOpts?.skipDithering_nofullbright) {
			// we can remove the file from the dithered folder, when it exists
			const ditheredFilePath = ditherFolderPath + fromItem.fileName
			if(pathExists(ditheredFilePath)) {
				console.log('removing', ditherLogFolderPath + fromItem.fileName)
				removeFile(ditheredFilePath)
			}
			return
		}
		
		// get the palette
		let palette = fullPalette
		if(wadConfig.removeFullbrightPixels) {
			palette = nonFullbrightPalette
		}
		if(textureOpts?.removeFullbrightPixels != undefined) {
			if(textureOpts?.removeFullbrightPixels) {
				palette = nonFullbrightPalette
			} else {
				palette = fullPalette
			}
		}
		
		// Fullbright overwrite based on fileName suffix
		{
			let fullBrightSuffixNameMatchIndex
			const fbrNameSettings = wadConfig.useFullbrightNames.files
			if(fbrNameSettings.fullbright) {
				fullBrightSuffixNameMatchIndex = nameArrayMatchesArrayWithSuffixes([name], wadConfig.fullBrightNameSuffixes)
			}
			
			let noFullBrightSuffixNameMatchIndex
			if(fbrNameSettings.nofullbright) {
				noFullBrightSuffixNameMatchIndex = nameArrayMatchesArrayWithSuffixes([name], wadConfig.noFullbrightNameSuffixes)
			}
			
			const theSame = fullBrightSuffixNameMatchIndex == noFullBrightSuffixNameMatchIndex
			const notTheSame = !theSame
			
			if(notTheSame) {
				if(fullBrightSuffixNameMatchIndex > noFullBrightSuffixNameMatchIndex) {
					console.log('Found fullbright suffix on file')
					palette = fullPalette
				} else {
					console.log('Found nofullbright suffix on file')
					palette = nonFullbrightPalette
				}
			}
		}
		
		// custom palette overwrite support
		let customPalette = wadConfig.customPalette
		if(textureOpts?.customPalette != undefined) {
			customPalette = textureOpts?.customPalette
		}
		if(customPalette != undefined) {
			palette = customPalette
		}
		
		// get the algorithm
		let algorithm = wadConfig.algorithm
		if(textureOpts?.algorithm != undefined) {
			algorithm = textureOpts?.algorithm
		}
		if(algorithm == undefined) {
			console.log('algorithm not defined. defaulting to FloydSteinberg')
			algorithm = 'edm FloydSteinberg'
		}
		
		// strength
		let strengthStr = ''
		let strength = wadConfig.strength
		if(textureOpts?.strength != undefined) {
			strength = textureOpts?.strength
		}
		if(strength != undefined) {
			strengthStr = `-s ${strength}`
		}
		
		// grayscale
		let grayscaleStr = ''
		let grayscale = wadConfig.grayscale
		if(textureOpts?.grayscale != undefined) {
			grayscale = textureOpts?.grayscale
		}
		if(grayscale) {
			grayscaleStr = '-g'
		}
		
		// recolor.
		let recolorStr = ''
		let recolor = wadConfig.recolor
		if(textureOpts?.recolor != undefined) {
			recolor = textureOpts?.recolor
		}
		if(recolor != undefined) {
			recolorStr = `-r "${recolor}"`
		}
		
		// saturation
		let saturationStr = ''
		let saturation = wadConfig.saturation
		if(textureOpts?.saturation != undefined) {
			saturation = textureOpts?.saturation
		}
		if(saturation != undefined) {
			saturationStr = `--saturation ${saturation}`
		}
		
		// brightness
		let brightnessStr = ''
		let brightness = wadConfig.brightness
		if(textureOpts?.brightness != undefined) {
			brightness = textureOpts?.brightness
		}
		if(brightness != undefined) {
			brightnessStr = `--brightness ${brightness}`
		}
		
		// contrast
		let contrastStr = ''
		let contrast = wadConfig.contrast
		if(textureOpts?.contrast != undefined) {
			contrast = textureOpts?.contrast
		}
		if(contrast != undefined) {
			contrastStr = `--contrast ${contrast}`
		}
		
		
		// width
		
		let width = wadConfig.width
		if(textureOpts?.width != undefined) {
			width = textureOpts?.width
		}
		
		// height
		let height = wadConfig.height
		if(textureOpts?.height != undefined) {
			height = textureOpts?.height
		}

		
		// get the define depth for width and height props. This way, 
		// we know whether or not to do scale and fix16Aligned
		const largestWidthHeightDepth = Math.max((propDepth.width||0), (propDepth.height||0))
		
		// used for scale and fix16aligncode
		let sizeInfo
		
		// scale
		let scale = wadConfig.scale
		if(textureOpts?.scale != undefined) {
			scale = textureOpts?.scale
		}
		const scaleDepth = propDepth.scale||0
		
		if(scale != undefined && scaleDepth > largestWidthHeightDepth) {
			
			// Convert it to the array syntax anyway
			if(!Array.isArray(scale)) {
				scale = [scale]
			}
			
			// Convert it to the double array value
			if(scale.length == 1) {
				scale.push(scale[0])
			}
			
			// get info about the size
			if(sizeInfo == undefined) {
				sizeInfo = getImageSizeInfo(relativeToolPath, fromItem.fileName, folderPath)
			}
			if(sizeInfo == undefined) { return }
			
			// scale it
			sizeInfo.width = sizeInfo.width * scale[0]
			sizeInfo.height = sizeInfo.height * scale[1]
		}
		
		
		let overwrite_fix16AlignedSmart_maxTexSize
		
		// maxWidth
		let maxWidth = wadConfig.maxWidth
		if(textureOpts?.maxWidth != undefined) {
			maxWidth = textureOpts?.maxWidth
		}
		const maxWidthDepth = propDepth.maxWidth||0
		
		// maxHeight
		let maxHeight = wadConfig.maxHeight
		if(textureOpts?.maxHeight != undefined) {
			maxHeight = textureOpts?.maxHeight
		}
		const maxHeightDepth = propDepth.maxHeight||0
		
		if(
			(maxWidth != undefined && maxWidthDepth > largestWidthHeightDepth) ||
			(maxHeight != undefined && maxHeightDepth > largestWidthHeightDepth)
		) {
			// get info about the size
			if(sizeInfo == undefined) {
				sizeInfo = getImageSizeInfo(relativeToolPath, fromItem.fileName, folderPath)
			}
			if(sizeInfo == undefined) { return }
			
			
			// To fix issues with fix16 making it too large, we set fix16AlignedSmart_maxTexSize
			overwrite_fix16AlignedSmart_maxTexSize = Math.max(maxWidth||0, maxHeight||0)
			
			const imageAspectRatio = sizeInfo.width / sizeInfo.height
			
			// set the vars so that if they aren't defined, they become the size of the current image, 
			// so it's not the factor that will downscale it.
			if(maxWidth == undefined) { maxWidth = sizeInfo.width }
			if(maxHeight == undefined) { maxHeight = sizeInfo.height }
			
			if(
				maxWidth >= sizeInfo.width &&
				maxHeight >= sizeInfo.height
			) {
				// we don't need to do anything in this case, because both sizes are larger
			} else {
				const maxSizeAspectRatio = maxWidth / maxHeight
				
				// 
				let scaleFactor
				if(imageAspectRatio > maxSizeAspectRatio) {
					// scale the width
					scaleFactor = maxWidth / sizeInfo.width
				} else {
					// scale the height
					scaleFactor = maxHeight / sizeInfo.height
				}
				
				sizeInfo.width = sizeInfo.width * scaleFactor
				sizeInfo.height = sizeInfo.height * scaleFactor
			}
		}
		
		
		// fix16AlignedMethod code.
		let fix16AlignedMethod = wadConfig.fix16AlignedMethod
		if(textureOpts?.fix16AlignedMethod != undefined) {
			fix16AlignedMethod = textureOpts?.fix16AlignedMethod
		}
		
		
		const fix16AlignedMethodDepth = propDepth.fix16AlignedMethod||0
		
		if(fix16AlignedMethod != undefined && fix16AlignedMethod != 'none' && fix16AlignedMethodDepth > largestWidthHeightDepth) {
			
			const valids = [
				'stretch',
				'scale',
				'smart'
			]
			
			if(valids.indexOf(fix16AlignedMethod) == -1) {
				console.warn(`${cc.bgyellow} WARN ${cc.r} invalid fix16AlignedMethod: ${fix16AlignedMethod}`)
			} else {
				
				// valid fix16AlignedMethod value
				if(sizeInfo == undefined) {
					sizeInfo = getImageSizeInfo(relativeToolPath, fromItem.fileName, folderPath)
				}
				if(sizeInfo == undefined) { return }
				
				const multiple = wadConfig.fix16Aligned_multiple || 16
				if(
					sizeInfo.width % multiple == 0 &&
					sizeInfo.height % multiple == 0
				) {
					// Nothing needs to be done to fix it, because the image currently is already exactly a multiple 
				    // of the multiple
				} else {
					
					const halfMultiple = multiple / 2
					function fixStretchComponent(curSize, restVal) {
						if(restVal < halfMultiple) {
							let newVal = curSize - restVal
							if(newVal == 0) {
								newVal = multiple
							}
							return newVal
						} else {
							const inc = multiple - restVal
							return curSize + inc
						}
					}
					
					let beforeSize
					if(pedanticLog) {
						beforeSize = Object.assign({}, sizeInfo)
					}
					
					if(fix16AlignedMethod == 'stretch') {
						
						const restWidth = sizeInfo.width % multiple
						const restHeight = sizeInfo.height % multiple

						
						sizeInfo.width = fixStretchComponent(sizeInfo.width, restWidth)
						sizeInfo.height = fixStretchComponent(sizeInfo.height, restHeight)
						
					} else
					if(fix16AlignedMethod == 'scale') {
						let restWidth = sizeInfo.width % multiple
						let restHeight = sizeInfo.height % multiple
						
						let lpc = 0
						while(restWidth != 0 || restHeight != 0) {
							if(lpc++ > 50) { // infinite loop prevention counter
								console.error('broken out of scale method loop')
								process.exit(1)
							}
							
							// double the size
							sizeInfo.width = sizeInfo.width * 2
							sizeInfo.height = sizeInfo.height * 2
							
							// recalculate
							restWidth = sizeInfo.width % multiple
							restHeight = sizeInfo.height % multiple
						}
						
					} else { // smart
						
						// the 10 is chosen arbitrarily. we devide by 100 because we want it as a fraction.
						const stretchTreshold = (wadConfig.fix16AlignedSmart_stretchThresholdPercentage || 10) / 100
						const maxTexSize = overwrite_fix16AlignedSmart_maxTexSize || wadConfig.fix16AlignedSmart_maxTexSize || 512
						
						// the code is going to be as follows:
						// it will loop untill the fraction is below the treshold.

						
						let lpc = 0
						while(true) {
							if(lpc++ > 50) { // infinite loop prevention counter
								console.error('broken out of smart method loop')
								process.exit(1)
							}
							
							const restWidth = sizeInfo.width % multiple
							const restHeight = sizeInfo.height % multiple
							
							// get proposed values from stretch results
							const newWidth = fixStretchComponent(sizeInfo.width, restWidth)
							const newHeight = fixStretchComponent(sizeInfo.height, restHeight)
							
							// get the stretch offsets
							const widthOffset = Math.abs((newWidth - sizeInfo.width) / sizeInfo.width)
							const heightOffset = Math.abs((newHeight - sizeInfo.height) / sizeInfo.height)
							const totalStretchOffset = widthOffset + heightOffset
							
							// check if they are below the treshold
							if(totalStretchOffset < stretchTreshold) {
								sizeInfo.width = newWidth
								sizeInfo.height = newHeight
								break
							} else {
								// Double the size
								const doubleWidth = sizeInfo.width * 2
								const doubleHeight = sizeInfo.height * 2
								
								// but if this new size is too large
								if(Math.max(doubleWidth, doubleHeight) >= maxTexSize) { // maybe > instead of >=
									sizeInfo.width = newWidth
									sizeInfo.height = newHeight
									break
								} else {
									// else choose the new size, and test again.
									sizeInfo.width = doubleWidth
									sizeInfo.height = doubleHeight
								}
							}
							
						}
						
					}
					
					if(pedanticLog) {
						const beforeStr = beforeSize.width + ',' + beforeSize.height
						const afterStr = sizeInfo.width + ',' + sizeInfo.height
						console.log(`resized ${name} with method ${fix16AlignedMethod} to be ${multiple} aligned (${beforeStr} -> ${afterStr})`)
					}
					
				}
			}
		}
		
		
		// set the width and height params, based on sizeInfo
		if(sizeInfo != undefined) {
			// not sure if round is the best, or if I should do floor
			width = Math.round(sizeInfo.width)
			height = Math.round(sizeInfo.height)
		}
		
		
		// set the width and height strings based on width and height vars
		//
		// (either from width / height props, or scale, or fix16AlignedMethod, 
		// or a combination of scale and fix16AlignedMethod)
		// 
		let widthStr = ''
		if(width != undefined) {
			widthStr = `-x ${width}`
		}
		
		let heightStr = ''
		if(height != undefined) {
			heightStr = `-y ${height}`
		}
		
		
		// upscale (this happens after the dithering)
		let upscaleStr = ''
		let upscale = wadConfig.upscale
		if(textureOpts?.upscale != undefined) {
			upscale = textureOpts?.upscale
		}
		if(upscale != undefined) {
			upscaleStr = `-u ${upscale}`
		}
		
		
		
		// extra str
		let extraStr = ''
		const extraStrItems = [
			strengthStr,
			grayscaleStr,
			recolorStr,
			saturationStr,
			brightnessStr,
			contrastStr,
			widthStr,
			heightStr,
			upscaleStr,
		]
		for(const extraStrItem of extraStrItems) {
			if(extraStrItem != '') {
				// add a space before the extraStrItem
				if(extraStr != '') { extraStr += ' ' }
				extraStr += extraStrItem
			}
		}
		// add a space before the next command line argument
		if(extraStr != '') { extraStr += ' ' }
		
		// build it.
		if(pedanticLog){ console.log(`dithering ${fromItem.fileName}`) }
		
		const shellCommand = didderConvertCommand(relativeDidderToolPath, fromItem.fileName, name, palette, algorithm, extraStr)
		if(commandLog) { console.log(`png 2 dithered command: ${shellCommand}`)}
		const result = executeShellScript(shellCommand, {cwd: folderPath})
		if(!result.success) {
			console.error(cc.bgred, 'didder ERROR', cc.r, 'Converting:', (logFolderPath + fromItem.fileName), result.error)
			return
		}
	})
}


/**
*
*/
function buildMips(folderPath, wadConfig) {
	
	// 1. build up a list of files to parse, based on the files inside of folderPath and 
	//    the files inside of the dithered folder, and also get the imgEditDateItems
	const ditheredFolderPath = normalizeFolder(folderPath + 'dithered')
	const normalImages = getFileNames(folderPath, supportedImgtoolTypes)
	const ditheredImages = getFileNames(ditheredFolderPath, supportedImgtoolTypes)
	
	// 2. do a smart merge of both of these lists.
	const normalEditDates = getEditDates(folderPath, normalImages)
	const ditheredEditDates = getEditDates(ditheredFolderPath, ditheredImages)
	const combined = normalEditDates.concat(ditheredEditDates)
	
	// 3. loop through the chosen items, and get the dithered item, if it exists, 
	//    else just get the first item in the default folder.
	let chosenDateItemImages = []
	const map = convertDateItemsToMap(combined)
	for(let imgName in map) {
		const imgArr = map[imgName]
		// search for dithered item in imgArr
		let foundImg = imgArr.find(imgItem => { return imgItem.folderPath == ditheredFolderPath })
		if(foundImg == undefined) {
			// choose the first item
			foundImg = imgArr[0]
		}
		chosenDateItemImages.push(foundImg)
	}
	
	// 4. get the mip date items
	const mipFolderPath = normalizeFolder(folderPath + 'mip')
	ensureFolder(mipFolderPath)
	const mipFolderLogPath = getLogPath(thisPath, mipFolderPath)
	const mipImages = getFileNames(mipFolderPath, ['mip'])
	const mipDateItems = getEditDates(mipFolderPath, mipImages)
	
	// 5. compare the editDate of mip items with the chosenDateItems
	//    all mips which are older, or non existing, will be build.
	const toBuildDateItems = []
	for(const chosenItem of chosenDateItemImages) {
		// find the mipItem for a chosenItem
		const chosenItemName = removeExtension(chosenItem.fileName)
		const chosenItemMipName = chosenItemName + '.mip'
		const mipItem = mipDateItems.find(mipItem => { return mipItem.fileName == chosenItemMipName })
		
		// If there is no mip, or the editDate of chosenItem is later than the mipItem, it needs to get build
		if(wadConfig.forceRebuilt || mipItem == undefined || chosenItem.editDate > mipItem.editDate) {
			toBuildDateItems.push(chosenItem)
			continue
		}
	}
	
	// Handle fullbright / nofullbright suffix stuff for mips.
	// Compare names, with suffix names, and non suffix names, and so on.
	// Basically uses the 1 with last editDate. with it's base name.
	// after this we have an object, with the baseName, and the item which we want to mip.
	const allSuffixes = wadConfig.fullBrightNameSuffixes.concat(wadConfig.noFullbrightNameSuffixes)
	const baseNamedToBuildItems = {}
	for(const item of toBuildDateItems) {
		const name = removeExtension(item.fileName)
		const suffixLessName = stripSuffixes(name, allSuffixes)
		if(baseNamedToBuildItems[suffixLessName] == undefined) {
			baseNamedToBuildItems[suffixLessName] = []
		}
		baseNamedToBuildItems[suffixLessName].push(item)
	}
	for(const baseName in baseNamedToBuildItems) {
		const array = baseNamedToBuildItems[baseName]
		if(array.length > 1) {
			
			// get the item with the last editDate
			let lastEditDate = array[0].editDate
			let lastEditIndex = 0
			for(let i = 1; i < array.length; i++) {
				const item = array[i]
				if(item.editDate > lastEditDate) {
					lastEditDate = item.editDate
					lastEditIndex = i
				}
			}
			const lastItem = array[lastEditIndex]
			
			// set the array such that it only contains that item.
			baseNamedToBuildItems[baseName] = [lastItem]
		}
		
		// remove the array from the baseNamedToBuildItems
		baseNamedToBuildItems[baseName] = baseNamedToBuildItems[baseName][0]
	}
	
	
	
	// 6. Because we're converting items from 2 different paths, we also have to deal with 
	//    2 different starting paths.
	const relativePaths = {
		[ditheredFolderPath]: path.relative(ditheredFolderPath, toolPath),
		[folderPath]: path.relative(folderPath, toolPath),
	}
	const logFolderPaths = {
		[ditheredFolderPath]: getLogPath(thisPath, ditheredFolderPath),
		[folderPath]: getLogPath(thisPath, folderPath),
	}
	
	// 7. loop through the items, and build the mips.
	if(basicLog) { console.log('mipping items') }
	for(const baseName in baseNamedToBuildItems) {
		const dateItem = baseNamedToBuildItems[baseName]
		if(pedanticLog){ console.log(`  ${dateItem.fileName}`) }
		const shellCommand = img2mipCommand(relativePaths[dateItem.folderPath], dateItem.fileName)
		if(commandLog) { console.log(`img 2 mip shell command: ${shellCommand}`)}
		const result = executeShellScript(shellCommand, {cwd: dateItem.folderPath})
		if(!result.success) {
			console.error(
				cc.bgred, 'imgtool ERROR', cc.r, 'Converting img to mip:',
				(logFolderPaths[dateItem.folderPath] + imgItem.fileName), result.error
			)
			continue
		}
	}
	
	// 8. move all the mips to the mip sub folder of folderPath
	const normalFolderMips = getFileNames(folderPath, ['mip'])
	const ditheredFolderMips = getFileNames(ditheredFolderPath, ['mip'])
	
	const normalFolderMipDateItems = getEditDates(folderPath, normalFolderMips)
	const ditheredFolderMipDateItems = getEditDates(ditheredFolderPath, ditheredFolderMips)
	const combinedMips = normalFolderMipDateItems.concat(ditheredFolderMipDateItems)
	if(basicLog) { console.log('moving mips...') }
	for(const mipItem of combinedMips) {
		
		const name = removeExtension(mipItem.fileName)
		const suffixLessName = stripSuffixes(name, allSuffixes)
		
		const oldMipPath = mipItem.folderPath + mipItem.fileName
		const newMipPath = mipFolderPath + suffixLessName + '.mip'
		fs.renameSync(oldMipPath, newMipPath)
		if(pedanticLog) { console.log(`  ${logFolderPaths[mipItem.folderPath] + mipItem.fileName} -> ${mipFolderLogPath + suffixLessName + '.mip'}`) }
	}
	
}



/**
* build the wad from the files in the mip folder.
*/
function buildWadFromMips(folderPath, folderName, wadConfig) {
	const mipFolderPath = normalizeFolder(folderPath + 'mip')
	
	const outputLogPath = getLogPath(thisPath, wadConfig.outputWadDir)
	const mipLogPath = getLogPath(thisPath, mipFolderPath)
	
	// 5. build the wad file
	const shellCommand = buildWadCommand(toolPath, outputLogPath, folderName, mipLogPath)
	if(commandLog) { console.log(`wad build shell command: ${shellCommand}`)}
	const result = executeShellScript(shellCommand, {cwd: thisPath})
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
		if(commandLog) { console.log(`img 2 mip shell command: ${img2mipConvertShellCommand}`)}
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


// 
// More specific helper functions
// 


// executed in 2 different places, to get the size info of the image.
function getImageSizeInfo(relativeToolPath, fileName, folderPath) {
	
	// execute the command
	const shellCommand = imageInfoCommand(relativeToolPath, fileName)
	if(commandLog) { console.log(`get info: ${shellCommand}`)}
	const result = executeShellScript(shellCommand, {cwd: folderPath})
	if(!result.success) {
		console.error(cc.bgred, 'get info ERROR', cc.r, (logFolderPath + fileName), result.error)
		return
	}
	
	// parse the msg
	const msgArr = result.msg.split(/\s+/)
	const sizeStr = msgArr[msgArr.length-2]
	const sizes = sizeStr.split('*')
	
	// return the size
	return {
		width: Number(sizes[0]),
		height: Number(sizes[1])
	}
}


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
* Convert an array of dateItems into a map, where the removed 
* extension of the fileName is the key
*/
function convertDateItemsToMap(dateItems) {
	const map = {}
	
	for(const item of dateItems) {
		const name = removeExtension(item.fileName)
		let mapItem = map[name]
		if(mapItem == undefined) {
			mapItem = []
			map[name] = mapItem
		}
		map[name].push(item)
	}
	
	return map
}

/**
* execute the fn, when the fromItem is newer than the toItem, 
* or if the toItem doesn't exist for a fromItem
*/
function dateItemsExec(from, to, forceRecreate, fn) {
	for(const fromItem of from) {
		// search toItem
		const toItem = to.find((toItem) => toItem.fileName == fromItem.fileName)
		if(forceRecreate || toItem == undefined || fromItem.editDate > toItem.editDate) {
			fn(fromItem)
		}
	}
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
			
			// Add the parts, so something like C:/quakeDev/wads/ will become ['c:', 'quakeDev', 'wads']
			folderObj.parts = folderObj.path.split(path.sep)
			if(folderObj.parts[folderObj.parts.length-1] == '') {
				folderObj.parts.pop()
			}
			
			// Push into folders array
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
	if(!pathExists(inputDir)) {
		return []
	}
	const items = fs.readdirSync(inputDir)
	const hasSpecifiedExtensionFn = funcRetEq(getExtension, filterExtensionArr)
	return items.filter(hasSpecifiedExtensionFn)
}

/**
* creates a function that compares the result of the value called within the returned function to a 
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
* Normalize a folder.
* Give an input like './bla' and it will normalise the path and add a / at the end
* It will return an absolute path.
* so the end result could become c:/games/bla/
*/
function normalizeFolder(dirPath) {
	dirPath = path.resolve(dirPath)
	dirPath = dirPath.replace(/\\/g, '/')
	if(dirPath.charAt(dirPath.length - 1) != '/') {
		dirPath = dirPath + '/'
	}
	return path.normalize(dirPath)
}

/**
* Get a logPath from the specified thisPath and folderPath.
* Basically, it will return the way to get to the folderPath from the thisPath.
* It kinda looks like the normalizeFolder function
*/
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
* removes a file
*/
function removeFile(path) {
	fs.unlinkSync(path)
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

/**
* get the type of a thing.
*/
function getType(thing) {
	return Object.prototype.toString.call(thing).slice(8, -1).toLowerCase()
}

/**
 * Check if an array of names matches with an array of suffixes
 * If any name matches, the index will become the index of the name which matches.
 * We're executing this within the context of paths,
 * And because we have 2 competing results, both could match, so we need to only consider the last.
 */
function nameArrayMatchesArrayWithSuffixes(names, suffixArray) {
	let nameIndexMatches = -1
	for(let i = 0; i < names.length; i++) {
		const name = names[i]
		let nameMatches = false
		
		for(const suffix of suffixArray) {
			if(suffix === '') {
				continue
			}
			if(name.endsWith(suffix)) {
				nameMatches = true
			}
		}
		
		if(nameMatches) {
			nameIndexMatches = i
		}
	}
	
	return nameIndexMatches
}

/**
 * Returns whether the items in find appear in array, in that order
 * 
 * example:
 * array: [1,2,3,4,5,6,7,8]
 * find: [4,5]
 * output: true
 */
function arrayItemsMatchInOrder(array, find) {
	let findIndex = 0
	for(const item of array) {
		if(item == find[findIndex]) {
			findIndex++
			if(findIndex == find.length) {
				return true
			}
		} else {
			findIndex = 0
		}
	}
	return false
}

/**
 * Strips a matching suffix from suffixes off of a name
 */
function stripSuffixes(name, suffixes) {
	for(const suffix of suffixes) {
		if(suffix === '') {
			continue
		}
		if(name.endsWith(suffix)) {
			return name.slice(0, -suffix.length)
		}
	}
	return name
}