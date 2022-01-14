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
	pngOutputDir: 'wad-exports',
	
	toolPath: 'imgtool64.exe',
	didderToolPath: 'didder_1.1.0.exe',
	
	defaultWadConfig: {
		// NOT YET SUPPORTED:
		removeFullbrightsFromAllwads: false,
		
		// dither algorithms
		// - none
		// - Atkinson
		// - Atkinson
		// - Atkinson
		// - Atkinson
		// see diddler...
		// defaultDitherAlgorithm: 'Atkinson',
	},
	
	pedanticLog: true,
	imgtoolLog: false,
	
	
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
	
	
	// In this example, the image1.tga is convert into a png variant. We have to do this step before we execute diddler,
	// for every format which diddler does not support.
	// I suppose we have a convertion array with every extension that needs to be converted, where they will all be converted into a png.
	convertFormat(toolPath, inputName) {
		return `.\imgtool64.exe -c --ext png .\image1.tga`
	},
	
	diddlerConvert(toolPath, outputDir, inputName, palette, algorithm) {
		// Todo: make this work.
		return ".\didder_1.1.0.exe -i .\img1.png -o output.png -p '0,0,0 255,0,255' bayer 4x4"
		// .\didder_1.1.0.exe -i .\image.jpeg -o output.png -p '0,0,0 15,15,15 31,31,31 47,47,47 63,63,63 75,75,75 91,91,91 107,107,107 123,123,123 139,139,139 155,155,155 171,171,171 187,187,187 203,203,203 219,219,219 235,235,235 15,11,7 23,15,11 31,23,11 39,27,15 47,35,19 55,43,23 63,47,23 75,55,27 83,59,27 91,67,31 99,75,31 107,83,31 115,87,31 123,95,35 131,103,35 143,111,35 11,11,15 19,19,27 27,27,39 39,39,51 47,47,63 55,55,75 63,63,87 71,71,103 79,79,115 91,91,127 99,99,139 107,107,151 115,115,163 123,123,175 131,131,187 139,139,203 0,0,0 7,7,0 11,11,0 19,19,0 27,27,0 35,35,0 43,43,7 47,47,7 55,55,7 63,63,7 71,71,7 75,75,11 83,83,11 91,91,11 99,99,11 107,107,15 7,0,0 15,0,0 23,0,0 31,0,0 39,0,0 47,0,0 55,0,0 63,0,0 71,0,0 79,0,0 87,0,0 95,0,0 103,0,0 111,0,0 119,0,0 127,0,0 19,19,0 27,27,0 35,35,0 47,43,0 55,47,0 67,55,0 75,59,7 87,67,7 95,71,7 107,75,11 119,83,15 131,87,19 139,91,19 151,95,27 163,99,31 175,103,35 35,19,7 47,23,11 59,31,15 75,35,19 87,43,23 99,47,31 115,55,35 127,59,43 143,67,51 159,79,51 175,99,47 191,119,47 207,143,43 223,171,39 239,203,31 255,243,27 11,7,0 27,19,0 43,35,15 55,43,19 71,51,27 83,55,35 99,63,43 111,71,51 127,83,63 139,95,71 155,107,83 167,123,95 183,135,107 195,147,123 211,163,139 227,179,151 171,139,163 159,127,151 147,115,135 139,103,123 127,91,111 119,83,99 107,75,87 95,63,75 87,55,67 75,47,55 67,39,47 55,31,35 43,23,27 35,19,19 23,11,11 15,7,7 187,115,159 175,107,143 163,95,131 151,87,119 139,79,107 127,75,95 115,67,83 107,59,75 95,51,63 83,43,55 71,35,43 59,31,35 47,23,27 35,19,19 23,11,11 15,7,7 219,195,187 203,179,167 191,163,155 175,151,139 163,135,123 151,123,111 135,111,95 123,99,83 107,87,71 95,75,59 83,63,51 67,51,39 55,43,31 39,31,23 27,19,15 15,11,7 111,131,123 103,123,111 95,115,103 87,107,95 79,99,87 71,91,79 63,83,71 55,75,63 47,67,55 43,59,47 35,51,39 31,43,31 23,35,23 15,27,19 11,19,11 7,11,7 255,243,27 239,223,23 219,203,19 203,183,15 187,167,15 171,151,11 155,131,7 139,115,7 123,99,7 107,83,0 91,71,0 75,55,0 59,43,0 43,31,0 27,15,0 11,7,0 0,0,255 11,11,239 19,19,223 27,27,207 35,35,191 43,43,175 47,47,159 47,47,143 47,47,127 47,47,111 47,47,95 43,43,79 35,35,63 27,27,47 19,19,31 11,11,15 43,0,0 59,0,0 75,7,0 95,7,0 111,15,0 127,23,7 147,31,7 163,39,11 183,51,15 195,75,27 207,99,43 219,127,59 227,151,79 231,171,95 239,191,119 247,211,139 167,123,59 183,155,55 199,195,55 231,227,87 127,191,255 171,231,255 215,255,255 103,0,0 139,0,0 179,0,0 215,0,0 255,0,0 255,243,147 255,247,199 255,255,255 159,91,83' edm Atkinson
	}
	
}
