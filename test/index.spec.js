'use strict';

var path = require( 'path' );
var expect = require( 'chai' ).expect;
var ExtensionCheck = require( './../lib/ExtensionCheck' );
var fs = require('fs-extra');
//var rimraf = require( 'rimraf' );
//var zipLib = require( 'adm-zip' );

describe( 'ext-check', function () {

    var ec = undefined;
    var fixtures = {
        "sampleSrc": './test/fixtures/extensions/sample.zip',
        "sample": './test/.tmp/sample.zip',
        "non_existing_sample": './test/.tmp/not_existing_sample.zip',
        "existing_not_zip": './test/fixtures/extensions/sample.7z'
    };
    beforeEach( function ( done ) {
        ec = new ExtensionCheck();
        fs.copySync(path.resolve(fixtures.sampleSrc), path.resolve( fixtures.sample));
        done();
    } );

    describe( 'list', function () {

        it( 'should throw an exception for non existing files', function ( done ) {
            ec.list( 'c:\\does_not_exist.zip', function ( err, data ) {
                expect( err ).to.exist;
                expect( err.errName ).to.be.equal('FILE_NOT_EXISTS');
                done();
            } );
        } );

        it( 'should throw an exception for non .zip files', function ( done ) {

            ec.list( 'c:\\does_not_exist.zip', function ( err, data ) {
                expect( err ).to.exist;
                done();
            } );
        } );

        it( 'should return the list of extensions', function ( done ) {
            ec.list( path.resolve( fixtures.sample ), function ( err, data ) {
                expect( err ).to.not.exist;
                expect( data ).to.be.an.array;
                expect( data.length ).to.be.equal( 5 );
                expect( data ).to.deep.include( {"ext": "qext", "count": 1, "rejected": false} );
                expect( data ).to.deep.include( {"ext": "html", "count": 2, "rejected": false} );
                expect( data ).to.deep.include( {"ext": "js", "count": 2, "rejected": false} );
                expect( data ).to.deep.include( {"ext": "json", "count": 2, "rejected": false} );
                expect( data ).to.deep.include( {"ext": "md", "count": 2, "rejected": true} );
                done();
            } );
        } );
    } );

    describe( 'check', function () {


        // Todo: Automate the tests and fixtures in a better way
        //beforeEach( function ( callback) {
        //
        //    rimraf(path.resolve('./test/.tmp'), function (  ) {
        //        var testZip = './test/.tmp/sample.zip';
        //        var zip = new zipLib();
        //        zip.addLocalFolder(path.resolve('./test/fixtures/files'), path.resolve(testZip));
        //        zip.writeZip(path.resolve('./test/.tmp/sample.zip'));
        //        callback();
        //    });
        //} );

        it( 'should throw an exception for non .zip files', function ( done ) {
            var fileToCheck = path.resolve( fixtures.existing_not_zip );
            ec.check( fileToCheck, function ( err, checkResult ) {
                expect( err ).to.exist;
                expect( err.errName ).to.be.equal('NOT_A_ZIP_FILE');
                done();
            } );
        });

        it( 'should throw an exception if the file doesn\'t exist', function ( done ) {
            var fileToCheck = path.resolve( fixtures.non_existing_sample );
            ec.check( fileToCheck, function ( err, checkResult ) {
                expect( err ).to.exist;
                expect( err.errName ).to.be.equal('FILE_NOT_EXISTS');
                done();
            } );
        } );

        it( 'should return the total number of files', function ( done ) {
            ec.check( path.resolve( fixtures.sample ), function ( err, checkResult ) {
                expect( err ).to.be.undefined;
                expect( checkResult.numFiles ).to.be.a.number;
                expect( checkResult.numFiles ).to.be.equal( 9 );
                done();
            } );
        } );

        it( 'should return the total number of rejected files', function ( done ) {
            var fileToCheck = path.resolve( fixtures.sample );
            ec.check( fileToCheck, function ( err, checkResult ) {
                expect( checkResult.checkedFile ).to.be.equal( fileToCheck );
                expect( err ).to.be.undefined;
                expect( checkResult.rejectedFiles ).to.be.a.number;
                expect( checkResult.rejectedFiles.length ).to.be.equal( 2 );
                done();
            } );
        } );

        it( 'should return the total number of rejected folders', function ( done ) {
            var fileToCheck = path.resolve( fixtures.sample );
            ec.check( fileToCheck, function ( err, checkResult ) {
                expect( checkResult.checkedFile ).to.be.equal( fileToCheck );
                expect( err ).to.be.undefined;
                expect( checkResult.rejectedFolders ).to.be.a.number;
                expect( checkResult.rejectedFolders.length ).to.be.equal( 0 );
                expect( checkResult.rejectedFolders ).to.be.a.number;
                done();
            } );
        } );

    } );

    describe( 'fix', function () {

        it.skip( 'creates a backup', function ( done ) {

            ec.fix( path.resolve( fixtures.sample), true, function ( err, fixResult ) {
                expect( err ).to.be.undefined;
                expect( path.exists( fixResults.backupFile) ).to.be.true;
                done();
            });
        } );

    } );

} );
