// This is an example config. you can copy this into a folder inside of your input folder. 
// All of the folders below it will overwrite the settings set before it. (it's recursive)
// 
// These are the custom overwrite settings for this wad.
// this file can be put in any folder within input, and it will effect all the folders below it, 
// overwriting settings set in folders above it.
module.exports = {
	// relativeOutputWadDir: './other-dir/',
	forceRebuilt: true,
	skipDithering_nofullbright: false,
	
	// overwrite the algorithm
	algorithm: 'edm Simple2D',
	strength: 0.64,
	contrast: 0.2, // images look a bit more vibrant
	
	// upscale: 2, // 2 times the upscale (pixels will be more blocky)
	customPalette: '#000000 #444444 #888888 #ffffff', // hex syntax
	recolor: '#ffffff #ff00ff #00ff00 #000000',
	
	// change settings for specific textures
	textureOpts: {
		'yellow-square': {
			skipDithering_nofullbright: false,
			removeFullbrightPixels: false,
			//algorithm: 'edm Simple2D'
		},
		'speccy': {
			// skipDithering_nofullbright: false,
			removeFullbrightPixels: false,
			algorithm: 'bayer 8x8',
			customPalette: '#ff0000 #00ff00 #0000ff',
			recolor: '#00ff00 #0000ff #ff0000',
		},
		
		// because of removeFullbrightPixels: true, this texture won't have fullbright pixels
		'cliff_red_1': {
			// skipDithering_nofullbright: false,
			removeFullbrightPixels: true,
			//algorithm: 'bayer 8x8'
			width: 128,
			height: 128,
		},
	},
	
	// for the full list of settings, see config.js
}
