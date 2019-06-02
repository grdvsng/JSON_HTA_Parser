/*  JSONparser
	description: JSON parser for HTA, where parse doesn't work.
	
	author: Trishkin Sergey
	
	example:
		JSONParse(string with JSON);
		>> Object

*/

function JSONParse(data) {
	
	this.findSymbal = function(self, data, symbal, last) {
		var returnLast = (last !== undefined) ? true:false,
			forParse   = data.split(""),
			innerIndex = 0;

		for (var i = 0; i < forParse.length; i++) {
			if (forParse[i] === symbal) {
				innerIndex = i;
				if (!returnLast) {break;}
			}
		}

		return innerIndex;
	}

	this.firstSlice = function(self, data) {
		var firstInner = self.findSymbal(self, data, "{"),
			lastInner  = self.findSymbal(self, data, "}", true);

		return data.slice(firstInner + 1, lastInner);
	}
	
	this.isDataRedy = function(self, symbal, contentType, lastSymbal, nextLvl, firstKey) {
		var result = false;

		if (contentType === Object)  {return (symbal === "}") & (nextLvl === 0);}
		if (contentType === String)  {return (firstKey === symbal);}
		if (contentType === Number)  {return (symbal === ",") || (symbal === "");}
		if (contentType === Boolean) {return symbal.match(/[e,]/) !== null;}
		if (lastSymbal)              {return true;}
		
		return false;
	}
	
	this.isBoolean = function(self, str) {
		if (str === "True" || str === "true")        {return true;}
		else if (str === "False" || str === "false") {return false;}
		else 										 {return str;}
	}

	this.contentType = function(self, symbal) {
		var result = false;

		if      (symbal === "{")         {result = Object;}
		else if (symbal.match(/['"]/))   {result = String;}
		else if (symbal.match(/[\d]/))   {result = Number;}
		else if (symbal.match(/[TtFf]/)) {result = Boolean;}

		return result;
	}

	this.stringSpecialSymbals = function(data) {
		// console.log(data)
		var result = data.match(/['"][^]*['"]/gi)[0].replace(/^['"]/, "").replace(/['"]$/, "");

		if (result.search("String.fromCharCode") !== -1){
			result = String.fromCharCode(Number(result.split("String.fromCharCode")[1].replace(")", "").replace("(", "")));
		}
		return result;
	}

	this.dataAppend = function(self, contentType, data) {
		var result,
			data = data;

		if (contentType === Object)  {result = self.parse(self, data);}
		if (contentType === String)  {result = self.stringSpecialSymbals(data);}
		if (contentType === Number)  {result = self.parseInt(data.match(/[\d]*/)[0]);}
		if (contentType === Boolean) {result = self.isBoolean(self, data);}

		return result;
	}

	this.parse = function(self, data) {
		var curData     = self.firstSlice(self, data).split(""),
			isKeyStart  = false,
			isKey       = false,
			nowString   = "",
			objData     = {},
			isDataRedy  = false,
			contentType = false,
			nextLvl     = 0,
			firstKey    = false;

		for (var n = 0; n < curData.length; n++) {
			var symbal = curData[n];

			if (!isKey) {
				if (!isKeyStart) {isKeyStart = Boolean(symbal === '"');}
				else  {
					nowString += symbal;
					
					if (symbal === '"') {
						isKeyStart = false;
						isKey      = nowString.replace('"', "");
						nowString  = "";
					}
				}
			}

			else {
				if (!isDataRedy) {
					if (!contentType) {	
						contentType = self.contentType(self, symbal);

					}
					if (contentType)  {
						nowString  += symbal;
						
						if (contentType === Object & symbal === "{") {nextLvl += 1;}
						if (contentType === Object & symbal === "}") {nextLvl -= 1;}
						
						isDataRedy = self.isDataRedy(self, symbal.replace(/^\s+|\s+$/gm,''), contentType, n === (curData.length - 1), nextLvl, firstKey);
						firstKey   = !firstKey ? symbal:firstKey;
					}
				}

				if (isDataRedy) {
					objData[isKey] = self.dataAppend(self, contentType, nowString);
					isKey          = false;
					isDataRedy     = false;
					contentType    = false;
					firstKey       = false
					nowString      = "";
				}
			}
		}

		return objData;
	}

	return this.parse(this, data);
}

/* Test
var book = `
{
	"window": {
		"size": {
			"width": 1000,
			"heigth": 700
		},

		"style": {
			"theme": "DARK",
			
			"themes": {
				
				"DARK": {
					"elems": {
						"mainFrame": {
							"backgroundColor": "#262626",
							"color": "#7b7b7b"
						},

						"ContextMenu": {
							"backgroundColor": "rgb(200, 200, 200)"
						},

						"MonitorTable": {
							"backgroundColor": "rgb(50, 50, 50)"
						},

						"ThemeSetting": {
							"backgroundColor": "rgb(25, 25, 25)",
							"color": "White"
						}
						
					}

				},

				"LIGHT": {
					"elems": {
						"mainFrame": {
							"backgroundColor": "White",
							"color": "#c53211"
						},

						"ContextMenu": {
							"backgroundColor": "rgb(65, 65, 65)"
						},

						"MonitorTable": {
							"backgroundColor": "rgb(200, 200, 200)"
						},

						"ThemeSetting": {
							"backgroundColor": "white",
							"color": "rgb(25, 25, 25)"
						}
					}
				}
			}
		},
	
		"refresh_interval": 15
	}, 
	
	"log": {
		"path": ".\\temp\\qp_server.log",
		
		"parseOptions": {
			"nodeName": "Branch",
			
			"ValueForCheck": {
				"id": "code",
				
				"gradation": {
					"0": "fine",
					"1,4": "warning",
					"-1": "error"
				}
			},
			
			"extract": {
				"keyWord": "statusCode=",
				"firstLevelDeterminer": " ",
				"nextLevelDeterminer": ",",
				"isRemainder": "time",
				
				"preClean": {
					"deleteAllAfter": "[",
					"until": "String.fromCharCode(123)",
					"determiner": ", ",
					"removeAll": "{, }"
				},
				
				"nodes": {
					"id": {
						"keyWord": "BranchId",
						"determiner": "=",
						"deterPos": 1,
						"type": "Number"
					},

					"time": {
						"keyWord": "timestamp",
						"determiner": " statusCode",
						"deterPos": 0,
						"type": "Date"
					},

					"code": {
						"keyWord": "statusCode",
						"determiner": "=",
						"deterPos": 1,
						"type": "Number"
					}
				}
			},

			"determiner": {
				"row": "\n",
				"cell": "="
			}
		},
		
		"toFormat": {
			"nodes": "id,time,code",
			"title": "Branch",
			"htmlElem": "td"
		}
	},
	

	"db": {
		"path": ".\\db.json",
		"data": 0
	}
	
	"objsTypes": {
		"error": "#ff0033",
		"warning": "rgb(242, 177, 52)",
		"fine": "#2E8B57"
	}
}`

console.log(JSONParse(book));
console.log('   ".\\temp\\qp_server"'.match(/['"][^]*['"]/gi)[0].replace(/^['"]/, "").replace(/['"]$/, ""))
*/