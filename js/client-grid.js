//var Grid = [];
var KeysPressed = 0; // Bit 0: up. Bit 1: left. Bit 2: right.
var Socket = null;
var GridTimer = null;
var GridFrameTime = 20;
var Page = {
    rows: [[{content: "",blocked:"", timestamp: -1},{content: "",blocked:"", timestamp: -1},{content: "",blocked:"", timestamp: -1},{content: "",blocked:"", timestamp: -1}],
        [{content: "",blocked:"", timestamp: -1},{content: "",blocked:"", timestamp: -1},{content: "",blocked:"", timestamp: -1},{content: "",blocked:"", timestamp: -1}],
        [{content: "",blocked:"", timestamp: -1},{content: "",blocked:"", timestamp: -1},{content: "",blocked:"", timestamp: -1},{content: "",blocked:"", timestamp: -1}],
        [{content: "",blocked:"", timestamp: -1},{content: "",blocked:"", timestamp: -1},{content: "",blocked:"", timestamp: -1},{content: "",blocked:"", timestamp: -1}]
    ],
    name: "",
    lastEdited: -1
};
var Name = null;

document.addEventListener("keyup",
    function(E)
    {
        var d = new Date();
        var idElement = E.target.id;
        var i = idElement.charAt(0);
        var j = idElement.charAt(1);

        Page.rows[i][j].content = $('#'+ i + '' + j+ '').text();
        Page.rows[i][j].timestamp = (new Date()).getTime();
        Page.lastEdited = (new Date()).getTime();

        // Send the grid to the server
        if (Socket && Socket.readyState == 1){
            console.log(JSON.stringify({Type: "U", Page: Page}));
            Socket.send(JSON.stringify({Type: "U", Page: Page}));
        }
    }
);

window.addEventListener("load",
    function()
    {

        var gridDiv = document.getElementById("container");
        gridDiv.width = "100%";
        gridDiv.margin = "0px auto";

        var NameInput = prompt("What is your username?", "Anonymous");

        Name = NameInput;
        Page.name = Name;
        try
        {
            if (typeof MozWebSocket !== "undefined")
                Socket = new MozWebSocket("ws://localhost:9001");
            else if (typeof WebSocket !== "undefined")
                Socket = new WebSocket("ws://localhost:9001");
            else
            {
                Socket = null;
                alert("Your browser does not support websockets. We recommend that you use an up-to-date version of Google Chrome or Mozilla Firefox.");
                return false;
            }
        }
        catch (E) { Socket = null; return false; }

        //Socket.onerror = function(E) { alert("WebSocket error: " + JSON.stringify(E)); };

        Socket.onclose = function (E)
        {
            // Shut down the game loop.
            if (GridTimer) clearInterval(GridTimer);
            GridTimer = null;
        };

        Socket.onopen = function()
        {
            // Send a handshake message.
            Socket.send(JSON.stringify({ Type: "HI", Page: Page }));
        };

        Socket.onmessage = function(E)
        {
            var Message;

            console.log("onmessage called");


            // Check that the message is in the format we expect.
            try { Message = JSON.parse(E.data); }
            catch (Err) { return; }
            if (!("Page" in Message)) return;

            // Overwrite our old Grid array with the new data sent from the server.
            Page =  Message.Page;

            console.log(JSON.stringify(Page));
            DrawGrid();
        };

        $('div').bind("focus",
            function(E)
            {
                var d = new Date();
                var idElement = E.target.id;
                var i = idElement.charAt(0);
                var j = idElement.charAt(1);

                Page.rows[i][j].blocked = Name;
                Page.lastEdited = (new Date()).getTime();

                // Send the grid to the server
                if (Socket && Socket.readyState == 1){
                    Socket.send(JSON.stringify({Type: "F", i: i, j: j, name: Name}));
                }

            }
        );

        $('div').bind("blur",
            function(E)
            {
                var d = new Date();
                var idElement = E.target.id;
                var i = idElement.charAt(0);
                var j = idElement.charAt(1);

                Page.rows[i][j].blocked = "";
                Page.lastEdited = (new Date()).getTime();

                //Send the grid to the server
                if (Socket && Socket.readyState == 1){
                    Socket.send(JSON.stringify({Type: "B", i: i, j: j}));
                }

            }
        );


    }
);

function DrawGrid()
{
    var grid =  Page.rows;
    console.log(JSON.stringify(grid));
    for (var i = 0; i < 4; i++) {
        for (var j = 0; j < 4; j++) {
            if(grid[i]){
                if (grid[i][j].blocked && grid[i][j].blocked != "" && grid[i][j].blocked != Name) {
                    $('#'+i + "" + j+ "").text(grid[i][j].content);
                    $('#'+i + "" + j+ "").addClass("boxblocked");
                    $('#'+i + "" + j+ "").attr("contentEditable","false");
                    $('#'+i + "" + j+ "").attr("title",grid[i][j].blocked);
                }else if (!grid[i][j].blocked){
                    $('#'+i + "" + j+ "").removeClass("boxblocked");
                    $('#'+i + "" + j+ "").text(grid[i][j].content);
                    $('#'+i + "" + j+ "").attr("contentEditable","true");
                }
                else {
                    $('#'+i + "" + j+ "").addClass("effect6");
                    $('#'+i + "" + j+ "").addClass("span3");
                    $('#'+i + "" + j+ "").attr("contentEditable","true");
                    $('#'+i + "" + j+ "").removeAttr("mouseover");
                }
            }
        }
    }

}