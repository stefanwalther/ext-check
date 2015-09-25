'use strict';
var path = require( 'path' );
var fs = require( 'fs-extra' );
var colors = require( 'colors' );
var zipLib = require( 'adm-zip' );
var _ = require( 'lodash' );
var glob = require( 'glob' );
var async = require( 'async' );
var zipper = require( 'zip-local' );

function ExtensionCheck ( options ) {

    this.config = JSON.parse( fs.readFileSync( path.resolve( __dirname, './config.json' ), "utf8" ) );
}

/**
 * @todo: Re-org, backup should only happen if there is something to fix
 * @param zipFilePath
 * @param doBackup
 * @param callback
 */
ExtensionCheck.prototype.fix = function ( zipFilePath, doBackup, callback ) {

    var backupFile = undefined;
    var that = this;
    var fixResult = {
        "numFiles": 0,
        "removedFiles": [],
        "removedFolders": [],
        "backupFile": ''
    };

    that.check( zipFilePath, function ( err, checkResult ) {

        if ( !checkResult ) {
            return callback( {"errMessage": 'No result returned checking the given zip file.'} );
        }

        if ( checkResult.rejectedFiles.length > 0 || checkResult.rejectedFolders.length > 0 ) {

            if ( doBackup ) {
                backupFile = createBackup( zipFilePath );
            }
            if ( fs.existsSync( backupFile ) ) {

                fixResult.backupFile = backupFile;
                if ( !fs.existsSync( zipFilePath ) ) { //Todo: probably stupid to test path again here, but ... ;-)
                    return callback( {
                        errName: 'FILE_NOT_EXISTS',
                        errMessage: 'The file \"' + zipFilePath + '\" does not exist.'
                    } );
                }

                var zip = new zipLib( zipFilePath );
                var zipFile = zip.getEntries();

                //Todo: Implement
                // folders
                //checkResult.rejectedFolders.forEach( function ( item ) {
                //    zip.deleteFile( item.entryName );
                //} );
                fixResult.removedFolders = checkResult.rejectedFolders;

                //Todo: Implement
                //// files
                //checkResult.rejectedFiles.forEach( function ( item ) {
                //    zip.deleteFile( item.entryName );
                //} );
                fixResult.removedFiles = checkResult.rejectedFiles;

                fs.removeSync( zipFilePath );
                zip.writeZip( zipFilePath );
                callback( null, fixResult );

            } else {
                return callback( {"errMessage": 'Backup file was not created successfully.'} );
            }

        } else {
            return callback( null, fixResult );
        }

    } );
};

ExtensionCheck.prototype.isFileExtensionAccepted = function ( fileExt ) {

    return (this.config.accepted.indexOf( fileExt ) > -1) && (this.config.rejected.indexOf( fileExt ) === -1)
};

/**
 * List callback
 * @callback listCallback
 * @param {error} error - The error object returned
 * @param {list} list - The list of file extensions
 */
/**
 * List all file-extensions and their usage count in the given .zip-file
 *
 * @param {zipFile} zipFilePath - Full path of the zip file.
 * @param {listCallback} callback
 *
 */
ExtensionCheck.prototype.list = function ( zipFilePath, callback ) {

    //Todo: Get rid of duplicated code checking this ...
    if ( !fs.existsSync( zipFilePath ) ) {
        return callback( {
            errName: 'FILE_NOT_EXISTS',
            errMessage: 'The file \"' + zipFilePath + '\" does not exist.'
        } );
    }
    if ( path.extname( zipFilePath ) !== '.zip' ) {
        return callback( {
            errName: "NOT_A_ZIP_FILE",
            errMessage: 'The file \"' + zipFilePath + '\" is not a .zip file.'
        } );
    }

    var that = this;

    if ( fs.existsSync( zipFilePath ) ) {

        zipper.unzip( zipFilePath, function ( unzipped ) {

            var list = [];
            if (unzipped.content && unzipped.content.files) {
                _.each( unzipped.content.files, function ( item ) {
                    if ( !item.dir ) {
                        var fileExt = getFileExtension( item.name );
                        if ( !_.find( list, {'ext': fileExt} ) ) {
                            list.push(
                                {
                                    ext: getFileExtension( item.name ),
                                    rejected: !(that.isFileExtensionAccepted( fileExt )),
                                    count: 1
                                }
                            )
                        } else {
                            _.find( list, {'ext': fileExt} ).count++;
                        }
                    }
                });
            }
            callback( null, list );
        });

    } else {
        callback( {errName: 'FILE_NOT_EXISTS', errMessage: 'zip file does not exist'} );
    }
};

