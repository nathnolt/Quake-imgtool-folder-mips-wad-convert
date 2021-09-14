// 
// This is the config file.
// 
// The inputDir is the folder where your subfolders go that contain the png files.
//   a value of '' means this folder. but you can set it to any relative folder '../../pngs' or an absolute folder c:\\games\\quake1\\textures\\pngs
// 
// The 'outputWadDir' is the root directory of where the output wad files will be placed. the wad 
//   files will have a the names of the corresponding subfolder names with the png files
// 
// 'toolPath' is the location of the imgtool64.exe
// 
// The 'png2mipCommand' and 'buildWadCommand' methods are the way that the imgtool64 is used, you could use this 
//     to customize the arguments for if you have a better knowledge of how this tool works than I.
//
// The 'pedanticLog' gives logs of the individual things that happen, other than whether or not something is built yes / no
// 
// The 'imgtoolLog' shows the output of the imgtool64.exe
// 
module.exports = {
	inputDir: '',
	outputWadDir: 'C:/games/quake1/wads',
	
	toolPath: 'imgtool64.exe',
	
	// The command that is used to convert the pngs into mips
	png2mipCommand(toolPath, pngFilePath) {
		return `${toolPath} --ext mip -c ${pngFilePath}`
	},
	
	// the command to build the wad from a mip folder
	buildWadCommand(toolPath, outputWadDir, wadName, mipDir) {
		return `${toolPath} -w ${outputWadDir}${wadName}.wad ${mipDir}`
	},
	
	pedanticLog: true,
	imgtoolLog: false,
}
