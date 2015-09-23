'use strict';

var path = require( 'path' );
var expect = require( 'chai' ).expect;
var ExtensionCheck = require( './../lib/ExtensionCheck' );
var rimraf = require('rimraf');


describe( 'ext-check', function () {

    var ec = undefined;
    beforeEach( function () {
        ec = new ExtensionCheck();
    } );

    describe( 'list', function () {

        it( 'should throw an exception for non existing files', function ( done ) {

            ec.list( 'c:\\does_not_exist.zip', function ( err, data ) {
                expect( err ).to.exist;
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
            ec.list( path.resolve( './test/fixtures/extensions/sample.zip' ), function ( err, data ) {
                expect( err ).to.not.exist;
                expect( data ).to.be.an.array;
                expect( data.length ).to.be.equal( 5 );
                expect( data ).to.deep.include({"ext": "qext", "count": 1, "supported": true});
                expect( data ).to.deep.include({"ext": "html", "count": 2, "supported": true});
                expect( data ).to.deep.include({"ext": "js", "count": 2, "supported": true});
                expect( data ).to.deep.include({"ext": "json", "count": 2, "supported": true});
                expect( data ).to.deep.include({"ext": "md", "count": 2, "supported": false});
                done();
            } );
        } );
    } );

    describe( 'check', function () {

        beforeEach( function () {



        } );

        it( 'should throw an exception for non .zip files', function ( done ) {
            expect( true ).to.equal( false );
            done();
        } );

        it( 'should throw an exception if the file doesn\'t exist', function ( done ) {
            expect( true ).to.equal( false );
            done();
        } );

        it( 'should return the total number of files', function ( done ) {
            expect( true ).to.equal( false );
            done();
        } );

        it( 'should return the total number of rejected files', function ( done ) {
            expect( true ).to.equal( false );
            done();
        } );

        it( 'should return the total number of rejected directories', function ( done ) {
            expect( true ).to.equal( false );
            done();
        } );

    } );

} );
