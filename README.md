# Quake imgtool folders imgs -> dithered -> mips -> wads
A small NodeJS helper program to make the UX of making wads way better. uses the ftetools's imgtool command line tool for the heavy lifting ( See https://fte.triptohell.info/moodles/win64/ )
Supports dithering using didder ( https://github.com/makeworld-the-better-one/didder )

# Why a new tool
Because some people want to manage all of their wads with a single tool. 
I also think that this tool is faster if you want support for dithering.


# Preparation
1. Download all the files
2. Make sure you have Node.js installed ( https://nodejs.org/en/ ) and configured so you can type node in the command line and it works.
3. edit the 'outputWadDir' in config.js to have the correct output path.
4. create an input folder.


# Usage
1. Add a folder inside the input folder containing image files. The name of the folder will be name of the output wad. (so for example: &lt;root&gt;/input/mywad/texture[1-100].png will become mywad.wad with all the 100 textures.)
2. open a console
3. type: `node tool.js -d` and press enter
4. the wad files should get built . Every time you edit the images you have to execute the command again. Only the updated wads will get built.


# Usage Options
- `node tool.js` for help
- `node tool.js -d` to convert from folders with image files to wads
- `node tool.js -r` to convert all wads into folders with pngs which go into the config.pngOutputWadDir folder (wad-exports by default)
- you can add `-f` to the `-d` or `-r` command to force recreation of all the files. Without it the program checks the modification date of all files in order to determine whether to built things or not.


# Info about usage
- The name of the folders will be the names of the wads and the names of the image files will be the names of the textures within the wad
- add a wadconfig.js to the folder, see wadconfig.example.js and config.js for what you can add.

# Configuration

## Tool and defaults
config.js has the config for the tool itself, and a default wad config

## Per wad
copy the !wadconfig.js into a folder and change it. You can specify settings for the entire wad, and override settings per texture. See config.js -> defualtWadConfig for all of the options.


# Updates

# v3
- added support for scaling stuff
- added support for max width / height
- all textures will become multiple of 16 units, so that you don't get an error when you play the map

# v2
- added support for didder, and a bunch of other things it supports (recolor, brightness, contrast, saturation upscale, resize)
- send me a DM if there are any questions about how to use it


## Old
- Fixed a bug where the texture names were incorrect
- Added support for the -r (reverse) command
- Added support for the -f (force) command
- Added basic wad config support with relativeOutputWadDir and forceRebuilt support


# todo
Probably make it so that it's clear on how to use it / what it even is. But then again, pretty lazy now to do it.
