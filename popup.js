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
        li.innerHTML = item;
        let button = document.createElement('button')
        button.innerHTML = "Download"
        li.appendChild(button)
        list.append(li);
        button.addEventListener("click", handleButtonClick);
    };
}

function handleButtonClick(event) {
    
    let svgElements = Array.from(event.target.parentElement.getElementsByTagName('svg'))
    
    if (svgElements.length > 0) {
        let svgElement = svgElements[0]

        // download svg
        var serializer = new XMLSerializer();
        var source = serializer.serializeToString(svgElement);

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

        var downloadLink = document.createElement("a");
        downloadLink.href = url;
        downloadLink.download = "image.svg";
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
    } else {
        // TODO: Error message
    }
}

