var System = require("sys");
var HTTP = require("http");
var WebSocketServer = require("C:/Program Files/nodejs/node_modules/websocket").server;
var MaxConnections = 10;
var Connections = {};
var lastEditedPage = {
    rows: [[{content: "",blocked:"", timestamp: -1},{content: "",blocked:"", timestamp: -1},{content: "",blocked:"", timestamp: -1},{content: "",blocked:"", timestamp: -1}],
        [{content: "",blocked:"", timestamp: -1},{content: "",blocked:"", timestamp: -1},{content: "",blocked:"", timestamp: -1},{content: "",blocked:"", timestamp: -1}],
        [{content: "",blocked:"", timestamp: -1},{content: "",blocked:"", timestamp: -1},{content: "",blocked:"", timestamp: -1},{content: "",blocked:"", timestamp: -1}],
        [{content: "",blocked:"", timestamp: -1},{content: "",blocked:"", timestamp: -1},{content: "",blocked:"", timestamp: -1},{content: "",blocked:"", timestamp: -1}]
    ],
    name: "",
    lastEdited: -1
};

// Creates an HTTP server that will respond with a simple blank page when accessed.
var HTTPServer = HTTP.createServer(
			function(Request, Response)
			{
				Response.writeHead(200, { "Content-Type": "text/plain" });
				Response.end();
			}
			);

// Starts the HTTP server on port 9001.
HTTPServer.listen(9001, function() { System.log("Listening for connections on port 9001"); });

// Creates a WebSocketServer using the HTTP server just created.
var Server = new WebSocketServer(
			{
				httpServer: HTTPServer,
				closeTimeout: 2000
			}
			);
			
// When a client connects...
Server.on("request",
			function(Request)
			{
				if (ObjectSize(Connections) >= MaxConnections)
				{
					Request.reject();
					return;
				}
				
				var Connection = Request.accept(null, Request.origin);
				Connection.IP = Request.remoteAddress;
				
				// Assign a random ID that hasn't already been taken.
				do { Connection.ID = Math.floor(Math.random() * 100000) } while (Connection.ID in Connections);
				Connections[Connection.ID] = Connection;
				
				Connection.on("message",
					function(Message)
					{
						// All of our messages will be transmitted as unicode text.
						if (Message.type == "utf8"){
                            HandleClientMessage(Connection.ID, Message.utf8Data);
                        }

					}
					);
					
				Connection.on("close",
					function()
					{
						HandleClientClosure(Connection.ID);
					}
					);
				
				System.log("Logged in " + Connection.IP + "; currently " + ObjectSize(Connections) + " users.");
			}
			);

function HandleClientClosure(ID)
{
	if (ID in Connections)
	{
		System.log("Disconnect from " + Connections[ID].IP);
		delete Connections[ID];
	}
}

function HandleClientMessage(ID, Message)
{
	// Check that we know this client ID and that the message is in a format we expect.
	if (!(ID in Connections)) return;
	
	try { Message = JSON.parse(Message); }
	catch (Err) { return; }
	if (!("Type" in Message || "Page" in Message)) {
        System.log("No Type or page message");
        return;
    }

	// Handle the different types of messages we expect.
	var C = Connections[ID];
	switch (Message.Type)
	{
		// Handshake.
        case "HI":
			SendGameState();
			break;
			
		// Key up.
        case "U":
            lastEditedPage = Message.Page;
            SendGameState();
            break;

        // Blur.
        case "B":
            blur(Message);
            break;

        // Focus.
        case "F":
            focus(Message);
            break;
	}
}

function SendGameState()
{
    //mergeIntoMostRecentVersion();
	
	// Go through all of the connections and send them the latest version of the page
    for (var ID in Connections){
         Connections[ID].sendUTF(JSON.stringify({ Page: lastEditedPage }));
    }
}

//function mergeIntoMostRecentVersion()
//{
//    for (var i = 0; i < 4; i++) {
//        for (var j = 0; j < 4; j++) {
//            for (var ID in Connections)
//            {
//                var myRows = Connections[ID].Page.rows;
//                if(myRows[i][j].blocked){
//                    lastEditedPage.rows[i][j]= myRows[i][j];
//                }
//            }
//        }
//    }
//}

function blur(msg)
{
    lastEditedPage.rows[msg.i][msg.j].blocked = "";
}

function focus(msg)
{
    lastEditedPage.rows[msg.i][msg.j].blocked = msg.name;
}
			
function ObjectSize(Obj)
{
	var Size = 0;
	for (var Key in Obj)
		if (Obj.hasOwnProperty(Key))
			Size++;
			
	return Size;
}