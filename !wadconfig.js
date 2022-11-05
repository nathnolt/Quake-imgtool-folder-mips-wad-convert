// This is an example config. you can copy this into a folder inside of your input folder. (input/quake101/ for example)
// All of the folders below it will overwrite the settings set before it. (it's recursive)
// 
// for all settings, see config.js
//
// These are the custom overwrite settings for this wad.
// this file can be put in any folder within input, and it will effect all the folders below it, 
// overwriting settings set in folders above it.
module.exports = {
	// relativeOutputWadDir: './other-dir/',
	// forceRebuilt: true,
	// removeFullbrightPixels: false,
	
	//overwrite the dither algorithm
	//algorithm: 'edm Simple2D',
	//strength: 0.64,
	//contrast: 0.2, // images look a bit more vibrant
	
	// scale the size of the textures 
	//scale: [2,2],
	
	//limit the output sizes of the texture
	//maxWidth: 128,
	//maxHeight: 128,
	
	// make the textures less saturated
	//saturation: -0.5
	
	// change settings for specific textures within this wad.
	textureOpts: {
		'yellow-square': {
			removeFullbrightPixels: false,
			//algorithm: 'edm Simple2D'
			maxWidth: 128,
			// maxHeight: 128,
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
			
			// add some contrast
			contrast: 0.2,
		},
	},
	
	// for the full list of settings, see config.js
}
