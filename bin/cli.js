#!/usr/bin/env node
/* global define,require */
'use strict';
var commandLineArgs = require( 'command-line-args' );
var ExtensionCheck = require( './../lib/ExtensionCheck' );
var colors = require( 'colors' );
var _ = require( 'lodash' );
var mime = require( 'mime' );

var cli = commandLineArgs( [
    {name: "src", alias: "s", type: String, defaultOption: true, defaultValue: undefined},
    {name: "help", alias: "h", type: Boolean, defaultValue: false},
    {name: "backup", alias: "b", type: Boolean, defaultValue: true},
    {name: "fix", alias: "f", type: Boolean, defaultValue: false},
    {name: "password", alias: "p", type: Boolean, defaultValue: false},
    {name: "list", alias: "l", type: Boolean, defaultValue: false},
    {name: "listdir", alias: "ldir", type: Boolean, defaultValue: false},
    {name: "listdetails", alias: "ld", type: String, defaultValue: false},
    {name: "mime", alias: "m", type: Boolean, defaultValue: false},

    {name: "debug", alias: "d", type: Boolean, defaultValue: false}
] );
var options = cli.parse();
var ec = new ExtensionCheck();

function doCheck () {

    console.log( '' );
    console.log( colors.cyan( 'Checking file \"' + options.src + '\" ...' ) );
    console.log( '' );

    ec.check( options.src, function ( error, checkResult ) {

        if ( error ) {
            return console.error( colors.red( error.errMessage || error ) );
        } else {
            if ( checkResult ) {
                console.log( colors.cyan.underline( 'Overview:' ) );
                console.log( '\t' + checkResult.numFiles + ' files in ' + checkResult.numDirs + ' directories' );
                console.log( '\t' + checkResult.rejectedFiles.length + ' files might be not accepted by Qlik Sense server.' );

                console.log( '' );
                console.log( colors.cyan.underline( 'Check result:' ) );

                if ( checkResult.rejectedFiles.length > 0 || checkResult.rejectedFolders.length > 0 ) {

                    // Rejected folders
                    if ( checkResult.rejectedFolders.length > 0 ) {
                        console.log( colors.white( '\tFolders potentially rejected by QMC import:' ) );
                        checkResult.rejectedFolders.forEach( function ( folderRejected ) {
                            console.log( colors.grey( '\t- ' + folderRejected.entryName ) + ((!folderRejected.safeToRemove) ? colors.red( ' (double check, if folder can be removed)' ) : colors.green( ' (probably safe to remove)' )) );
                        } );
                    }

                    // Rejected files
                    if ( checkResult.rejectedFiles.length > 0 ) {
                        console.log( colors.white( '\tFiles potentially rejected by QMC import:' ) );
                        checkResult.rejectedFiles.forEach( function ( itemRejected ) {
                            console.log( colors.grey( '\t- ' + itemRejected.entryName ) + ((!itemRejected.safeToRemove) ? colors.red( ' (double check, if file can be removed)' ) : colors.green( ' (probably safe to remove)' )) );
                        } );
                    }

                    console.log( '' );
                    console.log( 'There are two different approaches to fix these issues:' );
                    console.log( '1.) Run ' + colors.yellow( 'ext-check <zip-file> --fix' ) + ' to remove the above listed files. Then the import to the Qlik Sense QMC should work again, but still, double-check the functionality of the extension. ' );
                    console.log( '2.) Patch the Qlik Sense server to support these file-types globally, look for the documentation on branch.qlik.com or community.qlik.com.' )

                } else {
                    console.log( colors.green( 'Everything looks fine, go ahead.' ) );
                }

            } else {
                return console.error( colors.red( 'Error: No result returned.' ) );
            }
        }
    } );
}

function doFix () {

    console.log( '' );
    console.log( colors.cyan( 'Fixing file \"' + options.src + '\" ...' ) );
    console.log( '' );

    ec.fix( options.src, options.backup, function ( err, fixResult ) {

        if ( err ) {
            return console.error( colors.red( 'Error: ' + err.errMessage || err ) );
        }

        if ( fixResult.removedFiles.length === 0 && fixResult.removedFolders === 0 ) {
            console.log( '' );
            console.log( '\t' + colors.green( 'All fine, nothing to fix' ) );
        } else {

            console.log( 'The original file has been backed up to \"' + fixResult.backupFile + '\".' );
        }
    } );
}

function doList () {
    ec.list( options.src, function ( err, data ) {

        if ( err ) {
            console.error( colors.red( err.errMessage || err ) );
        } else {
            console.log( '' );
            console.log( colors.cyan( 'Usage of different file extensions in \"' + options.src + '\":' ) );
            data = _.sortByOrder( data, ['count'], ['desc'], _.values);
            data.forEach( function ( item ) {
                console.log( '\t' + _.trunc(item.ext,7) + '\t\t' + _.padLeft( item.count, 3, ' ' ) + ' times used ' + ((!item.rejected) ? colors.green( '( OK )' ) : colors.red( '( Not working out of the box )' )) );
            } )
        }

        console.log( '' );
        if ( _.where( data, {"supported": false} ).length > 0 ) {
            console.log( colors.red( 'There are one or more files which might not work without either patching the Qlik Sense server or removing those files from the extension.' ) );
            console.log( '' );
            console.log( 'Use ' + colors.yellow( 'ext-check <zipFile> --fix' ) + ' to remove those files from the extension.' );
            console.log( '(A backup of this file will be created automatically.)' );
        } else {
            console.log( colors.green( 'Everything looks fine!' ) );
        }

    } );
}

function doListDir () {
    ec.listDir( options.src, function ( err, data ) {
        if ( err ) {
            console.error( colors.red( err.errMessage || err ) );
        } else {
            console.log( '' );
            data.forEach( function ( item ) {
                console.log( 'Results for ' + item.fileChecked + ':' );
                item.forEach( function ( fileExt ) {
                    console.log( '\t' + fileExt.ext + '\t' + _.padLeft( fileExt.count, 3, ' ' ) + ' times used ' + ((!fileExt.rejected) ? colors.green( '( OK )' ) : colors.red( '( Not working out of the box )' )) );
                } );
                console.log( '' );
            } )
        }

    } );
}

function doListDetails () {

    ec.listDetails( options.src, options.listdetails, function ( err, matchingFiles ) {
        if ( err ) {
            console.error( colors.red( ex.errMessage ) );
        } else {
            if ( matchingFiles.length > 0 ) {
                console.log( colors.cyan( 'File extension \"' + options.listdetails + '\" is used in the following files:' ) );
                matchingFiles.forEach( function ( item ) {
                    console.log( '\t- ' + item );
                } );
            } else {
                console.log( colors.cyan( 'File extension \"' + options.listdetails + '\" is not used at all in the source file.' ) );
            }
        }
    } );
}

/**
 * Return the mime type.
 */
function doMime () {
    console.log( 'Mime type for \"' + options.src + '\":' );
    console.log( '\t' + colors.yellow( mime.lookup( options.src ) ) );
}

function run () {

    if ( options.list ) {
        doList();
    } else if ( options.listdir ) {
        doListDir();
    } else if ( options.mime ) {
        doMime();
    } else if ( options.listdetails ) {
        doListDetails();
    } else if ( options.fix ) {
        doFix();
    } else {
        doCheck(); // Default, just do the check
    }
}

run();

