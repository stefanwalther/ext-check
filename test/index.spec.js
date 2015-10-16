'use strict';

var path = require( 'path' );
var chai = require('chai');
var expect = chai.expect;
var chaiSubset = require('chai-subset');
chai.use(chaiSubset);
var ExtensionCheck = require( './../lib/ExtensionCheck' );
var fs = require( 'fs-extra' );
var rimraf = require( 'rimraf' );
var zipper = require( 'zip-local' );
var mkdir = require( 'mkdirp' );

var ec = undefined;
var fixtures = {
    "sampleSrc": './test/fixtures/extensions/sample.zip',
    "sample": './test/.tmp/sample.zip',
    "non_existing_sample": './test/.tmp/not_existing_sample.zip',
    "existing_not_zip": './test/fixtures/extensions/sample.7z',
    "listDir": './test/fixtures/listDir'
};

function prepExamples ( callback ) {
    ec = new ExtensionCheck();

    var srcFiles = './test/fixtures/files/';
    var testZip = './test/.tmp/sample.zip';
    mkdir( './test/.tmp', function () {
        zipper.zip( srcFiles, function ( zipped ) {
            zipped.save( testZip, function () {
                callback();
            } );
        } );
    } );
}

describe( 'ext-check', function () {

    beforeEach( function ( done ) {
        prepExamples( done );
    } );

    afterEach( function ( done ) {
        rimraf( path.resolve( './test/.tmp' ), function () {
            done();
        } );
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
                expect( data.length ).to.be.equal( 9 );
                expect( data ).to.deep.include( {"ext": "<blank>", "count": 1, "rejected": true} );
                expect( data ).to.deep.include( {"ext": "qext", "count": 1, "rejected": false} );
                expect( data ).to.deep.include( {"ext": "html", "count": 2, "rejected": false} );
                expect( data ).to.deep.include( {"ext": "js", "count": 2, "rejected": false} );
                expect( data ).to.deep.include( {"ext": "json", "count": 2, "rejected": false} );
                expect( data ).to.deep.include( {"ext": "md", "count": 2, "rejected": true} );
                expect( data ).to.deep.include( {"ext": "gitignore", "count": 1, "rejected": true} );
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

        it( 'should return everything when defining no file extension, files in .folders should be ignored', function ( done ) {
            ec.listDetails( path.resolve( fixtures.sample ), null, function ( err, data ) {
                expect( err ).to.not.exist;
                expect( data ).to.exist;
                expect( data ).to.have.length.of( 11 );
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
                expect( err ).to.not.exist;
                expect( checkResult.numFiles ).to.be.a.number;
                expect( checkResult.numFiles ).to.be.equal( 14 );
                done();
            } );
        } );

        it( 'should return the total number of rejected files', function ( done ) {
            var fileToCheck = path.resolve( fixtures.sample );
            ec.check( fileToCheck, function ( err, checkResult ) {
                expect( checkResult.checkedFile ).to.be.equal( fileToCheck );
                expect( err ).to.not.exist;
                expect( checkResult.rejectedFiles ).to.be.a.number;
                expect( checkResult.rejectedFiles ).to.have.deep.property( '[0].entryName', '.gitignore' );
                expect( checkResult.rejectedFiles ).to.have.deep.property( '[1].entryName', 'LICENSE' );
                expect( checkResult.rejectedFiles ).to.have.deep.property( '[2].entryName', 'markdown.md' );
                expect( checkResult.rejectedFiles ).to.have.deep.property( '[3].entryName', 'sub/markdown.md' );
                done();
            } );
        } );

        it( 'should return the total number of rejected folders', function ( done ) {
            var fileToCheck = path.resolve( fixtures.sample );
            ec.check( fileToCheck, function ( err, checkResult ) {
                expect( checkResult.checkedFile ).to.be.equal( fileToCheck );
                expect( err ).to.not.exist;
                expect( checkResult.rejectedFolders ).to.be.a.number;
                expect( checkResult.rejectedFolders.length ).to.be.equal( 2 );
                expect( checkResult.rejectedFolders[0] ).to.have.property('safeToRemove', true);
                expect( checkResult.rejectedFolders[1] ).to.have.property('safeToRemove', true);
                done();
            } );
        } );

    } );

    describe( 'fix', function () {

        it( 'creates a backup', function ( done ) {

            ec.fix( path.resolve( fixtures.sample ), true, function ( err, fixResults ) {
                expect( err ).to.not.exist;
                expect( fs.existsSync( fixResults.backupFile ) ).to.be.true;
                done();
            } );

        } );

        it( 'keeps supported files', function ( done ) {
            var destPath = fixtures.sample;
            ec.fix( path.resolve( destPath ), true, function ( err, fixResults ) {
                expect( err ).to.not.exist;
                expect( fs.existsSync( destPath ) ).to.be.true;
                zipper.unzip( destPath, function ( unzipped ) {
                    expect( unzipped ).to.have.property( 'content' );
                    expect( unzipped.content.files ).to.have.property('html.html');
                    expect( unzipped.content.files ).to.have.property('javascript.js');
                    expect( unzipped.content.files ).to.have.property('json.json');
                    expect( unzipped.content.files ).to.have.property('sample.qext');
                    done();
                } );
            } );
        } );

        it( 'keeps supported files', function ( done ) {
            var destPath = fixtures.sample;
            ec.fix( path.resolve( destPath ), true, function ( err, fixResults ) {
                expect( err ).to.not.exist;
                expect( fs.existsSync( destPath ) ).to.be.true;
                zipper.unzip( destPath, function ( unzipped ) {
                    expect( unzipped ).to.have.property( 'content' );
                    //expect( unzipped.content.files ).not.to.have.property('.build/');
                    expect( unzipped.content.files ).not.to.have.property('.build/file1.txt');
                    expect( unzipped.content.files ).not.to.have.property('.build/subfolder/file2.txt');
                    expect( unzipped.content.files ).not.to.have.property('.gitignore');
                    expect( unzipped.content.files ).not.to.have.property('LICENSE');
                    expect( unzipped.content.files ).not.to.have.property('markdown.md');
                    expect( unzipped.content.files ).not.to.have.property('sub/markdown.md');
                    //expect( unzipped.content.files ).not.to.have.property('.idea/');
                    expect( unzipped.content.files ).not.to.have.property('.idea/settings.xml');
                    done();
                } );
            } );
        } );

    } );

    describe( 'getZipsInDir', function () {

        it( 'returns an error if the dir is not existing', function ( done ) {
            ec.getZipsInDir( 'c:\\non_existing_folder', function ( err, zipFiles ) {
                expect( err ).to.exist;
                expect( zipFiles ).to.not.exist;
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

    describe( 'helpers', function () {

        it( 'getFileExtension should return the correct file extension', function () {
            expect( ec.__onlytest__.getFileExtension( 'file.html' ) ).to.be.equal( 'html' );
            expect( ec.__onlytest__.getFileExtension( '.gitignore' ) ).to.be.equal( 'gitignore' );
            expect( ec.__onlytest__.getFileExtension( '.gitkeep' ) ).to.be.equal( 'gitkeep' );
            expect( ec.__onlytest__.getFileExtension( 'c:\\test\\file.html' ) ).to.be.equal( 'html' );
            expect( ec.__onlytest__.getFileExtension( './test/file.html' ) ).to.be.equal( 'html' );
            expect( ec.__onlytest__.getFileExtension( './test/file.version.html' ) ).to.be.equal( 'html' );
            expect( ec.__onlytest__.getFileExtension( './test/file.tar.gz' ) ).to.be.equal( 'gz' );
            expect( ec.__onlytest__.getFileExtension( './test/LICENSE' ) ).to.be.equal( '<blank>' );
            expect( ec.__onlytest__.getFileExtension( 'LICENSE' ) ).to.be.equal( '<blank>' );

        } );

        it( 'getDirectFolder should return the correct folder name', function ( ) {
            expect( ec.__onlytest__.getDirectFolder('sub/.build/' )).to.be.equal('.build');
            expect( ec.__onlytest__.getDirectFolder('./sub/.build/' )).to.be.equal('.build');
            expect( ec.__onlytest__.getDirectFolder('./sub/.build' )).to.be.equal('sub');
            expect( ec.__onlytest__.getDirectFolder('./sub/.gitignore' )).to.be.equal('sub');
            expect( ec.__onlytest__.getDirectFolder('./sub/test/' )).to.be.equal('test');
        } );

    } );

} );
