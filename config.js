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
	outputWadDir: 'output',
	//outputWadDir: 'C:/games/quake1/wads',
	
	// The output folder of the reverse method.
	pngOutputDir: 'wad-exports',
	
	toolPath: 'imgtool64.exe',
	didderToolPath: 'didder_1.1.0.exe',
	
	// This is the global config for all of the WADS.
	// 
	// this object is the same as the module.exports on a wadconfig.js 
	//   (or as the object inside of textureOpts)
	// 
	defaultWadConfig: {
		// if set to true, none of next settings regarding fullbright / dithering stuff is supported, but it saves on disk space.
		// basically, you can set it to true if you don't want any translation of the images, either for everything or each wad seperately.
		skipDithering_nofullbright: false,
		
		// removes the fullbright pixels from the palette, so kinda does the same thing as removeFullbright, 
		// except it will dither the fullbright pixels.
		removeFullbrightPixels: false, // it's false by default because we do want fullbrights in certain textures. It can be turned off/on for specific textures
		//removeFullbrightPixels: true,
		
		
		
		
		
		// All of the next settings inside of defaultWadConfig need didder to be activated in order to work. 
		// Meaning: skipDithering_nofullbright: false is required
		// 
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
		
		algorithm: `edm FloydSteinberg`, // the default
		//algorithm: `edm Simple2D`,
		//algorithm: `edm FalseFloydSteinberg`,
		//algorithm: `edm Stucki`,
		//algorithm: `edm Burkes`,
		//algorithm: `edm Sierra`,
		//algorithm: `edm TwoRowSierra`,
		//algorithm: `edm SierraLite`,
		//algorithm: `edm StevenPigeon`,
		
		
		// the same as before but serpentine 
		// (instead of going left-> every row, it alternates)
		//algorithm: `edm -s FloydSteinberg`, // the default
		//algorithm: `edm -s Simple2D`,
		//algorithm: `edm -s FalseFloydSteinberg`,
		//algorithm: `edm -s Stucki`,
		//algorithm: `edm -s Burkes`,
		//algorithm: `edm -s Sierra`,
		//algorithm: `edm -s TwoRowSierra`,
		//algorithm: `edm -s SierraLite`,
		//algorithm: `edm -s StevenPigeon`,

		

		
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
		// If you put some of these settings beyond their normal range, it doesn't fail, but instead you get weird results.
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
		
		
		
		// this is the factor to resize it to.
		//------------------------------------
		//scale: 0.5, // make it smaller
		//scale: 1, // don't scale it
		//scale: 2, // make it larger
		// or support for array (to seperately scale X and Y, in that order)
		//scale: [2], // make it larger
		//scale: [2, 2], // make it larger
		//scale: [2,1], // make it wider
		//scale: [1,2], // make it taller
		//scale: [0.75,2], // make it lanky
		
		
		// limit the width / height to a specific size 
		// (downscales the image, if it is larger)
		// (will happen after scale)
		//--------------------------------------------
		//maxWidth: 64,
		//maxHeight: 64,
		
		// 16 aligned fix:
		// 
		// Textures have to be an integer multiple of 16x16 units
		// if images aren't aligned to 16x16 units, the engine will complain (not sure if all engines do)
		//
		// This next param will try to fix this
		// it supports 3 ways of doing it
		//  
		//  - stretch = stretching it to a 16x16 multiple (will impact aspect ratio a lot, if the image is tiny)
		//  - scale   = scale up till the image is a 16x16 multiple (the texture might become 16x the size
		//              (it only scales by integers), you probably never want this one)
		//  - smart   = smart mix between stretch and scale (this is the one you want in most cases)
		//  - none    = don't try to fix it (will have a bit better performance)
		// 
		// This internally overwrites the width / height params. 
		// If width / height are set, these won't do anything
		
		fix16AlignedMethod: 'smart',
		//fix16AlignedMethod: 'stretch',
		//fix16AlignedMethod: 'scale',
		//fix16AlignedMethod: 'none',
		
		// Figured I make the multiple of 16 configurable
		// in all honestly, you won't have to change this, ever, unless you want to have a bit of fun.
		fix16Aligned_multiple: 16,
		
		// This defines the maximum size it will scale to, before it will stop scaling it upwards.
		// after that it will use the stretched size, even if the percentage of change is larger than the treshold.
		// maybe you want to change this to 256, if you want a bit smaller textures
		// Note, if the textures are already large, this won't scale them down.
		fix16AlignedSmart_maxTexSize: 512,
		
		// This defines the percentage of when it will squash the image.
		// for example, if the image was 17x17, the nearest multiple of 16 is 16x16, 
		// the percentage of difference between 17x17 and 16x16 is 6.25 ( (17 - 16) / 16 * 100 )
		// if the percentage of change is above it, it will double the size of the image, and try again.
		// 
		// Example 2: The image is 12x12 , it will keep doubling the size untill it becomes 48x48
		// the percentage of difference is now 0, because 48 is a multiple of 16
		fix16AlignedSmart_stretchThresholdPercentage: 10,
		
		
		
		// these are the raw width and height params.
		// when set, the images will be scaled to exactly this size.
		// note that on the same define depth, it will overwrite scale and the fix16Aligned code.
		// if you use these, you will only want to use them for speicif textures / wads ( see !wadconfig.js )
		//width: 128,
		//height: 128,
		
		
		// :: other resize settings ::
		
		// upscale after dithering (the other ones happen before the dithering). 
		// (does not support 0.5 or something like that)
		//upscale: 1, // no upscale
		//upscale: 2, // 2 times the upscale (pixels will be more blocky)
	},
	
	// logs the big steps for wads.
	basicLog: true,
	
	// log the more precise steps for wads
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
	
	// Get the size of the image, in order to make images aligned to 16x16 dimensions
	imageInfoCommand(toolPath, imgNameWithExt) {
		return `"${toolPath}" -i "${imgNameWithExt}"`
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
