//constants for random svg name generation
const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
const nameLength = 10;

//object keeps track of how many list items are selected, dispatches event on count change
var itemCounter = {
    total: 0,
    _selected: 0,
    set selected(value) {
        this._selected = value;
        window.dispatchEvent(new CustomEvent('selectedChange'));
    },
    get selected() { 
        return this._selected;
    }
};

var svgDictionary = {};

//svgItem class to better handle editing
class svgItem {
    id = "";
    formattedSVG = "";
    preserveAspectRatio = true;
    viewBox = undefined;
    _width = undefined;
    _height = undefined;
    initialAspectRatio = 1;
    constructor(svgHtml) {
        //generate random name
        const charactersLength = characters.length;
        for ( let i = 0; i < nameLength; i++ ) {
            this.id += characters.charAt(Math.floor(Math.random() * charactersLength));
        }

        var source = svgHtml;
        //add name spaces.
        if(!source.match(/^<svg[^>]+xmlns="http\:\/\/www\.w3\.org\/2000\/svg"/)){
            source = source.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
        }
        if(!source.match(/^<svg[^>]+"http\:\/\/www\.w3\.org\/1999\/xlink"/)){
            source = source.replace(/^<svg/, '<svg xmlns:xlink="http://www.w3.org/1999/xlink"');
        }

        //fill missing dimension attributes using the ones present
        var matchViewBox = source.match(/viewBox\s*=\s*\"?([^\"]+)\"?/);
        if(matchViewBox){
            this.viewBox = matchViewBox[1];
        }
        var matchWidth = source.match(/width\s*=\s*\"?(\d+)\"?/);
        if(matchWidth){
            this._width = matchWidth[1];
        }
        var matchHeight = source.match(/height\s*=\s*\"?(\d+)\"?/);
        if(matchWidth){
            this._height = matchHeight[1];
        }

        if (this.viewBox == undefined){
            if (this.width != undefined && this.height != undefined){
                //case #1: only has width & height => insert viewBox
                source = source.replace(/>/, ` viewBox="0 0 ${this.width} ${this.height}">`);
            }
            else{
                //case #2: has nothing => leave empty until user input OR disable?
            }
        }
        else {
            if (this.width == undefined && this.height == undefined){
                //case #3: only has viewBox => insert width + height
                let viewBoxList = this.viewBox.split(' ');
                this._width = viewBoxList[2];
                this._height = viewBoxList[3];
                source = source.replace(/>/, ` width="${this.width}" height="${this.height}">`);
            }
        }

        //preserve initial aspect ratio in case either dimension is made 0 through input
        this.initialAspectRatio = this.width / this.height;

        //add xml declaration
        this.formattedSVG = '<?xml version="1.0" standalone="no"?>\r\n' + source;
    }

    get dataUri() {
        //convert svg source to URI data scheme.
        return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(this.formattedSVG);
    }

    get weightedColor() {
        return weightedColor(this.formattedSVG);
    }

    get aspectRatio(){
        if (this.preserveAspectRatio || this.width === NaN || this.height === NaN || this.width === 0 || this.height == 0){
            return this.initialAspectRatio;
        }
        else{
            return this.width / this.height;
        }
    }

    set width(value) {
        if (this._width != value){
            this._width = value;
            if (this.preserveAspectRatio){
                this._height = this._width / this.aspectRatio;
            }
            this.updateFormattedSVG();
        }
    }
    get width() { 
        return this._width;
    }

    set height(value) {
        if (this._height != value) {
            this._height = value;
            if (this.preserveAspectRatio){
                this._width = this._height * this.aspectRatio;
            }
            this.updateFormattedSVG();
        }
    }
    get height() { 
        return this._height;
    }

    updateFormattedSVG(){
        //TODO update dimensions and preserveAspectRatio
        
        const event = new CustomEvent('svgUpdate', { detail: this.id });
        window.dispatchEvent(event);
    }
  };

//window enables and disables footer buttons based on how many items are currently selected
window.addEventListener('selectedChange', onSelectedChange);

//window updates individual download button uri's on svg updates
window.addEventListener('svgUpdate', onSVGUpdated);

listAllSVGElements();

async function listAllSVGElements() {
    let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
    let response = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
            return Array.from(document.body.getElementsByTagName('svg')).map(x => x.outerHTML);
        },
    });

