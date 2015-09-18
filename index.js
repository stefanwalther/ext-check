'use strict';
var commandLineArgs = require( "command-line-args" );
var path = require( 'path' );
var fs = require( 'fs' );
var colors = require( 'colors' );
var zipLib = require( 'adm-zip' );
var commander = require('commander');

function SenseExtensionCheck () {

	var cli = commandLineArgs( [
		{name: "src", alias: "s", type: String, defaultOption: true},
		{name: "help", alias: "h", type: Boolean, defaultValue: false},
		{name: "backup", alias: "b", type: Boolean, defaultValue: true},
		{name: "fix", alias: "f", type: Boolean, defaultValue: false},
		{name: "debug", alias: "d", type: Boolean, defaultValue: false},
		{name: "password", alias: "p", type: Boolean, defaultValue: false}
	] );
	var options = cli.parse();

	function init () {
		debugLog( 'options: ', options );

		if ( options.help ) {
			return outputHelp();
		}

		if ( options.src ) {

			console.log( '' );
			console.log( colors.blue( '\tChecking file \"' + options.src + '\" ...' ) );
			console.log( '' );
			checkFile( options.src, function ( err, fixesNeeded ) {
				if ( err ) {
					console.log( colors.red( err.errDescription ) );
				} else {
					if ( fixesNeeded.length === 0 ) {
						console.log( colors.green( '\tAll fine, upload of your extension should work in in Qlik Sense 2.1.1' ) );
					} else {

					}
				}
			} );

		}

		else {
			console.log( colors.red( 'Please define the source file.' ) );
		}
	}

	function checkFile ( filePath, callback ) {
		var err = undefined;
		var fixesNeeded = [];

		if ( !fs.existsSync( filePath ) ) {
			return callback( {
				errName: 'FILE_NOT_EXISTS',
				errDescription: 'The file \"' + filePath + '\" does not exist.'
			} );
		}

		var zip = new zipLib( filePath );

		// Check the entries without looking at the content ...
		var zipEntries = zip.getEntries(); // an array of ZipEntry records
		zipEntries.forEach(function(zipEntry) {
			console.log('zipEntry', zipEntry);
			console.log(zipEntry.toString()); // outputs zip entries information
			//if (zipEntry.entryName == "my_file.txt") {
			//	console.log(zipEntry.data.toString('utf8'));
			//}
		});

		// Check the file's content


		callback( err, fixesNeeded );
	}

	function debugLog ( lbl, msg ) {
		if ( options.debug ) {
			console.log( lbl, msg );
		}
	}

	function createBackup( filePath, callback ) {

		var err = undefined;
		var sourceFile = path.parse( filePath );
		var backupPath = undefined;
		var i = 1;

		while (!backupPath) {
			var destFile = path.join( sourceFile.dir, sourceFile.name + '_' + i + '.bak');
			if ( !fs.existsSync ( destFile)) {
				fs.copySync( sourceFile, destFile);
				backupPath = destFile;
			} else {
				i++;
			}
		}
		callback( err, destFile );
	}

	function outputHelp () {

	}

	init();

}

module.exports = SenseExtensionCheck();
