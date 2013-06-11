/*
 * SelecTable by Josh Rouwhorst
 * http://keybored.co
 * (c) 2013, Released under the GNU v2 license
 */

(function($){
	
	var allValues = [],
		tableObjects = [],
		tableIndex = 0,
		TABLE_CLASS = "st-table",
		SELECT_CLASS = "st-record-selected",
		defaultOptions = {
			noHeader: false,
			columns: [],
			data: [],
			onSelect: false,
			rowClasses: ["st-record-main", "st-record-alternate"]
		};
	
	$.fn.selecTable = function(options){
		var columns,
			data,
			selectedRecords = [],
			lastClickedRecord,
			returnValues;
		
		var val = function(index){
			var returnArr = [];
			
			for (var i = 0; i < allValues[index].length; i++) {
				if (allValues[index][i].selected) {
					returnArr.push(allValues[index][i].record);
				}
			}
			
			return returnArr;
		}
		
		var refreshSelections = function(index){
			var tableObj;
			
			for (var i = 0; i < allValues.length; i++) {
				if (index !== undefined && i !== index) {
					continue;
				}
				
				tableObj = tableObjects[i];
				
				for (var j = 0; j < allValues[i].length; j++) {	
					if (!allValues[i][j].elem) {
						allValues[i][j].elem = tableObj.find("tr[st-data='" + j + "']");
					}
					
					if (!allValues[i][j].elem || allValues[i][j].elem.length <= 0) {
						continue;
					}
					
					if (allValues[i][j].selected) {
						allValues[i][j].elem.addClass(SELECT_CLASS);
					}
					else{
						allValues[i][j].elem.removeClass(SELECT_CLASS);
					}
					
				}
				
				if (options.onSelect && typeof options.onSelect === "function") {
					options.onSelect( val(i),  tableObjects[i] );
				}
				
			}
		}
		
		var clear = function(tableIndex, recordIndex){
			
			for (var i = 0; i < allValues.length; i++) {
				if (tableIndex !== undefined && i !== tableIndex) {
					continue;
				}
				
				for (var j = 0; j < allValues[i].length; j++) {
					if (recordIndex !== undefined && j !== recordIndex) {
						continue;
					}
					
					allValues[i][j].selected = false;
				}
			}
			
			refreshSelections(tableIndex);
		}
		
		var multiSelect = function(start, end, table){
			var started = false,
				ended = false;
			
			for (var i = 0; i < table.length && !ended; i++) {
				if (table[i].record === start.record || table[i].record === end.record) {
					if (started) ended = true;
					else started = true;
				}
				
				if (started) {
					table[i].selected =  true;
				}
			}
		};
		
		var click = function(e){
			var $this = $(this),
				shift,
				ctrl,
				recordId = parseInt($this.attr("st-data"), 10),
				tableId = parseInt($this.parents("table[st-table]").attr("st-table"), 10),
				clickedRecord = allValues[tableId][recordId],
				multiselect = options.multiselect || false,
				currentRecord,
				found;
			
			clickedRecord.elem = $this;
			
			for (var i = 0; i < allValues[tableId].length && !currentRecord; i++) {
				if (allValues[tableId][i].selected) {
					currentRecord = allValues[tableId][i];
				}
			}
			
			if (currentRecord && lastClickedRecord && multiselect) {
				shift = (e.shiftKey || e.shiftLeft) ? true : false;
				ctrl = (e.ctrlKey || e.ctrlLeft) ? true : false;
				
				if (shift && lastClickedRecord.record !== clickedRecord.record) {
					multiSelect(lastClickedRecord, clickedRecord, allValues[tableId]);
				}
				else if (shift) {
					
					for (var i = 0; i < allValues[tableId].length; i++) {
						allValues[tableId][i].selected = false;
					}
					
					clickedRecord.selected = true;
					
				}
				else if (ctrl) {
					
					found = false;
					for (var i = 0; i < selectedRecords.length && !found; i++) {
						if (clickedRecord.record === selectedRecords[i].record) {
							clickedRecord.selected = false;
							found = true;
						}
					}
					
					if (!found) {
						clickedRecord.selected = true;
					}
					
				}
				else if (clickedRecord.selected) {
					clickedRecord.selected = false;
				}
				else{
					
					for (var i = 0; i < allValues[tableId].length; i++) {
						allValues[tableId][i].selected = false;
					}
					
					clickedRecord.selected = true;
					
				}
			}
			else if (clickedRecord.selected) {
				clickedRecord.selected = false;
			}
			else{
				
				for (var i = 0; i < allValues[tableId].length; i++) {
					allValues[tableId][i].selected = false;
				}
				
				clickedRecord.selected = true;
				
			}
			
			lastClickedRecord = clickedRecord;
			
			refreshSelections( tableId );
		};	
		
		if (options && typeof options === "string" && (options === "val" || options === "value")) {
			returnValues = [];
			
			this.each(function(){
				var $this = $(this),
					index = parseInt($this.attr("st-table"), 10);
				
				returnValues.push({
					table: $this,
					val: val(index)
				});
			});
			
			if (returnValues.length <= 0) {
				return false;
			}
			else if (returnValues.length === 1) {
				return returnValues[0].val;
			}
			else{
				return returnValues;
			}
		}
		
		if (options && typeof options === "string" && options === "clear") {
			
			return this.each(function(){
				var $this = $(this),
					index = parseInt($this.attr("st-table"), 10);
				
				clear(index);
			});
		}
		
		if (!options || !options instanceof Object) {
			options = {};
		}
		
		for (var opt in defaultOptions) {
			if (options[opt] === undefined) {
				options[opt] = defaultOptions[opt];
			}
		}
		
		data = options.data;
		columns = options.columns;
		
		return this.each(function(){
			var $this = $(this),
				thead = $this.find("thead"),
				tbody = $this.find("tbody"),
				tfoot = $this.find("tfoot"),
				thisTableIndex = tableIndex++,
				headerHtml,
				headerValue,
				bodyHtml = "",
				rowClass,
				columnClasses = [],
				alternateColorIndex = -1,
				selected;
			
			allValues[thisTableIndex] = [];
			
			$this.addClass(TABLE_CLASS).attr("st-table", thisTableIndex);
			
			var alternateColor = function( record ){
				if (typeof options.rowClasses === "function") {
					return options.rowClasses(record);
				}
				else if (++alternateColorIndex > options.rowClasses.length - 1) {
					alternateColorIndex = 0;
				}
				
				if (options.rowClasses[alternateColorIndex]) {
					return options.rowClasses[alternateColorIndex];
				}
				else{
					return "";
				}
			};
			
			var makeCell = function( config ){
				var columnValue = config.column.value( config.datum ) || "&nbsp;",
					columnClass = (config.columnClass ? " class='" + config.columnClass + "'" : "");
				
				return "<td" + columnClass + ">" + columnValue + "</td>";
			};
			
			/*if (tbody.length <= 0) {
				tbody = $("<tbody></tbody>");
				$this.html(tbody);
			}*/
			$this.html("");
			
			if (thead.length <= 0 && columns.length > 0 && !options.noHeader) {
				headerHtml = "<thead" + (options.theadClass ? " class='" + options.theadClass : "") + "'><tr>";
				
				for (var i = 0; i < columns.length; i++) {
					if (typeof columns[i].class === "function") {
						columnClasses[i] = columns[i].class(columns[i]);
					}
					else if (columns[i].class) {
						columnClasses[i] = columns[i].class;
					}
					
					headerValue = columns[i].name || "&nbsp;";
					
					headerHtml += "<th" + (columnClasses[i] ? " class='" + columnClasses[i] + "'" : "") + ">" + columns[i].name + "</th>";
				}
				
				headerHtml += "</tr></thead>";
				
				thead = $(headerHtml);
				
				$this.html(thead);
			}
			
			for (var i = 0; i < data.length; i++) {
				selected = typeof data[i] === "object" && data[i].selected ? true : false;
				allValues[thisTableIndex][i] = { record: data[i], selected: selected };
				
				rowClass = "";
				
				if (selected) {
					rowClass += (rowClass ? " " : "") + "st-record-selected";
				}
				
				rowClass += (rowClass ? " " : "") + alternateColor( data[i] );
				
				bodyHtml += "<tr st-data='" + i + "' class='" + rowClass + "'>";
				
				for (var j = 0; j < columns.length; j++) {
					bodyHtml += makeCell({
						datum: data[i],
						column: columns[j],
						columnClass: columnClasses[j]
					});
				}
				
				bodyHtml += "</tr>";
			}
			
			if (thead.length > 0) {
				
			}
			
			tbody = $("<tbody>" + bodyHtml + "</tbody>");
			
			if (thead.length > 0) {
				thead.after(tbody);
			}
			else{
				$this.html(tbody);
			}
			
			tbody.find("tr").click( click );
			
			thead.click(function(){
				clear( thisTableIndex );
			});
			
			tableObjects[thisTableIndex] = $this;
			
		});
		
	};
	
})( jQuery );