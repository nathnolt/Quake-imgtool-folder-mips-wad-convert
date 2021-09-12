// 
// This script is a little helper program to make using the fte imgtool a little bit more convenient.
// 
// fte imgtool: https://fte.triptohell.info/moodles/win64/
// 
// 
//
// Usage: 
//   1. create a png folder
//   2. create a folder inside of the png folder, this will be the name of the wad
//   2. put (prepared) png files into that folder.
//   3. edit the tool.js file to setup your outputWadDir
//   4. on commandline: run: node ./tool.js
// 
// Extra info
//   The tool converts the pixels of the PNG file into the Quake palette, but you get no configuration for this,
//   You want to prepare the PNG files with something like Gimp, to convert it into a non fullbright quake palette friendly PNG.
// 


// 0. imports
const fs = require('fs')
const { exec } = require("child_process")
const path = require('path')

// 1. define console colors, for prettier logging output
// SEE https://www.lihaoyi.com/post/BuildyourownCommandLinewithANSIescapecodes.html
const cc = {
	bgblue: '\u001b[44m',
	bgred: '\u001b[41m',
	bggrey: '\u001b[48;5;238m',
	bgorange: '\u001b[48;5;202m',
	r: '\u001b[0m',
}

// 2. define some static vars
const inputDir = path.normalize('./png/')
const outputWadDir = path.normalize('C:/games/quake1/wads/_mine/')

// 3. define the commands that are ran.
function png2mipCommand(inputDir, file) {
	return `imgtool64.exe --ext mip -c ${inputDir}/${file}`
}

function buildWadCommand(mipDir, wadName) {
	return `imgtool64.exe -w ${outputWadDir}${wadName}.wad ${mipDir}`
}



// 4. get all the pngs from the png folder
const wadFolders = getFolders(inputDir)
if(wadFolders.length == 0) {
	console.error(cc.bgred, 'ERROR:', cc.r, 'could not find any folders in ', inputDir)
	process.exit(1)
}



const createdMipsPromises = []
for(var i=0; i<wadFolders.length;i++) {
	const wadFolder = wadFolders[i]
	const pngFiles = getFiles(inputDir + wadFolder, 'png')
	if(pngFiles.length == 0) {
		console.warn(cc.bgorange, 'WARN:', cc.r, 'could not find any PNG files in ', wadFolder)
		continue
	}
	createdMipsPromises.push(doSingle(wadFolder, pngFiles))
}



function doSingle(wadFolder, pngFiles) {
	return new Promise((resolve, reject) => {
		console.log(wadFolder, pngFiles)
		// 5. define an array with promises
		const promises = []

		console.log(`${cc.bggrey} Converted ${cc.r}`)
		pngFiles.forEach((file) => {
			const shellStr = png2mipCommand(inputDir + wadFolder, file)
			const promise = executeShellScript(shellStr)
			promise.then(()=>{
				console.log(`  ${file} -> ${removeExtension(file)}.mip`)
			}).catch((err) => {
				console.error(`${cc.bgred}ERROR ${cc.r} @ file ${file} : ${err}`)
			})
			promises.push(promise)
		})
		
		// 6. loop through all promises when they are settled.
		Promise.allSettled(promises).then((results) => {
			results.forEach((result) => {
				if(result.status != 'fulfilled') {
					console.error('result failed', result)
				}
			})
			
			const mipDir = moveMips(inputDir + wadFolder)
			resolve({mipDir: mipDir, wadName: wadFolder})
		})
	})
}



function moveMips(inputDir) {
	const mipDir = inputDir + '/mip'
	if (!fs.existsSync(mipDir)){
	    fs.mkdirSync(mipDir);
	}
	
	console.log('')
	console.log(`${cc.bggrey} Moved ${cc.r}`)
	const mipFiles = getFiles(inputDir, 'mip')
	mipFiles.forEach((mipFile) => {
		const oldMipPath = inputDir + '/' + mipFile
		const newMipPath = mipDir  + '/' + mipFile
		fs.renameSync(oldMipPath, newMipPath)
		console.log(`  ${inputDir}/${mipFile} -> ${mipDir}/${mipFile}`)
	})
	return mipDir
}



Promise.allSettled(createdMipsPromises).then((results) => {
	
	console.log('')
	const wadPromises = []
	for(var i = 0; i < results.length; i++) {
		const result = results[i]
		const obj = result.value
		wadPromises.push(createWad(obj.mipDir, obj.wadName))
	}
	
	Promise.allSettled(wadPromises).then((results) => {
		console.log('')
		console.log(cc.bgblue,'Program done', cc.r)
		process.exit(0)
	})
})



function createWad(mipDir, wadName) {
	return new Promise((resolve, reject) => {
		const wadBuildStr = buildWadCommand(mipDir, wadName)
		executeShellScript(wadBuildStr).then((data) => {
			console.log(`${cc.bgblue} Built ${cc.r} ${outputWadDir}${wadName}.wad`)
			resolve()
		}).catch((err) => {
			console.error(`${cc.bgred} Build error ${cc.r}: ${err}`)
			reject()
		})
	})
}



// ----------------------------
// Define the helper functions
// ----------------------------

function getFolders(dirPath) {
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

function executeShellScript(string, callback) {
	return new Promise((resolve, reject) => {
		exec(string, function(error, stdout, stderr) {
			if (error) {
				reject({type: 'error', error: error})
				return
			}
			
			if (stderr) {
				reject({type: 'stderr', error: stderr})
				return
			}
			
			resolve({data: stdout})
		})
	})
}

function getFiles(inputDir, filterExtension) {
	const items = fs.readdirSync(inputDir)
	const boundedEq = funcRetEq(getExtension, filterExtension)
	return items.filter(boundedEq)
}

function funcRetEq(func, filterExt) {
	return function(x) {
		return func(x) == filterExt
	}
}

function getExtension(inputFile) {
	const dotIndex = inputFile.lastIndexOf('.')
	if(dotIndex == -1) {
		return ''
	} else {
		return inputFile.slice(dotIndex + 1)
	}
}

function removeExtension(inputFile) {
	const dotIndex = inputFile.lastIndexOf('.')
	if(dotIndex == -1) {
		return inputFile
	} else {
		return inputFile.slice(0, dotIndex)
	}
}
