// 
// This is the config file.
// 
// The inputDir is the folder where your subfolders go that contain the image files.
// 
// The 'outputWadDir' is the root directory of where the output wad files will be placed. the wad 
//   files will have the names of the corresponding subfolder names and the textures within it will have the names of the 
//   img files
// 
// 'toolPath' is the location of the imgtool64.exe
// 
// The 'img2mipCommand', 'buildWadCommand' and 'wad2pngsCommand' methods are the way that the imgtool64 is used, you could use this 
//     to customize the arguments for if you have a better knowledge of how this tool works than I.
//
// The 'pedanticLog' gives logs of the individual things that happen, other than whether or not something is built yes / no
// 
// The 'imgtoolLog' shows the output of the imgtool64.exe
// 
module.exports = {
	inputDir: 'input',
	outputWadDir: 'C:/games/quake1/wads',
	
	// The output folder of the reverse method.
	pngOutputWadDir: 'wad-exports',
	
	toolPath: 'imgtool64.exe',
	
	// The command that is used to convert the imgs into mips
	img2mipCommand(relativeToolPathFromImgFolder, imgName) {
		return `${relativeToolPathFromImgFolder} --ext mip -c ${imgName}`
	},
	
	// The command to build the wad from a mip folder
	buildWadCommand(toolPath, outputWadDir, wadName, mipDir) {
		return `${toolPath} -w ${outputWadDir}${wadName}.wad ${mipDir}`
	},
	
	// The command to convert all the wads back into pngs
	wad2pngsCommand(toolPath, outputWadDir, wadName) {
		return `${toolPath} -x --ext png ${outputWadDir}${wadName}.wad`
	},
	
	pedanticLog: true,
	imgtoolLog: false,
}
