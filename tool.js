// 
// This script is a little helper program to make using the fte imgtool a little bit more convenient.
// 
// fte imgtool: https://fte.triptohell.info/moodles/win64/
// 
// 
//
// Usage: 
//   1. create a png and mips folder (if not exist)
//   2. put (prepared) png files into the png folder.
//   3. edit the tool.js file to setup your outputWadPath
//   4. on commandline: run: node ./tool.js
// 
// Extra info
//   The tool converts the pixels of the PNG file into the Quake palette, but you get no configuration for this,
//   You want to prepare the PNG files with something like Gimp, to convert it into a non fullbright quake palette friendly PNG.
// 


// 0. imports
const fs = require('fs')
const { exec } = require("child_process")

// 1. define console colors, for prettier logging output
const cc = {
	bgblue: '\u001b[44m',
	bgred: '\u001b[41m',
	bggrey: '\u001b[48;5;238m',
	r: '\u001b[0m',
}

// 2. define some static vars
const inputDir = './pngs'
const outputDir = './mips'
const outputWadPath = 'C:/games/quake1/wads/_mine/output.wad'


// 3. define the commands that are ran.
function png2mipCommand(inputDir, file) {
	return `imgtool64.exe --ext mip -c ${inputDir}/${file}`
}

function buildWadCommand(outputDir, outputWadPath) {
	return `imgtool64.exe -w ${outputWadPath} ${outputDir}`
}


// 4. get all the pngs from the png folder
const pngFiles = getFiles(inputDir, 'png')

// 5. define an array with promises
const promises = []

console.log(`${cc.bggrey} Converted ${cc.r}`)
pngFiles.forEach((file) => {
	const shellStr = png2mipCommand(inputDir, file)
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
	
	moveMipsFromInputDirToOutputDir()
})

// 7. move the mip files to the output dir
function moveMipsFromInputDirToOutputDir() {
	console.log('')
	console.log(`${cc.bggrey} Moved ${cc.r}`)
	const mipFiles = getFiles(inputDir, 'mip')
	mipFiles.forEach((mipFile) => {
		const oldMipPath = inputDir + '/' + mipFile
		const newMipPath = outputDir + '/' + mipFile
		fs.renameSync(oldMipPath, newMipPath)
		console.log(`  ${inputDir}/${mipFile} -> ${outputDir}/${mipFile}`)
	})
	buildWad()
}

// 8. build the WAD
function buildWad() {
	console.log('')
	const wadBuildStr = buildWadCommand(outputDir, outputWadPath)
	executeShellScript(wadBuildStr).then((data) => {
		console.log(`${cc.bgblue} Built ${cc.r} ${outputWadPath}`)
	}).catch((err) => {
		console.error(`${cc.bgred} Build error ${cc.r}: ${err}`)
	})
}


// ----------------------------
// Define the helper functions
// ----------------------------

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