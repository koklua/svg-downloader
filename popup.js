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
        checkbox.classList.add('checkbox');
        li.appendChild(checkbox);

        //add svg display
        let svgItem = document.createElement('svg');
        li.appendChild(svgItem);
        svgItem.outerHTML = item;

        //add name display
        let nameLabel = document.createElement('div');
        nameLabel.innerHTML = 'Name:';
        li.appendChild(nameLabel);
        let nameInput = document.createElement('input');
        nameInput.type = 'text';
        nameInput.classList.add('name-input')
        li.appendChild(nameInput);
        
        //add dimensions
        let heightLabel = document.createElement('div');
        heightLabel.innerHTML = 'Height:';
        li.appendChild(heightLabel);
        let heightInput = document.createElement('input');
        heightInput.type = 'text';
        heightInput.classList.add('dimension-input');
        li.appendChild(heightInput);

        let widthLabel = document.createElement('div');
        widthLabel.innerHTML = 'Width:';
        li.appendChild(widthLabel);
        let widthInput = document.createElement('input');
        widthInput.type = 'text';
        widthInput.classList.add('dimension-input');
        li.appendChild(widthInput);

        //add download button
        var downloadLink = generateDownloadLink(item);
        let downloadButton = document.createElement('button');
        downloadButton.classList.add('download-button');
        downloadButton.innerHTML = "Download";
        li.appendChild(downloadButton);
        downloadButton.appendChild(downloadLink);
        downloadButton.addEventListener("click", handleClick);

        //add code copy button
        let copyButton = document.createElement('button');
        copyButton.classList.add('copy-button');
        li.appendChild(copyButton);

        list.append(li);
    };
}

function generateDownloadLink(item) {
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
    downloadLink.download = getRandomSvgName();
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
    return result + ".svg";
}
