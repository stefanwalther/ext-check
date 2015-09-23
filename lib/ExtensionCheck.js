'use strict';
var path = require( 'path' );
var fs = require( 'fs' );
var colors = require( 'colors' );
var zipLib = require( 'adm-zip' );
var _ = require( 'lodash' );

function ExtensionCheck ( options ) {

    this.config = JSON.parse( fs.readFileSync( "./lib/config.json", "utf8" ) );

    /**
     * @Todo: to be removed
     * @returns {*}
     */
    function init () {

        if ( options.help ) {
            return outputHelp();
        }

        if ( options.src ) {
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

}

ExtensionCheck.prototype.fix = function ( zipFilePath, doBackup, callback ) {

    var backupFile = undefined;
    if ( doBackup ) {
        backupFile = createBackup( zipFilePath );
    }
    if ( fs.existsSync( backupFile ) ) {

    } else {
        callback( {"errMessage": 'Backup file was not created successfully.'} );
    }
};

ExtensionCheck.prototype.isFileExtensionWorking = function ( fileExt ) {

    return (this.config.accepted.indexOf( fileExt ) > -1) && (this.config.rejected.indexOf( fileExt ) === -1)
};

ExtensionCheck.prototype.list = function ( zipFile, callback ) {

    var that = this;

    if ( fs.existsSync( zipFile ) ) {

        var zip = new zipLib( zipFile );
        var zipEntries = zip.getEntries();

        var list = [];

        zipEntries.forEach( function ( item ) {
            var fileExt = getFileExtension( item.name );

            if ( !item.isDirectory ) {
                if ( !_.find( list, {'ext': fileExt} ) ) {
                    list.push(
                        {
                            ext: getFileExtension( item.name ),
                            supported: (that.isFileExtensionWorking( fileExt )),
                            count: 1
                        }
                    )
                } else {
                    _.find( list, {'ext': fileExt} ).count++;
                }
            }
        } );

        callback( null, list );

    } else {
        callback( {errMessage: 'zip file does not exist'} );
    }
};

/**
 * Returns
 * @param zipFile
 */
ExtensionCheck.prototype.listDetails = function ( zipFile, fileExtension ) {

    var matchingFiles = [];

    if ( fs.existsSync( zipFile ) ) {
        var zip = new zipLib( zipFile );
        var zipEntries = zip.getEntries();

        zipEntries.forEach( function ( item ) {
            if ( !item.isDirectory && getFileExtension( item.name ).toLowerCase() === fileExtension.toLowerCase() ) {
                matchingFiles.push( item.entryName );
            }
        } );
    } else {
        var e = new Error('File does not exist');
        e.errMessage = 'File does not exist (' + zipFile + ')';
        throw e;
    }

    return matchingFiles;
};

ExtensionCheck.prototype.check = function ( zipFile, callback ) {

        var err = undefined;
        var fixesNeeded = [];

        if ( !fs.existsSync( zipFile ) ) {
            return callback( {
                errName: 'FILE_NOT_EXISTS',
                errMessage: 'The file \"' + zipFile + '\" does not exist.'
            } );
        }

        var zip = new zipLib( zipFile );

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

};

/**
 * Creates a backup of the zipFile and returns the path of the backup file.
 * @param zipFilePath
 * @return {string} File path of the backed up zip zile.
 */
function createBackup ( zipFilePath ) {

    var sourceFile = path.parse( zipFilePath );
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
    return destFile;
}

function getFileExtension ( fileName ) {
    var ext = path.extname( fileName || '' ).split( '.' );
    return ext[ext.length - 1];
}

module.exports = ExtensionCheck;
