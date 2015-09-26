'use strict';

var path = require( 'path' );
var expect = require( 'chai' ).expect;
var ExtensionCheck = require( './../lib/ExtensionCheck' );
var fs = require( 'fs-extra' );

describe( 'ext-check', function () {

    var ec = undefined;
    var fixtures = {
        "sampleSrc": './test/fixtures/extensions/sample.zip',
        "sample": './test/.tmp/sample.zip',
        "non_existing_sample": './test/.tmp/not_existing_sample.zip',
        "existing_not_zip": './test/fixtures/extensions/sample.7z',
        "listDir": './test/fixtures/listDir'
    };
    beforeEach( function ( done ) {
        ec = new ExtensionCheck();
        fs.copySync( path.resolve( fixtures.sampleSrc ), path.resolve( fixtures.sample ) );
        done();
    } );

    describe( 'list', function () {

        it( 'should throw an exception for non existing files', function ( done ) {
            ec.list( 'c:\\does_not_exist.zip', function ( err, data ) {
                expect( err ).to.exist;
                expect( err.errName ).to.be.equal( 'FILE_NOT_EXISTS' );
                done();
            } );
        } );

        it( 'should throw an exception for non .zip files', function ( done ) {

            ec.list( path.resolve( fixtures.existing_not_zip ), function ( err, data ) {
                expect( err ).to.exist;
                expect( err.errName ).to.be.equal( 'NOT_A_ZIP_FILE' );
                done();
            } );
        } );

        it( 'should return the list of file-extensions', function ( done ) {
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

    describe( 'listDetails', function () {

        it( 'should throw an exception for non .zip files', function ( done ) {
            ec.listDetails( path.resolve( fixtures.existing_not_zip ), null, function ( err, data ) {
                expect( err ).to.exist;
                expect( err.errName ).to.be.equal( 'NOT_A_ZIP_FILE' );
                done();
            } );
        } );

        it( 'should throw an exception if the file doesn\'t exist', function ( done ) {
            ec.listDetails( 'c:\\does_not_exist.zip', null, function ( err, data ) {
                expect( err ).to.exist;
                expect( data ).to.not.exist;
                expect( err.errName ).to.be.equal( 'FILE_NOT_EXISTS' );
                done();
            } );
        } );

        it( 'should return everything when defining no file extension', function ( done ) {
            ec.listDetails( path.resolve( fixtures.sample ), null, function ( err, data ) {
                expect( err ).to.not.exist;
                expect( data ).to.exist;
                expect( data ).to.have.length.of( 9 );
                done();
            } );
        } );

        it( 'should filter when defining the file extension', function ( done ) {
            ec.listDetails( path.resolve( fixtures.sample ), "js", function ( err, data ) {
                expect( err ).to.not.exist;
                expect( data ).to.exist;
                expect( data ).to.have.length.of( 2 );
                done();
            } );
        } );

        it( 'allows file extensions with leading .', function ( done ) {
            ec.listDetails( path.resolve( fixtures.sample ), ".html", function ( err, data ) {
                expect( err ).to.not.exist;
                expect( data ).to.exist;
                expect( data ).to.have.length.of( 2 );
                done();
            } );
        } );

        it( 'allows file extensions without leading .', function ( done ) {
            ec.listDetails( path.resolve( fixtures.sample ), "html", function ( err, data ) {
                expect( err ).to.not.exist;
                expect( data ).to.exist;
                expect( data ).to.have.length.of( 2 );
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
            ec.check( path.resolve( fixtures.existing_not_zip ), function ( err, checkResult ) {
                expect( err ).to.exist;
                expect( err.errName ).to.be.equal( 'NOT_A_ZIP_FILE' );
                done();
            } );
        } );

        it( 'should throw an exception if the file doesn\'t exist', function ( done ) {
            var fileToCheck = path.resolve( fixtures.non_existing_sample );
            ec.check( fileToCheck, function ( err, checkResult ) {
                expect( err ).to.exist;
                expect( err.errName ).to.be.equal( 'FILE_NOT_EXISTS' );
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

            ec.fix( path.resolve( fixtures.sample ), true, function ( err, fixResult ) {
                expect( err ).to.be.undefined;
                expect( path.exists( fixResults.backupFile ) ).to.be.true;
                done();
            } );
        } );

        it.skip( 'removes unsupported files', function ( done ) {
            expect( true ).to.equal( false );
            done();
        } );

        it.skip( 'keeps files which are supported', function ( done ) {
            expect( true ).to.equal( false );
            done();
        } );

        it.skip( 'removes unsupported directories', function ( done ) {
            expect( true ).to.equal( false );
            done();
        } );

    } );

    describe( 'getZipsInDir', function () {

        it( 'returns an error if the dir is not existing', function ( done ) {
            ec.getZipsInDir( 'c:\\non_existing_folder', function ( err, zipFiles ) {
                expect( err ).to.exist;
                expect( err.errName ).to.be.equal( 'DIR_NOT_EXISTS' );
                done();
            } );
        } );

        it( 'returns all the zip files in a dir', function ( done ) {
            ec.getZipsInDir( path.resolve( fixtures.listDir ), function ( err, zipFiles ) {
                expect( err ).to.not.exist;
                expect( zipFiles ).to.be.an.array;
                expect( zipFiles ).to.be.of.length( 3 );
                done();
            } );
        } );

    } );

    describe( 'listDir', function () {

        it( 'should return an error if the path doesn\'t exist.', function ( done ) {
            var p = 'C:\\non_existing_dir';
            ec.listDir( p, function ( err, listDirResult ) {
                expect( err ).to.exist;
                expect( err.errName ).to.be.equal( 'DIR_NOT_EXISTS' );
                done();
            } );
        } );

        it( 'should return the results for all .zip files', function ( done ) {
            ec.listDir( path.resolve( fixtures.listDir ), function ( err, listDirResults ) {
                expect( err ).to.not.exist;
                expect( listDirResults ).to.be.an.array;
                expect( listDirResults.length ).to.be.equal( 3 );
                done();
            } );
        } );

        it( 'should return the listResults', function ( done ) {
            ec.listDir( path.resolve( fixtures.listDir ), function ( err, listDirResults ) {
                expect( err ).to.not.exist;
                expect( listDirResults ).to.be.an.array;
                expect( listDirResults ).to.have.length( 3 );
                expect( listDirResults[0].fileChecked ).to.include( 'htm.zip' );
                expect( listDirResults[1].fileChecked ).to.include( 'md.zip' );
                expect( listDirResults[2].fileChecked ).to.include( 'yml.zip' );
                done();
            } );
        } );

    } );
} );
