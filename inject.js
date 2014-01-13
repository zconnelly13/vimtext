function init() {
    var textAreas = document.getElementsByTagName('textarea');
    var testArea = textAreas[2];
    replaceTextAreaWithVimtextArea(testArea);
}

function replaceTextAreaWithVimtextArea(textArea) {
    hideTextArea(textArea);
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
    this.textArea = textArea;
    this.width = getTextAreaWidth(textArea);
    this.height = getTextAreaHeight(textArea);

    this.element = document.createElement('div');
    this.element.style.width = "500px";
    this.element.style.height = "100px";
    this.element.style.backgroundColor = 'black';
    this.element.style.color = '#19ff00';
    this.element.id = "vimtextarea";
    this.element.style.padding = "2px 2px 2px 2px";
    this.element.style.border = "1px 1px 1px 1px";
    this.element.style.borderStyle = "solid";
    this.element.style.borderColor = "grey";
    this.element.setAttribute("tabindex",0);

    this.replaceTextArea = function() {
        this.textArea.parentNode.insertBefore(this.element,textArea.nextSibling);
    }

    this.setTextAreaEventListeners = function() {
        var vimtext = this;

        this.textArea.addEventListener('keydown',function(event) {
            // fucking javascript http://stackoverflow.com/questions/14841739/javascript-keypress-event-get-end-value-of-textarea
            setTimeout(function(event) {
                vimtext.keyDown(event);
            },0);
        });

        this.textArea.addEventListener('focus',function(event) {
            vimtext.element.style.borderColor = 'blue';
        });

        this.textArea.addEventListener('blur',function(event) {
            vimtext.element.style.borderColor = 'grey';
        });
    }

    this.setElementEventListeners = function() {
        var vimtext = this;
        this.element.addEventListener('focus',function(event) {
            vimtext.textArea.focus();
        });
    }

    this.keyDown = function() {
        this.element.innerText = this.textArea.value;
    }

    this.init = function() {
        this.setTextAreaEventListeners();
        this.setElementEventListeners();
    }

    this.init();
}

init();
