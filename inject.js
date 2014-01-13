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
    var width = textArea.width;
    if (width == "" || width === undefined) {
        width = "500px";
    }
}

function getTextAreaHeight(textArea) {
    var height= textArea.height;
    if (height == "" || height === undefined) {
        height = "100px";
    }
}

function VimtextArea(textArea) {

    this.insertMode = true;
    this.normalMode = false;

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
    this.element.style.whiteSpace = "pre";
    this.element.setAttribute("tabindex",0);

    this.replaceTextArea = function() {
        this.textArea.parentNode.insertBefore(this.element,textArea.nextSibling);
    }

    this.setTextAreaEventListeners = function() {
        var vimtext = this;

        this.textArea.addEventListener('keydown',function(event) {
            // fucking javascript http://stackoverflow.com/questions/14841739/javascript-keypress-event-get-end-value-of-textarea
            console.log('keydown');
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
            console.log("keypress");
        });

        this.textArea.addEventListener('keyup',function(event) {
            console.log("keyup");
        });

        this.textArea.addEventListener('focus',function(event) {
            vimtext.element.style.borderColor = '#b5e7b4';
        });

        this.textArea.addEventListener('blur',function(event) {
            vimtext.element.style.borderColor = 'grey';
        });
    }

    this.normalKeyDown = function(e) {
        var keyCode = e.keyCode;
        var character = String.fromCharCode(keyCode).toLowerCase();
        switch(character)
        {
            case "i":
                this.textArea.selectionStart--;
                this.textArea.selectionEnd--;
                this.setInsertMode();
                break;
            case "a":
                this.setInsertMode();
            default:
                console.log(character);
        }
        this.update();
    }

    this.setElementEventListeners = function() {
        var vimtext = this;
        this.element.addEventListener('focus',function(event) {
            vimtext.textArea.focus();
        });
    }

    this.keyDown = function(e) {
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
            styleString += "color: #778176;background-color: #eee59a;position:absolute;margin-top: 0px;margin-left:-10px;height:17px;width:10px;";
        } 

        var caratHtml = "<span id='vimtextcarat' style='" + styleString + "'>" + this.getCaratCharacter(string,caratPosition) + "</span>";
        return caratHtml;
    }

    this.getCaratCharacter = function(string,caratPosition) {
        if (this.insertMode) {
            return "|";
        } else if (this.normalMode) {
            return string.charAt(caratPosition-1);
        }
    }

    this.init = function() {
        this.setTextAreaEventListeners();
        this.setElementEventListeners();
        this.setDocumentEventListeners();
        this.update();
    }

    this.setNormalMode = function() {
        this.insertMode = false;
        this.normalMode = true;
        this.textArea.readOnly = true;
    }

    this.setInsertMode = function() {
        this.insertMode = true;
        this.normalMode = false;
        this.textArea.readOnly = false;
    }

    this.setDocumentEventListeners = function() {
        var vimtext = this;
        document.addEventListener('keyup',function(e) {
            if (e.keyCode == 27) {
                vimtext.setNormalMode();
                vimtext.element.focus();
                vimtext.update();
            }
        });
    }

    this.init();
}

init();