    //no svgs found
    if (response[0].result === null)
        return;

    itemCounter.total = response[0].result.length;
    let list = document.getElementById('svgList');
    for (const item of response[0].result) {
        //generate svg object
        let svgObj = new svgItem(item)

        //store svg object in dictionary for "download selected" and dimension editing
        svgDictionary[svgObj.id] = svgObj;

        //generate a list element
        let li = document.createElement('li');
        li.id = svgObj.id;

        //add checkbox
        let checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        li.appendChild(checkbox);
        checkbox.addEventListener('input', onCheckboxInput);

        //add svg display
        let svgContainer = document.createElement('div');
        li.appendChild(svgContainer);
        svgContainer.classList.add('svg-container');
        if (svgDictionary[li.id].weightedColor == Color.dark) {
            svgContainer.classList.add('svg-light-background');
        } else {
            svgContainer.classList.add('svg-dark-background');
        }
        let svgPreview = document.createElement('div');
        svgPreview.classList.add('svg-preview');
        svgPreview.style.backgroundImage = 'url("' + svgDictionary[li.id].dataUri + '")';
        svgContainer.appendChild(svgPreview);

        let infoContainer = document.createElement('div');
        infoContainer.classList.add('info-container');
        li.appendChild(infoContainer);

        //add name display
        let nameContainer = document.createElement('div');
        nameContainer.classList.add('name-container');
        infoContainer.appendChild(nameContainer);

        let nameLabel = document.createElement('span');
        nameLabel.innerHTML = 'Name:';
        nameContainer.appendChild(nameLabel);
        let nameInput = document.createElement('input');
        nameInput.type = 'text';
        nameInput.id = li.id + '-name';
        nameInput.value = li.id;
        nameContainer.appendChild(nameInput);

        //update file name on name input change (only fired on focus lost)
        nameInput.addEventListener('change', updateSvgName);
        
        //add dimensions
        let dimensionsContainer = document.createElement('div');
        dimensionsContainer.classList.add('dimensions-container');
        infoContainer.appendChild(dimensionsContainer);

        let widthContainer = document.createElement('div');
        dimensionsContainer.appendChild(widthContainer);
        let widthLabel = document.createElement('span');
        widthLabel.innerHTML = 'Width:';
        widthContainer.appendChild(widthLabel);
        let widthInput = document.createElement('input');
        widthInput.id = li.id + '-width';
        widthInput.type = 'number';
        widthInput.step = 0.01;
        widthInput.value = svgDictionary[li.id].width;
        widthInput.addEventListener('input', svgDimensionsChanged);
        widthContainer.appendChild(widthInput);

        let heightContainer = document.createElement('div');
        dimensionsContainer.appendChild(heightContainer);
        let heightLabel = document.createElement('span');
        heightLabel.innerHTML = 'Height:';
        heightContainer.appendChild(heightLabel);
        let heightInput = document.createElement('input');
        heightInput.id = li.id + '-height';
        heightInput.type = 'number';
        heightInput.step = 0.01;
        heightInput.value = svgDictionary[li.id].height;
        heightInput.addEventListener('input', svgDimensionsChanged);
        heightContainer.appendChild(heightInput);

        let lockButton = document.createElement('button');
        lockButton.id = li.id + '-lock';
        lockButton.classList.add('unlock-button');
        lockButton.title = 'Maintain aspect ratio';
        lockButton.addEventListener('click', toggleAspectRatio);
        dimensionsContainer.appendChild(lockButton);


        //add download button
        var downloadButton = document.createElement("a");
        downloadButton.id = li.id + '-download';
        downloadButton.href = svgDictionary[li.id].dataUri; 
        downloadButton.download = li.id + '.svg';
        downloadButton.classList.add('list-button');
        downloadButton.classList.add('download-button');
        downloadButton.title = 'Download';
        li.appendChild(downloadButton);
        
        //add code copy button
        let copyButton = document.createElement('button');
        copyButton.classList.add('list-button');
        copyButton.classList.add('copy-button');
        copyButton.title = 'Copy SVG as code'
        li.appendChild(copyButton);

        list.append(li);
    };

