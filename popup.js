listAllSVGElements();

async function listAllSVGElements() {
    let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
    let response = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
            return Array.from(document.body.getElementsByTagName('svg')).map(x => x.outerHTML);
        },
    });

    let list = document.getElementById('svgList');
    for (const item of response[0].result) {
        let li = document.createElement('li');

        //add checkbox
        let checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        li.appendChild(checkbox);

        //add svg display
        let svgItem = document.createElement('svg');
        li.appendChild(svgItem);
        svgItem.outerHTML = item;

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
        nameInput.value = getRandomSvgName();
        nameContainer.appendChild(nameInput);
        
        //add dimensions
        let dimensionsContainer = document.createElement('div');
        dimensionsContainer.classList.add('dimensions-container');
        infoContainer.appendChild(dimensionsContainer);

        let heightContainer = document.createElement('div');
        dimensionsContainer.appendChild(heightContainer);
        let heightLabel = document.createElement('span');
        heightLabel.innerHTML = 'Height:';
        heightContainer.appendChild(heightLabel);
        let heightInput = document.createElement('input');
        heightInput.type = 'text';
        heightContainer.appendChild(heightInput);

        let widthContainer = document.createElement('div');
        dimensionsContainer.appendChild(widthContainer);
        let widthLabel = document.createElement('span');
        widthLabel.innerHTML = 'Width:';
        widthContainer.appendChild(widthLabel);
        let widthInput = document.createElement('input');
        widthInput.type = 'text';
        widthContainer.appendChild(widthInput);

        //add download button
        var downloadLink = generateDownloadLink(nameInput.value, item);
        let downloadButton = document.createElement('button');
        downloadButton.classList.add('download-button');
        downloadButton.title = 'Download';
        li.appendChild(downloadButton);
        downloadButton.appendChild(downloadLink);
        downloadButton.addEventListener("click", handleClick);

        //add code copy button
        let copyButton = document.createElement('button');
        copyButton.classList.add('copy-button');
        copyButton.title = 'Copy SVG as code'
        li.appendChild(copyButton);

        list.append(li);
    };
}

function generateDownloadLink(filename, item) {
    var source = item
    
    //add name spaces.
    if(!source.match(/^<svg[^>]+xmlns="http\:\/\/www\.w3\.org\/2000\/svg"/)){
        source = source.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
    }
    if(!source.match(/^<svg[^>]+"http\:\/\/www\.w3\.org\/1999\/xlink"/)){
        source = source.replace(/^<svg/, '<svg xmlns:xlink="http://www.w3.org/1999/xlink"');
    }

    //add xml declaration
    source = '<?xml version="1.0" standalone="no"?>\r\n' + source;

    //convert svg source to URI data scheme.
    var url = "data:image/svg+xml;charset=utf-8,"+encodeURIComponent(source);

    //set url value to a element's href attribute.
    var downloadLink = document.createElement("a");
    downloadLink.href = url;
    downloadLink.download = filename + '.svg';
    return downloadLink;
}

function handleClick(event) {
    let linkElements = Array.from(event.target.parentElement.getElementsByTagName('a'));
    
    if (linkElements.length > 0) {
        let downloadLink = linkElements[0]
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
    }
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
