.pragma library
.import QtQuick.LocalStorage 2.0 as Sql

var database = "HumbleBundleItems";
var queueCommands = new Array();

function queueSize( ) {
	return queueCommands.length
}

function queueAdd( messageObject ){
	queueCommands.push(messageObject);
}

function queuePop( ) {
	return queueCommands.pop();
}

function runQuery(action, query ) {

	if ( action === 'replaceListing' )
	{
		var db = getDatabase()
		var download_struct = query.downloads;
		var dataArray = new Array;
		var valueArray = new Array;

		delete query.downloads
		query.type = parseDownload(query.ident, download_struct);

		for(var o in query) {
			dataArray.push(query[o]);
			valueArray.push('?');
		}

		var object = db.transaction(function (tx) {
			var results = tx.executeSql(
				'REPLACE INTO LISTINGS ('+ Object.keys(query).join(", ") +') VALUES('+ valueArray.join(", ") +')',
				dataArray)
		})

	}

}

function getOrders( ) {
	var array = new Array;
	var db = getDatabase()
	db.readTransaction(function (tx) {
		var results = tx.executeSql('SELECT id, cache FROM ORDERS')
		for ( var i = 0; i < results.rows.length; i++ ) {
			array.push(  results.rows.item(i) );
		}
	})
	return array;
}

function getListing( page, bits ) {

	var array = new Array;
	var db = getDatabase()
	db.readTransaction(function (tx) {

		var results = tx.executeSql('SELECT DISTINCT l.*, platform, date FROM LISTINGS as l,DOWNLOADS as d WHERE ident=id AND platform = "' + page + '" ORDER BY "size"')

		for ( var i = 0; i < results.rows.length; i++ ) {
			array.push( results.rows.item(i) );
		}
	})

	return array;
}

function getInfo(ident, platform) {
	var array = null;
	var db = getDatabase()
	db.readTransaction(function (tx) {
		var results = tx.executeSql('SELECT DISTINCT * FROM LISTINGS as l, DOWNLOADS as d WHERE ident=id AND platform = "' + platform + '" AND ident = "'+ident +'"' )

		if ( results.rows.length > 0 ) {
			array = results.rows.item(0);
		}
	})

	return array;
}
/*
function updateList( notification, listModel ) {

	var db = getDatabase()

	listModel.clear()

	/ * Read the orders * /
	db.readTransaction(function (tx) {
		var results = tx.executeSql('SELECT id, cache FROM ORDERS')
		for ( var i = 0; i < results.rows.length; i++ ) {
			parseOrder(notification, results.rows.item(i).id, results.rows.item(i).cache  )
		}
	})

}
*/

function parseDownload( id, downloads ) {
	var db = getDatabase()
	var types = "|"
	for ( var i = 0; i < downloads.length; i++ ) {
		types += downloads[i].platform + "|";

		for ( var q = 0; q < downloads[i].download_struct.length; q++ ) {
			var w = downloads[i].download_struct[q]
			if ( w.url )
			{
				var object = db.transaction(function (tx) {
					var results = tx.executeSql(
						'REPLACE INTO DOWNLOADS (id, platform, format, version, date, torrent, url, sha1, size) VALUES(?, ?, ?,?, ?, ?, ?,?,?)',
						[id, downloads[i].platform, w.name, downloads[i].download_version_number, w.timestamp, w.url.bittorrent, w.url.web, w.sha1, w.file_size ])
				})
			}
		}
	}
	return types
}

function parseOrder( orderid, ordercache ) {

	var db = getDatabase()
	var obj = JSON.parse( ordercache );

	for ( var i = 0; i < obj.subproducts.length; i++ ) {
		var item = obj.subproducts[i];

		var types = parseDownload( item.machine_name, item.downloads )
		var object = db.transaction(function (tx) {
			var results = tx.executeSql(
				'REPLACE INTO LISTINGS (id, displayName, type) VALUES(?, ?, ?)',
				[item.machine_name, item.human_name, types])
		})
	}
}

function updateOrder( notification, orderid, ordercache ) {
	var component = notification.addNotication("DownloadSnackbar.qml", { "url": ordercache }, function( content ){
		var db = getDatabase()
		var object = db.transaction(function (tx) {
			var results = tx.executeSql(
						'REPLACE INTO ORDERS (id, url, cache) VALUES(?, ?, ?)',
						[orderid, ordercache, content])
		})
	})
}

function parseOrders( notification, fullDownloadedPage ) {
	var keyRegEx = /gamekeys: (\[[A-Za-z0-9\", ]*\])/
	var startIndex = fullDownloadedPage.indexOf("new window.Gamelist(")
	var endIndex = fullDownloadedPage.indexOf(
				");\n  \n});", startIndex)
	var gameOrders = fullDownloadedPage.substring(startIndex + 10, endIndex).match(keyRegEx)

	if ( gameOrders !== null ) {
		var gameOrderArray = JSON.parse(gameOrders[1]);
		if ( gameOrderArray.length ) {
			for( var value in gameOrderArray ) {
				updateOrder(notification, gameOrderArray[value], "https://www.humblebundle.com/api/v1/order/" + gameOrderArray[value] )
			}
		}
		return true
	}
	return false
}



function getDatabase() {
	var db = Sql.LocalStorage.openDatabaseSync(database, "1.0", "", 1000000)
	return db
}

function createDatabase() {
	var db = getDatabase()
	db.transaction( function (tx) {

		var query_orders = 'CREATE TABLE IF NOT EXISTS ORDERS("id" TEXT NO NULL UNIQUE, "url" TEXT, "cache" TEXT );';
		var query_list = 'CREATE TABLE IF NOT EXISTS LISTINGS("ident" VARCHAR PRIMARY KEY  NOT NULL  UNIQUE , "product" VARCHAR NOT NULL , "author" VARCHAR NOT NULL , "type" VARCHAR NOT NULL  DEFAULT unknown, "status" INTEGER, "icon" VARCHAR NOT NULL  DEFAULT "humble-crap64.png", "executable" VARCHAR, "location" VARCHAR, "updated" DATETIME NOT NULL  DEFAULT 0);';
		var query_download = 'CREATE TABLE IF NOT EXISTS DOWNLOADS("id" VARCHAR NOT NULL , "platform" VARCHAR NOT NULL , "format" VARCHAR NOT NULL , "date" DATETIME NOT NULL  DEFAULT 0, "version" VARCHAR, "torrent" TEXT, "url" TEXT, "size" INTEGER NOT NULL  DEFAULT 0, "sha1" TEXT, PRIMARY KEY ("id", "platform", "format"));';


		tx.executeSql( query_orders );
		tx.executeSql( query_list );
		tx.executeSql( query_download );
	})
	return db
}

