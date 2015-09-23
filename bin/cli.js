'use strict';
var commandLineArgs = require( 'command-line-args' );
var ExtensionCheck = require( './../lib/ExtensionCheck' );
var path = require( 'path' );
var colors = require( 'colors' );
var symbols = require( 'symbolsjs' );
var _ = require( 'lodash' );
var mime = require('mime');

var cli = commandLineArgs( [
    {name: "src", alias: "s", type: String, defaultOption: true, defaultValue: undefined},
    {name: "help", alias: "h", type: Boolean, defaultValue: false},
    {name: "backup", alias: "b", type: Boolean, defaultValue: true},
    {name: "fix", alias: "f", type: Boolean, defaultValue: false},
    {name: "password", alias: "p", type: Boolean, defaultValue: false},
    {name: "list", alias: "l", type: Boolean, defaultValue: false},
    {name: "listdetails", alias: "ld", type: String, defaultValue: false},
    {name: "mime", alias: "m", type: Boolean, defaultValue: false},

    {name: "debug", alias: "d", type: Boolean, defaultValue: false}
] );
var options = cli.parse();
var ec = new ExtensionCheck();

function run () {

    if ( options.list ) {
        doList();
    } else if (options.mime) {
        doMime();
    } else if (options.listdetails) {
        doListDetails();
    } else if (options.fix) {

    } else {
        // Just do the check

    }
}

function doCheck() {

}

function doFix() {

}


function doList() {
    var list = ec.list( options.src, function ( err, data ) {

        if ( err ) {
            console.error( err.errMessage );
        } else {
            console.log( '' );
            console.log( colors.cyan( 'Usage of different file extensions in \"' + options.src + '\":' ) );
            data.forEach( function ( item ) {
                console.log( '\t' + item.ext + '\t' + item.count + ' times used ' + ((item.supported) ? colors.green( '( OK )' ) : colors.red( ' ( Not working out of the box )' )) );
            } )
        }

        console.log('');
        if ( _.where( data, {"supported": false} ).length > 0 ) {
            console.log(colors.red('There are one or more files which might not work with either patching the Qlik Sense server or removing those files from the extension.'));
            console.log('');
            console.log('Use ' + colors.yellow('ext-check <zipFile> --fix') + ' to remove those files from the extension.');
            console.log('(A backup of this file will be created automatically.)');
        } else {
            console.log(colors.green('Everything looks fine!'));
        }

    } );
}

function doListDetails() {

    try {
        var matchingFiles = ec.listDetails( options.src, options.listdetails)

        if (matchingFiles.length > 0) {
            console.log(colors.cyan('File extension \"' + options.listdetails + '\" is used in the following files:'));
            matchingFiles.forEach( function ( item ) {
                console.log('\t- ' + item);
            });
        } else {
            console.log(colors.cyan('File extension \"' + options.listdetails + '\" is not used at all in the source file.'));
        }
    }
    catch (ex) {
        console.error( colors.red(ex.errMessage) );
    }

}

function doMime( ) {
    console.log('Mime type for ' + options.src + ':' );
    console.log('\t' + colors.yellow(mime.lookup(options.src)));
}

run();
