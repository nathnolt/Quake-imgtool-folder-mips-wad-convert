// 
// This script is a little helper program to make using the fte imgtool a little bit more convenient.
// 
// fte imgtool: https://fte.triptohell.info/moodles/win64/
// 
// Usage: 
//   2. create folders inside of this folder (or any other folder, see config.js)
//   2. put (prepared) png files into those folders.
//   3. edit the config.js file to setup your outputWadDir
//   4. on commandline: run: node ./tool.js
// 
// 
// Extra info
//   The tool converts the pixels of the PNG file into the Quake palette, 
//   but you get no configuration for this, You want to prepare the PNG files 
//   with something like Gimp, to convert it into a non fullbright quake palette friendly PNG.
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
const inputDir = normalizeFolder(config.inputDir)
const outputWadDir = normalizeFolder(config.outputWadDir)
const png2mipCommand = config.png2mipCommand
const buildWadCommand = config.buildWadCommand
const imgtoolLog = config.imgtoolLog
const pedanticLog = config.pedanticLog
const toolPath = path.normalize(config.toolPath)
const indentStr1 = '            '


// Check if the imgtool exists
if(!pathExists(toolPath)) {
	console.error(cc.bgred, 'ERROR', cc.r, toolPath, 'not found: download the program from https://fte.triptohell.info/moodles/win64/')
	process.exit(1)
}

// check if the inputdir exists, else create it
if(!pathExists(inputDir)) {
	fs.mkdirSync(inputDir, {recursive: true})
}

// check if the outputdir exists, else create it
if(!pathExists(outputWadDir)) {
	fs.mkdirSync(outputWadDir, {recursive: true})
}

// Actually do work
const folders = getFolderNames(inputDir)
if(folders.length == 0) {
	console.error(cc.bgred, 'ERROR', cc.r, 'could not find any folders in ', inputDir)
	process.exit(1)
}
folders.forEach(doFolder)

/**
* this function checks if the wad has to be built at all.
*/
function doFolder(folderName) {
	const folderPath = normalizeFolder(inputDir + folderName)
	const pngs = getFileNames(folderPath, 'png')
	const pngEditDateItems = getEditDates(folderPath, pngs)
	const wadExists = pathExists(outputWadDir + folderName + '.wad')
	
	let wadHasToBeBuilt = false
	if(wadExists) {
		// compare the edit dates of the pngs and the wad, to check if we need to rebuild the wad
		const lastPngEditDate = getLastEditDate(pngEditDateItems)
		const wadEditDateItems = getEditDates(outputWadDir, [folderName + '.wad'])
		const lastWadEditDate = getLastEditDate(wadEditDateItems)
		wadHasToBeBuilt = lastPngEditDate > lastWadEditDate
	} else {
		wadHasToBeBuilt = true
	}
	
	if(wadHasToBeBuilt) {
		console.log('Building', cc.bgblue, (folderName + '.wad'), cc.r )
		pngs2mipsAndBuildWad(folderName, pngEditDateItems)
	} else {
		console.log(cc.bggrey, (folderName + '.wad'), cc.r, 'up 2 date.')
	}
}

