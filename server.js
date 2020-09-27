var http     = require( 'http' );
var fs       = require( 'fs' );
var path     = require( 'path' );

//var settings = require('./config.json');
var settings = {
	"docroot": "docs",
	"port": 8080,
	"host": "localhost",
	"mime": {}
};

var MIME =
{
	'css':	'text/css',
	'gif':	'image/gif',
	'gz':	'application/gzip',
	'html':	'text/html',
	'ico':	'image/x-icon',
	'jpg':	'image/jpeg',
	'js':	'text/javascript',
	'json':	'application/json',
	'jsonp':	'application/javascript',
	'png':	'image/png',
	'svg':	'image/svg+xml',
	'svgz':	'image/svg+xml',
	'txt':	'text/plain',
	'zip':	'application/zip',
	'wasm':	'application/wasm',
};

// ======================================== //

function Format( docroot, host, port )
{
	if ( typeof settings.docroot !== 'string' || !settings.docroot )
	{
		settings.docroot = docroot;
	}

	if ( typeof settings.port !== 'number' )
	{
		settings.port = port;
	}

	if ( typeof settings.host !== 'string' )
	{
		settings.host = host;
	}

	if ( typeof settings.mime === 'object' )
	{
		Object.keys( settings.mime ).forEach( function( key )
		{
			MIME[ key ] = settings.mime[ key ];
		} );
	}

	if ( typeof settings.spa !== 'string' )
	{
		settings.spa = '';
	}
}

function E404( res )
{
	res.writeHead( 404, { 'Content-Type': 'text/plain' } );
	res.write( '404: page not found.' );
	res.end();
}

function FileExists( filepath )
{
	try
	{
		return fs.statSync( filepath ).isFile();
	} catch( err ) {}
	return false;
}

function ResponseText( res, filepath, mime )
{
	fs.readFile( filepath, 'utf-8', function( err, data )
	{
		if( err ) { return E404( res ); }
		res.writeHead( 200, { 'Content-Type': mime } );
		res.write( data );
		res.end();
	} );
}

function ResponseBinary( res, filepath, mime )
{
	fs.readFile( filepath, function( err, data )
	{
		if( err ) { return E404( res ); }
		res.writeHead( 200, { 'Content-Type': mime } );
		res.write( data );
		res.end();
	} );
}

function CheckFile( filepath )
{
	if ( filepath.match( /\/$/ ) && !settings.spa ) { filepath += 'index.html'; }
	filepath = path.join( settings.docroot, filepath );

	if ( FileExists( filepath ) ) { return filepath; }

	// Not SPA or file ... Not found.
	if ( !settings.spa || filepath.match( /\.[^\.]+$/ ) ) { return ''; }

	// SPA && path is not file( /, /test/, /hoge/fuga, etcc...)
	filepath = path.join( settings.docroot, settings.spa );
	if ( FileExists( filepath ) ) { return filepath; }

	return '';
}

function ServerStart( settings )
{
	var server = http.createServer();
	server.on( 'request', function ( req, res )
	{
		var filepath = CheckFile( ( req.url || '/' ).split( '?' )[ 0 ] );

		if ( !filepath ) { return E404( res ); }

		var extname = path.extname( filepath ).replace( '.', '' );
		var mime = MIME[ extname ] || 'text/plain';

		if ( mime.indexOf( 'text/' ) === 0 )
		{
			ResponseText( res, filepath, mime );
		} else
		{
			ResponseBinary( res, filepath, mime );
		}
	} );

	console.log( settings.host + ( settings.port === 80 ?  '' : ':' + settings.port ) );
	server.listen( settings.port, settings.host );
}

console.log( settings );

Format( 'docs', 'localhost', 8080 );

ServerStart( settings );
