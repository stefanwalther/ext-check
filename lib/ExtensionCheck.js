'use strict';
var path = require( 'path' );
var fs = require( 'fs' );
var colors = require( 'colors' );
var zipLib = require( 'adm-zip' );
var fileUtils = require( 'file-utils' );
var _ = require( 'lodash' );


function ExtensionCheck ( options ) {

    this.config = JSON.parse(fs.readFileSync("./lib/config.json", "utf8"));

    function init () {

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
        zipEntries.forEach( function ( zipEntry ) {
            console.log( 'zipEntry', zipEntry );
            console.log( zipEntry.toString() ); // outputs zip entries information
            //if (zipEntry.entryName == "my_file.txt") {
            //	console.log(zipEntry.data.toString('utf8'));
            //}
        } );

        // Check the file's content

        callback( err, fixesNeeded );
    }

    function debugLog ( lbl, msg ) {
        if ( options.debug ) {
            console.log( lbl, msg );
        }
    }

    function createBackup ( filePath, callback ) {

        var err = undefined;
        var sourceFile = path.parse( filePath );
        var backupPath = undefined;
        var i = 1;

        while ( !backupPath ) {
            var destFile = path.join( sourceFile.dir, sourceFile.name + '_' + i + '.bak' );
            if ( !fs.existsSync( destFile ) ) {
                fs.copySync( sourceFile, destFile );
                backupPath = destFile;
            } else {
                i++;
            }
        }
        callback( err, destFile );
    }

}

ExtensionCheck.prototype.isFileExtensionWorking = function ( fileExt ) {

    return (this.config.accepted.indexOf(fileExt) > -1) && (this.config.rejected.indexOf(fileExt) === -1)
};

ExtensionCheck.prototype.list = function ( zipFile, callback ) {

    var that = this;

    if ( fs.existsSync( zipFile ) ) {

        var zip = new zipLib( zipFile );
        var zipEntries = zip.getEntries();

        var list = [];

        zipEntries.forEach( function ( item ) {
            var fileExt = getFileExtension(item.name);

            if ( !item.isDirectory ) {
                if (!_.find( list, {'ext': fileExt} )) {
                    list.push(
                        {
                            ext: getFileExtension( item.name ),
                            supported: (that.isFileExtensionWorking(fileExt)),
                            count: 1
                        }
                    )
                } else {
                    _.find (list, {'ext': fileExt} ).count++;
                }
            }
        } );

        callback( null, list );

    } else {
        callback( {errMessage: 'zip file does not exist'} );
    }
};

function getFileExtension ( fileName ) {
    var ext = path.extname( fileName || '' ).split( '.' );
    return ext[ext.length - 1];
}



module.exports = ExtensionCheck;
