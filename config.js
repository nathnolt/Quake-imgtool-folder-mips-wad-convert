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



// if edmAlgoSerp is true, it will go left->right, 
// right->left alternation every row.
// if false, it will go left-> every row.
// this only applies to edm (error diffusion matrix) dithering algorithms.
var edmAlgoSerp = false
if(edmAlgoSerp == true) {
	edmAlgoSerp = '-s '
} else {
	edmAlgoSerp = ''
}


module.exports = {
	inputDir: 'input',
	// outputWadDir: 'C:/games/quake1/wads',
	outputWadDir: 'output',
	
	// The output folder of the reverse method.
	pngOutputDir: 'wad-exports',
	
	toolPath: 'imgtool64.exe',
	didderToolPath: 'didder_1.1.0.exe',
	
	// This is the global config for all of the WADS.
	// this object is the same as the module.exports on a wadconfig.js
	defaultWadConfig: {
		// if set to true, none of next settings regarding fullbright / dithering stuff is supported, but it saves on disk space.
		// basically, you can set it to true if you don't want any translation of the images, either for everything or each wad seperately.
		skipDithering_nofullbright: false,
		
		// removes the fullbright pixels from the palette, so kinda does the same thing as removeFullbright, 
		// except it will dither the fullbright pixels.
		removeFullbrightPixels: false, // it's false by default because we do want fullbrights in certain textures. and it can be turned off/on for specific textures
		//removeFullbrightPixels: true,
		
		//-----------------------------
		//
		// Dithering settings
		//
		//-----------------------------
		// 
		// So, there are 2 types of dithering, either those which work with patterns (random, bayer, ordered (odm)), or error diffusion (edm).
		// patterned dithering looks pretty good for certain types of images, but it has a major flaw: it will dither 
		// pixels which are already in the pattern. So if you would execute ordered dithering on regular quake textures which are already in the
		// pattern, it will still translate them.
		// 
		// error diffusion doesn't have this problem, which is why it's set to one of these by default.
		// never the less, here are a bunch of algorithm possibilities.
		// 
		// For more detail, look at the following resources
		//   - https://github.com/makeworld-the-better-one/didder/blob/main/MANPAGE.md#commands
		//   - https://pkg.go.dev/github.com/makeworld-the-better-one/dither/v2#OrderedDitherMatrix
		// 
		
		
		// error diffusion Matrix presets
		//--------------------------------
		// These are the best because they work with errors, meaning that images
		// which are already in the pallette won't change at all.
		//--------------------------------
		algorithm: `edm ${edmAlgoSerp}FloydSteinberg`, // the default
		//algorithm: `edm ${edmAlgoSerp}Simple2D`,
		//algorithm: `edm ${edmAlgoSerp}FalseFloydSteinberg`,
		//algorithm: `edm ${edmAlgoSerp}Stucki`,
		//algorithm: `edm ${edmAlgoSerp}Burkes`,
		//algorithm: `edm ${edmAlgoSerp}Sierra`,
		//algorithm: `edm ${edmAlgoSerp}TwoRowSierra`,
		//algorithm: `edm ${edmAlgoSerp}SierraLite`,
		//algorithm: `edm ${edmAlgoSerp}StevenPigeon`,
		
		
		//algorithm: `edm FloydSteinberg`, // the default
		//algorithm: `edm Simple2D`,
		//algorithm: `edm FalseFloydSteinberg`,
		//algorithm: `edm Stucki`,
		//algorithm: `edm Burkes`,
		//algorithm: `edm Sierra`,
		//algorithm: `edm TwoRowSierra`,
		//algorithm: `edm SierraLite`,
		//algorithm: `edm StevenPigeon`,
		
		

		
		// Bayer matrix ordered dithering.
		// these ones are okay for certain type of images
		//-------------------------
		//algorithm: 'bayer 2x2',
		//algorithm: 'bayer 4x4',
		//algorithm: 'bayer 3x3',
		//algorithm: 'bayer 3x5',
		//algorithm: 'bayer 5x3',
		//algorithm: 'bayer 8x8',
		//algorithm: 'bayer 16x16',
		
		
		// Ordered Dithering Matrix presets
		// most of these are just interesting effects
		//-------------------------
		//algorithm: 'odm ClusteredDot4x4',
		//algorithm: 'odm ClusteredDotDiagonal8x8',
		//algorithm: 'odm Vertical5x3',
		//algorithm: 'odm Horizontal3x5',
		//algorithm: 'odm ClusteredDotDiagonal6x6',
		//algorithm: 'odm ClusteredDotDiagonal8x8_2',
		//algorithm: 'odm ClusteredDotDiagonal16x16',
		//algorithm: 'odm ClusteredDot6x6',
		//algorithm: 'odm ClusteredDotSpiral5x5',
		//algorithm: 'odm ClusteredDotHorizontalLine',
		//algorithm: 'odm ClusteredDotVerticalLine',
		//algorithm: 'odm ClusteredDot8x8',
		//algorithm: 'odm ClusteredDot6x6_2',
		//algorithm: 'odm ClusteredDot6x6_3',
		//algorithm: 'odm ClusteredDotDiagonal8x8_3',
		
		// random dithering. Note, 
		// this looks bad (probably having to do with the quake palette)
		//-------------------------
		//algorithm: 'random -0.1,0.1',
		// algorithm: 'random -0.2,0.2',
		//algorithm: 'random -0.5,0.5',
		//algorithm: 'random -0.7,0.7',
		
		// customPalette:
		// change the palette that is used. cool for weird effects.
		//------------------
		// customPalette: '#000000 #444444 #888888 #ffffff', // hex syntax
		// customPalette: '0,0,0 68,68,68 136,136,136 255,255,255', // rgb syntax
		
		// recolor:
		// recolor the image after the dithering process, where each nth color 
		// in the palette is swapped by the nth color in the recolor param
		//-------------------------------------------------
		// recolor: '#ffffff #ff00ff #00ff00 #000000',
		
		// strength: the strength of the dithering. 
		// normal range = -1 to 1, other values produce interesting results (-10 for exmple)
		//strength: 1,
		//strength: 0.64,
		//strength: 0.1,
		
		
		//------------------------------
		//
		// Image modification settings
		//
		//------------------------------
		
		// change the image to greyscale if true
		// grayscale: false,
		
		// saturation: change the saturation before dithering
		// range: -1 to 1   -1 = greyscale   0 = normal   1 = extra saturated
		//saturation: 0, // colors will be regular
		//saturation: -0.5, // textures will have less color
		//saturation: 0.5, // colors will be more vibrant
		
		// brightness: change the brightness before dithering
		// range -1 to 1    -1 = black    0 = normal    1 = white
		//brightness: 0,
		//brightness: -0.1, // textures are darker
		//brightness: 0.1, // textures are lighter
		
		// contrast: change the contrast before dithering
		// range -1 to 1   -1 = grey   0 = normal    1 = brightest colors only
		//contrast: 0,
		//contrast: -0.2, // images will be a bit duller
		//contrast: 0.2, // images look a bit more vibrant
		
		
		//-------------------
		// 
		// Resize settings. if only 1 param is given, it will maintain aspect ratio
		// 
		//-------------------
		//width: 128,
		//height: 128,
		
		// upscale after dithering
		//upscale: 1, // no upscale
		// upscale: 2, // 2 times the upscale (pixels will be more blocky)
	},
	
	// logs some things.
	pedanticLog: true,
	// logs some other things
	imgtoolLog: false,
	// logs the executed commands
	commandLog: false,
	// some other logs
	devLog: false,
	
	// The command that is used to convert the imgs into mips
	img2mipCommand(relativeToolPathFromImgFolder, imgName) {
		return `"${relativeToolPathFromImgFolder}" --ext mip -c "${imgName}"`
	},
	
	// The command to build the wad from a mip folder
	buildWadCommand(toolPath, outputWadDir, wadName, mipDir) {
		return `"${toolPath}" -w "${outputWadDir}${wadName}.wad" "${mipDir}"`
	},
	
	// The command to convert all the wads back into pngs
	wad2pngsCommand(toolPath, outputWadDir, wadName) {
		return `"${toolPath}" -x --ext png "${outputWadDir}${wadName}.wad"`
	},
	
	
	// In this example, the image1.tga is convert into a png variant. We have to do this step before we execute diddler,
	// for every format which diddler does not support.
	// I suppose we have a convertion array with every extension that needs to be converted, where they will all be converted into a png.
	img2pngCommand(relativeToolPath, imgName) {
		return `"${relativeToolPath}" -c --ext png "${imgName}"`
	},
	
	// the command to convert the image to a dithered potentially color changed upscaled resized image
	// uses didder ( https://github.com/makeworld-the-better-one/didder )
	didderConvertCommand(relativeToolPath, imgNameWithExt, imgName, palette, algorithm, extraStr) {
		return `"${relativeToolPath}" -i "${imgNameWithExt}" -o "dithered/${imgName}.png" -p "${palette}" ${extraStr}${algorithm}`
	}
	
}
