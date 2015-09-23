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

/**
 * @todo: Re-org, backup should only happen if there is something to fix
 * @param zipFile
 * @param doBackup
 * @param callback
 */
ExtensionCheck.prototype.fix = function ( zipFile, doBackup, callback ) {

    var backupFile = undefined;
    if ( doBackup ) {
        backupFile = createBackup( zipFile );
    }
    if ( fs.existsSync( backupFile ) ) {

        this.check( zipFile, function ( err, data ) {

        } );

    } else {
        callback( {"errMessage": 'Backup file was not created successfully.'} );
    }
};

ExtensionCheck.prototype.isFileExtensionWorking = function ( fileExt ) {

    return (this.config.accepted.indexOf( fileExt ) > -1) && (this.config.rejected.indexOf( fileExt ) === -1)
};

/**
 *

 */

/**
 * List all file-extensions and their usage count in the given .zip-file
 *
 * @param {zipFile} zipFile - Full path of the zip file.
 * @param {listCallback} callback
 *
 * @callback listCallback
 * @param {error} error - The error object returned
 * @param {list} list - The list of file extensions
 */
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
        var e = new Error( 'File does not exist' );
        e.errMessage = 'File does not exist (' + zipFile + ')';
        throw e;
    }

    return matchingFiles;
};

/**
 * Check results callback
 *
 * @callback {checkResultCallback<error, checkResult>}
 * @param {error} error - Errors occurred, otherwise undefined
 * @param checkResult checkResult
 * @param checkResult.numFiles {integer} numFiles - Number of total files in the zip file
 * @param checkResult.numDirs {integer} numDirs - Number of directories within the zip file
 * @param checkResult.rejected {object[]} rejected - Files likely to be rejected in the QMC import of the given version of Qlik Sense
 */

/**
 * Checks a given zip file and returns the analysis containing:
 *
 * - Total number of files in the zip file.
 * - Files likely to be rejected (accepted by QMC upload) in the given version of Qlik Sense
 *
 * @param zipFile
 * @param {checkResultCallback} callback
 */
ExtensionCheck.prototype.check = function ( zipFile, callback ) {

    var err = undefined;
    var checkResult = {
        "numFiles": 0,
        "numDirs": 0,
        "rejected": []
    };
    var that = this;

    if ( !fs.existsSync( zipFile ) ) {
        return callback( {
            errName: 'FILE_NOT_EXISTS',
            errMessage: 'The file \"' + zipFile + '\" does not exist.'
        } );
    }

    var zip = new zipLib( zipFile );

    // Check the entries without looking at the content ...
    var zipEntries = zip.getEntries(); // an array of ZipEntry records
    var c = 0;
    var d = 0;
    zipEntries.forEach( function ( zipEntry ) {
        if (zipEntry.isDirectory) {
            d++;
        } else {
            c++;
            var fileExt = getFileExtension(zipEntry.name);
            if ( _.find(that.config.rejected, fileExt)) {
                var f = {
                    "item": zipEntry.name,
                    "entryName": zipEntry.entryName
                };
                checkResult.rejected.push(f);
            }
        }
    } );
    checkResult.numFiles = c;
    checkResult.numDirs = d;

    callback( err, checkResult );

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
    return ext[ext.length - 1].toLowerCase();
}

module.exports = ExtensionCheck;
