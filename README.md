# Quake imgtool folders imgs -> mips -> wad
A small NodeJS helper program to make the UX of making wads way better. uses the ftetools's imgtool command line tool for the heavy lifting ( See https://fte.triptohell.info/moodles/win64/ )

The goal of this tool is to make working with textures a breeze, rather than a pain.

# Preparation
1. Download all the files
2. Make sure you have Node.js installed ( https://nodejs.org/en/ ) and configured so you can type node in the command line and it works.
3. edit the 'outputWadDir' in config.js to have the correct output path.

# Usage
1. Add folders to this folder containing image files.
2. open a console
3. type: `node tool.js -d` and press enter
4. the wad files should get built and every time you edit or add a image file you can just relaunch the command and it will only build the changed wad files.

## Usage Options
- `node tool.js` for help
- `node tool.js -d` to convert from folders with image files to wads
- `node tool.js -r` to convert all wads into folders with pngs which go into the config.pngOutputWadDir folder (wad-exports by default)
- you can add `-f` to the `-d` or `-r` command to force recreation of all the files. Without it the program checks the modification date of all files in order to determine whether to built things or not.


# Info about usage
- The name of the folders will be the names of the wads and the names of the image files will be the names of the textures within the wad
- If the image files aren't in the Quake pallete already they will be converted, but you will get a better result converting them manually using a tool like GIMP ( https://www.gimp.org/ )

# Updates

- Fixed a bug where the texture names were incorrect
- Added support for the -r (reverse) command
- Added support for the -f (force) command