/**
 * ListDir callback
 * @callback listDir callback
 * @param {error} error - The error object returned
 * @param {list[]} list - The list of file extensions, grouped by zip files
 */
/**
 * Gets a list of used file-extensions in the given directory, grouped by zip file.
 * @param dir
 * @param callback
 */
ExtensionCheck.prototype.listDir = function ( dir, callback ) {

    var listDirResult = [];
    var that = this;

    if ( !fs.existsSync( dir ) ) {
        return callback( {
            "errName": 'DIR_NOT_EXISTS',
            "errMessage": 'The given directory does not exist.'
        } );
    }

    this.getZipsInDir( dir, function ( err, zipFiles ) {
        if ( err ) {
            return callback( err );
        }
        async.mapSeries( zipFiles, function ( file, eachCB ) {
            that.list( file, function ( err, listResult ) {
                listResult.fileChecked = file;
                eachCB( err, listResult );
            } );
        }, function ( err, listResults ) {
            callback( err, listResults );
        } );
    } );
};

/**
 * Returns an array containing all zip files in the given directory.
 *
 * @param dir {String} dir - The directory to search for zip files
 * @param callback {object<error, files[]} callback - The callback
 */
ExtensionCheck.prototype.getZipsInDir = function ( dir, callback ) {

    if ( !fs.existsSync( dir ) ) {
        return callback( {
            "errName": 'DIR_NOT_EXISTS',
            "errMessage": 'The given directory does not exist.'
        } );
    }

    glob( dir + '/**/*.zip', function ( err, files ) {
        callback( null, files );
    } );
};

/**
 * Returns the details for a given file extension.
 *
 * @param zipFilePath
 * @param fileExtension
 * @return {Array}
 */
ExtensionCheck.prototype.listDetails = function ( zipFilePath, fileExtension ) {

    var matchingFiles = [];

    if ( fs.existsSync( zipFilePath ) ) {
        var zip = new zipLib( zipFilePath );
        var zipFile = zip.getEntries();

        zipFile.forEach( function ( item ) {
            if ( !item.isDirectory && getFileExtension( item.name ).toLowerCase() === fileExtension.toLowerCase() ) {
                matchingFiles.push( item.entryName );
            }
        } );
    } else {
        var e = new Error( 'File does not exist' );
        e.errMessage = 'File does not exist (' + zipFilePath + ')';
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
 * @param zipFilePath
 * @param {checkResultCallback} callback
 */
ExtensionCheck.prototype.check = function ( zipFilePath, callback ) {

    var err = undefined;
    var checkResult = {
        "checkedFile": '',
        "numFiles": 0,
        "numDirs": 0,
        "rejectedFiles": [],
        "rejectedFolders": []
    };
    var that = this;

    if ( !fs.existsSync( zipFilePath ) ) {
        return callback( {
            errName: 'FILE_NOT_EXISTS',
            errMessage: 'The file \"' + zipFilePath + '\" does not exist.'
        } );
    }

    if ( path.extname( zipFilePath ) !== '.zip' ) {
        return callback( {
            errName: "NOT_A_ZIP_FILE",
            errMessage: 'The file \"' + zipFilePath + '\" is not a .zip file.'
        } );
    }

    checkResult.checkedFile = zipFilePath;
    var zip = new zipLib( zipFilePath );

    // Check the entries without looking at the content ...
    var zipFile = zip.getEntries(); // an array of ZipEntry records
    var c = 0;
    var d = 0;
    zipFile.forEach( function ( zipFileEntry ) {
        if ( zipFileEntry.isDirectory ) {
            d++;
            if ( that.config.safeToRemoveFolders.indexOf( zipFileEntry.name ) > -1 ) {
                var f = {
                    "item": zipFileEntry.name,
                    "entryName": zipFileEntry.entryName,
                    "safeToRemove": (that.config.safeToRemoveFolders.indexOf( zipFileEntry.name ) > -1)
                };
                checkResult.rejectedFolders.push(f);
            }

        } else {
            c++;
            var fileExt = getFileExtension( zipFileEntry.name );
            if ( that.config.rejected.indexOf( fileExt ) > -1 ) {
                var f = {
                    "item": zipFileEntry.name,
                    "entryName": zipFileEntry.entryName,
                    "safeToRemove": (that.config.safeToRemoveFiles.indexOf( fileExt ) > -1)
                };
                checkResult.rejectedFiles.push( f );
            }
        }
    } );
    checkResult.numFiles = c;
    checkResult.numDirs = d;

    return callback( err, checkResult );
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
        var destFile = path.join( sourceFile.dir, sourceFile.name + sourceFile.ext + '.' + i + '.bak' );
        if ( !fs.existsSync( destFile ) ) {
            fs.copySync( zipFilePath, destFile );
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
