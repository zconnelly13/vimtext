function init() {
    var textAreas = document.getElementsByTagName('textarea');
    var testArea = textAreas[2];
    replaceTextAreaWithVimtextArea(testArea);
}

function replaceTextAreaWithVimtextArea(textArea) {
    //hideTextArea(textArea);
    var vimtextArea = new VimtextArea(textArea);
    vimtextArea.replaceTextArea();
}

function hideTextArea(textArea) {
    textArea.style.height = 0;
    textArea.style.width = 0;
    textArea.style.position = "fixed";
    textArea.style.top = "-100px";
}

function getTextAreaWidth(textArea) {
    var width = textArea.getAttribute('width');
    if (width == "" || width === undefined) {
        width = "500px";
    }
}

function getTextAreaHeight(textArea) {
    var height= textArea.getAttribute('height');
    if (height == "" || height === undefined) {
        height = "100px";
    }
}

function VimtextArea(textArea) {

    this.insertMode = true;
    this.normalMode = false;

    this.copyBuffer = "";
    this.copiedWholeLine = false;

    this.textArea = textArea;
    this.textArea.style.fontFamily = "Courier New";
    this.textArea.style.fontSize = "15px";

    this.width = getTextAreaWidth(textArea);
    this.height = getTextAreaHeight(textArea);

    this.element = document.createElement('div');
    this.element.style.width = "500px";
    this.element.style.height = "100px";
    this.element.style.backgroundColor = '#333333';
    this.element.style.color = '#ffffff';
    this.element.id = "vimtextarea";
    this.element.style.padding = "2px 2px 2px 2px";
    this.element.style.border = "1px 1px 1px 1px";
    this.element.style.borderStyle = "solid";
    this.element.style.borderColor = "grey";
    this.element.style.fontFamily = "Courier New";
    this.element.style.fontSize = "15px";
    this.element.style.whiteSpace = "pre-wrap";
    this.element.setAttribute("tabindex",0);

    this.history = [];
    this.historyPosition = -1;
    this.saveState = function() {
        this.history = this.history.slice(0,this.historyPosition+1);
        var state = {
            caratPosition: this.getCaratPosition(),
            textAreaValue: this.textArea.value + "" 
        };
        this.history.push(state);
        this.historyPosition = this.history.length - 1;
        console.log(this.history);
    }

    this.undo = function() {
        if (this.historyPosition >= 0) {
            this.historyPosition--;
            var previousState = this.history[this.historyPosition];
            this.loadState(previousState);
        }
    }

    this.redo = function() {
        if (this.historyPosition != this.history.length-1) {
            this.historyPosition++;
            var nextState = this.history[this.historyPosition];
            this.loadState(nextState);
        }
    }

    this.loadState = function(state) {
        console.log(this.history);
        this.textArea.value = state.textAreaValue;
        this.textArea.selectionStart = state.caratPosition;
        this.textArea.selectionEnd = state.caratPosition;
    }

    this.replaceTextArea = function() {
        this.textArea.parentNode.insertBefore(this.element,textArea.nextSibling);
    }

    this.setTextAreaEventListeners = function() {
        var vimtext = this;

        this.textArea.addEventListener('keydown',function(event) {
            // fucking javascript http://stackoverflow.com/questions/14841739/javascript-keypress-event-get-end-value-of-textarea
            var e = event;
            if (vimtext.insertMode) {
                setTimeout(function() {
                    vimtext.keyDown(e);
                },0);
            } else if (vimtext.normalMode) {
                vimtext.normalKeyDown(e);
                event.preventDefault();
            }
        });

        this.textArea.addEventListener('keypress',function(event) {
        });

        this.textArea.addEventListener('keyup',function(event) {
        });

        this.textArea.addEventListener('focus',function(event) {
            vimtext.element.style.borderColor = '#b5e7b4';
        });

        this.textArea.addEventListener('blur',function(event) {
            vimtext.element.style.borderColor = 'grey';
        });
    }

    this.keyCodeToCharacter = function(keyCode,shift) {
        if (shift) {
            var keyCode = keyCode + 500;
        }
        var map = [
            [9,"<TAB>"],

            [48,"0"],
            [49,"1"],
            [50,"2"],
            [51,"3"],
            [52,"4"],
            [53,"5"],
            [54,"6"],
            [55,"7"],
            [56,"8"],
            [57,"9"],

            [65,"a"],
            [66,"b"],
            [67,"c"],
            [68,"d"],
            [69,"e"],
            [70,"f"],
            [71,"g"],
            [72,"h"],
            [73,"i"],
            [74,"j"],
            [75,"k"],
            [76,"l"],
            [77,"m"],
            [78,"n"],
            [79,"o"],
            [80,"p"],
            [81,"q"],
            [82,"r"],
            [83,"s"],
            [84,"t"],
            [85,"u"],
            [86,"v"],
            [87,"w"],
            [88,"x"],
            [89,"y"],
            [90,"z"],

            [192,"`"],
            [219,"["],
            [221,"]"],
            [719,"{"],
            [721,"}"],
            [222,"'"],
            [722,'"'],
            [688,"<"],
            [690,">"],

            // Shift Keys
            [509,"<SHIFT-TAB>"],

            [548,")"],
            [549,"!"],
            [550,"@"],
            [551,"#"],
            [552,"$"],
            [553,"%"],
            [554,"^"],
            [555,"&"],
            [556,"*"],
            [557,"("],

            [565,"A"],
            [566,"B"],
            [567,"C"],
            [568,"D"],
            [569,"E"],
            [570,"F"],
            [571,"G"],
            [572,"H"],
            [573,"I"],
            [574,"J"],
            [575,"K"],
            [576,"L"],
            [577,"M"],
            [578,"N"],
            [579,"O"],
            [580,"P"],
            [581,"Q"],
            [582,"R"],
            [583,"S"],
            [584,"T"],
            [585,"U"],
            [586,"V"],
            [587,"W"],
            [588,"X"],
            [589,"Y"],
            [590,"Z"],

        ];
        var character = "";
        for (var i=0;i<map.length;i++) {
            if (map[i][0] == keyCode) {
                character = map[i][1];
            }
        }
        return character;
    }

    this.acceptMotion = false;
    this.acceptMotionInitiator = null;
    this.acceptMotionBuffer = "";

    this.getLocationOfCharacterInFrontOfCaratOnCurrentLine = function(character,occurences) {
        var lines = this.getLines();
        var currentLine = this.getLines()[this.getCaratLine()];
        var currentPosition = this.getCaratPositionOnLine();
        var searchString = currentLine.substr(currentPosition+1);
        var count = searchString.match(new RegExp(character,"g"));
        var indexOfCharacterOnLine = null;
        if (count !== null && count.length >= occurences) {
            var indexOfCharacterOnLine  = searchString.split(character,occurences).join(character).length;
        } else {
            indexOfCharacterOnLine = null;
        }
        return indexOfCharacterOnLine;
    }

    this.deleteUntil = function(character,occurences) {
        var locationOfCharacterRelativeToCursor = this.getLocationOfCharacterInFrontOfCaratOnCurrentLine(character,occurences);
        this.deleteRangeRight(this.getCaratPosition(),this.getCaratPosition()+locationOfCharacterRelativeToCursor+1);
        var deleted = true;
        if (locationOfCharacterRelativeToCursor == null) {
            deleted = false;
        }
        return deleted;
    }

    this.reverseString = function(string) {
        var reversedString = string.split("").reverse().join("");
        return reversedString;
    }

    this.getLocationOfNthOccurence = function(string,character,occurences) {
        var count = string.match(new RegExp("\\" + character,"g"));
        var locationOfCharacter = null;
        if (count !== null && count.length >= occurences) {
            locationOfCharacter = string.split(character,occurences).join(character).length;
        } else {
            locationOfCharacter = null;
        }
        return locationOfCharacter;
    }

    this.getLocationOfLastNthOccurence = function(string,character,occurences) {
        var string = this.reverseString(string);
        var backWardsLocation = this.getLocationOfNthOccurence(string,character,occurences);
        var locationOfCharacter = null;
        if (backWardsLocation !== null) {
            locationOfCharacter = string.length - backWardsLocation;
        }
        return locationOfCharacter;
    }

    this.getBuddyCharacter = function(character) {
        var buddyCharacters =
        [
            ["[","]"],
            ["{","}"],
            ['"','"'],
            ["'","'"],
            ["`","`"],
            ["(",")"],
            ["<",">"]
        ];
        var buddy = "";
        for (var i=0;i<buddyCharacters.length;i++) {
            var pair = buddyCharacters[i];
            if (character == pair[0]) {
                buddy = pair[1];
                break;
            }
            else
            if (character == pair[1]) {
                buddy = pair[0];
                break;
            }
        }
        return buddy;
    }

    this.isLeftBuddyCharacter = function(character) {
        var leftBuddyCharacters = "[{" + '"' + "'" + "`(<"; 
        var leftBuddyCharacter = false;
        if (leftBuddyCharacters.indexOf(character) > -1) {
            leftBuddyCharacter = true;
        }
        return leftBuddyCharacter;
    }

    this.replaceCharacterUnderCursor = function(character) {
        this.deleteRangeRight(this.getCaratPosition(),this.getCaratPosition()+1);
        this.insertStringAtCarat(character);
        this.moveCaratLeft(1);
    }

    this.keyCodeIsNotAModifierKey = function(keyCode) {
        var isNotModifier = false;
        if(keyCode != 16 && keyCode != 91 && keyCode != 17 && keyCode != 18) {
            isNotModifier = true;
        }
        return isNotModifier;
    }

    this.getDistanceToStartOfNextWord = function() {
        var string = this.textArea.value.substr(this.getCaratPosition() + 1);
        var start = string.split(/[\s,\n]/g)[0].length+2;
        return start;
    }

    this.moveToStartOfNextWord = function() {
        var distance = this.getDistanceToStartOfNextWord();
        this.moveCaratRight(distance);
    }

    this.getDistanceToEndOfNextWord = function() {
        var end = this.getDistanceToStartOfNextWord()-2;
        if (this.getDistanceToStartOfNextWord() == 2) {
            this.right();
            end = this.getDistanceToEndOfNextWord();
        }
        return end;
    }

    this.moveToEndOfNextWord = function() {
        var distance = this.getDistanceToEndOfNextWord();
        this.moveCaratRight(distance);
    }

    this.handleAcceptMotion = function(character,e) {
        if (e.keyCode == 27) {
            this.acceptMotion = false;
            return;
        }
        if (this.isANumberKeyCode(e.keyCode)) {
            this.acceptMotionBuffer += character;
        }
        if (this.acceptMotionInitiator == "r") {
            if (this.acceptMotionBuffer == "") {
                this.acceptMotionBudder = "1";
            }
            // replace character (r[character])
            if (this.keyCodeIsNotAModifierKey(e.keyCode)) {
                this.replaceCharacterUnderCursor(this.keyCodeToCharacter(e.keyCode,e.shiftKey));
                this.saveState();
                this.acceptMotion = false;
            }
        }
        else
            if (this.acceptMotionInitiator == "d") {
                if (this.acceptMotionBuffer == "") {
                    this.acceptMotionBuffer = "1";
                }
                // delete until (dt[character])
                if (this.acceptMotionBuffer.indexOf("u") > -1 && this.keyCodeIsNotAModifierKey(e.keyCode)) {
                    var character = this.keyCodeToCharacter(e.keyCode,e.shiftKey);
                    var numberOfOccurences = parseInt(this.acceptMotionBuffer);
                    var deleted = this.deleteUntil(character,numberOfOccurences);
                    if (deleted) {
                        this.saveState();
                    }
                    this.acceptMotion = false;
                    return;
                }
                else
                    // delete fru(through) (df[character])
                    if (this.acceptMotionBuffer.indexOf("f") > -1 && this.keyCodeIsNotAModifierKey(e.keyCode)) {
                        var character = this.keyCodeToCharacter(e.keyCode,e.shiftKey);
                        var numberOfOccurences = parseInt(this.acceptMotionBuffer);
                        var deleted = this.deleteUntil(character,numberOfOccurences);
                        if (deleted) {
                            this.deleteRangeRight(this.getCaratPosition(),this.getCaratPosition()+1);
                            this.saveState();
                        }
                        this.acceptMotion = false;
                        return;
                    }
                    else
                        // delete inside (di[character]) 
                        if (this.acceptMotionBuffer.indexOf("i") > -1 && this.keyCodeIsNotAModifierKey(e.keyCode)) {
                            var character = this.keyCodeToCharacter(e.keyCode,e.shiftKey); 
                            var validCharacters = "[]{}" + '"' + "'" + "`()<>"; 
                            if (validCharacters.indexOf(character) > -1) {
                                var numberOfPairs = parseInt(this.acceptMotionBuffer);
                                var buddyCharacter = this.getBuddyCharacter(character);
                                var leftString = this.textArea.value.substr(0,this.getCaratPosition());
                                var rightString = this.textArea.value.substr(this.getCaratPosition());
                                var leftCharacter;
                                var rightCharacter;
                                if (this.isLeftBuddyCharacter(character)) {
                                    leftCharacter = character;
                                    rightCharacter = buddyCharacter;
                                } else {
                                    leftCharacter = buddyCharacter;
                                    rightCharacter = character;
                                }
                                var locationOfLeftCharacter = this.getLocationOfLastNthOccurence(leftString,leftCharacter,numberOfPairs);
                                var locationOfRightCharacter = this.getLocationOfNthOccurence(rightString,rightCharacter,numberOfPairs);
                                if (locationOfLeftCharacter !== null && locationOfRightCharacter !== null) {
                                    locationOfRightCharacter += this.getCaratPosition();
                                    this.moveCaratLeft(this.getCaratPosition()-locationOfLeftCharacter);
                                    this.deleteRangeRight(locationOfLeftCharacter,locationOfRightCharacter);
                                    this.saveState();
                                }
                            }
                            this.acceptMotion = false;
                            return;
                        }
                        else
                            // delete line (dd)
                            if (character == "d") {
                                var from = this.getCaratLine();
                                var to = this.getCaratLine() + parseInt(this.acceptMotionBuffer);
                                this.deleteLines(from,to);
                                this.acceptMotion = false;
                                this.saveState();
                            }
                            else
                                // delete down (dj)
                                if (character == "h") {
                                    var from = this.getCaratLine();
                                    var to = this.getCaratLine() + parseInt(this.acceptMotionBuffer) + 1;
                                    this.deleteLines(from,to);
                                    this.acceptMotion = false;
                                    this.saveState();
                                }
                                else
                                    // delete up (dk)
                                    if (character == "t") {
                                        var from = this.getCaratLine() - parseInt(this.acceptMotionBuffer);
                                        var to = this.getCaratLine() + 1;
                                        this.deleteLines(from,to);
                                        this.acceptMotion = false;
                                        this.saveState();
                                    }
                                    else
                                        // delete left (dh)
                                        if (character == "n") {
                                            var positionOnLine = this.getCaratPositionOnLine();
                                            var inputNumber = parseInt(this.acceptMotionBuffer);
                                            var deleteSize;
                                            if (inputNumber < positionOnLine) {
                                                deleteSize = inputNumber;
                                            } else {
                                                deleteSize = positionOnLine;
                                            }
                                            var from = this.getCaratPosition() - deleteSize;
                                            var to = this.getCaratPosition();
                                            this.deleteRangeLeft(from,to);
                                            this.acceptMotion = false;
                                            this.saveState();
                                        }
                // delete right (dl)
                                        else
                                            if (character == "s") {
                                                var positionOnLine = this.getCaratPositionOnLine();
                                                var lineSize = this.getLines()[this.getCaratLine()].length;
                                                var inputNumber = parseInt(this.acceptMotionBuffer);
                                                var deleteSize;
                                                if (inputNumber < (lineSize-positionOnLine)) {
                                                    deleteSize = inputNumber;
                                                } else {
                                                    deleteSize = lineSize - positionOnLine;
                                                }
                                                var from = this.getCaratPosition();
                                                var to = this.getCaratPosition() + deleteSize;
                                                this.deleteRangeRight(from,to);
                                                this.acceptMotion = false;
                                                this.saveState();
                                            }
                                            else
                                                // delete till (dt[character])
                                                if (character == "u" || character == "f" || character == "i" || character == "e") {
                                                    this.acceptMotionBuffer += character;
                                                }
            }
    }

    this.deleteRangeLeft = function(from,to) {
        var newCaratPosition = this.getCaratPosition() - (to-from);
        this.deleteRange(from,to);
        this.textArea.selectionStart = newCaratPosition;
        this.textArea.selectionEnd = newCaratPosition;
    }

    this.deleteRangeRight = function(from,to) {
        var newCaratPosition = this.getCaratPosition();
        this.deleteRange(from,to);
        this.textArea.selectionStart = newCaratPosition;
        this.textArea.selectionEnd = newCaratPosition;
    }

    this.deleteRange = function(from,to) {
        this.textArea.value = this.textArea.value.substring(0,from) + this.textArea.value.substr(to);
    }

    this.deleteLines = function(from,to) {
        this.goToStartOfLine();
        var position = this.getCaratPosition(); 
        var lines = this.getLines();
        this.copyBuffer = lines.splice(from,to-from);
        this.copyBuffer = this.copyBuffer.join("\n");
        this.copiedWholeLine = true;
        var joinedLines = lines.join("\n");
        this.textArea.value = joinedLines;
        this.textArea.selectionStart = position;
        this.textArea.selectionEnd = position;
    }

    this.isANumberKeyCode = function(keyCode) {
        var isNumber = false;
        if (keyCode >= 48 && keyCode <=57) {
            isNumber = true;
        }
        return isNumber;
    }

    this.normalKeyDown = function(e) {
        var keyCode = e.keyCode;
        var character = this.keyCodeToCharacter(keyCode);
        if (this.acceptMotion) {
            this.handleAcceptMotion(character,e);
            this.update();
            return;
        }
        switch(character)
        {
            case "0":
                this.goToStartOfLine();
                break;
            case "4":
                if (e.shiftKey) {
                    this.goToEndOfLine();
                }
                break;
            case "a":
                if (e.shiftKey) {
                    this.appendToEndOfLine();
                } else {
                    this.append();
                }
                break;
            case "d":
                this.setAcceptMotion(character);
                break;
            case "e":
                this.moveToEndOfNextWord();
                break;
            case "h":
                this.down();
                break;
            case "i":
                this.insert();
                break;
            case "n":
                this.left();
                break;
            case "o":
                if (e.shiftKey) {
                    this.insertLineAbove();
                } else {
                    this.insertLineBelow();
                }
                break;
            case "p":
                this.paste();
                this.saveState();
                break;
            case "r":
                if (e.ctrlKey) {
                    this.redo();
                } else {
                    this.setAcceptMotion(character);
                }
                break;
            case "s":
                this.right();
                break;
            case "t":
                this.up();
                break;
            case "u":
                this.undo();
                break;
            case "w":
                this.moveToStartOfNextWord();
                break;
            default:
                console.log(character);
        }
        console.log(keyCode + "," + character);
        this.update();
    }

    this.setAcceptMotion = function(character) {
        this.acceptMotionInitiator = character;
        this.acceptMotion = true;
        this.acceptMotionBuffer = "";
    }

    this.paste = function() {
        var linesToGoUp = 0;
        if (this.copiedWholeLine) {
            this.insertLineBelow();
            this.setNormalMode();
            var linesToGoUp = this.countAppearances(this.copyBuffer,/\n/gi);
        }
        this.insertStringAtCarat(this.copyBuffer);
        this.goToStartOfLine();
        this.goUp(linesToGoUp);
    }

    this.goUp = function(lines) {
        for (var i=0;i<lines;i++) {
            this.up();
        }
    }

    this.countAppearances = function(string,regex) {
        var appearances = 0;
        var matches = string.match(regex);
        if (matches == null) {
            appearances = 0;
        } else {
            appearances = matches.length; 
        }
        return appearances;
    }

    this.insertStringAtCarat = function(string) {
        var position = this.getCaratPosition();
        this.textArea.value = this.textArea.value.substring(0,position) + string + this.textArea.value.substring(position,this.textArea.value.length);
        position += string.length;
        this.textArea.selectionStart = position;
        this.textArea.selectionEnd = position;
    }

    this.insertLineBelow = function() {
        this.appendToEndOfLine();
        this.insertStringAtCarat("\n");
    }

    this.insertLineAbove = function() {
        this.goToStartOfLine();
        this.insert();
        this.insertStringAtCarat("\n");
        this.up();
    }

    this.goToStartOfLine = function() {
        this.moveCaratLeft(this.getCaratPositionOnLine());
    }

    this.goToEndOfLine = function() {
        this.moveCaratRight(this.getDistanceToEndOfLine());
    }

    this.appendToEndOfLine = function() {
        this.goToEndOfLine();
        this.append();
    }

    this.getDistanceToEndOfLine = function() {
        var distance;
        if (this.getLines()[this.getCaratLine()].length == 0) {
            distance = 0;
        } else {
            distance = this.getLines()[this.getCaratLine()].length-this.getCaratPositionOnLine() - 1;
        }
        return distance;
    }

    this.insert = function() {
        this.setInsertMode();
    }

    this.append = function() {
        if (this.getLines()[this.getCaratLine()].length > 0) {
            this.right();
        }
        this.setInsertMode();
    }

    this.getCaratPosition = function() {
        var caratPosition = this.textArea.selectionStart;
        return caratPosition;
    }

    this.getLines = function() {
        var lines = this.textArea.value.split("\n");
        return lines;
    }
    
    this.getTotalCharacters = function() {
        var characters = this.textArea.value.length;
        return characters;
    }

    this.getCumulativeLines = function() {
        var lines = this.getLines();
        for (var i=0;i<lines.length;i++) {
            lines[i] += " ";
        }
        for (var i=1;i<lines.length;i++) {
            lines[i] = lines[i-1]+lines[i];
        }
        return lines;
    }

    this.getCaratLine = function() {
        var lines = this.getLines();
        var position = this.getCaratPosition();
        var checkPosition = 0;
        var caratLine = 0;
        for (var i=0;i<lines.length;i++) {
            var line = lines[i];
            checkPosition += line.length + 1;
            if (position < checkPosition) {
                caratLine = i;
                break;
            }
        }
        return caratLine;
    }

    this.getCaratPositionOnLine = function() {
        var caratLine = this.getCaratLine();
        if (caratLine == 0) {
            var position = this.getCaratPosition();
        } else {
            var position = this.getCaratPosition()-this.getCumulativeLines()[caratLine-1].length;
        }
        return position;
    }

    this.up = function() {
        var caratLine = this.getCaratLine();
        if (caratLine != 0) {
            var lines = this.getLines();
            if (lines.length > 1) {
                var positionOnLine = this.getCaratPositionOnLine();
                var lengthOfAboveLine = this.getLines()[caratLine-1].length;
                var newPositionOnLine = 0;
                if (lengthOfAboveLine < positionOnLine) {
                    newPositionOnLine = lengthOfAboveLine;
                } else {
                    newPositionOnLine = positionOnLine;
                }
                var moveBackLength = positionOnLine + 1 + (lengthOfAboveLine-newPositionOnLine);
                this.moveCaratLeft(moveBackLength);
            }
        }
    }

    this.down = function() {
        var caratLine = this.getCaratLine();
        var lines = this.getLines();
        if (lines.length > 1) {
            if (caratLine < lines.length-1) {
                var positionOnLine = this.getCaratPositionOnLine();
                var lengthOfBelowLine = this.getLines()[caratLine+1].length;
                var newPositionOnLine = 0;
                if (lengthOfBelowLine < positionOnLine) {
                    newPositionOnLine = lengthOfBelowLine;
                } else {
                    newPositionOnLine = positionOnLine;
                }
                var moveForwardLength = this.getLines()[caratLine].length-positionOnLine + 1 + newPositionOnLine;
                this.moveCaratRight(moveForwardLength); 
            }
        }
    }

    this.left = function() {
        this.textArea.selectionStart--;
        this.textArea.selectionEnd--;
    }

    this.right = function() {
        this.textArea.selectionEnd++;
        this.textArea.selectionStart++;
    }

    this.moveCaratLeft = function(spaces) {
        for(var i=0;i<spaces;i++) {
            this.left();
        }
    }

    this.moveCaratRight = function(spaces) {
        for(var i=0;i<spaces;i++) {
            this.right();
        }
    }

    this.sendKeyPress = function(element,keyCode) {
        var eventObject = document.createEvent("Events");
        eventObject.initEvent("keydown",true,true);
        eventObject.which = keyCode;
        element.dispatchEvent(eventObject);
    }

    this.setElementEventListeners = function() {
        var vimtext = this;
        this.element.addEventListener('focus',function(event) {
            vimtext.textArea.focus();
        });
    }

    this.keyDown = function(e) {
        if (this.keyCodeToCharacter(e.keyCode) == "<TAB>") {
            this.insertStringAtCarat("    ");
        }
        this.update();
    }

    this.update = function() {
        this.element.innerHTML = this.getInnerHtml(this.textArea.value,this.textArea.selectionStart);
    }

    this.getInnerHtml = function(value,caratPosition) {
        var html = this.addCarat(value,caratPosition);
        html = this.fixBreaklines(html);
        return html;
    }

    this.fixBreaklines = function(html) {
        var html = html.replace(/\n/gi,"<br />");
        return html;
    }

    this.addCarat = function(string,caratPosition) {
        var beforeCarat = string.substring(0,caratPosition);
        var carat = this.getCaratHtml(string,caratPosition);
        var afterCarat = string.substr(caratPosition);
        var stringWithCarat = beforeCarat + carat + afterCarat;
        return stringWithCarat;
    }

    this.getCaratHtml = function(string,caratPosition) {

        var styleString = "";
        if (this.insertMode) {
            styleString += "font-weight: bold;font-size: 17px;color: #eee59a;margin: -4px;position:absolute;margin-top: -1px;";
        } else if (this.normalMode) {
            styleString += "color: #778176;background-color: #eee59a;position:absolute;margin-top: 0px;margin-left:0px;height:17px;width:10px;";
        } 

        var caratHtml = "<span id='vimtextcarat' style='" + styleString + "'>" + this.getCaratCharacter(string,caratPosition) + "</span>";
        return caratHtml;
    }

    this.getCaratCharacter = function(string,caratPosition) {
        if (this.insertMode) {
            return "|";
        } else if (this.normalMode) {
            return string.charAt(caratPosition);
        }
    }

    this.init = function() {
        this.setTextAreaEventListeners();
        this.setElementEventListeners();
        this.setDocumentEventListeners();
        this.update();
        this.saveState();
    }

    this.setNormalMode = function() {
        if (this.getLines()[this.getCaratLine()].length > 0) {
            this.left();
        }
        this.insertMode = false;
        this.normalMode = true;
    }

    this.setInsertMode = function() {
        this.insertMode = true;
        this.normalMode = false;
    }

    this.setDocumentEventListeners = function() {
        var vimtext = this;
        document.addEventListener('keyup',function(e) {
            if (e.keyCode == 27) {
                if (vimtext.insertMode) {
                    vimtext.setNormalMode();
                }
                vimtext.element.focus();
                vimtext.update();
                vimtext.saveState();
            }
        });
    }

    this.init();
}

init();
