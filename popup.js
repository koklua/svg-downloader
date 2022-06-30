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

//window enables and disables footer buttons based on how many items are currently selected
window.addEventListener('selectedChange', onSelectedChange);

listAllSVGElements();

async function listAllSVGElements() {
    let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
    let response = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
            return Array.from(document.body.getElementsByTagName('svg')).map(x => x.outerHTML);
        },
    });

    itemCounter.total = response[0].result.length;
    let list = document.getElementById('svgList');
    for (const item of response[0].result) {
        //generate a list element for each svg found
        let li = document.createElement('li');
        li.id = getRandomSvgName();

        //store formatted svg in dictionary for "download selected"
        var formattedSVG = formatSVGElement(item);
        svgDictionary[li.id] = formattedSVG;

        //generate data uri for svg image 
        var dataUri = generateSVGDataUri(formattedSVG);

        //add checkbox
        let checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        li.appendChild(checkbox);
        checkbox.addEventListener('input', onCheckboxInput);

        //add svg display
        let svgContainer = document.createElement('div');
        li.appendChild(svgContainer);
        svgContainer.classList.add('svg-container');
        svgContainer.classList.add('svg-light-background');
        let svgPreview = document.createElement('div');
        svgPreview.classList.add('svg-preview');
        svgPreview.style.backgroundImage = 'url("' + dataUri + '")';
        svgContainer.appendChild(svgPreview);

        //TO DO: get dimension info from the svg

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
        widthInput.type = 'text';
        widthContainer.appendChild(widthInput);

        let heightContainer = document.createElement('div');
        dimensionsContainer.appendChild(heightContainer);
        let heightLabel = document.createElement('span');
        heightLabel.innerHTML = 'Height:';
        heightContainer.appendChild(heightLabel);
        let heightInput = document.createElement('input');
        heightInput.type = 'text';
        heightContainer.appendChild(heightInput);

        //add aspect ratio lock
        let lockButton = document.createElement('button');
        lockButton.classList.add('lock-button');
        lockButton.title = 'Maintain aspect ratio';
        dimensionsContainer.appendChild(lockButton);

        //add download button
        var downloadButton = document.createElement("a");
        downloadButton.id = li.id + '-download';
        downloadButton.href = dataUri;
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

function formatSVGElement(element) {
    var source = element;
    //add name spaces.
    if(!source.match(/^<svg[^>]+xmlns="http\:\/\/www\.w3\.org\/2000\/svg"/)){
        source = source.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
    }
    if(!source.match(/^<svg[^>]+"http\:\/\/www\.w3\.org\/1999\/xlink"/)){
        source = source.replace(/^<svg/, '<svg xmlns:xlink="http://www.w3.org/1999/xlink"');
    }

    //add xml declaration
    return '<?xml version="1.0" standalone="no"?>\r\n' + source;
}

function generateSVGDataUri(source) {
    //convert svg source to URI data scheme.
    return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(source);
}

const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
const nameLength = 10;

function getRandomSvgName() {
    let result = '';
    const charactersLength = characters.length;
    for ( let i = 0; i < nameLength; i++ ) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}

function updateSvgName(event) {
    var svgId = event.target.id.split('-')[0];
    var downloadLink = document.getElementById(svgId + '-download');
    downloadLink.download = event.target.value + '.svg';
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
            let fileName = listItem.children.namedItem(listItem.id + '-download').download;
            let content = new Blob([svgDictionary[listItem.id]], {type : 'image/svg+xml'});
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