    //add functions to footer buttons
    let selectAllButton = document.getElementById('selectAll');
    selectAllButton.addEventListener('click', selectAll);

    let downloadSelectedButton = document.getElementById('downloadSelected');
    downloadSelectedButton.addEventListener('click', downloadSelected);
}

function updateSvgName(event) {
    var svgId = event.target.id.split('-')[0];
    var downloadButton = document.getElementById(svgId + '-download');
    downloadButton.download = event.target.value + '.svg';
}

function svgDimensionsChanged(event) {
    var id = event.target.id.split('-')[0];
    var dimension = event.target.id.split('-')[1];
    var value = Number(event.target.value);
    updateSvgDimensions(id, dimension, value);
}

function updateSvgDimensions(id, changedDimension, value){
    if (changedDimension == 'width'){
        svgDictionary[id].width = value;
        if (svgDictionary[id].preserveAspectRatio) {
            var heightInput = document.getElementById(id + '-height');
            heightInput.value = svgDictionary[id].height;
        }
    }
    else if (changedDimension == 'height'){
        svgDictionary[id].height = value;
        if (svgDictionary[id].preserveAspectRatio) {
            var widthInput = document.getElementById(id + '-width');
            widthInput.value = svgDictionary[id].width;
        }
    }
}

function onCheckboxInput(event) {
    if (event.target.checked) {
        event.target.parentElement.classList.add('list-selected');
        itemCounter.selected += 1;
    }
    else {
        event.target.parentElement.classList.remove('list-selected');
        itemCounter.selected -= 1;
    }
}

function toggleAspectRatio(event) {
    var id = event.target.id.split('-')[0];
    if (svgDictionary[id].preserveAspectRatio){
        svgDictionary[id].preserveAspectRatio = false;
        event.target.classList.remove('unlock-button');
        event.target.classList.add('lock-button');
    }
    else {
        svgDictionary[id].preserveAspectRatio = true;
        event.target.classList.remove('lock-button');
        event.target.classList.add('unlock-button');
        updateSvgDimensions(id, 'width', svgDictionary[id].width)
    }
}

function selectAll() {
    let list = document.getElementById('svgList');
    for (let i = 0; i < list.children.length; i++) {
        if (list.children[i].firstChild.checked === false) {
            list.children[i].classList.add('list-selected');
            list.children[i].firstChild.checked = true;
        }
    }
    itemCounter.selected = itemCounter.total;
}

function onSVGUpdated(event){
    var downloadButton = document.getElementById(event.detail + '-download');
    downloadButton.href = svgDictionary[event.detail].dataUri; 
}

function onSelectedChange() {
    let downloadButton = document.getElementById('downloadSelected');
    if (itemCounter.selected == 0) {
        downloadButton.setAttribute('disabled', true);
    }
    else {
        downloadButton.removeAttribute('disabled');
    }

    let selectButton = document.getElementById('selectAll');
    if (itemCounter.selected == itemCounter.total) {
        selectButton.setAttribute('disabled', true);
    }
    else {
        selectButton.removeAttribute('disabled');
    }
}

function downloadSelected () {
    var zip = new JSZip();

    let list = document.getElementById('svgList');
    for (let i = 0; i < list.children.length; i++) {
        let listItem = list.children[i];
        if (listItem.firstChild.checked){
            svgDictionary[listItem.id].updateFormattedSVG();
            let fileName = listItem.children.namedItem(listItem.id + '-download').download;
            let content = new Blob([svgDictionary[listItem.id].formattedSVG], {type : 'image/svg+xml'});
            zip.file(fileName, content);
        }
    }

    zip.generateAsync({
        type: "blob",
        compression: "STORE"
    }).then(function (blob) {
        saveAs(blob, "svg_download.zip");
    });
    
}