/**
* 2. convert the pngs into mips and build the wad
*/
function pngs2mipsAndBuildWad(folderName, pngEditDateItems) {
	const folderPath = normalizeFolder(inputDir + folderName)
	const mipFolder = normalizeFolder(folderPath + 'mip')
	
	// 1. create the mip folder if it doesn't exist
	if (!pathExists(mipFolder)) {
	    fs.mkdirSync(mipFolder, {recursive: true})
	}
	
	// 2. compare the data of the mip files and the pngs, to determine which ones need to get built.
	let pngs2Convert
	if(pathExists(mipFolder)) {
		// compare the edit dates of the pngs and the mips to check which pngs we need to rebuild to mips
		const mips = getFileNames(mipFolder, 'mip')
		const mipEditDateItems = getEditDates(mipFolder, mips)
		pngs2Convert = comparePngAndMipDateItems(pngEditDateItems, mipEditDateItems)
	} else {
		pngs2Convert = pngEditDateItems
	}
	
	// 3. convert the pngs to mips
	let mipFileNames2Move = []
	if(pedanticLog && pngs2Convert.length > 0) { console.log(cc.bgblue, 'converted', cc.r) }
	for(let i = 0; i < pngs2Convert.length; i++) {
		const pngItem = pngs2Convert[i]
		const png2mipConvertShellCommand = png2mipCommand(toolPath, (folderPath + pngItem.fileName))
		const result = executeShellScript(png2mipConvertShellCommand)
		if(!result.success) {
			console.error(cc.bgred, 'imgtool ERROR', cc.r, 'Converting png to mip:', (folderPath + pngItem.fileName), result.error)
			continue
		}
		
		const mipFileName = removeExtension(pngItem.fileName) + '.mip'
		mipFileNames2Move.push(mipFileName)
		if(pedanticLog) { console.log(`  ${folderPath + pngItem.fileName} -> ${folderPath + mipFileName}`) }
		if(imgtoolLog) { console.log(' ', cc.bgcyan + ' imgtool ' + cc.r, afterFirstLineIndentLog(indentStr1, result.msg)) }
	}
	
	// 4. move the mips to the mip subfolder
	if(pedanticLog && mipFileNames2Move.length > 0) { console.log(cc.bgblue, 'moved', cc.r) }
	for(let i = 0; i < mipFileNames2Move.length; i++) {
		const mipFileName = mipFileNames2Move[i]
		const oldMipPath = folderPath + mipFileName
		const newMipPath = mipFolder + mipFileName
		fs.renameSync(oldMipPath, newMipPath)
		if(pedanticLog) { console.log(`  ${oldMipPath} -> ${newMipPath}`) }
	}
	
	// 5. build the wad file
	const wadBuildShellCommand = buildWadCommand(toolPath, outputWadDir, folderName, mipFolder)
	const result = executeShellScript(wadBuildShellCommand)
	if(!result.success) {
		console.error(cc.bgred, 'imgtool ERROR', cc.r, 'Building wad:', (outputWadDir + folderName), result.error)
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
* We want to return the array of png items that have a newer edit date than the mip items, 
* or build items that don't have a mip item at all.
*/
function comparePngAndMipDateItems(pngEditDateItems, mipEditDateItems) {
	const pngs2convert = []
	for(var i = 0; i < pngEditDateItems.length; i++) {
		const pngItem = pngEditDateItems[i]
		const mipItem = findMip(removeExtension(pngItem.fileName), mipEditDateItems)
		if(!mipItem) {
			pngs2convert.push(pngItem)
		} else {
			// Compare the png editDate to the mip editDate
			if(pngItem.editDate > mipItem.editDate) {
				pngs2convert.push(pngItem)
			}
		}
	}
	return pngs2convert
}

/**
* sub function for comparePngAndMipDateItems.
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
function executeShellScript(string) {
	let msg
	try {
		msg = child_process.execSync(string, {encoding: 'utf8'})
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
function getFileNames(inputDir, filterExtension) {
	const items = fs.readdirSync(inputDir)
	const hasSpecifiedExtensionFn = funcRetEq(getExtension, filterExtension)
	return items.filter(hasSpecifiedExtensionFn)
}

/**
* creates a function that compares the result of the the value called within the returned function to a 
* value set during creation of the function.
*/
function funcRetEq(func, filterExt) {
	return function(x) {
		return func(x) == filterExt
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
	dirPath.charAt(dirPath.lastChar)
	if(dirPath.charAt(dirPath.length - 1) != '/') {
		dirPath = dirPath + '/'
	}
	return path.normalize(dirPath)
}

function pathExists(path) {
	return fs.existsSync(path)
}
